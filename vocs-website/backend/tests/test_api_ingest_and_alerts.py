"""
test_api_ingest_and_alerts.py
-----------------------------
Unit tests for Sensor Telemetry Ingestion, Auto Alerting, and Alert Lifecycle Workflows.
"""
import os
import sys
import unittest
from unittest.mock import AsyncMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["ENVIRONMENT"] = "development"

from main import app, _in_memory_alerts
from tests.asgi_client import ASGIClient


class TestApiIngestAndAlerts(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = ASGIClient(app)

    async def _get_auth_token(self, username="admin", password="admin1234"):
        res = await self.client.post("/api/auth/login", json_body={"username": username, "password": password})
        return res.json["access_token"]

    async def test_01_get_alerts_list(self):
        """Test fetching alert list returns HTTP 200 with active alerts."""
        token = await self._get_auth_token("engineer", "engineer1234")
        self.client.set_auth_token(token)

        res = await self.client.get("/api/alerts")
        self.assertEqual(res.status, 200)
        data = res.json
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        self.assertIn("box_id", data[0])
        self.assertIn("level", data[0])
        self.assertIn("status", data[0])

    async def test_02_alert_lifecycle_ack_and_resolve(self):
        """
        Test Alert 5-Step Lifecycle:
        1. Acknowledge (Active -> Acknowledged)
        2. In Progress (Acknowledged -> In Progress)
        3. Resolve (In Progress -> Resolved)
        """
        token = await self._get_auth_token("operator", "operator1234")
        self.client.set_auth_token(token)

        target_alert_id = _in_memory_alerts[0]["id"]

        # 1. Acknowledge
        ack_res = await self.client.patch(
            f"/api/alerts/{target_alert_id}/acknowledge",
            json_body={"source_screen": "Automated Unit Test"}
        )
        self.assertEqual(ack_res.status, 200)
        self.assertEqual(ack_res.json.get("status"), "ok")

        # 2. In Progress
        prog_res = await self.client.patch(
            f"/api/alerts/{target_alert_id}/in-progress",
            json_body={"note": "Checking ventilation line"}
        )
        self.assertEqual(prog_res.status, 200)

        # 3. Resolve
        res_res = await self.client.patch(
            f"/api/alerts/{target_alert_id}/resolve",
            json_body={"note": "Ventilation valve reopened and verified safe"}
        )
        self.assertEqual(res_res.status, 200)
        self.assertEqual(res_res.json.get("status"), "ok")

    async def test_03_viewer_cannot_modify_alerts(self):
        """Test RBAC constraint: Viewer role cannot acknowledge or resolve alerts (HTTP 403)."""
        viewer_token = await self._get_auth_token("viewer", "viewer1234")
        self.client.set_auth_token(viewer_token)

        target_alert_id = _in_memory_alerts[0]["id"]
        res = await self.client.patch(
            f"/api/alerts/{target_alert_id}/acknowledge",
            json_body={"source_screen": "Viewer Test"}
        )
        self.assertEqual(res.status, 403, f"Expected 403 Forbidden for Viewer, got {res.status}")

    async def test_04_ingest_missing_required_fields(self):
        """Test /api/ingest rejects invalid payload (e.g. missing box_id) with 422 Unprocessable Entity."""
        res = await self.client.post("/api/ingest", json_body={"temp": 25.5})
        self.assertEqual(res.status, 422)

    async def test_05_ingest_valid_telemetry_with_mock_db(self):
        """Test /api/ingest processes incoming sensor reading and returns AI inference."""
        mock_pool = AsyncMock()
        mock_pool.execute = AsyncMock(return_value=None)
        mock_pool.fetchval = AsyncMock(return_value=None)
        mock_pool.fetchrow = AsyncMock(return_value={"id": 999})

        telemetry_payload = {
            "box_id": "BOX-001",
            "temp": 28.5,
            "rh": 62.0,
            "pm25": 18.0,
            "tvoc": 85,
            "eco2": 450,
            "mq2": 1200,
            "mq3": 1400,
            "mq135": 1100,
            "mq8": 1500,
            "mics_co": 1150,
            "no2": 450,
            "nh3": 820,
            "firmware_ver": "1.0.0",
        }

        with patch("main.get_pool", return_value=mock_pool):
            res = await self.client.post(
                "/api/ingest",
                json_body=telemetry_payload,
                headers={"X-Device-Token": "voc-device-box001-secret-token"}
            )
            self.assertEqual(res.status, 200)
            data = res.json
            self.assertEqual(data.get("status"), "ok")
            self.assertEqual(data.get("reading_id"), 999)
            self.assertIn("ai", data)
            self.assertIn("prediction", data["ai"])
            self.assertIn("confidence", data["ai"])
            self.assertIn("ota", data)


if __name__ == "__main__":
    unittest.main()

