import asyncpg
import os

# ดึงค่า connection string จาก environment variable หรือใช้ค่า default สำหรับ local dev
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:REDACTED_PASSWORD@ep-calm-glade-a1e1ttwn-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
)

_pool: asyncpg.Pool = None


async def get_pool() -> asyncpg.Pool:
    """ดึง connection pool ที่มีอยู่แล้ว"""
    return _pool


async def connect_db():
    """สร้าง connection pool เมื่อ app เริ่มต้น"""
    global _pool
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
