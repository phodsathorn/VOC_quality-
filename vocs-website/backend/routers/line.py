"""
routers/line.py
---------------
LINE Official Account (LINE OA) Webhook & Subscriber Management endpoints:
- POST /api/line/webhook (BIND, UNBIND, STATUS, HELP)
- GET /api/line/subscribers (admin/engineer)
- DELETE /api/line/subscribers/{sub_id} (admin)
"""
from datetime import datetime, timezone
import json
import os
import urllib.request
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request

from line_adapter import reply_line_message, verify_line_signature


def create_line_router(*, get_pool, require_roles, in_memory_line_subscribers: list) -> APIRouter:
    router = APIRouter(tags=["LINE OA"])

    @router.post("/api/line/webhook")
    async def line_webhook(request: Request):
        """
        LINE Bot Webhook: รับ Events จาก LINE Platform
        - ตรวจสอบ Signature ก่อนประมวลผลทุกครั้ง (HMAC-SHA256)
        - รองรับคำสั่ง: BIND <BOX_ID>, UNBIND <BOX_ID>, STATUS
        """
        body_bytes = await request.body()
        signature = request.headers.get("X-Line-Signature", "")

        if not verify_line_signature(body_bytes, signature):
            raise HTTPException(status_code=403, detail="Invalid LINE signature")

        try:
            payload = json.loads(body_bytes)
        except Exception:
            return {"status": "ok"}

        pool = await get_pool()

        for event in payload.get("events", []):
            if event.get("type") != "message":
                continue
            msg = event.get("message", {})
            if msg.get("type") != "text":
                continue

            text = msg.get("text", "").strip().upper()
            reply_token = event.get("replyToken", "")
            source = event.get("source", {})
            line_user_id = source.get("userId", "")

            if not line_user_id:
                continue

            display_name = "LINE User"
            try:
                token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
                if token:
                    profile_url = f"https://api.line.me/v2/bot/profile/{line_user_id}"
                    headers = {"Authorization": f"Bearer {token}"}
                    req = urllib.request.Request(profile_url, headers=headers)
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        profile = json.loads(resp.read())
                        display_name = profile.get("displayName", "LINE User")
            except Exception:
                pass

            if text.startswith("BIND "):
                box_id = text[5:].strip()
                if not box_id:
                    reply_line_message(reply_token, "❌ กรุณาระบุหมายเลขกล่อง เช่น: BIND BOX-001")
                    continue

                valid_box = False
                if pool:
                    row = await pool.fetchrow("SELECT box_id FROM devices WHERE box_id = $1", box_id)
                    valid_box = row is not None
                else:
                    valid_box = box_id in ["BOX-001", "BOX-002"]

                if not valid_box:
                    reply_line_message(
                        reply_token,
                        f"❌ ไม่พบกล่อง {box_id} ในระบบ\n"
                        f"กรุณาตรวจสอบหมายเลขอีกครั้ง หรือพิมพ์ STATUS เพื่อดูกล่องที่ผูกไว้",
                    )
                    continue

                if pool:
                    await pool.execute(
                        """
                        INSERT INTO line_subscribers (line_user_id, box_id, display_name, is_active)
                        VALUES ($1, $2, $3, TRUE)
                        ON CONFLICT (line_user_id, box_id)
                        DO UPDATE SET is_active = TRUE, display_name = $3, updated_at = NOW()
                        """,
                        line_user_id, box_id, display_name,
                    )
                else:
                    found = False
                    for sub in in_memory_line_subscribers:
                        if sub["line_user_id"] == line_user_id and sub["box_id"] == box_id:
                            sub["is_active"] = True
                            sub["display_name"] = display_name
                            found = True
                            break
                    if not found:
                        in_memory_line_subscribers.append({
                            "id": len(in_memory_line_subscribers) + 1,
                            "line_user_id": line_user_id,
                            "box_id": box_id,
                            "display_name": display_name,
                            "is_active": True,
                            "created_at": datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M"),
                        })

                reply_line_message(
                    reply_token,
                    f"✅ ผูกบัญชีสำเร็จ!\n"
                    f"📦 กล่อง: {box_id}\n"
                    f"👤 ชื่อ: {display_name}\n"
                    f"🔔 คุณจะได้รับแจ้งเตือนอัตโนมัติเมื่อเกิด SLA Breach\n"
                    f"   (ไม่มีผู้รับทราบ Alert ภายใน 5-10 นาที)\n"
                    f"💡 พิมพ์ UNBIND {box_id} เพื่อยกเลิก",
                )

            elif text.startswith("UNBIND "):
                box_id = text[7:].strip()
                if pool:
                    await pool.execute(
                        "UPDATE line_subscribers SET is_active = FALSE, updated_at = NOW() WHERE line_user_id = $1 AND box_id = $2",
                        line_user_id, box_id,
                    )
                else:
                    for sub in in_memory_line_subscribers:
                        if sub["line_user_id"] == line_user_id and sub["box_id"] == box_id:
                            sub["is_active"] = False
                reply_line_message(
                    reply_token,
                    f"✅ ยกเลิกการแจ้งเตือนจากกล่อง {box_id} เรียบร้อยแล้ว\n"
                    f"พิมพ์ STATUS เพื่อดูกล่องที่ยังผูกอยู่",
                )

            elif text == "STATUS":
                if pool:
                    rows = await pool.fetch(
                        "SELECT box_id FROM line_subscribers WHERE line_user_id = $1 AND is_active = TRUE",
                        line_user_id,
                    )
                    subs = [r["box_id"] for r in rows]
                else:
                    subs = [
                        s["box_id"] for s in in_memory_line_subscribers
                        if s["line_user_id"] == line_user_id and s["is_active"]
                    ]

                if subs:
                    reply_line_message(
                        reply_token,
                        "📊 สถานะการแจ้งเตือนของคุณ:\n"
                        + "\n".join(f"  ✅ {b}" for b in subs)
                        + f"\n\nรวม {len(subs)} กล่อง\n"
                        + "พิมพ์ UNBIND <BOX_ID> เพื่อยกเลิก",
                    )
                else:
                    reply_line_message(
                        reply_token,
                        "📭 คุณยังไม่ได้ผูกกล่องใดๆ\n"
                        "💡 พิมพ์ BIND BOX-001 เพื่อเริ่มรับแจ้งเตือน",
                    )

            else:
                reply_line_message(
                    reply_token,
                    "🤖 VOC Safety Bot — คำสั่งที่ใช้ได้:\n"
                    "─────────────────────\n"
                    "📌 BIND <BOX_ID>  — ผูกบัญชีรับแจ้งเตือนจากกล่อง\n"
                    "   ตัวอย่าง: BIND BOX-001\n\n"
                    "📌 UNBIND <BOX_ID> — ยกเลิกการแจ้งเตือน\n"
                    "   ตัวอย่าง: UNBIND BOX-001\n\n"
                    "📌 STATUS — ดูกล่องที่ผูกไว้ทั้งหมด\n"
                    "─────────────────────\n"
                    "🔔 ระบบจะแจ้งเตือนอัตโนมัติเมื่อมีก๊าซอันตราย\n"
                    "   และไม่มีผู้ดูแลรับทราบภายในเวลาที่กำหนด",
                )

        return {"status": "ok"}

    @router.get("/api/line/subscribers")
    async def get_line_subscribers(
        box_id: Optional[str] = None,
        current_user: dict = Depends(require_roles("admin", "engineer")),
    ):
        """เรียกดูรายชื่อผู้ใช้ LINE ที่ผูกกับกล่องเซนเซอร์ (admin/engineer เท่านั้น)"""
        pool = await get_pool()
        if pool:
            try:
                if box_id:
                    rows = await pool.fetch(
                        """
                        SELECT id, line_user_id, box_id, display_name, is_active,
                               to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS created_at
                        FROM line_subscribers
                        WHERE box_id = $1
                        ORDER BY id DESC
                        """,
                        box_id,
                    )
                else:
                    rows = await pool.fetch(
                        """
                        SELECT id, line_user_id, box_id, display_name, is_active,
                               to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS created_at
                        FROM line_subscribers
                        ORDER BY id DESC
                        """
                    )
                return [dict(r) for r in rows]
            except Exception as e:
                print(f"[LINE Subscribers Error] {e}")
        result = in_memory_line_subscribers
        if box_id:
            result = [s for s in result if s["box_id"] == box_id]
        return result

    @router.delete("/api/line/subscribers/{sub_id}")
    async def delete_line_subscriber(
        sub_id: int,
        current_user: dict = Depends(require_roles("admin")),
    ):
        """ยกเลิก (Deactivate) การผูกบัญชี LINE — admin เท่านั้น"""
        pool = await get_pool()
        if pool:
            result = await pool.execute(
                "UPDATE line_subscribers SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
                sub_id,
            )
            if result == "UPDATE 0":
                raise HTTPException(status_code=404, detail=f"Subscriber {sub_id} not found")
        else:
            found = False
            for sub in in_memory_line_subscribers:
                if sub["id"] == sub_id:
                    sub["is_active"] = False
                    found = True
                    break
            if not found:
                raise HTTPException(status_code=404, detail=f"Subscriber {sub_id} not found")
        return {"status": "ok", "message": f"Subscriber {sub_id} deactivated"}

    return router
