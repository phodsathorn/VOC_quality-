from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
import csv, io, time, asyncio
from collections import defaultdict
from db import connect_db, disconnect_db, get_pool
from model_loader import load_model, predict, is_loaded


# ==================================================================
# THRESHOLDS — เกณฑ์สำหรับสร้าง Alert (แก้ไขได้ผ่าน API)
# ==================================================================
THRESHOLDS = {
    "tvoc":  {"warn": 200,  "critical": 400},   # ppb
    "pm25":  {"warn": 35,   "critical": 75},    # ug/m3
    "eco2":  {"warn": 1500, "critical": 2500},  # ppm
}


# ==================================================================
# RATE LIMITER — Token bucket per IP สำหรับ /api/ingest
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


# ==================================================================
# DATA PURGE TASK — ลบข้อมูลเก่ากว่า 30 วันอัตโนมัติ
# ==================================================================
async def purge_old_data_task():
    """Background task ที่รันทุก 24 ชั่วโมง เพื่อลบข้อมูลเก่าเกิน 30 วันใน sensor_readings"""
    while True:
        try:
            pool = await get_pool()
            if pool:
                res = await pool.execute(
                    "DELETE FROM sensor_readings WHERE recorded_at < NOW() - INTERVAL '30 days'"
                )
                print(f"[Purge Task] Deleted old records: {res}")
        except Exception as e:
            print(f"[Purge Task] Error: {e}")
        
        # รอ 24 ชั่วโมง (86400 วินาที) ก่อนรันรอบต่อไป
        await asyncio.sleep(86400)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    load_model()  # โหลด AI Model ตอนเริ่มต้น
    
    # เริ่ม Background Task ลบข้อมูลเก่า
    task = asyncio.create_task(purge_old_data_task())
    
    yield
    
    # ปิดการเชื่อมต่อเมื่อหยุดการทำงาน
    task.cancel()
    await disconnect_db()


app = FastAPI(title="VOC / E-Nose API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
async def update_thresholds(body: ThresholdUpdate):
    """อัปเดต threshold — เรียกจากหน้า Settings เมื่อกดบันทึก"""
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
async def reload_model():
    """โหลด Model ใหม่จากไฟล์ .pkl โดยไม่ต้อง restart backend"""
    load_model()
    return {
        "status":  "ok" if is_loaded() else "warning",
        "loaded":  is_loaded(),
        "message": "Model reloaded successfully" if is_loaded() else "Model file not found — running in mock mode",
    }


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

@app.get("/api/dashboard/latest")
async def get_dashboard_latest(box_id: str = "BOX-001"):
    pool = await get_pool()
    device_row = await pool.fetchrow("SELECT * FROM devices WHERE box_id = $1", box_id)
    if not device_row:
        raise HTTPException(status_code=404, detail="Device not found")

    reading_row = await pool.fetchrow(
        "SELECT * FROM sensor_readings WHERE box_id = $1 ORDER BY recorded_at DESC LIMIT 1", box_id
    )
    prediction_row = await pool.fetchrow(
        "SELECT prediction, confidence FROM ai_predictions WHERE box_id = $1 ORDER BY predicted_at DESC LIMIT 1", box_id
    )

    return {
        "box_id": device_row["box_id"],
        "status": device_row["status"],
        "firmware": device_row["firmware"],
        "model_version": device_row["model_ver"],
        "ai_model_loaded": is_loaded(),
        "environment": {
            "temp": float(reading_row["temp"]) if reading_row else None,
            "rh":   float(reading_row["rh"])   if reading_row else None,
            "pm25": float(reading_row["pm25"]) if reading_row else None,
            "tvoc": float(reading_row["tvoc"]) if reading_row else None,
            "eco2": float(reading_row["eco2"]) if reading_row else None,
        } if reading_row else None,
        "sensors": {
            "mq2":     reading_row["mq2"] if "mq2" in reading_row else None,
            "mq3":     reading_row["mq3"],
            "mq135":   reading_row["mq135"],
            "mq8":     reading_row["mq8"],
            "mics_co": reading_row["mics_co"],
            "no2":     reading_row["no2"],
            "nh3":     reading_row["nh3"],
        } if reading_row else None,
        "ai_detection": {
            "prediction": prediction_row["prediction"],
            "confidence": float(prediction_row["confidence"]),
        } if prediction_row else None,
    }


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


@app.get("/api/alerts")
async def get_alerts(box_id: str = "BOX-001", limit: int = 20):
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id,
               to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'HH24:MI:SS') AS time,
               level, message, status,
               created_at
        FROM alerts
        WHERE box_id = $1 ORDER BY created_at DESC LIMIT $2
        """,
        box_id, limit,
    )
    return [dict(r) for r in rows]


@app.get("/api/alerts/summary")
async def get_alerts_summary():
    """จำนวน Alert ทั้งหมดแยกตาม level สำหรับแสดงบน Dashboard"""
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT level, COUNT(*) AS count
        FROM alerts WHERE status = 'Active'
        GROUP BY level
        """
    )
    return {r["level"]: int(r["count"]) for r in rows}


@app.patch("/api/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: int):
    """ปิด Alert (เปลี่ยน status เป็น Resolved)"""
    pool = await get_pool()
    row = await pool.fetchrow(
        "UPDATE alerts SET status = 'Resolved' WHERE id = $1 RETURNING id", alert_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "ok", "alert_id": alert_id}


@app.get("/api/devices")
async def get_devices():
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT box_id AS id, status, firmware, model_ver AS model,
               CASE
                   WHEN last_seen IS NULL THEN 'Never'
                   WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN 'Just now'
                   ELSE to_char(last_seen AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI')
               END AS last_seen
        FROM devices ORDER BY box_id
        """
    )
    return [dict(r) for r in rows]


class DeviceUpdate(BaseModel):
    firmware: Optional[str] = None
    model_ver: Optional[str] = None
    status: Optional[str] = None


@app.patch("/api/devices/{box_id}")
async def update_device(box_id: str, body: DeviceUpdate):
    """แก้ไข firmware / model_ver / status ของอุปกรณ์"""
    pool = await get_pool()
    # สร้าง SET clause เฉพาะ field ที่ส่งมา
    updates = {}
    if body.firmware  is not None: updates["firmware"]  = body.firmware
    if body.model_ver is not None: updates["model_ver"] = body.model_ver
    if body.status    is not None: updates["status"]    = body.status
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates.keys()))
    values = [box_id] + list(updates.values())
    row = await pool.fetchrow(
        f"UPDATE devices SET {set_clause} WHERE box_id = $1 RETURNING box_id AS id, status, firmware, model_ver AS model",
        *values,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Device not found")
    return dict(row)


@app.delete("/api/devices/{box_id}")
async def delete_device(box_id: str):
    """ลบอุปกรณ์ออกจากระบบ (readings ยังคงอยู่)"""
    pool = await get_pool()
    row = await pool.fetchrow(
        "DELETE FROM devices WHERE box_id = $1 RETURNING box_id", box_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"detail": "deleted", "box_id": box_id}


# ==================================================================
# DATA INGEST — รับข้อมูลจาก ESP32-S3 + Auto Predict + Auto Alert
# ==================================================================

class IngestPayload(BaseModel):
    box_id: str
    temp: Optional[float] = None
    rh: Optional[float] = None
    pm25: Optional[float] = None
    tvoc: Optional[float] = None
    eco2: Optional[float] = None
    mq2: Optional[int] = None
    mq3: Optional[int] = None
    mq135: Optional[int] = None
    mq8: Optional[int] = None
    mics_co: Optional[int] = None
    no2: Optional[int] = None
    nh3: Optional[int] = None
    session_id: Optional[int] = None


# เก็บเวลาล่าสุดที่ยิง alert แต่ละประเภทเพื่อทำ Cooldown
_last_alert_time: dict = {}

async def _auto_alert(pool, box_id: str, reading_id: int, reading: dict, ai_result: dict):
    """สร้าง Alert อัตโนมัติ พร้อมระบบป้องกันการเด้งรัว (Deduplication + Escalation + Hysteresis Auto-Resolve)"""
    now = time.monotonic()

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

            await pool.execute(
                "INSERT INTO alerts (box_id, level, message, status) VALUES ($1, $2, $3, 'Active')",
                box_id, level, msg,
            )
            _last_alert_time[key] = now

        elif val < recovery_limit:
            # เมื่อค่ากลับมาเป็นปกติจริงๆ (ต่ำกว่า recovery deadband) ให้ Auto-resolve alert เดิมที่เป็น Active ทันที
            await pool.execute(
                "UPDATE alerts SET status = 'Resolved' WHERE box_id = $1 AND status = 'Active' AND message LIKE $2",
                box_id, field_prefix
            )

    # 2) AI-based alert — เมื่อตรวจพบสารอันตราย
    ai_key = (box_id, "AI")
    active_ai = await pool.fetchrow(
        "SELECT id FROM alerts WHERE box_id = $1 AND status = 'Active' AND (message LIKE 'AI%' OR level = 'High') ORDER BY id DESC LIMIT 1",
        box_id
    )

    if ai_result.get("is_dangerous"):
        pred = ai_result["prediction"]
        conf = ai_result["confidence"]

        # ถ้ามี Active Alert ของ AI เรื่องนี้อยู่แล้ว ไม่สร้างซ้ำ
        if not active_ai:
            if now - _last_alert_time.get(ai_key, 0) >= 60:
                await pool.execute(
                    "INSERT INTO alerts (box_id, level, message, status) VALUES ($1, 'High', $2, 'Active')",
                    box_id, f"AI ตรวจพบสาร {pred} (confidence {conf}%)",
                )
                _last_alert_time[ai_key] = now
    else:
        # เมื่อสภาพอากาศกลับเป็นปกติ (ไม่ใช่สารอันตราย) Auto-resolve AI alert เดิม
        if active_ai:
            await pool.execute(
                "UPDATE alerts SET status = 'Resolved' WHERE id = $1",
                active_ai["id"]
            )


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

    # 1. อัปเดต / สร้าง device
    await pool.execute(
        """
        INSERT INTO devices (box_id, status, last_seen)
        VALUES ($1, 'ONLINE', NOW())
        ON CONFLICT (box_id) DO UPDATE SET status = 'ONLINE', last_seen = NOW()
        """,
        payload.box_id,
    )

    # 2. บันทึกค่าเซนเซอร์ — เชื่อมต่อกับ active training session อัตโนมัติ (ถ้ามี)
    active_session_id = payload.session_id
    if active_session_id is None:
        active_session_id = await pool.fetchval(
            "SELECT id FROM training_sessions WHERE box_id = $1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
            payload.box_id,
        )

    row = await pool.fetchrow(
        """
        INSERT INTO sensor_readings
            (box_id, temp, rh, pm25, tvoc, eco2, mq2, mq3, mq135, mq8, mics_co, no2, nh3, session_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING id
        """,
        payload.box_id,
        payload.temp, payload.rh, payload.pm25, payload.tvoc, payload.eco2,
        payload.mq2, payload.mq3, payload.mq135, payload.mq8, payload.mics_co, payload.no2, payload.nh3,
        active_session_id,
    )
    reading_id = row["id"]

    # 3. AI Predict
    reading_dict = payload.model_dump()
    ai_result = predict(reading_dict)

    # 4. บันทึกผล AI ลง DB
    await pool.execute(
        """
        INSERT INTO ai_predictions (box_id, reading_id, prediction, confidence)
        VALUES ($1, $2, $3, $4)
        """,
        payload.box_id, reading_id,
        ai_result["prediction"], ai_result["confidence"],
    )

    # 5. Auto Alert
    await _auto_alert(pool, payload.box_id, reading_id, reading_dict, ai_result)

    return {
        "status": "ok",
        "reading_id": reading_id,
        "ai": ai_result,
    }


# ==================================================================
# TRAINING SESSIONS & EXPORT
# ==================================================================

class SessionCreate(BaseModel):
    box_id: str
    label: str
    note: Optional[str] = None


@app.post("/api/training/sessions")
async def create_session(body: SessionCreate):
    pool = await get_pool()
    row = await pool.fetchrow(
        "INSERT INTO training_sessions (box_id, label, note) VALUES ($1,$2,$3) RETURNING id, label, started_at",
        body.box_id, body.label.upper(), body.note,
    )
    return {"session_id": row["id"], "label": row["label"], "started_at": str(row["started_at"])}


@app.patch("/api/training/sessions/{session_id}/end")
async def end_session(session_id: int):
    pool = await get_pool()
    row = await pool.fetchrow(
        "UPDATE training_sessions SET ended_at = NOW() WHERE id = $1 RETURNING id, label, started_at, ended_at",
        session_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    count = await pool.fetchval(
        "SELECT COUNT(*) FROM sensor_readings WHERE session_id = $1", session_id
    )
    return {
        "session_id": row["id"],
        "label": row["label"],
        "started_at": str(row["started_at"]),
        "ended_at": str(row["ended_at"]),
        "total_readings": count,
    }


@app.get("/api/training/sessions")
async def list_sessions():
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT ts.id, ts.box_id, ts.label, ts.note, ts.started_at, ts.ended_at,
               COUNT(sr.id) AS reading_count
        FROM training_sessions ts
        LEFT JOIN sensor_readings sr ON sr.session_id = ts.id
        GROUP BY ts.id ORDER BY ts.started_at DESC
        """
    )
    return [dict(r) for r in rows]


class SessionUpdate(BaseModel):
    label: Optional[str] = None
    note: Optional[str] = None


@app.patch("/api/training/sessions/{session_id}")
async def update_session(session_id: int, body: SessionUpdate):
    """แก้ไข label หรือ note ของ training session"""
    pool = await get_pool()
    updates = {}
    if body.label is not None: updates["label"] = body.label.upper()
    if body.note  is not None: updates["note"]  = body.note
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates.keys()))
    values = [session_id] + list(updates.values())
    row = await pool.fetchrow(
        f"UPDATE training_sessions SET {set_clause} WHERE id = $1 RETURNING id, label, note",
        *values,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return dict(row)


@app.delete("/api/training/sessions/{session_id}")
async def delete_session(session_id: int):
    """ลบ session และ readings ที่อยู่ใน session นั้น"""
    pool = await get_pool()
    # ลบ readings ก่อน (foreign key)
    await pool.execute(
        "UPDATE sensor_readings SET session_id = NULL WHERE session_id = $1", session_id
    )
    row = await pool.fetchrow(
        "DELETE FROM training_sessions WHERE id = $1 RETURNING id", session_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"detail": "deleted", "session_id": session_id}


@app.get("/api/export/csv")
async def export_csv(session_id: Optional[int] = None):
    pool = await get_pool()

    if session_id:
        rows = await pool.fetch(
            """
            SELECT sr.recorded_at, sr.box_id, COALESCE(ts.label, 'UNLABELED') AS label,
                   sr.temp, sr.rh, sr.pm25, sr.tvoc, sr.eco2,
                   sr.mq2, sr.mq3, sr.mq135, sr.mq8, sr.mics_co, sr.no2, sr.nh3
            FROM sensor_readings sr
            LEFT JOIN training_sessions ts ON ts.id = sr.session_id
            WHERE sr.session_id = $1 ORDER BY sr.recorded_at
            """,
            session_id,
        )
    else:
        rows = await pool.fetch(
            """
            SELECT sr.recorded_at, sr.box_id, COALESCE(ts.label, 'AMBIENT') AS label,
                   sr.temp, sr.rh, sr.pm25, sr.tvoc, sr.eco2,
                   sr.mq2, sr.mq3, sr.mq135, sr.mq8, sr.mics_co, sr.no2, sr.nh3
            FROM sensor_readings sr
            LEFT JOIN training_sessions ts ON ts.id = sr.session_id
            ORDER BY sr.recorded_at ASC
            """
        )

    if not rows:
        raise HTTPException(status_code=404, detail="No sensor data found to export")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "recorded_at", "box_id", "label",
        "temp", "rh", "pm25", "tvoc", "eco2",
        "mq2", "mq3", "mq135", "mq8", "mics_co", "no2", "nh3"
    ])
    for r in rows:
        writer.writerow([
            r["recorded_at"], r["box_id"], r["label"],
            r["temp"], r["rh"], r["pm25"], r["tvoc"], r["eco2"],
            r["mq2"], r["mq3"], r["mq135"], r["mq8"], r["mics_co"], r["no2"], r["nh3"]
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=voc_training_data.csv"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
