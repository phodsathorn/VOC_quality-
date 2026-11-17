"""
test_migrator.py
----------------
Unit tests for Database Migration Engine and migration files.
"""
import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from migrator import MIGRATIONS_DIR, run_migrations


class TestMigrator(unittest.IsolatedAsyncioTestCase):
    def test_01_migration_files_exist_and_sorted(self):
        """Verify migration files exist and follow the 00X naming convention."""
        self.assertTrue(MIGRATIONS_DIR.exists())
        sql_files = sorted([f.name for f in MIGRATIONS_DIR.glob("*.sql")])
        self.assertGreaterEqual(len(sql_files), 3)
        self.assertEqual(sql_files[0], "001_initial_schema.sql")
        self.assertEqual(sql_files[1], "002_stacks_and_emissions.sql")
        self.assertEqual(sql_files[2], "003_line_and_maintenance.sql")

    def test_02_migration_files_not_empty(self):
        """Verify each migration script contains readable SQL statements."""
        for sql_file in MIGRATIONS_DIR.glob("*.sql"):
            content = sql_file.read_text(encoding="utf-8").strip()
            self.assertGreater(len(content), 20)
            self.assertIn("CREATE TABLE", content.upper())

    async def test_03_run_migrations_graceful_on_no_db(self):
        """Verify run_migrations exits gracefully with 0 when no DATABASE_URL is set."""
        old_env = os.environ.get("DATABASE_URL")
        try:
            if "DATABASE_URL" in os.environ:
                del os.environ["DATABASE_URL"]
            count = await run_migrations(pool=None, dsn=None)
            self.assertEqual(count, 0)
        finally:
            if old_env:
                os.environ["DATABASE_URL"] = old_env


if __name__ == "__main__":
    unittest.main()
