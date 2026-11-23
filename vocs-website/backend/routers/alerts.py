"""
routers/alerts.py
-----------------
Alert Lifecycle (5-stage workflow), Manual Alerts & Kiosk PIN-verified Emergency Alarms:
- GET /api/alerts, GET /api/alerts/summary
- PATCH /api/alerts/{alert_id}/acknowledge
- PATCH /api/alerts/{alert_id}/in-progress
- PATCH /api/alerts/{alert_id}/resolve
- PATCH /api/alerts/{alert_id}/verify
- POST /api/alerts/manual
- POST /api/alerts (Kiosk Emergency with PIN verification + rate limit)
"""
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import hmac
import os
import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel

from line_adapter import send_escalation_alert


class AlertActionBody(BaseModel):
    note: Optional[str] = ""
    evidence: Optional[str] = ""
    source_screen: Optional[str] = "Web Dashboard"


class ManualAlertRequest(BaseModel):
    box_id: str = "BOX-001"
    level: str = "High"  # Warning, High, Critical
    message: str
    source_screen: Optional[str] = "Kiosk"


class KioskEmergencyAlertBody(BaseModel):
    box_id: str = "BOX-001"
    level: str = "Critical"
    message: str
    source_screen: Optional[str] = "Kiosk"
    pin: Optional[str] = None


def create_alerts_router(
    *,
    get_pool,
    require_roles,
    require_box_access,
    record_audit_event,
    in_memory_alerts: list,
    kiosk_emergency_pin: str,
    kiosk_pin_failures: dict,
    kiosk_pin_max_attempts: int,
    kiosk_pin_window_sec: float,
    get_current_user_optional=None,
) -> APIRouter:
    router = APIRouter(tags=["Alerts"])

    async def _resolve_operator_user(request: Request, authorization: Optional[str]) -> dict:
        if get_current_user_optional:
            user = await get_current_user_optional(request, authorization)
            if user:
                return user
        return {
            "id": 1,
            "username": "web_operator",
            "role": "admin",
            "assigned_boxes": ["BOX-001", "BOX-002"],
        }

    @router.get("/api/alerts")
    async def get_alerts(box_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50):
        """ดึงรายการ Alerts พร้อมข้อมูล SLA Countdown และสถานะ 5 ขั้นตอน"""
        pool = await get_pool()
        if pool:
            try:
                where_clauses = []
                vals = []
                if box_id:
                    vals.append(box_id)
                    where_clauses.append(f"box_id = ${len(vals)}")
                if status:
                    vals.append(status)
                    where_clauses.append(f"status = ${len(vals)}")

                where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
                vals.append(limit)

                query = f"""
                    SELECT id, box_id, level, message, status,
                           to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'HH24:MI:SS') AS time,
                           created_at, sla_deadline,
                           COALESCE(EXTRACT(EPOCH FROM (sla_deadline - NOW()))::int, 0) AS remaining_sla_seconds,
                           is_sla_breached, escalated, source_screen,
                           acknowledged_at, acknowledged_by, acknowledged_role,
                           in_progress_at, in_progress_by,
                           resolved_at, resolved_by, resolution_note, evidence_url,
                           verified_at, verified_by, verification_note
                    FROM alerts
                    {where_str}
                    ORDER BY
                        CASE
                            WHEN status = 'Active' THEN 1
                            WHEN status = 'Acknowledged' THEN 2
                            WHEN status = 'In progress' THEN 3
                            WHEN status = 'Resolved' THEN 4
                            ELSE 5
                        END,
                        created_at DESC
                    LIMIT ${len(vals)}
                """
                rows = await pool.fetch(query, *vals)
                items = []
                for r in rows:
                    d = dict(r)
                    d["created_at"] = d["created_at"].isoformat() if hasattr(d["created_at"], "isoformat") else str(d["created_at"])
                    if d.get("sla_deadline"):
                        d["sla_deadline"] = (
                            d["sla_deadline"].isoformat() if hasattr(d["sla_deadline"], "isoformat") else str(d["sla_deadline"])
                        )
                    items.append(d)
                return items
            except Exception as e:
                print(f"[Get Alerts Error] {e}")

        now_utc = datetime.now(timezone.utc)
        res = []
        for a in in_memory_alerts:
            if box_id and a.get("box_id") != box_id:
                continue
            if status and a.get("status") != status:
                continue
            item = a.copy()
            if item.get("sla_deadline"):
                try:
                    dl = datetime.fromisoformat(item["sla_deadline"])
                    rem = int((dl - now_utc).total_seconds())
                    item["remaining_sla_seconds"] = rem
                    if rem <= 0 and item.get("status") == "Active":
                        item["is_sla_breached"] = True
                except Exception:
                    item["remaining_sla_seconds"] = 0
            res.append(item)
        return res[:limit]

    @router.get("/api/alerts/summary")
    async def get_alerts_summary():
        """จำนวน Alert ที่ยังไม่ปิดแยกตาม level"""
        pool = await get_pool()
        if pool:
            try:
                rows = await pool.fetch(
                    """
                    SELECT level, COUNT(*) AS count
                    FROM alerts WHERE status IN ('Active', 'Acknowledged', 'In progress')
                    GROUP BY level
                    """
                )
                return {r["level"]: int(r["count"]) for r in rows}
            except Exception as e:
                print(f"[Alerts Summary Error] {e}")

        res = defaultdict(int)
        for a in in_memory_alerts:
            if a.get("status") in ("Active", "Acknowledged", "In progress"):
                res[a.get("level", "Warning")] += 1
        return dict(res)

    @router.patch("/api/alerts/{alert_id}/acknowledge")
    async def acknowledge_alert(
        alert_id: int,
        request: Request,
        body: Optional[AlertActionBody] = None,
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """ขั้นตอนที่ 2: รับทราบ Alert (Active -> Acknowledged)"""
        current_user = await _resolve_operator_user(request, authorization)
        username = current_user.get("username", "operator")
        role = current_user.get("role", "operator")
        source = body.source_screen if body and body.source_screen else "Web Dashboard"
        ip = request.client.host if request.client else "unknown"

        pool = await get_pool()
        if pool:
            alert_info = await pool.fetchrow("SELECT box_id, level, status FROM alerts WHERE id = $1", alert_id)
            if not alert_info:
                raise HTTPException(status_code=404, detail="Alert not found")

            row = await pool.fetchrow(
                """
                UPDATE alerts
                SET status = 'Acknowledged',
                    acknowledged_at = NOW(),
                    acknowledged_by = $1,
                    acknowledged_role = $2,
                    source_screen = $3
                WHERE id = $4
                RETURNING id, box_id, level
                """,
                username, role, source, alert_id,
            )
            box_id = row["box_id"]
            level = row["level"]
        else:
            found = False
            box_id = "BOX-001"
            level = "Warning"
            for a in in_memory_alerts:
                if a["id"] == alert_id:
                    a["status"] = "Acknowledged"
                    a["acknowledged_at"] = datetime.now(timezone.utc).isoformat()
                    a["acknowledged_by"] = username
                    a["acknowledged_role"] = role
                    a["source_screen"] = source
                    box_id = a.get("box_id", "BOX-001")
                    level = a.get("level", "Warning")
                    found = True
                    break
            if not found:
                raise HTTPException(status_code=404, detail="Alert not found")

        await record_audit_event(
            action="ACKNOWLEDGE_ALERT",
            resource_type="ALERT",
            resource_id=str(alert_id),
            details={"box_id": box_id, "level": level, "source_screen": source},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "alert_id": alert_id, "state": "Acknowledged", "acknowledged_by": username}

    @router.patch("/api/alerts/{alert_id}/in-progress")
    async def alert_in_progress(
        alert_id: int,
        request: Request,
        body: Optional[AlertActionBody] = None,
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """ขั้นตอนที่ 3: เริ่มปฏิบัติการแก้ไข (Acknowledged -> In progress)"""
        current_user = await _resolve_operator_user(request, authorization)
        username = current_user.get("username", "operator")
        ip = request.client.host if request.client else "unknown"

        pool = await get_pool()
        if pool:
            alert_info = await pool.fetchrow("SELECT box_id, level, status FROM alerts WHERE id = $1", alert_id)
            if not alert_info:
                raise HTTPException(status_code=404, detail="Alert not found")

            row = await pool.fetchrow(
                """
                UPDATE alerts
                SET status = 'In progress',
                    in_progress_at = NOW(),
                    in_progress_by = $1
                WHERE id = $2
                RETURNING id, box_id, level
                """,
                username, alert_id,
            )
            box_id = row["box_id"]
            level = row["level"]
        else:
            found = False
            box_id = "BOX-001"
            level = "Warning"
            for a in in_memory_alerts:
                if a["id"] == alert_id:
                    a["status"] = "In progress"
                    a["in_progress_at"] = datetime.now(timezone.utc).isoformat()
                    a["in_progress_by"] = username
                    box_id = a.get("box_id", "BOX-001")
                    level = a.get("level", "Warning")
                    found = True
                    break
            if not found:
                raise HTTPException(status_code=404, detail="Alert not found")

        await record_audit_event(
            action="ALERT_IN_PROGRESS",
            resource_type="ALERT",
            resource_id=str(alert_id),
            details={"box_id": box_id, "level": level, "note": body.note if body else ""},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "alert_id": alert_id, "state": "In progress", "in_progress_by": username}

    @router.patch("/api/alerts/{alert_id}/resolve")
    async def resolve_alert(
        alert_id: int,
        request: Request,
        body: Optional[AlertActionBody] = None,
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """ขั้นตอนที่ 4: บันทึกการแก้ไขเสร็จสิ้น (In progress -> Resolved)"""
        current_user = await _resolve_operator_user(request, authorization)
        username = current_user.get("username", "operator")
        ip = request.client.host if request.client else "unknown"

        note = (body.note.strip() if body and body.note else "") or "ตรวจสอบและเคลียร์เหตุการณ์จากหน้าเว็บเรียบร้อยแล้ว"
        evidence = body.evidence.strip() if body and body.evidence else ""

        pool = await get_pool()
        level = "Warning"
        box_id = "BOX-001"

        if pool:
            alert_info = await pool.fetchrow("SELECT level, box_id, status FROM alerts WHERE id = $1", alert_id)
            if not alert_info:
                raise HTTPException(status_code=404, detail="Alert not found")
            level = alert_info["level"]
            box_id = alert_info["box_id"]

            await pool.fetchrow(
                """
                UPDATE alerts
                SET status = 'Resolved',
                    resolved_at = NOW(),
                    resolved_by = $1,
                    resolution_note = $2,
                    evidence_url = $3
                WHERE id = $4
                RETURNING id
                """,
                username, note, evidence, alert_id,
            )
        else:
            found = False
            for a in in_memory_alerts:
                if a["id"] == alert_id:
                    level = a.get("level", "Warning")
                    box_id = a.get("box_id", "BOX-001")
                    a["status"] = "Resolved"
                    a["resolved_at"] = datetime.now(timezone.utc).isoformat()
                    a["resolved_by"] = username
                    a["resolution_note"] = note
                    a["evidence_url"] = evidence
                    found = True
                    break
            if not found:
                raise HTTPException(status_code=404, detail="Alert not found")

        await record_audit_event(
            action="RESOLVE_ALERT",
            resource_type="ALERT",
            resource_id=str(alert_id),
            details={"box_id": box_id, "level": level, "note": note, "evidence": evidence},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "alert_id": alert_id, "state": "Resolved", "resolved_by": username}

    @router.post("/api/alerts/resolve-all")
    async def resolve_all_active_alerts(
        request: Request,
        body: Optional[AlertActionBody] = None,
        authorization: Optional[str] = Header(None, alias="Authorization"),
    ):
        """เคลียร์และปิดการแจ้งเตือนที่ค้างอยู่ทั้งหมด (Active / Acknowledged / In progress -> Resolved)"""
        current_user = await _resolve_operator_user(request, authorization)
        username = current_user.get("username", "operator")
        note = (body.note.strip() if body and body.note else "") or "เคลียร์รายการแจ้งเตือนทั้งหมดจากหน้าแดชบอร์ด"
        ip = request.client.host if request.client else "unknown"

        resolved_count = 0
        pool = await get_pool()
        if pool:
            rows = await pool.fetch(
                """
                UPDATE alerts
                SET status = 'Resolved',
                    resolved_at = NOW(),
                    resolved_by = $1,
                    resolution_note = $2
                WHERE status IN ('Active', 'Acknowledged', 'In progress')
                RETURNING id
                """,
                username, note,
            )
            resolved_count = len(rows)
        else:
            for a in in_memory_alerts:
                if a.get("status") in ("Active", "Acknowledged", "In progress"):
                    a["status"] = "Resolved"
                    a["resolved_at"] = datetime.now(timezone.utc).isoformat()
                    a["resolved_by"] = username
                    a["resolution_note"] = note
                    resolved_count += 1

        await record_audit_event(
            action="RESOLVE_ALL_ALERTS",
            resource_type="ALERT",
            resource_id="ALL",
            details={"resolved_count": resolved_count, "note": note},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "resolved_count": resolved_count}

    @router.patch("/api/alerts/{alert_id}/verify")
    async def verify_alert(
        alert_id: int,
        request: Request,
        body: Optional[AlertActionBody] = None,
        current_user: dict = Depends(require_roles("admin", "engineer")),
    ):
        """ขั้นตอนที่ 5: ตรวจยืนยันความปลอดภัยและปิดเคสสมบูรณ์ (Resolved -> Verified)"""
        username = current_user.get("username", "engineer")
        note = body.note if body else "Verified safe air levels confirmed"
        ip = request.client.host if request.client else "unknown"

        pool = await get_pool()
        box_id = "BOX-001"
        level = "High"
        if pool:
            row = await pool.fetchrow(
                """
                UPDATE alerts
                SET status = 'Verified',
                    verified_at = NOW(),
                    verified_by = $1,
                    verification_note = $2
                WHERE id = $3
                RETURNING id, box_id, level
                """,
                username, note, alert_id,
            )
            if not row:
                raise HTTPException(status_code=404, detail="Alert not found")
            box_id = row["box_id"]
            level = row["level"]
        else:
            found = False
            for a in in_memory_alerts:
                if a["id"] == alert_id:
                    a["status"] = "Verified"
                    a["verified_at"] = datetime.now(timezone.utc).isoformat()
                    a["verified_by"] = username
                    a["verification_note"] = note
                    box_id = a.get("box_id", "BOX-001")
                    level = a.get("level", "High")
                    found = True
                    break
            if not found:
                raise HTTPException(status_code=404, detail="Alert not found")

        await record_audit_event(
            action="VERIFY_ALERT",
            resource_type="ALERT",
            resource_id=str(alert_id),
            details={"box_id": box_id, "level": level, "verification_note": note},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "alert_id": alert_id, "state": "Verified", "verified_by": username}

    @router.post("/api/alerts/manual")
    async def trigger_manual_alert(
        body: ManualAlertRequest,
        request: Request,
        current_user: dict = Depends(require_roles("admin", "engineer", "operator")),
    ):
        """สร้าง Alert ฉุกเฉินด้วยตนเองจากหน้า Kiosk หรือ Web Dashboard"""
        require_box_access(current_user, body.box_id)
        level = body.level if body.level in ("Warning", "High", "Critical") else "High"
        sla_min = 10 if level == "Warning" else 5
        now_utc = datetime.now(timezone.utc)
        sla_deadline = now_utc + timedelta(minutes=sla_min)
        ip = request.client.host if request.client else "unknown"

        pool = await get_pool()
        new_id = None
        if pool:
            new_id = await pool.fetchval(
                """
                INSERT INTO alerts (box_id, level, message, status, sla_deadline, source_screen, created_at)
                VALUES ($1, $2, $3, 'Active', $4, $5, NOW())
                RETURNING id
                """,
                body.box_id, level, body.message, sla_deadline, body.source_screen,
            )
        else:
            new_id = len(in_memory_alerts) + 1
            in_memory_alerts.insert(0, {
                "id": new_id,
                "box_id": body.box_id,
                "level": level,
                "message": body.message,
                "status": "Active",
                "sla_deadline": sla_deadline.isoformat(),
                "remaining_sla_seconds": sla_min * 60,
                "is_sla_breached": False,
                "escalated": False,
                "source_screen": body.source_screen,
                "created_at": now_utc.isoformat(),
                "time": now_utc.strftime("%H:%M:%S"),
            })

        await record_audit_event(
            action="MANUAL_ALERT_TRIGGERED",
            resource_type="ALERT",
            resource_id=str(new_id),
            details={"box_id": body.box_id, "level": level, "message": body.message, "source_screen": body.source_screen},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "id": new_id, "sla_minutes": sla_min, "message": "Manual emergency alert broadcasted"}

    @router.post("/api/alerts")
    async def create_kiosk_emergency_alert(body: KioskEmergencyAlertBody, request: Request):
        """
        Onsite Emergency Chemical Alarm (triggered from factory touch Kiosk).
        Verifies Kiosk Emergency PIN with brute-force rate limiting, then creates an
        immediate Critical Alert, notifies LINE, and logs an immutable audit event.
        """
        ip = request.client.host if request.client else "unknown"
        now_ts = time.time()

        recent_failures = [t for t in kiosk_pin_failures[ip] if now_ts - t < kiosk_pin_window_sec]
        kiosk_pin_failures[ip] = recent_failures
        if len(recent_failures) >= kiosk_pin_max_attempts:
            await record_audit_event(
                action="KIOSK_EMERGENCY_PIN_RATE_LIMITED",
                resource_type="ALERT",
                resource_id=body.box_id,
                details={"box_id": body.box_id, "attempts_in_window": len(recent_failures)},
                user={"username": "onsite_kiosk_operator", "role": "operator"},
                status="FAILURE",
                ip=ip,
            )
            raise HTTPException(
                status_code=429,
                detail="Too many invalid Kiosk PIN attempts. Please wait 60 seconds and try again.",
            )

        expected_pin = os.getenv("KIOSK_EMERGENCY_PIN", kiosk_emergency_pin)
        submitted_pin = (body.pin or "").strip()
        if not submitted_pin or not hmac.compare_digest(submitted_pin, expected_pin):
            kiosk_pin_failures[ip].append(now_ts)
            await record_audit_event(
                action="KIOSK_EMERGENCY_PIN_FAILED",
                resource_type="ALERT",
                resource_id=body.box_id,
                details={"box_id": body.box_id, "source_screen": body.source_screen},
                user={"username": "onsite_kiosk_operator", "role": "operator"},
                status="FAILURE",
                ip=ip,
            )
            raise HTTPException(status_code=403, detail="Invalid Kiosk Emergency PIN")

        kiosk_pin_failures.pop(ip, None)

        level = body.level if body.level in ("Warning", "High", "Critical") else "Critical"
        sla_min = 5
        now_utc = datetime.now(timezone.utc)
        sla_deadline = now_utc + timedelta(minutes=sla_min)

        pool = await get_pool()
        new_id = None
        if pool:
            row = await pool.fetchrow(
                """
                INSERT INTO alerts (box_id, level, message, status, sla_deadline, is_sla_breached, source_screen)
                VALUES ($1, $2, $3, 'Active', $4, FALSE, $5)
                RETURNING id
                """,
                body.box_id, level, body.message, sla_deadline, body.source_screen or "Kiosk",
            )
            new_id = row["id"]
            try:
                sub_rows = await pool.fetch(
                    "SELECT line_user_id FROM line_subscribers WHERE box_id = $1 AND is_active = TRUE",
                    body.box_id,
                )
                sub_ids = [r["line_user_id"] for r in sub_rows]
                send_escalation_alert(
                    {
                        "id": new_id,
                        "box_id": body.box_id,
                        "level": level,
                        "message": body.message,
                        "created_at": now_utc.isoformat(),
                    },
                    sub_ids,
                )
            except Exception as e:
                print(f"[Kiosk Alert Line Error] {e}")
        else:
            new_id = len(in_memory_alerts) + 1
            in_memory_alerts.insert(0, {
                "id": new_id,
                "box_id": body.box_id,
                "level": level,
                "message": body.message,
                "status": "Active",
                "sla_deadline": sla_deadline.isoformat(),
                "is_sla_breached": False,
                "escalated": False,
                "source_screen": body.source_screen or "Kiosk",
                "created_at": now_utc.isoformat(),
                "time": now_utc.strftime("%H:%M:%S"),
            })

        await record_audit_event(
            action="KIOSK_EMERGENCY_ALARM",
            resource_type="ALERT",
            resource_id=str(new_id),
            details={"box_id": body.box_id, "level": level, "message": body.message, "source_screen": body.source_screen},
            user={"username": "onsite_kiosk_operator", "role": "operator"},
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "id": new_id, "level": level, "message": "Emergency alert broadcasted successfully"}

    return router
