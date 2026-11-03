# 🌐 VOC / E-Nose Web Application & Backend Services

ศูนย์รวมระบบเว็บมอนิเตอร์ริ่ง แดชบอร์ดเรียลไทม์ และ API Backend สำหรับระบบตรวจวัดสารระเหยง่าย (VOC) และปัญญาประดิษฐ์จำแนกกลิ่นสำหรับโรงงานพ่นสีฝุ่น

---

## 🔗 Production Endpoints & URLs

- 🌐 **Web Dashboard:** [https://voc-quality.vercel.app](https://voc-quality.vercel.app)
- ⚙️ **Backend API Server:** [https://voc-backend-api.onrender.com](https://voc-backend-api.onrender.com)
- 📖 **Interactive API Docs (Swagger):** [https://voc-backend-api.onrender.com/docs](https://voc-backend-api.onrender.com/docs)
- 🤖 **LINE OA Webhook:** `https://voc-backend-api.onrender.com/api/line/webhook`

---

## 🔐 บัญชีเข้าสู่ระบบ (Demo Credentials)

| Role | Username | Password | Default Page | สิทธิ์หลัก |
|---|---|---|---|---|
| **Admin** | `admin` | `Admin@Voc2026!` | `/` (Dashboard) | จัดการเกณฑ์ Warning/Critical, จัดการผู้ใช้, ตั้งค่าระบบ |
| **Engineer** | `engineer` | `Engineer@Voc2026!` | `/` (Dashboard) | สอบเทียบเซนเซอร์, บันทึก Maintenance, เทรนโมเดล AI |
| **Operator** | `operator` | `Operator@Voc2026!` | `/kiosk` (Kiosk) | จอสัมผัสหน้างาน, รับทราบ Alert, บูสต์พัดลมระบายอากาศ |
| **Viewer** | `viewer` | `Viewer@Voc2026!` | `/emissions` (Emissions) | ดูสถิติและรายงานมลพิษย้อนหลัง (Read-only) |

---

## 📱 ระบบแจ้งเตือนฉุกเฉินผ่าน LINE OA (LINE Bot Alerts)

ระบบจะส่งข้อความแจ้งเตือนอัตโนมัติเมื่อเกิดเหตุการณ์ **SLA Escalation** (เมื่อมี Alert ระดับ Warning หรือ Critical เกิดขึ้น แล้วไม่มีเจ้าหน้าที่หน้างานกดรับทราบภายใน 5–10 นาที):

### 1. วิธีเพิ่มเพื่อน LINE Bot
- เพิ่มเพื่อนผ่าน LINE OA ของโรงงาน
- ระบบจะตอบกลับด้วยข้อความต้อนรับและคำสั่งที่ใช้ได้ทันที

### 2. คำสั่งในห้องแชท (Chat Commands)
- **`BIND <BOX_ID>`** (เช่น `BIND BOX-001`): ผูกบัญชีเพื่อรับแจ้งเตือนจากกล่องที่ระบุ
- **`UNBIND <BOX_ID>`** (เช่น `UNBIND BOX-001`): ยกเลิกการรับแจ้งเตือนจากกล่องที่ระบุ
- **`STATUS`**: ตรวจสอบรายชื่อกล่องที่กำลังรับการแจ้งเตือนอยู่
- **`HELP`**: แสดงวิธีใช้งานและคำสั่งทั้งหมด

---

## 🗺️ รายละเอียดหน้าเว็บและเส้นทาง (Application Routes)

| หน้าเว็บ | URL Route | สิทธิ์ที่เข้าได้ | ฟังก์ชันหลัก |
|---|---|---|---|
| **Dashboard** | `/` | All | แดชบอร์ดสรุปผล 4 บล็อก, กราฟ 24h Trend, Drawer แสดงค่า 8 หัววัดสด, E-Nose Radar Modal |
| **Kiosk Mode** | `/kiosk` | Operator, Eng, Admin | จอสัมผัส Fullscreen หน้าห้องพ่นสี, ปุ่ม Emergency Boost Fan 100%, แสดง SLA Alert |
| **Alerts & Incidents** | `/alerts` | Operator, Eng, Admin | สรุป Incident วันนี้, การนับถอยหลัง SLA (5-10m), Acknowledge / Resolve พร้อม Drawer บันทึกวิธีแก้ปัญหา |
| **Airflow Diagram** | `/airflow` | All | SVG แผนผังระบบท่อดูดอากาศและบำบัด Wet Scrubber + Carbon Bed แสดงอุณหภูมิเบดและไอระเหยปลายปล่อง |
| **Emissions Report** | `/emissions` | All | รายงานสรุปการปล่อยสารรวมรายปี เทียบมาตรฐานสากล พร้อมฟอร์มบันทึกผลแล็บออฟไลน์ |
| **Safety Reference** | `/air-quality-guide` | All | เกณฑ์ความปลอดภัยสารเคมี VOC (OSHA/ISO 16000) และตารางคำแนะนำการใช้อุปกรณ์ PPE |
| **History** | `/history` | All | ค้นหาข้อมูลย้อนหลังตามกล่องและช่วงวันที่ พร้อมปุ่ม Export ข้อมูลเป็นไฟล์ CSV |
| **Maintenance** | `/maintenance` | Eng, Admin | แสดงอายุการใช้งานฟิลเตอร์ (HEPA, Carbon, UV), ประวัติการสอบเทียบ Zero-air, ตารางบันทึกงานซ่อมบำรุงพร้อม Drawer เพิ่มประวัติใหม่ |
| **Devices** | `/devices` | Eng, Admin | ทะเบียนกล่อง ESP32-S3 ในระบบ, สถานะ Online/Offline, เวอร์ชันเฟิร์มแวร์, IP Address |
| **Data Collection** | `/data-collection` | Eng, Admin | เครื่องมือบันทึกและติด Label กลิ่นสารเคมี (Toluene, Acetone, IPA, Xylene, Ambient) เพื่อสร้าง Dataset เทรน AI |
| **Settings** | `/settings` | Admin Only | กำหนดค่าเกณฑ์ Warning/Critical ราย Zone (Spray Booth, Curing Line, Exhaust Stack) และดูสถานะ Notification |

---

## 🚀 การติดตั้งและรันในเครื่อง (Local Setup)

### โครงสร้างโฟลเดอร์
```text
vocs-website/
├── frontend/          # React (Vite) + Tailwind CSS v4 + Lucide Icons
├── backend/           # FastAPI (Python) + PostgreSQL / asyncpg + LINE Adapter
├── firmware/          # โค้ด ESP32 Arduino สำหรับโพรบเซนเซอร์
└── ml/                # โมเดล Random Forest / Pipeline สำหรับจำแนกกลิ่นสารเคมี
```

### การรัน Frontend
```bash
cd vocs-website/frontend
npm install
npm run dev
```

### การรัน Backend
```bash
cd vocs-website/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### การทดสอบ Build & Lint
```bash
# ตรวจสอบโค้ด Frontend
npm --prefix vocs-website/frontend run lint

# ทดสอบคอมไพล์ Frontend
npm --prefix vocs-website/frontend run build
```
