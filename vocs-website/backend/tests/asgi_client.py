"""
vocs-website/backend/tests/asgi_client.py
----------------------------------------
Zero-dependency ASGI Test Client for FastAPI / Starlette applications.
Allows testing HTTP endpoints asynchronously using standard Python asyncio and unittest.
"""
import json
import urllib.parse
from typing import Any, Dict, Optional, Tuple


class ASGIResponse:
    def __init__(self, status: int, headers: Dict[str, str], body: bytes):
        self.status = status
        self.headers = headers
        self.body = body
        self.text = body.decode("utf-8", errors="replace")

    @property
    def json(self) -> Any:
        if not self.text:
            return None
        return json.loads(self.text)


class ASGIClient:
    def __init__(self, app):
        self.app = app
        self.default_headers = {}

    def set_auth_token(self, token: str):
        """Set Bearer token for subsequent requests."""
        self.default_headers["authorization"] = f"Bearer {token}"

    def clear_auth_token(self):
        """Clear default authorization header."""
        self.default_headers.pop("authorization", None)

    async def request(
        self,
        method: str,
        path: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        json_body: Optional[Any] = None,
        raw_body: Optional[bytes] = None,
    ) -> ASGIResponse:
        merged_headers = {k.lower(): str(v) for k, v in self.default_headers.items()}
        if headers:
            for k, v in headers.items():
                merged_headers[k.lower()] = str(v)

        # Parse query params
        query_string = b""
        if params:
            query_string = urllib.parse.urlencode(params).encode("latin-1")
        elif "?" in path:
            path, qs = path.split("?", 1)
            query_string = qs.encode("latin-1")

        # Encode body
        if json_body is not None:
            body_bytes = json.dumps(json_body).encode("utf-8")
            if "content-type" not in merged_headers:
                merged_headers["content-type"] = "application/json"
        elif raw_body is not None:
            body_bytes = raw_body
        else:
            body_bytes = b""

        raw_headers = [
            (k.encode("latin-1"), v.encode("latin-1"))
            for k, v in merged_headers.items()
        ]

        scope = {
            "type": "http",
            "http_version": "1.1",
            "method": method.upper(),
            "path": path,
            "raw_path": path.encode("latin-1"),
            "query_string": query_string,
            "headers": raw_headers,
            "client": ("127.0.0.1", 12345),
            "server": ("testserver", 80),
        }

        sent = False
        async def receive():
            nonlocal sent
            if not sent:
                sent = True
                return {"type": "http.request", "body": body_bytes, "more_body": False}
            return {"type": "http.request", "body": b"", "more_body": False}

        status_code = 500
        response_headers = {}
        response_body = bytearray()

        async def send(message):
            nonlocal status_code, response_headers, response_body
            if message["type"] == "http.response.start":
                status_code = message["status"]
                for k, v in message.get("headers", []):
                    response_headers[k.decode("latin-1").lower()] = v.decode("latin-1")
            elif message["type"] == "http.response.body":
                response_body.extend(message.get("body", b""))

        await self.app(scope, receive, send)
        return ASGIResponse(status_code, response_headers, bytes(response_body))

    async def get(self, path: str, **kwargs) -> ASGIResponse:
        return await self.request("GET", path, **kwargs)

    async def post(self, path: str, json_body: Optional[Any] = None, **kwargs) -> ASGIResponse:
        return await self.request("POST", path, json_body=json_body, **kwargs)

    async def put(self, path: str, json_body: Optional[Any] = None, **kwargs) -> ASGIResponse:
        return await self.request("PUT", path, json_body=json_body, **kwargs)

    async def patch(self, path: str, json_body: Optional[Any] = None, **kwargs) -> ASGIResponse:
        return await self.request("PATCH", path, json_body=json_body, **kwargs)

    async def delete(self, path: str, **kwargs) -> ASGIResponse:
        return await self.request("DELETE", path, **kwargs)

