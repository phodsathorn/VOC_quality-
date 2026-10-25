# VOC / E-Nose System

ระบบตรวจจับสารระเหย (VOC) ด้วย Electronic Nose (E-Nose) และ AI

## โครงสร้างโปรเจกต์

```
vocs/
├── frontend/          # React (Vite) — หน้าเว็บ Dashboard
├── backend/           # FastAPI + PostgreSQL — API Server
├── ml/                # Python — ML Training Scripts
└── docker-compose.yml # PostgreSQL via Docker
```

---

## การติดตั้งและรันระบบ

### 1. รัน Database (PostgreSQL)
```bash
docker compose up -d
# รอ ~10 วิ ให้ DB พร้อม
docker logs voc_postgres --tail 5
```

### 2. รัน Backend (FastAPI)
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python main.py

# Linux / macOS
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
Backend จะรันที่ `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

### 3. รัน Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Frontend จะรันที่ `http://localhost:5173`

> **Mock Mode**: ถ้าไม่มี Backend จริง ระบบจะแสดงข้อมูลจำลองให้อัตโนมัติ  
> ถ้าต้องการปิด Mock Mode ให้ลบ `import './mockApi.js'` ออกจาก `frontend/src/main.jsx`

---

## หน้าเว็บที่มี

| หน้า | URL | รายละเอียด |
|---|---|---|
| Dashboard | `/` | ค่าเซนเซอร์ real-time, กราฟ, ผลทำนาย AI, เลือก Box ได้ |
| ประวัติอากาศ | `/history` | ค้นข้อมูลคุณภาพอากาศย้อนหลังรายชั่วโมง/รายวันตามอุปกรณ์และช่วงวันที่ |
| Devices | `/devices` | รายการกล่องเซนเซอร์ — แก้ไข/ลบได้ |
| Data Collection | `/data-collection` | เก็บข้อมูลและติด Label สำหรับเทรน AI — แก้ไข/ลบ session |
| Airflow Diagram | `/airflow` | แผนผัง airflow แบบ SVG animation พร้อม sensor badge |
| Alerts | `/alerts` | การแจ้งเตือนอัตโนมัติ — Resolve ได้ |
| คู่มือ | `/guide` | คู่มือการใช้งานฉบับสมบูรณ์ + ESP32 code |
| Settings | `/settings` | ปรับ threshold, Box ID เริ่มต้น, refresh interval |

---

## API Endpoints

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/dashboard/latest` | ข้อมูลล่าสุดพร้อมผล AI |
| GET | `/api/dashboard/history` | ประวัติค่าเซนเซอร์ |
| GET | `/api/air-quality/daily` | (ต้องพัฒนา) สรุป min/mean/max และ coverage ต่อวัน พร้อมตัวกรอง |
| GET | `/api/air-quality/history` | (ต้องพัฒนา) ประวัติรายชั่วโมง/วันตามพารามิเตอร์และช่วงวันที่ |
| POST | `/api/ingest` | รับข้อมูลจาก ESP32-S3 |
| GET | `/api/devices` | รายการอุปกรณ์ทั้งหมด |
| PATCH | `/api/devices/{box_id}` | แก้ไข firmware / status |
| DELETE | `/api/devices/{box_id}` | ลบอุปกรณ์ |
| GET | `/api/alerts` | รายการ Alert |
| PATCH | `/api/alerts/{id}/resolve` | ปิด Alert |
| POST | `/api/training/sessions` | เริ่ม session เก็บข้อมูลเทรน |
| PATCH | `/api/training/sessions/{id}/end` | หยุด session |
| PATCH | `/api/training/sessions/{id}` | แก้ไข label / note |
| DELETE | `/api/training/sessions/{id}` | ลบ session |
| GET | `/api/export/csv` | Export ข้อมูลที่มี label เป็น CSV |

---

## ขั้นตอนเทรนโมเดล AI

1. ไปหน้า **Data Collection** → กด **เริ่มบันทึก** → วางสารใกล้กล่อง → **หยุดบันทึก**
2. ทำซ้ำอย่างน้อย 5 ชนิดสาร ชนิดละ 200+ readings (รวม AMBIENT เสมอ)
3. กด **Export CSV ทั้งหมด**
4. นำไฟล์ CSV ไปวางที่ `ml/` แล้วรัน:

```bash
cd ml
pip install -r requirements.txt
python train_model.py
```

5. Copy `voc_model.pkl` ไปที่ `backend/`:
```bash
# Windows
copy ml\voc_model.pkl backend\voc_model.pkl

# Linux / macOS
cp ml/voc_model.pkl backend/voc_model.pkl
```

6. Restart Backend — ระบบจะโหลด Model อัตโนมัติ

---

## ตัวอย่าง JSON ที่ ESP32-S3 ส่งมา

```json
POST /api/ingest
{
  "box_id": "BOX-001",
  "session_id": 1,
  "temp": 32.5,
  "rh": 68.2,
  "pm25": 25,
  "tvoc": 85,
  "eco2": 420,
  "mq3": 2847,
  "mq135": 1560,
  "mq8": 1732,
  "mics_co": 1200,
  "no2": 890,
  "nh3": 1450
}
```

> ถ้าไม่ได้อยู่ใน training session ให้ส่ง `"session_id": null`

---

## การตั้งค่า Threshold

ปรับ threshold สำหรับสี Dashboard ได้ที่หน้า **Settings** (`/settings`)

สำหรับ Alert ใน Backend จริง แก้ `THRESHOLDS` ใน `backend/main.py` บรรทัด 15–19
