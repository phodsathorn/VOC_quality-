# 📚 สรุปงานวิจัย IEEE: เซ็นเซอร์วัด VOC & Air Quality และแนวทางสู่ Product จริง

เอกสารนี้รวบรวม:
1. งานวิจัยจาก IEEE/MDPI/NIH ที่เกี่ยวกับการวัดคุณภาพอากาศและ VOC
2. เซ็นเซอร์ที่นิยมใช้ในงานวิจัย
3. แนวทางการปรับโปรเจกต์ให้เป็น Product จริงสำหรับห้องพ่นสีฝุ่น
4. ระบบให้ผู้ใช้ (ช่างหน้างาน) สามารถเก็บค่า/Label ข้อมูลได้เอง

---

## 1. 🔬 สรุปงานวิจัยที่เกี่ยวข้อง

### 1.1 กลุ่มที่ 1: E-Nose & Gas Classification ด้วย ML

| หัวข้อวิจัย | เซ็นเซอร์ที่ใช้ | เทคนิค ML | ความแม่นยำ | แหล่ง |
|---|---|---|---|---|
| VOC Classification ด้วย Gated Transformer Network | MOX Sensor Array (4-8 ตัว) | GTN (Gated Transformer) | ~99% classification | ResearchGate / IEEE 2024 |
| E-Nose Gas Identification บน TinyML | MOX Array + ESP32 / ARM Cortex-M | CNN, LSTM, ANN | 85-95% | IEEE MEMS 2023, MDPI 2024 |
| Sensor Array Optimization ด้วย Feature Selection | MOX Array หลายชนิด | RFECV, Random Forest Feature Selector | ลดจำนวนเซ็นเซอร์ 30-50% โดยไม่ลดความแม่นยำ | MDPI Sensors 2024 |
| TinyML Leakage Detection (Gas Leak) | MOX Array (MQ Series + BME688) | ANN on MCU | F1-score: 0.70-0.77 | Technologies / MDPI 2023-2024 |
| Monolithic Micro-LED Gas Sensor | Micro-LED + MOX | CNN | แยก 4 ชนิดแก๊สได้แม่นยำ | IEEE MEMS 2023 (KAIST) |
| Data Augmentation สำหรับ E-Nose | MOX Array | SMOTE + SVM + PCA + Butterworth Filter | เพิ่มความแม่นยำจาก 80% → 95%+ | NIH / IEEE 2024 |

> **📌 Key Finding:** งานวิจัยส่วนใหญ่ใช้ **MOX Sensor Array 4-8 ตัว** ร่วมกับ **ML** ไม่ได้ใช้เซ็นเซอร์ตัวเดียว

---

### 1.2 กลุ่มที่ 2: Low-Cost Air Quality Monitoring (IoT)

| หัวข้อวิจัย | เซ็นเซอร์ที่ใช้ | Platform | จุดเด่น | แหล่ง |
|---|---|---|---|---|
| Low-cost IAQ Multi-Sensor Node | PMS5003 + BME680 + SGP30 | ESP32 + MQTT | ราคาถูก, วัดได้หลายพารามิเตอร์ | MDPI / IEEE 2023 |
| Comparison: PMS5003 vs Reference Instrument | PMS5003 (Plantower) | — | PMS5003 อ่านค่าได้ดีแต่ไวต่อความชื้น | NIH / Myu-group 2024 |
| BME688 AI-Driven Gas Scanning | BME688 (Bosch) | ESP32 + Bosch AI Studio | Train เฉพาะสารได้ (เช่น Sulfur compounds) | Bosch Sensortec 2024 |
| SGP30 vs BME688 Response Profile | SGP30, BME688 | — | SGP เหมาะ trend monitoring, BME เหมาะ specific gas | NIH 2023 |
| PCB Design สำหรับ Sensor Node | Multiple sensors | Custom PCB | Thermal isolation สำคัญมาก | AllPCB / IEEE 2024 |

> **📌 Key Finding:** เซ็นเซอร์ที่นิยมที่สุดในงานวิจัย Low-cost IAQ คือ **PMS5003 + BME680/688 + SGP30/41**

---

### 1.3 กลุ่มที่ 3: Adaptive E-Nose & Drift Compensation

| หัวข้อวิจัย | เทคนิค | ผลลัพธ์ | แหล่ง |
|---|---|---|---|
| Active Learning สำหรับ E-Nose Drift Compensation | AL-ACR (Adaptive Confidence Rule) | ลดจำนวน Label ที่ต้องทำ 60-80% | NIH / MDPI 2024 |
| Transfer Learning สำหรับ E-Nose ข้ามสภาพแวดล้อม | Scentformer (Train เฉพาะ FC layers) | Adapt สภาพแวดล้อมใหม่ด้วย Data เพียง 10-20% | ACS 2024 |
| Knowledge Distillation สำหรับ Drift Compensation | Teacher-Student Model | ประสิทธิภาพดีกว่า Standard Methods | arXiv 2024 |
| Online Learning สำหรับ Sensor Drift | ELBA (Ensemble + Self-Labeling) | ปรับตัวกับ Short-term Drift โดยไม่ต้อง Label | Frontiers / IEEE 2023 |
| Federated Learning สำหรับ IAQ Network | FL (กระจายข้ามอุปกรณ์) | ปรับปรุงความแม่นยำ +15% ใน 6 เดือน | IEEE / Colab 2024 |
| OTA Model Update สำหรับ Edge Device | Edge-assisted OTA framework | อัพเดทโมเดลแบบไม่ต้องเปลี่ยน Hardware | SBC / IEEE 2024 |

> **📌 Key Finding:** แนวทาง **Adaptive / Retrain + OTA** ที่โปรเจกต์เราออกแบบไว้ **ตรงกับเทรนด์วิจัยปัจจุบันอย่างมาก!**
> โดยเฉพาะเทคนิค Active Learning ที่ **ช่วยลดจำนวน Label** ที่ช่างต้องทำ เป็นหัวข้อที่ได้รับความสนใจมาก

---

### 1.4 กลุ่มที่ 4: Industrial Air Quality & Powder Coating

| หัวข้อวิจัย | สิ่งที่พบ | แหล่ง |
|---|---|---|
| Occupational Exposure in Powder Coating | ระดับฝุ่นสูงมากเวลาทำความสะอาด/บำรุงรักษา ไม่ใช่ขณะพ่น | NIH Occupational Health 2023 |
| IoT-based Industrial AQ Monitoring | ใช้ ESP32 + PMS7003 + MQ Sensors + MQTT | MDPI / IEEE 2023 |
| Predictive Analytics สำหรับ Industrial AQ | Random Forest, LSTM, Gaussian Process Regression | MDPI / IEEE 2024 |
| Automated Ventilation Control | Sensor → AI → สั่งพัดลม/ระบายอากาศอัตโนมัติ | NIH / IEEE 2024 |

> **📌 Key Finding สำหรับ Powder Coating:**
> - ห้องพ่นสีฝุ่น **ปล่อย VOC ต่ำมาก** (ไม่มีทินเนอร์) → สิ่งที่ต้องวัดหลักคือ **ฝุ่นสี (PM)** และ **แก๊สที่เกิดจากการอบ (Curing)**
> - ช่วงที่อันตรายที่สุดคือ **ตอนทำความสะอาด/บำรุงรักษาบูธ** ไม่ใช่ตอนพ่นปกติ
> - ระบบ IoT ที่ดีควร **สั่งระบายอากาศอัตโนมัติ** เมื่อตรวจพบมลพิษสูง

---

## 2. 📊 สรุป: เซ็นเซอร์ที่นิยมใช้ในงานวิจัย

### 2.1 จัดอันดับเซ็นเซอร์ตามความถี่ที่ปรากฏในงานวิจัย

```
🏆 เซ็นเซอร์ที่ปรากฏในงานวิจัย IEEE / MDPI มากที่สุด (2022-2025):

━━━ ฝุ่น (PM) ━━━
 1. Plantower PMS5003 / PMS7003        ████████████ นิยมที่สุดในงานวิจัย Low-cost
 2. Sensirion SPS30                    ████████     นิยมในงาน High-accuracy
 3. Honeywell HPM Series               ████         ใช้ในงาน Reference-grade

━━━ CO2 ━━━
 1. SenseAir S8 (NDIR)                 ████████████ มาตรฐาน
 2. Sensirion SCD41 / SCD30 (NDIR)     ████████     ขนาดเล็ก, I2C
 3. Telaire T6703 (NDIR)               ████         ใช้ใน Awair

━━━ VOC / Gas ━━━
 1. MOX Sensor Array (custom)          ████████████ E-Nose research (หลายตัวรวมกัน)
 2. BME680 / BME688 (Bosch)            ████████████ 4-in-1, AI-trainable
 3. Sensirion SGP30 / SGP41            ████████     VOC + NOx Index
 4. MQ Series (MQ-2/3/135/8)           ████████     Low-cost, ใช้เยอะใน Developing countries
 5. MiCS-6814                          ████         Multi-channel MOX
 6. ScioSense ENS160 / CCS811          ████         Integrated IAQ

━━━ อุณหภูมิ / ความชื้น ━━━
 1. Sensirion SHT3x / SHT4x           ████████████ มาตรฐานงานวิจัย
 2. DHT22 / AM2302                     ████████     Low-cost, ใช้เยอะ
 3. BME280                             ████████     T + H + Pressure
```

### 2.2 สรุปเป็นตาราง

| ระดับ | เซ็นเซอร์ | ใช้ในงานวิจัย | ใช้ใน Product จริง | ราคา |
|---|---|:---:|:---:|---|
| **Premium** | SEN55, SCD41, SPS30, SGP41 | ✅ เยอะ | ✅ เยอะ | สูง |
| **Standard** | BME680/688, SGP30, PMS5003, SenseAir S8 | ✅ เยอะมาก | ✅ เยอะ | กลาง |
| **Budget/Research** | MQ Series, MiCS-6814, CCS811, DHT22 | ✅ เยอะ (Low-cost research) | ❌ ไม่มีใน Product | ต่ำ |

> **📌 ข้อสังเกตสำคัญ:** เซ็นเซอร์ MQ ยังถูกใช้ **เยอะมากในงานวิจัย** (โดยเฉพาะจากประเทศกำลังพัฒนา) แต่ **ไม่มีผลิตภัณฑ์เชิงพาณิชย์ตัวไหนใช้เลย** เพราะข้อจำกัดด้านความแม่นยำ, อายุการใช้งาน, และพลังงาน
>
> **สำหรับโปรเจกต์จบ/วิจัย:** การใช้ MQ Series ใน E-Nose Array ยังคง **ถูกยอมรับ** ในแวดวงวิชาการ เพราะเน้นที่ **วิธีการ (Methodology)** คือ ML Pipeline ไม่ได้เน้นที่ตัวเซ็นเซอร์เอง

---

## 3. 🏭 แนวทางการทำเป็น Product จริง สำหรับห้องพ่นสีฝุ่น

### 3.1 สิ่งที่ต้องวัดจริงๆ ในห้องพ่นสีฝุ่น

จากงานวิจัย NIH ด้าน Occupational Health พบว่า:

```
ห้องพ่นสีฝุ่น (Powder Coating Booth):

  ขณะพ่นปกติ:
  ├── 🔴 ฝุ่นสี (PM2.5, PM10)          ← อันตรายสูงสุด (ฝุ่นระเบิดได้!)
  ├── 🟡 อุณหภูมิสูง (จากเตาอบ Curing)  ← ส่งผลต่อคุณภาพงาน
  ├── 🟡 ความชื้น                       ← ส่งผลต่อการยึดเกาะสี
  └── 🟢 VOC ต่ำมาก                     ← Powder ไม่มีทินเนอร์

  ขณะบำรุงรักษา/ทำความสะอาด:
  ├── 🔴🔴 ฝุ่นสี (PM) พุ่งสูงมาก!      ← อันตรายที่สุด
  ├── 🔴 VOC จากน้ำยาทำความสะอาด       ← มีทินเนอร์/สารเคมี
  └── 🟡 แก๊สจากการเผาไหม้สีตกค้าง     ← CO, VOC จากเตาอบ

  รอบๆ โรงงาน (สิ่งแวดล้อม):
  ├── 🟡 CO2 (ระบายอากาศ)
  ├── 🟡 VOC รวม (TVOC)
  └── 🟢 NO2 (ไอเสียรถ)
```

### 3.2 เซ็นเซอร์ที่แนะนำสำหรับ Product จริง

#### ตัวเลือกที่ 1: "Smart Budget" — ประหยัดแต่ครบ (~2,500 บาท)

| เซ็นเซอร์ | วัดอะไร | เทคโนโลยี | ราคา | I/F |
|---|---|---|---|---|
| **PMS5003** | PM1.0 / PM2.5 / PM10 | Laser Scattering | ~350 ฿ | UART |
| **SGP41** | VOC Index + NOx Index | Digital MOX | ~350 ฿ | I2C |
| **SenseAir S8** | CO2 (0-10,000 ppm) | NDIR | ~800 ฿ | UART |
| **SHT40** | อุณหภูมิ + ความชื้น | Digital | ~200 ฿ | I2C |
| **MiCS-6814** | CO / NO2 / NH3 (3 ch) | Analog MOX | ~300 ฿ | ADC |
| ESP32-S3 | MCU + WiFi + BLE | — | ~250 ฿ | — |

**จุดเด่น:** ตรงกับเซ็นเซอร์ที่ใช้ใน AirGradient ONE (ยกเว้น MiCS-6814 ที่เพิ่มมาเพื่อ E-Nose), ข้อมูลวิจัยรองรับเยอะ

#### ตัวเลือกที่ 2: "All-in-One Premium" — กะทัดรัดที่สุด (~3,500 บาท)

| เซ็นเซอร์ | วัดอะไร | เทคโนโลยี | ราคา | I/F |
|---|---|---|---|---|
| **SEN55** | PM + VOC + NOx + T + H (5-in-1) | All-in-one Sensirion | ~1,500 ฿ | I2C |
| **SCD41** | CO2 (0-5,000 ppm) | Miniature NDIR | ~1,000 ฿ | I2C |
| **MiCS-6814** | CO / NO2 / NH3 (3 ch) | Analog MOX | ~300 ฿ | ADC |
| ESP32-S3 | MCU + WiFi + BLE | — | ~250 ฿ | — |

**จุดเด่น:** จำนวนชิ้นน้อยที่สุด, สายไฟน้อย, เหมาะกับการทำ Product ขนาดเล็ก, SEN55 มี HEPA filter ภายใน (อายุยาว)

#### ตัวเลือกที่ 3: "Research E-Nose" — เน้นจำแนกสาร (สำหรับ Phase 1)

| เซ็นเซอร์ | วัดอะไร | เทคโนโลยี | ราคา | I/F |
|---|---|---|---|---|
| **MiCS-6814** | CO / NO2 / NH3 (3 ch) | Analog MOX | ~300 ฿ | ADC |
| **MQ-135** | Broad-spectrum VOC | Analog MOX | ~100 ฿ | ADC |
| **CCS811** | eCO2 / TVOC | Digital MOX | ~200 ฿ | I2C |
| **PMS5003** | PM1.0 / PM2.5 / PM10 | Laser | ~350 ฿ | UART |
| **DHT22** | อุณหภูมิ + ความชื้น | Digital | ~100 ฿ | GPIO |
| ESP32-WROOM-32U | MCU + WiFi | — | ~200 ฿ | — |

**จุดเด่น:** ใช้อุปกรณ์ที่มีอยู่แล้ว, แสดง ML Pipeline ด้วยตัวเอง, เหมาะกับโปรเจกต์จบ

---

## 4. 🛤️ Roadmap: จาก Phase 1 (วิจัย) สู่ Product จริง

```
Phase 1: Experimental (ปัจจุบัน)                    Phase 2: Pre-Production
━━━━━━━━━━━━━━━━━━━━━━━━━                    ━━━━━━━━━━━━━━━━━━━━━━━━
┌──────────────────────────┐                   ┌──────────────────────────┐
│ E-Nose Array (MQ + MiCS) │                   │ Digital Sensors           │
│ + CCS811 + DHT22         │                   │ (SGP41 + SEN55 + MiCS)   │
│ + PMS5003                │                   │ + SCD41                  │
│                          │                   │                          │
│ ESP32-WROOM-32U          │ ─── Upgrade ───→  │ ESP32-S3                 │
│                          │                   │ (PSRAM + OTA + BLE 5)    │
│ Breadboard Prototype     │                   │                          │
│                          │                   │ Custom PCB               │
│ ML: TFLite Micro         │                   │                          │
│ Web: Data Collection     │                   │ ML: TFLite + Active      │
│ OTA: Model Update        │                   │     Learning             │
└──────────────────────────┘                   │ Web: Dashboard +         │
                                               │      Auto-Labeling       │
                                               │ OTA: Model + Firmware    │
                                               └──────────────────────────┘
                                                           │
                                                           │ Field Test
                                                           ▼
                                               ┌──────────────────────────┐
                                               │ Phase 3: Production      │
                                               │━━━━━━━━━━━━━━━━━━━━━━━━━│
                                               │ 3D Printed / Injection   │
                                               │ Molded Enclosure         │
                                               │                          │
                                               │ IP65 Rated Housing       │
                                               │ (กันฝุ่น/น้ำ)              │
                                               │                          │
                                               │ + PID Sensor (Optional)  │
                                               │   สำหรับ ppm accuracy    │
                                               │                          │
                                               │ Certified & Calibrated   │
                                               └──────────────────────────┘
```

### 4.1 สิ่งที่ต้องปรับเปลี่ยนเมื่อไปสู่ Product

| ด้าน | Phase 1 (วิจัย) | Product จริง | เหตุผล |
|---|---|---|---|
| **เซ็นเซอร์ VOC** | MQ-135 + CCS811 | SGP41 | กินไฟน้อย, เสถียร, ไม่ต้อง Burn-in |
| **เซ็นเซอร์ PM** | PMS5003 | PMS5003 หรือ SPS30 | PMS5003 ยังใช้ได้ดี, SPS30 อายุยาวกว่า |
| **เซ็นเซอร์ T/H** | DHT22 | SHT40 | แม่นยำกว่า, เร็วกว่า, ขนาดเล็ก |
| **เซ็นเซอร์ CO2** | (ไม่มี) | SenseAir S8 หรือ SCD41 | จำเป็นสำหรับ Ventilation control |
| **MCU** | ESP32-WROOM-32U | ESP32-S3 | PSRAM มากขึ้น, BLE 5.0, USB OTG |
| **วงจร** | Breadboard | Custom PCB | Thermal isolation, ลด Noise |
| **กล่อง** | 3D Print ต้นแบบ | IP65 Enclosure | ทนฝุ่น, ทนสภาพโรงงาน |
| **Calibration** | Rs/Ro + Baseline | Co-location กับ Reference | ได้ค่า ppm ที่เชื่อถือได้ |
| **Drift Compensation** | Retrain ทั้งโมเดล | Transfer Learning / Active Learning | ลดงาน Label, ปรับตัวเร็ว |

---

## 5. 👷 ระบบให้ผู้ใช้เก็บค่าเองได้ (User Data Collection & Labeling)

### 5.1 ทำไมต้องให้ผู้ใช้เก็บค่าเอง?

จากงานวิจัย IEEE / NIH เกี่ยวกับ "Occupant-Centric Monitoring" และ "Active Learning":

```
ปัญหาของ E-Nose ทั่วไป:
━━━━━━━━━━━━━━━━━━━━━━━━
1. ❌ เทรนในห้องแลป → ติดตั้งโรงงาน → ค่าเพี้ยน (Environment Mismatch)
2. ❌ เซ็นเซอร์ Drift ตามเวลา → โมเดลเก่าใช้ไม่ได้
3. ❌ ทินเนอร์/สีแต่ละโรงงานสูตรต่างกัน → โมเดลเดียวใช้ทุกที่ไม่ได้

วิธีแก้: ให้ผู้ใช้หน้างาน Label ข้อมูล + Retrain
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ✅ โมเดลปรับตัวตามสภาพแวดล้อมจริง
2. ✅ ชดเชย Sensor Drift ได้
3. ✅ รองรับสูตรสี/ทินเนอร์ที่หลากหลาย
4. ✅ ลดค่าใช้จ่ายในการส่งผู้เชี่ยวชาญไปสอบเทียบ
```

### 5.2 สถาปัตยกรรมระบบเก็บค่า (Data Collection Architecture)

```
                         ┌─────────────────────────────────────────┐
                         │          📱 Web Platform                │
                         │     (เพื่อน / ทีมเว็บดูแล)              │
                         │                                         │
                         │  ┌───────────────────────────────────┐  │
                         │  │  📊 Dashboard                     │  │
                         │  │  - กราฟ Real-time (PM, VOC, T, H) │  │
                         │  │  - สถานะเซ็นเซอร์                 │  │
                         │  │  - แจ้งเตือนอัตโนมัติ              │  │
                         │  └───────────────────────────────────┘  │
                         │                                         │
                         │  ┌───────────────────────────────────┐  │
                         │  │  🏷️ Data Labeling Interface       │  │
                         │  │  (หน้าจอที่ช่างใช้)                │  │
                         │  │                                   │  │
                         │  │  ┌─ กดปุ่ม Label ง่ายๆ ──────┐   │  │
                         │  │  │ [🟢 อากาศปกติ]            │   │  │
                         │  │  │ [🟡 มีกลิ่นเล็กน้อย]      │   │  │
                         │  │  │ [🔴 มีควัน/ฝุ่นเยอะ]      │   │  │
                         │  │  │ [🟣 กำลังพ่นสี]           │   │  │
                         │  │  │ [⚫ กำลังทำความสะอาด]     │   │  │
                         │  │  │ [📝 อื่นๆ: ___________]   │   │  │
                         │  │  └───────────────────────────┘   │  │
                         │  └───────────────────────────────────┘  │
                         │                                         │
                         │  ┌───────────────────────────────────┐  │
                         │  │  🧠 ML Training Pipeline          │  │
                         │  │  - Auto-Train เมื่อข้อมูลครบ      │  │
                         │  │  - แสดง Accuracy ก่อน Deploy      │  │
                         │  │  - ส่ง .tflite ผ่าน OTA           │  │
                         │  └───────────────────────────────────┘  │
                         └──────────────┬──────────────────────────┘
                                        │ MQTT / HTTP
                                        │
                         ┌──────────────┴──────────────────────────┐
                         │          📦 E-Nose Box (ESP32)          │
                         │                                         │
                         │  Sensor Array → Raw Data → ML Inference │
                         │                    │           │        │
                         │                    ▼           ▼        │
                         │              ส่งขึ้น Web   แสดงผลทันที   │
                         │              (ทุก 10 วิ)   (LED / Buzzer)│
                         │                                         │
                         │  OTA Receive → โหลดโมเดลใหม่ลง Flash    │
                         └─────────────────────────────────────────┘
```

### 5.3 การออกแบบ UI สำหรับช่างหน้างาน (ง่ายที่สุด)

จากหลักการ "User-Centric" ในงานวิจัย:

#### หลักการออกแบบ:
1. **กดปุ่มเดียว** — ช่างไม่ต้องพิมพ์อะไร
2. **ภาษาไทย** — ไม่ใช้ศัพท์เทคนิค
3. **ปุ่มใหญ่** — ใช้ได้แม้สวมถุงมือ
4. **สีบอกสถานะ** — เขียว/เหลือง/แดง

#### ตัวอย่าง Flow การเก็บข้อมูล:

```
ช่างหน้างาน:
━━━━━━━━━━━

📱 เปิดหน้าเว็บ (หรือแอป) บนมือถือ
   │
   ├── เห็น Dashboard แสดงค่า Real-time
   │   PM2.5: 45 µg/m³ 🟡
   │   VOC:   ปานกลาง  🟡
   │   อุณหภูมิ: 38°C
   │
   ├── 🔔 ระบบแจ้งเตือน: "กรุณาบอกสถานะปัจจุบัน"
   │   (ถามทุก 30 นาที หรือเมื่อค่าเปลี่ยนผิดปกติ)
   │
   ├── ช่างกดปุ่ม: [🟣 กำลังพ่นสี]
   │
   ├── ระบบบันทึก:
   │   {
   │     "timestamp": "2026-09-22T10:30:00",
   │     "label": "spraying",
   │     "sensor_data": {
   │       "mics_red": 2.45,
   │       "mics_ox": 0.87,
   │       "mics_nh3": 1.23,
   │       "mq135": 3.21,
   │       "ccs811_tvoc": 450,
   │       "pm25": 45,
   │       "temp": 38.2,
   │       "humidity": 55
   │     }
   │   }
   │
   └── เมื่อข้อมูลครบ ~500 records → ระบบ Auto-Train
       → แจ้งผู้ดูแล → Deploy โมเดลใหม่ผ่าน OTA
```

### 5.4 เทคนิค Active Learning — ลดภาระการ Label

จากงานวิจัย IEEE เรื่อง Active Learning สำหรับ E-Nose:

```
แบบเดิม (Passive Learning):
━━━━━━━━━━━━━━━━━━━━━━━━
ช่างต้อง Label ทุก Record → 1,000 records → ช่างกด 1,000 ครั้ง 😫

แบบใหม่ (Active Learning):
━━━━━━━━━━━━━━━━━━━━━━━━
ระบบเลือก "เฉพาะจุดที่ไม่แน่ใจ" ให้ช่าง Label
→ 1,000 records → ช่างกดแค่ 200-400 ครั้ง 😊

วิธีการ:
1. โมเดลอ่านค่าเซ็นเซอร์
2. ถ้ามั่นใจ (confidence > 90%) → ใช้ค่าที่ทาย → ไม่ต้องถามช่าง
3. ถ้าไม่มั่นใจ (confidence < 70%) → ถามช่าง: "ตอนนี้เป็นอะไร?"
4. เอาคำตอบของช่างไป Retrain โมเดล → ถามน้อยลงเรื่อยๆ
```

### 5.5 Data Format ที่แนะนำสำหรับการเก็บข้อมูล

```json
{
  "device_id": "ENOSE-001",
  "factory_id": "FACTORY-BANGNA",
  "firmware_version": "1.2.0",
  "model_version": "model_v3.tflite",
  "timestamp": "2026-09-22T10:30:00+07:00",
  
  "environment": {
    "temperature": 38.2,
    "humidity": 55.0,
    "pressure": 1013.25
  },
  
  "sensors_raw": {
    "mics_red_rs_ro": 2.45,
    "mics_ox_rs_ro": 0.87,
    "mics_nh3_rs_ro": 1.23,
    "mq135_rs_ro": 3.21,
    "ccs811_tvoc": 450,
    "ccs811_eco2": 620,
    "pm1_0": 22,
    "pm2_5": 45,
    "pm10": 68
  },
  
  "ml_inference": {
    "prediction": "spraying",
    "confidence": 0.85,
    "risk_level": "medium"
  },
  
  "label": {
    "source": "user",
    "value": "spraying",
    "labeled_at": "2026-09-22T10:31:15+07:00"
  }
}
```

---

## 6. 📖 รายการงานวิจัย IEEE / วารสารที่เกี่ยวข้อง

### 6.1 E-Nose & Gas Classification

| # | ชื่อเปเปอร์ (สรุป) | วารสาร / Conference | ปี | Keywords |
|---|---|---|---|---|
| 1 | VOC Classification using Gated Transformer Network on E-Nose | IEEE / ResearchGate | 2024 | GTN, E-Nose, 99% accuracy |
| 2 | TinyML-based Gas Leakage Detection with MOX Arrays | MDPI Technologies | 2023 | TinyML, ESP32, MOX, F1=0.77 |
| 3 | Monolithic Micro-LED E-Nose with CNN | IEEE MEMS (KAIST) | 2023 | Micro-LED, CNN, 4 gas species |
| 4 | Data Augmentation for E-Nose: SMOTE + PCA + SVM | NIH / IEEE | 2024 | SMOTE, PCA, Butterworth, SVM |
| 5 | Sensor Array Optimization via RFECV | MDPI Sensors | 2024 | Feature elimination, cost reduction |
| 6 | LSTM-Transformer Hybrid for Gas Mixtures | IEEE / MTU | 2024 | LSTM, Transformer, temporal data |

### 6.2 Adaptive E-Nose & Drift Compensation

| # | ชื่อเปเปอร์ (สรุป) | วารสาร / Conference | ปี | Keywords |
|---|---|---|---|---|
| 7 | Active Learning for E-Nose Drift (AL-ACR) | NIH / MDPI | 2024 | Active Learning, Drift, 60-80% less labels |
| 8 | Scentformer: Transfer Learning for E-Nose | ACS (American Chemical Society) | 2024 | Transfer Learning, fine-tune FC layers |
| 9 | Knowledge Distillation for Sensor Drift | arXiv / IEEE | 2024 | Teacher-Student, Drift compensation |
| 10 | ELBA: Ensemble Self-Labeling for E-Nose | Frontiers / IEEE | 2023 | Ensemble, Self-labeling, Short-term drift |
| 11 | Federated Learning สำหรับ IAQ Network | IEEE / Colab | 2024 | Federated Learning, Privacy, +15% accuracy |

### 6.3 IoT Industrial Air Quality

| # | ชื่อเปเปอร์ (สรุป) | วารสาร / Conference | ปี | Keywords |
|---|---|---|---|---|
| 12 | Occupational Exposure in Electrostatic Powder Coating | NIH Occupational Health | 2023 | PM spike during maintenance |
| 13 | IoT-based Industrial AQ with ESP32 + ML | MDPI / IEEE | 2023 | ESP32, PMS7003, MQTT, ML |
| 14 | Edge AI for Air Quality Monitoring | IEEE / ResearchGate | 2024 | Edge computing, 75% latency reduction |
| 15 | OTA Framework for Heterogeneous Edge Devices | SBC / IEEE | 2024 | OTA, Edge, Model update lifecycle |
| 16 | User-Centric Indoor AQ Monitoring | NIH / IEEE | 2024 | Occupant feedback, participatory sensing |

---

## 7. ✅ สรุปและข้อเสนอแนะ

### 7.1 สิ่งที่โปรเจกต์เราทำ **ตรงกับแนวทางวิจัยปัจจุบัน**

| สิ่งที่เราทำ | งานวิจัยรองรับ? | หมายเหตุ |
|---|:---:|---|
| ✅ E-Nose Array (หลายเซ็นเซอร์ + ML) | ✅ | เป็นแนวทางมาตรฐานในงานวิจัย IEEE |
| ✅ TinyML บน ESP32 | ✅ | มีงานวิจัย TinyML + E-Nose จำนวนมาก |
| ✅ OTA Model Update | ✅ | เป็นหัวข้อร้อนแรงในปี 2024 |
| ✅ ผู้ใช้ Label ข้อมูล + Retrain | ✅ | ตรงกับ Active Learning + User-Centric Monitoring |
| ✅ Web Platform สำหรับ Dashboard | ✅ | IoT + MQTT + Cloud เป็นมาตรฐาน |

### 7.2 สิ่งที่ควร **เพิ่มเติม** เพื่อยกระดับเป็น Product

| ลำดับ | สิ่งที่ควรเพิ่ม | ความยากง่าย | ผลกระทบ |
|---|---|---|---|
| 1 | **Active Learning** (ลด Label ที่ช่างต้องทำ) | ปานกลาง | สูงมาก — ช่างจะยอมใช้มากขึ้น |
| 2 | **เพิ่ม NDIR CO2 Sensor** (SenseAir S8 / SCD41) | ง่าย | สูง — ควบคุมระบายอากาศได้ |
| 3 | **อัปเกรดเป็น SGP41** แทน MQ + CCS811 | ง่าย | สูง — ลดขนาด, ลดไฟ, เสถียรขึ้น |
| 4 | **Custom PCB** แทน Breadboard | ปานกลาง | สูง — Noise ลด, ขนาดเล็ก |
| 5 | **Transfer Learning** สำหรับข้ามโรงงาน | ยาก | สูงมาก — Deploy ง่าย |
| 6 | **PID Sensor** สำหรับ ppm accuracy | ง่าย (ฮาร์ดแวร์) | สูง — ได้ค่า ppm จริง (แต่แพง) |
| 7 | **IP65 Enclosure** | ปานกลาง | จำเป็น — โรงงานมีฝุ่นเยอะ |

### 7.3 ข้อเสนอแนะสำหรับเปเปอร์/โปรเจกต์จบ

โปรเจกต์นี้สามารถ **ตีพิมพ์เป็นเปเปอร์ได้** หากเน้นจุดเด่นดังนี้:

1. **"Adaptive E-Nose Platform with OTA Model Update for Industrial Air Quality Monitoring"**
   - จุดขาย: ระบบ E-Nose ที่ Retrain ได้จากข้อมูลหน้างาน + OTA
   - เทียบกับ Static Model → แสดงให้เห็นว่า Adaptive ดีกว่า

2. **"Active Learning-based Data Collection for Low-Cost E-Nose in Powder Coating Environment"**
   - จุดขาย: ลดภาระ Labeling ของช่าง + รองรับ Environment Mismatch
   - ยังไม่ค่อยมีงานที่ทำ Active Learning + E-Nose + Industrial environment

3. **"Comparison of MOX Sensor Arrays vs Digital MOX Sensors for VOC Classification"**
   - จุดขาย: เปรียบเทียบ MQ Array กับ SGP41/BME688 ในงาน E-Nose
   - เป็นประโยชน์ต่อชุมชนวิจัย Low-cost sensing
