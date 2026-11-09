"""
test_api_maintenance_and_ota.py
--------------------------------
Unit tests for Sensor Health, Maintenance Work Orders, Device Fleet, and OTA Firmware.
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["ENVIRONMENT"] = "development"

from main import app
from tests.asgi_client import ASGIClient


class TestApiMaintenanceAndOta(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = ASGIClient(app)

    async def _get_auth_token(self, username="admin", password="admin1234"):
        res = await self.client.post("/api/auth/login", json_body={"username": username, "password": password})
        return res.json["access_token"]

    async def test_01_get_maintenance_status(self):
        """Test /api/maintenance/status returns 8 sensor specs, filter health, and RUL."""
        res = await self.client.get("/api/maintenance/status")
        self.assertEqual(res.status, 200)
        data = res.json
        self.assertIn("sensors", data)
        self.assertIn("filter", data)
        self.assertIsInstance(data["sensors"], list)
        self.assertEqual(len(data["sensors"]), 8)

        # Check fields of first sensor
        sensor = data["sensors"][0]
        self.assertIn("id", sensor)
        self.assertIn("hi", sensor)
        self.assertIn("rul", sensor)
        self.assertIn("drift", sensor)
        self.assertIn("calOverdue", sensor)

    async def test_02_calibrate_sensor(self):
        """Test calibrating sensor resets drift and noise."""
        res = await self.client.post("/api/maintenance/calibrate/mq3")
        self.assertEqual(res.status, 200)
        data = res.json
        self.assertTrue(data.get("success"))
        self.assertIn("MQ-3", data.get("message", ""))

    async def test_03_calibrate_unknown_sensor_404(self):
        """Test calibrating non-existent sensor returns 404 Not Found."""
        res = await self.client.post("/api/maintenance/calibrate/unknown_sensor_xyz")
        self.assertEqual(res.status, 404)

    async def test_04_work_orders_get_and_create(self):
        """Test creating and retrieving maintenance work orders."""
        token = await self._get_auth_token("engineer", "engineer1234")
        self.client.set_auth_token(token)

        # 1. Fetch initial work orders
        get_res = await self.client.get("/api/maintenance/work-orders")
        self.assertEqual(get_res.status, 200)
        initial_count = len(get_res.json)

        # 2. Create new work order
        new_wo = {
            "box_id": "BOX-001",
            "task_type": "CALIBRATION",
            "title": "Quarterly Recalibration for MQ-135",
            "checklist": {"zero_air_verified": True},
            "notes": "Recalibrate zero-air baseline after solvent exposure test",
        }
        create_res = await self.client.post("/api/maintenance/work-orders", json_body=new_wo)
        self.assertEqual(create_res.status, 200)
        created_data = create_res.json
        self.assertEqual(created_data.get("status"), "ok")
        self.assertIn("work_order_id", created_data)

        # 3. Verify count increased
        after_res = await self.client.get("/api/maintenance/work-orders")
        self.assertEqual(len(after_res.json), initial_count + 1)

    async def test_05_ota_status_endpoint(self):
        """Test /api/ota/status returns valid metadata structure."""
        res = await self.client.get("/api/ota/status")
        self.assertEqual(res.status, 200)
        data = res.json
        self.assertIn("available", data)
        self.assertIn("version", data)
        self.assertIn("url", data)

    async def test_06_devices_fleet_endpoint(self):
        """Test /api/devices returns device list."""
        token = await self._get_auth_token("operator", "operator1234")
        self.client.set_auth_token(token)

        res = await self.client.get("/api/devices")
        self.assertEqual(res.status, 200)
        self.assertIsInstance(res.json, list)


if __name__ == "__main__":
    unittest.main()
