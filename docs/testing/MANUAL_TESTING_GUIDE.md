# Manual Testing & Verification Guide (ระบบตรวจวัดก๊าซ VOCs และ E-Nose)

> **Document Version**: 2.0.0 (Production Ready)  
> **Target Release**: VOC Industrial Monitoring & AI E-Nose System  
> **Last Updated**: November 2026  
> **Related Standards**: OSHA Air Contaminants, ISO-16000 Indoor Air, Thai DIW & IEAT Regulations

---

## 1. บทนำและขอบเขตการทดสอบ (Overview & Scope)

เอกสารฉบับนี้ใช้เป็นคู่มือทดสอบแบบครอบคลุมทั้งระบบ (Comprehensive System & Manual Test Suite) สำหรับโรงงานและวิศวกรผู้ดูแลระบบ เพื่อรับรองความถูกต้องของระบบก่อนขึ้น Production ครอบคลุม:
- การทดสอบ **Automated Unit Tests** ทั้งส่วน Backend (Python FastAPI) และ Frontend (React + Vite)
- การทดสอบ **Manual Test Matrix** รายหน้าทั้ง 12 หน้าของระบบเว็บ
- การทดสอบ **Role-Based Access Control (RBAC)** ของ 4 กลุ่มผู้ใช้งาน (`admin`, `engineer`, `operator`, `viewer`)
- การทดสอบ **Real-time Telemetry & Ingestion** สัญญาณเซนเซอร์ 8 ชนิด
- การทดสอบ **Alerts 5-Step Lifecycle** และการนับถอยหลัง SLA
- การทดสอบ **Hardware OTA (Over-the-Air) Firmware Update** และการป้องกันความปลอดภัย (Cryptographic Signature Verification)

---

## 2. การเตรียมสภาพแวดล้อมเพื่อทดสอบ (Environment Setup)

### 2.1 บัญชีผู้ใช้งานทดสอบ (Default Test Accounts)
ในโหมด Development ระบบมีบัญชีตัวอย่างพร้อมใช้งานดังนี้:

| Username | Password | Role | สิทธิ์การเข้าถึง (RBAC Scope) |
| :--- | :--- | :--- | :--- |
| `admin` | `admin1234` | **Admin** | ควบคุมทุกระบบ, จัดการผู้ใช้, อัปโหลด OTA, แก้ไข Thresholds, ดูแลทุกกล่อง |
| `engineer` | `engineer1234` | **Engineer** | ตรวจเทียบเซนเซอร์ (Calibration), ออกใบสั่งงาน (Work Orders), ดูแลโมเดล AI |
| `operator` | `operator1234` | **Operator** | มอนิเตอร์หน้างาน, รับทราบและแก้ปัญหา Alert (Ack/Resolve), สั่งการหน้างาน |
| `viewer` | `viewer1234` | **Viewer** | ดูข้อมูลและส่งออกรายงานเท่านั้น (Read-Only), ห้ามแก้ไขหรือกดรับทราบ Alert |

### 2.2 การเริ่มต้นรันระบบ Local Development

**1. เริ่มต้น Backend:**
```bash
cd vocs-website/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*API Base URL:* `http://localhost:8000`  
*Swagger Documentation:* `http://localhost:8000/docs`

**2. เริ่มต้น Frontend:**
```bash
cd vocs-website/frontend
npm install
npm run dev
```
*Frontend URL:* `http://localhost:5173`

---

## 3. ชุดทดสอบอัตโนมัติ (Automated Test Execution)

### 3.1 Backend Automated Unit Tests (FastAPI / ASGI)
รันคำสั่งทดสอบ Unit Test ฝั่งเซิร์ฟเวอร์ (รวม 21 Test Cases):
```bash
vocs-website/backend/venv/bin/python -m unittest discover -s vocs-website/backend/tests -p "test_*.py" -v
```
**ขอบเขตที่ทดสอบ:**
- `test_api_auth.py`: ทดสอบการเข้าสู่ระบบ 4 บทบาท, รหัสผ่านผิด, ป้องกัน Token หมดอายุ, ตรวจสอบสิทธิ์ RBAC
- `test_api_ingest_and_alerts.py`: ทดสอบการรับสัญญาณจาก ESP32 (`/api/ingest`), การตรวจจับความผิดปกติ, ขั้นตอน Ack/Resolve ของ Alert
- `test_api_maintenance_and_ota.py`: ทดสอบการดึงสถานะเซนเซอร์ 8 ตัว, การสร้าง Work Orders, สถานะ OTA Firmware, รายชื่ออุปกรณ์
- `test_model_inference.py`: ทดสอบฟังก์ชันปัญญาประดิษฐ์จำแนกสารเคมี (AI E-Nose Pipeline)

### 3.2 Frontend Automated Unit Tests (Node Test Runner)
รันคำสั่งทดสอบ Unit Test ฝั่งเว็บ (รวม 16 Test Cases):
```bash
cd vocs-website/frontend && npm test
```
**ขอบเขตที่ทดสอบ:**
- `ppmConverter.test.js`: การแปลงสูตรก๊าซ Power Law ตาม Datasheet สำหรับเซนเซอร์ MQ-2, MQ-3, MQ-8, MQ-135 และ MiCS-6814
- `aqiHelper.test.js`: การคำนวณดัชนี PM2.5 AQI 5 ระดับ (Good, Moderate, Sensitive, Unhealthy, Hazardous) พร้อมรหัสสีมาตรฐาน
- `locales.test.js`: การตรวจสอบความสมบูรณ์ของพจนานุกรมแปลภาษาไทยและอังกฤษ (Parity Check 100% ไม่มีคีย์ตกหล่น)

### 3.3 การตรวจสอบ Static Analysis และ Production Build
```bash
cd vocs-website/frontend
npm run lint    # ตรวจสอบโค้ดด้วย Oxlint (Zero errors)
npm run build   # ตรวจสอบการทำ Bundle และ Code-splitting (Zero chunk warnings)
```

---

## 4. ตารางการทดสอบรายหน้าเว็บ (Manual Verification Matrix)

### TC-01: Authentication & Role-Based Access Control (RBAC)
- **เป้าหมาย**: ตรวจสอบการล็อกอิน, การเก็บ JWT Token ใน LocalStorage และการจำกัดสิทธิ์ของแต่ละ Role
- **ขั้นตอนการทดสอบ**:
  1. เปิดหน้าเว็บ `http://localhost:5173` จะพบหน้าจอ Login
  2. ทดสอบกรอก User: `admin` และรหัสผ่านผิด -> ต้องแสดงข้อความแจ้งเตือนสีแดง "Invalid username or password"
  3. ล็อกอินด้วย `viewer` / `viewer1234`
  4. สังเกตเมนู Sidebar: ปุ่มตั้งค่าระบบและปุ่มลบผู้ใช้ต้องไม่สามารถเข้าถึงได้
  5. ทดสอบเปิด URL `/settings` ขณะล็อกอินเป็น Viewer -> ระบบต้องไม่ยอมให้บันทึกการแก้ไข
  6. กดปุ่ม Logout ที่แถบ Header -> ระบบต้องเคลียร์ Session และพากลับมาหน้า Login อย่างปลอดภัย
- **เกณฑ์ผ่าน**: สามารถล็อกอินได้ทั้ง 4 Role และระบบป้องกันการเข้าถึงฟังก์ชันเกินสิทธิ์อย่างเคร่งครัด

---

### TC-02: Dashboard & Solvent Radar Modal
- **เป้าหมาย**: ตรวจสอบ Gauge แสดงผลแบบเรียลไทม์, กราฟแนวโน้ม TVOC/eCO2, และหน้าต่างวิเคราะห์สารเคมี (Radar Chart)
- **ขั้นตอนการทดสอบ**:
  1. เข้าสู่ระบบด้วย `operator`
  2. ตรวจสอบการ์ดแสดงผลด้านบน: AQI Overall, TVOC (ppb), PM2.5 (ug/m3), eCO2 (ppm), Temp/RH
  3. สังเกตการกระพริบอัปเดตของข้อมูลเรียลไทม์ (Polling 3 วินาที)
  4. คลิกปุ่ม **"Solvent Radar"** หรือการ์ด AI Classification -> หน้าต่าง Modal Radar Chart ต้องเปิดขึ้น
  5. ตรวจสอบว่ามีแกนแสดงผลสารระเหย 6 ชนิด (Thinner, Alcohol, Gasoline, Acetone, Benzene, Ambient)
  6. คลิกการ์ดเซนเซอร์เพื่อเปิด **Telemetry Drawer** ด้านข้าง -> ตรวจสอบว่า Drawer เลื่อนออกมาอย่างนุ่มนวลและปิดได้เมื่อกดกากบาทหรือคลิกภายนอก
- **เกณฑ์ผ่าน**: ค่าแสดงผลสอดคล้องกับเกณฑ์สี ปิด-เปิด Modal และ Drawer ได้สมบูรณ์

---

### TC-03: Kiosk Mode (หน้าจอห้องควบคุม / จอสัมผัสโรงงาน)
- **เป้าหมาย**: ตรวจสอบหน้าจอโหมดเต็มจอสำหรับแขวนผนังโรงงานพร้อมระบบเสียงเตือนภัยจำลอง
- **ขั้นตอนการทดสอบ**:
  1. คลิกที่เมนู **"Kiosk"** ใน Sidebar หรือเข้า URL `/kiosk`
  2. กดปุ่ม F11 หรือปุ่ม Fullscreen บนหน้าจอ -> หน้าจอขยายเต็มพื้นที่ ไม่มี Sidebar หรือ Header มารบกวน
  3. ตรวจสอบแถบสีขนาดใหญ่ระบุระดับความปลอดภัย (เขียว/เหลือง/ส้ม/แดง/ม่วง)
  4. ทดสอบกดปุ่ม **"Test Sound Alarm"** -> เสียงสัญญาณเตือนภัยความถี่ 880Hz / 1760Hz ดังผ่านลำโพง
  5. ทดสอบปุ่ม **Mute / Unmute** -> ไอคอนสลับสถานะและเสียงหยุดลงทันที
- **เกณฑ์ผ่าน**: หน้าจออ่านค่าได้ชัดเจนจากระยะ 5 เมตร และระบบเสียงเตือนทำงานถูกต้อง

---

### TC-04: Sensor Streams (การตรวจสอบข้อมูลสัญญาณดิบ)
- **เป้าหมาย**: ตรวจสอบการอ่านค่าเซนเซอร์ดิบ (ADC/mV) เทียบกับค่าปรับชดเชยอุณหภูมิและความชื้น (T/H Compensated)
- **ขั้นตอนการทดสอบ**:
  1. ไปที่เมนู **"Sensors"**
  2. ตรวจสอบตารางแสดงค่าเซนเซอร์ 8 ตัว: MQ-2, MQ-3, MQ-8, MQ-135, MiCS-6814 (CO/NO2/NH3), PMS5003, DHT22
  3. คลิกสลับปุ่ม **"Raw ADC / mV"** กับ **"Compensated ~ppm"** -> หน่วยและตัวเลขต้องปรับเปลี่ยนตามโหมดการคำนวณ
  4. ทดสอบเลือกตัวกรอง **Box ID** สลับระหว่าง `BOX-001` และ `BOX-002`
- **เกณฑ์ผ่าน**: ตัวเลขแสดงผลไม่ติดลบ ไม่เป็น `NaN` และสามารถสลับโหมดการคำนวณได้อย่างถูกต้อง

---

### TC-05: Alerts 5-Step Lifecycle Workflow
- **เป้าหมาย**: ตรวจสอบวงจรชีวิตของการจัดการแจ้งเตือนเหตุฉุกเฉิน 5 ขั้นตอน (Active -> Acknowledged -> In Progress -> Resolved -> Verified)
- **ขั้นตอนการทดสอบ**:
  1. ล็อกอินด้วย `operator` แล้วไปที่หน้า **"Alerts"**
  2. เลือกรายการ Alert ที่มีสถานะเป็น `Active` (สีแดง)
  3. สังเกตตัวเลขนับถอยหลัง **SLA Countdown Timer** (เช่น 5 นาที)
  4. คลิกปุ่ม **"Acknowledge"** (รับทราบเหตุ) -> สถานะเปลี่ยนเป็น `Acknowledged` (สีเหลือง) และตัวนับเวลา SLA หยุดลง
  5. คลิกปุ่ม **"In Progress"** (กำลังแก้ไข) -> ระบุบันทึกการตรวจสอบเบื้องต้น เช่น "กำลังตรวจเช็ควาล์วห้องพ่นสี"
  6. คลิกปุ่ม **"Resolve"** (แก้ไขแล้ว) -> ระบุสาเหตุและวิธีแก้ไข เช่น "เปิดพัดลมดูดอากาศแรงดันสูง ระดับก๊าซกลับสู่ปกติ"
  7. ล็อกอินสลับเป็น `engineer` หรือ `admin` -> ทำการกด **"Verify"** (รับรองผล) เพื่อปิดงานอย่างสมบูรณ์
  8. ตรวจสอบว่า Viewer ไม่สามารถกดปุ่มการดำเนินการใดๆ ได้
- **เกณฑ์ผ่าน**: สถานะเปลี่ยนตามลำดับ 5 ขั้นตอน บันทึกชื่อผู้กระทำและเวลาครบถ้วนใน Audit Trail

---

### TC-06: Maintenance & Sensor Health (การซ่อมบำรุงและอายุการใช้งานเซนเซอร์)
- **เป้าหมาย**: ตรวจสอบดัชนีสุขภาพเซนเซอร์ (Health Index), วันที่เหลือจนถึงการเสื่อมสภาพ (RUL), และการออกใบสั่งงาน
- **ขั้นตอนการทดสอบ**:
  1. ล็อกอินเป็น `engineer` แล้วไปที่เมนู **"Maintenance"**
  2. ตรวจสอบการ์ดสุขภาพเซนเซอร์ทั้ง 8 ตัว และไส้กรองถ่านกัมมันต์ (Activated Carbon Filter)
  3. คลิกปุ่ม **"Calibrate Zero-Air"** ของเซนเซอร์ MQ-3 -> ค่า Drift รีเซ็ตกลับเป็นระดับปกติ
  4. สลับไปแท็บ **"Work Orders"** -> คลิกปุ่ม **"+ Create Work Order"**
  5. กรอกฟอร์ม: กล่อง `BOX-001`, ประเภท `CALIBRATION`, ชื่องาน `Quarterly Zero-Air Recalibration`, มอบหมายให้ `engineer`
  6. กดบันทึก -> รายการใบสั่งงานใหม่ต้องปรากฏในตารางทันที
  7. คลิกปุ่ม **"Download Calibration Certificate"** -> เอกสารสรุปการสอบเทียบถูกดาวน์โหลดในรูปแบบที่พร้อมพิมพ์
- **เกณฑ์ผ่าน**: การคำนวณ RUL ถูกต้องตามอายุการใช้งาน และสามารถสร้าง Work Order ได้อย่างสมบูรณ์

---

### TC-07: Devices & Fleet Management (การจัดการอุปกรณ์และ Cloud OTA)
- **เป้าหมาย**: ตรวจสอบสถานะออนไลน์ของกล่องฮาร์ดแวร์, การออก Device Token, และการปล่อยเฟิร์มแวร์ผ่าน Cloud OTA
- **ขั้นตอนการทดสอบ**:
  1. ล็อกอินเป็น `admin` แล้วไปที่หน้า **"Devices"**
  2. ตรวจสอบสถานะกล่อง: `BOX-001` (Online - จุดสีเขียว), `BOX-002` (Offline - จุดสีเทา)
  3. คลิกปุ่ม **"Generate Token"** ของ `BOX-001` -> หน้าต่างแสดง Secret Token ใหม่สำหรับคอนฟิกใน ESP32
  4. คลิกปุ่ม **"OTA Firmware"** -> หน้าต่างจัดการเฟิร์มแวร์เปิดขึ้น
  5. ตรวจสอบข้อมูลเฟิร์มแวร์ปัจจุบัน: Version, File Size, SHA-256 Checksum, Signature Verification
  6. ทดสอบจำลองการ Rollback เฟิร์มแวร์ 1-Click -> ระบบส่งคำสั่งกลับสู่เวอร์ชันเสถียรก่อนหน้า
- **เกณฑ์ผ่าน**: แสดงสถานะฮาร์ดแวร์ถูกต้อง คีย์สำหรับ ESP32 ถูกแฮชด้วย Bcrypt ในฐานข้อมูล

---

### TC-08: Airflow & Carbon Scrubber Telemetry
- **เป้าหมาย**: ตรวจสอบแผนผังระบายอากาศแบบอินเตอร์แอคทีฟ (SVG Flow Diagram) และถังดักไอสารระเหย
- **ขั้นตอนการทดสอบ**:
  1. ไปที่เมนู **"Airflow"**
  2. สังเกตภาพแอนิเมชันลูกศรการไหลของอากาศ (Airflow Motion) จากห้องพ่นสี (Spray Booth) ผ่านท่อดักอากาศไปยังถัง Scrubber
  3. คลิกที่ไอคอน **"Carbon Bed #1"** -> แผง **Carbon Scrubber Drawer** เปิดขึ้นจากด้านขวา
  4. ตรวจสอบค่าความดันตกคร่อม (Pressure Drop: mmH2O), ประสิทธิภาพการดูดซับ (Adsorption Efficiency: %), และความจุชั้นถ่านคงเหลือ
  5. คลิกที่กล่องตรวจวัด **"Sensor Box 001"** -> แผงข้อมูลการตรวจวัดจุดทางเข้า (Inlet) เปิดขึ้น
- **เกณฑ์ผ่าน**: แอนิเมชันลื่นไหลไม่กระตุก Drawer แสดงค่าเฉพาะจุดถูกต้อง และปิดได้อย่างสมบูรณ์

---

### TC-09: AI Lab & Solvent Model Insights
- **เป้าหมาย**: ตรวจสอบผลการจำแนกสารเคมีด้วยโมเดล Machine Learning และการกระจายตัวของลายนิ้วมือก๊าซ
- **ขั้นตอนการทดสอบ**:
  1. ไปที่เมนู **"AI Lab"**
  2. ตรวจสอบกราฟ Confusion Matrix แสดงความแม่นยำในการจำแนกสาร 4 กลุ่ม: Thinner, Alcohol, Solvent Blend, Ambient
  3. ตรวจสอบกราฟ Scatter Plot / PCA Cluster แสดงการเกาะกลุ่มของสัญญาณก๊าซ
  4. ทดสอบกดปุ่ม **"Export Model Metadata"** -> ไฟล์สรุปพารามิเตอร์โมเดลถูกบันทึก
- **เกณฑ์ผ่าน**: ข้อมูล AI ตอบสนองตามตัวชี้วัดจริง ไม่เกิดข้อผิดพลาดในการเรนเดอร์กราฟ

---

### TC-10: Historical Analytics & Compliance Downsampling
- **เป้าหมาย**: ตรวจสอบการดูประวัติย้อนหลัง, การรวมกลุ่มข้อมูลตามนโยบายจัดเก็บ 5 ปี (Downsampling), และการส่งออกข้อมูล
- **ขั้นตอนการทดสอบ**:
  1. ไปที่เมนู **"History"** หรือ **"Emissions"**
  2. เลือกช่วงเวลาย้อนหลัง: 1 ชั่วโมง, 24 ชั่วโมง, 7 วัน, หรือระบุช่วงวันที่เอง
  3. สังเกตการแสดงผลกราฟแนวโน้ม TVOC, eCO2, PM2.5 ที่ปรับความละเอียดตามช่วงเวลา (3-second raw -> hourly rollup)
  4. กดปุ่ม **"Export CSV"** -> ไฟล์ `.csv` ถูกดาวน์โหลดลงเครื่อง พร้อม Header ภาษาอังกฤษที่ถูกต้อง
  5. กดปุ่ม **"Export Excel / PDF"** -> ไฟล์รายงานสรุปการปล่อยมลพิษถูกสร้างขึ้น
- **เกณฑ์ผ่าน**: ข้อมูลต่อเนื่องไม่มีช่องว่าง ข้อมูล Export ครบถ้วนทุกคอลัมน์สำคัญ

---

### TC-11: LINE Bot Notification & Pairing
- **เป้าหมาย**: ตรวจสอบการผูกบัญชี LINE เพื่อรับการแจ้งเตือนเหตุฉุกเฉินรายกล่อง
- **ขั้นตอนการทดสอบ**:
  1. เข้าหน้าต่างตั้งค่าหรือหน้าจัดการ LINE Bot
  2. ตรวจสอบรายชื่อผู้รับการแจ้งเตือน (Subscribers List)
  3. คลิกปุ่ม **"Send Test Alert"** -> ระบบจำลองการส่งข้อความแจ้งเตือนระดับ Warning/Critical เข้ากลุ่มไลน์
  4. ตรวจสอบว่าระบบบันทึกเวลาที่ส่งข้อความสำเร็จใน Audit Trail
- **เกณฑ์ผ่าน**: ส่ง Payload ข้อความที่มีระดับความรุนแรงและปุ่มลิงก์กลับมายังหน้า Dashboard ได้ถูกต้อง

---

### TC-12: System Settings & Language Switcher (TH / EN)
- **เป้าหมาย**: ตรวจสอบการตั้งค่าเกณฑ์แจ้งเตือน (Thresholds), กำหนดเวลา SLA, และการสลับภาษาแบบเรียลไทม์
- **ขั้นตอนการทดสอบ**:
  1. ล็อกอินเป็น `admin` แล้วไปที่หน้า **"Settings"**
  2. สังเกตแท็บทั้ง 5 แท็บ: Thresholds, Notifications, SLA Timers, Users & RBAC, General
  3. ที่แท็บ **Thresholds**: ทดลองปรับเกณฑ์ TVOC Warning จาก 200 เป็น 220 ppb แล้วกดบันทึก
  4. ที่มุมขวาบนของ HeaderBar: คลิกปุ่มสลับภาษา **"TH / EN"**
  5. ตรวจสอบว่าข้อความทั้งหมดบนหน้าจอ (เมนู, หัวตาราง, สถานะ, ป้ายกำกับ) สลับเป็นภาษาที่เลือกทันทีโดยไม่ต้องรีโหลดหน้าเว็บ
  6. รีเฟรชเบราว์เซอร์ (F5) -> ภาษาที่เลือกไว้ยังคงถูกจดจำผ่าน LocalStorage
- **เกณฑ์ผ่าน**: ภาษาเปลี่ยนครบ 100% ไม่มีข้อความหลุดภาษา และค่า Thresholds ถูกนำไปใช้ตรวจจับ Alert จริง

---

## 5. ผลการทดสอบและข้อสรุปการรับรอง (Test Sign-off Form)

| รายการทดสอบ | สถานะการทดสอบ | ผู้ทดสอบ | วันที่รับรอง | หมายเหตุ |
| :--- | :---: | :---: | :---: | :--- |
| **Backend Unit Tests (21/21)** | **PASS** | Automated Suite | 09/11/2026 | ผ่าน 100% (2.29s) |
| **Frontend Unit Tests (16/16)** | **PASS** | Automated Suite | 09/11/2026 | ผ่าน 100% (41ms) |
| **Oxlint Static Code Quality** | **PASS** | Automated Linter | 09/11/2026 | 0 Errors |
| **Vite Production Bundler** | **PASS** | Vite Compiler | 09/11/2026 | Initial Bundle 271 kB |
| **TC-01 ถึง TC-12 Manual Matrix** | **READY** | QA / Lead Engineer | 09/11/2026 | พร้อมสำหรับการปล่อย Production |

**ลงนามรับรองความพร้อมขึ้นระบบจริง (Production Release Sign-off):**  
- **Lead System Engineer**: ___________________________  
- **Safety & Compliance Officer**: ___________________________  
- **Date**: ___________________________  

