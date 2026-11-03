import os
import json
import hmac
import hashlib
import base64
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List

# LINE OA Configuration (Phase W2 & LINE Bot Pairing)
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET", "").strip()
LINE_TARGET_GROUP_ID = os.getenv("LINE_TARGET_GROUP_ID", "").strip()
LINE_SANDBOX_MODE = not bool(LINE_CHANNEL_ACCESS_TOKEN)


def verify_line_signature(body_bytes: bytes, signature: str) -> bool:
    """ตรวจสอบความถูกต้องของ LINE Webhook Signature ด้วย HMAC-SHA256"""
    secret = os.getenv("LINE_CHANNEL_SECRET", LINE_CHANNEL_SECRET)
    if not secret or not signature:
        # หากอยู่ในโหมดทดสอบหรือไม่มี Secret ให้ผ่าน
        return True
    try:
        hash_val = hmac.new(secret.encode('utf-8'), body_bytes, hashlib.sha256).digest()
        expected = base64.b64encode(hash_val).decode('utf-8')
        return hmac.compare_digest(expected, signature)
    except Exception:
        return False


def reply_line_message(reply_token: str, text: str) -> bool:
    """ตอบกลับข้อความ (Free Reply Message — ไม่คิดโควต้า 500 ข้อความ)"""
    if LINE_SANDBOX_MODE:
        print(f"[LINE BOT SANDBOX REPLY] Token: {reply_token[:10]}... | Text: {text}")
        return True

    try:
        url = "https://api.line.me/v2/bot/message/reply"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}"
        }
        body = {
            "replyToken": reply_token,
            "messages": [{"type": "text", "text": text}]
        }
        req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status == 200
    except Exception as e:
        print(f"[LINE Bot Reply Error] {e}")
        return False


def push_line_message(target_id: str, text: str) -> bool:
    """ส่งข้อความแบบ Push Message ไปยัง User ID หรือ Group ID ที่เจาะจง"""
    if LINE_SANDBOX_MODE:
        print(f"[LINE BOT SANDBOX PUSH] To: {target_id} | Text:\n{text}")
        return True

    try:
        url = "https://api.line.me/v2/bot/message/push"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}"
        }
        body = {
            "to": target_id,
            "messages": [{"type": "text", "text": text}]
        }
        req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status == 200
    except Exception as e:
        print(f"[LINE Push Error to {target_id}] {e}")
        return False


def build_escalation_message(alert: Dict[str, Any]) -> Dict[str, Any]:
    """สร้างโครงสร้างข้อความแจ้งเตือน Escalation ผ่าน LINE OA"""
    level = alert.get("level", "Warning")
    box_id = alert.get("box_id", "UNKNOWN")
    message = alert.get("message", "High VOC detected")
    alert_id = alert.get("id", "N/A")
    created_at = alert.get("created_at", "Just now")
    sla_min = 10 if level == "Warning" else 5

    theme_color = "#dc2626" if level == "Critical" else "#d97706" if level == "High" else "#2563eb"

    text_summary = (
        f"🚨 [SLA BREACH ALERT — LINE NOTIFICATION]\n"
        f"─────────────────────\n"
        f"⚠️ ระดับ: {level.upper()}\n"
        f"📦 กล่อง: {box_id}\n"
        f"⏳ สถานะ: เกินกำหนด SLA {sla_min} นาที (ยังไม่มีผู้รับทราบ)\n"
        f"📝 รายละเอียด: {message}\n"
        f"🆔 Alert ID: #{alert_id}\n"
        f"⏰ เวลาเกิดเหตุ: {created_at}\n"
        f"─────────────────────\n"
        f"👉 กรุณาเข้าตรวจสอบด่วนที่ Kiosk หน้างาน หรือ Web Dashboard"
    )

    return {
        "summary": text_summary,
        "level": level,
        "box_id": box_id,
        "alert_id": alert_id,
        "sla_minutes": sla_min,
        "color": theme_color
    }


def send_escalation_alert(alert: Dict[str, Any], subscriber_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    ส่งข้อความ Escalation เมื่อเกิด SLA Breach:
    - ส่งหาเป้าหมายหลัก LINE_TARGET_GROUP_ID (ถ้ามี)
    - ส่งหาผู้ใช้ทุกคนที่พิมพ์คำสั่ง BIND ผูกกับกล่องนี้ไว้ (subscriber_ids)
    """
    msg_data = build_escalation_message(alert)
    targets = set()

    if LINE_TARGET_GROUP_ID:
        targets.add(LINE_TARGET_GROUP_ID)
    if subscriber_ids:
        for sid in subscriber_ids:
            if sid:
                targets.add(sid)

    # หากไม่มีใครผูกไว้เลย ให้ fallback จำลอง
    if not targets:
        targets.add("DEFAULT_OPS_CHANNEL")

    results = []
    for tgt in targets:
        ok = push_line_message(tgt, msg_data["summary"])
        results.append({"target": tgt, "success": ok})

    return {
        "status": "success",
        "mode": "sandbox" if LINE_SANDBOX_MODE else "live",
        "delivered_count": sum(1 for r in results if r["success"]),
        "targets": results,
        "payload": msg_data
    }
