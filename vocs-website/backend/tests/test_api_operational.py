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


if __name__ == "__main__":
    unittest.main()
