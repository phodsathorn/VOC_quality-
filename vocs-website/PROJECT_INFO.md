# 📋 ข้อมูลโปรเจค — ระบบวัดคุณภาพอากาศและตรวจจับสารระเหย (VOCs / E-Nose)

> **อัพเดทล่าสุด:** 4 ตุลาคม 2569  
> **สถาปัตยกรรม:** Server-side AI Architecture (Circuit Design v2 + FastAPI + React)  
> **ผู้พัฒนา:** กล่อง Sensor (ESP32 Firmware) + Web Platform & AI Backend  

---

## 1. ชื่อโปรเจค

**ระบบตรวจวัดคุณภาพอากาศและจำแนกสารระเหย (VOCs) ด้วยเซนเซอร์อาร์เรย์และปัญญาประดิษฐ์**  
*(Electronic Nose System + Server-side Machine Learning + Full-Stack IoT Platform)*

---

## 2. วัตถุประสงค์

1. พัฒนากล่องวัดคุณภาพอากาศที่ใช้ Sensor Array (E-Nose) 8 ชนิด ตรวจจับสารเคมี สารระเหย (VOCs) และฝุ่นละออง
2. ส่งข้อมูลแบบ Real-time เข้าสู่ระบบ Web Platform ผ่าน WiFi (HTTP REST API)
3. ใช้ Machine Learning บนฝั่ง Server (FastAPI) เพื่อจำแนกประเภทสารปนเปื้อน (เช่น Clean, Thinner, Alcohol, Smoke, ฝุ่น ฯลฯ) พร้อมคำนวณระดับความมั่นใจ (Confidence Score)
4. ส่งผลการทำนาย (Prediction & Confidence) กลับมาแสดงผลที่กล่อง ESP32 และแสดงบน Web Dashboard ทันที
5. มีระบบ Data Collection & Labeling ผ่านหน้าเว็บ สำหรับบันทึกชุดข้อมูลตาม Session เพื่อนำไปเทรนและอัปเดตโมเดลได้อย่างต่อเนื่อง
6. ประเมิน Health Index และอายุใช้งานคงเหลือของอุปกรณ์/ไส้กรอง เพื่อแนะนำวันสอบเทียบหรือเปลี่ยนและรายการอะไหล่ที่ควรเตรียม
7. จัดเก็บ log คุณภาพอากาศรายวันและให้ผู้ใช้เรียกดูย้อนหลังตามอุปกรณ์ พารามิเตอร์ และช่วงวันที่ได้
8. ลดข้อความที่ไม่จำเป็นในหน้าเว็บ ให้ตัวเลข หน่วย สถานะ และระดับความเสี่ยงอ่านได้ชัดทั้งบนจอคอมพิวเตอร์และมือถือ
9. เก็บ log ย้อนหลังตามนโยบาย retention ที่กำหนด; ปัจจุบัน backend purge raw readings หลัง 30 วัน จึงต้องเพิ่ม daily summaries/ปรับ retention ก่อนรองรับประวัติระยะยาว

> ข้อกำหนด UI, รูปแบบข้อมูลย้อนหลัง และข้อจำกัดการคาดการณ์การบำรุงรักษา ดูที่ [`docs/website_review_and_requirements.md`](../docs/website_review_and_requirements.md)

---

## 3. สถาปัตยกรรมระบบ (Server-side AI Architecture)

```
┌─────────────────────────────────┐                       ┌─────────────────────────────────────────┐
│     📦 Sensor Box (ESP32)       │     HTTP POST /ingest │          🌐 Backend & Database          │
│                                 │ ────────────────────→ │             (FastAPI + Docker)          │
│ • Sensor Array (8 เซนเซอร์)     │                       │                                         │
│ • Read ADC1, I2C, UART2         │ ←──────────────────── │ • Receive Sensor Readings               │
│ • Control Fans (Intake/Exhaust) │     JSON Response     │ • Real-time AI Inference (scikit-learn) │
│ • Fetch Active Session          │   {prediction, conf}  │ • Auto Alert & Threshold Evaluation     │
└─────────────────────────────────┘                       │ • Save to PostgreSQL 16                 │
                                                          └────────────────────┬────────────────────┘
                                                                               │
                                                                  REST API     │ WebSocket/Polling
                                                                               ▼
                                                          ┌─────────────────────────────────────────┐
                                                          │          ⚛️ Frontend Dashboard          │
                                                          │              (React + Vite)             │
                                                          │                                         │
                                                          │ • Real-time Air Quality Gauges & Charts │
                                                          │ • Data Collection & Labeling Session    │
                                                          │ • Airflow Simulation & Alert History    │
                                                          │ • Device Management & Settings          │
                                                          └─────────────────────────────────────────┘
```

### โหมดการทำงานของกล่อง (ESP32 Modes):
1. **Real-time Monitoring Mode:** อ่านค่าเซนเซอร์ทุก 3 วินาที ส่งขึ้น Backend เพื่อตรวจสอบเกณฑ์อันตราย ทำนายชนิดสาร และแสดงผล
2. **Data Collection Session Mode:** ตรวจสอบกับ Backend (`/api/active-session`) หากมี Session ที่กำลังบันทึกอยู่ กล่องจะแนบ `session_id` ไปกับข้อมูลอัตโนมัติ เพื่อใช้สร้าง Dataset สำหรับเทรนโมเดล AI

---

## 4. Hardware ที่ใช้ (Circuit Design v2)

### 4.1 Microcontroller
| รายการ | ข้อมูล |
|---|---|
| **บอร์ด** | ESP32-WROOM-32 / ESP32 Series |
| **ชิป** | Xtensa Dual-Core 240MHz |
| **RAM** | 520 KB SRAM |
| **Flash** | 4 MB |
| **การเชื่อมต่อ** | WiFi 802.11 b/g/n 2.4GHz |

### 4.2 Sensor Array (8 ตัว)
| # | Sensor | พารามิเตอร์ที่วัด | Interface | GPIO / Pin | แหล่งจ่ายไฟ |
|---|---|---|---|---|---|
| 1 | **MQ-2** | LPG, Propane, Smoke | ADC1 | **GPIO 33** (ผ่าน Voltage Divider) | 5V |
| 2 | **MQ-3** | Alcohol, Thinner, สารระเหย | ADC1 | **GPIO 36** (VP) (ผ่าน Voltage Divider) | 5V |
| 3 | **MQ-8** | Hydrogen (H2) | ADC1 | **GPIO 34** (ผ่าน Voltage Divider) | 5V |
| 4 | **MQ-135**| Air Quality, Benzene, NH3, VOC | ADC1 | **GPIO 39** (VN) (ผ่าน Voltage Divider) | 5V |
| 5 | **MiCS-6814** | CO (A0), NO2 (A1), NH3 (A2) | I2C ผ่าน ADS1115 | ADS1115 Ch 0, 1, 2 | 5V |
| 6 | **PMS5003** | ฝุ่นละออง PM1.0, PM2.5, PM10 | UART2 | **GPIO 16 (RX2), GPIO 17 (TX2)** | 5V |
| 7 | **CCS811** | eCO2 (ppm), TVOC (ppb) | I2C (0x5A) | **GPIO 21 (SDA), GPIO 22 (SCL)** | 3.3V *(WAKE ต่อ GND)* |
| 8 | **DHT22** | อุณหภูมิ (°C), ความชื้นสัมพัทธ์ (%RH) | Digital Single-Bus | **GPIO 4** *(Pull-up 4.7kΩ)* | 3.3V |

### 4.3 อุปกรณ์เสริมและวงจรขับ (Peripherals)
* **ADS1115 (16-bit ADC I2C, Addr 0x48):** ใช้แปลงค่าแอนะล็อก 3 แชนแนลของ MiCS-6814 ให้ได้ความละเอียดสูงและลดสัญญาณรบกวน
* **พัดลมดูดอากาศ (Dual Fans):** 
  * Intake Fan: ขับด้วย MOSFET 2N7000 ผ่าน **GPIO 25**
  * Exhaust Fan: ขับด้วย MOSFET 2N7000 ผ่าน **GPIO 26**
  * มี Flyback Diode (1N4148) และ 10kΩ Pull-down ป้องกันวงจร
* **Voltage Dividers:** สำหรับลดแรงดันเอาต์พุต 0–5V ของเซนเซอร์ตระกูล MQ ให้เหลือไม่เกิน 3.3V ก่อนเข้า ADC1 ของ ESP32

### 4.4 ระบบจ่ายไฟ (Power Supply)
* **Main Supply:** Adapter หรือ Switching Power Supply **5V 2A–3A** ต่อเข้า 5V Bus Terminal Block โดยตรง
* **ห้ามดึงไฟจากขา 5V หรือ 3.3V ของ ESP32 ไปเลี้ยงเซนเซอร์โดยตรง** เนื่องจากฮีตเตอร์ MQ และ PMS5003 ใช้กระแสรวม 500–800 mA
* **3.3V Regulator:** ใช้ชิป **AMS1117-3.3** แปลงจาก 5V Rail เลี้ยงเซนเซอร์ 3.3V (CCS811, DHT22) พร้อมตัวเก็บประจุฟิลเตอร์

---

## 5. ข้อกำหนดด้านความปลอดภัยและข้อจำกัดทางเทคนิค

| ข้อจำกัด | ผลกระทบ | วิธีจัดการในระบบ |
|---|---|---|
| **ESP32 ADC2 ชน WiFi** | อ่านค่าเพี้ยนเมื่อเปิด WiFi | ใช้เฉพาะพินบน **ADC1** (GPIO 33, 34, 36, 39) เท่านั้น |
| **เซนเซอร์แกว่งตาม T & RH** | ค่า Gas เปลี่ยนตามความชื้น/อุณหภูมิ | นำค่า Temp/RH จาก DHT22 ป้อนเข้า CCS811 (`setEnvironmentalData`) และใส่เป็น Features ใน ML |
| **CCS811 I2C Lockup** | บอร์ดหาเซนเซอร์ไม่เจอ | ต่อขา **WAKE ลง GND** ถาวร และใส่ Pull-up 4.7kΩ ที่สาย I2C |
| **Cross-sensitivity ของ MQ** | ตอบสนองต่อก๊าซทับซ้อนกัน | ใช้ Machine Learning จำแนก Pattern ของทั้ง 8 เซนเซอร์ร่วมกัน |
| **Warm-up Period** | ค่าช่วงเปิดเครื่องไม่เสถียร | มีซอฟต์แวร์รอ Warm-up เริ่มต้น 30 วินาที และแนะนำ Burn-in 24–48 ชม. ก่อนใช้งานจริง |

---

## 6. สถาปัตยกรรม AI และการประมวลผล (Machine Learning)

### สถาปัตยกรรม 3 ชั้น (3-Layer Hybrid Detection)
1. **Layer 1: Hard Threshold Cutoff (ความปลอดภัยขั้นแรก)**
   * ตรวจสอบเกณฑ์วิกฤตทันทีใน Backend / Firmware ก่อนเข้าโมเดล
   * PM2.5 > 75 µg/m³ หรือ TVOC > 400 ppb → สร้างสถานะ **Critical Alert**
2. **Layer 2: Server-side ML Classifier (FastAPI)**
   * **อัลกอริทึม:** Random Forest Classifier (Scikit-Learn Pipeline ร่วมกับ `StandardScaler`)
   * **Features ที่ใช้:** ค่าจากการอ่านเซนเซอร์ทั้งหมด (`temp`, `rh`, `pm25`, `tvoc`, `eco2`, `mq2`, `mq3`, `mq8`, `mq135`, `mics_co`, `no2`, `nh3`)
   * **Output:** ผลการจำแนกชนิดสาร (เช่น AMBIENT, THINNER, ALCOHOL, SMOKE ฯลฯ) พร้อมค่า Probability / Confidence Score
3. **Layer 3: Risk Evaluation & Confidence Filter**
   * หากค่า Confidence < 70% → แสดงผลแจ้งเตือนว่าสถานะ "ไม่แน่นอน"
   * หากผลการทำนายตรงกับกลุ่มสารอันตราย (`DANGEROUS_LABELS`) → สร้างแจ้งเตือนระดับ High/Critical ไปยังหน้าเว็บทันที

---

## 7. โครงสร้างโฟลเดอร์ของโปรเจกต์ (Project Structure)

```
vocs/
├── firmware/
│   └── voc_esp32/
│       └── voc_esp32.ino        # โค้ด ESP32 (Circuit v2: อ่าน 8 เซนเซอร์ + ส่ง Ingest API)
├── backend/
│   ├── main.py                  # FastAPI Application (API, Auto-alert, Ingest, Session)
│   ├── model_loader.py          # ตัวโหลดและรันโมเดล AI (.pkl)
│   ├── db.py                    # จัดการ Connection Pool (PostgreSQL / asyncpg)
│   ├── init.sql                 # โครงสร้างตารางฐานข้อมูล
│   └── requirements.txt         # Dependencies ฝั่งเซิร์ฟเวอร์
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, DataCollection, Devices, Alerts, Settings
│   │   ├── components/          # Reusable UI components
│   │   └── App.jsx
│   └── package.json             # React + Vite Project
├── ml/
│   ├── train_model.py           # สคริปต์เทรนโมเดล Random Forest จากข้อมูล CSV
│   └── requirements.txt         # Dependencies สำหรับเทรนโมเดล
├── docker-compose.yml           # คอนเทนเนอร์ PostgreSQL + Backend
├── easyeda_v2_update_guide.md   # คู่มือการวาดวงจร Schematic ตาม Circuit v2
└── PROJECT_INFO.md              # เอกสารสรุปข้อกำหนดโปรเจกต์ฉบับนี้
```

---

## 8. ขั้นตอนการทำงานและ Roadmap

### ✅ งานที่เสร็จสมบูรณ์แล้ว:
* ออกแบบและแมปพินวงจรตาม Circuit Design v2
* พัฒนา Firmware ESP32 อ่านเซนเซอร์ครบทั้ง 8 ตัว และส่งข้อมูลผ่าน HTTP POST
* สร้างระบบ Backend (FastAPI) พร้อม Ingest API, Token Bucket Rate Limiting, และ Data Purge
* สร้างระบบฐานข้อมูล PostgreSQL จัดเก็บค่า Readings, Sessions, Devices, และ Alerts
* สร้างหน้าเว็บ Dashboard แสดงผล Real-time, กราฟย้อนหลัง, และหน้าเก็บข้อมูลติด Label (Data Collection)

### 🚀 ขั้นตอนการดำเนินงานปัจจุบัน (Current Focus):
1. **เก็บชุดข้อมูลจริง (Data Collection):** ใช้หน้าเว็บ `/data-collection` เริ่ม Session วางสารตัวอย่าง (เช่น Clean Air, ทินเนอร์, แอลกอฮอล์, ควัน) เก็บ Session ละ 200+ จุด
2. **Export Dataset & Train Model:** ส่งออก CSV ผ่าน API แล้วรัน `python ml/train_model.py`
3. **Deploy Model to Backend:** นำไฟล์ `voc_model.pkl` วางในโฟลเดอร์ `backend/` เพื่อให้ระบบใช้งานโมเดลจริงแทน Mock Mode
4. **Calibrate & Refine:** เพิ่มการคำนวณ $R_s/R_o$ (Relative Baseline) ในขั้นตอน Preprocessing เพื่อชดเชยการ Drift ของเซนเซอร์ในระยะยาว
