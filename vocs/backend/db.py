import asyncpg
import os

# ดึงค่า connection string จาก environment variable หรือใช้ค่า default สำหรับ local dev
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://voc_user:voc_password@localhost:5432/voc_db"
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
