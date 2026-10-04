# ⚡ E-Nose AQM — Circuit Design v2 (Perfboard Mainboard)

> **วันที่อัพเดท:** 2026-09-20  
> **เปลี่ยนแปลงหลัก:**  
> - ยุบวงจรทั้งหมดลง **บอร์ดไข่ปลา (Perfboard)** แผ่นเดียว  
> - เปลี่ยนระบบจ่ายไฟเป็น: **ไฟบ้าน AC → Switching PSU 5V → Step-down 3.3V**  
> - เปลี่ยน Relay Module → **MOSFET ตัวเล็ก** (ประหยัดพื้นที่มาก)  
> - ทิ้ง ESP32-IO Expansion Board → **บัดกรี Female Header ลง Perfboard ตรง**  
> - เพิ่ม Safety Components ครบทุกชั้น  

---

## 1. 🔌 ระบบจ่ายไฟ (Power Flow)

### 1.1 ผังการไหลของไฟ

```
  ไฟบ้าน 220V AC
       │
       ▼
  ┌──────────────┐
  │ ปลั๊กรับไฟ    │  ← มีฟิวส์ในตัว (ชั้นป้องกันที่ 1)
  │ (IEC C14)    │
  └──────┬───────┘
         │  220V AC
         ▼
  ┌──────────────────┐
  │ Switching PSU    │  ← แปลง AC → DC (ชั้นป้องกันที่ 2: Isolated)
  │ Hi-Link HLK-PM01 │
  │ Input: 100-240V  │
  │ Output: 5V / 3W  │
  └──────┬───────────┘
         │  5V DC
         ▼
  ┌──────────────┐
  │ Toggle Switch │  ← สวิตช์เปิด/ปิดระบบ (ชั้นป้องกันที่ 3)
  └──────┬───────┘
         │
    ┌────┴────┐
    │ 1N5822  │  ← Schottky Diode กันขั้วกลับ (ชั้นป้องกันที่ 4)
    └────┬────┘
         │
    ┌────┴────┐
    │ Fuse 2A │  ← ฟิวส์ DC ป้องกันลัดวงจร (ชั้นป้องกันที่ 5)
    └────┬────┘
         │
    ═════╪══════════════════════════════════════════════
    ║    │   ราง 5V (5V Rail)                         ║
    ═════╪══════════════════════════════════════════════
         │
         ├──── [470µF Electrolytic Cap] ──── GND    ← Bulk decoupling
         │
         ├──── MQ-2  VCC (Heater ~150mA)
         ├──── MQ-3  VCC (Heater ~150mA)
         ├──── MQ-8  VCC (Heater ~150mA)
         ├──── MQ-135 VCC (Heater ~150mA)
         ├──── MiCS-6814 VCC (Heater ~30mA)
         ├──── PMS5003 VCC (~100mA)
         ├──── Fan Intake (ผ่าน MOSFET Q1) (~120mA)
         ├──── Fan Exhaust (ผ่าน MOSFET Q2) (~120mA)
         │
         └──── เข้า AMS1117-3.3 Regulator
                    │
               ═════╪══════════════════════════════════
               ║    │   ราง 3.3V (3.3V Rail)          ║
               ═════╪══════════════════════════════════
                    │
                    ├──── [100µF Electrolytic Cap] ── GND
                    │
                    ├──── ESP32 (ผ่านขา 3V3 โดยตรง)
                    │     [100nF Ceramic Cap] ── GND
                    │
                    ├──── DHT22 VCC
                    │     [100nF Ceramic Cap] ── GND
                    │
                    ├──── CCS811 VCC
                    │     [100nF Ceramic Cap] ── GND
                    │
                    └──── ADS1115 VDD
                          [100nF Ceramic Cap] ── GND
```

### 1.2 ทำไมต้อง AMS1117-3.3 แทน LM2596?

| เปรียบเทียบ | LM2596 (เดิม) | AMS1117-3.3 (ใหม่) |
|---|---|---|
| ประเภท | Switching Buck | Linear Regulator |
| ขนาด | **43×21mm** (ใหญ่มาก) | **~6×4mm** SOT-223 |
| Input เดิม | 7.4V (จากแบต) | ต้องลด 7.4V ลงมา |
| Input ใหม่ | — | **5V** (จาก Switching PSU) |
| ความร้อน | ต่ำ (switching) | **(5-3.3)×0.3A = 0.51W** ← ยอมรับได้ |
| Noise | มี ripple จาก switching | **ไม่มี** (ดีสำหรับ ADC) |

> ✅ เนื่องจากตอนนี้แหล่งจ่ายเป็น 5V ตรงๆ แล้ว (ต่างจากเดิมที่เป็น 7.4V จากแบต) การดรอปจาก 5V → 3.3V แค่ 1.7V ทำให้ AMS1117 ทำงานได้สบาย ไม่ร้อน ไม่มี noise — **ดีกว่า LM2596 ทุกประการ** สำหรับเคสนี้

### 1.3 ทำไมต้องเปลี่ยน Relay → MOSFET?

| เปรียบเทียบ | Relay Module (เดิม) | MOSFET 2N7000 (ใหม่) |
|---|---|---|
| ขนาด | **51×39×18mm** (ใหญ่มาก!) | **TO-92** (เท่าตัวต้านทาน) |
| เสียง | มีเสียง "แต๊ก" | **เงียบ 100%** |
| กินไฟ | ~70mA (จ่าย Coil) | **~0mA** (Gate ไม่กินไฟ) |
| ควบคุม | Digital ON/OFF เท่านั้น | **PWM ปรับความเร็วได้** |
| ข้อจำกัด | — | ใช้ได้กับ Load ≤ 200mA (พัดลม 40mm OK) |

> ✅ พัดลม 40mm 5V ของเราดึงกระแสแค่ ~100-120mA — MOSFET 2N7000 รับได้สบาย (Rated 200mA) และขับได้จาก Logic 3.3V ของ ESP32 โดยตรง

---

## 2. 📐 สถาปัตยกรรม Perfboard Mainboard

### 2.1 แนวคิด

รวมทุกอย่างลงบนบอร์ดไข่ปลาแผ่นเดียว โดยเซ็นเซอร์ที่อยู่ไกล (Row 1, Row 2 ในกล่อง) จะเชื่อมเข้ามาผ่าน **JST Connector หรือ Pin Header**

### 2.2 สิ่งที่อยู่ **บน** Perfboard

| # | ชิ้นส่วน | หน้าที่ |
|---|---|---|
| 1 | **Female Header 2×19 pin** | ซ็อกเก็ตเสียบ ESP32 38-pin |
| 2 | **ADS1115 Module** (เสียบลง Header) | ADC ภายนอก สำหรับ MiCS-6814 |
| 3 | **AMS1117-3.3** (SOT-223 หรือ TO-220) | Regulator 5V → 3.3V |
| 4 | **MOSFET 2N7000 × 2** | สวิตช์พัดลม Intake / Exhaust |
| 5 | **Flyback Diode 1N4148 × 2** | ป้องกัน Back-EMF จากพัดลม |
| 6 | **Voltage Divider × 7 ชุด** | ดรอป 5V → 3.3V ให้ MQ×4 + MiCS×3 |
| 7 | **Pull-up Resistor 4.7kΩ × 3** | DHT22 (1) + I2C Bus (2) |
| 8 | **Decoupling Caps** | 470µF, 100µF, 100nF ×4 |
| 9 | **Pin Header / JST Connector** | จุดเชื่อมต่อเซ็นเซอร์ทุกตัว |
| 10 | **Schottky Diode 1N5822** | กันขั้วกลับ |
| 11 | **Fuse Holder + Fuse 2A** | กันลัดวงจร |

### 2.3 สิ่งที่เชื่อม **เข้ามา** ผ่านสายเคเบิล

| อุปกรณ์ | จำนวนสาย | ขั้วต่อ |
|---|---|---|
| MQ-2, MQ-3, MQ-8, MQ-135 (แต่ละตัว) | 3 สาย (VCC, GND, AOUT) | 3-Pin Header |
| DHT22 | 3 สาย (VCC, GND, DATA) | 3-Pin Header |
| CCS811 | 4 สาย (VCC, GND, SDA, SCL) | 4-Pin Header |
| MiCS-6814 | 5 สาย (VCC, GND, RED, OX, NH3) | 5-Pin Header |
| PMS5003 | 5 สาย (VCC, GND, TX, RX, SET) | 8-Pin connector (เดิม) |
| Fan Intake | 2 สาย (+, -) | 2-Pin Header |
| Fan Exhaust | 2 สาย (+, -) | 2-Pin Header |
| Power In (จาก Switching PSU) | 2 สาย (5V, GND) | Terminal Block |

### 2.4 ผัง Perfboard — Top View (ขนาดประมาณ 70×90mm)

```
  ┌───────────────────────────────────── 90mm ──────────────────────────────┐
  │                                                                          │
  │  [5V IN] [GND]        [FUSE 2A]    [1N5822]    [SW]                     │
  │  Terminal Block        ───────────────────────────→ 5V Rail              │
  │                                                                          │
  │  ┌──── AMS1117-3.3 ────┐   [470µF]   [100µF]                           │  70mm
  │  │ IN   GND   OUT      │   5V-GND    3.3V-GND                          │
  │  └─────────────────────┘                                                │
  │  ═══════════════════════ 3.3V Rail ═════════════════════════            │
  │                                                                          │
  │  ┌──────────────────────────────────────────────┐                       │
  │  │                                              │                       │
  │  │           ESP32 (Female Header)              │                       │
  │  │           38-pin ซ็อกเก็ต                     │                       │
  │  │                                              │                       │
  │  └──────────────────────────────────────────────┘                       │
  │                                                                          │
  │  ┌─────────┐  ┌────┐┌────┐  ┌──────────────────────────────────┐       │
  │  │ ADS1115 │  │ Q1 ││ Q2 │  │ Voltage Dividers (R1+R2) × 7    │       │
  │  │ Module  │  │2N  ││2N  │  │ MQ-2, MQ-3, MQ-8, MQ-135        │       │
  │  │(Header) │  │7000││7000│  │ MiCS RED, OX, NH3                │       │
  │  └─────────┘  └────┘└────┘  └──────────────────────────────────┘       │
  │                                                                          │
  │  [MQ-2][MQ-3][MQ-8][MQ-135][MiCS][DHT][CCS][PMS][FAN1][FAN2]           │
  │   3P    3P    3P    3P      5P   3P   4P  5P   2P    2P  ← Pin Header │
  │                                                                          │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🔌 วงจรเต็มระบบ (Full Schematic)

### 3.1 วงจรจ่ายไฟ + Safety

```
  [Switching PSU 5V Out]
         │
    (+)──┤
         │
  ┌──────┴──────┐
  │ Toggle      │
  │ Switch      │  ← เปิด/ปิดระบบ
  └──────┬──────┘
         │
  ┌──────┴──────┐
  │  1N5822     │  ← Schottky Diode (Cathode → ด้านออก)
  │  Schottky   │     Vf ≈ 0.3V @ 1A
  └──────┬──────┘
         │
  ┌──────┴──────┐
  │  Fuse 2A    │  ← ป้องกันลัดวงจร (ถ้ากระแสเกิน 2A → ฟิวส์ขาด)
  └──────┬──────┘
         │
    ═════╪══════════ 5V Rail ═══════════════════
         │
    ┌────┴────┐
    │ 470µF   │  ← Bulk Electrolytic Cap (กรอง Ripple จาก MQ Heater)
    │ 16V     │
    └────┬────┘
         │
         GND
```

### 3.2 วงจร AMS1117-3.3 (5V → 3.3V Regulator)

```
  5V Rail ───┬─── [100nF Cap] ─── GND     ← Input Decoupling
             │
        ┌────┴────┐
        │AMS1117  │
        │ IN  OUT │──┬── 3.3V Rail
        │   GND   │  │
        └────┬────┘  ├── [10µF Tantalum Cap] ── GND   ← Output Stability
             │       │
             GND     └── [100µF Electrolytic] ── GND   ← Bulk Decoupling
```

> ⚠️ **AMS1117 ต้องการ Cap ที่ Output เสมอ** ถ้าไม่ใส่ → oscillate → ESP32 แฮงค์  
> แนะนำ 10µF Tantalum + 100µF Electrolytic

### 3.3 วงจร MOSFET ควบคุมพัดลม (× 2 ชุด)

```
  ESP32 GPIO 25 ──[1kΩ]──┬── Gate (G)
                         │              ┌─── 5V Rail
                    [10kΩ]              │
                         │         ┌────┴────┐
                         GND       │ Fan (+) │
                                   └────┬────┘
                                        │
                              ┌─────────┤
                              │    Drain (D)
                         ┌────┴────┐
                         │  2N7000 │
                         │ N-MOSFET│
                         └────┬────┘
                         Source (S)
                              │
                              GND

  ※ ต่อ Flyback Diode 1N4148 ขนานกับพัดลม (Cathode → 5V, Anode → Drain)
     เพื่อกันแรงดันย้อนกลับจากขดลวดมอเตอร์พัดลม
     
  ┌─────────────────────────────────┐
  │         5V Rail                 │
  │            │                    │
  │   ┌────── ┤ ◄── 1N4148 Cathode │  ← Flyback Protection
  │   │       │                    │
  │   │  ┌────┴────┐               │
  │   │  │ Fan (+) │               │
  │   │  └────┬────┘               │
  │   │       │                    │
  │   └────── ┤ ──► 1N4148 Anode   │
  │           │                    │
  │      Drain (D)                 │
  │      2N7000                    │
  │      Source (S)                │
  │           │                    │
  │          GND                   │
  └─────────────────────────────────┘
```

> **GPIO 25** → พัดลม Intake (Q1)  
> **GPIO 26** → พัดลม Exhaust (Q2)  
> **1kΩ Gate Resistor:** จำกัดกระแส inrush เข้า Gate  
> **10kΩ Pull-down:** ป้องกันพัดลมเปิดเองตอน ESP32 รีบูต (GPIO float)

### 3.4 วงจร Voltage Divider (× 7 ชุด)

สำหรับ MQ-2, MQ-3, MQ-8, MQ-135 (เข้า ESP32 ADC1) และ MiCS-6814 RED, OX, NH3 (เข้า ADS1115)

```
  Sensor AOUT (0-5V) ──[R1 = 10kΩ]──┬──[R2 = 20kΩ]── GND
                                     │
                                [100nF Cap]  ← กรอง noise จาก heater
                                     │
                                     GND
                                     │ (จากจุดแบ่ง)
                                     └── ไปยัง ADC Input (≤ 3.33V)
```

**ตาราง Pin Assignment สำหรับ Voltage Divider:**

| # | เซ็นเซอร์ | สัญญาณ | จุดปลายทาง | ADC |
|---|---|---|---|---|
| 1 | MQ-2 | AOUT | **GPIO 33** | ESP32 ADC1_CH5 |
| 2 | MQ-3 | AOUT | **GPIO 36** (VP) | ESP32 ADC1_CH0 |
| 3 | MQ-8 | AOUT | **GPIO 34** | ESP32 ADC1_CH6 |
| 4 | MQ-135 | AOUT | **GPIO 39** (VN) | ESP32 ADC1_CH3 |
| 5 | MiCS-6814 RED (CO) | AOUT | **ADS1115 A0** | External 16-bit |
| 6 | MiCS-6814 OX (NO2) | AOUT | **ADS1115 A1** | External 16-bit |
| 7 | MiCS-6814 NH3 | AOUT | **ADS1115 A2** | External 16-bit |

> **100nF Cap ที่จุดแบ่ง** ← เพิ่มใหม่! ช่วยกรอง noise จากฮีตเตอร์ของเซ็นเซอร์ MQ ทำให้ค่า ADC นิ่งขึ้นมาก

### 3.5 วงจร I2C Bus (CCS811 + ADS1115)

```
  3.3V Rail
    │
    ├── [4.7kΩ Pull-up] ──┬── GPIO 21 (SDA) ──┬── CCS811 SDA
    │                     │                    └── ADS1115 SDA
    │                     │
    └── [4.7kΩ Pull-up] ──┴── GPIO 22 (SCL) ──┬── CCS811 SCL
                                               └── ADS1115 SCL

  CCS811:  Address = 0x5A (ADDR → GND)
  ADS1115: Address = 0x48 (ADDR → GND)

  CCS811 WAKE → GND (ต่อลง GND ตลอดเพื่อให้ทำงาน)
```

> **Pull-up 4.7kΩ × 2 ตัว** — จำเป็นสำหรับ I2C bus ที่มี 2 อุปกรณ์ (ระยะสายภายในกล่อง ≤ 20cm ใช้ 4.7kΩ ได้ ไม่ต้องลดเหลือ 2.2kΩ)

### 3.6 วงจร DHT22

```
  3.3V Rail ──┬── DHT22 VCC
              │
         [4.7kΩ]  ← Pull-up
              │
  GPIO 27 ─── ┴── DHT22 DATA
              
  GND ─────────── DHT22 GND
```

### 3.7 วงจร PMS5003

```
  5V Rail ────── PMS5003 PIN1 (VCC)     ← ต้อง 5V สำหรับพัดลมในตัว
  GND ────────── PMS5003 PIN2 (GND)
  GPIO 23 ────── PMS5003 PIN3 (SET)     ← HIGH=ทำงาน / LOW=Sleep
  GPIO 17 ────── PMS5003 PIN4 (RXD)     ← ESP32 TX2 → PMS RX
  GPIO 16 ────── PMS5003 PIN5 (TXD)     ← PMS TX → ESP32 RX2

  ※ [100nF Cap] ระหว่าง VCC กับ GND ของ PMS5003 ← กรอง noise จากมอเตอร์พัดลมในตัว
```

---

## 4. 🛡️ Safety Design — ป้องกันทุกชั้น

| ชั้น | ชื่อ | อุปกรณ์ | ป้องกันอะไร | หมายเหตุ |
|---|---|---|---|---|
| **1** | AC Fuse | **ฟิวส์ในปลั๊ก** | ลัดวงจรฝั่ง AC | มีในตัวปลั๊กอยู่แล้ว |
| **2** | AC-DC Isolation | **HLK-PM01** | ไฟดูด / Galvanic Isolation | แยกไฟ AC กับ DC อย่างสมบูรณ์ |
| **3** | Power Switch | **Toggle Switch** | ตัดไฟทั้งระบบ | ไม่ต้องถอดปลั๊ก |
| **4** | Reverse Polarity | **1N5822 Schottky** | ต่อขั้วกลับ (ตอน debug) | Vf ≈ 0.3V drop เท่านั้น |
| **5** | Overcurrent DC | **Fuse 2A** | ลัดวงจรฝั่ง DC | ป้องกัน Switching PSU พัง |
| **6** | Bulk Filtering | **470µF @ 5V** | Ripple / Inrush current | กรอง noise จาก MQ heater |
| **7** | Voltage Regulation | **AMS1117-3.3** | แรงดัน 3.3V เสถียร | Low-noise สำหรับ ADC |
| **8** | Regulator Stability | **10µF Tantalum @ 3.3V** | AMS1117 oscillation | ต้องมี — ไม่ใส่จะ oscillate |
| **9** | Local Decoupling | **100nF × 4** (per chip) | High-freq noise | ใกล้ขา VCC ของ ESP32, CCS811, ADS1115, PMS5003 |
| **10** | ADC Filtering | **100nF × 7** (per divider) | Heater noise → ADC | ที่จุดกึ่งกลาง Voltage Divider ทุกช่อง |
| **11** | GPIO Protection | **Voltage Divider** (7 ชุด) | 5V AOUT → 3.3V | ป้องกัน GPIO ไหม้จากไฟ 5V |
| **12** | Motor Back-EMF | **1N4148 × 2** | Flyback voltage จากพัดลม | ป้องกัน MOSFET พัง |
| **13** | Boot Safety | **10kΩ Pull-down × 2** | GPIO float ตอนรีบูต | กัน MOSFET เปิดพัดลมเองตอนบูต |

---

## 5. 📋 รายการอุปกรณ์ทั้งหมด (Bill of Materials)

### 5.1 เซ็นเซอร์หลัก

| # | รายการ | จำนวน | หมายเหตุ |
|---|---|---|---|
| 1 | ESP32-WROOM-32U (38-pin) | 1 ตัว | ไม่ต้องใช้ IO Expansion Board แล้ว |
| 2 | DHT22 / AM2302 | 1 ตัว | อุณหภูมิ / ความชื้น |
| 3 | CCS811 Module | 1 ตัว | eCO2 / TVOC |
| 4 | MiCS-6814 Module | 1 ตัว | CO / NO2 / NH3 |
| 5 | PMS5003 + Connector | 1 ชุด | ฝุ่น PM1.0 / PM2.5 / PM10 |
| 6 | MQ-2 Module | 1 ตัว | ควัน / ก๊าซติดไฟ |
| 7 | MQ-3 Module | 1 ตัว | แอลกอฮอล์ |
| 8 | MQ-8 Module | 1 ตัว | ไฮโดรเจน |
| 9 | MQ-135 Module | 1 ตัว | แอมโมเนีย / เบนซีน |
| 10 | ADS1115 Module (16-bit ADC) | 1 ตัว | ขยาย ADC สำหรับ MiCS-6814 |
| 11 | พัดลม DC 40×40×10mm 5V | 2 ตัว | Intake + Exhaust |

### 5.2 ระบบจ่ายไฟ

| # | รายการ | จำนวน | เปลี่ยนจากเดิม |
|---|---|---|---|
| 12 | ปลั๊กรับไฟ IEC C14 (มีฟิวส์) | 1 ตัว | ใหม่ (แทนแบต 18650) |
| 13 | Switching PSU Hi-Link HLK-PM01 (5V/3W) | 1 ตัว | ใหม่ (แทน LM2596 ตัวที่ 1) |
| 14 | AMS1117-3.3 Regulator | 1 ตัว | ใหม่ (แทน LM2596 ตัวที่ 2) — **เล็กกว่า 50 เท่า** |
| 15 | Toggle Switch | 1 ตัว | เหมือนเดิม |

### 5.3 Safety Components

| # | รายการ | จำนวน | ทำหน้าที่ |
|---|---|---|---|
| 16 | Schottky Diode 1N5822 (3A) | 1 ตัว | กันขั้วกลับ |
| 17 | Fuse 2A + Fuse Holder | 1 ชุด | กันลัดวงจร DC |
| 18 | Flyback Diode 1N4148 | 2 ตัว | กัน Back-EMF พัดลม |
| 19 | N-MOSFET 2N7000 | 2 ตัว | **แทน Relay Module** — เล็กกว่า 100 เท่า |

### 5.4 Capacitors (ตัวเก็บประจุ)

| # | รายการ | จำนวน | ตำแหน่ง |
|---|---|---|---|
| 20 | 470µF / 16V Electrolytic | 1 ตัว | Bulk decoupling ราง 5V |
| 21 | 100µF / 16V Electrolytic | 1 ตัว | Bulk decoupling ราง 3.3V |
| 22 | 10µF Tantalum | 1 ตัว | Output AMS1117 (จำเป็น!) |
| 23 | 100nF Ceramic (0.1µF) | 4 ตัว | Decoupling ที่ ESP32, CCS811, ADS1115, PMS5003 |
| 24 | 100nF Ceramic (0.1µF) | 7 ตัว | กรอง noise ที่ Voltage Divider ทุกช่อง |

### 5.5 Resistors (ตัวต้านทาน)

| # | รายการ | จำนวน | ตำแหน่ง |
|---|---|---|---|
| 25 | 10kΩ (1/4W) | 7 ตัว | Voltage Divider R1 (MQ×4 + MiCS×3) |
| 26 | 20kΩ (1/4W) | 7 ตัว | Voltage Divider R2 (MQ×4 + MiCS×3) |
| 27 | 4.7kΩ (1/4W) | 3 ตัว | Pull-up: DHT22 (1) + I2C SDA/SCL (2) |
| 28 | 1kΩ (1/4W) | 2 ตัว | MOSFET Gate resistor |
| 29 | 10kΩ (1/4W) | 2 ตัว | MOSFET Gate pull-down |

### 5.6 อุปกรณ์ประกอบ Perfboard

| # | รายการ | จำนวน | หมายเหตุ |
|---|---|---|---|
| 30 | แผ่น Perfboard (ไข่ปลา) 7×9cm | 1 แผ่น | Mainboard |
| 31 | Female Header 1×19 pin | 2 แถว | ซ็อกเก็ต ESP32 |
| 32 | Female Header 1×5 pin | 1 แถว | ซ็อกเก็ต ADS1115 |
| 33 | Male Pin Header (ตัดได้) | 2 แถว | ขั้วต่อเซ็นเซอร์ |
| 34 | Terminal Block 2-pin | 1 ตัว | รับไฟ 5V จาก PSU |
| 35 | สายไฟ AWG22-24 | 1 ม้วน | เดินสายบน Perfboard |
| 36 | ลวดบัดกรี (Solder) | 1 ม้วน | |

---

## 6. ⚡ สรุป Pin Assignment ฉบับสมบูรณ์ (v2)

| GPIO | อุปกรณ์ | ประเภท | หมายเหตุ |
|---:|---|---|---|
| **3V3** | ← AMS1117 OUT | Power | จ่ายไฟ 3.3V เข้า ESP32 |
| **4** | DHT22 DATA | Digital IN | Pull-up 4.7kΩ |
| **16** | PMS5003 TXD → ESP RX2 | UART2 RX | |
| **17** | ESP TX2 → PMS5003 RXD | UART2 TX | |
| **21** | I2C SDA (CCS811 + ADS1115) | I2C | Pull-up 4.7kΩ |
| **22** | I2C SCL (CCS811 + ADS1115) | I2C | Pull-up 4.7kΩ |
| **23** | PMS5003 SET | Digital OUT | |
| **25** | MOSFET Q1 Gate (Fan Intake) | Digital OUT / PWM | Pull-down 10kΩ + Gate R 1kΩ |
| **26** | MOSFET Q2 Gate (Fan Exhaust) | Digital OUT / PWM | Pull-down 10kΩ + Gate R 1kΩ |
| **33** | MQ-2 AOUT → Voltage Divider | ADC1_CH5 | + 100nF filter cap |
| **34** | MQ-8 AOUT → Voltage Divider | ADC1_CH6 | + 100nF filter cap |
| **36** | MQ-3 AOUT → Voltage Divider | ADC1_CH0 | + 100nF filter cap |
| **39** | MQ-135 AOUT → Voltage Divider | ADC1_CH3 | + 100nF filter cap |

---

## 7. 📏 เปรียบเทียบขนาด: เดิม vs ใหม่

| ชิ้นส่วน | เดิม (Module) | ใหม่ (Perfboard) | ลดลง |
|---|---|---|---|
| ESP32 + IO Board | 59×83mm | **25×51mm** (ESP32 เปล่า) | **~60%** |
| Relay 2-CH | 51×39mm | **2N7000 × 2** (TO-92) | **~98%** |
| LM2596 × 2 | 43×21mm × 2 ตัว | **AMS1117** (6×4mm) | **~97%** |
| Voltage Dividers (ลอย) | สายระโยง | **บัดกรีบน Perfboard** | สะอาด 100% |
| **พื้นที่รวม Row 3** | **~214×83mm** | **~70×90mm Perfboard** | **~65%** |

---

## 8. ⚠️ ข้อควรระวัง

1. **ตั้ง AMS1117 ก่อนเสียบ ESP32** — วัด Output ด้วยมัลติมิเตอร์ให้ได้ 3.3V ก่อน
2. **ใส่ Capacitor ที่ Output AMS1117 เสมอ** — ถ้าไม่ใส่ Tantalum 10µF → oscillate → ESP32 แฮงค์
3. **ต่อ Voltage Divider + Filter Cap ก่อนจ่ายไฟ** — ถ้าลืมต่อแล้วเสียบ MQ ตรงเข้า GPIO จะเกิน 3.3V ทันที
4. **ตรวจทิศ Flyback Diode** — Cathode (แถบ) ชี้ไปทาง 5V, Anode ชี้ไปทาง Drain ของ MOSFET
5. **ตรวจทิศ 1N5822** — Cathode ชี้ออก (ฝั่ง Load), Anode ชี้เข้า (ฝั่ง PSU)
6. **Common Ground** — GND ของทุกอุปกรณ์ต้องเชื่อมถึงกัน 100%
7. **Hi-Link HLK-PM01 มีกระแสจำกัด 600mA** — ถ้ากระแสรวมเกิน (MQ×4 = 600mA + อื่นๆ ≈ 400mA = **~1A**) → ต้องเปลี่ยนเป็นรุ่น **HLK-PM12 (5V/2.4A)** หรือใช้ Switching Adapter 5V/2A แทน

> ⚠️ **สำคัญมาก:** MQ-Series 4 ตัวกินไฟฮีตเตอร์รวม ~600mA, พัดลม 2 ตัว ~240mA, PMS5003 ~100mA → **รวม ~1A ที่ราง 5V** → ต้องใช้ Switching PSU ที่จ่ายได้ **อย่างน้อย 5V/2A** เช่น:
> - **Mean Well IRM-10-5** (5V/2A) — แนะนำ
> - **Adapter 5V/2A** ทั่วไป + ต่อสาย DC เข้า Terminal Block

---

## 9. 🔄 อุปกรณ์ที่ถูกแทนที่ (สรุป)

| อุปกรณ์เดิม | ถูกแทนด้วย | เหตุผล |
|---|---|---|
| แบตเตอรี่ 18650 ×2 + BMS 2S | **Switching PSU (AC→5V)** | ติดตั้งถาวร ไม่ต้องชาร์จแบต |
| LM2596 Buck #1 (7.4V→5V) | **ไม่ต้องใช้** (PSU จ่าย 5V ตรง) | ลดชิ้นส่วน |
| LM2596 Buck #2 (7.4V→3.3V) | **AMS1117-3.3** | เล็กกว่า 50 เท่า, ไม่มี noise |
| ESP32-IO Expansion Board | **Female Header บน Perfboard** | ลดขนาด 60% |
| 2-CH Relay Module (51×39mm) | **2N7000 MOSFET ×2** (TO-92) | ลดขนาด 98%, เงียบ, รองรับ PWM |
| สาย Dupont ลอยๆ | **บัดกรีตรงลง Perfboard** | สะอาด, ไม่หลุด |
