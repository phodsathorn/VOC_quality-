# ⚡ E-Nose AQM — Circuit Design (Test Version - Relay Module)

> **วันที่อัพเดท:** 2026-09-21  
> **วัตถุประสงค์:** สำหรับการต่อ **"ทดสอบ (Prototype)"** บนเบรดบอร์ด หรือใช้สายแจ็คก่อนลงแผ่นปริ้นท์จริง  
> **รูปแบบ:**  
> - ใช้ **ESP32-IO Expansion Board** (เสียบสายง่าย ไม่ต้องบัดกรี)  
> - คงการใช้ **2-Channel Relay Module** สำหรับคุมพัดลมไว้ก่อน (เพื่อทดสอบการทำงานของโค้ดและวงจร)  
> - ระบบไฟใช้แหล่งจ่าย **5V DC (Switching PSU / Adapter)** แล้วลดไฟเป็น **3.3V** ด้วย AMS1117 (หรือโมดูล Step-down เล็กๆ)  

---

## 1. 🔌 ระบบจ่ายไฟ (Power Flow สำหรับทดสอบ)

ใช้ Adapter 5V เสียบไฟบ้าน หรือ Switching PSU 5V จ่ายไฟเข้าระบบหลัก แล้วแยกไปแปลงเป็น 3.3V สำหรับเลี้ยง ESP32 และเซ็นเซอร์ 3.3V

```
  Adapter 5V (หรือ Switching PSU 5V)
         │
         ▼
  [Terminal / ราง Breadboard] ── 5V Rail 
         │
         ├──── MQ-2  VCC (Heater ~150mA)
         ├──── MQ-3  VCC (Heater ~150mA)
         ├──── MQ-8  VCC (Heater ~150mA)
         ├──── MQ-135 VCC (Heater ~150mA)
         ├──── MiCS-6814 VCC (Heater ~30mA)
         ├──── PMS5003 VCC (~100mA)
         ├──── Relay Module VCC (~70mA)
         ├──── Fan Intake (ผ่าน Relay NO1)
         ├──── Fan Exhaust (ผ่าน Relay NO2)
         │
         └──── เข้า AMS1117-3.3 (หรือ Step-down Module)
                    │
                    ▼
                 3.3V Rail
                    │
                    ├──── ESP32 (จ่ายเข้าขา 3.3V หรือเข้า VIN ฝั่ง IO Board)
                    ├──── DHT22 VCC
                    ├──── CCS811 VCC
                    └──── ADS1115 VDD
```

---

## 2. 🔌 วงจรควบคุมพัดลม (2-Channel Relay Module)

เนื่องจากทดสอบการทำงาน เราจะใช้ Relay Module สำเร็จรูปที่ต่อสายง่าย

```
  2-CH Relay Module    ESP32-IO Expansion Board
  ┌───────────────┐
  │ VCC           │──── 5V Rail (แหล่งจ่ายหลัก)
  │ GND           │──── GND
  │ IN1           │──── GPIO 25  (ควบคุมพัดลม Intake)
  │ IN2           │──── GPIO 26  (ควบคุมพัดลม Exhaust)
  └───────────────┘

  ฝั่งสกรูเทอร์มินอล (Contact) ของ Relay:
  
  ช่อง 1 (Intake Fan):
  ┌───────┐       ┌─────────┐
  │ COM1  │───────│ สาย (+) │── พัดลม Intake ── (สาย -) ── GND
  │ NO1   │───────│ 5V Rail │
  │ NC1   │       │         │
  └───────┘       └─────────┘
  
  ช่อง 2 (Exhaust Fan):
  ┌───────┐       ┌─────────┐
  │ COM2  │───────│ สาย (+) │── พัดลม Exhaust ── (สาย -) ── GND
  │ NO2   │───────│ 5V Rail │
  │ NC2   │       │         │
  └───────┘       └─────────┘
```

---

## 3. 🔌 วงจร Voltage Divider (× 7 ชุด) สำหรับทดสอบ

เพื่อป้องกัน ESP32 และให้ ADS1115 อ่านค่าได้ถูกต้อง **ห้ามลืมต่อ Voltage Divider เด็ดขาด** 

```
  Sensor AOUT (0-5V) ──[R1 = 10kΩ]──┬──[R2 = 15kΩ]── GND
                                     │
                                [100nF Cap]  ← (แนะนำให้ใส่เพื่อความนิ่ง)
                                     │
                                     └── ไปยัง ADC Input (ESP32 หรือ ADS1115)
```

**จุดเชื่อมต่อสาย (Pin Assignment):**

| เซ็นเซอร์ | สัญญาณ | จุดปลายทาง | ADC |
|---|---|---|---|
| MQ-2 | AOUT | **GPIO 33** | ESP32 ADC1_CH5 |
| MQ-3 | AOUT | **GPIO 36** (VP) | ESP32 ADC1_CH0 |
| MQ-8 | AOUT | **GPIO 34** | ESP32 ADC1_CH6 |
| MQ-135 | AOUT | **GPIO 39** (VN) | ESP32 ADC1_CH3 |
| MiCS-6814 RED (CO) | AOUT | **ADS1115 A0** | External 16-bit |
| MiCS-6814 OX (NO2) | AOUT | **ADS1115 A1** | External 16-bit |
| MiCS-6814 NH3 | AOUT | **ADS1115 A2** | External 16-bit |

---

## 4. 🔌 วงจร I2C Bus (ADS1115 + CCS811)

เสียบสายลงบนบอร์ดขยายขาเข้าพิน I2C หลัก (Wire0) ได้เลย (มี Pull-up ในตัวบอร์ดขยายขาแล้ว)

**ADS1115 + CCS811 (Wire0, ใช้บัสร่วมกัน):**
```text
  3.3V Rail
    │
    ├───────── GPIO 21 (SDA) ──┬── ADS1115 SDA
    │                          └── CCS811 SDA
    │
    └───────── GPIO 22 (SCL) ──┬── ADS1115 SCL
                               └── CCS811 SCL
```
- **ADS1115:** Address = 0x48 (ต่อขั้ว ADDR ลง GND)
- **CCS811:** Address = 0x5A (ต่อขั้ว ADDR ลง GND และต้องต่อ **WAKE ลง GND** เสมอ)


---

## 5. 🔌 วงจร DHT22 & PMS5003

**DHT22 (อุณหภูมิ/ความชื้น):**
- VCC → 3.3V
- DATA → **GPIO 27**
- GND → GND

**PMS5003 (ฝุ่นละออง):**
- VCC → 5V
- GND → GND
- TXD → **GPIO 16** (RX2)
- RXD → **GPIO 17** (TX2)
- SET → **GPIO 23**

---

## 6. ⚠️ ข้อควรระวังระหว่างการทดสอบ

1. **ห้ามใช้ไฟจาก USB ขับระบบทั้งหมด:** 
   พอร์ต USB ของคอมพิวเตอร์จ่ายไฟได้สูงสุดแค่ 500mA แต่เซ็นเซอร์ MQ × 4 ตัวรวมกันกินไฟ 600mA+ จะทำให้ไฟกระชากและคอมพิวเตอร์อาจตัดไฟ หรือทำให้ ESP32 รีบูตวนลูป
   👉 **วิธีแก้:** ต้องใช้ Adapter 5V ภายนอก (อย่างน้อย 2A) จ่ายไฟเลี้ยงที่ 5V Rail ตลอดการทดสอบ และอย่าลืมต่อ Common Ground กับ ESP32
2. **ระวังสายหลุด:** การต่อ Voltage Divider บนเบรดบอร์ดจะทำให้ค่าที่อ่านได้แกว่งมาก หากสายหลวม
3. **ห้ามป้อน 5V เข้า ADC โดยตรง:** อย่าลืมต่อผ่าน Voltage Divider (10k/15k) ทุกครั้ง
