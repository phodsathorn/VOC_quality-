"""
test_api_operational.py
------------------------
Phase 4: Operational Readiness & Telemetry Hardening Tests
- Security Headers Verification (CSP, HSTS, X-Content-Type-Options, etc.)
- X-Response-Time Performance Header
- Operational Metrics Endpoint (/api/metrics)
- Prometheus Scrape Endpoint (/metrics)
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["ENVIRONMENT"] = "development"

from main import app
from tests.asgi_client import ASGIClient


class TestApiOperational(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = ASGIClient(app)

    async def test_01_security_headers_enforcement(self):
        """
        Verify that all mandatory security headers are attached to responses:
        - X-Content-Type-Options: nosniff
        - X-Frame-Options: DENY
        - Strict-Transport-Security
        - Referrer-Policy
        - Permissions-Policy
        - X-Response-Time (latency tracking)
        """
        res = await self.client.get("/")
        self.assertEqual(res.status, 200)

        headers = res.headers
        self.assertEqual(headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(headers.get("x-frame-options"), "DENY")
        self.assertIn("max-age=31536000", headers.get("strict-transport-security", ""))
        self.assertEqual(headers.get("referrer-policy"), "strict-origin-when-cross-origin")
        self.assertIn("camera=()", headers.get("permissions-policy", ""))
        self.assertIn("ms", headers.get("x-response-time", ""))

    async def test_02_json_metrics_endpoint(self):
        """
        Verify that /api/metrics exposes system telemetry:
        - Uptime seconds
        - Memory RSS (MB)
        - HTTP request counters & average latency
        - Database pool status
        - Active alerts count
        """
        res = await self.client.get("/api/metrics")
        self.assertEqual(res.status, 200)
        data = res.json

        self.assertEqual(data.get("status"), "HEALTHY")
        self.assertEqual(data.get("service"), "voc-backend-api")
        self.assertEqual(data.get("version"), "1.4.0")
        self.assertGreaterEqual(data.get("uptime_seconds", 0), 0)
        self.assertIn("memory_rss_mb", data)

        http_stats = data.get("http_requests", {})
        self.assertIn("total", http_stats)
        self.assertIn("avg_latency_ms", http_stats)

        db_stats = data.get("database", {})
        self.assertIn("status", db_stats)
        self.assertIn("active_alerts_count", data)

    async def test_03_prometheus_metrics_endpoint(self):
        """
        Verify that /metrics outputs standard Prometheus exposition format.
        """
        res = await self.client.get("/metrics")
        self.assertEqual(res.status, 200)
        body = res.text

        self.assertIn("# HELP voc_uptime_seconds", body)
        self.assertIn("# TYPE voc_uptime_seconds gauge", body)
        self.assertIn("voc_uptime_seconds", body)
        self.assertIn("voc_http_requests_total", body)
        self.assertIn("voc_active_alerts", body)

    async def test_04_kiosk_emergency_alert(self):
        """
        Verify that POST /api/alerts triggers an onsite emergency alert from Kiosk
        when provided with a valid Kiosk Emergency PIN, returning HTTP 200.
        """
        res = await self.client.post(
            "/api/alerts",
            json_body={
                "box_id": "BOX-001",
                "level": "Critical",
                "message": "🚨 Onsite Kiosk Emergency Alarm Triggered",
                "source_screen": "Kiosk",
                "pin": os.getenv("KIOSK_EMERGENCY_PIN", "1234"),
            }
        )
        self.assertEqual(res.status, 200)
        data = res.json
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("level"), "Critical")
        self.assertIn("id", data)

    async def test_06_kiosk_emergency_alert_invalid_pin(self):
        """
        Verify that POST /api/alerts rejects missing or invalid Kiosk PIN with HTTP 403.
        """
        res_missing = await self.client.post(
            "/api/alerts",
            json_body={
                "box_id": "BOX-001",
                "level": "Critical",
                "message": "Unauthorized Kiosk Trigger",
                "source_screen": "Kiosk",
            }
        )
        self.assertEqual(res_missing.status, 403)

        res_wrong = await self.client.post(
            "/api/alerts",
            json_body={
                "box_id": "BOX-001",
                "level": "Critical",
                "message": "Unauthorized Kiosk Trigger",
                "source_screen": "Kiosk",
                "pin": "9999",
            }
        )
        self.assertEqual(res_wrong.status, 403)

    async def test_07_device_fan_boost_command_lifecycle(self):
        """
        Verify end-to-end Fan Boost command queue:
        Operator queues FAN_BOOST -> ESP32 polls /api/device-command -> ESP32 ACKs command.
        """
        login_res = await self.client.post(
            "/api/auth/login",
            json_body={"username": "operator", "password": "operator1234"},
        )
        self.assertEqual(login_res.status, 200)
        token = login_res.json["access_token"]

        queue_res = await self.client.post(
            "/api/devices/BOX-001/fan-boost",
            json_body={"action": "FAN_BOOST", "duration_seconds": 300},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(queue_res.status, 200)
        cmd_id = queue_res.json["command_id"]
        self.assertEqual(queue_res.json["action"], "FAN_BOOST")

        poll_res = await self.client.get("/api/device-command?box_id=BOX-001")
        self.assertEqual(poll_res.status, 200)
        cmd = poll_res.json["command"]
        self.assertIsNotNone(cmd)
        self.assertEqual(cmd["id"], cmd_id)
        self.assertEqual(cmd["action"], "FAN_BOOST")
        self.assertEqual(cmd["duration_seconds"], 300)

        ack_res = await self.client.post(
            f"/api/device-command/{cmd_id}/ack",
            json_body={"box_id": "BOX-001", "status": "COMPLETE", "detail": "Fan relay ON"},
        )
        self.assertEqual(ack_res.status, 200)
        self.assertEqual(ack_res.json["status"], "complete")

        poll_after = await self.client.get("/api/device-command?box_id=BOX-001")
        self.assertEqual(poll_after.status, 200)
        self.assertIsNone(poll_after.json["command"])

    async def test_05_dashboard_latest_offline_and_staleness(self):
        """
        Verify that /api/dashboard/latest returns accurate offline and staleness metadata,
        including is_online, is_stale, data_age_seconds, and recorded_at fields.
        """
        res = await self.client.get("/api/dashboard/latest?box_id=BOX-001")
        self.assertEqual(res.status, 200)
        data = res.json
        self.assertIn("status", data)
        self.assertIn("is_online", data)
        self.assertIn("is_stale", data)
        self.assertIn("box_id", data)


if __name__ == "__main__":
    unittest.main()
