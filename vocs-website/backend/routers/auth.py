"""
routers/auth.py
---------------
Authentication, User Management (RBAC) & Immutable Audit Trail endpoints:
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/users, POST /api/users, PATCH /api/users/{user_id}, DELETE /api/users/{user_id}
- GET /api/audit-events, GET /api/audit-events/export
"""
import csv
from datetime import datetime, timezone
import io
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreateRequest(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = ""
    role: str  # operator, engineer, admin, viewer
    site: Optional[str] = "Main Plant"
    assigned_boxes: Optional[List[str]] = []


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    site: Optional[str] = None
    assigned_boxes: Optional[List[str]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


def create_auth_router(
    *,
    get_pool,
    get_current_user,
    require_roles,
    verify_password,
    get_password_hash,
    create_access_token,
    record_audit_event,
    check_login_rate_limit,
    record_login_failure,
    reset_login_failures,
    access_token_expire_minutes: int,
    in_memory_users: dict,
    in_memory_audit_events: list,
) -> APIRouter:
    router = APIRouter(tags=["Auth & Users"])

    @router.post("/api/auth/login")
    async def login(body: LoginRequest, request: Request):
        """เข้าสู่ระบบด้วย Username/Password (JWT Auth) พร้อมบันทึก Audit Event และจำกัด Rate Limit"""
        username = body.username.strip()
        password = body.password
        ip = request.client.host if request.client else "unknown"

        if not check_login_rate_limit(ip):
            await record_audit_event(
                action="LOGIN_RATE_LIMITED",
                resource_type="USER",
                resource_id=username,
                details={"reason": "Excessive failed login attempts from IP"},
                status="BLOCKED",
                ip=ip,
            )
            raise HTTPException(
                status_code=429,
                detail="มีการพยายามเข้าสู่ระบบไม่ถูกต้องเกินกำหนด กรุณารอ 60 วินาทีก่อนลองใหม่อีกครั้ง",
            )

        pool = await get_pool()
        user_row = None
        if pool:
            try:
                row = await pool.fetchrow(
                    "SELECT id, username, password_hash, full_name, role, site, assigned_boxes, is_active "
                    "FROM users WHERE LOWER(username) = LOWER($1)",
                    username,
                )
                if row:
                    user_row = dict(row)
            except Exception as e:
                print(f"[Login DB Error] {e}")

        if not user_row and username.lower() in in_memory_users:
            user_row = in_memory_users[username.lower()]

        if not user_row or not user_row.get("is_active", True):
            record_login_failure(ip)
            await record_audit_event(
                action="LOGIN_FAILED",
                resource_type="USER",
                resource_id=username,
                details={"reason": "User not found or inactive"},
                status="DENIED",
                ip=ip,
            )
            raise HTTPException(status_code=401, detail="Invalid username or password")

        if not verify_password(password, user_row["password_hash"]):
            record_login_failure(ip)
            await record_audit_event(
                action="LOGIN_FAILED",
                resource_type="USER",
                resource_id=username,
                details={"reason": "Invalid password"},
                status="DENIED",
                ip=ip,
            )
            raise HTTPException(status_code=401, detail="Invalid username or password")

        reset_login_failures(ip)

        if pool:
            try:
                await pool.execute("UPDATE users SET last_login = NOW() WHERE id = $1", user_row["id"])
            except Exception:
                pass

        token_data = {
            "sub": str(user_row["id"]),
            "username": user_row["username"],
            "role": user_row["role"],
            "full_name": user_row.get("full_name") or user_row["username"],
            "site": user_row.get("site") or "Main Plant",
        }
        access_token = create_access_token(token_data)

        await record_audit_event(
            action="LOGIN",
            resource_type="USER",
            resource_id=str(user_row["id"]),
            details={"username": user_row["username"], "role": user_row["role"]},
            user=token_data,
            status="SUCCESS",
            ip=ip,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in_minutes": access_token_expire_minutes,
            "user": {
                "id": user_row["id"],
                "username": user_row["username"],
                "full_name": user_row.get("full_name") or user_row["username"],
                "role": user_row["role"],
                "site": user_row.get("site") or "Main Plant",
                "assigned_boxes": user_row.get("assigned_boxes") or [],
            },
        }

    @router.post("/api/auth/logout")
    async def logout(request: Request, current_user: dict = Depends(get_current_user)):
        """ออกจากระบบและบันทึกประวัติ Audit"""
        ip = request.client.host if request.client else "unknown"
        await record_audit_event(
            action="LOGOUT",
            resource_type="USER",
            resource_id=str(current_user["id"]),
            details={"username": current_user["username"]},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "message": "Logged out successfully"}

    @router.get("/api/auth/me")
    async def get_me(current_user: dict = Depends(get_current_user)):
        """ดึงข้อมูลผู้ใช้ปัจจุบันจาก Session Token"""
        return current_user

    @router.get("/api/users")
    async def list_users(current_user: dict = Depends(require_roles("admin"))):
        """เรียกดูรายชื่อผู้ใช้ทั้งหมดในระบบ (เฉพาะ Admin)"""
        pool = await get_pool()
        if pool:
            try:
                rows = await pool.fetch(
                    """
                    SELECT id, username, full_name, role, site, assigned_boxes, is_active,
                           to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS created_at,
                           to_char(last_login AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS last_login
                    FROM users ORDER BY id ASC
                    """
                )
                return [dict(r) for r in rows]
            except Exception as e:
                print(f"[List Users DB Error] {e}")

        return [
            {
                "id": u["id"],
                "username": u["username"],
                "full_name": u["full_name"],
                "role": u["role"],
                "site": u["site"],
                "assigned_boxes": u.get("assigned_boxes", []),
                "is_active": u.get("is_active", True),
                "created_at": u.get("created_at"),
                "last_login": u.get("last_login"),
            }
            for u in in_memory_users.values()
        ]

    @router.post("/api/users")
    async def create_user(
        body: UserCreateRequest,
        request: Request,
        current_user: dict = Depends(require_roles("admin")),
    ):
        """สร้างบัญชีผู้ใช้ใหม่ (เฉพาะ Admin)"""
        role = body.role.lower().strip()
        if role not in ("operator", "engineer", "admin", "viewer"):
            raise HTTPException(
                status_code=400,
                detail="Invalid role. Must be one of: operator, engineer, admin, viewer",
            )

        username = body.username.strip()
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        if len(body.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        pw_hash = get_password_hash(body.password)
        ip = request.client.host if request.client else "unknown"

        pool = await get_pool()
        new_id = None
        if pool:
            try:
                new_id = await pool.fetchval(
                    """
                    INSERT INTO users (username, password_hash, full_name, role, site, assigned_boxes, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, TRUE)
                    RETURNING id
                    """,
                    username, pw_hash, body.full_name, role, body.site, body.assigned_boxes,
                )
            except Exception as e:
                if "unique" in str(e).lower():
                    raise HTTPException(status_code=409, detail=f"Username '{username}' already exists")
                raise HTTPException(status_code=500, detail=str(e))
        else:
            if username.lower() in in_memory_users:
                raise HTTPException(status_code=409, detail=f"Username '{username}' already exists")
            new_id = len(in_memory_users) + 1
            in_memory_users[username.lower()] = {
                "id": new_id,
                "username": username,
                "password_hash": pw_hash,
                "full_name": body.full_name,
                "role": role,
                "site": body.site,
                "assigned_boxes": body.assigned_boxes,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login": None,
            }

        await record_audit_event(
            action="CREATE_USER",
            resource_type="USER",
            resource_id=str(new_id),
            details={"created_username": username, "assigned_role": role, "site": body.site},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )

        return {
            "status": "ok",
            "id": new_id,
            "username": username,
            "full_name": body.full_name,
            "role": role,
            "site": body.site,
        }

    @router.patch("/api/users/{user_id}")
    async def update_user(
        user_id: int,
        body: UserUpdateRequest,
        request: Request,
        current_user: dict = Depends(require_roles("admin")),
    ):
        """ปรับปรุงข้อมูลผู้ใช้ บทบาท หรือสถานะการใช้งาน (เฉพาะ Admin)"""
        pool = await get_pool()
        ip = request.client.host if request.client else "unknown"

        updates = {}
        if body.full_name is not None:
            updates["full_name"] = body.full_name
        if body.role is not None:
            r = body.role.lower().strip()
            if r not in ("operator", "engineer", "admin", "viewer"):
                raise HTTPException(status_code=400, detail="Invalid role")
            updates["role"] = r
        if body.site is not None:
            updates["site"] = body.site
        if body.assigned_boxes is not None:
            updates["assigned_boxes"] = body.assigned_boxes
        if body.is_active is not None:
            updates["is_active"] = body.is_active
        if body.password:
            if len(body.password) < 6:
                raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
            updates["password_hash"] = get_password_hash(body.password)

        if not updates:
            return {"status": "ok", "message": "No fields to update"}

        if pool:
            set_clauses = []
            vals = []
            for i, (k, v) in enumerate(updates.items(), start=1):
                set_clauses.append(f"{k} = ${i}")
                vals.append(v)
            vals.append(user_id)
            query = (
                f"UPDATE users SET {', '.join(set_clauses)}, updated_at = NOW() "
                f"WHERE id = ${len(vals)} RETURNING id, username, role"
            )
            try:
                row = await pool.fetchrow(query, *vals)
                if not row:
                    raise HTTPException(status_code=404, detail="User not found")
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        else:
            found = False
            for u in in_memory_users.values():
                if u["id"] == user_id:
                    u.update(updates)
                    found = True
                    break
            if not found:
                raise HTTPException(status_code=404, detail="User not found")

        await record_audit_event(
            action="UPDATE_USER",
            resource_type="USER",
            resource_id=str(user_id),
            details={"updated_fields": list(updates.keys())},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "user_id": user_id, "updated": list(updates.keys())}

    @router.delete("/api/users/{user_id}")
    async def deactivate_user(
        user_id: int,
        request: Request,
        current_user: dict = Depends(require_roles("admin")),
    ):
        """ปิดการใช้งานบัญชีผู้ใช้ (Deactivate — เฉพาะ Admin)"""
        if current_user["id"] == user_id:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own admin account")

        pool = await get_pool()
        ip = request.client.host if request.client else "unknown"

        if pool:
            await pool.execute("UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1", user_id)
        else:
            for u in in_memory_users.values():
                if u["id"] == user_id:
                    u["is_active"] = False
                    break

        await record_audit_event(
            action="DEACTIVATE_USER",
            resource_type="USER",
            resource_id=str(user_id),
            details={"deactivated": True},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )
        return {"status": "ok", "message": f"User {user_id} deactivated successfully"}

    @router.get("/api/audit-events")
    async def list_audit_events(
        limit: int = 50,
        offset: int = 0,
        action: Optional[str] = None,
        username: Optional[str] = None,
        current_user: dict = Depends(require_roles("admin", "engineer")),
    ):
        """เรียกดูบันทึก Audit Trail แบบ Append-only (เฉพาะ Admin และ Engineer)"""
        limit = min(max(1, limit), 200)
        pool = await get_pool()

        if pool:
            try:
                where_clauses = []
                vals = []
                if action:
                    vals.append(action)
                    where_clauses.append(f"action = ${len(vals)}")
                if username:
                    vals.append(username)
                    where_clauses.append(f"username = ${len(vals)}")

                where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
                total = await pool.fetchval(f"SELECT COUNT(*) FROM audit_events {where_str}", *vals)

                vals.extend([limit, offset])
                rows = await pool.fetch(
                    f"""
                    SELECT id, timestamp, user_id, username, role, ip_address, action,
                           resource_type, resource_id, details, status
                    FROM audit_events {where_str}
                    ORDER BY timestamp DESC
                    LIMIT ${len(vals) - 1} OFFSET ${len(vals)}
                    """,
                    *vals,
                )
                items = []
                for r in rows:
                    item = dict(r)
                    if isinstance(item["details"], str):
                        try:
                            item["details"] = json.loads(item["details"])
                        except Exception:
                            pass
                    item["timestamp"] = (
                        item["timestamp"].isoformat() if hasattr(item["timestamp"], "isoformat") else str(item["timestamp"])
                    )
                    items.append(item)
                return {"total": total, "limit": limit, "offset": offset, "items": items}
            except Exception as e:
                print(f"[Audit List Error] {e}")

        filtered = in_memory_audit_events
        if action:
            filtered = [e for e in filtered if e["action"] == action]
        if username:
            filtered = [e for e in filtered if e["username"] == username]

        return {
            "total": len(filtered),
            "limit": limit,
            "offset": offset,
            "items": filtered[offset : offset + limit],
        }

    @router.get("/api/audit-events/export")
    async def export_audit_events(
        request: Request,
        current_user: dict = Depends(require_roles("admin", "engineer")),
    ):
        """ส่งออกบันทึก Audit Trail ทั้งหมดเป็นไฟล์ CSV สำหรับการตรวจสอบย้อนหลัง 5 ปี"""
        pool = await get_pool()
        rows = []
        if pool:
            try:
                records = await pool.fetch(
                    """
                    SELECT id, timestamp, username, role, ip_address, action, resource_type, resource_id, status, details
                    FROM audit_events ORDER BY timestamp DESC LIMIT 10000
                    """
                )
                rows = [dict(r) for r in records]
            except Exception as e:
                print(f"[Audit Export Error] {e}")

        if not rows:
            rows = in_memory_audit_events

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Event ID", "Timestamp", "Username", "Role", "IP Address",
            "Action", "Resource Type", "Resource ID", "Status", "Details JSON",
        ])

        for r in rows:
            ts = r.get("timestamp")
            ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
            det = r.get("details")
            det_str = json.dumps(det, ensure_ascii=False) if isinstance(det, dict) else str(det)
            writer.writerow([
                r.get("id"),
                ts_str,
                r.get("username"),
                r.get("role"),
                r.get("ip_address"),
                r.get("action"),
                r.get("resource_type"),
                r.get("resource_id"),
                r.get("status"),
                det_str,
            ])

        ip = request.client.host if request.client else "unknown"
        await record_audit_event(
            action="EXPORT_AUDIT_LOGS",
            resource_type="AUDIT_TRAIL",
            resource_id="audit_export_csv",
            details={"record_count": len(rows)},
            user=current_user,
            status="SUCCESS",
            ip=ip,
        )

        output.seek(0)
        filename = f"audit_trail_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    return router
