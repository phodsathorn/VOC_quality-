import asyncpg
import asyncio
import os

# Connection string must be supplied through the deployment environment.
DATABASE_URL = os.getenv("DATABASE_URL")

_pool: asyncpg.Pool = None
_pool_lock = asyncio.Lock()


async def get_pool() -> asyncpg.Pool:
    """ดึง connection pool ที่มีอยู่แล้ว พร้อม auto-reconnect หาก pool หลุด"""
    global _pool
    if _pool is not None and not _pool._closed:
        return _pool
    if DATABASE_URL:
        async with _pool_lock:
            if _pool is None or _pool._closed:
                try:
                    await connect_db()
                except Exception as e:
                    print(f"[DB] Auto-reconnect failed: {e}")
    return _pool


async def connect_db():
    """สร้าง connection pool เมื่อ app เริ่มต้น หรือ auto-reconnect"""
    global _pool
    if not DATABASE_URL:
        if os.getenv("ENVIRONMENT", "development").lower() == "development":
            print("[DB] Notice: DATABASE_URL not set in development mode. Database queries will return empty/fallback state.")
            return
        raise RuntimeError("DATABASE_URL is not configured. Set it in the deployment environment.")
    _pool = await asyncpg.create_pool(
        dsn=DATABASE_URL,
        min_size=2,
        max_size=10,
        max_inactive_connection_lifetime=300.0,
        command_timeout=60,
    )
    print("Database connected successfully")


async def disconnect_db():
    """ปิด connection pool เมื่อ app หยุดทำงาน"""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        print("Database disconnected")
