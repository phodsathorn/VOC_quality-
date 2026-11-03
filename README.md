# 🌬️ VOC / E-Nose Industrial Telemetry Platform
### ระบบตรวจวัดสารระเหยอินทรีย์ (VOC) และปัญญาประดิษฐ์จำแนกกลิ่นสำหรับโรงงานพ่นสีฝุ่น
*(Industrial Volatile Organic Compounds Electronic Nose & AI Safety Platform)*

---

## 🔗 ลิงก์ระบบจริง (Production Links)

| บริการ (Service) | ลิงก์ (URL) | รายละเอียด |
|---|---|---|
| 🌐 **Web Dashboard (Vercel)** | [https://voc-quality.vercel.app](https://voc-quality.vercel.app) | หน้าเว็บหลัก ระบบติดตามเรียลไทม์, แดชบอร์ด, และ Kiosk |
| ⚙️ **Backend API (Render)** | [https://voc-backend-api.onrender.com](https://voc-backend-api.onrender.com) | FastAPI RESTful API Server |
| 📖 **API Interactive Docs** | [https://voc-backend-api.onrender.com/docs](https://voc-backend-api.onrender.com/docs) | Swagger UI ทดสอบ API ทุก Endpoint |
| 🤖 **LINE OA Webhook Endpoint** | `https://voc-backend-api.onrender.com/api/line/webhook` | URL สำหรับใส่ใน LINE Developers Console |
| 💻 **Git Repositories** | GitLab: `phodsathorn2004/voc_quality`<br>GitHub: `phodsathorn/VOC_quality-` | ซอร์สโค้ด Full-stack & Firmware |

---

## 🔐 บัญชีผู้ใช้งานและสิทธิ์การเข้าถึง (RBAC & Quick Login)

ระบบมีระบบรักษาความปลอดภัย **Role-Based Access Control (RBAC)** พร้อม Quick Demo Buttons บนหน้า Login:

| บทบาท (Role) | Username | Password | หน้าเริ่มต้น (Landing) | สิทธิ์การเข้าถึง (Permissions) |
|---|---|---|---|---|
| 👑 **Administrator** | `admin` | `Admin@Voc2026!` | `/` (Dashboard) | สิทธิ์เต็มระบบ: ปรับเกณฑ์ Warning/Critical, จัดการฮาร์ดแวร์, ตั้งค่าระบบ |
| 🛠️ **Engineer** | `engineer` | `Engineer@Voc2026!` | `/` (Dashboard) | จัดการอุปกรณ์, บันทึกประวัติ Maintenance, สอบเทียบเซนเซอร์, Data Collection |
| 👷 **Operator** | `operator` | `Operator@Voc2026!` | `/kiosk` (Kiosk Mode) | ตรวจสอบค่าหน้าห้องพ่นสี, รับทราบ Alert (Acknowledge), ควบคุมพัดลมระบายอากาศ |
| 👁️ **Viewer / Auditor** | `viewer` | `Viewer@Voc2026!` | `/emissions` (Emissions) | ดูแดชบอร์ด, ตรวจสอบประวัติย้อนหลัง, เรียกดูรายงานมลพิษและการปล่อยสาร |

---

## 📱 การใช้งาน LINE Bot แจ้งเตือนฉุกเฉิน (LINE Integration)

ระบบเชื่อมต่อกับ **LINE Official Account (LINE OA)** เพื่อแจ้งเตือนอัตโนมัติเมื่อเกิดการรั่วไหลของสาร VOC หรือค่าสารเคมีเกินเกณฑ์มาตรฐาน และไม่มีเจ้าหน้าที่หน้างานกดรับทราบเหตุการณ์ (SLA Escalation Alert):

### 1. การเพิ่มเพื่อน (Add LINE Bot)
1. สแกน QR Code หรือเพิ่มเพื่อนด้วย LINE ID ของบัญชีทางการของระบบโรงงาน
2. เมื่อเพิ่มเพื่อนแล้ว บอทจะส่งข้อความต้อนรับและคำแนะนำการใช้งานเบื้องต้น

### 2. คำสั่งที่ใช้งานได้ผ่าน LINE Chat
ส่งข้อความคุยกับ LINE Bot ได้ตลอด 24 ชั่วโมง โดยพิมพ์คำสั่งดังนี้:

| คำสั่ง (Command) | ตัวอย่างการใช้งาน | คำอธิบายผลลัพธ์ |
|---|---|---|
| `BIND <BOX_ID>` | `BIND BOX-001` | **ผูกบัญชีเพื่อรับการแจ้งเตือน**: บัญชี LINE ของคุณจะถูกบันทึกเข้าระบบ เมื่อกล่อง `BOX-001` ตรวจพบก๊าซระดับอันตรายเกินเวลา SLA (5-10 นาที) บอทจะ Push ข้อความเตือนภัยเข้าแชทคุณทันที |
| `UNBIND <BOX_ID>` | `UNBIND BOX-001` | **ยกเลิกการรับแจ้งเตือน**: ถอนการแจ้งเตือนของกล่องที่ระบุ |
| `STATUS` | `STATUS` | **ตรวจสอบสถานะ**: แสดงรายชื่อกล่องเซนเซอร์ทั้งหมดที่คุณกำลังผูกรับแจ้งเตือนอยู่ |
| `HELP` หรือข้อความอื่นๆ | `HELP` | แสดงคำสั่งและคู่มือการใช้งานบอททั้งหมด |

### 3. ตัวอย่างข้อความแจ้งเตือน SLA Breach ใน LINE
```text
🚨 [SLA BREACH ALERT — LINE NOTIFICATION]
─────────────────────
⚠️ ระดับ: CRITICAL
📦 กล่อง: BOX-001
⏳ สถานะ: เกินกำหนด SLA 5 นาที (ยังไม่มีผู้รับทราบ)
📝 รายละเอียด: High VOC detected in Booth 1 (142 ppb)
🆔 Alert ID: #204
⏰ เวลาเกิดเหตุ: 14:20
─────────────────────
👉 กรุณาเข้าตรวจสอบด่วนที่ Kiosk หน้างาน หรือ Web Dashboard
```

### 4. การตั้งค่า Webhook สำหรับผู้ดูแลระบบ (LINE Developers)
1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/)
2. เลือก Messaging API Channel ของคุณ
3. ตั้งค่า **Webhook URL** เป็น:
   ```text
   https://voc-backend-api.onrender.com/api/line/webhook
   ```
4. เปิดใช้งานสวิตช์ **Use Webhook: ON**
5. ตรวจสอบค่า Environment Variables ใน Backend:
   - `LINE_CHANNEL_ACCESS_TOKEN`: Channel access token (long-lived)
   - `LINE_CHANNEL_SECRET`: Channel secret สำหรับตรวจสอบ Signature ป้องกันการปลอมแปลง
   - `LINE_TARGET_GROUP_ID`: Group ID กลางสำหรับแจ้งเตือนเข้ากลุ่มปฏิบัติการ (ทางเลือก)

---

## 🖥️ คู่มือการใช้งานหน้าเว็บแต่ละหน้า (Web Application Guide)

### 1. 📊 Dashboard (`/`)
- **4-Block Maximum Layout**: ออกแบบตามแนวคิด *Atmospheric Intelligence (Stitch AI)* แสดงผลระดับความปลอดภัยของอากาศในโรงงานแบบอ่านง่ายใน 3 วินาที
- **Core KPI Cards**: สรุปดัชนีภาพรวม (Clean/Safe), ค่า TVOC (ppb), สถานะระบบพัดลมดูดอากาศ (Exhaust Fan Boost), และสารเคมีเด่นที่ AI ตรวจจับได้
- **Live Sensor Telemetry Drawer**: กดปุ่มเพื่อเปิดถาดแสดงผลแบบสไลด์ (480px) ด้านขวา แสดงค่าดิบแบบเรียลไทม์ของหัววัดทั้ง 8 โพรบ (MQ-135, MQ-137, PID, SGP40, TGS2602 ฯลฯ) พร้อมเกณฑ์ Threshold แต่ละตัว
- **E-Nose Solvent Fingerprint Radar**: ป๊อปอัปกราฟเรดาร์ 8 ทิศทาง แสดงลายเซ็นสารเคมี (Odor Pattern) เปรียบเทียบกับฐานข้อมูลตัวทำละลาย (Toluene, Acetone, IPA, Xylene)
- **24-Hour Trend Chart**: กราฟแสดงแนวโน้มความเข้มข้นของสารระเหยย้อนหลัง 24 ชั่วโมง

### 2. 🖥️ Kiosk Mode (`/kiosk`)
- หน้าจอสำหรับติดตั้งบนหน้าจอสัมผัส (Touchscreen) ประจำหน้าห้องพ่นสีฝุ่น
- ตัวเลขขนาดใหญ่ มองเห็นได้ชัดเจนจากระยะไกล
- ปุ่ม **Emergency Booster Fan**: สำหรับผู้ปฏิบัติงานหน้างานกดสั่งเปิดพัดลมดูดอากาศแรงสุด (100%) ทันทีเมื่อเกิดกลิ่นสารเคมีฉุน
- แสดงเวลานับถอยหลัง SLA เมื่อเกิดเหตุการณ์ผิดปกติ

### 3. 🚨 Alerts & Incident Logs (`/alerts`)
- **KPI Summary**: แสดงจำนวน Critical Alerts ที่ยังค้างอยู่, Warning Alerts และจำนวนเคสที่แก้ไขเรียบร้อยแล้วในวันนี้
- **Incident Audit Table**: รายการแจ้งเตือนย้อนหลัง ระดับความรุนแรง (Critical, Warning, Advisory), รายชื่อผู้รับผิดชอบ (Owner), และสถานะ (Open, Acknowledged, Resolved)
- **SLA Countdown & Escalation**: แจ้งเตือนเหตุการณ์ที่ต้องมีผู้รับทราบภายใน 5 นาที (Critical) หรือ 10 นาที (Warning) หากเกินเวลา ระบบจะ Escalation ไปยัง LINE ทันที
- **Incident Resolution Drawer**: สามารถเลือก Action Taken (เช่น Boost Fan, Evacuate Line), ระบุชื่อผู้แก้ไข และบันทึก Note สรุปสาเหตุ

### 4. 💨 Airflow Diagram (`/airflow`)
- แผนภาพเวกเตอร์แบบอินเทอร์แอคทีฟ (Animated SVG) จำลองทิศทางการไหลของอากาศในห้องพ่นสีฝุ่น
- แสดงการทำงานของ **Pre-filter**, **Wet Scrubber**, **Activated Carbon Bed**, และ **Exhaust Stack**
- แสดงอุณหภูมิเบดถ่านกัมมันต์และค่าสาร VOC ตกค้างที่ปลายปล่องแบบเรียลไทม์

### 5. 📜 Emissions Report (`/emissions`)
- หน้าสรุปปริมาณการปล่อยสาร VOC สู่บรรยากาศรายปี (Yearly Stack Emissions)
- การเปรียบเทียบกับค่ามาตรฐานความปลอดภัยสากลและเกณฑ์โรงงานอุตสาหกรรม
- ฟอร์มบันทึกผลการตรวจวัดทางแล็บออฟไลน์ (Offline Laboratory Sample Entry) พร้อม Export สรุปข้อมูล

### 6. 🛡️ Industrial Safety Reference (`/air-quality-guide`)
- มาตรฐานความปลอดภัยสารอินทรีย์ระเหยง่ายในโรงงานอุตสาหกรรม (เทียบเคียง OSHA, NIOSH, ACGIH, ISO 16000)
- คำแนะนำการสวมใส่อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE Matrix) เช่น หน้ากากป้องกันไอระเหยสารอินทรีย์ (Organic Vapor Cartridge), แว่นตา และถุงมือกันสารเคมี
- ขั้นตอนการปฏิบัติเมื่อพบความเข้มข้นของก๊าซในแต่ละระดับ

### 7. 📈 History & Export (`/history`)
- ค้นหาข้อมูลย้อนหลังตามหมายเลขกล่อง (Box ID), ช่วงวันที่ และประเภทสาร
- ตารางแสดงผลประวัติรายชั่วโมงและรายวัน
- ปุ่ม **Export CSV**: ดาวน์โหลดข้อมูลเพื่อนำไปวิเคราะห์ต่อใน Excel หรือซอฟต์แวร์สถิติ

### 8. 🔧 Maintenance & Calibration (`/maintenance`)
- **Consumable Life Gauges**: เกจแสดงอายุการใช้งานที่เหลืออยู่ของแผ่นกรอง HEPA, ถ่าน Activated Carbon, และหลอด UV Oxidation
- **Sensor Calibration Registry**: ตารางรอบการสอบเทียบเซนเซอร์ วันที่สอบเทียบล่าสุด และกำหนดสอบเทียบคราวถัดไป
- **Zero-Air Baseline Calibration**: ปุ่มสั่งสอบเทียบจุดศูนย์ด้วยอากาศบริสุทธิ์
- **Add Maintenance Log Drawer**: บันทึกประวัติการเปลี่ยนฟิลเตอร์ ซ่อมบำรุง หรือเปลี่ยนหัววัดใหม่ พร้อมบันทึกผู้ปฏิบัติงานและเลขอ้างอิง

### 9. 📦 Devices Registry (`/devices`)
- รายการกล่องตรวจวัดทั้งหมดในโรงงาน (เช่น `BOX-001`, `BOX-002`)
- สถานะการเชื่อมต่อ (Online/Offline), IP Address, รุ่นของเฟิร์มแวร์ และเวลา Last Seen
- สามารถเพิ่ม แก้ไขข้อมูล หรือนำอุปกรณ์ออกจากระบบ

### 10. 🧪 Data Collection & E-Nose AI Training (`/data-collection`)
- เครื่องมือสำหรับทีมวิจัยและวิศวกรเพื่อเก็บตัวอย่างข้อมูลกลิ่นสารเคมี
- เลือกสารเคมีที่กำลังทดสอบ (เช่น Toluene, Acetone, Isopropanol, Xylene, Ambient Air)
- กดปุ่ม **Start Sampling** เพื่อเริ่มบันทึกค่าดิบจากเซนเซอร์พร้อม Label ลงฐานข้อมูล
- ปุ่ม **Export Training Dataset**: ส่งออกข้อมูลเป็นไฟล์ CSV สำหรับนำไปเทรน Machine Learning ในโฟลเดอร์ `ml/`

### 11. ⚙️ Settings (`/settings`)
- กำหนดค่าเกณฑ์การแจ้งเตือน (Thresholds) รายโซน:
  - **Zone 1: Spray Booth Primary** (Warning / Critical ppb)
  - **Zone 2: Curing Line Tunnel** (Warning / Critical ppb)
  - **Zone 3: Exhaust Stack Recirculation** (Warning / Critical ppb)
- ดูสถานะการเชื่อมต่อ Notification Channels (LINE OA, Webhook, Sound)

---

## 📡 การส่งข้อมูลจากฮาร์ดแวร์ (Hardware Ingest API)

กล่องตรวจวัด ESP32-S3 จะส่งข้อมูลเข้าสู่ระบบผ่าน REST API:

- **Endpoint**: `POST https://voc-backend-api.onrender.com/api/ingest`
- **Content-Type**: `application/json`

### รูปแบบ JSON Payload:
```json
{
  "box_id": "BOX-001",
  "session_id": null,
  "temp": 28.5,
  "rh": 55.2,
  "pm25": 12.0,
  "tvoc": 64.0,
  "eco2": 450,
  "mq3": 2100,
  "mq135": 1420,
  "mq8": 1650,
  "mics_co": 1100,
  "no2": 820,
  "nh3": 1380
}
```
*(หมายเหตุ: กรณีอยู่ในช่วงเก็บตัวอย่างสำหรับเทรน AI ในหน้า Data Collection ให้ระบุ `session_id` ตามที่ได้จากระบบ)*

---

## 💻 การติดตั้งและรันในเครื่องสำหรับพัฒนา (Local Development)

### 1. รัน Frontend (React + Vite + Tailwind v4)
```bash
cd vocs-website/frontend
npm install
npm run dev
```
เข้าใช้งานที่: `http://localhost:5173`

### 2. รัน Backend (FastAPI + Python)
```bash
cd vocs-website/backend
python -m venv venv
source venv/bin/activate  # บน Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
เข้าใช้งานที่: `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`)

### 3. ตรวจสอบโค้ดและ Build
```bash
# ตรวจสอบโค้ด Frontend ด้วย oxlint
npm --prefix vocs-website/frontend run lint

# ทดสอบคอมไพล์โปรเจกต์
npm --prefix vocs-website/frontend run build
```

---

## 📋 กติกาและการบันทึกงาน (Project Guidelines)
- การเปลี่ยนแปลงโค้ด การตั้งค่า โครงสร้างฐานข้อมูล หรือเอกสารทุกครั้ง ต้องบันทึกในโฟลเดอร์ `logbook/` ตามข้อกำหนดใน [AGENTS.md](AGENTS.md)
- ห้ามบันทึกรหัสผ่าน API Key หรือความลับใดๆ ลงในไฟล์เอกสาร
