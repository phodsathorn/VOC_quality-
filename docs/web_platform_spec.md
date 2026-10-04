# 🌐 Web Platform Specification — Adaptive E-Nose System

> **เอกสารฉบับนี้สำหรับส่งมอบให้เพื่อนที่รับผิดชอบพัฒนา Web Platform**
> ออกแบบจากการวิเคราะห์ระบบทั้งหมด เพื่อให้เข้าใจบทบาทของเว็บ, ข้อมูลที่ต้องรับ-ส่ง, หน้าตา UI ที่ต้องมี, และ Backend logic ที่ต้องทำ

---

## 1. ภาพรวมระบบ (System Overview)

```
┌───────────────┐          WiFi            ┌─────────────────────────────────────┐
│  🟦 Sensor Box │  ──── MQTT/HTTP ────→   │           🌐 Web Platform           │
│  (ESP32)       │                          │                                     │
│                │                          │  Frontend:                          │
│  ส่ง raw data  │ → ทุก 5 วินาที →       │    • Dashboard (แสดงค่า real-time)   │
│  ทุก 5 วินาที  │                          │    • Labeling Wizard (ติดป้ายข้อมูล)│
│                │                          │    • Training UI (สั่ง train + ดูผล)│
│                │                          │    • Model Manager (deploy/rollback)│
│                │                          │                                     │
│  รับ OTA       │ ←── firmware.bin ──────  │  Backend:                           │
│  firmware ใหม่ │                          │    • API รับข้อมูล                   │
│                │                          │    • Database เก็บ raw + labeled     │
│                │                          │    • ML Training Pipeline (Python)   │
│                │                          │    • OTA Distribution Server         │
└───────────────┘                          └─────────────────────────────────────┘
```

### บทบาทของ Web Platform
1. **รับและเก็บข้อมูล** จากกล่อง sensor (real-time)
2. **แสดงผล Dashboard** ให้ผู้ใช้ดูค่าคุณภาพอากาศ
3. **ให้ผู้ใช้ label (ติดป้าย)** ว่าตอนนี้อากาศคืออะไร (เช่น ทินเนอร์, ควัน, สะอาด)
4. **Train ML Model** จาก labeled data บน server
5. **Deploy โมเดลกลับ** ไปที่กล่อง ESP32 ผ่าน OTA (Over-the-Air)

---

## 2. ข้อมูลที่ ESP32 ส่งมา (Data Schema)

ESP32 จะส่งข้อมูลมาเป็น **JSON** ทุกๆ 5 วินาที:

```json
{
  "timestamp": "2026-09-01T10:30:00+07:00",
  "box_id": "BOX-001",
  "firmware_version": "1.0.0",
  "mode": "data_collection",

  "e_nose": {
    "mq3_raw": 2847,
    "mq3_rs_ro": 0.35,
    "mq135_raw": 1560,
    "mq135_rs_ro": 0.62,
    "mq2_raw": 980,
    "mq2_rs_ro": 0.78,
    "mics_co_raw": 1200,
    "mics_no2_raw": 890,
    "mics_nh3_raw": 1450
  },

  "environment": {
    "temperature_c": 32.5,
    "humidity_pct": 68.2,
    "eco2_ppm": 420,
    "tvoc_ppb": 85,
    "pm1_ug": 12,
    "pm25_ug": 25,
    "pm10_ug": 38
  },

  "computed": {
    "mq3_mq135_ratio": 1.83,
    "mq3_mq2_ratio": 2.91,
    "delta_mq3_5s": 120
  },

  "inference": {
    "prediction": "thinner",
    "confidence": 0.92,
    "model_version": "v1.0"
  }
}
```

### อธิบาย Field แต่ละกลุ่ม

| กลุ่ม | Field | คำอธิบาย | ใช้ทำอะไร |
|---|---|---|---|
| **Metadata** | `timestamp` | เวลาที่วัด (ISO 8601) | จัดเรียงข้อมูลตามเวลา |
| | `box_id` | รหัสกล่อง (เช่น BOX-001) | แยกข้อมูลของแต่ละกล่อง/โรงงาน |
| | `firmware_version` | เวอร์ชัน firmware ปัจจุบัน | เช็คว่า OTA สำเร็จหรือยัง |
| | `mode` | โหมดการทำงาน | `data_collection` หรือ `inference` |
| **E-Nose** | `mq3_raw` | ค่าดิบจาก ADC ของ MQ-3 | เก็บไว้อ้างอิง |
| | `mq3_rs_ro` | อัตราส่วน Rs/Ro (normalized) | **ใช้เป็น feature สำหรับ ML** |
| | `mq135_raw/rs_ro` | ค่า MQ-135 (VOC ทั่วไป) | feature สำหรับ ML |
| | `mq2_raw/rs_ro` | ค่า MQ-2 (ควัน/LPG) | feature สำหรับ ML |
| | `mics_co/no2/nh3_raw` | ค่า MiCS-6814 แต่ละก๊าซ | feature สำหรับ ML |
| **Environment** | `temperature_c` | อุณหภูมิ (°C) จาก DHT22 | แสดง Dashboard + feature ML |
| | `humidity_pct` | ความชื้นสัมพัทธ์ (%) | แสดง Dashboard + feature ML |
| | `eco2_ppm` | CO2 เทียบเท่า จาก CCS811 | แสดง Dashboard |
| | `tvoc_ppb` | TVOC จาก CCS811 | แสดง Dashboard |
| | `pm1/25/10_ug` | ฝุ่น PM จาก PMS5003 | แสดง Dashboard |
| **Computed** | `mq3_mq135_ratio` | อัตราส่วนระหว่างเซนเซอร์ | feature ML (ลายเซ็นสาร) |
| | `delta_mq3_5s` | ΔValue/Δt ของ MQ-3 | feature ML (ความเร็วการเปลี่ยนแปลง) |
| **Inference** | `prediction` | ผลทำนายจากโมเดล (ถ้ามี) | แสดงบน Dashboard |
| | `confidence` | ระดับความมั่นใจ 0-1 | แสดงบน Dashboard |

---

## 3. API Endpoints (สัญญาระหว่าง ESP32 ↔ Web)

### 3.1 ESP32 → Web (กล่องส่งข้อมูลมา)

| Method | Endpoint | Body | คำอธิบาย |
|---|---|---|---|
| `POST` | `/api/data` | JSON ตามหัวข้อ 2 | ส่งค่าเซนเซอร์ทุก 5 วินาที |
| `GET` | `/api/firmware/check?box_id=BOX-001&version=1.0.0` | — | ESP32 ถามว่ามี firmware ใหม่ไหม |
| `GET` | `/api/firmware/download?box_id=BOX-001` | — | ดาวน์โหลด firmware.bin |
| `POST` | `/api/status` | `{"box_id":"BOX-001","status":"online","uptime_s":3600}` | แจ้งสถานะกล่อง (heartbeat) |

### 3.2 Web → Web (ใช้ภายในเว็บเอง)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| `GET` | `/api/data/latest?box_id=BOX-001` | ดึงค่าล่าสุดสำหรับ Dashboard |
| `GET` | `/api/data/history?box_id=BOX-001&from=...&to=...` | ดึงค่าย้อนหลังสำหรับกราฟ |
| `POST` | `/api/label` | ติด label ให้ข้อมูลช่วงเวลาหนึ่ง |
| `GET` | `/api/dataset?box_id=BOX-001` | ดึง labeled dataset สำหรับ train |
| `POST` | `/api/train` | สั่ง backend train model |
| `GET` | `/api/train/status` | เช็คสถานะ training (กำลังทำ/เสร็จ/ผิดพลาด) |
| `GET` | `/api/models?box_id=BOX-001` | ดูรายการ model ที่ train ไว้ |
| `POST` | `/api/deploy` | สั่ง deploy model ไปที่กล่อง |

### 3.3 ตัวอย่าง Request/Response

**POST `/api/label`** (ติด label)
```json
// Request
{
  "box_id": "BOX-001",
  "label": "thinner",
  "start_time": "2026-09-01T10:30:00+07:00",
  "end_time": "2026-09-01T10:35:00+07:00"
}

// Response
{
  "status": "ok",
  "labeled_count": 60,
  "message": "Labeled 60 samples as 'thinner'"
}
```

**POST `/api/train`** (สั่ง train)
```json
// Request
{
  "box_id": "BOX-001",
  "model_type": "MLP",
  "classes": ["clean", "thinner", "smoke"]
}

// Response
{
  "status": "training_started",
  "job_id": "job-20260901-001",
  "estimated_time_s": 120
}
```

**GET `/api/train/status?job_id=job-20260901-001`** (เช็คสถานะ)
```json
{
  "status": "completed",
  "accuracy": 0.895,
  "val_accuracy": 0.872,
  "confusion_matrix": {
    "clean":   {"clean": 95, "thinner": 3, "smoke": 2},
    "thinner": {"clean": 5,  "thinner": 90, "smoke": 5},
    "smoke":   {"clean": 2,  "thinner": 8,  "smoke": 90}
  },
  "model_size_kb": 48,
  "model_id": "model-BOX001-v2",
  "can_deploy": true
}
```

---

## 4. หน้า UI ที่ต้องมี (Frontend Pages)

### 4.1 หน้า Dashboard (แสดงค่า Real-Time)

```
┌─────────────────────────────────────────────────────────┐
│  📊 Dashboard — BOX-001 (โรงงาน ABC)      🟢 Online    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ 🌡️ Temp  │  │ 💧 RH    │  │ 🫁 PM2.5 │  │ 🏭 CO2 │ │
│  │  32.5°C  │  │  68.2%   │  │  25 µg/m³│  │ 420ppm │ │
│  │  ███████ │  │  ██████  │  │  █████   │  │ ████   │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│  E-Nose Sensor Array:                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ MQ-3     │  │ MQ-135   │  │ MQ-2     │  │ MiCS   │ │
│  │ Rs/Ro:   │  │ Rs/Ro:   │  │ Rs/Ro:   │  │ CO:1200│ │
│  │  0.35    │  │  0.62    │  │  0.78    │  │ NO2:890│ │
│  │  ▼▼▼▼▼  │  │  ▽▽▽▽   │  │  △△     │  │ NH3:.. │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│  ┌─── Inference Result (ถ้ามีโมเดลทำงานอยู่) ───────┐ │
│  │  🏷️ ผลจำแนก: ทินเนอร์        Confidence: 92%     │ │
│  │  ████████████████████░░░                          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─── กราฟ Sensor History (15 นาทีล่าสุด) ──────────┐ │
│  │  ~~~~~~/\~~~~~~~/\~~~~~                            │ │
│  │  MQ-3 ── MQ-135 -- MQ-2 ·· T/RH ─·              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [📋 Label Data]  [🤖 Train Model]  [📦 Manage Models] │
└─────────────────────────────────────────────────────────┘
```

**ข้อมูลที่แสดง:**
- การ์ดบนสุด: อุณหภูมิ, ความชื้น, PM2.5, CO2 (อ่านง่ายสำหรับช่างโรงงาน)
- กล่างกลาง: ค่า Rs/Ro ของเซนเซอร์ E-Nose แต่ละตัว (สำหรับวิศวกร)
- กล่อง Inference: ผลทำนายจากโมเดล ML (ถ้ามี)
- กราฟ: แสดงค่าย้อนหลัง 15 นาที (line chart)

---

### 4.2 หน้า Labeling Wizard (ติดป้ายข้อมูล)

> **สำคัญมาก:** หน้านี้ต้องทำเป็น Step-by-Step Wizard เพื่อให้ช่างโรงงานทำตามได้ง่าย

```
┌─────────────────────────────────────────────────────────┐
│  📋 Data Labeling Wizard — BOX-001                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ขั้นตอนที่ 1 / 3                                        │
│  ═══════════════                                        │
│                                                         │
│  🧹 เก็บข้อมูล "อากาศสะอาด" (Clean Air)                 │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  📝 คำแนะนำ:                                      │  │
│  │                                                    │  │
│  │  1. ตรวจสอบว่าไม่มีสารเคมี/ควันรอบกล่อง           │  │
│  │  2. เปิดพัดลมระบายอากาศให้สะอาด                    │  │
│  │  3. รอ 2 นาทีให้อากาศนิ่ง                          │  │
│  │  4. กดปุ่ม "เริ่มเก็บ" ด้านล่าง                      │  │
│  │                                                    │  │
│  │  ⏱️ ระบบจะเก็บข้อมูลอัตโนมัติ 5 นาที              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  สถานะ: ⬜ ยังไม่เริ่มเก็บ                               │
│                                                         │
│  ┌─────────────────────┐                                │
│  │  🟢 เริ่มเก็บข้อมูล   │                                │
│  └─────────────────────┘                                │
│                                                         │
│  [← ย้อนกลับ]                              [ข้ามขั้นตอน →]│
└─────────────────────────────────────────────────────────┘
```

**เมื่อกดเริ่มเก็บ → เปลี่ยนเป็น:**

```
│  สถานะ: 🔴 กำลังเก็บข้อมูล...                            │
│                                                         │
│  ████████████████░░░░░░░░░░  3:24 / 5:00 นาที          │
│  เก็บแล้ว: 41 / 60 ตัวอย่าง  ✅                         │
│                                                         │
│  ┌─── Live Sensor Values ──────────────────────┐       │
│  │  MQ-3: 0.95   MQ-135: 0.91   MQ-2: 0.88    │       │
│  │  T: 32.1°C    RH: 65%                       │       │
│  └──────────────────────────────────────────────┘       │
│                                                         │
│  ┌──────────────────┐                                   │
│  │  ⏹️ หยุดเก็บ (ยกเลิก) │                                   │
│  └──────────────────┘                                   │
```

**ขั้นตอนทั้ง 3 (ค่าเริ่มต้น แต่ user เพิ่มได้):**

| Step | Label | คำแนะนำ | ระยะเวลา |
|---|---|---|---|
| 1 | `clean` (อากาศสะอาด) | "ตรวจสอบว่าไม่มีสารเคมีรอบกล่อง" | 5 นาที |
| 2 | `thinner` (ทินเนอร์) | "เปิดฝาทินเนอร์วางใกล้กล่อง" | 5 นาที |
| 3 | `smoke` (ควัน) | "จุดธูปหรือเทียนใกล้กล่อง" | 5 นาที |
| + | *(user กำหนดเอง)* | "พิมพ์ชื่อสารเคมี + คำแนะนำ" | 5 นาที |

> **ฟีเจอร์เพิ่มเติม:** ให้ user สามารถ **เพิ่ม Label ใหม่ได้เอง** (เช่น "สีพ่น", "ยาล้างทำความสะอาด") เพราะแต่ละโรงงานใช้สารไม่เหมือนกัน

---

### 4.3 หน้า Training UI (สั่ง Train + ดูผล)

```
┌─────────────────────────────────────────────────────────┐
│  🤖 Train Model — BOX-001                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─── Dataset Summary ──────────────────────────────┐  │
│  │                                                    │  │
│  │  clean:    85 ตัวอย่าง  ████████████████ ✅       │  │
│  │  thinner:  72 ตัวอย่าง  █████████████   ✅       │  │
│  │  smoke:    60 ตัวอย่าง  ██████████      ✅       │  │
│  │                                                    │  │
│  │  รวม: 217 ตัวอย่าง, 3 classes                     │  │
│  │  ✅ ผ่านการตรวจสอบ (ทุก class ≥ 60, สมดุล)         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────┐                               │
│  │  🚀 เริ่ม Train Model  │                               │
│  └──────────────────────┘                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**หลัง Train เสร็จ:**

```
│  ┌─── Training Results ─────────────────────────────┐  │
│  │                                                    │  │
│  │  ✅ Training สำเร็จ!        เวลาที่ใช้: 45 วินาที   │  │
│  │                                                    │  │
│  │  Accuracy:       89.5%   🟢                       │  │
│  │  Val Accuracy:   87.2%   🟢                       │  │
│  │  Model Size:     48 KB                             │  │
│  │                                                    │  │
│  │  Confusion Matrix:                                 │  │
│  │  ┌──────────┬───────┬─────────┬───────┐           │  │
│  │  │ จริง\ทำนาย│ clean │ thinner │ smoke │           │  │
│  │  ├──────────┼───────┼─────────┼───────┤           │  │
│  │  │ clean    │  95%  │    3%   │   2%  │           │  │
│  │  │ thinner  │   5%  │   90%   │   5%  │           │  │
│  │  │ smoke    │   2%  │    8%   │  90%  │           │  │
│  │  └──────────┴───────┴─────────┴───────┘           │  │
│  │                                                    │  │
│  │  ┌────────────────────┐  ┌──────────────────┐     │  │
│  │  │ ✅ Deploy to BOX-001│  │ ❌ ยกเลิก         │     │  │
│  │  └────────────────────┘  └──────────────────┘     │  │
│  └────────────────────────────────────────────────────┘  │
```

---

### 4.4 หน้า Model Manager (จัดการโมเดล)

```
┌─────────────────────────────────────────────────────────┐
│  📦 Model Manager — BOX-001                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─── กล่องกำลังใช้ ──────────────────────────────────┐│
│  │  Model: v2.0    Accuracy: 89.5%    Deploy: 01/09/26 ││
│  │  Classes: clean, thinner, smoke                      ││
│  │  Status: 🟢 Active                                   ││
│  └──────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─── History ───────────────────────────────────────┐  │
│  │ # │ Version │ Accuracy │ Date       │ Status      │  │
│  │ 1 │ v2.0    │ 89.5%    │ 01/09/26   │ 🟢 Active  │  │
│  │ 2 │ v1.0    │ 78.0%    │ 28/08/26   │ ⬜ Archived │  │
│  │ 3 │ base    │ 72.0%    │ 25/08/26   │ ⬜ Base     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌────────────────┐  ┌──────────────────────────┐      │
│  │ ↩️ Rollback v1.0│  │ 🗑️ ลบ model ที่ไม่ใช้แล้ว │      │
│  └────────────────┘  └──────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Guardrails (ระบบป้องกันที่เว็บต้องทำ)

> **สำคัญมาก:** ระบบเหล่านี้ **ต้องมี** ไม่ใช่ optional — ป้องกันไม่ให้ผู้ใช้โรงงานเทรนโมเดลที่ "เดามั่ว" ออกไปใช้จริง

### 5.1 Auto Data Validation (ก่อน Train)

เช็คอัตโนมัติก่อนอนุญาตให้กดปุ่ม "Train":

| เงื่อนไข | ผ่าน | ไม่ผ่าน | ผลลัพธ์ |
|---|---|---|---|
| แต่ละ class มี ≥ 60 ตัวอย่าง | ✅ | ❌ | **บล็อกปุ่ม Train** + แนะนำให้เก็บเพิ่ม |
| สัดส่วน class ห่างกันไม่เกิน 3 เท่า | ✅ | ⚠️ | เตือน "Class Imbalance" |
| ค่า sensor มีความแปรปรวน (std > 0) | ✅ | ❌ | เตือน "Sensor อาจไม่ทำงาน" |
| มีอย่างน้อย 2 classes | ✅ | ❌ | **บล็อกปุ่ม Train** |

### 5.2 Accuracy Gate (ก่อน Deploy)

| Accuracy | ผลลัพธ์ |
|---|---|
| **≥ 80%** | ✅ ปุ่ม "Deploy" เปิดให้กดได้ปกติ |
| **60-80%** | ⚠️ เตือน + แนะนำให้เก็บข้อมูลเพิ่ม + ปุ่ม "Deploy ถึงแม้ไม่ผ่าน" (ซ่อนไว้ กดเพิ่มอีกที) |
| **< 60%** | ❌ บล็อก Deploy ทั้งหมด — บังคับให้เก็บข้อมูลใหม่ |

### 5.3 Rollback (ย้อนกลับโมเดลเก่า)

เก็บ firmware เวอร์ชันก่อนหน้าไว้อย่างน้อย 2 เวอร์ชัน เพื่อให้ user สามารถกดย้อนกลับได้ถ้าโมเดลใหม่แย่กว่า

---

## 6. Backend ML Training Pipeline

### 6.1 Flow การ Train

```
1. ดึง labeled data จาก Database
   → filter เฉพาะ box_id ที่เลือก
   → ได้ DataFrame: [timestamp, mq3_rs_ro, mq135_rs_ro, ..., label]

2. Feature Selection
   → ใช้เฉพาะ field ที่ชื่อขึ้นต้นด้วย rs_ro, ratio, delta, temperature, humidity
   → ไม่ใช้ raw ADC (เพื่อให้ข้ามกล่องได้)

3. Preprocessing
   → StandardScaler → normalize ทุก feature ให้ mean=0, std=1
   → บันทึก scaler_mean[] และ scaler_std[] ไว้

4. Train Model
   → MLP (Multi-Layer Perceptron)
   → Architecture: Input(N) → Dense(64, relu) → Dropout(0.3) → Dense(32, relu) → Dense(C, softmax)
   → Train/Val split: 80/20
   → Early stopping patience=10

5. Evaluate
   → คำนวณ Accuracy, Val Accuracy, Confusion Matrix
   → เช็ค Accuracy Gate (≥80%?)

6. Convert to TFLite
   → tf.lite.TFLiteConverter
   → Quantize (INT8) เพื่อลดขนาด
   → บันทึก model.tflite (~20-100 KB)

7. Compile Firmware (ถ้าใช้ OTA Full Firmware)
   → ฝัง model.tflite + scaler_params ลงใน firmware source
   → Compile เป็น firmware.bin
   → Host ไว้บน server รอ ESP32 มาดาวน์โหลด
```

### 6.2 Feature List ที่ใช้ Train (10 features)

| # | Feature Name | แหล่ง | คำอธิบาย |
|---|---|---|---|
| 1 | `mq3_rs_ro` | MQ-3 | ค่าทินเนอร์ (normalized) |
| 2 | `mq135_rs_ro` | MQ-135 | ค่า VOC ทั่วไป (normalized) |
| 3 | `mq2_rs_ro` | MQ-2 | ค่าควัน/LPG (normalized) |
| 4 | `mics_co_raw` | MiCS-6814 | ค่า CO |
| 5 | `mics_no2_raw` | MiCS-6814 | ค่า NO2 |
| 6 | `mics_nh3_raw` | MiCS-6814 | ค่า NH3 |
| 7 | `mq3_mq135_ratio` | คำนวณ | ลายเซ็นของสาร |
| 8 | `mq3_mq2_ratio` | คำนวณ | ลายเซ็นของสาร |
| 9 | `temperature_c` | DHT22 | ชดเชยความร้อน |
| 10 | `humidity_pct` | DHT22 | ชดเชยความชื้น |

### 6.3 Scaler Parameters (ต้องส่งคู่กับ Model)

```json
{
  "feature_names": ["mq3_rs_ro", "mq135_rs_ro", "mq2_rs_ro", "mics_co_raw", "mics_no2_raw", "mics_nh3_raw", "mq3_mq135_ratio", "mq3_mq2_ratio", "temperature_c", "humidity_pct"],
  "mean": [0.45, 0.58, 0.72, 1100, 800, 1300, 1.52, 2.35, 31.5, 65.0],
  "std": [0.18, 0.21, 0.15, 350, 280, 420, 0.45, 0.82, 3.2, 12.0],
  "class_names": ["clean", "thinner", "smoke"],
  "model_version": "v2.0",
  "trained_at": "2026-09-01T15:00:00+07:00"
}
```

> **สำคัญ:** ค่า mean/std นี้ **เปลี่ยนทุกครั้งที่ retrain** เพราะแต่ละโรงงานอากาศไม่เหมือนกัน → ต้องฝังใน firmware ใหม่ด้วยทุกครั้ง

---

## 7. Database Schema (โครงสร้างฐานข้อมูล)

### 7.1 ตาราง `sensor_readings` (ข้อมูลดิบ)

| Column | Type | คำอธิบาย |
|---|---|---|
| `id` | INT (PK, AUTO) | Primary Key |
| `box_id` | VARCHAR(20) | รหัสกล่อง |
| `timestamp` | DATETIME | เวลาที่วัด |
| `mq3_raw` | INT | ค่า ADC MQ-3 |
| `mq3_rs_ro` | FLOAT | ค่า normalized |
| `mq135_raw` | INT | ค่า ADC MQ-135 |
| `mq135_rs_ro` | FLOAT | ค่า normalized |
| `mq2_raw` | INT | ค่า ADC MQ-2 |
| `mq2_rs_ro` | FLOAT | ค่า normalized |
| `mics_co_raw` | INT | MiCS CO |
| `mics_no2_raw` | INT | MiCS NO2 |
| `mics_nh3_raw` | INT | MiCS NH3 |
| `temperature_c` | FLOAT | อุณหภูมิ |
| `humidity_pct` | FLOAT | ความชื้น |
| `eco2_ppm` | INT | CO2 |
| `tvoc_ppb` | INT | TVOC |
| `pm25_ug` | INT | ฝุ่น PM2.5 |
| `label` | VARCHAR(50) NULL | label (ถ้ามี) |

### 7.2 ตาราง `models` (โมเดลที่ train ไว้)

| Column | Type | คำอธิบาย |
|---|---|---|
| `id` | INT (PK, AUTO) | |
| `box_id` | VARCHAR(20) | กล่องที่ train ให้ |
| `version` | VARCHAR(10) | เช่น "v2.0" |
| `accuracy` | FLOAT | ค่า accuracy |
| `val_accuracy` | FLOAT | ค่า validation accuracy |
| `classes` | JSON | เช่น ["clean","thinner","smoke"] |
| `scaler_params` | JSON | mean/std ของแต่ละ feature |
| `model_file_path` | VARCHAR(255) | path ไปที่ .tflite |
| `firmware_file_path` | VARCHAR(255) | path ไปที่ .bin |
| `status` | ENUM | `active`, `archived`, `failed` |
| `created_at` | DATETIME | วันที่ train |

### 7.3 ตาราง `boxes` (ข้อมูลกล่อง)

| Column | Type | คำอธิบาย |
|---|---|---|
| `box_id` | VARCHAR(20) PK | รหัสกล่อง |
| `factory_name` | VARCHAR(100) | ชื่อโรงงาน |
| `current_firmware` | VARCHAR(10) | เวอร์ชัน firmware ปัจจุบัน |
| `current_model` | VARCHAR(10) | เวอร์ชัน model ปัจจุบัน |
| `last_seen` | DATETIME | ครั้งสุดท้ายที่กล่องส่งข้อมูล |
| `status` | ENUM | `online`, `offline` |

---

## 8. เทคโนโลยีที่แนะนำ (Tech Stack)

| ส่วน | ตัวเลือกที่แนะนำ | เหตุผล |
|---|---|---|
| **Frontend** | React / Next.js / Vue | SPA ทันสมัย, real-time update ได้ |
| **Backend API** | Python FastAPI / Flask | เขียนง่าย, รวม ML pipeline ได้ในภาษาเดียว |
| **Database** | PostgreSQL / MySQL | เก็บ time-series data ได้ดี |
| **ML Training** | Python + TensorFlow/Keras | convert TFLite ได้ตรง |
| **MQTT Broker** | Mosquitto (self-hosted) / HiveMQ Cloud | รับ data จาก ESP32 |
| **File Storage** | Server filesystem / S3 | เก็บ .tflite, .bin |
| **Hosting** | DigitalOcean / AWS EC2 / Railway | ราคาถูก, รัน Python ได้ |

---

## 9. สิ่งที่ต้องตกลงกัน (Action Items)

| # | เรื่อง | ตัวเลือก | ใครตัดสินใจ |
|---|---|---|---|
| 1 | **Protocol:** ใช้ MQTT หรือ HTTP? | MQTT เหมาะกับ real-time มากกว่า | ตกลงร่วมกัน |
| 2 | **Data Format:** JSON schema ตรงกัน? | ใช้ schema ในหัวข้อ 2 | ตกลงร่วมกัน |
| 3 | **OTA:** ใครสร้าง firmware.bin? | เพื่อน (server compile) หรือ คุณ (manual) | ตกลงร่วมกัน |
| 4 | **Hosting:** Deploy เว็บที่ไหน? | Cloud vs มหาวิทยาลัย | เพื่อนตัดสินใจ |
| 5 | **Timeline:** เว็บเสร็จเมื่อไหร่? | ต้องรู้เพื่อวางแผน integrate | เพื่อน |
| 6 | **Auth:** ต้องมี Login/Register ไหม? | ถ้ามีหลายโรงงาน ควรมี | ตกลงร่วมกัน |
