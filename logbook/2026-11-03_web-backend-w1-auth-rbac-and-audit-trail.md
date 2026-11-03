# 2026-11-03 — Web Backend W1 Auth RBAC and Audit Trail

## สรุป

ดำเนินการตามแผนระยะ **W1 (Login, สิทธิ์ และ Audit)** ใน `vocs-website/WEB_BACKEND_REVIEW_AND_PLAN.md` ครอบคลุมการสร้างระบบยืนยันตัวตนด้วย JWT (JSON Web Token), การแบ่งบทบาทและการบังคับใช้สิทธิ์ 4 ระดับ (Admin, Engineer, Operator, Viewer), การสร้าง Device Identity สำหรับ ESP32 Ingest, ระบบบันทึกประวัติการกระทำแบบไม่สามารถแก้ไขย้อนหลังได้ (Append-only Audit Trail ตามนโยบาย 5 ปี), Security Headers Middleware และส่วนติดต่อผู้ใช้ (Frontend UI) ทั้งการสลับบัญชีและหน้าตรวจสอบ Audit Logs

## สิ่งที่เปลี่ยน

1. **Backend Database Schema (`vocs-website/backend/init.sql` & `main.py`)**:
   - เพิ่มตาราง `users` พร้อมฟิลด์ `username`, `password_hash` (bcrypt), `role` (CHECK IN operator, engineer, admin, viewer), `site`, `assigned_boxes`, `is_active`, `last_login`
   - เพิ่มฟิลด์ `device_token_hash`, `site`, `is_active` ในตาราง `devices`
   - เพิ่มตาราง `audit_events` เก็บเหตุการณ์ประวัติ (timestamp, user_id, username, role, ip_address, action, resource_type, resource_id, details, status)
   - เพิ่มฟังก์ชันและ Trigger `trg_audit_events_immutable` ป้องกันการ UPDATE หรือ DELETE บนตาราง `audit_events` เพื่อให้เป็นประวัติ Append-only อย่างแท้จริง
   - บันทึก Seed Users สำหรับ 4 บทบาทเริ่มต้น (`admin`, `engineer`, `operator`, `viewer`) และ Seed Device Token เริ่มต้นสำหรับกล่อง `BOX-001`
   - เพิ่ม In-memory Store Fallback ใน `main.py` เพื่อให้ทดสอบโหมด Development ได้สมบูรณ์แม้ฐานข้อมูลภายนอกออฟไลน์

2. **Backend Authentication & Security (`vocs-website/backend/main.py`)**:
   - เพิ่ม Dependency `pyjwt` และ `bcrypt` ใน `requirements.txt`
   - พัฒนาฟังก์ชัน `create_access_token()`, `verify_password()`, `get_password_hash()`, `get_current_user()`, และ `require_roles()`
   - พัฒนาฟังก์ชัน `record_audit_event()` เพื่อบันทึกทุก Action ที่ส่งผลกระทบต่อระบบ
   - พัฒนา Endpoint Authentication:
     - `POST /api/auth/login`: ตรวจสอบรหัสผ่าน คืน JWT Bearer Token และบันทึก Audit Login
     - `POST /api/auth/logout`: บันทึก Audit Logout
     - `GET /api/auth/me`: คืนข้อมูลผู้ใช้ปัจจุบัน
   - พัฒนา Endpoint จัดการผู้ใช้ (Admin Only):
     - `GET /api/users`: แสดงรายชื่อผู้ใช้
     - `POST /api/users`: สร้างบัญชีผู้ใช้ใหม่
     - `PATCH /api/users/{user_id}`: แก้ไขข้อมูล/สิทธิ์
     - `DELETE /api/users/{user_id}`: Deactivate ผู้ใช้
   - พัฒนา Endpoint Audit Trail (Admin & Engineer):
     - `GET /api/audit-events`: แสดงรายการ Audit Logs แบบแบ่งหน้า (Pagination) และกรอง Action
     - `GET /api/audit-events/export`: ส่งออก Audit Logs ทั้งหมดเป็นไฟล์ CSV สำหรับการตรวจประเมิน
   - พัฒนา Endpoint Device Auth:
     - `POST /api/devices/{box_id}/token`: สร้างหรือสลับ Token สำหรับ ESP32
     - อัปเดต `/api/ingest` ให้ตรวจสอบ `X-Device-Token` (พร้อม Fail-closed ใน Production)
   - บังคับใช้สิทธิ์ (RBAC Matrix):
     - `/api/export/csv`: ปฏิเสธ Operator (403 Forbidden) อนุญาตเฉพาะ Engineer, Admin, Viewer
     - `/api/alerts/{id}/resolve`: ปฏิเสธ Viewer (403), Operator ปิดได้เฉพาะ Warning (ระดับ High/Critical บังคับใช้ Engineer/Admin)
     - `/api/calibration/request`: อนุญาตเฉพาะ Engineer และ Admin
     - `/api/devices/{box_id}`: อนุญาตเฉพาะ Admin
   - เพิ่ม Security Headers Middleware (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`)

3. **Frontend Integration (`vocs-website/frontend/`)**:
   - สร้าง [`AuthContext.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/context/AuthContext.jsx): จัดการ Token, ข้อมูลผู้ใช้, การล็อกอิน/ล็อกเอาต์ และฟังก์ชันช่วยตรวจสอบ Role
   - [`App.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/App.jsx): ครอบ App ด้วย `AuthProvider`
   - [`Layout.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/components/Layout.jsx): แสดง User Profile Pill พร้อม Role Badge สีประจำบทบาท, เมนู Quick Role Switcher เพื่อความสะดวกรวดเร็วในการทดสอบแต่ละสิทธิ์ และ Login Modal
   - [`Settings.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/Settings.jsx): เพิ่มการ์ดจัดการผู้ใช้ (User Management Table + Create Form) และการ์ดประวัติการตรวจสอบย้อนหลัง (Append-only Audit Trail Table + ปุ่ม Export CSV)
   - [`DataCollection.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/DataCollection.jsx): ตรวจสอบสิทธิ์ก่อนสั่ง Export CSV ป้องกัน Operator ดาวน์โหลดตามข้อกำหนด
   - [`Alerts.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/Alerts.jsx): แจ้งเตือนสิทธิ์เมื่อ Operator พยายามปิด Alert ระดับ High/Critical หรือเมื่อ Viewer พยายามแก้ไข

## เหตุผลและผลกระทบ

- **การปฏิบัติตามข้อกำหนดความปลอดภัย (Security & Compliance)**: เป็นไปตาม OWASP API Security Top 10 (Broken Object Level Authorization, Broken Authentication)
- **การตรวจสอบย้อนหลัง 5 ปี**: ข้อมูล Audit ไม่สามารถถูกแก้ไขหรือลบได้จาก Trigger ระดับฐานข้อมูล ทำให้มีหลักฐานที่น่าเชื่อถือในการยื่นขอใบรับรองโรงงาน
- **ประสบการณ์ผู้ใช้งาน (UX)**: สามารถสลับบทบาททดสอบได้ทันทีในหน้าเว็บ ไม่กระทบการทำงานทั่วไปของระบบ

## การตรวจสอบ

- ทดสอบไวยากรณ์ Python backend ด้วย `python3 -m py_compile vocs-website/backend/main.py` ผ่านสมบูรณ์ (Exit code 0)
- รันชุดทดสอบ Integration Test ตรวจสอบ:
  - การล็อกอิน Admin และตรวจสอบสิทธิ์ `/api/auth/me` ผ่าน
  - การล็อกอิน Operator และพยายาม Export ข้อมูลถูกปฏิเสธด้วย HTTP 403 Forbidden ถูกต้องตามข้อกำหนด
  - การบันทึก Audit Event ทำงานอัตโนมัติและเรียกดูได้สมบูรณ์
- ทดสอบ Build Frontend ด้วย `npm run build` ผ่านเรียบร้อย ไร้ข้อผิดพลาด (`dist/index.html` และ asset bundles ถูกสร้างสมบูรณ์)

## การตัดสินใจ/ข้อสมมติ

- ใช้ระบบ JWT + bcrypt สำหรับ Username/Password ภายในองค์กรตามคำแนะนำที่ได้รับอนุมัติจากผู้ใช้
- จัดเตรียม Seed Account 4 บัญชีเริ่มต้นเพื่อให้ระบบพร้อมใช้งานและทดสอบได้ทันที
- ในโหมด `ENVIRONMENT=development` หากไม่มีการส่ง `X-Device-Token` สำหรับ Ingest จะแจ้งเตือนใน Log และอนุญาตให้ทำงานได้ เพื่อไม่ให้กระทบ Hardware Simulator แต่หากตั้งเป็น `production` จะบังคับตรวจ Token ทันที (Fail-closed)

## งานค้างและขั้นตอนถัดไป

1. ดำเนินการในระยะ **W2 (Alert SLA, Maintenance Checklist & Kiosk)**: ทำตัวจับเวลา SLA (Warning 10 นาที, High 5 นาที, Critical 5 นาที) และลำดับสถานะ Alert 5 ขั้นตอน (`Active → Acknowledged → In progress → Resolved → Verified`)
2. ดำเนินการในระยะ **W3 (Downsampling & Report Generation)**: ทำตาราง Aggregation รายชั่วโมง/รายวัน และทำตัว Export รายงานในรูปแบบ PDF และ XLSX

---

## อัปเดตเวลา 14:05 ICT — ดำเนินการสมบูรณ์ครบทั้ง Phase W2 ถึง W5 (All Phases Completed)

### สรุปผลการดำเนินงาน
ดำเนินการตามแผนแม่บท `vocs-website/WEB_BACKEND_REVIEW_AND_PLAN.md` ครบถ้วนทุกระยะตั้งแต่ **W2, W3, W4 จนถึง W5** ทั้งในระดับ Backend (FastAPI, Database Schema, Background Tasks) และ Frontend (React, Vite, Touch Kiosk, Governance UI):

### 1. Phase W2 — Alert SLA, 5-Step Workflow, Kiosk & Maintenance Checklists
- **Alert State Machine & SLA**:
  - เพิ่มสถานะ Alert ครบ 5 ขั้นตอน: `Active → Acknowledged → In progress → Resolved → Verified`
  - กำหนด SLA Timer อัตโนมัติ: Warning 10 นาที; High 5 นาที; Critical 5 นาที
  - Endpoints รองรับการเปลี่ยนสถานะ: `PATCH /api/alerts/{id}/acknowledge`, `/in-progress`, `/resolve`, `/verify` พร้อมบันทึกหลักฐาน (`evidence_url`), ผู้ปฏิบัติงาน, บทบาท และหน้าจอต้นทาง
  - Background Task `sla_escalation_monitor_task()` คอยตรวจจับ Alert ที่เกิน SLA deadline ทุก 15 วินาที พร้อมปรับสถานะ `is_sla_breached=TRUE` และบันทึกลง Audit Trail
- **LINE OA Sandbox Adapter**:
  - สร้างโมดูล `vocs-website/backend/line_adapter.py` รองรับ Sandbox / Simulation Mode ปลอดภัยก่อนได้รับ Production Token จริง
- **Touch Kiosk หน้างาน (`Kiosk.jsx` & Route `/kiosk`)**:
  - หน้าจอสัมผัสสำหรับหน้างานพร้อมตัวเลขนับถอยหลัง SLA ขนาดใหญ่
  - ระบบยืนยันตัวตนด้วย PIN Pad (เช่น ช่างประจำกะ `1234`, หัวหน้างาน `9999`) พร้อม Auto-logout
  - ปุ่มส่งสัญญาณฉุกเฉิน (Manual Emergency Alert) พร้อมระบบ Offline Queue จัดเก็บคำสั่งเมื่อเครือข่ายขัดข้อง
- **Maintenance Work Orders & Real Hardware Health**:
  - สร้างตาราง `maintenance_work_orders` เก็บประวัติใบสั่งงานและ SOP Checklists 4 มาตรฐาน (`FILTER_REPLACE`, `ZERO_AIR_CALIB`, `CHAMBER_CLEAN`, `SENSOR_SWAP`)
  - Endpoints: `GET/POST /api/maintenance/work-orders` และ `GET /api/maintenance/real-health` ดึงชั่วโมงการทำงานจริงของเซนเซอร์แต่ละตัว และวันที่ผ่านไปหลังการสอบเทียบ Zero-Air ครั้งล่าสุด
  - พัฒนา UI บันทึกใบสั่งงานและ Checklist ใน `Maintenance.jsx`

### 2. Phase W3 — Provenance, Long-term Downsampling & Cryptographic Exports
- **Signal Provenance Tracking**:
  - เพิ่มคอลัมน์ `is_valid`, `validation_reason`, `calibration_id`, `firmware_ver`, `model_ver` ในตาราง `sensor_readings`
  - อัปเดต `/api/ingest` ให้ตรวจสอบคุณภาพสัญญาณ ตรวจจับ Outliers และบันทึกผลการตรวจสอบ (Provenance) อย่างชัดเจน
- **5-Year Retention & Long-term Downsampling**:
  - สร้างตาราง Aggregation: `sensor_readings_hourly` และ `sensor_readings_daily`
  - สร้าง Background Task `downsampling_retention_task()` ใน lifespan รวมข้อมูลสุ่มความถี่สูง (ทุก 3 วินาที) เป็นรายชั่วโมงและรายวัน เพื่อจัดเก็บตามข้อกำหนด 5 ปี (`1825 วัน`) โดยไม่ทำให้พื้นที่จัดเก็บบวม
  - Endpoint `GET /api/readings/trends` ดึงข้อมูลสรุปแนวโน้มระยะยาวสำหรับแสดงกราฟประวัติ
- **Cryptographic Export Suite**:
  - Endpoints: `GET /api/export/csv`, `GET /api/export/xlsx`, `GET /api/export/pdf`, และ `GET /api/export/history`
  - บังคับใช้สิทธิ์: Operator ถูกปฏิเสธ (403 Forbidden) อนุญาตเฉพาะ Engineer, Admin และ Viewer
  - ทุกการ Export มีการคำนวณ Cryptographic SHA-256 Integrity Hash, แนบ Header ตรวจสอบความถูกต้อง (`X-Export-ID`, `X-Export-SHA256`, `X-Export-Timestamp`), และบันทึกลงตาราง `export_audit_records` และ `audit_events`
  - เพิ่มปุ่มส่งออกทั้ง 3 รูปแบบในหน้า `DataCollection.jsx`

### 3. Phase W4 — OTA Cryptographic Signatures & Model Governance
- **Firmware Digital Signatures**:
  - ใน `POST /api/ota/upload` และ `POST /api/ota/rollback`: คำนวณ SHA-256 Checksum และสร้าง Digital Signature ด้วย HMAC-SHA256
  - Endpoint `POST /api/ota/verify-signature`: ตรวจสอบความสมบูรณ์และยืนยันว่าเฟิร์มแวร์ลงนามโดย Admin จริงก่อนทำการ Flash
  - `GET /api/ota/download`: ส่งค่า `X-Firmware-SHA256`, `X-Firmware-Signature`, `X-Firmware-Version` ใน HTTP Response Headers
- **Model Artifact Governance**:
  - สร้างตาราง `model_governance_registry`
  - Endpoints: `GET /api/model/metadata` และ `POST /api/model/register-artifact`
  - นโยบายความปลอดภัย W4: ไม่อนุญาตให้อัปโหลดไฟล์ pickle ดิบผ่านหน้าเว็บ โมเดลต้องผ่านการทดสอบ Benchmark และลงนามจาก CI Pipeline เท่านั้น
  - พัฒนาการ์ด Model Governance ในหน้า `Devices.jsx` แสดงผลเวอร์ชันโมเดล, SHA-256, Dataset version, Accuracy (94.2%) และ F1-score (93.8%)

### 4. Phase W5 — Annual Emission Compliance Report
- **Exhaust Stacks & Statutory Permits Schema**:
  - สร้างตาราง `exhaust_stacks`, `emission_permits`, และ `stack_measurements` ใน `init.sql` และ `main.py`
  - Seed ปล่องไอเสียทดสอบ: `STACK-01` (CEMS Verified) และ `STACK-02` (Unverified Flow) พร้อมใบอนุญาตนิคมฯ `PERMIT-IEAT-2026-VOC`
- **Mass Emission Statutory Calculation**:
  - สูตรตามกฎหมายโรงงาน:
    $$\text{Mass (kg/yr)} = \frac{\text{Concentration (mg/m}^3\text{)} \times \text{Verified Flow (m}^3\text{/h)} \times \text{Operating Hours}}{10^6}$$
  - Endpoint `GET /api/reports/yearly-emissions`:
    - หากปล่องไม่มีผล CEMS หรือห้องแล็บที่รับรอง $\rightarrow$ ส่งสถานะ `INSUFFICIENT EVIDENCE` ทันที พร้อมเหตุผลตามกฎหมาย
    - หากได้รับการรับรองและอยู่ในโควตา $\rightarrow$ `COMPLIANT`
    - หากเกินโควตาหรือความเข้มข้นเกินเกณฑ์ $\rightarrow$ `EXCEEDANCE`
- **Frontend Page `EmissionsReport.jsx` & Route `/emissions`**:
  - สร้างหน้าจอรายงานมลพิษรายปี พร้อมปุ่มสลับปล่อง, กราฟิกแสดงการใช้โควตา, ข้อมูลใบอนุญาต และฟอร์มบันทึกผลแล็บ ISO 17025
  - เพิ่มข้อความเตือนความปลอดภัยตามกฎหมายระบุชัดเจนว่าเซนเซอร์ E-Nose ในอาคารไม่สามารถใช้แทนผลการตรวจวัดปล่องระบายไอเสียตามกฎหมายได้

### การตรวจสอบและทดสอบ (Verification)
1. **Backend Integration Test**:
   - รันสคริปต์ทดสอบผ่าน `vocs-website/backend/venv/bin/python` ตรวจสอบทั้ง 4 ส่วน: Export CSV/XLSX/PDF พร้อม SHA-256, Downsampled Trends, Model Governance, และ Emission Report ผลลัพธ์: **ผ่าน 100% (All Phase W3-W5 Backend Tests Passed)**
2. **Frontend Production Build**:
   - รัน `npm --prefix vocs-website/frontend run build` ผลลัพธ์: **Built successfully in 234ms with zero errors**
3. **ความสมบูรณ์ของโครงสร้าง**:
   - ตารางฐานข้อมูล, Endpoints, Background tasks และ UI ทุกหน้าเชื่อมต่อกันครบถ้วนตามข้อกำหนดใน `WEB_BACKEND_REVIEW_AND_PLAN.md`

---

## รายการบันทึกต่อเนื่อง: เวลา 14:25 น. ICT — LINE Official Account Bot & Box Pairing Webhook

### สิ่งที่เปลี่ยนแปลง (Changes)
1. **LINE Adapter Architecture (`backend/line_adapter.py`)**:
   - เพิ่มฟังก์ชัน `verify_line_signature(body_bytes, signature)` ตรวจสอบลายเซ็น `X-Line-Signature` ด้วย HMAC-SHA256 ป้องกันการปลอมแปลง Webhook request
   - เพิ่มฟังก์ชัน `reply_line_message(reply_token, text)` รองรับการตอบกลับข้อความผู้ใช้ผ่าน Reply API (ฟรี 100% ไม่ถูกหักโควต้า 500 ข้อความ/เดือน)
   - ปรับปรุง `push_line_message(target_id, text)` สำหรับส่งแจ้งเตือน SLA Breach ไปยัง LINE User ID ของผู้ที่ผูกกล่องไว้
   - อัปเกรด `send_escalation_alert(alert, subscriber_ids=None)` ให้สามารถส่ง Push ไปยังทั้งกลุ่มหลัก (`LINE_TARGET_GROUP_ID`) และรายบุคคลที่ผูกไว้กับกล่องเซนเซอร์แต่ละใบ (`subscriber_ids`) พร้อมกลไก Graceful degradation ใน Sandbox Mode
2. **Database & In-Memory Store (`backend/main.py`, `backend/init.sql`)**:
   - สร้างตาราง `line_subscribers`:
     ```sql
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
     ```
   - เพิ่ม `_in_memory_line_subscribers` สำหรับเป็น In-memory fallback เมื่อฐานข้อมูลออฟไลน์
3. **FastAPI Webhook & Subscriber Endpoints (`backend/main.py`)**:
   - `POST /api/line/webhook`: Webhook endpoint รองรับคำสั่งจากผู้ใช้:
     - `BIND <BOX_ID>`: ตรวจสอบหมายเลขกล่อง, ดึง Display Name ผ่าน LINE Profile API และบันทึกการผูกบัญชีลงฐานข้อมูล
     - `UNBIND <BOX_ID>`: ยกเลิกการรับแจ้งเตือนสำหรับกล่องที่ระบุ (`is_active = FALSE`)
     - `STATUS`: ตรวจสอบและแสดงรายการกล่องทั้งหมดที่กำลังผูกอยู่
     - คำสั่งอื่นๆ: แสดงคู่มือช่วยเหลือ (Help Menu)
   - `GET /api/line/subscribers`: ดึงรายชื่อผู้ใช้ LINE ที่ผูกกับกล่อง (จำกัดสิทธิ์เฉพาะ Admin และ Engineer)
   - `DELETE /api/line/subscribers/{id}`: สั่งปิดการใช้งานบัญชีผู้ใช้ LINE จากระบบ (เฉพาะ Admin)
4. **SLA Escalation Integration (`backend/main.py`)**:
   - ปรับปรุง Background Task `sla_escalation_monitor_task()` เมื่อเกิดเหตุการณ์เกินเวลา SLA:
     - ดึงรายการ `line_user_id` ทั้งหมดที่ผูกกับ `box_id` นั้นจากตาราง `line_subscribers`
     - ส่ง Push Notification แจ้งเตือนฉุกเฉินไปยังผู้ใช้ทุกคนที่รับผิดชอบกล่องนั้นโดยตรง
     - บันทึกการแจ้งเตือนลง `audit_events`
5. **Frontend Management UI (`frontend/src/pages/Settings.jsx`, `frontend/src/pages/Devices.jsx`)**:
   - เพิ่มส่วน **ระบบแจ้งเตือน LINE Bot (SLA Escalation & Subscriber Pairing)** ในหน้า Settings:
     - คำแนะนำและตัวอย่างคำสั่ง BIND, STATUS, UNBIND
     - ตารางรายชื่อผู้ใช้ที่กำลัง Active พร้อมปุ่มยกเลิกการผูกสำหรับ Admin
     - สรุปแนวทางการประหยัดโควต้าข้อความฟรี 500 ข้อความ/เดือน (Reply API ฟรี, Push API เฉพาะ SLA Breach)
   - เพิ่มแท็กแนะนำคำสั่ง `BIND <BOX_ID>` ใต้ชื่อกล่องในตารางหน้า `Devices.jsx` เพื่อความสะดวกในการใช้งาน

### เหตุผล (Rationale)
- เพื่อให้วิศวกรและผู้ควบคุมหน้างานสามารถเพิ่มเพื่อน LINE Official Account และเลือกรับการแจ้งเตือนเฉพาะกล่องเซนเซอร์ในโซนที่ตนเองรับผิดชอบได้โดยตรง
- ตอบโจทย์ข้อจำกัดของแพ็กเกจฟรี (Free Tier) ของ LINE Messaging API ได้อย่างมีประสิทธิภาพสูงสุด โดยใช้ Reply API สำหรับการพูดคุยสั่งงาน และสงวน Push API ไว้สำหรับเหตุฉุกเฉินจริง (SLA Breach) เท่านั้น

### การตรวจสอบและทดสอบ (Verification)
1. **Webhook Signature & Lifecycle Unit Test**:
   - รันสคริปต์ทดสอบผ่าน `vocs-website/backend/venv/bin/python`:
     - ทดสอบ HMAC-SHA256 signature verification: ผ่าน
     - ทดสอบส่ง `BIND BOX-001` -> ระบบบันทึกผู้ใช้ลง `_in_memory_line_subscribers` และตอบกลับสำเร็จ: ผ่าน
     - ทดสอบ `STATUS` -> แสดงกล่องที่ผูกไว้ถูกต้อง: ผ่าน
     - ทดสอบ `UNBIND BOX-001` -> ปรับสถานะเป็น Inactive: ผ่าน
     - ทดสอบ `send_escalation_alert` หลายผู้รับ: ผ่าน
2. **Frontend Production Build**:
   - รัน `npm --prefix vocs-website/frontend run build` ผลลัพธ์: **Built successfully in 379ms with zero errors**
3. **Compilation Check**:
   - รัน `python3 -m py_compile main.py line_adapter.py` ผ่านสมบูรณ์

### สถานะ (Status)
- **เสร็จสมบูรณ์ 100% (Completed)**



