# 2026-11-19 — Security Hardening (Phase 5B), Kiosk Fan Boost & Firmware Fail-safe (Phase 7), และ ML Pipeline Upgrade (Phase 8)

## สรุป

ดำเนินการรีวิวโปรเจกต์ทั้งระบบและเริ่มลงมือแก้ไขตามแผนที่อนุมัติ ครอบคลุมงานสำคัญระดับ P0–P1 ได้แก่ การล้างรหัสผ่านที่ฮาร์ดโค้ดออกจากซอร์สโค้ด/เอกสาร, การตรวจรหัส Kiosk Emergency PIN จริงฝั่ง Backend พร้อม Rate Limiting, การเชื่อมระบบสั่งงานพัดลมดูดอากาศแบบ End-to-End (Kiosk → Backend Command Queue → ESP32), การเพิ่ม Hardware Watchdog + Local L1 Fail-safe + Offline Ring Buffer ในเฟิร์มแวร์, การลด re-render/dead imports ใน `Dashboard.jsx`, และการยกระดับ ML Pipeline ให้รองรับ Confidence Threshold และ Session-aware Group Split

## สิ่งที่เปลี่ยน

### 1. Security & Secrets Hygiene (Phase 5B)
- `vocs-website/frontend/src/pages/LoginPage.jsx`: ลบรหัสผ่านที่ฮาร์ดโค้ดออกจากปุ่ม Quick Login และซ่อนปุ่ม Demo ใน production build (เปิดเฉพาะเมื่อกำหนด `VITE_ENABLE_DEMO_LOGIN=true`)
- `vocs-website/backend/main.py`: เพิ่มการตรวจสอบ `KIOSK_EMERGENCY_PIN` ด้วย `hmac.compare_digest` และ Per-IP Rate Limiter (5 ครั้ง/60 วินาที → HTTP 429) ใน `POST /api/alerts` พร้อมบันทึก Audit Event เมื่อกรอก PIN ผิดหรือถูกจำกัดอัตรา
- `vocs-website/frontend/src/pages/Kiosk.jsx`: ส่งค่า `pin` ไปตรวจสอบจริงที่ Backend และจัดการตอบสนอง HTTP 403/429 ด้วยข้อความแจ้งเตือนชัดเจน
- `vocs-website/backend/.env.example`: ลบ comment ที่ระบุรหัสผ่านและ device token ตัวอย่างออก และเพิ่มตัวแปร `KIOSK_EMERGENCY_PIN`
- `hardware/firmware/voc_esp32/voc_esp32.ino`: ลบ fallback รหัสผ่าน OTA ที่ฮาร์ดโค้ดออก และบังคับกำหนด `OTA_PASSWORD` ผ่าน `secrets.h` ด้วย `#error`
- `README.md`: ลบคอลัมน์รหัสผ่าน plaintext ออกจากตาราง RBAC และแก้ชื่อบอร์ดจาก `ESP32-S3` เป็น `ESP32-WROOM-32` ให้ตรงกับฮาร์ดแวร์และเฟิร์มแวร์จริง

### 2. End-to-End Fan Boost & Firmware Fail-safe (Phase 7)
- `vocs-website/backend/main.py`:
  - เพิ่ม `POST /api/devices/{box_id}/fan-boost` (RBAC: `admin`, `engineer`, `operator` + `require_box_access`) สำหรับคิวคำสั่ง `FAN_BOOST` / `FAN_NORMAL` ลง `device_commands` (พร้อม in-memory fallback สำหรับโหมด dev/test)
  - ปรับปรุง `GET /api/device-command` และเพิ่ม `POST /api/device-command/{command_id}/ack` สำหรับรับ ACK จาก ESP32
- `vocs-website/frontend/src/pages/Kiosk.jsx`: เชื่อมปุ่มเร่งพัดลม 100% และปุ่มหยุดพัดลมเข้ากับ `POST /api/devices/BOX-001/fan-boost` พร้อม Bearer Token
- `hardware/firmware/voc_esp32/voc_esp32.ino` (อัปเดตเป็น `v1.1.0`):
  - เพิ่ม Hardware Task Watchdog (`esp_task_wdt`, timeout 30 วินาที)
  - เพิ่ม Local L1 Autonomous Fail-safe (`evaluateLocalFailSafe`) ตรวจ TVOC เกินเกณฑ์วิกฤตและสั่งเปิดพัดลมได้เองแม้ขาดการเชื่อมต่อ Cloud
  - เพิ่ม Offline Ring Buffer (20 เฟรมใน RAM) เก็บข้อมูลช่วง Wi-Fi/HTTP ล่ม และทยอย flush เมื่อเชื่อมต่อกลับมา
  - ขยาย `pollDeviceCommand()` ให้รองรับ `FAN_BOOST` / `FAN_NORMAL` พร้อมส่ง ACK กลับ Backend

### 3. Frontend Performance & ML Pipeline (Phase 6.2 & Phase 8)
- `vocs-website/frontend/src/pages/Dashboard.jsx`: ลบ import ที่ไม่ได้ใช้งาน (รวมถึง `recharts` ที่ไม่ได้ใช้ในหน้านี้) และแก้ `useMemo` dependency ที่เคยสร้าง object ใหม่ทุก render
- `vocs-website/backend/model_loader.py`: เพิ่ม `ML_CONFIDENCE_THRESHOLD` (ค่าเริ่มต้น 65%) หากความมั่นใจต่ำกว่าเกณฑ์จะคืน `prediction: "UNKNOWN"` และ `is_dangerous: False`
- `vocs-website/ml/train_model.py`: เพิ่ม Session-aware `GroupShuffleSplit` (เมื่อมี `session_id` เพียงพอ), รายงาน Macro F1-Score, ตรวจสอบสัดส่วน Feature Importance ของ `temp + rh` เพื่อเตือน ambient overfitting, และบันทึก `confusion_matrix` + `split_strategy` ลง `model_meta.json`

### 4. Automated Tests
- `vocs-website/backend/tests/test_api_operational.py`: เพิ่ม `test_06_kiosk_emergency_alert_invalid_pin` และ `test_07_device_fan_boost_command_lifecycle`

## เหตุผลและผลกระทบ

- ลดความเสี่ยงจากการเปิดเผยรหัสผ่านใน JS bundle สาธารณะและเอกสาร repo และป้องกันการกดแจ้งเตือนฉุกเฉินปลอมบน Kiosk โดยไร้การตรวจสอบ PIN
- ปรับปุ่ม Fan Boost บน Kiosk จากการจำลอง UI ให้กลายเป็นการส่งคำสั่งไปยังคิวอุปกรณ์จริงที่ ESP32 ดึงไปสั่ง GPIO ได้
- ลดขนาดโมดูลที่ Vite ต้อง transform ลงจาก 2,464 เหลือ 1,891 โมดูล และลด oxlint warnings จาก 85 เหลือ 62 จุด
- ป้องกันโมเดล AI ทำนายผิดเมื่อพบกลิ่นที่ไม่เคยเทรน และเตรียมโครงสร้าง validation ให้ปราศจาก data leakage เมื่อเก็บข้อมูลชุดใหม่

## การตรวจสอบ

- **Backend Tests (`./venv/bin/python -m unittest discover -s tests -v`):** ผ่าน **35/35** tests (0 failures, 0 errors)
- **ML Script Compile (`./venv/bin/python -m py_compile ../ml/train_model.py`):** ผ่านสมบูรณ์
- **Frontend Unit Tests (`npm run test`):** ผ่าน **16/16** tests
- **Frontend Linter (`npm run lint`):** 0 errors, 62 warnings (ลดจาก 85)
- **Frontend Production Build (`npm run build`):** สำเร็จใน 186ms และตรวจสอบด้วย `grep` ไม่พบรหัสผ่านฮาร์ดโค้ดใน `dist/`
- **Firmware Compile:** ยังไม่ได้คอมไพล์ด้วย `arduino-cli` เนื่องจากเครื่องนี้ไม่ได้ติดตั้ง `arduino-cli` (ต้องทดสอบคอมไพล์ใน Arduino IDE / เครื่องที่มี `arduino-cli`)

## การตัดสินใจ/ข้อสมมติ

- ใช้ `KIOSK_EMERGENCY_PIN` จาก Environment Variable (ค่าเริ่มต้น `"1234"` เฉพาะโหมดพัฒนา) เพื่อความเรียบง่ายและปลอดภัยในการ deploy บน Render โดยควรตั้งค่าจริงบน Production Environment
- คงการแยก `backend/main.py` เป็น `routers/*` (Phase 6.1) ไว้เป็นงานถัดไปเพื่อลดความเสี่ยงจากการเปลี่ยนแปลงไฟล์ขนาดใหญ่พร้อมกับแพตช์ความปลอดภัย

## งานค้างและขั้นตอนถัดไป

1. **Manual Security Ops (ผู้ใช้ดำเนินการ):** Rotate รหัสผ่านบัญชี Production ทั้ง 4 บัญชี, `ADMIN_API_KEY`, `JWT_SECRET_KEY`, `DEVICE_TOKEN`, `OTA_PASSWORD`, ตั้งค่า `KIOSK_EMERGENCY_PIN` บน Render และพิจารณาตั้ง GitHub repo เป็น Private
2. **Phase 6.1:** แยก `vocs-website/backend/main.py` (5,300+ บรรทัด) ออกเป็น `routers/` และ `core/` และเคลียร์ oxlint warnings ที่เหลืออีก 62 จุด
3. **Phase 7 Hardware Verification:** คอมไพล์และแฟลช `voc_esp32.ino` v1.1.0 ลงบอร์ดจริง ทดสอบ WDT/L1/Offline Buffer/Fan Boost และตรวจซ่อมเซ็นเซอร์ PMS5003 ที่ส่งค่า `-1.0`
4. **Phase 8 Data Collection:** เก็บข้อมูล E-Nose เพิ่มหลายสารเคมีและหลาย session แล้วรัน `train_model.py` เทรนโมเดลใหม่
5. **Phase 9:** เพิ่ม PostgreSQL service container ใน CI และ Playwright E2E smoke tests

---

## อัปเดตเวลา 13:10 ICT — Phase 6.1 Backend Router Modularization, Phase 6.2 Full Lint Cleanup, และ Phase 9 Real PostgreSQL CI

### สิ่งที่เปลี่ยน
1. **Frontend Lint Cleanup (Phase 6.2):**
   - ลบ unused imports/variables และ dead code ใน `AqiScaleBar.jsx`, `AqiBadge.jsx`, `DashboardSkeleton.jsx`, `Layout.jsx`, `ppmConverter.js`, `Maintenance.jsx`, `Settings.jsx`, `AirQualityGuide.jsx`, `Alerts.jsx`, `Devices.jsx`, `AirflowDiagram.jsx`, `DataCollection.jsx`, `History.jsx`, `Kiosk.jsx`, และ `Dashboard.jsx`
   - ลด oxlint warnings จาก 62 เหลือ **8 warnings** (0 unused-vars ทั้ง 73 ไฟล์, 0 errors)
2. **Backend Modularization (Phase 6.1 — เริ่มแยก Router Package):**
   - สร้าง `vocs-website/backend/routers/__init__.py`
   - สร้าง `vocs-website/backend/routers/operational.py`: แยก `/`, `/health`, `/api/health`, `/api/metrics`, `/metrics` ออกจาก `main.py` พร้อมแก้การคำนวณ `active_connections` ให้คำนวณจาก `len(pool._holders) - pool._queue.qsize()` แทนขนาด pool รวม
   - สร้าง `vocs-website/backend/routers/line.py`: แยก `/api/line/webhook`, `/api/line/subscribers`, `DELETE /api/line/subscribers/{sub_id}` ออกจาก `main.py`
   - ลงทะเบียนทั้ง 2 routers ใน `vocs-website/backend/main.py` ลดความยาวของ `main.py` ลง ~310 บรรทัดโดยไม่กระทบ route contract เดิม
3. **Real PostgreSQL CI Pipeline (Phase 9):**
   - อัปเดต `vocs-website/.gitlab-ci.yml`: เพิ่ม job `test_backend_postgres` ที่ใช้ `postgres:16-alpine` service container รัน `python migrator.py` และ `test_api_integration.py` กับฐานข้อมูล PostgreSQL จริง และเปิดให้ทุก test job รันบน `merge_request_event` ด้วย

### การตรวจสอบ
- **Backend Tests:** ผ่าน **35/35** tests (5.25s, 0 failures)
- **Frontend Unit Tests:** ผ่าน **16/16** tests (39.2ms)
- **Frontend Linter (`oxlint`):** **0 errors, 8 warnings** (ลดจากเดิม 85 → 8)
- **Frontend Production Build (`vite build`):** ผ่านสมบูรณ์ใน 188ms (1,890 modules)

---

## อัปเดตเวลา 13:16 ICT — แยก Backend Routers เพิ่มเติม (Emissions, Maintenance, Training) และ Push ขึ้น GitLab/GitHub

### สิ่งที่เปลี่ยน
1. **Git Push รอบแรก (`c2b8a70`):** Push การปรับปรุง Phase 5B, 6.2, 7, 8, 9 และ router ชุดแรกขึ้นทั้ง `origin` (GitLab) และ `github` (GitHub) เรียบร้อย
2. **Backend Modularization รอบที่ 2 (`vocs-website/backend/routers/`):**
   - สร้าง `routers/emissions.py` (264 บรรทัด): แยก `/api/emissions/stacks`, `/api/emissions/permits`, `/api/emissions/stack-measurement`, และ `/api/reports/yearly-emissions`
   - สร้าง `routers/maintenance.py` (237 บรรทัด): แยก `/api/maintenance/work-orders` (GET/POST), `/api/maintenance/real-health`, `/api/maintenance/status`, `/api/maintenance/calibrate/{sensor_id}`, `/api/maintenance/replace-filter`, และ `/api/maintenance/diagnostic`
   - สร้าง `routers/training.py` (145 บรรทัด): แยก `/api/training/sessions` CRUD ทั้งหมด พร้อมลบ duplicate field ใน `SessionUpdate`
   - ลดขนาด `vocs-website/backend/main.py` ลงเหลือ **4,553 บรรทัด** (แยกออกมาแล้วรวม 5 routers / 1,020 บรรทัด: `operational`, `line`, `emissions`, `maintenance`, `training`)

### การตรวจสอบ
- **Backend Tests (`./venv/bin/python -m unittest discover -s tests -v`):** ผ่าน **35/35** tests (5.20s, 0 failures, 0 errors)

---

## อัปเดตเวลา 13:26 ICT — แยก Backend Routers รอบที่ 3 (Auth, Alerts, OTA, Exports) และ Push ขึ้น GitLab/GitHub

### สิ่งที่เปลี่ยน
- แยกโมดูล Router เพิ่มเติมอีก 4 โมดูลออกจาก `vocs-website/backend/main.py`:
  - `routers/auth.py` (531 บรรทัด): Login/Logout/Me, Users CRUD, Audit Events & CSV Export
  - `routers/alerts.py` (577 บรรทัด): 5-Stage Alert Lifecycle (Active → Acknowledged → In progress → Resolved → Verified), Manual Alerts และ Kiosk PIN-verified Emergency Alarms
  - `routers/ota.py` (437 บรรทัด): Cloud OTA Upload/Rollback/History/Report/Status/Download/Signature Verify และ Model Governance Registry
  - `routers/exports.py` (489 บรรทัด): Cryptographic CSV/XLSX/PDF Compliance Exports, Export History, Downsampled Trends และ Daily Air Quality Aggregation
- ลดขนาด `vocs-website/backend/main.py` ลงจากเดิม 5,388 บรรทัด เหลือ **2,675 บรรทัด** (ลดลงมากกว่า 50% โดยแยกออกเป็น 9 routers รวม 3,054 บรรทัด)

### การตรวจสอบ
- **Backend Tests (`./venv/bin/python -m unittest discover -s tests -v`):** ผ่าน **35/35** tests (5.17s, 0 failures, 0 warnings)
