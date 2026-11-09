"""
test_api_auth.py
----------------
Unit tests for Authentication, JWT tokens, and Role-Based Access Control (RBAC).
"""
import os
import sys
import unittest

# Ensure backend directory is in path and environment is development
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["ENVIRONMENT"] = "development"

from main import app, create_access_token
from tests.asgi_client import ASGIClient


class TestApiAuth(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = ASGIClient(app)

    async def test_01_login_success_all_roles(self):
        """Test successful login for all 4 defined roles: admin, engineer, operator, viewer."""
        roles = [
            ("admin", "admin1234"),
            ("engineer", "engineer1234"),
            ("operator", "operator1234"),
            ("viewer", "viewer1234"),
        ]
        for username, password in roles:
            with self.subTest(username=username):
                res = await self.client.post("/api/auth/login", json_body={"username": username, "password": password})
                self.assertEqual(res.status, 200, f"Login failed for {username}: {res.text}")
                data = res.json
                self.assertIn("access_token", data)
                self.assertEqual(data.get("token_type"), "bearer")
                self.assertIn("user", data)
                self.assertEqual(data["user"]["role"], username)

    async def test_02_login_invalid_password(self):
        """Test login with incorrect password returns 401 Unauthorized."""
        res = await self.client.post("/api/auth/login", json_body={"username": "admin", "password": "wrongpassword"})
        self.assertEqual(res.status, 401)
        self.assertIn("Invalid username or password", res.text)

    async def test_03_login_nonexistent_user(self):
        """Test login with non-existent user returns 401 Unauthorized."""
        res = await self.client.post("/api/auth/login", json_body={"username": "ghost_user", "password": "password123"})
        self.assertEqual(res.status, 401)
        self.assertIn("Invalid username or password", res.text)

    async def test_04_get_current_user_me(self):
        """Test /api/auth/me returns identity when authenticated."""
        login_res = await self.client.post("/api/auth/login", json_body={"username": "engineer", "password": "engineer1234"})
        token = login_res.json["access_token"]

        self.client.set_auth_token(token)
        me_res = await self.client.get("/api/auth/me")
        self.assertEqual(me_res.status, 200)
        user_info = me_res.json
        self.assertEqual(user_info["username"], "engineer")
        self.assertEqual(user_info["role"], "engineer")

    async def test_05_get_me_unauthorized(self):
        """Test /api/auth/me without token returns 401 Unauthorized."""
        self.client.clear_auth_token()
        me_res = await self.client.get("/api/auth/me")
        self.assertEqual(me_res.status, 401)

    async def test_06_rbac_admin_vs_viewer_permissions(self):
        """
        Test RBAC boundaries:
        - Admin can access /api/auth/users
        - Viewer cannot access /api/auth/users (expect 403 Forbidden)
        """
        # 1. Login as Viewer
        viewer_login = await self.client.post("/api/auth/login", json_body={"username": "viewer", "password": "viewer1234"})
        viewer_token = viewer_login.json["access_token"]
        self.client.set_auth_token(viewer_token)

        viewer_res = await self.client.get("/api/users")
        self.assertEqual(viewer_res.status, 403, f"Viewer should be forbidden from /api/users, got {viewer_res.status}")

        # 2. Login as Admin
        admin_login = await self.client.post("/api/auth/login", json_body={"username": "admin", "password": "admin1234"})
        admin_token = admin_login.json["access_token"]
        self.client.set_auth_token(admin_token)

        admin_res = await self.client.get("/api/users")
        self.assertEqual(admin_res.status, 200, f"Admin should be allowed on /api/users, got {admin_res.status}")
        self.assertIsInstance(admin_res.json, list)


if __name__ == "__main__":
    unittest.main()
