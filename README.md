# 🌬️ ระบบตรวจวัดคุณภาพอากาศห้องพ่นสีฝุ่น Adaptive E-Nose (VOC Quality Monitor)

ระบบตรวจวัดคุณภาพอากาศสำหรับห้องพ่นสีฝุ่นด้วยโครงข่ายเซ็นเซอร์อาร์เรย์ (Adaptive E-Nose Array) ร่วมกับการประมวลผลการเรียนรู้ของเครื่อง (Edge AI / TinyML) บนชิป ESP32-WROOM-32U เพื่อจำแนกประเภทสารมลพิษแบบ Real-time และเชื่อมต่อระบบ IoT

---

## 📑 สารบัญ
1. [ภาพรวมของระบบ](#-ภาพรวมของระบบ)
2. [สถาปัตยกรรมฮาร์ดแวร์และเซ็นเซอร์](#-สถาปัตยกรรมฮาร์ดแวร์และเซ็นเซอร์)
3. [ผังการเชื่อมต่อวงจร (Pin Mapping)](#-ผังการเชื่อมต่อวงจร-pin-mapping)
4. [โครงสร้างของโปรเจกต์](#-โครงสร้างของโปรเจกต์)
5. [คู่มือการใช้งาน Firmware (Arduino)](#-คู่มือการใช้งาน-firmware-arduino)
6. [คู่มือการใช้งาน Real-time Terminal Monitor (Python)](#-คู่มือการใช้งาน-real-time-terminal-monitor-python)
7. [การสอบเทียบเซ็นเซอร์ (Baseline Calibration)](#-การสอบเทียบเซ็นเซอร์-baseline-calibration)
8. [แนวทางการพัฒนา Machine Learning (TinyML Roadmap)](#-แนวทางการพัฒนา-machine-learning-tinyml-roadmap)
9. [งานวิจัยและเอกสารอ้างอิง](#-งานวิจัยและเอกสารอ้างอิง)

---

## 🎯 ภาพรวมของระบบ

ระบบถูกออกแบบมาเพื่อแก้ปัญหาเฉพาะใน **ห้องพ่นสีฝุ่น (Powder Coating Booth)** ซึ่งมีทั้งฝุ่นละอองสี (Particulate Matter), ไอระเหยสารเคมี/ทินเนอร์ (VOCs), และควัน:
- **ตรวจจับแบบ Multi-modal:** ใช้เซ็นเซอร์อาร์เรย์ 8 ชนิด รวม 11 ช่องสัญญาณ
- **Dual I2C Bus:** แยกบัสเชื่อมต่ออิสระ ป้องกันปัญหา I2C Address ชนกันและ Clock Stretching
- **Boot Diagnostic & Smart Warm-up:** ตรวจเช็คความพร้อมของฮาร์ดแวร์ทุกตัว และมีระบบนับเวลาอุ่นเซ็นเซอร์พร้อมคำสั่งข้าม/วอร์มใหม่ผ่าน Serial
- **Edge Inference:** รองรับการฝังโมเดล TensorFlow Lite Micro (TFLite INT8) บน ESP32

---

## 🔌 สถาปัตยกรรมฮาร์ดแวร์และเซ็นเซอร์

### ไมโครคอนโทรลเลอร์
- **ESP32-WROOM-32U** (Xtensa® Dual-core 240MHz, 4MB Flash, ขั้วต่อเสาอากาศภายนอก U.FL Antenna เพื่อการรับส่งสัญญาณในพื้นที่อับ)

### Sensor Array (8 เซ็นเซอร์ / 11 ช่องสัญญาณ)
| # | เซ็นเซอร์ | ตัวแปรที่วัด | ชนิดสัญญาณ | แรงดันไฟ | ระยะเวลา Warm-up |
|:---:|---|---|:---:|:---:|:---:|
| 1 | **MQ-2** | แก๊สติดไฟ, ควัน, LPG | Analog (ADC1) | 5V | 5 นาที (Pre-heat 24-48 ชม.) |
| 2 | **MQ-3** | แอลกอฮอล์, สารทำละลาย/ทินเนอร์ | Analog (ADC1) | 5V | 5 นาที (Pre-heat 24-48 ชม.) |
| 3 | **MQ-8** | ก๊าซไฮโดรเจน ($H_2$) | Analog (ADC1) | 5V | 5 นาที (Pre-heat 24-48 ชม.) |
| 4 | **MQ-135** | แอมโมเนีย ($NH_3$), เบนซีน, VOCs | Analog (ADC1) | 5V | 5 นาที (Pre-heat 24-48 ชม.) |
| 5 | **MiCS-6814** | CO, $NO_2$, $NH_3$ (3 Channels) | I2C (ผ่าน ADS1115) | 5V | 15 นาที (เต็มประสิทธิภาพ 2 ชม.) |
| 6 | **CCS811** | TVOC (ppb), $eCO_2$ (ppm) | I2C (Bus 1) | 3.3V | 20 นาที (Burn-in ครั้งแรก 48 ชม.) |
| 7 | **PMS5003** | ฝุ่น PM1.0, PM2.5, PM10 | UART2 (Serial) | 5V | 30 วินาที |
| 8 | **DHT22** | อุณหภูมิ (°C), ความชื้นสัมพัทธ์ (%RH) | Digital 1-Wire | 3.3V | 2 วินาที |

### อุปกรณ์สนับสนุน
- **ADS1115:** 16-bit High Precision ADC สำหรับแปลงสัญญาณ 3 ช่องของ MiCS-6814
- **Relay Module:** สำหรับเปิด-ปิดพัดลมระบายอากาศ/Chamber Flow
- **Voltage Divider:** $R_1=10k\Omega, R_2=15k\Omega$ ลดทอนแรงดัน 5V ของ MQ สู่ระดับปลอดภัยสำหรับ ADC ESP32 (~3.0V)

---

## ⚡ ผังการเชื่อมต่อวงจร (Pin Mapping)

> **ข้อสำคัญ:** ระบบนี้ใช้ **Dual I2C Bus แยกอิสระ** เพื่อความเสถียรสูงสุด:

```
                          ┌────────────────────────┐
                          │    ESP32-WROOM-32U     │
                          └───────────┬────────────┘
                                      │
     ┌───────────────────┬────────────┴────────────┬───────────────────┐
     │                   │                         │                   │
[Dual I2C Bus #1]   [Dual I2C Bus #2]         [UART2 Bus]         [Analog ADC1]
 GPIO 21 (SDA)       GPIO 32 (SDA)             GPIO 16 (RX2)       GPIO 34 (MQ-2)
 GPIO 22 (SCL)       GPIO 13 (SCL)             GPIO 17 (TX2)       GPIO 35 (MQ-3)
       │                   │                         │             GPIO 36 (MQ-8)
  [ CCS811 ]          [ ADS1115 ]               [ PMS5003 ]        GPIO 39 (MQ-135)
  (Addr: 0x5B)        (Addr: 0x48)              (Laser Dust)               │
                           │                                       [Digital 1-Wire]
                     [ MiCS-6814 ]                                  GPIO 27 (DHT22)
                   (CO / NO2 / NH3)
```

- **I2C Bus 1 (Hardware):** GPIO 21 (SDA), GPIO 22 (SCL) $\rightarrow$ **CCS811** (WAKE pin ต่อลง GND)
- **I2C Bus 2 (Secondary):** GPIO 32 (SDA), GPIO 13 (SCL) $\rightarrow$ **ADS1115** (ADDR pin ต่อ GND)
- **UART2:** GPIO 16 (ESP32 RX2 $\leftarrow$ PMS5003 TX), GPIO 17 (ESP32 TX2 $\rightarrow$ PMS5003 RX)
- **Digital:** GPIO 27 $\rightarrow$ **DHT22** Data (ต่อ Pull-up $10k\Omega$ เข้า 3.3V)
- **Analog (ADC1):**
  - GPIO 34 (A0) $\leftarrow$ MQ-2
  - GPIO 35 (A1) $\leftarrow$ MQ-3
  - GPIO 36 (A2) $\leftarrow$ MQ-8
  - GPIO 39 (A3) $\leftarrow$ MQ-135

---

## 📁 โครงสร้างของโปรเจกต์

```text
├── README.md                      # เอกสารภาพรวมและการใช้งานโปรเจกต์ (ไฟล์นี้)
├── PROJECT_INFO.md                # สรุปข้อมูลโครงการและข้อกำหนดทางเทคนิค
├── monitor.py                     # สคริปต์ Dashboard แสดงผล Real-time บน Terminal
│
├── src/                           # Source Code หลักสำหรับ Production
│   └── air_quality_monitor/
│       └── air_quality_monitor.ino  # 🌟 ไฟล์ Firmware หลักที่ต้องอัปโหลดขึ้น ESP32
│
├── docs/                          # เอกสารสเปกและงานออกแบบระบบ
│   ├── wiring_design.md           # ผังวงจรและการต่อสาย Dual I2C Bus แบบละเอียด
│   ├── adaptive_enose_analysis.md # วิเคราะห์ E-Nose, Airflow และโมเดลจำแนก
│   ├── ml_model_analysis.md       # การออกแบบสถาปัตยกรรม 3 ชั้น และ Classification ML
│   ├── web_platform_spec.md       # ข้อกำหนดระบบ Web Dashboard และ API
│   └── experimental_components.md # รายการอุปกรณ์และ Datasheet อ้างอิง
│
├── test_1st_air_quality_box/      # โค้ดทดสอบเวอร์ชันแรก (WiFi/MQTT Prototype)
│   ├── test_1st_air_quality_box.ino
│   ├── test.ino
│   └── secrets.h
├── test_dht22_only/               # โค้ดทดสอบเฉพาะเซ็นเซอร์ DHT22
│   └── test_dht22_only.ino
├── debug_diagnostic/              # สคริปต์ตรวจสอบการทำงานของฮาร์ดแวร์
│   └── debug_diagnostic.ino
│
├── reference/                     # งานวิจัย เปเปอร์ และการวิเคราะห์เปรียบเทียบ
│   ├── sensor_comparison_and_market_analysis.md # เซ็นเซอร์ท้องตลาด vs E-Nose
│   ├── note.md                    # บันทึกองค์ความรู้
│   └── papers/                    # เอกสารวิจัย PDF อ้างอิง
└── archive/                       # บันทึกประวัติและงานออกแบบรุ่นก่อนหน้า
```

---

## 🚀 คู่มือการใช้งาน Firmware (Arduino)

### 1. ไฟล์ Firmware ที่ต้องใช้งาน
ให้เปิดไฟล์เฟิร์มแวร์หลักด้วย **Arduino IDE**:
📂 **`src/air_quality_monitor/air_quality_monitor.ino`**

### 2. ติดตั้ง Libraries ที่จำเป็น
เปิด **Arduino IDE** $\rightarrow$ ไปที่เมนู **Tools** $\rightarrow$ **Manage Libraries...** แล้วค้นหาและติดตั้ง:
1. `Adafruit CCS811 Library` (by Adafruit)
2. `Adafruit ADS1X15` (by Adafruit)
3. `PMS Library` (by Mariusz Kacki)
4. `DHT sensor library` (by Adafruit)
5. `Adafruit Unified Sensor` (by Adafruit)

### 3. การตั้งค่าบอร์ดใน Arduino IDE
- **Board:** `ESP32 Dev Module` (หรือ `ESP32-WROOM-DA Module`)
- **Upload Speed:** `921600` หรือ `115200`
- **Flash Frequency:** `80MHz`
- **Port:** เลือกพอร์ต Serial USB ของ ESP32 (เช่น `/dev/cu.usbserial-0001` บน Mac หรือ `COMx` บน Windows)

### 4. การ Compile และ Upload
1. กดปุ่ม **Verify (✓)** เพื่อตรวจสอบความถูกต้องของโค้ด
2. กดปุ่ม **Upload (➔)** เพื่อแฟลชโปรแกรมลงบอร์ด ESP32
3. เปิด **Serial Monitor** ที่ Baud Rate **`115200`**

### 5. การทำงานและคำสั่งควบคุมผ่าน Serial
เมื่อบอร์ดเริ่มต้นทำงาน:
- ระบบจะทำ **Hardware Self-Diagnostic** เพื่อตรวจเช็คสถานะการเชื่อมต่อของเซ็นเซอร์ทุกตัว
- เข้าสู่โหมด **Smart Warm-up** พร้อม Progress Bar นับเวลาถอยหลัง
- **คำสั่ง Serial ลัด:**
  - พิมพ์ **`s`** แล้วกด Enter: **ข้ามขั้นตอน Warm-up** ทันที (กรณีเซ็นเซอร์เปิดใช้งานต่อเนื่องและร้อนอยู่แล้ว)
  - พิมพ์ **`w`** แล้วกด Enter: **สั่งเริ่มขั้นตอน Warm-up ใหม่อีกครั้ง**

---

## 🖥️ คู่มือการใช้งาน Real-time Terminal Monitor (Python)

โครงการนี้มีสคริปต์ `monitor.py` เพื่อใช้แสดงผลหน้าจอ Dashboard ผ่าน Terminal สวยงาม โดยไม่ต้องเปิด Arduino IDE Serial Monitor

### 1. ข้อกำหนดเบื้องต้น
- ติดตั้ง **Python 3.8+**
- ติดตั้งไลบรารี `pyserial`:
  ```bash
  pip install pyserial
  ```

### 2. การสั่งรันมอนิเตอร์
เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรันคำสั่ง:
```bash
python3 monitor.py
```
*ระบบจะค้นหาพอร์ต USB Serial ของ ESP32 อัตโนมัติและเชื่อมต่อทันที*

หรือหากต้องการระบุพอร์ตโดยตรง:
```bash
python3 monitor.py --port /dev/cu.usbserial-0001
```

### 3. ตัวอย่างหน้าจอแสดงผล (Terminal GUI)
```text
╔══════════════════════════════════════════════════════════════════════════════════╗
║             ADAPTIVE E-NOSE AIR QUALITY MONITOR — REALTIME DASHBOARD             ║
╚══════════════════════════════════════════════════════════════════════════════════╝

  DHT22 สภาพแวดล้อม:   อุณหภูมิ: 28.4 °C   ความชื้น: 54.2 %RH
  PMS5003 ฝุ่น:        PM1.0: 12 ug/m3     PM2.5: 18 ug/m3     PM10: 22 ug/m3
  CCS811 VOC:          eCO2: 412 ppm       TVOC: 15 ppb
  MiCS-6814 (mV):      CO: 350 mV          NO2: 230 mV         NH3: 348 mV
  MQ Sensors (ADC):    MQ-2: 650           MQ-3: 670           MQ-8: 1210   MQ-135: 715

 💡 คำสั่งควบคุม: พิมพ์ 's' (ข้ามวอร์ม) | พิมพ์ 'w' (วอร์มใหม่)
```

---

## ⚖️ การสอบเทียบเซ็นเซอร์ (Baseline Calibration)

เซ็นเซอร์วัดแก๊สสารกึ่งตัวนำออกไซด์ของโลหะ (MOX Sensors) ใช้หลักการวัดความต้านทานสัมพัทธ์ $\frac{R_s}{R_0}$:
- **$R_0$ (Clean Air Resistance):** ค่าความต้านทานในอากาศบริสุทธิ์
- **ขั้นตอนการทำ Calibration:**
  1. นำกล่องเซ็นเซอร์ไปวางในพื้นที่ **อากาศสะอาดบริสุทธิ์** (ไม่มีสารเคมี, ควัน หรือฝุ่น)
  2. วอร์มเซ็นเซอร์ให้นิ่งอย่างน้อย **15–20 นาที**
  3. บันทึกค่าเฉลี่ย $R_0$ ของ MQ ทุกตัว และค่า mV ของ MiCS-6814
  4. ระบบจะจัดเก็บค่า $R_0$ อัตโนมัติลงในหน่วยความจำ Flash (Non-Volatile Storage / NVS ด้วย `Preferences.h`) ทำให้ไม่ต้องสอบเทียบใหม่ทุกครั้งที่เปิดเครื่อง

---

## 🧠 แนวทางการพัฒนา Machine Learning (TinyML Roadmap)

1. **การเก็บรวบรวม Dataset (4 คลาส):**
   - 🟢 `Class 0: Clean Air` (อากาศปกติในพื้นที่ทำงาน)
   - 🟡 `Class 1: Paint Dust` (ละอองฝุ่นสีผงพ่นสี)
   - 🟠 `Class 2: Thinner/Solvent` (ไอระเหยตัวทำละลายและสารอินทรีย์ระเหย)
   - 🔴 `Class 3: Smoke/Fire` (ควันไฟและไอเสีย)
2. **สถาปัตยกรรมโมเดล TinyML:**
   - โครงข่ายประสาทเทียมแบบ Multi-Layer Perceptron (MLP) เล็กและเร็ว
   - Quantization เป็น `INT8` (~100 KB) เพื่อรันบนชิป ESP32
   - อัปเดตโมเดลทางไกลผ่านระบบ Over-the-Air (OTA-TinyML) ตามมาตรฐาน IEEE 2022

---

## 📚 งานวิจัยและเอกสารอ้างอิง

- **OTA-TinyML (IEEE 2022):** *Over-the-Air Deployment of TinyML Models and Execution on IoT Devices*
- **E-Nose Drift Adaptation:** *Domain Adaptation for Gas Sensor Drift in E-Nose Systems*
- **Standard Guidelines:** เกณฑ์มาตรฐานสารอินทรีย์ระเหยง่ายในบรรยากาศ กรมควบคุมมลพิษ (PCD)
- รายละเอียดเอกสารทางวิชาการทั้งหมดสามารถศึกษาเพิ่มเติมได้ที่โฟลเดอร์ [`reference/papers/`](file:///Users/urworld/paper_sensor_VOC/reference/papers/)
