import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured. Set it before running this migration.")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("Connected to DB. Adding mq2 column...")
        await conn.execute("ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS mq2 INTEGER;")
        print("Migration successful: added mq2 to sensor_readings.")
        await conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
