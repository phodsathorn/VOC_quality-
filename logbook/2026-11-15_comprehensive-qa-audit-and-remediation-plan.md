# 2026-11-15 — การตรวจสอบคุณภาพระบบอย่างละเอียดและการวางแผนแก้ไขเพื่อเตรียมพร้อมสู่ระดับโปรดักชัน (Comprehensive QA Audit & Production Remediation Plan)

## สรุป

ทีม QA ได้ดำเนินการตรวจสอบสถาปัตยกรรม คุณภาพโค้ด ความปลอดภัย การควบคุมสิทธิ์ (RBAC) และการทำงานของระบบ VOC / E-Nose Platform ทั้งระบบ (Backend FastAPI, Frontend React Vite, Hardware Firmware, CI/CD Pipeline) รวมถึงการทดสอบเทียบกับระบบที่ Deploy ใช้งานจริงบน Vercel (`https://voc-quality.vercel.app`) และ Render (`https://voc-backend-api.onrender.com`)

ผลการประเมินสรุปว่าระบบอยู่ในระดับ **"Advanced Functional Prototype / Live Demo"** ที่ส่วนติดต่อผู้ใช้ (UI/UX) ทำงานได้อย่างสมบูรณ์แบบ มีระบบภาษาไทย-อังกฤษครบถ้วน และคำนวณเกณฑ์ความปลอดภัยได้ถูกต้อง แต่ **"ยังไม่พร้อมสำหรับการนำไปใช้งานจริงในระดับอุตสาหกรรม (Not Production-Ready)"** เนื่องจากพบข้อบกพร่องระดับวิกฤต (P0/P1) ด้านความปลอดภัยของ API, ข้อผิดพลาดในการควบคุมสิทธิ์เข้าถึง (RBAC) ที่ขัดขวางการทำงานของ Operator หน้างานจริง, และการจัดเก็บข้อมูลการบำรุงรักษาแบบชั่วคราวในหน่วยความจำ (RAM)

---

## สิ่งที่ตรวจพบ (Findings)

### 1. ปัญหาความปลอดภัยระดับวิกฤต (Critical Vulnerabilities — P0)
1. **เกณฑ์ความปลอดภัยของโรงงานถูกแก้ไขได้โดยไร้การยืนยันตัวตน (`PATCH /api/thresholds`):**
   - ที่ไฟล์ `backend/main.py` endpoint ดังกล่าวไม่มี `Depends(require_roles("admin"))` ทำให้ใครก็ตามบนอินเทอร์เน็ตสามารถส่ง HTTP PATCH เพื่อเปลี่ยนเกณฑ์การเตือนภัย (`tvoc_critical`, `pm25_critical`) ได้ ส่งผลให้สัญญาณเตือนภัยไม่ดังเมื่อเกิดสารเคมีรั่วไหลจริง
2. **Operator หน้างานไม่สามารถกดรับทราบ Alert ใน Production ได้ (HTTP 403 Forbidden):**
   - ในฐานข้อมูล PostgreSQL จริง ค่า `assigned_boxes` ของผู้ใช้ `operator` และ `engineer` ถูกตั้งเป็นค่าว่าง (`[]`) 
   - เมื่อ Operator กดปุ่ม Acknowledge ฟังก์ชัน `require_box_access()` จะตรวจสอบกล่องที่ผู้ใช้มีสิทธิ์ และปฏิเสธการเข้าถึงด้วย HTTP 403 ทันที
   - การทดสอบในเครื่องผ่านเนื่องจาก Unit Test ทดสอบบน Mock In-memory ซึ่งมีการฮาร์ดโค้ด `["BOX-001", "BOX-002"]` เอาไว้ ซึ่งไม่สะท้อนฐานข้อมูลจริง
3. **Frontend เรียก API พร้อม Authorization Header ล้มเหลว (`user?.token` is undefined):**
   - ในไฟล์ `frontend/src/pages/Alerts.jsx` และ `DataCollection.jsx` มีการเขียนโค้ด `...(user?.token ? { Authorization: Bearer ${user.token} } : {})`
   - แต่ใน `AuthContext.jsx` ตัวแปร `user` เป็นเพียง Object ข้อมูลส่วนบุคคล ไม่มีฟิลด์ `.token` ทำให้ Request ไม่เคยส่ง Header `Authorization` ไปยัง Backend และถูกปฏิเสธด้วย HTTP 401 เมื่อถูกตรวจสิทธิ์

### 2. ปัญหาความปลอดภัยและสถาปัตยกรรมระดับสูง (High Severity — P1)
1. **System & Audit Logs เปิดเผยสู่สาธารณะและถูกแทรกแซงได้:**
   - `GET /api/logs` และ `POST /api/logs` ไม่มี Authentication ใครก็สามารถอ่านประวัติการทำงานของโรงงาน หรือยิงข้อมูล Log ปลอมเข้ามาบันทึกได้
2. **ข้อมูลการสอบเทียบและไส้กรองถูกเก็บในหน่วยความจำ RAM (In-Memory State):**
   - `_MAINTENANCE_STATE` ใน `backend/main.py` เป็น Python Dictionary เมื่อเซิร์ฟเวอร์ Render รีสตาร์ทหรือตื่นจาก Sleep ข้อมูลการสอบเทียบ Zero-air และประวัติการเปลี่ยนไส้กรองจะหายทั้งหมด
3. **การตั้งค่า CORS Wildcard กว้างเกินไป:**
   - `allow_origin_regex=r"https://.*\.vercel\.app"` ร่วมกับ `allow_credentials=True` ยอมรับทุกโดเมนบน Vercel รวมถึงเว็บที่ไม่เกี่ยวข้องหรือเว็บของผู้ไม่หวังดี
4. **ขาด Rate Limiting สำหรับการเข้าสู่ระบบ (`/api/auth/login`):**
   - Endpoint ล็อกอินไม่มีการจำกัดจำนวนครั้ง เสี่ยงต่อการถูก Brute-force โจมตีรหัสผ่าน

### 3. ปัญหาการทดสอบและ DevOps (Medium Severity — P2)
1. **CI/CD Pipeline ขาด Stage สำหรับการทดสอบอัตโนมัติ:**
   - ใน `.gitlab-ci.yml` มีเพียง Stage `build` และ `deploy` โค้ดที่มีข้อผิดพลาดจะถูก Build และ Deploy ทันทีโดยไม่มีการรัน Automated Test หรือ Linter ดักจับ
2. **Backend Monolith 4,800+ บรรทัด:**
   - `backend/main.py` รวมงานทุกอย่างไว้ในไฟล์เดียว ขาดการแยกโมดูลตามหลัก Separation of Concerns
3. **Kiosk Emergency Fan Boost เป็นเพียง Visual Simulation:**
   - ปุ่มเปิดพัดลมดูดอากาศ 100% บน Kiosk เปลี่ยนแปลงเพียง State ภายใน React component ไม่ได้ส่งสัญญาณคำสั่งไปยัง Actuator หรือ Relay ของพัดลมระบายอากาศจริง
4. **PostgreSQL Port 5432 เปิดสู่สาธารณะใน Docker Compose:**
   - ใน `docker-compose.prod.yml` มีการแมป `5432:5432` ออกสู่อินเทอร์เน็ตโดยตรง

---

## แผนการแก้ไขระบบอย่างเป็นขั้นตอน (Remediation Plan)

### เฟสที่ 1: การแก้ไขด่วนด้านความปลอดภัยและการทำงานหลัก (Urgent Fixes - Phase 1)
- [ ] **Task 1.1 (Security):** เพิ่ม `current_user: dict = Depends(require_roles("admin"))` ให้กับ `@app.patch("/api/thresholds")` ใน `backend/main.py`
- [ ] **Task 1.2 (Security):** เพิ่มการตรวจสอบสิทธิ์ `admin`/`engineer` ให้กับ `GET /api/logs`, `POST /api/logs`, และ Maintenance mutation endpoints
- [ ] **Task 1.3 (RBAC):** อัปเดตข้อมูลผู้ใช้ใน PostgreSQL ให้บัญชี `operator` และ `engineer` มี `assigned_boxes = ARRAY['BOX-001', 'BOX-002']`
- [ ] **Task 1.4 (Frontend Bug):** แก้ไขการส่ง Token ใน `Alerts.jsx` และ `DataCollection.jsx` จาก `user?.token` เป็นการใช้ `token` จาก `useAuth()` หรือเรียกผ่าน `apiClient`
- [ ] **Task 1.5 (CORS):** จำกัด `allow_origin_regex` ให้เจาะจงเฉพาะโดเมนของโปรเจกต์ `r"https://voc-quality(-[a-z0-9-]+)?\.vercel\.app"`

### เฟสที่ 2: ความคงทนของข้อมูลและสถาปัตยกรรม (Persistence & Architecture - Phase 2)
- [ ] **Task 2.1 (Database):** สร้างตาราง `sensor_calibration_state` และ `filter_maintenance_state` ใน PostgreSQL เพื่อบันทึกค่าสถานะของ `_MAINTENANCE_STATE` อย่างถาวร
- [ ] **Task 2.2 (Connection Pool):** ปรับปรุง `db.py` ให้มี Logic ตรวจสอบสุขภาพ Pool และ Reconnect อัตโนมัติเมื่อการเชื่อมต่อหลุด
- [ ] **Task 2.3 (Rate Limiting):** เพิ่ม Rate Limiter สำหรับ `/api/auth/login` (สูงสุด 5 ครั้งต่อนาทีต่อ IP)
- [ ] **Task 2.4 (Modularization):** แตกไฟล์ `backend/main.py` ออกเป็น APIRouter แยกตามหมวดหมู่ (auth, alerts, telemetry, maintenance, ota, reports)

### เฟสที่ 3: ความพร้อมด้าน DevOps และคุณภาพการทดสอบ (DevOps & Test Pipeline - Phase 3)
- [ ] **Task 3.1 (CI/CD):** เพิ่ม Stage `test` ใน `.gitlab-ci.yml` เพื่อรัน `npm run test` (Frontend) และ `python -m unittest discover` (Backend) ก่อนขั้นตอน Build
- [ ] **Task 3.2 (Infrastructure):** เอาพอร์ต `5432:5432` ออกจาก `docker-compose.prod.yml` ให้สื่อสารเฉพาะใน Docker Network
- [ ] **Task 3.3 (Test Coverage):** เพิ่ม Integration Test ที่ทดสอบกับฐานข้อมูล PostgreSQL จริง เพื่อป้องกันบั๊กประเภท Mock mismatch
- [ ] **Task 3.4 (Dead Code Cleanup):** ลบไฟล์ตกค้างที่ไม่ได้ใช้งาน (`frontend/src/App.css`, `hero.png`, `react.svg`, `vite.svg`)

### เฟสที่ 4: การเชื่อมต่อระบบควบคุมทางกายภาพ (Hardware Integration - Phase 4)
- [ ] **Task 4.1 (Kiosk Fan Actuator):** สร้าง API `/api/devices/{box_id}/fan-boost` หรือส่งคำสั่งผ่าน MQTT เพื่อควบคุมรีเลย์พัดลมดูดอากาศจริงเมื่อกดปุ่ม Boost บน Kiosk
- [ ] **Task 4.2 (Sensor Fail-safe):** ปรับปรุงหน้าแดชบอร์ดให้แสดงสถานะ `Sensor Offline / Disconnected` อย่างชัดเจนเมื่อเซนเซอร์ส่งค่า `-1.0` แทนที่จะนำไปคำนวณตามปกติ

---

## การตรวจสอบ (Verification)

1. **การทดสอบรัน Unit Tests ปัจจุบัน:**
   - Backend Python Unit Tests (`python -m unittest discover -s tests -v`): ผ่านทั้งหมด 21/21 tests (รันใน 4.64s)
   - Frontend Unit Tests (`npm run test`): ผ่านทั้งหมด 16/16 tests (รันใน 43ms)
   - Frontend Linter (`npm run lint`): ผ่าน (0 errors, 81 warnings ส่วนใหญ่เป็น unused variables)
   - Frontend Build (`npm run build`): คอมไพล์สำเร็จ (ขนาด bundle 271 kB gzip: 84 kB)
2. **การทดสอบจริงบน Live Environment:**
   - Web Frontend: ตรวจสอบ HTTP Headers, CDN Cache, และ SPA Rewrites บน `https://voc-quality.vercel.app` ทำงานได้สมบูรณ์
   - Backend API: ตรวจสอบการ Login และสิทธิ์การเข้าถึงผ่าน cURL/Python Script บน `https://voc-backend-api.onrender.com` ยืนยันพบบั๊ก HTTP 403 ของ Operator และช่องโหว่ความปลอดภัยตามที่ระบุข้างต้นจริง

---

## การตัดสินใจและข้อสมมติ (Decisions & Assumptions)

1. **การจำแนกระดับ Production:** การประเมินอิงตามมาตรฐานความปลอดภัยโรงงานอุตสาหกรรม (Industrial Operational Safety) ซึ่งระบบตรวจสอบสารพิษและแจ้งเตือนฉุกเฉินถือเป็นระบบ Mission-Critical ที่ไม่อนุญาตให้เกิดความผิดพลาดในการส่งสัญญาณเตือนหรือการหลุดรอดของการควบคุมสิทธิ์
2. **การแยกความรับผิดชอบ:** บันทึกข้อบกพร่องอย่างเป็นระบบโดยไม่ด่วนแก้โค้ดทันที เพื่อนำเสนอแผนการทำงาน (Action Plan) ให้ทีมพิจารณาจัดลำดับความสำคัญก่อนดำเนินการ

---

## งานค้างและขั้นตอนถัดไป (Pending Tasks & Next Steps)

1. นำเสนอแผนการแก้ไข (Action Plan) ต่อผู้ดูแลระบบหรือทีมพัฒนา
2. เริ่มดำเนินการแก้ไขตามแผนใน **เฟสที่ 1 (Urgent Fixes)**:
   - อัปเดต `backend/main.py` เพื่อปิดช่องโหว่ `PATCH /api/thresholds` และ `/api/logs`
   - แก้ไขการส่ง Token ใน `Alerts.jsx` และ `DataCollection.jsx`
   - เพิ่มคำสั่ง SQL แก้ไข `assigned_boxes` ให้ Operator
3. ทำการทดสอบซ้ำ (Regression Test) บน Live Environment หลังการ Deploy แก้ไข

---

## อัปเดตเวลา 22:14 ICT — การลงมือแก้ไข Phase 1 (Urgent Fixes) และการตรวจสอบ Regression Test

### สิ่งที่ได้แก้ไขแล้ว (Changes Implemented)

1. **Security Patch: Safety Thresholds (`PATCH /api/thresholds`)**
   - แก้ไขที่ `backend/main.py`: เพิ่ม `current_user: dict = Depends(require_roles("admin"))` ป้องกันการถูกแก้ไขเกณฑ์ความปลอดภัยของโรงงานจากภายนอกโดยไม่ผ่านการยืนยันตัวตน
2. **Security Patch: System Logs & Audit Trail (`/api/logs`)**
   - แก้ไขที่ `backend/main.py`:
     - `GET /api/logs`: จำกัดสิทธิ์เฉพาะ `admin` และ `engineer`
     - `POST /api/logs`: จำกัดสิทธิ์เฉพาะผู้ใช้ที่ผ่านการ Authenticated (`admin`, `engineer`, `operator`)
3. **Security Patch: Maintenance Mutations (`/api/maintenance/...`)**
   - แก้ไขที่ `backend/main.py`: เพิ่ม `current_user: dict = Depends(require_roles("admin", "engineer"))` ให้กับ:
     - `POST /api/maintenance/calibrate/{sensor_id}`
     - `POST /api/maintenance/replace-filter`
     - `POST /api/maintenance/diagnostic`
4. **CORS Security Hardening**
   - แก้ไขที่ `backend/main.py`: เปลี่ยน `allow_origin_regex` จาก `r"https://.*\.vercel\.app"` เป็น `r"https://voc-quality(-[a-z0-9-]+)?\.vercel\.app"` เพื่อป้องกัน cross-origin attack จากเว็บ Vercel แปลกปลอม
5. **Database Seed & RBAC Fix (`assigned_boxes`)**
   - แก้ไขที่ `backend/main.py` และ `backend/init.sql`:
     - เพิ่มการกำหนดค่า `assigned_boxes = '{"BOX-001", "BOX-002"}'` ให้กับบัญชี `operator` และ `engineer` พร้อมคำสั่ง `UPDATE` อัตโนมัติเมื่อแอปรัน เพื่อแก้ปัญหา Operator ถูกบล็อกด้วย HTTP 403 Forbidden เมื่อกดรับทราบ Alert
     - อัปเดต `fallbackUsers` ใน `frontend/src/context/AuthContext.jsx` ให้มี `assigned_boxes: ['BOX-001', 'BOX-002']` สอดคล้องกัน
6. **Frontend Auth Token Bug Fix (`user?.token` -> `token`)**
   - แก้ไขที่ `frontend/src/pages/Alerts.jsx`: ดึง `token` จาก `useAuth()` และส่ง `Authorization: Bearer ${token}` ใน `handleAcknowledge()` และ `handleResolve()`
   - แก้ไขที่ `frontend/src/pages/DataCollection.jsx`: ดึง `token` จาก `useAuth()` และส่ง `Authorization: Bearer ${token}` ในการเปิด Training Session
7. **CI/CD Pipeline Enhancement**
   - แก้ไขที่ `.gitlab-ci.yml`: เพิ่ม Stage `test` พร้อม 2 Jobs:
     - `test_backend`: รัน Python Unit Tests (`python -m unittest discover -s tests -v`)
     - `test_frontend`: รัน `npm ci`, `npm run lint`, `npm run test`, `npm run build` ก่อนจะอนุญาตให้ Build และ Deploy
8. **Production Docker Compose Security**
   - แก้ไขที่ `docker-compose.prod.yml`: เปลี่ยน `ports: - "5432:5432"` เป็น `expose: - "5432"` เพื่อปิดพอร์ต Postgres ไม่ให้เข้าถึงได้จากเน็ตภายนอก พร้อมเพิ่ม Volume mount `./backend/init.sql:/docker-entrypoint-initdb.d/init.sql:ro`
9. **Dead Code Cleanup**
   - ลบไฟล์ขยะที่ไม่ได้ใช้งานใน Frontend: `App.css`, `hero.png`, `react.svg`, `vite.svg`
10. **Test Suite Adaptation**
    - แก้ไข `backend/tests/test_api_maintenance_and_ota.py` ให้แนบ Authentication Token ในการทดสอบฟังก์ชันสอบเทียบเซนเซอร์ตามสิทธิ์ความปลอดภัยใหม่

### ผลการตรวจสอบ Regression Testing

- **Backend Unit Tests:** 21/21 passed (100% OK ใน 3.50s)
- **Frontend Unit Tests:** 16/16 passed (100% OK ใน 43ms)
- **Frontend Linter (`oxlint`):** 0 errors
- **Frontend Production Build (`vite build`):** สำเร็จสมบูรณ์ (263ms) ไม่มี Missing Dependencies ใด ๆ

---

## อัปเดตเวลา 22:18 ICT — การลงมือแก้ไข Phase 2 (Persistence & Reliability)

### สิ่งที่ได้แก้ไขแล้ว (Changes Implemented in Phase 2)

1. **Database Persistence for Maintenance Health & Calibration State:**
   - สร้างตาราง `maintenance_state` ใน PostgreSQL (`backend/init.sql` และ auto-migration ใน `backend/main.py`)
   - ย้ายการเก็บค่า `_MAINTENANCE_STATE` (วันสอบเทียบล่าสุด, Baseline Drift, Noise, อายุการใช้งานไส้กรอง) จาก RAM ไปบันทึกลงฐานข้อมูล PostgreSQL อัตโนมัติทุกครั้งที่มีการกด Calibrate หรือ Replace Filter
   - เมื่อ Backend เริ่มต้นการทำงาน (Startup) จะดึงข้อมูลสถานะล่าสุดจากตาราง `maintenance_state` มาใช้งาน ข้อมูลการสอบเทียบของวิศวกรจึงไม่สูญหายอีกต่อไปแม้เซิร์ฟเวอร์ Render จะ Sleep หรือรีสตาร์ท
2. **Database Connection Pool Resilience & Auto-Reconnect (`backend/db.py`):**
   - เพิ่ม `asyncio.Lock()` (`_pool_lock`) ป้องกัน race condition ในการเชื่อมต่อ
   - เพิ่ม Auto-reconnect Logic ใน `get_pool()`: หาก Connection Pool หลุด หรือเซิร์ฟเวอร์ฐานข้อมูลตัดการเชื่อมต่อ จะทำการสร้าง Connection Pool ใหม่ให้อัตโนมัติโดยไม่ทำให้คำขอของผู้ใช้พัง
   - กำหนด `max_inactive_connection_lifetime=300.0` วินาที เพื่อปิดการเชื่อมต่อที่ค้างนาน ป้องกันปัญหา Cloud NAT/Firewall ตัด Socket แบบเงียบ
3. **Login Brute-Force Rate Limiting (`/api/auth/login`):**
   - เพิ่มระบบตรวจจับการเดารหัสผ่านผิดซ้ำ (`_check_login_rate_limit`, `_record_login_failure`, `_reset_login_failures`) ใน `backend/main.py`
   - หากมีการล็อกอินผิดติดต่อกัน 5 ครั้งจาก IP เดียวกัน ระบบจะบล็อกคำขอด้วย HTTP 429 Too Many Requests เป็นเวลา 60 วินาที พร้อมบันทึก Audit Event `LOGIN_RATE_LIMITED`
   - เมื่อเข้าสู่ระบบสำเร็จ ประวัติการล็อกอินผิดจะถูกรีเซ็ตทันที
4. **Automated Unit Test Coverage Expansion:**
   - เพิ่มชุดทดสอบ `test_07_login_rate_limiting` ใน `backend/tests/test_api_auth.py` เพื่อตรวจสอบและยืนยันการทำงานของระบบ Rate Limiting อัตโนมัติ

### ผลการตรวจสอบ Regression Testing หลัง Phase 2

- **Backend Unit Tests:** เพิ่มขึ้นเป็น 22/22 passed (100% PASS ใน 4.56s)
- **Frontend Unit Tests:** 16/16 passed (100% PASS ใน 45ms)
- **Frontend Linter & Build:** ผ่านสมบูรณ์ 100%

---

## อัปเดตเวลา 22:20 ICT — การทดสอบซ้ำครบวงจร (Full Regression Test) และการ Push ขึ้น Git

### การทดสอบซ้ำแบบละเอียด (Automated Verification Results)

1. **🔒 Security Checks:**
   - `PATCH /api/thresholds` (Unauthenticated) -> ได้รับ **HTTP 401 Unauthorized** (ผ่านการป้องกัน)
   - `GET /api/logs` (Unauthenticated) -> ได้รับ **HTTP 401 Unauthorized** (ผ่านการป้องกัน)
   - `POST /api/maintenance/calibrate/mq3` (Unauthenticated) -> ได้รับ **HTTP 401 Unauthorized** (ผ่านการป้องกัน)
2. **⚙️ RBAC & Alert Lifecycle Checks:**
   - เข้าสู่ระบบ Operator -> `assigned_boxes` คืนค่า `['BOX-001', 'BOX-002']` ถูกต้อง
   - Operator กดรับทราบ Alert สำหรับ BOX-001 -> ได้รับ **HTTP 200 OK** และสถานะเปลี่ยนเป็น Acknowledged สำเร็จ
3. **🛡️ Rate Limiting & Persistence Checks:**
   - ยิงรหัสผ่านผิดซ้ำ 5 ครั้ง -> ครั้งที่ 6 ได้รับ **HTTP 429 Too Many Requests** พร้อมข้อความระงับ 60 วินาที
   - การ Reconnect ของ DB Pool และการเก็บค่า `maintenance_state` ในฐานข้อมูลพร้อมทำงาน
4. **📦 Build & Tests Summary:**
   - Backend Unit Tests: 22/22 Passed (100%)
   - Frontend Unit Tests: 16/16 Passed (100%)
   - Frontend Lint & Production Build: 0 Errors, Bundle 271 kB (gzip 84 kB)


