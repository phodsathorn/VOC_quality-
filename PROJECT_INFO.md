# 📋 ข้อมูลโปรเจค — ระบบวัดคุณภาพอากาศ Adaptive E-Nose

> **อัพเดทล่าสุด:** 29 กันยายน 2569
> **ผู้พัฒนา:** กล่อง Sensor (คุณ) + Web Platform (เพื่อน)

---

## 1. ชื่อโปรเจค

**ระบบตรวจวัดคุณภาพอากาศห้องพ่นสีฝุ่น ด้วยเซนเซอร์อาร์เรย์และการเรียนรู้ของเครื่อง**
*(E-Nose + Machine Learning + IoT)*

---

## 2. วัตถุประสงค์

1. พัฒนากล่องวัดคุณภาพอากาศที่ใช้ sensor array (E-Nose) ตรวจจับสารเคมีในห้องพ่นสีฝุ่น
2. ใช้ ML Classification จำแนกประเภทมลพิษ (clean / ฝุ่นสี / ทินเนอร์ / ควัน)
3. ส่งข้อมูลขึ้น Web Platform เพื่อแสดง Dashboard + retrain model ได้
4. Deploy ML model (TFLite) บน ESP32 เพื่อ inference แบบ real-time

---

## 3. สถาปัตยกรรมระบบ

```
┌───────────────┐     WiFi/MQTT      ┌─────────────────────┐
│  📦 Sensor Box │ ──────────────────→│  🌐 Web Platform     │
│  (ESP32)       │                    │                       │
│                │ → raw data ────→  │  • Dashboard          │
│  • อ่าน sensor │                    │  • Data labeling UI   │
│  • inference   │                    │  • ML Training        │
│  • แจ้งเตือน   │                    │  • Model management   │
│                │ ←── .tflite ────  │  • OTA model push     │
└───────────────┘                    └─────────────────────┘

Mode 1: เก็บ data (ส่ง raw ขึ้นเว็บ)
Mode 2: inference (ใช้โมเดลที่ฝังอยู่ จำแนกแบบ real-time)
```

---

## 4. Hardware ที่ใช้ (Freeze Spec)

### 4.1 Microcontroller

| รายการ | ข้อมูล |
|---|---|
| **บอร์ด** | ESP32-WROOM-32U |
| **ชิป** | Xtensa Dual-Core 240MHz |
| **RAM** | 520 KB SRAM |
| **Flash** | 4 MB |
| **เสาสัญญาณ** | External Antenna (U.FL connector) |
| **ADC** | ADC1 = 6 ขา (ใช้พร้อม WiFi ได้) / ADC2 = มีข้อจำกัด |
| **WiFi** | 802.11 b/g/n 2.4GHz |

### 4.2 Sensor Array (8 ตัว)

| # | Sensor | วัดอะไร | Interface | GPIO | ไฟ | Warm-up |
|---|---|---|---|---|---|---|
| 1 | **MQ-2** | LPG, Smoke | ADC1 | GPIO 32 | 5V | Burn-in 24-48 ชม. |
| 2 | **MQ-3** | Alcohol, ทินเนอร์ | ADC1 | GPIO 33 | 5V | Burn-in 24-48 ชม. |
| 3 | **MQ-8** | Hydrogen | ADC1 | GPIO 34 | 5V | Burn-in 24-48 ชม. |
| 4 | **MQ-135** | NH3, Benzene, VOC | ADC1 | GPIO 35 | 5V | Burn-in 24-48 ชม. |
| 5 | **MiCS-6814** | CO, NO2, NH3 (3 ch) | ADS1115 I2C | SDA/SCL | 5V | **120 นาที** |
| 6 | **PMS5003** | PM1.0, PM2.5, PM10 | UART2 | GPIO 16/17 | 5V | 30 วินาที |
| 7 | **CCS811** | eCO2, TVOC | I2C | GPIO 21/22 | 3.3V | Burn-in 48 ชม. + 20 นาที |
| 8 | **DHT22** | อุณหภูมิ, ความชื้น | Digital | GPIO 27 | 3.3V | ไม่ต้อง |

### 4.3 อุปกรณ์เสริม

| อุปกรณ์ | หน้าที่ |
|---|---|
| **ADS1115** | 16-bit ADC I2C สำหรับ MiCS-6814 |
| **Relay** | ควบคุมพัดลม |
| **Voltage Divider** | R1=10kΩ, R2=15kΩ → 3.0V (MQ→ESP32 ADC) |

### 4.4 จ่ายไฟ

- USB Adapter **5V 2A+** (แนะนำ)
- MQ×4 + PMS5003 กินไฟรวม ~500-800 mA
- **ห้ามดึงไฟจากขั้ว 5V ของ ESP32 โดยตรง** → จ่ายไฟแยกผ่าน 5V Bus

### 4.5 Pin Mapping

```
I2C:     GPIO 21 (SDA), GPIO 22 (SCL) → CCS811 + ADS1115
UART2:   GPIO 16 (RX2), GPIO 17 (TX2) → PMS5003
Digital: GPIO 27 → DHT22
ADC1:    GPIO 32 → MQ-2
         GPIO 33 → MQ-3
         GPIO 34 → MQ-8
         GPIO 35 → MQ-135
MiCS-6814 → อ่านผ่าน ADS1115 (I2C)
```

---

## 5. ข้อจำกัดทางเทคนิค

| ข้อจำกัด | ผลกระทบ | วิธีรับมือ |
|---|---|---|
| ADC2+WiFi ใช้พร้อมกันไม่ได้ | ขา Analog ไม่พอ | ใช้ ADS1115 |
| ESP32 ADC 12-bit แกว่ง | noise สูง | Moving Average 10-20 samples |
| MQ Cross-sensitivity | ตอบสนองหลายสาร | ML pattern recognition |
| ไม่มี Calibration Gas | ไม่รู้ค่า ppm จริง | Relative Calibration (Rs/Ro) |
| MiCS warm-up 120 นาที | เปิดไว้ 2 ชม. | USB power ตอน warm-up |
| CCS811 burn-in 48 ชม. | เปิดทิ้ง 2 วัน | ทำครั้งเดียว |
| CCS811 WAKE pin ต้องต่อ GND | ไม่งั้น I2C ไม่ตอบ | ต่อลง GND เสมอ |
| DHT22 อ่านได้ทุก 2 วิ | sampling ช้า | delay(2000) |

---

## 6. แนวทาง ML (Hybrid Approach)

### สถาปัตยกรรม 3 ชั้น

```
Layer 1: HARD THRESHOLD (ไม่ต้องรอ ML)
  PM2.5 > 50  → DANGER
  CO > 25 ppm → DANGER

Layer 2: ML CLASSIFICATION
  MLP [20]→[12]→[4] + Dropout + BatchNorm
  TFLite INT8 ~100 KB, inference ทุก 5 วิ
  Output: clean/ฝุ่นสี/ทินเนอร์/ควัน + confidence %

Layer 3: CONFIDENCE FILTER
  < 70% → "ไม่แน่ใจ"
  ≥ 70% → ดำเนินการตาม class
```

### Feature ที่ใช้: Rs/Ro, delta, slope, T, RH, PM2.5
### เป้า accuracy: ~80-90% (realistic)
### Train/Test: Session-based split (ไม่ใช่ random)

---

## 7. Roadmap (3 Phases)

### 🔴 Phase 1: ทำให้ทำงานได้ ← Focus ตอนนี้
1. Firmware อ่าน sensor ทุกตัว (breadboard)
2. ส่งข้อมูลขึ้น Web ผ่าน WiFi
3. Burn-in 48 ชม. + Baseline
4. เก็บ Dataset (clean/smoke/thinner)
5. Train MLP → TFLite → Deploy ESP32
6. Demo จำแนกสารได้
7. Dashboard แสดงผล

### 🟡 Phase 2: ปรับปรุง + Feature เสริม
8. OTA Model Update
9. Retrain ได้จาก Web
10. Guardrails
11. Sensor Health Monitoring
12. LINE OA notification
13. ทดสอบสถานที่จริง

### 🟢 Phase 3: Packaging + Miniaturize
14. ออกแบบกล่อง 3D Print
15. ยุบบอร์ดให้เล็กลง
16. จัดเรียง sensor + ระบบลม
17. Print + ประกอบ + ทดสอบ

---

## 8. โครงสร้างโฟลเดอร์

```
paper_sensor_VOC/
├── PROJECT_INFO.md           ← ไฟล์นี้
├── test_1st_air_quality_box/ ← code หลัก
├── test_dht22_only/          ← ทดสอบ DHT22
├── debug_diagnostic/         ← ตรวจสอบ hardware
├── docs/                     ← เอกสารปัจจุบัน
├── experimental/             ← ทดลอง / QA
├── reference/                ← paper + ข้อมูลอ้างอิง
└── archive/                  ← การออกแบบในอดีต
    ├── old_designs/          ← enclosure, circuit เก่า
    └── old_references/       ← walkthrough, log เก่า
```

---

## 9. Library ที่ต้องใช้

| Library | สำหรับ |
|---|---|
| Adafruit CCS811 | CCS811 |
| DHT sensor library | DHT22 |
| Adafruit Unified Sensor | dependency ของ DHT |
| PMS Library | PMS5003 |
| Adafruit ADS1X15 | ADS1115 |
| TensorFlow Lite Micro | ML Inference |

---

## 10. Paper อ้างอิง

| Paper | หัวข้อ |
|---|---|
| OTA-TinyML (IEEE 2022) | OTA deployment ของ TinyML |
| Domain Adaptation for Gas Sensor Drift | Transfer Learning E-Nose |
| Edge-Cloud IoT Air Quality | สถาปัตยกรรม Edge-Cloud |
| Classification and Concentration Prediction of VOC | VOC Classification |
| Hybrid Gas Sensor Array | Low-Concentration VOCs |
| IoT Based Industrial Air Quality | Industrial monitoring |
| Low Cost Sensor With IoT LoRaWAN | ML-Based Calibration |
