import asyncpg
import os

# Connection string must be supplied through the deployment environment.
DATABASE_URL = os.getenv("DATABASE_URL")

_pool: asyncpg.Pool = None


async def get_pool() -> asyncpg.Pool:
    """ดึง connection pool ที่มีอยู่แล้ว"""
    return _pool


async def connect_db():
    """สร้าง connection pool เมื่อ app เริ่มต้น"""
    global _pool
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured. Set it in the deployment environment.")
    _pool = await asyncpg.create_pool(
        dsn=DATABASE_URL,
        min_size=2,
        max_size=10,
        command_timeout=60,
    )
    print("Database connected successfully")


async def disconnect_db():
    """ปิด connection pool เมื่อ app หยุดทำงาน"""
    global _pool
    if _pool:
        await _pool.close()
        print("Database disconnected")
