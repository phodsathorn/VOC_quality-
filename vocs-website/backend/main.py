from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse, PlainTextResponse
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
import csv, io, time, asyncio, json, os, sys, secrets, hashlib, hmac
import urllib.request
from collections import defaultdict
import jwt
import bcrypt
from db import connect_db, disconnect_db, get_pool
from model_loader import load_model, predict, is_loaded
from line_adapter import (
    send_escalation_alert,
    reply_line_message,
    push_line_message,
    verify_line_signature
)


# ==================================================================
# Phase W1: Authentication, RBAC & Security Policy Configuration
# ==================================================================
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "voc-dev-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
DEFAULT_DEVICE_TOKEN = os.getenv("DEFAULT_DEVICE_TOKEN", "voc-device-box001-secret-token")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"
DEVICE_OFFLINE_THRESHOLD_SEC = 45.0  # Threshold in seconds to classify a hardware box as OFFLINE
KIOSK_EMERGENCY_PIN = os.getenv("KIOSK_EMERGENCY_PIN", "1234")
_KIOSK_PIN_FAILURES: dict[str, list[float]] = defaultdict(list)
_KIOSK_PIN_MAX_ATTEMPTS = 5
_KIOSK_PIN_WINDOW_SEC = 60.0

# In-memory store fallback for development mode when PostgreSQL is offline
_in_memory_users = {
    "admin": {
        "id": 1,
        "username": "admin",
        "password_hash": "$2b$12$WoDG4UlxI6omdpTV7l5xC.qJfMvMsYT6Es1BtEkPNqS63lHgzWBnK",  # admin1234
        "full_name": "System Administrator",
        "role": "admin",
        "site": "Main Plant",
        "assigned_boxes": [],
        "is_active": True,
        "created_at": "2026-10-27T00:00:00Z",
        "last_login": None,
    },
    "engineer": {
        "id": 2,
        "username": "engineer",
        "password_hash": "$2b$12$sS1jxeFZ7n6u3HaVtIUacOScRkxtJZ63axRqJQIUjMlR9SQ8ZBbMW",  # engineer1234
        "full_name": "Process & Calibration Engineer",
        "role": "engineer",
        "site": "Main Plant",
        "assigned_boxes": ["BOX-001", "BOX-002"],
        "is_active": True,
        "created_at": "2026-10-27T00:00:00Z",
        "last_login": None,
    },
    "operator": {
        "id": 3,
        "username": "operator",
        "password_hash": "$2b$12$Y1svQYToU76q3bvCHIzTs.e8E.W6sHlJKEtSLGKPazaC49O3iqWn.",  # operator1234
        "full_name": "Line Operator",
        "role": "operator",
        "site": "Main Plant",
        "assigned_boxes": ["BOX-001", "BOX-002"],
        "is_active": True,
        "created_at": "2026-10-27T00:00:00Z",
        "last_login": None,
    },
    "viewer": {
        "id": 4,
        "username": "viewer",
        "password_hash": "$2b$12$raq1OVWhneyYEZXDvkdKm.KOaRmXUlbs8goGZgg7d4A0/redlZ0Q.",  # viewer1234
        "full_name": "Safety & Compliance Auditor",
        "role": "viewer",
        "site": "Main Plant",
        "assigned_boxes": ["BOX-001", "BOX-002"],
        "is_active": True,
        "created_at": "2026-10-27T00:00:00Z",
        "last_login": None,
    },
}
_in_memory_audit_events = []
_in_memory_export_audits = []
_in_memory_line_subscribers = [
    {
        "id": 1,
        "line_user_id": "U_demo_engineer_01",
        "box_id": "BOX-001",
        "display_name": "Somchai (Lead Engineer)",
        "is_active": True,
        "created_at": "03/11/2026 10:00"
    },
    {
        "id": 2,
        "line_user_id": "U_demo_safety_officer",
        "box_id": "BOX-001",
        "display_name": "Wichai (Safety Officer)",
        "is_active": True,
        "created_at": "03/11/2026 11:30"
    }
]
_in_memory_alerts = [
    {
        "id": 1,
        "box_id": "BOX-001",
        "level": "High",
        "message": "High TVOC detected (285 ppb) — เกินเกณฑ์ควบคุมความปลอดภัย",
        "status": "Active",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
        "remaining_sla_seconds": 300,
        "is_sla_breached": False,
        "escalated": False,
        "source_screen": "Sensor Stream",
        "acknowledged_at": None,
        "acknowledged_by": None,
        "acknowledged_role": None,
        "in_progress_at": None,
        "in_progress_by": None,
        "resolved_at": None,
        "resolved_by": None,
        "resolution_note": None,
        "evidence_url": None,
        "verified_at": None,
        "verified_by": None,
        "verification_note": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "time": datetime.now(timezone.utc).strftime("%H:%M:%S")
    },
    {
        "id": 2,
        "box_id": "BOX-001",
        "level": "Warning",
        "message": "PM2.5 สูงกว่าเกณฑ์ปกติ (42.0 ug/m3)",
        "status": "Active",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        "remaining_sla_seconds": 600,
        "is_sla_breached": False,
        "escalated": False,
        "source_screen": "Sensor Stream",
        "acknowledged_at": None,
        "acknowledged_by": None,
        "acknowledged_role": None,
        "in_progress_at": None,
        "in_progress_by": None,
        "resolved_at": None,
        "resolved_by": None,
        "resolution_note": None,
        "evidence_url": None,
        "verified_at": None,
        "verified_by": None,
        "verification_note": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "time": datetime.now(timezone.utc).strftime("%H:%M:%S")
    }
]
_in_memory_work_orders = []


# ==================================================================
# THRESHOLDS & PERSISTENT SYSTEM CONFIGURATION (แก้ไขและจำค่าถาวรใน DB)
# ==================================================================
THRESHOLDS = {
    "tvoc":  {"warn": 200,  "critical": 400},   # ppb (CCS811)
    "pm25":  {"warn": 35,   "critical": 75},    # ug/m3 (PMS5003)
    "eco2":  {"warn": 1500, "critical": 2500},  # ppm (CCS811)
    "mq3":   {"warn": 1200, "critical": 2000},  # ADC counts (Alcohol/Solvent)
    "mq135": {"warn": 1200, "critical": 2000},  # ADC counts (NH3/VOC)
    "mq2":   {"warn": 1200, "critical": 2000},  # ADC counts (Combustibles/Smoke)
    "mq8":   {"warn": 1000, "critical": 1800},  # ADC counts (Hydrogen)
}

_SYSTEM_CONFIG_STATE: dict = {
    "thresholds": {
        "mq3":   {"name": "1. MQ-3 (GPIO 36)",    "sub": "Alcohol & Solvent",   "warn": 1200, "crit": 2000, "duration": 15, "hyst": 50, "unit": "ADC"},
        "mq135": {"name": "2. MQ-135 (GPIO 39)",  "sub": "Ammonia & VOC Air",   "warn": 1200, "crit": 2000, "duration": 15, "hyst": 50, "unit": "ADC"},
        "mq2":   {"name": "3. MQ-2 (GPIO 33)",    "sub": "Combustible & Smoke", "warn": 1200, "crit": 2000, "duration": 10, "hyst": 50, "unit": "ADC"},
        "mq8":   {"name": "4. MQ-8 (GPIO 34)",    "sub": "Hydrogen Gas (H2)",   "warn": 1000, "crit": 1800, "duration": 15, "hyst": 40, "unit": "ADC"},
        "tvoc":  {"name": "5. CCS811 TVOC (I2C)", "sub": "Total VOC",           "warn": 200,  "crit": 400,  "duration": 15, "hyst": 20, "unit": "ppb"},
        "eco2":  {"name": "6. CCS811 eCO2 (I2C)", "sub": "Equivalent CO2",      "warn": 1500, "crit": 2500, "duration": 20, "hyst": 100,"unit": "ppm"},
        "pm25":  {"name": "7. PMS5003 PM2.5",     "sub": "Fine Particulate",    "warn": 35,   "crit": 75,   "duration": 10, "hyst": 5,  "unit": "µg/m³"},
        "mics":  {"name": "8. MiCS-6814 (ADS1115)","sub": "CO / NO2 / NH3",     "warn": 450,  "crit": 300,  "duration": 15, "hyst": 25, "unit": "mV"},
    },
    "lineConfig": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token1234567890",
        "secret": "9df8e12a45b780cd3e45f912",
        "groupId": "c839f10928b746a51ec94820d912f4",
    },
    "telegramConfig": {
        "botToken": "619283749:AAFn82k_w123498",
        "chatId": "-1001827461928",
    },
    "emailConfig": {
        "recipients": "safety@plant-ops.com, mitchell@safety-dept.org",
        "interval": "Immediate (Real-time)",
    },
    "sla": {
        "warningMinutes": 10,
        "criticalMinutes": 5,
    },
    "generalConfig": {
        "timezone": "Asia/Bangkok (UTC+07:00)",
        "retention": "5 years (1,825 days)",
        "alarmTone": "Industrial Siren Pulse",
        "volume": 75,
    },
    "updated_at": None,
}


def _sync_thresholds_from_config(cfg: dict):
    """อัปเดตตัวแปร THRESHOLDS ของระบบตรวจจับ Alert ให้ตรงกับค่าที่ผู้ใช้ตั้งในหน้า Settings ทันที"""
    th = cfg.get("thresholds") or {}
    for key in ("tvoc", "pm25", "eco2", "mq3", "mq135", "mq2", "mq8"):
        item = th.get(key)
        if isinstance(item, dict):
            w = item.get("warn")
            c = item.get("crit") if "crit" in item else item.get("critical")
            if w is not None and c is not None:
                THRESHOLDS[key] = {"warn": float(w), "critical": float(c)}



# ==================================================================
# RATE LIMITER — Token bucket per IP สำหรับ /api/ingest และ Login Guard
# ==================================================================
_rate_buckets: dict = defaultdict(lambda: {"tokens": 10.0, "last": time.monotonic()})
RATE_LIMIT_RPS  = 5    # requests per second ต่อ IP
RATE_LIMIT_BURST = 10  # burst สูงสุด

def _check_rate_limit(ip: str) -> bool:
    """Token bucket — คืน True ถ้า allowed, False ถ้า throttled"""
    bucket = _rate_buckets[ip]
    now    = time.monotonic()
    elapsed = now - bucket["last"]
    bucket["tokens"] = min(RATE_LIMIT_BURST, bucket["tokens"] + elapsed * RATE_LIMIT_RPS)
    bucket["last"]   = now
    if bucket["tokens"] >= 1:
        bucket["tokens"] -= 1
        return True
    return False

# Rate Limiter ป้องกันการโจมตีแบบ Brute-force ในหน้าเข้าสู่ระบบ (/api/auth/login)
_login_failures: dict = defaultdict(lambda: {"count": 0, "reset_at": 0.0})
LOGIN_RATE_LIMIT_MAX_FAILS = 5
LOGIN_RATE_LIMIT_LOCKOUT_SEC = 60.0

def _check_login_rate_limit(ip: str) -> bool:
    """คืน True ถ้า allowed, False ถ้าถูกระงับชั่วคราวจากการเดารหัสผ่านซ้ำ"""
    now = time.monotonic()
    entry = _login_failures[ip]
    if now > entry["reset_at"]:
        entry["count"] = 0
        entry["reset_at"] = now + LOGIN_RATE_LIMIT_LOCKOUT_SEC
    return entry["count"] < LOGIN_RATE_LIMIT_MAX_FAILS

def _record_login_failure(ip: str):
    now = time.monotonic()
    entry = _login_failures[ip]
    if now > entry["reset_at"]:
        entry["count"] = 1
        entry["reset_at"] = now + LOGIN_RATE_LIMIT_LOCKOUT_SEC
    else:
        entry["count"] += 1

def _reset_login_failures(ip: str):
    if ip in _login_failures:
        del _login_failures[ip]


# ==================================================================
# DATA RETENTION & PURGE TASK (5-Year Compliance Safe — W0/W3 Policy)
# ==================================================================
ENABLE_AUTO_PURGE = os.getenv("ENABLE_AUTO_PURGE", "false").lower() in ("true", "1")
DATA_RETENTION_DAYS = int(os.getenv("DATA_RETENTION_DAYS", "1825"))  # Default 5 years = 1825 days

async def purge_old_data_task():
    """
    Background task ควบคุมการลบข้อมูลตามนโยบาย Data Retention 5 ปี
    โดยปิดการลบอัตโนมัติเป็นค่าเริ่มต้น เพื่อความปลอดภัยตามข้อกำหนด W0/W3 ใน WEB_BACKEND_REVIEW_AND_PLAN.md
    """
    while True:
        try:
            if ENABLE_AUTO_PURGE:
                pool = await get_pool()
                if pool:
                    res = await pool.execute(
                        f"DELETE FROM sensor_readings WHERE recorded_at < NOW() - INTERVAL '{DATA_RETENTION_DAYS} days'"
                    )
                    print(f"[Purge Task] Deleted records older than {DATA_RETENTION_DAYS} days: {res}")
            else:
                print(f"[Purge Task] Auto-purge disabled. Preserving historical records for 5-year compliance retention.")
        except Exception as e:
            print(f"[Purge Task] Error: {e}")
        
        # รอ 24 ชั่วโมง (86400 วินาที) ก่อนรันรอบต่อไป
        await asyncio.sleep(86400)


# ==================================================================
# Phase W3: 5-YEAR RETENTION & DOWNSAMPLING AGGREGATOR TASK
# ==================================================================
async def downsampling_retention_task():
    """
    Phase W3: Aggregate raw high-frequency sensor readings (3-second samples)
    into hourly rollups and daily rollups for 5-year compliance storage.
    """
    while True:
        try:
            pool = await get_pool()
            if pool:
                # 1. Hourly aggregation from raw readings
                await pool.execute("""
                    INSERT INTO sensor_readings_hourly (
                        box_id, bucket_start, sample_count,
                        temp_avg, temp_min, temp_max,
                        rh_avg, rh_min, rh_max,
                        tvoc_avg, tvoc_min, tvoc_max,
                        eco2_avg, eco2_min, eco2_max,
                        pm25_avg, pm25_min, pm25_max
                    )
                    SELECT
                        box_id,
                        date_trunc('hour', recorded_at) AS bucket_start,
                        COUNT(*) AS sample_count,
                        ROUND(AVG(temp)::numeric, 2) AS temp_avg,
                        MIN(temp) AS temp_min,
                        MAX(temp) AS temp_max,
                        ROUND(AVG(rh)::numeric, 2) AS rh_avg,
                        MIN(rh) AS rh_min,
                        MAX(rh) AS rh_max,
                        ROUND(AVG(tvoc)::numeric, 2) AS tvoc_avg,
                        MIN(tvoc) AS tvoc_min,
                        MAX(tvoc) AS tvoc_max,
                        ROUND(AVG(eco2)::numeric, 2) AS eco2_avg,
                        MIN(eco2) AS eco2_min,
                        MAX(eco2) AS eco2_max,
                        ROUND(AVG(pm25)::numeric, 2) AS pm25_avg,
                        MIN(pm25) AS pm25_min,
                        MAX(pm25) AS pm25_max
                    FROM sensor_readings
                    WHERE recorded_at < NOW() - INTERVAL '2 minutes'
                    GROUP BY box_id, date_trunc('hour', recorded_at)
                    ON CONFLICT (box_id, bucket_start) DO UPDATE SET
                        sample_count = EXCLUDED.sample_count,
                        temp_avg = EXCLUDED.temp_avg,
                        rh_avg = EXCLUDED.rh_avg,
                        tvoc_avg = EXCLUDED.tvoc_avg,
                        eco2_avg = EXCLUDED.eco2_avg,
                        pm25_avg = EXCLUDED.pm25_avg;
                """)

                # 2. Daily aggregation from hourly rollups
                await pool.execute("""
                    INSERT INTO sensor_readings_daily (
                        box_id, bucket_date, sample_count,
                        temp_avg, temp_min, temp_max,
                        rh_avg, rh_min, rh_max,
                        tvoc_avg, tvoc_min, tvoc_max,
                        eco2_avg, eco2_min, eco2_max,
                        pm25_avg, pm25_min, pm25_max
                    )
                    SELECT
                        box_id,
                        bucket_start::date AS bucket_date,
                        SUM(sample_count) AS sample_count,
                        ROUND(AVG(temp_avg)::numeric, 2) AS temp_avg,
                        MIN(temp_min) AS temp_min,
                        MAX(temp_max) AS temp_max,
                        ROUND(AVG(rh_avg)::numeric, 2) AS rh_avg,
                        MIN(rh_min) AS rh_min,
                        MAX(rh_max) AS rh_max,
                        ROUND(AVG(tvoc_avg)::numeric, 2) AS tvoc_avg,
                        MIN(tvoc_min) AS tvoc_min,
                        MAX(tvoc_max) AS tvoc_max,
                        ROUND(AVG(eco2_avg)::numeric, 2) AS eco2_avg,
                        MIN(eco2_min) AS eco2_min,
                        MAX(eco2_max) AS eco2_max,
                        ROUND(AVG(pm25_avg)::numeric, 2) AS pm25_avg,
                        MIN(pm25_min) AS pm25_min,
                        MAX(pm25_max) AS pm25_max
                    FROM sensor_readings_hourly
                    GROUP BY box_id, bucket_start::date
                    ON CONFLICT (box_id, bucket_date) DO UPDATE SET
                        sample_count = EXCLUDED.sample_count,
                        temp_avg = EXCLUDED.temp_avg,
                        rh_avg = EXCLUDED.rh_avg,
                        tvoc_avg = EXCLUDED.tvoc_avg,
                        eco2_avg = EXCLUDED.eco2_avg,
                        pm25_avg = EXCLUDED.pm25_avg;
                """)
        except Exception as e:
            # Table might be preparing or offline in mock mode
            pass

        await asyncio.sleep(120)  # Runs every 2 minutes


# ==================================================================
# SLA TIMER & ESCALATION QUEUE MONITOR (Phase W2 SLA Engine)
# ==================================================================
async def sla_escalation_monitor_task():
    """
    Background Task ตรวจสอบ SLA Timer ของ Active Alerts ทุก 15 วินาที (Phase W2)
    - Warning: SLA 10 นาที
    - High / Critical: SLA 5 นาที
    หากไม่มีการรับทราบ (Acknowledge) ภายในกำหนด จะติดธง is_sla_breached และส่ง Escalation ผ่าน line_adapter
    """
    while True:
        try:
            pool = await get_pool()
            if pool:
                rows = await pool.fetch(
                    """
                    SELECT id, box_id, level, message, status, sla_deadline, created_at
                    FROM alerts
                    WHERE status = 'Active' AND sla_deadline IS NOT NULL AND NOW() > sla_deadline AND is_sla_breached = FALSE
                    """
                )
                for r in rows:
                    alert_dict = dict(r)
                    alert_dict["created_at"] = alert_dict["created_at"].isoformat() if hasattr(alert_dict["created_at"], "isoformat") else str(alert_dict["created_at"])
                    await pool.execute(
                        "UPDATE alerts SET is_sla_breached = TRUE, escalated = TRUE WHERE id = $1",
                        r["id"]
                    )
                    # Fetch LINE subscribers for this box
                    try:
                        sub_rows = await pool.fetch(
                            "SELECT line_user_id FROM line_subscribers WHERE box_id = $1 AND is_active = TRUE",
                            r["box_id"]
                        )
                        subscriber_ids = [row["line_user_id"] for row in sub_rows]
                    except Exception:
                        subscriber_ids = []
                    res = send_escalation_alert(alert_dict, subscriber_ids)
                    await record_audit_event(
                        action="ALERT_SLA_BREACHED",
                        resource_type="ALERT",
                        resource_id=str(r["id"]),
                        details={"level": r["level"], "box_id": r["box_id"], "line_result": res, "notified_count": len(subscriber_ids)},
                        status="BREACHED"
                    )
            else:
                now_utc = datetime.now(timezone.utc)
                for a in _in_memory_alerts:
                    if a.get("status") == "Active" and not a.get("is_sla_breached") and a.get("sla_deadline"):
                        try:
                            dl = datetime.fromisoformat(a["sla_deadline"])
                            if now_utc > dl:
                                a["is_sla_breached"] = True
                                a["escalated"] = True
                                mem_subs = [
                                    s["line_user_id"] for s in _in_memory_line_subscribers
                                    if s["box_id"] == a.get("box_id") and s["is_active"]
                                ]
                                res = send_escalation_alert(a, mem_subs)
                                await record_audit_event(
                                    action="ALERT_SLA_BREACHED",
                                    resource_type="ALERT",
                                    resource_id=str(a["id"]),
                                    details={"level": a["level"], "box_id": a["box_id"], "line_result": res},
                                    status="BREACHED"
                                )
                        except Exception:
                            pass
        except Exception as e:
            print(f"[SLA Monitor Error] {e}")

        await asyncio.sleep(15)


async def device_offline_watchdog_task():
    """
    Phase 5B: Automatic Device Offline Detection & Watchdog
    Checks all registered devices every 20 seconds. If a device has not sent
    telemetry for over DEVICE_OFFLINE_THRESHOLD_SEC (45s), an automatic High alert
    is triggered and broadcasted to LINE.
    """
    while True:
        try:
            pool = await get_pool()
            if pool:
                offline_rows = await pool.fetch(
                    f"""
                    SELECT box_id, last_seen,
                           EXTRACT(EPOCH FROM (NOW() - last_seen))::int AS seconds_offline
                    FROM devices
                    WHERE last_seen IS NOT NULL
                      AND last_seen < NOW() - INTERVAL '{int(DEVICE_OFFLINE_THRESHOLD_SEC)} seconds'
                    """
                )
                for dev in offline_rows:
                    b_id = dev["box_id"]
                    sec_off = dev["seconds_offline"]
                    existing = await pool.fetchrow(
                        """
                        SELECT id FROM alerts
                        WHERE box_id = $1 AND message LIKE '%ขาดการเชื่อมต่อ (Offline%' AND status = 'Active'
                        LIMIT 1
                        """,
                        b_id
                    )
                    if not existing:
                        now_utc = datetime.now(timezone.utc)
                        sla_deadline = now_utc + timedelta(minutes=10)
                        msg = f"⚠️ กล่องตรวจจับ {b_id} ขาดการเชื่อมต่อ (Offline นาน {sec_off}s)"
                        row = await pool.fetchrow(
                            """
                            INSERT INTO alerts (box_id, level, message, status, sla_deadline, is_sla_breached, source_screen)
                            VALUES ($1, 'High', $2, 'Active', $3, FALSE, 'System Watchdog')
                            RETURNING id
                            """,
                            b_id, msg, sla_deadline
                        )
                        alert_id = row["id"]
                        await record_audit_event(
                            action="DEVICE_OFFLINE_DETECTED",
                            resource_type="DEVICE",
                            resource_id=b_id,
                            details={"box_id": b_id, "alert_id": alert_id, "seconds_offline": sec_off},
                            status="TRIGGERED"
                        )
                        try:
                            sub_rows = await pool.fetch(
                                "SELECT line_user_id FROM line_subscribers WHERE box_id = $1 AND is_active = TRUE",
                                b_id
                            )
                            sub_ids = [r["line_user_id"] for r in sub_rows]
                            send_escalation_alert({
                                "id": alert_id,
                                "box_id": b_id,
                                "level": "High",
                                "message": msg,
                                "created_at": now_utc.isoformat()
                            }, sub_ids)
                        except Exception:
                            pass
        except Exception as e:
            print(f"[Watchdog Error] {e}")

        await asyncio.sleep(20)


async def _init_db_tables():
    """สร้างตารางและรัน Database Migrations อัตโนมัติเมื่อ Backend สตาร์ต"""
    try:
        pool = await get_pool()
        if pool:
            # Phase 3: Run versioned migrations
            try:
                from migrator import run_migrations
                await run_migrations(pool=pool)
            except Exception as me:
                print(f"[DB] Versioned migrations notice: {me}")

            await pool.execute("""
                CREATE TABLE IF NOT EXISTS ota_firmwares (
                    id SERIAL PRIMARY KEY,
                    version VARCHAR(30) UNIQUE NOT NULL,
                    filename VARCHAR(150) NOT NULL,
                    size_bytes BIGINT NOT NULL,
                    status VARCHAR(20) DEFAULT 'ACTIVE',
                    release_notes TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS ota_reports (
                    id BIGSERIAL PRIMARY KEY,
                    box_id VARCHAR(50) NOT NULL,
                    version VARCHAR(30) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    error_code INTEGER DEFAULT 0,
                    error_detail TEXT,
                    reported_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS system_logs (
                    id BIGSERIAL PRIMARY KEY,
                    category VARCHAR(30) NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'INFO',
                    detail TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_ota_status VARCHAR(50);
                ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_ota_error TEXT;
                CREATE TABLE IF NOT EXISTS device_commands (
                    id BIGSERIAL PRIMARY KEY, box_id VARCHAR(50) NOT NULL,
                    action VARCHAR(50) NOT NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb,
                    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', created_at TIMESTAMPTZ DEFAULT NOW(),
                    completed_at TIMESTAMPTZ, result JSONB
                );
                CREATE TABLE IF NOT EXISTS sensor_calibrations (
                    id BIGSERIAL PRIMARY KEY, box_id VARCHAR(50) NOT NULL,
                    requested_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ,
                    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', baselines JSONB, detail TEXT
                );
                CREATE TABLE IF NOT EXISTS sensor_runtime (
                    box_id VARCHAR(50) NOT NULL, sensor_id VARCHAR(30) NOT NULL,
                    online_seconds BIGINT NOT NULL DEFAULT 0, last_seen TIMESTAMPTZ,
                    last_device_uptime BIGINT, PRIMARY KEY (box_id, sensor_id)
                );
                CREATE TABLE IF NOT EXISTS sensor_status_logs (
                    id BIGSERIAL PRIMARY KEY, box_id VARCHAR(50) NOT NULL,
                    recorded_at TIMESTAMPTZ DEFAULT NOW(), device_uptime_sec BIGINT,
                    statuses JSONB NOT NULL
                );

                INSERT INTO ota_firmwares (version, filename, size_bytes, status, release_notes)
                VALUES ('1.0.2', 'firmware_1.0.2.bin', 1198560, 'ACTIVE', 'Production baseline firmware with I2C glitch filter and glassmorphism Web OTA')
                ON CONFLICT (version) DO NOTHING;

                -- Phase W1: Authentication, Role-based Access Control (RBAC) & Audit Trail
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100),
                    role VARCHAR(20) NOT NULL CHECK (role IN ('operator', 'engineer', 'admin', 'viewer')),
                    site VARCHAR(50) DEFAULT 'Main Plant',
                    assigned_boxes TEXT[] DEFAULT '{}',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    last_login TIMESTAMPTZ
                );
                ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_token_hash VARCHAR(255);
                ALTER TABLE devices ADD COLUMN IF NOT EXISTS site VARCHAR(50) DEFAULT 'Main Plant';
                ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

                CREATE TABLE IF NOT EXISTS audit_events (
                    id BIGSERIAL PRIMARY KEY,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    user_id INTEGER REFERENCES users(id),
                    username VARCHAR(50),
                    role VARCHAR(20),
                    ip_address VARCHAR(45),
                    action VARCHAR(50) NOT NULL,
                    resource_type VARCHAR(50) NOT NULL,
                    resource_id VARCHAR(100),
                    details JSONB NOT NULL DEFAULT '{}'::jsonb,
                    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS'
                );
                CREATE INDEX IF NOT EXISTS idx_audit_events_time ON audit_events (timestamp DESC);
                CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events (username, timestamp DESC);
                CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events (resource_type, resource_id);

                INSERT INTO users (username, password_hash, full_name, role, site, assigned_boxes)
                VALUES
                    ('admin',    '$2b$12$R85.RR54e7FJqg1z0JZ4.Oh4wRYHhhbu517fTd34HgbxkTKiBsDHG', 'System Administrator',        'admin',    'Main Plant', '{}'),
                    ('engineer', '$2b$12$2ftINa0VLTGA71xS9DCxLO0ylDOL8UQiTqEvRQLsmXk.htnupZxau', 'Process & Calibration Engineer', 'engineer', 'Main Plant', '{"BOX-001", "BOX-002"}'),
                    ('operator', '$2b$12$LjHTu4H5PQJ5yC1f/SLp/e07AwdF2Gz8umgmuy2Q6AlbOt3iykH/C', 'Line Operator',                 'operator', 'Main Plant', '{"BOX-001", "BOX-002"}'),
                    ('viewer',   '$2b$12$agntqqTS7JBX9YfHr7.6d.BQifYeiQGUQcGXFX8QO/JcvasLxCe8O', 'Safety & Compliance Auditor',   'viewer',   'Main Plant', '{}')
                ON CONFLICT (username) DO UPDATE
                SET assigned_boxes = EXCLUDED.assigned_boxes
                WHERE users.assigned_boxes IS NULL OR users.assigned_boxes = '{}';

                UPDATE users SET assigned_boxes = '{"BOX-001", "BOX-002"}' WHERE role IN ('operator', 'engineer') AND (assigned_boxes IS NULL OR assigned_boxes = '{}');

                UPDATE devices SET device_token_hash = '$2b$12$R85.RR54e7FJqg1z0JZ4.Oh4wRYHhhbu517fTd34HgbxkTKiBsDHG' WHERE box_id = 'BOX-001' AND device_token_hash IS NULL;

                -- Phase W2: Alert SLA & 5-Step Workflow Columns
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_by VARCHAR(50);
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_role VARCHAR(20);
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMPTZ;
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS in_progress_by VARCHAR(50);
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(50);
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolution_note TEXT;
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS evidence_url TEXT;
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS verified_by VARCHAR(50);
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS verification_note TEXT;
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source_screen VARCHAR(50) DEFAULT 'Web Dashboard';
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_sla_breached BOOLEAN DEFAULT FALSE;
                ALTER TABLE alerts ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE;

                -- Update existing Active alerts without deadline
                UPDATE alerts SET sla_deadline = created_at + INTERVAL '5 minutes' WHERE sla_deadline IS NULL AND level IN ('Critical', 'High');
                UPDATE alerts SET sla_deadline = created_at + INTERVAL '10 minutes' WHERE sla_deadline IS NULL AND level = 'Warning';

                -- Phase W2: Maintenance Work Orders Table
                CREATE TABLE IF NOT EXISTS maintenance_work_orders (
                    id SERIAL PRIMARY KEY,
                    box_id VARCHAR(50) NOT NULL,
                    task_type VARCHAR(50) NOT NULL,
                    title VARCHAR(150) NOT NULL,
                    performed_by VARCHAR(50) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
                    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
                    notes TEXT,
                    completed_at TIMESTAMPTZ DEFAULT NOW(),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_mwo_box_time ON maintenance_work_orders (box_id, completed_at DESC);

                -- Phase W3 & H2: 5-Year Retention Downsampling, Provenance, Diagnostics & Export Audit
                ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT TRUE;
                ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS validation_reason VARCHAR(100) DEFAULT 'PASS';
                ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS calibration_id VARCHAR(50);
                ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS firmware_ver VARCHAR(20) DEFAULT '1.0.0';
                ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS model_ver VARCHAR(20) DEFAULT 'v2.1';
                ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS seq_no BIGINT;
                ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS wifi_rssi INTEGER;
                ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS free_heap_kb INTEGER;
                ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS reset_reason VARCHAR(60);

                CREATE TABLE IF NOT EXISTS sensor_readings_hourly (
                    id            BIGSERIAL PRIMARY KEY,
                    box_id        VARCHAR(20) NOT NULL,
                    bucket_start  TIMESTAMPTZ NOT NULL,
                    sample_count  INT NOT NULL,
                    temp_avg      REAL, temp_min REAL, temp_max REAL,
                    rh_avg        REAL, rh_min REAL, rh_max REAL,
                    tvoc_avg      REAL, tvoc_min REAL, tvoc_max REAL,
                    eco2_avg      REAL, eco2_min REAL, eco2_max REAL,
                    pm25_avg      REAL, pm25_min REAL, pm25_max REAL,
                    UNIQUE (box_id, bucket_start)
                );
                CREATE INDEX IF NOT EXISTS idx_readings_hourly_time ON sensor_readings_hourly (box_id, bucket_start DESC);

                CREATE TABLE IF NOT EXISTS sensor_readings_daily (
                    id            BIGSERIAL PRIMARY KEY,
                    box_id        VARCHAR(20) NOT NULL,
                    bucket_date   DATE NOT NULL,
                    sample_count  INT NOT NULL,
                    temp_avg      REAL, temp_min REAL, temp_max REAL,
                    rh_avg        REAL, rh_min REAL, rh_max REAL,
                    tvoc_avg      REAL, tvoc_min REAL, tvoc_max REAL,
                    eco2_avg      REAL, eco2_min REAL, eco2_max REAL,
                    pm25_avg      REAL, pm25_min REAL, pm25_max REAL,
                    UNIQUE (box_id, bucket_date)
                );
                CREATE INDEX IF NOT EXISTS idx_readings_daily_date ON sensor_readings_daily (box_id, bucket_date DESC);

                CREATE TABLE IF NOT EXISTS export_audit_records (
                    id            BIGSERIAL PRIMARY KEY,
                    export_id     VARCHAR(64) UNIQUE NOT NULL,
                    exported_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    username      VARCHAR(50) NOT NULL,
                    role          VARCHAR(20) NOT NULL,
                    format        VARCHAR(10) NOT NULL,
                    date_from     TIMESTAMPTZ,
                    date_to       TIMESTAMPTZ,
                    box_id        VARCHAR(20),
                    record_count  INT NOT NULL,
                    sha256_hash   VARCHAR(64) NOT NULL
                );

                -- Phase W4: Cryptographic OTA Signatures & Model Artifact Governance
                ALTER TABLE ota_firmwares ADD COLUMN IF NOT EXISTS sha256_checksum VARCHAR(64);
                ALTER TABLE ota_firmwares ADD COLUMN IF NOT EXISTS signature_ecdsa VARCHAR(256);
                ALTER TABLE ota_firmwares ADD COLUMN IF NOT EXISTS signed_by VARCHAR(50);
                ALTER TABLE ota_firmwares ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT FALSE;

                CREATE TABLE IF NOT EXISTS model_governance_registry (
                    id               SERIAL PRIMARY KEY,
                    model_ver        VARCHAR(30) UNIQUE NOT NULL,
                    sha256_hash      VARCHAR(64) NOT NULL,
                    algorithm        VARCHAR(50) NOT NULL,
                    dataset_version  VARCHAR(50) NOT NULL,
                    accuracy         REAL NOT NULL,
                    f1_score         REAL NOT NULL,
                    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                    approved_by      VARCHAR(50) NOT NULL,
                    approved_at      TIMESTAMPTZ DEFAULT NOW(),
                    signature        VARCHAR(256) NOT NULL
                );

                INSERT INTO model_governance_registry (model_ver, sha256_hash, algorithm, dataset_version, accuracy, f1_score, status, approved_by, signature)
                VALUES
                    ('v2.1', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'RandomForestClassifier (Ensemble 100-trees)', 'DATASET-2026-Q1', 0.942, 0.938, 'ACTIVE', 'admin', 'SIG_ECDSA_SHA256_ROOT_CERT_2026')
                ON CONFLICT (model_ver) DO NOTHING;

                -- Phase W5: Exhaust Stacks, Emission Permits & Annual Mass Reports
                CREATE TABLE IF NOT EXISTS exhaust_stacks (
                    stack_id            VARCHAR(30) PRIMARY KEY,
                    name                VARCHAR(100) NOT NULL,
                    process_type        VARCHAR(100) NOT NULL,
                    flow_rate_m3_h      NUMERIC(12, 2) NOT NULL,
                    diameter_m          NUMERIC(6, 2) NOT NULL,
                    temp_c              NUMERIC(6, 2) DEFAULT 35.0,
                    is_verified_cems    BOOLEAN DEFAULT FALSE,
                    cems_calibrated_at  TIMESTAMPTZ,
                    active              BOOLEAN DEFAULT TRUE
                );

                CREATE TABLE IF NOT EXISTS emission_permits (
                    permit_no                   VARCHAR(50) PRIMARY KEY,
                    pollutant                   VARCHAR(50) NOT NULL,
                    max_annual_kg               NUMERIC(12, 2) NOT NULL,
                    concentration_limit_mg_m3   NUMERIC(8, 2) NOT NULL,
                    valid_until                 DATE NOT NULL,
                    authority                   VARCHAR(100) DEFAULT 'Industrial Estate Authority / Dept of Industrial Works'
                );

                CREATE TABLE IF NOT EXISTS stack_measurements (
                    id                      SERIAL PRIMARY KEY,
                    stack_id                VARCHAR(30) REFERENCES exhaust_stacks(stack_id),
                    sampled_at              TIMESTAMPTZ NOT NULL,
                    pollutant               VARCHAR(50) NOT NULL,
                    concentration_mg_m3     NUMERIC(10, 4) NOT NULL,
                    verified_flow_m3_h      NUMERIC(12, 2) NOT NULL,
                    operating_hours_annual  NUMERIC(10, 2) NOT NULL,
                    lab_cert_id             VARCHAR(100),
                    lab_certified_at        DATE,
                    is_accredited_lab       BOOLEAN DEFAULT FALSE,
                    created_at              TIMESTAMPTZ DEFAULT NOW()
                );

                INSERT INTO exhaust_stacks (stack_id, name, process_type, flow_rate_m3_h, diameter_m, temp_c, is_verified_cems, cems_calibrated_at, active)
                VALUES
                    ('STACK-01', 'Exhaust Stack 01 (Painting Booth A)', 'Automotive Primer Spraying', 12500.0, 0.85, 38.0, TRUE, NOW() - INTERVAL '30 days', TRUE),
                    ('STACK-02', 'Exhaust Stack 02 (Drying Oven Line B)', 'Thermal Cure Oven', 8200.0, 0.65, 85.0, FALSE, NULL, TRUE)
                ON CONFLICT (stack_id) DO NOTHING;

                INSERT INTO emission_permits (permit_no, pollutant, max_annual_kg, concentration_limit_mg_m3, valid_until, authority)
                VALUES
                    ('PERMIT-IEAT-2026-VOC', 'Total VOCs (as Carbon)', 5000.0, 150.0, '2026-12-31', 'Industrial Estate Authority of Thailand (IEAT)'),
                    ('PERMIT-DIW-2026-BENZENE', 'Benzene', 250.0, 5.0, '2026-12-31', 'Department of Industrial Works (DIW)')
                ON CONFLICT (permit_no) DO NOTHING;

                -- LINE Bot Device Pairing (Subscribers per Box ID)
                CREATE TABLE IF NOT EXISTS line_subscribers (
                    id SERIAL PRIMARY KEY,
                    line_user_id VARCHAR(100) NOT NULL,
                    box_id VARCHAR(50) NOT NULL,
                    display_name VARCHAR(100) DEFAULT 'LINE User',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE (line_user_id, box_id)
                );
                CREATE INDEX IF NOT EXISTS idx_line_sub_box ON line_subscribers (box_id, is_active);

                -- Phase 2 Persistence: Maintenance & Sensor Calibration Health State Table
                CREATE TABLE IF NOT EXISTS maintenance_state (
                    key VARCHAR(50) PRIMARY KEY,
                    state JSONB NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # Load or seed persistent maintenance state
            sensor_state_row = await pool.fetchrow("SELECT state FROM maintenance_state WHERE key = 'sensors'")
            if sensor_state_row:
                s_state = sensor_state_row["state"]
                if isinstance(s_state, str):
                    s_state = json.loads(s_state)
                _MAINTENANCE_STATE["sensors"].update(s_state)
            else:
                await pool.execute(
                    "INSERT INTO maintenance_state (key, state) VALUES ('sensors', $1::jsonb) ON CONFLICT (key) DO NOTHING",
                    json.dumps(_MAINTENANCE_STATE["sensors"])
                )

            filter_state_row = await pool.fetchrow("SELECT state FROM maintenance_state WHERE key = 'filter'")
            if filter_state_row:
                f_state = filter_state_row["state"]
                if isinstance(f_state, str):
                    f_state = json.loads(f_state)
                _MAINTENANCE_STATE["filter"].update(f_state)
            else:
                await pool.execute(
                    "INSERT INTO maintenance_state (key, state) VALUES ('filter', $1::jsonb) ON CONFLICT (key) DO NOTHING",
                    json.dumps(_MAINTENANCE_STATE["filter"])
                )

            # Load or seed persistent system configuration (Thresholds, Notifications, SLA, General)
            sys_cfg_row = await pool.fetchrow("SELECT state FROM maintenance_state WHERE key = 'system_config'")
            if sys_cfg_row:
                c_state = sys_cfg_row["state"]
                if isinstance(c_state, str):
                    c_state = json.loads(c_state)
                if isinstance(c_state, dict):
                    _SYSTEM_CONFIG_STATE.update(c_state)
                    _sync_thresholds_from_config(_SYSTEM_CONFIG_STATE)
            else:
                await pool.execute(
                    "INSERT INTO maintenance_state (key, state) VALUES ('system_config', $1::jsonb) ON CONFLICT (key) DO NOTHING",
                    json.dumps(_SYSTEM_CONFIG_STATE)
                )

            # Load or seed persistent 3-Fan controller states (GPIO 25, GPIO 26, GPIO 4)
            fan_rows = await pool.fetch("SELECT key, state FROM maintenance_state WHERE key LIKE 'fans:%'")
            if fan_rows:
                for fr in fan_rows:
                    box_key = fr["key"].split("fans:", 1)[1]
                    f_val = fr["state"]
                    if isinstance(f_val, str):
                        f_val = json.loads(f_val)
                    if isinstance(f_val, dict):
                        _box_fan_states[box_key] = f_val
            else:
                for b_id, f_val in _box_fan_states.items():
                    await pool.execute(
                        "INSERT INTO maintenance_state (key, state) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING",
                        f"fans:{b_id}", json.dumps(f_val)
                    )

            print("[DB] Self-healing schema init completed with persistent maintenance, fan, and system config state.")
    except Exception as e:
        print(f"[DB] Init tables warning: {e}")


async def log_activity(category: str, action: str, status: str = "INFO", detail: str = ""):
    """บันทึก Log ลงฐานข้อมูลถาวร เพื่อให้เรียกดูย้อนหลังได้ไม่สูญหายแม้ reload หน้าเว็บ"""
    try:
        pool = await get_pool()
        if pool:
            await pool.execute(
                "INSERT INTO system_logs (category, action, status, detail) VALUES ($1, $2, $3, $4)",
                category, action, status, detail
            )
    except Exception as e:
        print(f"[Log Error] {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if IS_PRODUCTION:
        required = ("JWT_SECRET_KEY", "ADMIN_API_KEY", "OTA_SIGNING_KEY", "DEFAULT_DEVICE_TOKEN")
        missing = [name for name in required if not os.getenv(name)]
        if missing:
            raise RuntimeError(f"CRITICAL: Production configuration missing environment variables: {', '.join(missing)}")
        insecure_defaults = {
            "JWT_SECRET_KEY": {"voc-secret-key-change-in-production", "secret", "change-me", "default"},
            "OTA_SIGNING_KEY": {"voc_ota_root_signing_key_2026", "secret", "change-me"},
            "ADMIN_API_KEY": {"voc_admin_secret_key_2026", "secret", "change-me"},
            "DEFAULT_DEVICE_TOKEN": {"voc-device-box001-secret-token", "secret", "change-me"},
        }
        for key, bad_vals in insecure_defaults.items():
            val = os.getenv(key, "").strip()
            if val in bad_vals:
                raise RuntimeError(f"CRITICAL: {key} is configured with an insecure default value in production.")
    await connect_db()
    await _init_db_tables()
    load_model()  # โหลด AI Model ตอนเริ่มต้น
    
    # เริ่ม Background Tasks
    purge_task = asyncio.create_task(purge_old_data_task())
    sla_task = asyncio.create_task(sla_escalation_monitor_task())
    downsample_task = asyncio.create_task(downsampling_retention_task())
    watchdog_task = asyncio.create_task(device_offline_watchdog_task())
    
    yield
    
    # ปิดการเชื่อมต่อเมื่อหยุดการทำงาน
    watchdog_task.cancel()
    downsample_task.cancel()
    sla_task.cancel()
    purge_task.cancel()
    await disconnect_db()


app = FastAPI(title="VOC / E-Nose API", lifespan=lifespan)

# ------------------------------------------------------------------
# CORS CONFIGURATION (Restricted to verified origins — W0 Security)
# ------------------------------------------------------------------
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env.strip():
    allowed_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://voc-quality.vercel.app",
        "https://voc-quality.web.app",
        "https://voc-backend-api.onrender.com",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://voc-quality(-[a-z0-9-]+)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# ------------------------------------------------------------------
# SECURITY HEADERS & OPERATIONAL METRICS MIDDLEWARE (Phase 4)
# ------------------------------------------------------------------
_APP_START_TIME = time.time()
_METRICS = {
    "total_requests": 0,
    "total_errors": 0,
    "ingest_requests": 0,
    "total_latency_ms": 0.0,
}

@app.middleware("http")
async def security_and_metrics_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = None
    try:
        response = await call_next(request)
        if response.status_code >= 500:
            _METRICS["total_errors"] += 1
        return response
    except Exception:
        _METRICS["total_errors"] += 1
        raise
    finally:
        duration_ms = (time.perf_counter() - start) * 1000.0
        _METRICS["total_requests"] += 1
        _METRICS["total_latency_ms"] += duration_ms
        if request.url.path in ("/api/ingest", "/api/readings"):
            _METRICS["ingest_requests"] += 1
        if response is not None:
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=()"
            response.headers["Content-Security-Policy"] = "frame-ancestors 'none'; object-src 'none'; base-uri 'none'"
            response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"


# ------------------------------------------------------------------
# APPEND-ONLY AUDIT TRAIL HELPER (Phase W1)
# ------------------------------------------------------------------
async def record_audit_event(
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    user: Optional[dict] = None,
    status: str = "SUCCESS",
    ip: Optional[str] = None,
):
    """
    บันทึกเหตุการณ์ลงใน Append-only Audit Trail (Phase W1)
    ไม่สามารถแก้ไขหรือลบย้อนหลังได้ เพื่อการตรวจสอบย้อนหลัง 5 ปี
    """
    entry = {
        "id": len(_in_memory_audit_events) + 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": user.get("id") if user else None,
        "username": user.get("username") if user else "anonymous",
        "role": user.get("role") if user else "system",
        "ip_address": ip or "0.0.0.0",
        "action": action,
        "resource_type": resource_type,
        "resource_id": str(resource_id) if resource_id is not None else None,
        "details": details or {},
        "status": status,
    }
    _in_memory_audit_events.insert(0, entry)
    if len(_in_memory_audit_events) > 1000:
        _in_memory_audit_events.pop()

    try:
        pool = await get_pool()
        if pool:
            await pool.execute(
                """
                INSERT INTO audit_events 
                    (user_id, username, role, ip_address, action, resource_type, resource_id, details, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
                """,
                entry["user_id"], entry["username"], entry["role"], entry["ip_address"],
                entry["action"], entry["resource_type"], entry["resource_id"],
                json.dumps(entry["details"], ensure_ascii=False), entry["status"]
            )
    except Exception as e:
        print(f"[Audit Trail DB Error] {e}")


# ------------------------------------------------------------------
# AUTHENTICATION & RBAC UTILITIES (Phase W1)
# ------------------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def get_current_user_optional(
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> Optional[dict]:
    """ดึงข้อมูลผู้ใช้จาก JWT Token ถ้ามี (ไม่บังคับ — คืน None ถ้าไม่มีหรือหมดอายุ)"""
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    
    if not token:
        return None

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        username = payload.get("username")
        role = payload.get("role")
        if not user_id or not username or not role:
            return None
        user = {
            "id": int(user_id),
            "username": username,
            "role": role,
            "full_name": payload.get("full_name", username),
            "site": payload.get("site", "Main Plant"),
        }
        pool = await get_pool()
        if pool:
            row = await pool.fetchrow(
                "SELECT is_active, role, site, assigned_boxes FROM users WHERE id = $1", user["id"]
            )
            if not row or not row["is_active"]:
                return None
            user["role"] = row["role"]
            user["site"] = row["site"]
            user["assigned_boxes"] = list(row["assigned_boxes"] or [])
        else:
            in_mem = _in_memory_users.get(username.lower())
            if in_mem:
                user["role"] = in_mem.get("role", role)
                user["site"] = in_mem.get("site", "Main Plant")
                user["assigned_boxes"] = list(in_mem.get("assigned_boxes") or ["BOX-001", "BOX-002"])
            else:
                user["assigned_boxes"] = ["BOX-001", "BOX-002"]
        return user
    except Exception:
        return None


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> dict:
    """ดึงข้อมูลผู้ใช้จาก JWT Token (บังคับ — คืน 401 Unauthorized ถ้าไม่มีสิทธิ์)"""
    user = await get_current_user_optional(request, authorization)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(*allowed_roles: str):
    """Dependency สำหรับตรวจสอบ Role-based Access Control (RBAC)"""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Role '{current_user['role']}' does not have permission. Allowed roles: {list(allowed_roles)}"
            )
        return current_user
    return role_checker


def require_box_access(user: dict, box_id: str) -> None:
    """Admin is global; all other users need an explicit box assignment."""
    if user["role"] == "admin":
        return
    if box_id not in (user.get("assigned_boxes") or []):
        raise HTTPException(status_code=403, detail="Forbidden: user is not assigned to this box.")


async def _verify_device_auth(box_id: str, device_token: Optional[str], pool) -> bool:
    """ตรวจสอบความถูกต้องของ Device Token สำหรับ ESP32 Ingest"""
    if not device_token:
        return False
    # รองรับทั้ง DEFAULT_DEVICE_TOKEN จาก env และ DEVICE_TOKEN มาตรฐานใน secrets.h ของบอร์ดทดลอง
    if device_token in (DEFAULT_DEVICE_TOKEN, "voc_device_secret_2026", "voc-device-box001-secret-token"):
        return True
    if pool:
        try:
            token_hash = await pool.fetchval(
                "SELECT device_token_hash FROM devices WHERE box_id = $1 AND is_active = TRUE",
                box_id
            )
            if token_hash and verify_password(device_token, token_hash):
                return True
        except Exception as e:
            print(f"[Device Auth Error] {e}")
    return False


# ------------------------------------------------------------------
# ADMIN AUTHENTICATION GUARD (Phase W0 + W1 Integrated)
# ------------------------------------------------------------------
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")

async def verify_admin_key(
    request: Request,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    ตรวจสอบสิทธิ์ Admin สำหรับ API ที่มีความเสี่ยงสูง:
    1. รองรับ Header 'X-Admin-Key' สำหรับ Script / CI / Tooling
    2. รองรับ JWT Bearer Token ของ User ที่มี Role 'admin'
    """
    token = None
    if x_admin_key:
        token = x_admin_key.strip()
    elif authorization and not authorization.lower().startswith("bearer "):
        token = authorization.strip()

    # ตรวจสอบกับ ADMIN_API_KEY
    if ADMIN_API_KEY and token and secrets.compare_digest(token, ADMIN_API_KEY):
        return True

    # ตรวจสอบกับ JWT User Token
    jwt_user = await get_current_user_optional(request, authorization)
    if jwt_user and jwt_user.get("role") == "admin":
        return True

    if ADMIN_API_KEY or IS_PRODUCTION:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Admin privileges or valid Admin API Key required."
        )

    # ในโหมด Local Development ที่ไม่ได้ตั้ง ADMIN_API_KEY
    print("[SECURITY WARNING] Admin endpoint accessed without configured ADMIN_API_KEY (Running in development mode).")
    return True


from routers.operational import create_operational_router
from routers.line import create_line_router
from routers.emissions import create_emissions_router
from routers.maintenance import create_maintenance_router
from routers.training import create_training_router
from routers.auth import create_auth_router
from routers.alerts import create_alerts_router
from routers.ota import create_ota_router
from routers.exports import create_exports_router

# Register Operational Health & SRE Metrics Router (Phase 6.1 Modularization)
app.include_router(
    create_operational_router(
        get_pool=get_pool,
        app_start_time=_APP_START_TIME,
        metrics=_METRICS,
        in_memory_alerts=_in_memory_alerts,
    )
)


# ==================================================================
# Phase W1: AUTHENTICATION, USER MANAGEMENT & AUDIT TRAIL ENDPOINTS
# ==================================================================
# Auth, Users & Audit Trail — Registered via routers/auth.py (Phase 6.1)
app.include_router(
    create_auth_router(
        get_pool=get_pool,
        get_current_user=get_current_user,
        require_roles=require_roles,
        verify_password=verify_password,
        get_password_hash=get_password_hash,
        create_access_token=create_access_token,
        record_audit_event=record_audit_event,
        check_login_rate_limit=_check_login_rate_limit,
        record_login_failure=_record_login_failure,
        reset_login_failures=_reset_login_failures,
        access_token_expire_minutes=ACCESS_TOKEN_EXPIRE_MINUTES,
        in_memory_users=_in_memory_users,
        in_memory_audit_events=_in_memory_audit_events,
    )
)


@app.post("/api/devices/{box_id}/token")
async def generate_device_token(
    box_id: str,
    request: Request,
    current_user: dict = Depends(require_roles("admin"))
):
    """สร้างหรือสลับ Device Token สำหรับ ESP32 ประจำกล่อง (เฉพาะ Admin)"""
    new_token = f"esp32_{box_id.lower()}_{secrets.token_hex(16)}"
    token_hash = get_password_hash(new_token)
    ip = request.client.host if request.client else "unknown"

    pool = await get_pool()
    if pool:
        await pool.execute(
            """
            INSERT INTO devices (box_id, device_token_hash, status, last_seen)
            VALUES ($1, $2, 'ONLINE', NOW())
            ON CONFLICT (box_id) DO UPDATE SET device_token_hash = EXCLUDED.device_token_hash
            """,
            box_id, token_hash
        )

    await record_audit_event(
        action="GENERATE_DEVICE_TOKEN",
        resource_type="DEVICE",
        resource_id=box_id,
        details={"box_id": box_id},
        user=current_user,
        status="SUCCESS",
        ip=ip
    )

    return {
        "status": "ok",
        "box_id": box_id,
        "token": new_token,
        "message": "Token generated. Copy this token to the ESP32 firmware secrets.h file. It will not be shown again."
    }


# ==================================================================
# CLOUD PULL OTA & SAFETY ROLLBACK SYSTEM
# ==================================================================
OTA_DIR = Path(__file__).parent / "ota_firmware"
OTA_DIR.mkdir(parents=True, exist_ok=True)
OTA_BIN_PATH = OTA_DIR / "latest.bin"
OTA_META_PATH = OTA_DIR / "meta.json"

def _get_ota_signing_key() -> bytes:
    key = os.getenv("OTA_SIGNING_KEY", "").strip()
    if not key:
        if IS_PRODUCTION:
            raise HTTPException(status_code=500, detail="CRITICAL: OTA_SIGNING_KEY is not configured in production.")
        key = "voc_ota_root_signing_key_2026"
    return key.encode()


def _load_ota_meta():
    if OTA_META_PATH.exists():
        try:
            with open(OTA_META_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"available": False, "version": None, "url": ""}

def _save_ota_meta(meta: dict):
    with open(OTA_META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

# OTA Firmware Lifecycle & Model Artifact Governance — Registered via routers/ota.py (Phase 6.1)
app.include_router(
    create_ota_router(
        get_pool=get_pool,
        verify_admin_key=verify_admin_key,
        require_roles=require_roles,
        get_current_user_optional=get_current_user_optional,
        verify_device_auth=_verify_device_auth,
        record_audit_event=record_audit_event,
        log_activity=log_activity,
        get_ota_signing_key=_get_ota_signing_key,
        load_ota_meta=_load_ota_meta,
        save_ota_meta=_save_ota_meta,
        ota_dir=OTA_DIR,
        ota_bin_path=OTA_BIN_PATH,
        ota_meta_path=OTA_META_PATH,
        is_production=IS_PRODUCTION,
    )
)


# ==================================================================
# SYSTEM & AUDIT LOGS ENDPOINTS
# ==================================================================
@app.get("/api/logs")
async def get_system_logs(
    limit: int = 50,
    current_user: dict = Depends(require_roles("admin", "engineer"))
):
    """ดึง Log การทำงานของระบบย้อนหลัง ไม่หายแม้ reload หน้าเว็บ (สิทธิ์ Admin, Engineer)"""
    pool = await get_pool()
    if not pool:
        return []
    try:
        rows = await pool.fetch(
            """
            SELECT id, category, action, status, detail,
                   to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI:SS') AS timestamp
            FROM system_logs
            ORDER BY id DESC
            LIMIT $1
            """,
            limit
        )
        return [dict(r) for r in rows]
    except Exception:
        return []

class LogCreate(BaseModel):
    category: str
    action: str
    status: Optional[str] = "INFO"
    detail: Optional[str] = ""

@app.post("/api/logs")
async def create_system_log(
    body: LogCreate,
    current_user: dict = Depends(require_roles("admin", "engineer", "operator"))
):
    """บันทึก Log การกระทำจากหน้าเว็บ (สิทธิ์ Authenticated Staff)"""
    await log_activity(body.category, body.action, body.status, body.detail)
    return {"status": "ok"}


# ==================================================================
# THRESHOLDS ENDPOINTS — sync กับ Settings หน้าเว็บ
# ==================================================================

@app.get("/api/thresholds")
async def get_thresholds():
    """ดึง threshold ปัจจุบันที่ backend ใช้สร้าง Alert"""
    return THRESHOLDS


class ThresholdUpdate(BaseModel):
    tvoc_warn:     Optional[float] = None
    tvoc_critical: Optional[float] = None
    pm25_warn:     Optional[float] = None
    pm25_critical: Optional[float] = None
    eco2_warn:     Optional[float] = None
    eco2_critical: Optional[float] = None


@app.patch("/api/thresholds")
async def update_thresholds(
    body: ThresholdUpdate,
    current_user: dict = Depends(require_roles("admin"))
):
    """อัปเดต threshold — สิทธิ์ Admin เท่านั้น เมื่อกดบันทึกจากหน้า Settings"""
    global THRESHOLDS
    if body.tvoc_warn     is not None: THRESHOLDS["tvoc"]["warn"]     = body.tvoc_warn
    if body.tvoc_critical is not None: THRESHOLDS["tvoc"]["critical"] = body.tvoc_critical
    if body.pm25_warn     is not None: THRESHOLDS["pm25"]["warn"]     = body.pm25_warn
    if body.pm25_critical is not None: THRESHOLDS["pm25"]["critical"] = body.pm25_critical
    if body.eco2_warn     is not None: THRESHOLDS["eco2"]["warn"]     = body.eco2_warn
    if body.eco2_critical is not None: THRESHOLDS["eco2"]["critical"] = body.eco2_critical
    return {"status": "ok", "thresholds": THRESHOLDS}


# ==================================================================
# MODEL ENDPOINTS
# ==================================================================

@app.get("/api/model/status")
async def model_status():
    """สถานะ AI Model ที่โหลดอยู่"""
    import os
    from model_loader import MODEL_PATH
    return {
        "loaded":     is_loaded(),
        "model_path": MODEL_PATH,
        "file_exists": os.path.exists(MODEL_PATH),
    }


@app.post("/api/model/reload")
async def reload_model(_auth: bool = Depends(verify_admin_key)):
    """โหลด Model ใหม่จากไฟล์ .pkl โดยไม่ต้อง restart backend"""
    load_model()
    return {
        "status":  "ok" if is_loaded() else "warning",
        "loaded":  is_loaded(),
        "message": "Model reloaded successfully" if is_loaded() else "Model file not found — running in mock mode",
    }


@app.post("/api/model/upload")
async def upload_model(
    _auth: bool = Depends(verify_admin_key),
):
    """Raw pickle is executable Python data and is never accepted over HTTP."""
    raise HTTPException(
        status_code=410,
        detail="Raw pickle upload is disabled. Register a signed CI-produced artifact instead.",
    )


# ==================================================================
# ACTIVE SESSION — ESP32 ดึง session_id ล่าสุดอัตโนมัติ
# ==================================================================

@app.get("/api/active-session")
async def get_active_session(box_id: str = "BOX-001"):
    """
    คืน session ที่กำลัง active อยู่ (started_at มีค่า, ended_at เป็น NULL)
    ESP32 เรียก endpoint นี้ก่อนส่งข้อมูล เพื่อแนบ session_id อัตโนมัติ
    """
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT id, box_id, label, note, started_at
        FROM training_sessions
        WHERE box_id = $1 AND ended_at IS NULL
        ORDER BY started_at DESC
        LIMIT 1
        """,
        box_id,
    )
    if not row:
        return {"active": False, "session_id": None, "label": None}
    return {
        "active":     True,
        "session_id": row["id"],
        "label":      row["label"],
        "note":       row["note"],
        "started_at": str(row["started_at"]),
    }


# ==================================================================
# DASHBOARD ENDPOINTS
# ==================================================================

# Electrical/output bounds from the individual sensor datasheets or from the
# ADC interface.  They flag impossible frames; they are deliberately *not*
# exposure limits and must not be interpreted as gas concentrations.
SENSOR_VALIDATION_RULES = {
    "temp":    {"label": "DHT22 temperature", "min": -40, "max": 80, "unit": "°C", "source": "DHT22 datasheet"},
    "rh":      {"label": "DHT22 humidity", "min": 0, "max": 100, "unit": "%RH", "source": "DHT22 datasheet"},
    "pm25":    {"label": "PMS5003 PM2.5", "min": 0, "max": 1000, "unit": "µg/m³", "source": "Plantower PMS5003 range"},
    "tvoc":    {"label": "CCS811 TVOC", "min": 0, "max": 1187, "unit": "ppb", "source": "ams CCS811 datasheet"},
    "eco2":    {"label": "CCS811 eCO₂", "min": 400, "max": 8192, "unit": "ppm", "source": "ams CCS811 datasheet"},
    "mq2":     {"label": "MQ-2 ADC", "min": 5, "max": 4090, "unit": "ADC", "source": "ESP32 12-bit ADC / rail check"},
    "mq3":     {"label": "MQ-3 ADC", "min": 5, "max": 4090, "unit": "ADC", "source": "ESP32 12-bit ADC / rail check"},
    "mq135":   {"label": "MQ-135 ADC", "min": 5, "max": 4090, "unit": "ADC", "source": "ESP32 12-bit ADC / rail check"},
    "mq8":     {"label": "MQ-8 ADC", "min": 5, "max": 4090, "unit": "ADC", "source": "ESP32 12-bit ADC / rail check"},
    "mics_co": {"label": "MiCS-6814 CO channel", "min": 0, "max": 3300, "unit": "mV", "source": "ADS1115/3.3V interface"},
    "no2":     {"label": "MiCS-6814 NO₂ channel", "min": 0, "max": 3300, "unit": "mV", "source": "ADS1115/3.3V interface"},
    "nh3":     {"label": "MiCS-6814 NH₃ channel", "min": 0, "max": 3300, "unit": "mV", "source": "ADS1115/3.3V interface"},
}

async def _sensor_health(pool, box_id: str, reading_row=None):
    columns = list(SENSOR_VALIDATION_RULES)
    rows = await pool.fetch(
        f"SELECT {', '.join(columns)}, recorded_at FROM sensor_readings WHERE box_id = $1 ORDER BY recorded_at DESC LIMIT 12", box_id
    )
    latest = dict(reading_row) if reading_row else (dict(rows[0]) if rows else {})
    output, issues = {}, []
    for field, rule in SENSOR_VALIDATION_RULES.items():
        value = latest.get(field)
        samples = [float(r[field]) for r in rows if r[field] is not None]
        state, reason = "OK", "อยู่ในขอบเขตสเปก/อินเทอร์เฟซ"
        if value is None:
            state, reason = "UNKNOWN", "ไม่มีข้อมูลล่าสุด"
        elif not rule["min"] <= float(value) <= rule["max"]:
            state, reason = "FAULT", f"{value} นอกช่วง {rule['min']}–{rule['max']} {rule['unit']}"
        elif len(samples) >= 5:
            mean = sum(samples) / len(samples)
            noise = (sum((x - mean) ** 2 for x in samples) / len(samples)) ** 0.5
            if mean and noise / abs(mean) > 0.25:
                state, reason = "WARNING", "สัญญาณแกว่งสูงกว่า 25% ใน 12 ตัวอย่างล่าสุด"
        output[field] = {"state": state, "reason": reason, "value": value, "rule": rule}
        if state != "OK": issues.append({"sensor": field, "state": state, "reason": reason})
    stale = bool(rows and (time.time() - rows[0]["recorded_at"].timestamp()) > DEVICE_OFFLINE_THRESHOLD_SEC)
    if stale: issues.append({"sensor": "device", "state": "STALE", "reason": f"ไม่มีข้อมูลใหม่เกิน {int(DEVICE_OFFLINE_THRESHOLD_SEC)} วินาที"})
    return {"checked_at": time.time(), "stale": stale, "sensors": output, "issues": issues}

@app.get("/api/sensor-health")
async def get_sensor_health(box_id: str = "BOX-001"):
    pool = await get_pool()
    return await _sensor_health(pool, box_id)

@app.get("/api/sensor-runtime")
async def get_sensor_runtime(box_id: str = "BOX-001", limit: int = 100):
    """Operating-hour counters plus recent persisted status snapshots for maintenance."""
    pool = await get_pool()
    counters = await pool.fetch("SELECT sensor_id, online_seconds, last_seen FROM sensor_runtime WHERE box_id=$1 ORDER BY sensor_id", box_id)
    logs = await pool.fetch("SELECT recorded_at, device_uptime_sec, statuses FROM sensor_status_logs WHERE box_id=$1 ORDER BY recorded_at DESC LIMIT $2", box_id, min(max(limit, 1), 500))
    return {"box_id": box_id, "sensors": [dict(x) for x in counters], "logs": [dict(x) for x in logs]}

class CalibrationRequest(BaseModel):
    box_id: str = "BOX-001"

@app.post("/api/calibration/request")
async def request_calibration(
    body: CalibrationRequest,
    request: Request,
    current_user: dict = Depends(require_roles("admin", "engineer"))
):
    """
    สร้างคำสั่ง Clean-air Baseline Calibration สำหรับ ESP32
    สิทธิ์ตาม Phase W1: เฉพาะ Engineer หรือ Admin ที่มีสิทธิ์ประจำกล่องเท่านั้น
    """
    require_box_access(current_user, body.box_id)

    ip = request.client.host if request.client else "unknown"
    pool = await get_pool()
    calibration_id = 0
    if pool:
        calibration_id = await pool.fetchval(
            "INSERT INTO sensor_calibrations (box_id, status, detail) VALUES ($1, 'PENDING', 'Awaiting ESP32 clean-air capture') RETURNING id", body.box_id
        )
        await pool.execute(
            "INSERT INTO device_commands (box_id, action, payload) VALUES ($1, 'CALIBRATE_BASELINE', $2::jsonb)",
            body.box_id, json.dumps({"calibration_id": calibration_id})
        )

    await record_audit_event(
        action="REQUEST_CALIBRATION",
        resource_type="CALIBRATION",
        resource_id=str(calibration_id),
        details={"box_id": body.box_id},
        user=current_user,
        status="SUCCESS",
        ip=ip
    )
    return {"status": "queued", "calibration_id": calibration_id, "message": "รอ ESP32 รับคำสั่ง (ต้องวางเครื่องในอากาศสะอาด)"}

_in_memory_device_commands: list[dict] = []


class FanBoostBody(BaseModel):
    duration_seconds: int = 300
    action: str = "FAN_BOOST"


# สถานะพัดลม 3 ตัว (GPIO 25, GPIO 26, GPIO 4) และข้อมูลเสริมสำหรับการทดลอง
_box_fan_states: dict = {
    "BOX-001": {
        "fan1": True,        # พัดลมตัวที่ 1 (IN1 - GPIO 25): ดูดไอสารเข้า / Transfer Fan
        "fan2": True,        # พัดลมตัวที่ 2 (IN2 - GPIO 26): ระบายอากาศออก / Exhaust Fan
        "fan3": False,       # พัดลมตัวที่ 3 (IN3 - GPIO 4): พัดลมเสริม / Chamber Circulation Fan
        "fan1_pin": 25,
        "fan2_pin": 26,
        "fan3_pin": 4,
        "auto_mode": False,
        "preset": "NORMAL",
        "apply_pending": False,
        "command_id": None,
        "updated_at": None,
    }
}
_box_experiment_extras: dict = {
    "BOX-001": {
        "pm10": None,
    }
}


class ThreeFanControlBody(BaseModel):
    fan1: bool = True
    fan2: bool = True
    fan3: bool = False
    auto_mode: bool = False
    preset: Optional[str] = "CUSTOM"


@app.get("/api/devices/{box_id}/fans")
async def get_device_three_fans(box_id: str):
    """ดึงสถานะพัดลมทั้ง 3 ตัว (GPIO 25, GPIO 26, GPIO 4) สำหรับมอนิเตอร์บนหน้าเว็บ"""
    pool = await get_pool()
    if pool:
        try:
            row = await pool.fetchrow("SELECT state FROM maintenance_state WHERE key = $1", f"fans:{box_id}")
            if row and row["state"]:
                db_state = json.loads(row["state"]) if isinstance(row["state"], str) else dict(row["state"])
                _box_fan_states[box_id] = db_state
        except Exception:
            pass

    state = _box_fan_states.get(box_id) or {
        "fan1": True,
        "fan2": True,
        "fan3": False,
        "fan1_pin": 25,
        "fan2_pin": 26,
        "fan3_pin": 4,
        "auto_mode": False,
        "preset": "NORMAL",
        "apply_pending": False,
        "command_id": None,
        "updated_at": None,
    }
    return {
        "box_id": box_id,
        **state,
        "pm10": _box_experiment_extras.get(box_id, {}).get("pm10"),
    }


@app.post("/api/devices/{box_id}/fans")
async def set_device_three_fans(
    box_id: str,
    body: ThreeFanControlBody,
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
):
    """
    สั่งเปิด-ปิดพัดลมทั้ง 3 ตัว (Fan 1: GPIO 25, Fan 2: GPIO 26, Fan 3: GPIO 4) ผ่านหน้าเว็บ
    บันทึกสถานะลงฐานข้อมูล PostgreSQL ถาวร (ไม่รีเซ็ตเมื่อรีเฟรชหน้าเว็บหรือรีสตาร์ตเซิร์ฟเวอร์)
    และส่งคำสั่งไปยัง ESP32 ทั้งทาง /api/ingest Piggyback (ภายใน 1-3 วินาที) และ /api/device-command
    """
    user = await get_current_user_optional(request, authorization)
    if user and user.get("role") not in ("admin", "engineer", "operator"):
        raise HTTPException(status_code=403, detail="Insufficient role permissions to control fans")

    action = "FAN_NORMAL" if body.auto_mode else "SET_FANS"
    cmd_payload = {
        "fan1": bool(body.fan1),
        "fan2": bool(body.fan2),
        "fan3": bool(body.fan3),
        "auto_mode": bool(body.auto_mode),
        "preset": body.preset or "CUSTOM",
        "requested_by": (user or {}).get("username", "lab_experimenter"),
    }

    pool = await get_pool()
    cmd_id = None
    if pool:
        try:
            row = await pool.fetchrow(
                "INSERT INTO device_commands (box_id, action, payload) VALUES ($1, $2, $3::jsonb) RETURNING id",
                box_id, action, json.dumps(cmd_payload),
            )
            cmd_id = row["id"]
        except Exception as e:
            print(f"[Fan Control DB Queue Notice] {e}")
    if cmd_id is None:
        cmd_id = len(_in_memory_device_commands) + 1
        _in_memory_device_commands.append({
            "id": cmd_id,
            "box_id": box_id,
            "action": action,
            "payload": cmd_payload,
            "status": "PENDING",
        })

    now_iso = datetime.now(timezone.utc).isoformat()
    _box_fan_states[box_id] = {
        "fan1": bool(body.fan1),
        "fan2": bool(body.fan2),
        "fan3": bool(body.fan3),
        "fan1_pin": 25,
        "fan2_pin": 26,
        "fan3_pin": 4,
        "auto_mode": bool(body.auto_mode),
        "preset": body.preset or "CUSTOM",
        "apply_pending": True,
        "command_id": cmd_id,
        "updated_at": now_iso,
    }
    if pool:
        try:
            await pool.execute(
                """
                INSERT INTO maintenance_state (key, state, updated_at)
                VALUES ($1, $2::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
                """,
                f"fans:{box_id}", json.dumps(_box_fan_states[box_id]),
            )
        except Exception as e:
            print(f"[Fan State Persist Notice] {e}")

    _dashboard_cache.clear()

    return {
        "status": "queued",
        "box_id": box_id,
        "command_id": cmd_id,
        "fans": _box_fan_states[box_id],
    }


class SystemConfigUpdateBody(BaseModel):
    thresholds: Optional[dict] = None
    lineConfig: Optional[dict] = None
    telegramConfig: Optional[dict] = None
    emailConfig: Optional[dict] = None
    sla: Optional[dict] = None
    generalConfig: Optional[dict] = None


@app.get("/api/settings/config")
async def get_system_settings_config():
    """ดึงค่าตั้งค่าระบบทั้งหมด (Thresholds, Notifications, SLA, General) จากฐานข้อมูลถาวร"""
    pool = await get_pool()
    if pool:
        try:
            row = await pool.fetchrow("SELECT state FROM maintenance_state WHERE key = 'system_config'")
            if row and row["state"]:
                db_cfg = json.loads(row["state"]) if isinstance(row["state"], str) else dict(row["state"])
                _SYSTEM_CONFIG_STATE.update(db_cfg)
                _sync_thresholds_from_config(_SYSTEM_CONFIG_STATE)
        except Exception:
            pass
    return {
        "status": "ok",
        "config": _SYSTEM_CONFIG_STATE,
        "active_thresholds": THRESHOLDS,
    }


@app.put("/api/settings/config")
async def update_system_settings_config(
    body: SystemConfigUpdateBody,
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """บันทึกค่าตั้งค่าระบบทั้งหมดลงฐานข้อมูล PostgreSQL ถาวร และอัปเดตเกณฑ์แจ้งเตือน (THRESHOLDS) ทันที"""
    user = await get_current_user_optional(request, authorization)
    if user and user.get("role") not in ("admin", "engineer", "operator"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to update system settings")

    if body.thresholds is not None:
        _SYSTEM_CONFIG_STATE["thresholds"] = body.thresholds
    if body.lineConfig is not None:
        _SYSTEM_CONFIG_STATE["lineConfig"] = body.lineConfig
    if body.telegramConfig is not None:
        _SYSTEM_CONFIG_STATE["telegramConfig"] = body.telegramConfig
    if body.emailConfig is not None:
        _SYSTEM_CONFIG_STATE["emailConfig"] = body.emailConfig
    if body.sla is not None:
        _SYSTEM_CONFIG_STATE["sla"] = body.sla
    if body.generalConfig is not None:
        _SYSTEM_CONFIG_STATE["generalConfig"] = body.generalConfig

    _SYSTEM_CONFIG_STATE["updated_at"] = datetime.now(timezone.utc).isoformat()
    _sync_thresholds_from_config(_SYSTEM_CONFIG_STATE)

    pool = await get_pool()
    if pool:
        try:
            await pool.execute(
                """
                INSERT INTO maintenance_state (key, state, updated_at)
                VALUES ('system_config', $1::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
                """,
                json.dumps(_SYSTEM_CONFIG_STATE),
            )
        except Exception as e:
            print(f"[System Config DB Save Notice] {e}")

    await log_activity(
        "SETTINGS",
        "UPDATE_SYSTEM_CONFIG",
        "SUCCESS",
        f"Updated system settings by {(user or {}).get('username', 'web_admin')}",
    )

    return {
        "status": "saved",
        "config": _SYSTEM_CONFIG_STATE,
        "active_thresholds": THRESHOLDS,
    }


@app.get("/api/experiment/persisted-state")
async def get_persisted_experiment_state():
    """ดึงข้อมูลตารางบันทึกผลการทดลอง (ตารางที่ 2, 3, 4.1, 5) และค่าฟอร์มที่บันทึกไว้ในฐานข้อมูล"""
    pool = await get_pool()
    if pool:
        try:
            row = await pool.fetchrow("SELECT state FROM maintenance_state WHERE key = 'experiment_user_state'")
            if row and row["state"]:
                st = json.loads(row["state"]) if isinstance(row["state"], str) else dict(row["state"])
                return {"status": "ok", "state": st}
        except Exception:
            pass
    return {"status": "ok", "state": None}


@app.put("/api/experiment/persisted-state")
async def save_persisted_experiment_state(request: Request):
    """บันทึกข้อมูลตารางบันทึกผลการทดลองและค่าฟอร์มการทดลองลงฐานข้อมูลถาวร"""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    pool = await get_pool()
    if pool:
        try:
            await pool.execute(
                """
                INSERT INTO maintenance_state (key, state, updated_at)
                VALUES ('experiment_user_state', $1::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
                """,
                json.dumps(payload),
            )
        except Exception as e:
            print(f"[Experiment State Save Notice] {e}")
    return {"status": "saved"}


@app.post("/api/devices/{box_id}/fan-boost")
async def trigger_device_fan_boost(
    box_id: str,
    body: FanBoostBody,
    request: Request,
    current_user: dict = Depends(require_roles("admin", "engineer", "operator")),
):
    """
    Queue an exhaust fan boost (or normal return) actuator command for a hardware box.
    ESP32 polls /api/device-command and executes GPIO relay actuation.
    """
    require_box_access(current_user, box_id)
    action = body.action if body.action in ("FAN_BOOST", "FAN_NORMAL") else "FAN_BOOST"
    duration_sec = max(30, min(int(body.duration_seconds), 3600))
    payload = {
        "duration_seconds": duration_sec,
        "requested_by": current_user.get("username", "unknown"),
    }
    ip = request.client.host if request.client else "unknown"

    pool = await get_pool()
    cmd_id = None
    if pool:
        row = await pool.fetchrow(
            "INSERT INTO device_commands (box_id, action, payload) VALUES ($1, $2, $3::jsonb) RETURNING id",
            box_id, action, json.dumps(payload),
        )
        cmd_id = row["id"]
    else:
        cmd_id = len(_in_memory_device_commands) + 1
        _in_memory_device_commands.append({
            "id": cmd_id,
            "box_id": box_id,
            "action": action,
            "payload": payload,
            "status": "PENDING",
        })

    await record_audit_event(
        action=f"DEVICE_{action}_QUEUED",
        resource_type="DEVICE",
        resource_id=box_id,
        details={"command_id": cmd_id, "action": action, "duration_seconds": duration_sec},
        user=current_user,
        status="SUCCESS",
        ip=ip,
    )
    return {
        "status": "queued",
        "command_id": cmd_id,
        "box_id": box_id,
        "action": action,
        "duration_seconds": duration_sec,
    }


@app.get("/api/device-command")
async def get_device_command(box_id: str):
    pool = await get_pool()
    if pool:
        # DELIVERED remains eligible until the device posts its report; this makes
        # calibration and fan actuation reliable across transient Wi-Fi failures.
        row = await pool.fetchrow(
            "SELECT id, action, payload FROM device_commands WHERE box_id=$1 AND status IN ('PENDING','DELIVERED') ORDER BY id LIMIT 1",
            box_id,
        )
        if not row:
            return {"command": None}
        await pool.execute("UPDATE device_commands SET status='DELIVERED' WHERE id=$1", row["id"])
        raw_payload = row["payload"]
        parsed_payload = json.loads(raw_payload) if isinstance(raw_payload, str) else dict(raw_payload or {})
        return {"command": {"id": row["id"], "action": row["action"], **parsed_payload}}

    for cmd in _in_memory_device_commands:
        if cmd["box_id"] == box_id and cmd["status"] in ("PENDING", "DELIVERED"):
            cmd["status"] = "DELIVERED"
            return {"command": {"id": cmd["id"], "action": cmd["action"], **cmd["payload"]}}
    return {"command": None}


class DeviceCommandAckBody(BaseModel):
    box_id: str
    status: str = "COMPLETE"
    detail: str = ""


@app.post("/api/device-command/{command_id}/ack")
async def ack_device_command(command_id: int, body: DeviceCommandAckBody):
    """Allow ESP32 firmware to acknowledge execution of a queued command (e.g., FAN_BOOST)."""
    final_status = body.status if body.status in ("COMPLETE", "FAILED", "REJECTED") else "COMPLETE"
    pool = await get_pool()
    if pool:
        await pool.execute(
            "UPDATE device_commands SET status=$1, completed_at=NOW(), result=$2::jsonb WHERE id=$3 AND box_id=$4",
            final_status,
            json.dumps({"detail": body.detail}),
            command_id,
            body.box_id,
        )
    else:
        for cmd in _in_memory_device_commands:
            if cmd["id"] == command_id and cmd["box_id"] == body.box_id:
                cmd["status"] = final_status
                cmd["detail"] = body.detail
                break
    return {"status": final_status.lower(), "command_id": command_id}

class CalibrationReport(BaseModel):
    box_id: str
    calibration_id: int
    baselines: dict
    mq3_ready: bool = False
    detail: str = ""

@app.post("/api/calibration/report")
async def calibration_report(body: CalibrationReport):
    pool = await get_pool()
    status = "COMPLETE" if body.mq3_ready else "REJECTED"
    detail = body.detail if body.mq3_ready else "Rejected: MQ-3 has not completed its required 48-hour conditioning period."
    await pool.execute("UPDATE sensor_calibrations SET status=$1, completed_at=NOW(), baselines=$2::jsonb, detail=$3 WHERE id=$4 AND box_id=$5", status, json.dumps(body.baselines), detail, body.calibration_id, body.box_id)
    await pool.execute("UPDATE device_commands SET status=$1, completed_at=NOW(), result=$2::jsonb WHERE box_id=$3 AND payload->>'calibration_id'=$4", status, json.dumps(body.baselines), body.box_id, str(body.calibration_id))
    return {"status": status.lower()}

@app.get("/api/calibration/{calibration_id}")
async def get_calibration(calibration_id: int):
    pool = await get_pool()
    row = await pool.fetchrow("SELECT id, box_id, status, baselines, detail, requested_at, completed_at FROM sensor_calibrations WHERE id=$1", calibration_id)
    if not row: raise HTTPException(status_code=404, detail="Calibration not found")
    return dict(row)

_dashboard_cache = {}

@app.get("/api/dashboard/latest")
async def get_dashboard_latest(
    box_id: str = "BOX-001",
    include_alerts: bool = False,
    include_history: Optional[str] = None
):
    now = time.time()
    cache_key = f"{box_id}_{include_alerts}_{include_history}"
    if cache_key in _dashboard_cache:
        cached_time, cached_val = _dashboard_cache[cache_key]
        if now - cached_time < 2.0:
            return cached_val

    pool = await get_pool()
    if not pool:
        # If DB is offline, return explicit OFFLINE & degraded state — NEVER fabricate "ONLINE" or "SAFE"
        result = {
            "box_id": box_id,
            "status": "OFFLINE",
            "is_online": False,
            "is_stale": True,
            "data_age_seconds": None,
            "recorded_at": None,
            "last_seen": None,
            "last_seen_age_seconds": None,
            "firmware": "Unknown",
            "model_version": "v2.1",
            "ai_model_loaded": is_loaded(),
            "environment": None,
            "sensors": None,
            "ai_detection": None,
            "sensor_health": {
                "checked_at": int(now),
                "stale": True,
                "sensors": {},
                "issues": [{"sensor": "database", "state": "OFFLINE", "reason": "ฐานข้อมูลออฟไลน์ ไม่สามารถดึงข้อมูลเซนเซอร์ล่าสุดได้"}]
            }
        }
        if include_alerts:
            result["alerts"] = []
        if include_history:
            result["history"] = []
        _dashboard_cache[cache_key] = (now, result)
        return result

    device_row = await pool.fetchrow("SELECT * FROM devices WHERE box_id = $1", box_id)
    if not device_row:
        raise HTTPException(status_code=404, detail="Device not found")

    reading_row = await pool.fetchrow(
        "SELECT * FROM sensor_readings WHERE box_id = $1 ORDER BY recorded_at DESC LIMIT 1", box_id
    )
    prediction_row = await pool.fetchrow(
        "SELECT prediction, confidence FROM ai_predictions WHERE box_id = $1 ORDER BY predicted_at DESC LIMIT 1", box_id
    )

    alerts_list = None
    if include_alerts:
        try:
            a_rows = await pool.fetch(
                """
                SELECT id, box_id, level, message, status,
                       to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'HH24:MI:SS') AS time,
                       COALESCE(EXTRACT(EPOCH FROM (sla_deadline - NOW()))::int, 0) AS remaining_sla_seconds
                FROM alerts
                WHERE box_id = $1
                ORDER BY created_at DESC LIMIT 5
                """,
                box_id
            )
            alerts_list = [dict(r) for r in a_rows]
        except Exception:
            alerts_list = []

    history_list = None
    if include_history:
        try:
            range_map = {"15m": "15 minutes", "1h": "1 hour", "24h": "24 hours"}
            interval = range_map.get(include_history, "24 hours")
            h_rows = await pool.fetch(
                f"""
                SELECT to_char(recorded_at AT TIME ZONE 'Asia/Bangkok', 'HH24:MI') AS time,
                       tvoc, pm25
                FROM sensor_readings
                WHERE box_id = $1 AND recorded_at >= NOW() - INTERVAL '{interval}'
                ORDER BY recorded_at ASC
                """,
                box_id
            )
            history_list = [dict(r) for r in h_rows]
        except Exception:
            history_list = []

    last_seen_dt = device_row.get("last_seen")
    last_seen_iso = last_seen_dt.isoformat() if last_seen_dt else None
    last_seen_age_sec = round(
        (datetime.now(timezone.utc) - (last_seen_dt.replace(tzinfo=timezone.utc) if last_seen_dt.tzinfo is None else last_seen_dt)).total_seconds(),
        1
    ) if last_seen_dt else None

    is_device_online = bool(last_seen_age_sec is not None and last_seen_age_sec <= DEVICE_OFFLINE_THRESHOLD_SEC)
    live_status = "ONLINE" if is_device_online else "OFFLINE"

    recorded_at_dt = reading_row.get("recorded_at") if reading_row else None
    recorded_at_iso = recorded_at_dt.isoformat() if recorded_at_dt else None
    data_age_seconds = round(
        (datetime.now(timezone.utc) - (recorded_at_dt.replace(tzinfo=timezone.utc) if recorded_at_dt.tzinfo is None else recorded_at_dt)).total_seconds(),
        1
    ) if recorded_at_dt else None

    is_stale = (data_age_seconds is None) or (data_age_seconds > DEVICE_OFFLINE_THRESHOLD_SEC)

    try:
        fan_db_row = await pool.fetchrow("SELECT state FROM maintenance_state WHERE key = $1", f"fans:{box_id}")
        if fan_db_row and fan_db_row["state"]:
            _box_fan_states[box_id] = json.loads(fan_db_row["state"]) if isinstance(fan_db_row["state"], str) else dict(fan_db_row["state"])
    except Exception:
        pass

    result = {
        "box_id": device_row["box_id"],
        "status": live_status,
        "is_online": is_device_online,
        "is_stale": is_stale,
        "data_age_seconds": data_age_seconds,
        "recorded_at": recorded_at_iso,
        "last_seen": last_seen_iso,
        "last_seen_age_seconds": last_seen_age_sec,
        "firmware": device_row["firmware"],
        "model_version": device_row["model_ver"],
        "ai_model_loaded": is_loaded(),
        "environment": {
            "temp": float(reading_row["temp"]) if (reading_row and reading_row.get("temp") is not None) else None,
            "rh":   float(reading_row["rh"])   if (reading_row and reading_row.get("rh") is not None) else None,
            "pm25": float(reading_row["pm25"]) if (reading_row and reading_row.get("pm25") is not None) else None,
            "pm10": _box_experiment_extras.get(box_id, {}).get("pm10") if _box_experiment_extras.get(box_id, {}).get("pm10") is not None else (round(float(reading_row["pm25"]) * 1.25, 1) if (reading_row and reading_row.get("pm25") is not None) else None),
            "tvoc": float(reading_row["tvoc"]) if (reading_row and reading_row.get("tvoc") is not None) else None,
            "eco2": float(reading_row["eco2"]) if (reading_row and reading_row.get("eco2") is not None) else None,
        } if reading_row else None,
        "fans": _box_fan_states.get(box_id, _box_fan_states["BOX-001"]),
        "sensors": {
            "mq2":     reading_row["mq2"]     if (reading_row and "mq2" in reading_row) else None,
            "mq3":     reading_row["mq3"]     if reading_row else None,
            "mq135":   reading_row["mq135"]   if reading_row else None,
            "mq8":     reading_row["mq8"]     if reading_row else None,
            "mics_co": reading_row["mics_co"] if reading_row else None,
            "no2":     reading_row["no2"]     if reading_row else None,
            "nh3":     reading_row["nh3"]     if reading_row else None,
        } if reading_row else None,
        "ai_detection": {
            "prediction": prediction_row["prediction"],
            "confidence": float(prediction_row["confidence"]),
        } if prediction_row else None,
        "sensor_health": await _sensor_health(pool, box_id, reading_row),
    }

    if include_alerts:
        result["alerts"] = alerts_list
    if include_history:
        result["history"] = history_list

    _dashboard_cache[cache_key] = (now, result)
    return result


@app.get("/api/dashboard/history")
async def get_dashboard_history(box_id: str = "BOX-001", range: str = "1h"):
    pool = await get_pool()
    range_map = {"15m": "15 minutes", "1h": "1 hour", "24h": "24 hours"}
    interval = range_map.get(range, "1 hour")
    rows = await pool.fetch(
        f"""
        SELECT to_char(recorded_at AT TIME ZONE 'Asia/Bangkok', 'HH24:MI') AS time,
               tvoc, pm25
        FROM sensor_readings
        WHERE box_id = $1 AND recorded_at >= NOW() - INTERVAL '{interval}'
        ORDER BY recorded_at ASC
        """,
        box_id,
    )
    return [dict(r) for r in rows]


# ==================================================================
# Phase W2: ALERT 5-STEP WORKFLOW, SLA ENGINE & WORK ORDERS
# ==================================================================
class WorkOrderCreateRequest(BaseModel):
    box_id: str = "BOX-001"
    task_type: str
    title: str
    checklist: Optional[dict] = {}
    notes: Optional[str] = ""


# Alert Lifecycle & Kiosk Emergency — Registered via routers/alerts.py (Phase 6.1)
app.include_router(
    create_alerts_router(
        get_pool=get_pool,
        require_roles=require_roles,
        require_box_access=require_box_access,
        record_audit_event=record_audit_event,
        in_memory_alerts=_in_memory_alerts,
        kiosk_emergency_pin=KIOSK_EMERGENCY_PIN,
        kiosk_pin_failures=_KIOSK_PIN_FAILURES,
        kiosk_pin_max_attempts=_KIOSK_PIN_MAX_ATTEMPTS,
        kiosk_pin_window_sec=_KIOSK_PIN_WINDOW_SEC,
        get_current_user_optional=get_current_user_optional,
    )
)


# ==================================================================
# Phase W2: MAINTENANCE WORK ORDERS & REAL HARDWARE DIAGNOSTICS
# Registered via routers/maintenance.py (Phase 6.1)
# ==================================================================


@app.get("/api/devices")
async def get_devices():
    pool = await get_pool()
    if pool:
        rows = await pool.fetch(
            """
            SELECT d.box_id AS id,
                   CASE
                       WHEN d.last_seen IS NOT NULL AND d.last_seen > NOW() - INTERVAL '45 seconds' THEN 'ONLINE'
                       ELSE 'OFFLINE'
                   END AS status,
                   d.firmware, d.model_ver AS model,
                   d.last_ota_status, d.last_ota_error,
                   r.wifi_rssi, r.free_heap_kb,
                   CASE
                       WHEN d.last_seen IS NULL THEN 'Never'
                       WHEN d.last_seen > NOW() - INTERVAL '45 seconds' THEN 'Just now'
                       ELSE to_char(d.last_seen AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI')
                   END AS last_seen
            FROM devices d
            LEFT JOIN LATERAL (
                SELECT wifi_rssi, free_heap_kb
                FROM sensor_readings
                WHERE box_id = d.box_id
                ORDER BY recorded_at DESC LIMIT 1
            ) r ON true
            ORDER BY d.box_id
            """
        )
        return [dict(r) for r in rows]
    return [
        {
            "id": "BOX-001",
            "status": "ONLINE",
            "firmware": "1.0.0",
            "model": "v2.1",
            "last_ota_status": "SUCCESS",
            "last_ota_error": None,
            "wifi_rssi": -55,
            "free_heap_kb": 182,
            "last_seen": "Just now",
        },
        {
            "id": "BOX-002",
            "status": "OFFLINE",
            "firmware": "0.9.5",
            "model": "v1.5",
            "last_ota_status": None,
            "last_ota_error": None,
            "wifi_rssi": None,
            "free_heap_kb": None,
            "last_seen": "2 hours ago",
        },
    ]


class DeviceUpdate(BaseModel):
    model_config = {"protected_namespaces": ()}
    firmware: Optional[str] = None
    model_ver: Optional[str] = None
    status: Optional[str] = None


@app.patch("/api/devices/{box_id}")
async def update_device(
    box_id: str,
    body: DeviceUpdate,
    request: Request,
    current_user: dict = Depends(require_roles("admin", "engineer"))
):
    """แก้ไข firmware / model_ver / status ของอุปกรณ์ (เฉพาะ Admin หรือ Engineer ประจำกล่อง)"""
    require_box_access(current_user, box_id)

    ip = request.client.host if request.client else "unknown"
    pool = await get_pool()
    updates = {}
    if body.firmware  is not None: updates["firmware"]  = body.firmware
    if body.model_ver is not None: updates["model_ver"] = body.model_ver
    if body.status    is not None: updates["status"]    = body.status
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    if pool:
        set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates.keys()))
        values = [box_id] + list(updates.values())
        row = await pool.fetchrow(
            f"UPDATE devices SET {set_clause} WHERE box_id = $1 RETURNING box_id AS id, status, firmware, model_ver AS model",
            *values,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Device not found")
        res_data = dict(row)
    else:
        res_data = {"id": box_id, "status": body.status or "ONLINE", "firmware": body.firmware or "1.0.2", "model": body.model_ver or "v2.1"}

    await record_audit_event(
        action="UPDATE_DEVICE",
        resource_type="DEVICE",
        resource_id=box_id,
        details={"updated_fields": list(updates.keys())},
        user=current_user,
        status="SUCCESS",
        ip=ip
    )
    return res_data


@app.delete("/api/devices/{box_id}")
async def delete_device(
    box_id: str,
    request: Request,
    current_user: dict = Depends(require_roles("admin"))
):
    """ลบหรือ Deactivate อุปกรณ์ออกจากระบบ (เฉพาะ Admin ตามสิทธิ์ Phase W1)"""

    ip = request.client.host if request.client else "unknown"
    pool = await get_pool()
    if pool:
        row = await pool.fetchrow(
            "UPDATE devices SET is_active = FALSE WHERE box_id = $1 RETURNING box_id", box_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Device not found")

    await record_audit_event(
        action="DEACTIVATE_DEVICE",
        resource_type="DEVICE",
        resource_id=box_id,
        details={"box_id": box_id},
        user=current_user,
        status="SUCCESS",
        ip=ip
    )
    return {"detail": "deactivated", "box_id": box_id}


# ==================================================================
# DATA INGEST — รับข้อมูลจาก ESP32-S3 + Auto Predict + Auto Alert
# ==================================================================

class IngestPayload(BaseModel):
    box_id: str
    firmware_ver: Optional[str] = None
    device_uptime_sec: Optional[int] = None
    seq_no: Optional[int] = None
    wifi_rssi: Optional[int] = None
    free_heap_kb: Optional[int] = None
    reset_reason: Optional[str] = None
    temp: Optional[float] = None
    rh: Optional[float] = None
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    tvoc: Optional[float] = None
    eco2: Optional[float] = None
    fan1: Optional[bool] = None
    fan2: Optional[bool] = None
    fan3: Optional[bool] = None
    mq2: Optional[int] = None
    mq3: Optional[int] = None
    mq3_spread: Optional[int] = None
    mq3_ready: Optional[bool] = None
    mq135: Optional[int] = None
    mq8: Optional[int] = None
    mics_co: Optional[int] = None
    no2: Optional[int] = None
    nh3: Optional[int] = None
    session_id: Optional[int] = None


# เก็บเวลาล่าสุดที่ยิง alert แต่ละประเภทเพื่อทำ Cooldown
_last_alert_time: dict = {}
_alcohol_confirmations: dict = defaultdict(int)

# MQ-3 / ESP32 signal-quality limits.  0..4095 is the ESP32's 12-bit ADC
# domain; values close to either rail indicate an open/short/saturated input,
# not a concentration that can be quantified from the MQ-3 datasheet curve.
MQ_ADC_MIN = 5
MQ_ADC_MAX = 4090
MQ3_MAX_SPREAD = 150
ALCOHOL_LABELS = {"ALCOHOL", "ETHANOL", "IPA", "แอลกอฮอล", "แอลกอฮอล์"}

def _mq3_quality(payload: IngestPayload) -> tuple[bool, str]:
    if payload.mq3 is None or not MQ_ADC_MIN <= payload.mq3 <= MQ_ADC_MAX:
        return False, "MQ-3 ADC อยู่ที่ขอบช่วง/อยู่นอกช่วง (ตรวจสายสัญญาณหรือแรงดัน)"
    if payload.mq3_spread is not None and payload.mq3_spread > MQ3_MAX_SPREAD:
        return False, "สัญญาณ MQ-3 แกว่งมากเกินไปในรอบอ่านเดียว"
    if payload.mq3_ready is not True:
        return False, "MQ-3 ยังไม่ผ่านเวลา preheat 48 ชั่วโมงตาม datasheet"
    return True, "ok"

async def _auto_alert(pool, box_id: str, reading_id: int, reading: dict, ai_result: dict):
    """สร้าง Alert อัตโนมัติ พร้อมระบบป้องกันการเด้งรัว (Deduplication + Escalation + Hysteresis Auto-Resolve)"""
    now = time.monotonic()
    if str(ai_result.get("prediction", "")).upper() not in ALCOHOL_LABELS:
        # Confirmation must be consecutive; an AMBIENT/other-gas frame resets it.
        _alcohol_confirmations[(box_id, "ALCOHOL")] = 0

    # 1) Threshold-based alerts (TVOC, PM2.5, eCO2)
    for field, limits in THRESHOLDS.items():
        val = reading.get(field)
        if val is None:
            continue

        field_prefix = f"{field.upper()}%"
        key = (box_id, field)

        # Hysteresis / Deadband: เพื่อป้องกัน Sensor Jitter บริเวณขอบเกณฑ์ (เช่น TVOC แกว่ง 199 <-> 201)
        # จะ Auto-resolve ก็ต่อเมื่อค่าตกลงมาต่ำกว่า recovery_limit (90% ของเกณฑ์ warn หรือ -5 หน่วย)
        recovery_limit = (limits["warn"] - 5.0) if field == "pm25" else (limits["warn"] * 0.9)

        if val >= limits["critical"] or val >= limits["warn"]:
            # เช็คว่ามี Active Alert ของเรื่องนี้อยู่แล้วหรือไม่
            active_alert = await pool.fetchrow(
                "SELECT id, level FROM alerts WHERE box_id = $1 AND status = 'Active' AND message LIKE $2 ORDER BY id DESC LIMIT 1",
                box_id, field_prefix
            )

            level = "Critical" if val >= limits["critical"] else "Warning"
            status_text = "สูงเกินวิกฤต" if level == "Critical" else "สูงเกินปกติ"
            limit_val = limits["critical"] if level == "Critical" else limits["warn"]
            msg = f"{field.upper()} {status_text}: {val} (เกณฑ์ {limit_val})"

            if active_alert:
                # ถ้าระดับรุนแรงขึ้นจาก Warning เป็น Critical ให้อัปเกรด Alert เดิม ไม่สร้างแถวใหม่ซ้ำซ้อน
                if active_alert["level"] == "Warning" and level == "Critical":
                    await pool.execute(
                        "UPDATE alerts SET level = $1, message = $2 WHERE id = $3",
                        level, msg, active_alert["id"]
                    )
                    _last_alert_time[key] = now
                # ถ้าระดับเดิมหรือต่ำกว่า ไม่ต้องสร้างใหม่
                continue

            # เช็ค Cooldown ป้องกันยิงถี่เกินไป (อย่างน้อย 60 วินาที)
            if now - _last_alert_time.get(key, 0) < 60:
                continue

            sla_interval = "5 minutes" if level in ("Critical", "High") else "10 minutes"
            await pool.execute(
                f"""
                INSERT INTO alerts (box_id, level, message, status, sla_deadline, source_screen)
                VALUES ($1, $2, $3, 'Active', NOW() + INTERVAL '{sla_interval}', 'Sensor Threshold')
                """,
                box_id, level, msg,
            )
            _last_alert_time[key] = now

        elif val < recovery_limit:
            # เมื่อค่ากลับมาเป็นปกติจริงๆ (ต่ำกว่า recovery deadband) ให้ Auto-resolve alert เดิมที่เป็น Active ทันที
            await pool.execute(
                "UPDATE alerts SET status = 'Resolved', resolved_at = NOW(), resolved_by = 'Auto-Recovery Engine' WHERE box_id = $1 AND status = 'Active' AND message LIKE $2",
                box_id, field_prefix
            )

    # 2) AI-based alert — เมื่อตรวจพบสารอันตราย
    ai_key = (box_id, "AI")
    active_ai = await pool.fetchrow(
        "SELECT id FROM alerts WHERE box_id = $1 AND status = 'Active' AND (message LIKE 'AI%' OR level = 'High') ORDER BY id DESC LIMIT 1",
        box_id
    )

    dangerous_confirmed = ai_result.get("is_dangerous")
    if dangerous_confirmed:
        pred = ai_result["prediction"]
        conf = ai_result["confidence"]

        # MQ-3 is a cross-sensitive MOS sensor.  Require three consecutive,
        # high-confidence, quality-checked alcohol classifications before an
        # alert is emitted; a single raw-ADC spike must never alarm users.
        is_alcohol = str(pred).upper() in ALCOHOL_LABELS
        if is_alcohol:
            quality_ok = ai_result.get("mq3_quality_ok", False)
            if not quality_ok or conf < 80:
                _alcohol_confirmations[(box_id, "ALCOHOL")] = 0
                dangerous_confirmed = False
            else:
                alcohol_key = (box_id, "ALCOHOL")
                _alcohol_confirmations[alcohol_key] += 1
                dangerous_confirmed = _alcohol_confirmations[alcohol_key] >= 3

        # ถ้ามี Active Alert ของ AI เรื่องนี้อยู่แล้ว ไม่สร้างซ้ำ
        if dangerous_confirmed and not active_ai:
            if now - _last_alert_time.get(ai_key, 0) >= 60:
                await pool.execute(
                    """
                    INSERT INTO alerts (box_id, level, message, status, sla_deadline, source_screen)
                    VALUES ($1, 'High', $2, 'Active', NOW() + INTERVAL '5 minutes', 'AI Classifier')
                    """,
                    box_id, f"AI ตรวจพบสาร {pred} (confidence {conf}%)",
                )
                _last_alert_time[ai_key] = now
        elif not dangerous_confirmed and active_ai:
            # A former alcohol alarm must clear if the later frames fail the
            # signal-quality/confirmation gate.
            await pool.execute(
                "UPDATE alerts SET status = 'Resolved' WHERE id = $1",
                active_ai["id"]
            )
    else:
        # เมื่อสภาพอากาศกลับเป็นปกติ (ไม่ใช่สารอันตราย) Auto-resolve AI alert เดิม
        if active_ai:
            await pool.execute(
                "UPDATE alerts SET status = 'Resolved' WHERE id = $1",
                active_ai["id"]
            )

RUNTIME_SENSOR_FIELDS = {
    "dht22": ("temp", "rh"), "ccs811": ("tvoc", "eco2"), "pms5003": ("pm25",),
    "mq2": ("mq2",), "mq3": ("mq3",), "mq8": ("mq8",), "mq135": ("mq135",),
    "mics6814": ("mics_co", "no2", "nh3"),
}

async def _record_sensor_runtime(pool, box_id: str, payload: IngestPayload):
    """Persist actual online time using monotonic ESP32 uptime, not server time."""
    uptime = payload.device_uptime_sec
    if uptime is None or uptime < 0: return
    statuses = {}
    for sensor_id, fields in RUNTIME_SENSOR_FIELDS.items():
        online = all(getattr(payload, field, None) is not None for field in fields)
        previous = await pool.fetchrow("SELECT online_seconds, last_device_uptime FROM sensor_runtime WHERE box_id=$1 AND sensor_id=$2", box_id, sensor_id)
        previous_uptime = previous["last_device_uptime"] if previous else None
        # Negative difference means an ESP32 reboot. Cap at two minutes so a
        # long telemetry outage cannot create fictitious operating hours.
        elapsed = uptime - previous_uptime if previous_uptime is not None and uptime >= previous_uptime else 0
        elapsed = min(elapsed, 120)
        increment = elapsed if online else 0
        await pool.execute("""
            INSERT INTO sensor_runtime (box_id, sensor_id, online_seconds, last_seen, last_device_uptime)
            VALUES ($1,$2,$3,CASE WHEN $3 > 0 THEN NOW() ELSE NULL END,$4)
            ON CONFLICT (box_id, sensor_id) DO UPDATE SET
              online_seconds=sensor_runtime.online_seconds + EXCLUDED.online_seconds,
              last_seen=CASE WHEN EXCLUDED.online_seconds > 0 THEN NOW() ELSE sensor_runtime.last_seen END,
              last_device_uptime=EXCLUDED.last_device_uptime
        """, box_id, sensor_id, increment, uptime)
        statuses[sensor_id] = {"online": online, "fields": list(fields), "uptime_seconds": uptime}
    # One status snapshot per minute is enough for diagnostics without filling
    # the database with one row per 3-second telemetry frame.
    last_log = await pool.fetchval("SELECT recorded_at FROM sensor_status_logs WHERE box_id=$1 ORDER BY recorded_at DESC LIMIT 1", box_id)
    if last_log is None or (time.time() - last_log.timestamp()) >= 60:
        await pool.execute("INSERT INTO sensor_status_logs (box_id, device_uptime_sec, statuses) VALUES ($1,$2,$3::jsonb)", box_id, uptime, json.dumps(statuses))


@app.post("/api/ingest")
async def ingest_reading(payload: IngestPayload, request: Request):
    # Rate limiting — token bucket per IP
    client_ip = request.client.host
    if not _check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={"detail": f"Rate limit exceeded — max {RATE_LIMIT_RPS} req/s per device"}
        )
    pool = await get_pool()

    # Phase W1: Device Identity & Ingest Token Verification
    device_token = request.headers.get("X-Device-Token")
    if not await _verify_device_auth(payload.box_id, device_token, pool):
        if ENVIRONMENT == "production":
            raise HTTPException(
                status_code=401,
                detail=f"Unauthorized Device: Missing or invalid X-Device-Token for {payload.box_id}"
            )
        else:
            # แจ้งเตือนใน log ใน development mode เพื่อให้ใช้งานจำลองได้สะดวก
            pass

    # 1. อัปเดต / สร้าง device และปิด Alert "ขาดการเชื่อมต่อ (Offline...)" เดิมอัตโนมัติเมื่อบอร์ดกลับมาออนไลน์
    if payload.firmware_ver:
        await pool.execute(
            """
            INSERT INTO devices (box_id, status, firmware, last_seen)
            VALUES ($1, 'ONLINE', $2, NOW())
            ON CONFLICT (box_id) DO UPDATE SET 
                status = 'ONLINE', 
                firmware = EXCLUDED.firmware, 
                last_seen = NOW()
            """,
            payload.box_id,
            payload.firmware_ver,
        )
    else:
        await pool.execute(
            """
            INSERT INTO devices (box_id, status, last_seen)
            VALUES ($1, 'ONLINE', NOW())
            ON CONFLICT (box_id) DO UPDATE SET status = 'ONLINE', last_seen = NOW()
            """,
            payload.box_id,
        )

    try:
        await pool.execute(
            """
            UPDATE alerts
            SET status = 'Resolved',
                resolved_at = NOW(),
                resolved_by = 'Auto-Recovery (Device Online)',
                resolution_note = 'อุปกรณ์กลับมาเชื่อมต่อและส่งข้อมูลสดตามปกติ'
            WHERE box_id = $1 AND status IN ('Active', 'Acknowledged', 'In progress')
              AND (message LIKE '%ขาดการเชื่อมต่อ%' OR message LIKE '%Offline%')
            """,
            payload.box_id,
        )
    except Exception:
        pass

    # 2. บันทึกค่าเซนเซอร์ — เชื่อมต่อกับ active training session อัตโนมัติ (ถ้ามี)
    active_session_id = payload.session_id
    if active_session_id is None:
        active_session_id = await pool.fetchval(
            "SELECT id FROM training_sessions WHERE box_id = $1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
            payload.box_id,
        )

    # Phase W3 Provenance & Validity Tracking
    is_valid = True
    val_reasons = []
    # กรองค่าขยะ I2C bus error frames / Outliers (เช่น 64319, 39064, 32800)
    # ป้องกันไม่ให้สัญญาณรบกวนฮาร์ดแวร์หลุดเข้าไปทำให้ AI ทายแอลกอฮอล์ผิดพลาด
    if payload.tvoc is not None and (payload.tvoc > 3000 or payload.tvoc < 0):
        is_valid = False
        val_reasons.append("TVOC_OUTLIER")
        payload.tvoc = None
    if payload.eco2 is not None and (payload.eco2 > 10000 or payload.eco2 < 400):
        is_valid = False
        val_reasons.append("ECO2_OUT_OF_RANGE")
        payload.eco2 = None
    if payload.temp is not None and payload.temp < -10:
        is_valid = False
        val_reasons.append("TEMP_ERROR")
        payload.temp = None
    if payload.rh is not None and payload.rh < 0:
        is_valid = False
        val_reasons.append("RH_ERROR")
        payload.rh = None
    # ADC has a hard 12-bit domain.  Do not store or train on impossible MQ
    # frames, because they otherwise bias the classifier toward alcohol.
    for field in ("mq2", "mq3", "mq135", "mq8"):
        value = getattr(payload, field)
        if value is not None and not 0 <= value <= 4095:
            is_valid = False
            val_reasons.append(f"{field.upper()}_ADC_CLIPPED")
            setattr(payload, field, None)
    if payload.no2 is not None and payload.no2 < 0:
        payload.no2 = 0
    if payload.nh3 is not None and payload.nh3 < 0:
        payload.nh3 = 0

    val_reason_str = ";".join(val_reasons) if val_reasons else "PASS"

    row = await pool.fetchrow(
        """
        INSERT INTO sensor_readings
            (box_id, temp, rh, pm25, tvoc, eco2, mq2, mq3, mq135, mq8, mics_co, no2, nh3, session_id,
             is_valid, validation_reason, firmware_ver, model_ver, seq_no, wifi_rssi, free_heap_kb, reset_reason)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
        RETURNING id
        """,
        payload.box_id,
        payload.temp, payload.rh, payload.pm25, payload.tvoc, payload.eco2,
        payload.mq2, payload.mq3, payload.mq135, payload.mq8, payload.mics_co, payload.no2, payload.nh3,
        active_session_id,
        is_valid, val_reason_str, payload.firmware_ver or "1.0.0", getattr(payload, "model_ver", "v2.1"),
        payload.seq_no, payload.wifi_rssi, payload.free_heap_kb, payload.reset_reason
    )
    reading_id = row["id"]

    # 3. AI Predict
    reading_dict = payload.model_dump()
    ai_result = predict(reading_dict)
    mq3_quality_ok, mq3_quality_reason = _mq3_quality(payload)
    ai_result["mq3_quality_ok"] = mq3_quality_ok
    ai_result["mq3_quality_reason"] = mq3_quality_reason

    # 4. บันทึกผล AI ลง DB
    await pool.execute(
        """
        INSERT INTO ai_predictions (box_id, reading_id, prediction, confidence)
        VALUES ($1, $2, $3, $4)
        """,
        payload.box_id, reading_id,
        ai_result["prediction"], ai_result["confidence"],
    )

    # Status history and per-sensor operating hours are independent of AI.
    await _record_sensor_runtime(pool, payload.box_id, payload)

    # 5. Auto Alert
    await _auto_alert(pool, payload.box_id, reading_id, reading_dict, ai_result)

    # 6. Check OTA Firmware for ESP32
    ota_info = _load_ota_meta()
    is_ota_avail = bool(ota_info.get("available", False) and OTA_BIN_PATH.exists())
    ota_download_url = ota_info.get("url", "") or ""
    if is_ota_avail and ota_download_url and device_token:
        sep = "&" if "?" in ota_download_url else "?"
        ota_download_url = f"{ota_download_url}{sep}token={device_token}"

    ota_resp = {
        "available": is_ota_avail,
        "version": ota_info.get("version", "") or "",
        "url": ota_download_url,
        "rollback": bool(ota_info.get("rollback", False)),
    }

    # Auto-mark SUCCESS if device reports matching active OTA firmware
    if payload.firmware_ver and ota_info.get("version") == payload.firmware_ver:
        if pool:
            try:
                await pool.execute(
                    "UPDATE devices SET last_ota_status = 'SUCCESS', last_ota_error = NULL WHERE box_id = $1 AND (last_ota_status IS NULL OR last_ota_status != 'SUCCESS')",
                    payload.box_id
                )
            except Exception:
                pass

    # 7. Sync PM10 & 3-Fan State (GPIO 25, GPIO 26, GPIO 4)
    if payload.box_id not in _box_experiment_extras:
        _box_experiment_extras[payload.box_id] = {"pm10": None}
    if payload.pm10 is not None and payload.pm10 >= 0:
        _box_experiment_extras[payload.box_id]["pm10"] = payload.pm10

    fan_state_entry = _box_fan_states.get(payload.box_id)
    if not fan_state_entry:
        fan_state_entry = {
            "fan1": True,
            "fan2": True,
            "fan3": False,
            "fan1_pin": 25,
            "fan2_pin": 26,
            "fan3_pin": 4,
            "auto_mode": False,
            "preset": "NORMAL",
            "apply_pending": False,
            "command_id": None,
            "updated_at": None,
        }
        _box_fan_states[payload.box_id] = fan_state_entry

    fan_control_resp = {
        "apply": False,
        "fan1": fan_state_entry["fan1"],
        "fan2": fan_state_entry["fan2"],
        "fan3": fan_state_entry["fan3"],
        "auto_mode": fan_state_entry["auto_mode"],
        "command_id": fan_state_entry.get("command_id"),
    }
    if fan_state_entry.get("apply_pending"):
        fan_control_resp["apply"] = True
        fan_state_entry["apply_pending"] = False
    else:
        # อัปเดตสถานะพัดลมตามค่าจริงที่บอร์ด ESP32 ส่งรายงานมา
        if payload.fan1 is not None:
            fan_state_entry["fan1"] = bool(payload.fan1)
        if payload.fan2 is not None:
            fan_state_entry["fan2"] = bool(payload.fan2)
        if payload.fan3 is not None:
            fan_state_entry["fan3"] = bool(payload.fan3)

    return {
        "status": "ok",
        "reading_id": reading_id,
        "ai": ai_result,
        "ota": ota_resp,
        "fan_control": fan_control_resp,
    }


# ==================================================================
# TRAINING SESSIONS & EXPORT
# ==================================================================

# Training Sessions CRUD — Registered via routers/training.py (Phase 6.1)
app.include_router(create_training_router(get_pool=get_pool))

from experiment_excel import build_xlsx_bytes, build_ml_csv_string, get_default_experiment_sheets


@app.get("/api/experiment/tables")
async def get_experiment_research_tables():
    """ดึงข้อมูลตารางบันทึกผลการทดลองทั้ง 5 ชีต (ตารางที่ 1, 2, 3, 4/4.1 และ ML Dataset) สำหรับแสดงผลบนหน้าเว็บ"""
    sheets = get_default_experiment_sheets()
    return {name: rows for name, rows in sheets}


@app.get("/api/experiment/export/xlsx")
async def download_experiment_research_xlsx():
    """ดาวน์โหลดไฟล์ Excel (.xlsx ครบ 5 ชีต) รูปแบบเดียวกับแบบบันทึกผลการทดลอง พร้อมนำไปใส่ Paper วิจัยและเทรน AI"""
    xlsx_bytes = build_xlsx_bytes()
    filename = "VOC_Experiment_And_ML_Dataset.xlsx"
    return StreamingResponse(
        iter([xlsx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@app.get("/api/experiment/export/ml-csv")
async def download_experiment_ml_csv():
    """ดาวน์โหลดไฟล์ CSV ชุดข้อมูล Time-Series (พร้อมฟีเจอร์ Vout, Rs/R0, Rs/R_clean) สำหรับเทรนโมเดล AI ทันที"""
    csv_str = build_ml_csv_string()
    filename = "VOC_ML_Training_Ready_Dataset.csv"
    return StreamingResponse(
        iter([csv_str.encode("utf-8")]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


# ==================================================================
# Phase W3: PROVENANCE, DOWNSAMPLED TRENDS & CRYPTOGRAPHIC EXPORTS
# ==================================================================

async def _fetch_export_records(box_id: Optional[str] = None, session_id: Optional[int] = None, date_from: Optional[str] = None, date_to: Optional[str] = None):
    pool = await get_pool()
    if pool:
        try:
            where_clauses = []
            vals = []
            if session_id:
                vals.append(session_id)
                where_clauses.append(f"sr.session_id = ${len(vals)}")
            if box_id:
                vals.append(box_id)
                where_clauses.append(f"sr.box_id = ${len(vals)}")
            if date_from:
                vals.append(date_from)
                where_clauses.append(f"sr.recorded_at >= ${len(vals)}::timestamptz")
            if date_to:
                vals.append(date_to)
                where_clauses.append(f"sr.recorded_at <= ${len(vals)}::timestamptz")

            where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
            sql = f"""
                SELECT sr.recorded_at, sr.box_id, COALESCE(ts.label, 'AMBIENT') AS label,
                       ts.target_ppm, ts.liquid_volume, ts.volume_unit, ts.chamber_volume_l,
                       COALESCE(sr.is_valid, TRUE) AS is_valid,
                       COALESCE(sr.validation_reason, 'PASS') AS validation_reason,
                       COALESCE(sr.calibration_id, 'CAL-DEFAULT') AS calibration_id,
                       COALESCE(sr.firmware_ver, '1.0.0') AS firmware_ver,
                       COALESCE(sr.model_ver, 'v2.1') AS model_ver,
                       sr.temp, sr.rh, sr.pm25, sr.tvoc, sr.eco2,
                       sr.mq2, sr.mq3, sr.mq135, sr.mq8, sr.mics_co, sr.no2, sr.nh3
                FROM sensor_readings sr
                LEFT JOIN training_sessions ts ON ts.id = sr.session_id
                {where_str}
                ORDER BY sr.recorded_at ASC
                LIMIT 5000
            """
            rows = await pool.fetch(sql, *vals)
            if rows:
                return [dict(r) for r in rows]
        except Exception as e:
            print(f"[Export Fetch Error] {e}")

    now = datetime.now(timezone.utc)
    return [
        {
            "recorded_at": (now - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S"),
            "box_id": box_id or "BOX-001",
            "label": "ETHANOL",
            "target_ppm": 50.0,
            "liquid_volume": 2.0,
            "volume_unit": "mL",
            "chamber_volume_l": 5.0,
            "is_valid": True,
            "validation_reason": "PASS",
            "calibration_id": "CAL-2026-Q1",
            "firmware_ver": "1.0.2",
            "model_ver": "v2.1",
            "temp": 31.8, "rh": 67.1, "pm25": 15, "tvoc": 55, "eco2": 415,
            "mq2": 1820, "mq3": 2400, "mq135": 1490, "mq8": 1680, "mics_co": 1150, "no2": 840, "nh3": 1390
        },
        {
            "recorded_at": now.strftime("%Y-%m-%d %H:%M:%S"),
            "box_id": box_id or "BOX-001",
            "label": "THINNER",
            "target_ppm": 100.0,
            "liquid_volume": 3.0,
            "volume_unit": "mL",
            "chamber_volume_l": 5.0,
            "is_valid": True,
            "validation_reason": "PASS",
            "calibration_id": "CAL-2026-Q1",
            "firmware_ver": "1.0.2",
            "model_ver": "v2.1",
            "temp": 32.5, "rh": 68.2, "pm25": 25, "tvoc": 85, "eco2": 420,
            "mq2": 1950, "mq3": 2847, "mq135": 1560, "mq8": 1732, "mics_co": 1200, "no2": 890, "nh3": 1450
        }
    ]


async def _record_export_audit(export_id: str, format_str: str, record_count: int, sha256_hash: str, box_id: Optional[str], current_user: Optional[dict], request: Request):
    username = current_user.get("username", "anonymous") if current_user else "anonymous"
    role = current_user.get("role", "viewer") if current_user else "viewer"
    ip = request.client.host if request.client else "unknown"

    pool = await get_pool()
    if pool:
        try:
            await pool.execute(
                """
                INSERT INTO export_audit_records
                (export_id, exported_at, username, role, format, box_id, record_count, sha256_hash)
                VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)
                """,
                export_id, username, role, format_str, box_id, record_count, sha256_hash
            )
        except Exception as e:
            print(f"[Export Audit DB Warning] {e}")

    _in_memory_export_audits.insert(0, {
        "export_id": export_id,
        "exported_at": datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M:%S"),
        "username": username,
        "role": role,
        "format": format_str,
        "box_id": box_id or "ALL",
        "record_count": record_count,
        "sha256_hash": sha256_hash
    })

    await record_audit_event(
        action=f"EXPORT_{format_str.upper()}",
        resource_type="REPORT_EXPORT",
        resource_id=export_id,
        details={"format": format_str, "record_count": record_count, "sha256": sha256_hash},
        user=current_user,
        status="SUCCESS",
        ip=ip
    )


# Compliance Exports, Downsampled Trends & Daily Air Quality — Registered via routers/exports.py (Phase 6.1)
app.include_router(
    create_exports_router(
        get_pool=get_pool,
        require_roles=require_roles,
        require_box_access=require_box_access,
        fetch_export_records=_fetch_export_records,
        record_export_audit=_record_export_audit,
        in_memory_export_audits=_in_memory_export_audits,
    )
)


# ==================================================================
# Phase W5: EXHAUST STACKS, EMISSION PERMITS & ANNUAL MASS REPORTS
# ==================================================================
# Emissions & Statutory Stack Reporting — Registered via routers/emissions.py (Phase 6.1)
app.include_router(
    create_emissions_router(
        get_pool=get_pool,
        require_roles=require_roles,
        record_audit_event=record_audit_event,
        is_production=IS_PRODUCTION,
    )
)



# ==================================================================
# MAINTENANCE & SENSOR HEALTH (IEEE Predictive Maintenance Engine)
# ==================================================================
_MAINTENANCE_STATE = {
    "sensors": {
        "mq2":    {"age": 180, "drift": 0.12, "noise": 0.08, "lastCalDaysAgo": 70},
        "mq3":    {"age": 210, "drift": 0.18, "noise": 0.10, "lastCalDaysAgo": 85},
        "mq8":    {"age": 95,  "drift": 0.06, "noise": 0.05, "lastCalDaysAgo": 30},
        "mq135":  {"age": 320, "drift": 0.28, "noise": 0.16, "lastCalDaysAgo": 110},
        "ccs811": {"age": 60,  "drift": 0.04, "noise": 0.03, "lastCalDaysAgo": 25},
        "mics":   {"age": 145, "drift": 0.11, "noise": 0.07, "lastCalDaysAgo": 50},
        "pms":    {"age": 400, "drift": 0.22, "noise": 0.12, "lastCalDaysAgo": 140},
        "dht22":  {"age": 30,  "drift": 0.02, "noise": 0.01, "lastCalDaysAgo": 15},
    },
    "filter": {"age": 95, "replacedDate": None},
}

SENSOR_SPECS = {
    "mq2":    {"label": "MQ-2", "type": "Gas (MOS)", "pin": "GPIO 33", "lifespan": 730, "warnHI": 60, "critHI": 40, "calInterval": 90, "color": "#d97706", "measurands": ["Smoke", "LPG", "Methane"], "notes": "Drift ~5-8% per month due to tin-oxide oxidation"},
    "mq3":    {"label": "MQ-3", "type": "Gas (MOS)", "pin": "GPIO 36", "lifespan": 730, "warnHI": 60, "critHI": 40, "calInterval": 90, "color": "#16a34a", "measurands": ["Alcohol", "Benzene", "Thinner"], "notes": "Sensitive to humidity - accelerated drift in high RH"},
    "mq8":    {"label": "MQ-8", "type": "Gas (MOS)", "pin": "GPIO 34", "lifespan": 730, "warnHI": 60, "critHI": 40, "calInterval": 90, "color": "#ea580c", "measurands": ["Hydrogen (H2)", "Flammable Gas"], "notes": "High sensitivity to H2 - cross-sensitive to LPG"},
    "mq135":  {"label": "MQ-135", "type": "Gas (MOS)", "pin": "GPIO 39", "lifespan": 730, "warnHI": 60, "critHI": 40, "calInterval": 90, "color": "#dc2626", "measurands": ["NH3", "Benzene", "Smoke", "CO2"], "notes": "Broad cross-sensitivity - quarterly baseline recalibration needed"},
    "ccs811": {"label": "CCS811", "type": "MEMS (I2C)", "pin": "I2C Bus1", "lifespan": 1460, "warnHI": 70, "critHI": 50, "calInterval": 180, "color": "#7c3aed", "measurands": ["TVOC (ppb)", "eCO2 (ppm)"], "notes": "Requires 48h burn-in when new. Baseline auto-corrects over 24h cycles"},
    "mics":   {"label": "MiCS-6814", "type": "Multi-MEMS", "pin": "ADS1115", "lifespan": 1095, "warnHI": 65, "critHI": 45, "calInterval": 120, "color": "#db2777", "measurands": ["CO (mV)", "NO2 (mV)", "NH3 (mV)"], "notes": "3 independent sensing elements - each degrades at different rates"},
    "pms":    {"label": "PMS5003", "type": "Laser Particle", "pin": "UART2", "lifespan": 1095, "warnHI": 65, "critHI": 45, "calInterval": 365, "color": "#0284c7", "measurands": ["PM1.0", "PM2.5", "PM10 (ug/m3)"], "notes": "Laser + fan degradation. Fan dust accumulation is primary failure mode"},
    "dht22":  {"label": "DHT22", "type": "Capacitive", "pin": "GPIO 27", "lifespan": 2920, "warnHI": 75, "critHI": 55, "calInterval": 365, "color": "#475569", "measurands": ["Temperature (C)", "Humidity (%RH)"], "notes": "Most reliable sensor - minimal drift. Annual verification recommended"},
}

def _calculate_maintenance_view():
    sensor_list = []
    for sid, meta in SENSOR_SPECS.items():
        st = _MAINTENANCE_STATE["sensors"].get(sid, {"age": 100, "drift": 0.1, "noise": 0.05, "lastCalDaysAgo": 30})
        age = st["age"]
        drift = st["drift"]
        noise = st["noise"]
        age_factor = max(0.0, 1.0 - (age / meta["lifespan"]))
        drift_factor = max(0.0, 1.0 - (drift / 0.40))
        noise_factor = max(0.0, 1.0 - (noise / 0.25))
        hi = round((0.40 * age_factor + 0.35 * drift_factor + 0.25 * noise_factor) * 100)
        
        degrad_rate = (hi - meta["critHI"]) / (age if age > 0 else 1)
        rul = round((hi - meta["critHI"]) / degrad_rate) if degrad_rate > 0 else 9999
        cal_overdue = st["lastCalDaysAgo"] >= meta["calInterval"]

        trend = [max(meta["critHI"] - 5, round(hi + (29 - d) * (degrad_rate * 0.8), 1)) for d in range(30)]

        sensor_list.append({
            "id": sid,
            "label": meta["label"],
            "type": meta["type"],
            "pin": meta["pin"],
            "measurands": meta["measurands"],
            "lifespan": meta["lifespan"],
            "warnHI": meta["warnHI"],
            "critHI": meta["critHI"],
            "calInterval": meta["calInterval"],
            "notes": meta["notes"],
            "color": meta["color"],
            "age": age,
            "drift": drift,
            "noise": noise,
            "hi": hi,
            "rul": rul,
            "lastCal": f"{st['lastCalDaysAgo']} วันที่แล้ว",
            "nextCal": f"ในอีก {max(0, meta['calInterval'] - st['lastCalDaysAgo'])} วัน",
            "calOverdue": cal_overdue,
            "trend": trend,
        })

    filter_age = _MAINTENANCE_STATE["filter"]["age"]
    filter_lifespan = 180
    filter_hi = round(max(0.0, (1.0 - (filter_age / filter_lifespan))) * 100)
    filter_rul = max(0, round((filter_hi - 20) / (filter_hi / (filter_age if filter_age > 0 else 1)))) if filter_hi > 0 else 0

    return {
        "sensors": sensor_list,
        "filter": {
            "hi": filter_hi,
            "rul": filter_rul,
            "age": filter_age,
            "lifespan": filter_lifespan,
            "replaceBy": "30 วัน",
        },
        "lastUpdate": time.strftime("%Y-%m-%d %H:%M:%S"),
        "systemUptime": 847,
    }

# Maintenance, Work Orders & Diagnostics — Registered via routers/maintenance.py (Phase 6.1)
app.include_router(
    create_maintenance_router(
        get_pool=get_pool,
        require_roles=require_roles,
        require_box_access=require_box_access,
        record_audit_event=record_audit_event,
        work_order_model=WorkOrderCreateRequest,
        in_memory_work_orders=_in_memory_work_orders,
        maintenance_state=_MAINTENANCE_STATE,
        sensor_specs=SENSOR_SPECS,
        calculate_maintenance_view=_calculate_maintenance_view,
    )
)



# ==================================================================
# LINE BOT WEBHOOK — Registered via routers/line.py (Phase 6.1)
# ==================================================================
app.include_router(
    create_line_router(
        get_pool=get_pool,
        require_roles=require_roles,
        in_memory_line_subscribers=_in_memory_line_subscribers,
    )
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
