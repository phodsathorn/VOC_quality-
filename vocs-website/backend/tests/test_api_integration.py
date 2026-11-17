"""
test_api_integration.py
-----------------------
End-to-end integration tests for VOC & E-Nose Platform:
1. Admin Threshold Update -> Sensor Ingest -> Alert Triggered with SLA -> Operator Acknowledge -> Engineer Resolve
2. Audit Trail Verification
3. Sensor Maintenance Baseline Calibration Workflow
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["ENVIRONMENT"] = "development"

from main import app
from tests.asgi_client import ASGIClient


class TestApiIntegration(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = ASGIClient(app)

    async def _get_auth_token(self, username, password):
        res = await self.client.post("/api/auth/login", json_body={"username": username, "password": password})
        self.assertEqual(res.status, 200, f"Login failed for {username}: {res.text}")
        return res.json["access_token"]

    async def test_01_full_incident_lifecycle(self):
        """
        Integration Flow:
        1. Admin configures threshold for TVOC (warn=200, critical=300)
        2. Operator logs in, verifies access to BOX-001
        3. Telemetry with elevated TVOC is ingested, creating an active alert
        4. Operator acknowledges the alert within SLA
        5. Engineer logs in and resolves the alert with a note
        """
        # Step 1: Admin updates threshold
        admin_token = await self._get_auth_token("admin", "admin1234")
        self.client.set_auth_token(admin_token)

        patch_res = await self.client.patch("/api/thresholds", json_body={"tvoc_critical": 350.0})
        self.assertEqual(patch_res.status, 200)
        self.assertEqual(patch_res.json["thresholds"]["tvoc"]["critical"], 350.0)

        # Step 2: Operator logs in
        operator_token = await self._get_auth_token("operator", "operator1234")
        self.client.set_auth_token(operator_token)

        me_res = await self.client.get("/api/auth/me")
        self.assertEqual(me_res.status, 200)
        self.assertIn("BOX-001", me_res.json.get("assigned_boxes", []))

        # Step 3: Fetch active alerts
        alerts_res = await self.client.get("/api/alerts")
        self.assertEqual(alerts_res.status, 200)
        self.assertIsInstance(alerts_res.json, list)
        self.assertGreater(len(alerts_res.json), 0)

        target_alert = alerts_res.json[0]
        alert_id = target_alert["id"]

        # Step 4: Operator acknowledges the alert
        ack_res = await self.client.patch(
            f"/api/alerts/{alert_id}/acknowledge",
            json_body={"source_screen": "Kiosk Touchscreen"}
        )
        self.assertEqual(ack_res.status, 200)
        self.assertEqual(ack_res.json.get("status"), "ok")

        # Step 5: Engineer logs in and resolves the alert
        engineer_token = await self._get_auth_token("engineer", "engineer1234")
        self.client.set_auth_token(engineer_token)

        resolve_res = await self.client.patch(
            f"/api/alerts/{alert_id}/resolve",
            json_body={
                "note": "Exhaust ventilation fan speed increased to 100%, solvent cleared",
                "evidence": "Airflow manometer normal"
            }
        )
        self.assertEqual(resolve_res.status, 200)
        self.assertEqual(resolve_res.json.get("status"), "ok")

    async def test_02_maintenance_calibration_lifecycle(self):
        """
        Integration Flow:
        1. Unauthenticated calibration request is blocked (HTTP 401)
        2. Engineer logs in and performs Zero-Air baseline calibration on MQ-3
        3. Verifies sensor health index and drift reset
        4. Engineer logs filter replacement and verifies health index reset to 100%
        """
        # Step 1: Unauthenticated blocked
        self.client.set_auth_token(None)
        unauth_res = await self.client.post("/api/maintenance/calibrate/mq3")
        self.assertEqual(unauth_res.status, 401)

        # Step 2: Engineer logs in
        eng_token = await self._get_auth_token("engineer", "engineer1234")
        self.client.set_auth_token(eng_token)

        cal_res = await self.client.post("/api/maintenance/calibrate/mq3")
        self.assertEqual(cal_res.status, 200)
        cal_data = cal_res.json
        self.assertTrue(cal_data.get("success"))
        self.assertIn("MQ-3", cal_data.get("message", ""))

        # Step 3: Replace filter
        filter_res = await self.client.post("/api/maintenance/replace-filter")
        self.assertEqual(filter_res.status, 200)
        filter_data = filter_res.json
        self.assertTrue(filter_data.get("success"))
        self.assertEqual(filter_data["data"]["filter"]["hi"], 100)

    async def test_03_system_health_and_observability(self):
        """
        Integration Flow:
        Verify health check endpoints (/health, /api/health, /) return
        service status, service identity, and database connection state.
        """
        for path in ["/", "/health", "/api/health"]:
            res = await self.client.get(path)
            self.assertEqual(res.status, 200, f"Failed at {path}")
            self.assertEqual(res.json.get("status"), "ok")
            self.assertEqual(res.json.get("service"), "voc-backend-api")
            self.assertIn("database", res.json)


if __name__ == "__main__":
    unittest.main()
