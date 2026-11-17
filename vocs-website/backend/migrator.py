"""
migrator.py
-----------
Versioned, transactional database migration engine for PostgreSQL / asyncpg.
Tracks applied migrations in the `schema_migrations` table.
"""
import os
import sys
import time
import asyncio
import asyncpg
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


async def run_migrations(pool: asyncpg.Pool = None, dsn: str = None) -> int:
    """
    Executes pending SQL migrations in numerical order.
    Returns the number of applied migrations.
    """
    close_conn = False
    if pool is not None:
        conn = await pool.acquire()
    elif dsn:
        conn = await asyncpg.connect(dsn)
        close_conn = True
    else:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("[Migrator] No DATABASE_URL configured. Skipping database migrations.")
            return 0
        conn = await asyncpg.connect(db_url)
        close_conn = True

    try:
        # 1. Ensure migrations tracking table exists
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(100) PRIMARY KEY,
                applied_at TIMESTAMPTZ DEFAULT NOW(),
                execution_time_ms REAL NOT NULL
            );
            """
        )

        # 2. Get already applied migrations
        rows = await conn.fetch("SELECT version FROM schema_migrations")
        applied_versions = {r["version"] for r in rows}

        # 3. Discover available migration files
        if not MIGRATIONS_DIR.exists():
            MIGRATIONS_DIR.mkdir(parents=True, exist_ok=True)
            return 0

        migration_files = sorted(
            [f for f in MIGRATIONS_DIR.glob("*.sql") if f.is_file()],
            key=lambda p: p.name
        )

        applied_count = 0
        for m_file in migration_files:
            v_name = m_file.name
            if v_name in applied_versions:
                continue

            print(f"[Migrator] Applying {v_name}...")
            sql_content = m_file.read_text(encoding="utf-8")
            start_t = time.monotonic()

            async with conn.transaction():
                await conn.execute(sql_content)
                elapsed_ms = round((time.monotonic() - start_t) * 1000.0, 2)
                await conn.execute(
                    "INSERT INTO schema_migrations (version, execution_time_ms) VALUES ($1, $2)",
                    v_name, elapsed_ms
                )

            print(f"[Migrator] Successfully applied {v_name} ({elapsed_ms}ms)")
            applied_count += 1

        if applied_count == 0:
            print("[Migrator] Database schema is up to date.")
        else:
            print(f"[Migrator] Total {applied_count} migration(s) applied successfully.")

        return applied_count

    finally:
        if pool is not None:
            await pool.release(conn)
        elif close_conn:
            await conn.close()


if __name__ == "__main__":
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("[Migrator] Error: DATABASE_URL environment variable is required.")
        sys.exit(1)
    asyncio.run(run_migrations(dsn=db_url))
