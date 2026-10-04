# การออกแบบวงจรเชื่อมต่อ ESP32-WROOM-32U (Wiring Design)

เอกสารนี้ออกแบบการต่อวงจรทั้งหมดสำหรับอุปกรณ์ในโปรเจค Air Quality Monitor
โดยคำนึงถึงข้อจำกัดสำคัญของ ESP32 อย่างรอบคอบ

---

## 🔲 ESP32 38-Pin + IO Expansion Board Pinout Reference

> **อัพเดทล่าสุด:** เปลี่ยนมาใช้ ESP32 รุ่น 38-Pin เสียบลงบน **ESP32-IO Expansion Board**
> **ข้อดีของบอร์ดขยาย:** ทุกขา GPIO จะมีพินไฟ VCC (เลือกสลับ 5V หรือ 3.3V ได้บนบอร์ด) และ GND มาให้คู่กันแบบ V-G-S (Voltage-Ground-Signal) ทำให้สามารถเสียบสาย Dupont ของเซ็นเซอร์ลงไปได้โดยตรง ไม่ต้องพึ่งเบรดบอร์ดมากนัก

### ตารางอ้างอิงขา GPIO ที่ใช้งาน (ADC1 & I2C x2 & UART2)

| GPIO | อุปกรณ์ | ประเภท | หมายเหตุ |
|---:|---|---|---|
| **4** | DHT22 | Digital | ต้องมี Pull-up 4.7kΩ |
| **13** | I2C SCL (Bus #2) | I2C Software | ต่อ **ADS1115** SCL (ADC2 — ใช้เป็น Digital I2C ได้ขณะ WiFi ON) |
| **16** | PMS5003 (TX) | UART2 RX | |
| **17** | PMS5003 (RX) | UART2 TX | |
| **21** | I2C SDA (Bus #1) | I2C Hardware | ต่อ **CCS811** SDA เท่านั้น |
| **22** | I2C SCL (Bus #1) | I2C Hardware | ต่อ **CCS811** SCL เท่านั้น |
| **23** | PMS5003 (SET) | Digital | |
| **25** | Relay IN1 | Digital | ควบคุมพัดลม Intake |
| **26** | Relay IN2 | Digital | ควบคุมพัดลม Exhaust |
| **32** | I2C SDA (Bus #2) | I2C Software | ต่อ **ADS1115** SDA (ADC1 — ปลอดภัยต่อ Wi-Fi) |
| **33** | MQ-2 AOUT | ADC1_CH5 | ผ่าน Voltage Divider (ปลอดภัยต่อ Wi-Fi) |
| **34** | MQ-8 AOUT | ADC1_CH6 | ผ่าน Voltage Divider (Input-Only) |
| **36 (VP)** | MQ-3 AOUT | ADC1_CH0 | ผ่าน Voltage Divider (Input-Only) |
| **39 (VN)** | MQ-135 AOUT | ADC1_CH3 | ผ่าน Voltage Divider (Input-Only) |

*(ขา GPIO อื่นๆ นอกเหนือจากนี้ ถือว่าเป็นขาสำรอง ขา Strapping หรือขาต้องห้าม)*

### ขาที่ไม่ได้อยู่บน Header (ซ่อนอยู่ภายในโมดูล)

| GPIO | หน้าที่ | หมายเหตุ |
|---:|---|---|
| 6, 7, 8, 9, 10, 11 | เชื่อมต่อ SPI Flash ภายใน | **ห้ามแตะเด็ดขาด** — บอร์ดค้างทันที |

---

## ⚠️ กฎเหล็กที่ต้องรู้ก่อนต่อวงจร

| กฎ | เหตุผล |
|---|---|
| ขา GPIO ทำงานที่ **3.3V เท่านั้น** | ป้อน 5V เข้า GPIO = บอร์ดพัง |
| ใช้เฉพาะ **ADC1** (GPIO 32, 33, 34, 35, 36, 39) สำหรับอ่าน Analog | ADC2 ใช้ไม่ได้เมื่อเปิด Wi-Fi |
| GPIO 34, 35, 36, 39 เป็น **Input-Only** | ใช้ได้กับ Analog Input แต่ไม่มี Pull-up ภายใน |
| **ห้ามใช้** GPIO 6-11 | เชื่อมกับ SPI Flash ภายใน — บอร์ดค้าง |
| ระวัง **Strapping Pins** (GPIO 0, 2, 5, 12, 15) | อาจทำให้บูตไม่ขึ้นถ้ามีโหลดดึงระหว่างเปิดเครื่อง |
| ต่อ **เสาอากาศ IPEX** ก่อนเปิดบอร์ดเสมอ | ป้องกัน RF Amplifier เสียหาย |
| กระแสต่อขา GPIO สูงสุด **12 mA** (แนะนำ) | เกินนี้เสี่ยงไหม้ขา GPIO |

---

## 📋 สรุปตาราง Pin Assignment ทั้งหมด

| อุปกรณ์ | สัญญาณ | ตำแหน่งที่ต่อ | ประเภท | แรงดัน | หมายเหตุ |
|---|---|---|---|---|---|
| **DHT22** | DATA | **GPIO 27** | Digital (1-Wire) | 3.3V | ต้องมี Pull-up 4.7kΩ ระหว่าง VCC กับ DATA |
| **CCS811** | SDA | **GPIO 21** | I2C Data (Hardware) | 3.3V | Bus #1 — CCS811 เท่านั้น (Address: 0x5B) |
| **CCS811** | SCL | **GPIO 22** | I2C Clock (Hardware) | 3.3V | Bus #1 — CCS811 เท่านั้น |
| **ADS1115** | SDA | **GPIO 32** | I2C Data (Software) | 3.3V | Bus #2 — ADS1115 เท่านั้น (Address: 0x48) |
| **ADS1115** | SCL | **GPIO 13** | I2C Clock (Software) | 3.3V | Bus #2 — ADS1115 เท่านั้น |
| **MiCS-6814** | CO | **ADS1115 A0** | External ADC | 3.3V | ### 3. ADS1115 (External ADC) & MiCS-6814 — I2C Bus #2 (Software I2C)

เนื่องจากขา ADC1 บน ESP32 มีจำกัด จึงใช้ **ADS1115 (16-bit ADC ผ่าน I2C)** เพื่ออ่านค่าจาก MiCS-6814 ทั้ง 3 ช่อง

---

#### ⚠️ ปัญหาที่พบจริงจากการทดสอบ — Pull-up Conflict & Init Order

**Init คืออะไร?**

> **Init** (ย่อมาจาก Initialize) คือขั้นตอนเริ่มต้นใช้งานสิ่งใดสิ่งหนึ่ง — คือการ“ปลุกให้ตื่น” และ“เตรียมความพร้อม”
> ตัวอย่าง: `Wire.begin(21, 22)` = บอกระบบว่า “เราจะใช้ GPIO 21 เป็น SDA และ GPIO 22 เป็น SCL เปิดใช้ I2C ได้เลย”

**ปัญหาที่ 1 — Pull-up Resistor ซ้ำซ้อน**

โมดูล I2C ทุกตัวมี Pull-up resistor ติดมาในตัว (4.7kΩ) เพื่อดึงสาย SDA/SCL ขึ้น HIGH:

```
  ต่อตัวเดียว:    4.7kΩ            → ✅ เหมาะสม
  ต่อสองตัวพร้อมกัน: 4.7k // 4.7k = 2.35kΩ  → ❌ ต่ำเกิน bus ล่มทั้งเส้น
```

**ปัญหาที่ 2 — GPIO 18/19 ใช้ I2C ไม่ได้บนบอร์ดนี้**

GPIO 18 = VSPI CLK, GPIO 19 = VSPI MISO — มีวงจรภายใน IO Expansion Board รบกวนสัญญาณ I2C (ทดสอบแล้ว)

**ปัญหาที่ 3 — CCS811 ดึง SDA ค้างตอน Power-up**

CCS811 มีพฤติกรรมพิเศษ: ตอนเปิดเครื่องจะดึง SDA ให้เป็น LOW ชั่วครู—ถ้า init Bus ของ CCS811 (GPIO 21/22) ก่อน จะทำให้ ADS1115 init ไม่สำเร็จด้วย

**วิธีแก้ — แยก I2C Bus สองเส้น + Init Bus #2 ก่อนเสมอ**

| Bus | SDA | SCL | อุปกรณ์ | ประเภท I2C |
|---|---|---|---|---|
| **Bus #1** | GPIO 21 | GPIO 22 | CCS811 (0x5B) | Hardware (`Wire`) |
| **Bus #2** | GPIO 32 | GPIO 13 | ADS1115 (0x48) | Software (`TwoWire(1)`) |

```cpp
#include <Wire.h>

TwoWire I2C2 = TwoWire(1);

void setup() {
  // ⚠️ ต้อง init Bus #2 (ADS1115) ก่อนเสมอ
  // เพราะ CCS811 ดึง SDA ค้างตอน power-up
  // ถ้า init Wire (CCS811) ก่อน → I2C2 (ADS1115) จะเริ่มไม่ปกติ
  I2C2.begin(32, 13);       // Bus #2: ADS1115
  I2C2.setClock(100000);
  delay(100);

  Wire.begin(21, 22);       // Bus #1: CCS811
  Wire.setClock(100000);
  delay(100);

  ads.begin(0x48, &I2C2);   // ADS1115 บน Bus #2
  ccs.begin(0x5B, &Wire);   // CCS811 บน Bus #1
}
```

```
  ADS1115 Module       ESP32 (Bus #2 — Software I2C)
  ┌───────────┐
  │ VDD       │────── 3.3V
  │ GND       │────── GND
  │ SCL       │────── GPIO 13 (I2C SCL — Bus #2)
  │ SDA       │────── GPIO 32 (I2C SDA — Bus #2)
  │ ADDR      │────── GND (ตั้ง Address เป็น 0x48)
  │ ALRT      │────── (ไม่ใช้)
  └───────────┘
        │
      (ฝั่ง Analog Input ของ ADS1115)
        │
  ┌─────┴─────┐
  │ A0  A1  A2│
  └─┬───┬───┬─┘
    │   │   │
  [วงจร Voltage Divider]
    │   │   │
  CO   NO2  NH3  (จาก MiCS-6814)
```

**วงจรแบ่งแรงดัน (Voltage Divider) ของ MiCS-6814:**
> ⚠️ MiCS-6814 ยังคงต้องใช้ R1=10k, R2=15k เพื่อลดแรงดัน 5V ของแหล่งจ่ายลงมาเหลือ 3.0V ก่อนเข้า ADS1115 เพราะเราจ่ายไฟเลี้ยง VDD ของ ADS1115 ด้วยไฟ 3.3V (ถ้าป้อน 5V เข้า ADC จะทำให้ชิปพัง)

```
  MiCS AOUT ──[R1 = 10kΩ]──┬──[R2 = 15kΩ]── GND
                           │
                           └── ไปยัง ADS1115 (A0, A1, A2)
```

> **เหตุผลที่ใช้ ADS1115:** ได้ความละเอียด 16-bit ดีกว่า ESP32 (12-bit) ทำให้ค่านิ่งและละเอียดขึ้นมาก่ไม่ใช่ Strapping Pin ที่สำคัญ รองรับ Digital read ได้ดี และไลบรารี DHT ของ Adafruit ทำงานได้ดีกับขานี้

---

### 2. CCS811 — eCO2 / TVOC (I2C Bus)

```
  CCS811 Module       ESP32
  ┌───────────┐
  │ VCC       │────── 3.3V
  │ GND       │────── GND
  │ SDA       │────── GPIO 21 (I2C SDA)
  │ SCL       │────── GPIO 22 (I2C SCL)
  │ WAKE      │────── GND  (ต่อลง GND ตลอดเพื่อให้ตื่น)
  │ INT       │────── (ไม่ต่อ / Optional)
  │ RST       │────── (ไม่ต่อ / Optional)
  └───────────┘
  I2C Address: 0x5A (default) หรือ 0x5B (ถ้าต่อขา ADDR → HIGH)
```

> **เหตุผลที่เลือก GPIO 21/22:** เป็น Default Hardware I2C ของ ESP32 ทุกไลบรารีรองรับโดยไม่ต้องตั้งค่าเพิ่ม ใช้ร่วม bus กับ ADS1115 ได้เพราะ Address ไม่ซ้ำกัน (CCS811=0x5A, ADS1115=0x48)

---

### 3. ADS1115 (External ADC) & MiCS-6814

เนื่องจากขา ADC1 บน ESP32 มีจำกัด จึงใช้ **ADS1115 (16-bit ADC ผ่าน I2C)** เพื่ออ่านค่าจาก MiCS-6814 ทั้ง 3 ช่อง ซึ่งช่วยคืนขา GPIO บน ESP32 ให้กับเซ็นเซอร์ MQ ได้

> ⚠️ **ทำไมต่อ I2C ร่วม bus กับ CCS811 บน GPIO 21/22?**
> ทดสอบแล้วพบว่า **GPIO 18/19 ใช้ I2C ไม่ได้** บน ESP32-IO Expansion Board นี้ (GPIO 18 = VSPI CLK, GPIO 19 = VSPI MISO — มีวงจรบนบอร์ดขยายรบกวน) ไม่ว่าจะต่ออุปกรณ์ I2C ตัวไหนเข้า GPIO 18/19 ก็ scan ไม่เจออุปกรณ์เลย แต่พอย้ายไปต่อ GPIO 21/22 ก็เจอทันที
>
> การต่อร่วม bus เดียวกันทำงานได้ดี เพราะ **Address ไม่ซ้ำกัน** (CCS811 = `0x5A`, ADS1115 = `0x48`)

```
  ADS1115 Module       ESP32 (ผ่าน IO Board)
  ┌───────────┐
  │ VDD       │────── 3.3V
  │ GND       │────── GND
  │ SCL       │────── GPIO 22 (I2C SCL) ← ร่วม bus กับ CCS811
  │ SDA       │────── GPIO 21 (I2C SDA) ← ร่วม bus กับ CCS811
  │ ADDR      │────── GND (ตั้ง Address เป็น 0x48)
  │ ALRT      │────── (ไม่ใช้)
  └───────────┘
        │
      (ฝั่ง Analog Input ของ ADS1115)
        │
  ┌─────┴─────┐
  │ A0  A1  A2│
  └─┬───┬───┬─┘
    │   │   │
  [วงจร Voltage Divider]
    │   │   │
  CO   NO2  NH3  (จาก MiCS-6814)
```

**วงจรแบ่งแรงดัน (Voltage Divider) ของ MiCS-6814:**
> ⚠️ MiCS-6814 ยังคงต้องใช้ R1=10k, R2=15k เพื่อลดแรงดัน 5V ของแหล่งจ่ายลงมาเหลือ 3.0V ก่อนเข้า ADS1115 เพราะเราจ่ายไฟเลี้ยง VDD ของ ADS1115 ด้วยไฟ 3.3V (ถ้าป้อน 5V เข้า ADC จะทำให้ชิปพัง)

```
  MiCS AOUT ──[R1 = 10kΩ]──┬──[R2 = 15kΩ]── GND
                           │
                           └── ไปยัง ADS1115 (A0, A1, A2)
```

> **เหตุผลที่ใช้ ADS1115:** ได้ความละเอียด 16-bit (ดีกว่า ESP32 ที่เป็น 12-bit) ทำให้ค่าของ MiCS-6814 นิ่งและละเอียดขึ้นมาก และใช้เพียงบัส I2C ร่วมกับ CCS811 ได้เลย (Address ไม่ซ้ำกัน)

### 4. PMS5003 — ฝุ่นละออง (UART2)

```
  PMS5003              ESP32
  ┌───────────┐
  │ PIN1 VCC  │──────── 5V (แหล่งจ่ายหลัก, ต้อง 5V สำหรับพัดลมภายใน)
  │ PIN2 GND  │──────── GND
  │ PIN3 SET  │──────── GPIO 23  (HIGH=ทำงาน / LOW=Sleep)
  │ PIN4 RXD  │──────── GPIO 17  (ESP32 TX2 → PMS RX)
  │ PIN5 TXD  │──────── GPIO 16  (PMS TX → ESP32 RX2)
  │ PIN6 RST  │──────── (ไม่ต่อ — ไม่จำเป็น)
  │ PIN7 NC   │
  │ PIN8 NC   │
  └───────────┘
```

> **เหตุผลที่เลือก GPIO 16/17:** เป็น Default UART2 ของ ESP32 (Hardware Serial 2) แยกจาก UART0 (USB) ทำให้อ่านข้อมูลเซ็นเซอร์ไม่ชนกับ Serial Monitor; PMS5003 ส่งสัญญาณ 3.3V Logic อยู่แล้ว ต่อตรงเข้า ESP32 ได้เลย

---

### 5. เซ็นเซอร์ MQ-2, MQ-3, MQ-8, MQ-135 (Analog + Voltage Divider)

```
  MQ-x Module         Voltage Divider         ESP32 (ผ่าน IO Board)
  ┌──────────┐
  │ VCC      │──────────────────────────────── 5V (แหล่งจ่ายหลัก)
  │ GND      │──────────────────────────────── GND
  │ AOUT     │───[10kΩ]──┬──[15kΩ]── GND ──── GPIO (ADC1)
  │ DOUT     │──────────────────────────────── (ไม่ใช้ / Optional)
  └──────────┘
```

**การจับคู่ GPIO ของ MQ แต่ละตัว:**

| เซ็นเซอร์ | ก๊าซหลัก | ขา AOUT → Voltage Divider → | GPIO | ADC Channel |
|---|---|---|---:|---|
| MQ-2 | ควัน, ก๊าซติดไฟ | AOUT | **GPIO 33** | ADC1_CH5 |
| MQ-3 | แอลกอฮอล์ | AOUT | **GPIO 36** (VP) | ADC1_CH0 |
| MQ-8 | ไฮโดรเจน | AOUT | **GPIO 34** | ADC1_CH6 |
| MQ-135 | แอมโมเนีย, เบนซีน | AOUT | **GPIO 39** (VN) | ADC1_CH3 |

> **Voltage Divider เหมือน MiCS-6814:** ใช้ R1=10kΩ, R2=15kΩ ทุกตัว ได้ Vout สูงสุด ≈ 3.0V ปลอดภัยสำหรับ ESP32

> **เหตุผลที่เลือก GPIO 33, 34, 36, 39:** หลังจากย้าย MiCS-6814 ออกไป เราจะได้ขา GPIO 34 คืนมา ทำให้สามารถใส่ MQ-8 ได้พอดี ขาทั้งหมดเป็น ADC1 ปลอดภัยขณะใช้ Wi-Fi

---

### 6. 2-Channel Relay Module (2PH6391A) — ควบคุมพัดลม

```
  2-CH Relay Module    ESP32
  ┌───────────────┐
  │ VCC           │──── 5V (แหล่งจ่ายหลัก ❌ ไม่ดึงจาก ESP32)
  │ GND           │──── GND (ต้อง Common GND กับ ESP32)
  │ IN1           │──── GPIO 25  (ควบคุมพัดลม Intake)
  │ IN2           │──── GPIO 26  (ควบคุมพัดลม Exhaust)
  └───────────────┘

  ฝั่งสกรูเทอร์มินอล (Contact):
  
  ช่อง 1 (Intake Fan):
  ┌───────┐       ┌─────────┐
  │ COM1  │───────│ สาย (+) │── พัดลม Intake ── (สาย -) ── GND (5V Supply)
  │ NO1   │───────│ 5V จาก  │
  │ NC1   │       │ Supply  │
  └───────┘       └─────────┘
  
  ช่อง 2 (Exhaust Fan):
  ┌───────┐       ┌─────────┐
  │ COM2  │───────│ สาย (+) │── พัดลม Exhaust ── (สาย -) ── GND (5V Supply)
  │ NO2   │───────│ 5V จาก  │
  │ NC2   │       │ Supply  │
  └───────┘       └─────────┘
```

> **เหตุผลที่เลือก GPIO 25, 26:** เป็นขา Safe GPIO, ไม่ใช่ Strapping Pin, ไม่ใช่ ADC1 (ไม่ชนกับเซ็นเซอร์ Analog), รองรับ Digital Output ได้ดี; Relay Module มี Optocoupler ในตัวจึงดึงกระแสจาก ESP32 น้อยมาก (~1-2 mA) ปลอดภัย

---

## 🔋 ระบบจ่ายไฟ (Power Distribution)

## 🔋 ระบบจ่ายไฟ — แบตเตอรี่ 18650 x2 อนุกรม (Power Distribution)

### แผนผังจ่ายไฟแบบเต็มระบบ (พร้อม Safety ทุกจุด)

```
  ┌───────────────────────────────────────────────────────────────────────┐
  │  18650 x2 Series (7.4V nom / 8.4V full / 6.0V empty)                │
  │                                                                       │
  │  ┌─────────┐    ┌─────────┐                                          │
  │  │ Cell #1 │────│ Cell #2 │                                          │
  │  │  3.7V   │    │  3.7V   │                                          │
  │  └────┬────┘    └────┬────┘                                          │
  │       │              │                                                │
  │  ┌────┴──────────────┴────┐                                          │
  │  │      BMS 2S             │  ← ป้องกันชาร์จเกิน/จ่ายเกิน/ลัดวงจร  │
  │  │  B-   BM   B+          │                                          │
  │  │  P-        P+          │                                          │
  │  └──┬─────────┬──────────┘                                          │
  │     │         │                                                       │
  │     │    ┌────┴────┐                                                  │
  │     │    │ 1N5822  │  ← Schottky Diode กันต่อขั้วกลับ               │
  │     │    └────┬────┘                                                  │
  │     │         │                                                       │
  │     │    ┌────┴────┐                                                  │
  │     │    │ Switch  │  ← สวิตช์เปิด-ปิดระบบ                          │
  │     │    └────┬────┘                                                  │
  │     │         │                                                       │
  │     │         ├──┬──────────────────────────┐                         │
  │     │         │  │                          │                         │
  │     │    ┌────┴──┴───────────────┐     ┌────┴──────────────────┐      │
  │     │    │ Buck Converter #1     │     │ Buck Converter #2     │      │
  │     │    │ LM2596 (ตั้ง 5.0V)     │     │ LM2596 (ตั้ง 3.3V)     │      │
  │     └────│ IN-          OUT- ────│──┬──│ IN-          OUT- ────│──┬── GND ราง Breadboard
  │          │ IN+          OUT+ ────│─┐│  │ IN+          OUT+ ────│─┐│   │
  │          └───────────────────────┘ ││  └───────────────────────┘ ││   │
  │                                    ││                            ││   │
  │                              ┌─────┴┴────┐                       ││   │
  │                              │  Fuse 3A  │                       ││   │
  │                              └─────┬┬────┘                       ││   │
  │                                    ││                            ││   │
  │                         ═══════════╪╪══════             ═════════╪╪════
  │                         ║  5V Rail ║║                   ║ 3.3V Rail║║ 
  │                         ═══════════╪╪══════             ═════════╪╪════
  │                                    ││                            ││
  │         ┌──────────────────────────┤│         ┌──────────────────┤│
  │         │ [100µF Cap] ขนาน 5V-GND ││         │ [100µF Cap] 3.3V ││
  │         └──────────────────────────┤│         └──────────────────┤│
  │                                    ││                            ││
  │         5V ──┬── ESP32 VIN ────────┘│  3.3V ──┬── DHT22 VCC ─────┘│
  │              │ [100nF Cap ที่ VIN]   │         │                   │
  │              │                      │         ├── CCS811 VCC      │
  │              ├── MQ-2 VCC           │         │ [100nF Cap]       │
  │              ├── MQ-3 VCC           │         │                   │
  │              ├── MQ-135 VCC         │         └── Pull-up 4.7kΩ   │
  │              ├── MiCS-6814 VCC      │                             │
  │              │                      │                             │
  │              ├── PMS5003 VCC        │                             │
  │              │ [100nF Cap ที่ VCC]   │                             │
  │              │                      │                             │
  │              ├── Relay Module VCC   │                             │
  │              │                      │                             │
  │              └── Relay NO ── พัดลม x2 │                             │
  │                                     │                             │
  │         GND ──── ทุกอุปกรณ์ (Common Ground สำคัญมาก!) ────────────┘
  └───────────────────────────────────────────────────────────────────────┘
```

### ลำดับการไหลของไฟ (ซ้ายไปขวา)

```
  แบต 18650 → BMS 2S → Diode 1N5822 → Switch ─┬→ Buck LM2596 #1 (5V) → Fuse 3A → ราง 5V
                                              │
                                              └→ Buck LM2596 #2 (3.3V) → ราง 3.3V
```

### Safety Summary — ป้องกันทุกจุด

| ชั้นป้องกัน | อุปกรณ์ | ป้องกันอะไร |
|---|---|---|
| 🔋 ชั้นที่ 1 — แบตเตอรี่ | **BMS 2S** | ชาร์จเกิน, จ่ายหมด, ลัดวงจร, กระแสเกิน |
| 🔁 ชั้นที่ 2 — ขั้วกลับ | **Schottky Diode 1N5822** | ต่อขั้วแบตผิด (+/- สลับ) |
| 🔘 ชั้นที่ 3 — ตัดไฟ | **Toggle/Rocker Switch** | เปิด-ปิดระบบโดยไม่ต้องถอดแบต |
| ⚡ ชั้นที่ 4 — แรงดัน | **Buck Converter LM2596** | ลด 7.4V → 5V เสถียร |
| 🔥 ชั้นที่ 5 — กระแสเกิน | **Fuse 3A** | ลัดวงจรในฝั่ง 5V (ฟิวส์ขาดก่อนวงจรพัง) |
| 📡 ชั้นที่ 6 — สัญญาณรบกวน | **Decoupling Caps** | กรอง Noise จากฮีตเตอร์/มอเตอร์ |
| 📏 ชั้นที่ 7 — แรงดัน GPIO | **Voltage Divider** | ลด 5V AOUT → 3.3V ก่อนเข้า ADC |

---

## 📊 สรุป Pin Usage Map ของ ESP32

```
  ESP32-WROOM-32U DevKit
  ═══════════════════════════════════════════════════
  
  ขาที่ใช้แล้ว (16 ขา):
  ──────────────────────────
  GPIO 13 ↔ I2C SCL (ADS1115)        [I2C Bus #2 — Software]
  GPIO 16 ← PMS5003 TX (UART2 RX)   [UART2 RX]
  GPIO 17 → PMS5003 RX (UART2 TX)   [UART2 TX]
  GPIO 21 ↔ I2C SDA (CCS811)        [I2C Bus #1 — Hardware]
  GPIO 22 ↔ I2C SCL (CCS811)        [I2C Bus #1 — Hardware]
  GPIO 23 → PMS5003 SET             [Digital OUT]
  GPIO 25 → Relay IN1 (Intake Fan)  [Digital OUT]
  GPIO 26 → Relay IN2 (Exhaust Fan) [Digital OUT]
  GPIO 27 ← DHT22 DATA              [Digital IN]
  GPIO 32 ↔ I2C SDA (ADS1115)       [I2C Bus #2 — Software]
  GPIO 33 ← MQ-2 AOUT               [ADC1_CH5]
  GPIO 34 ← MQ-8 AOUT               [ADC1_CH6]
  GPIO 36 ← MQ-3 AOUT               [ADC1_CH0]
  GPIO 39 ← MQ-135 AOUT             [ADC1_CH3]
  
  ขาที่ยังว่าง (Safe GPIOs):
  ──────────────────────────
  GPIO 4   → ว่าง (Safe GPIO — แนะนำสำรองไว้)
  GPIO 14  → ว่าง (ADC2 / Strapping — ใช้เป็น Digital ได้แต่ระวังบูต)
  GPIO 18  → ว่าง (⚠️ VSPI CLK — ทดสอบแล้ว I2C ใช้ไม่ได้บนบอร์ดนี้)
  GPIO 19  → ว่าง (⚠️ VSPI MISO — ทดสอบแล้ว I2C ใช้ไม่ได้บนบอร์ดนี้)
  
  ขาที่ห้ามใช้:
  ──────────────────────────
  GPIO 0   → Strapping (Boot mode)
  GPIO 1   → UART0 TX (USB Serial Monitor)
  GPIO 2   → Strapping (On-board LED บางบอร์ด)
  GPIO 3   → UART0 RX (USB Serial Monitor)
  GPIO 5   → Strapping (PWM at boot)
  GPIO 6-11 → SPI Flash (ห้ามแตะ!)
  GPIO 12  → Strapping (boot fail ถ้า HIGH)
  GPIO 15  → Strapping (debugging)
```

---

## 🛒 รายการอุปกรณ์เสริมที่ต้องเตรียมทั้งหมด

### อุปกรณ์หลัก (เซ็นเซอร์ & แอคชูเอเตอร์)

| # | รายการ | จำนวน |
|---:|---|---:|
| 1 | ESP32-WROOM-32U + เสาอากาศ IPEX | 1 ชุด |
| 2 | DHT22 / AM2302 | 1 ตัว |
| 3 | CCS811 Module | 1 ตัว |
| 4 | MiCS-6814 Module | 1 ตัว |
| 5 | PMS5003 | 1 ตัว |
| 6 | MQ-2 Module | 1 ตัว |
| 7 | MQ-3 Module | 1 ตัว |
| 8 | MQ-135 Module | 1 ตัว |
| 9 | 2-Channel Relay Module (2PH6391A) | 1 ตัว |
| 10 | พัดลม 40mm 5V DC | 2 ตัว |

### ระบบจ่ายไฟ & Safety

| # | รายการ | จำนวน | หมายเหตุ |
|---:|---|---:|---|
| 11 | รางถ่าน 18650 x2 อนุกรม | 1 ราง | |
| 12 | เซลล์ 18650 (Matched pair) | 2 ก้อน | ยี่ห้อเดียวกัน ความจุเท่ากัน |
| 13 | BMS 2S (3A+) | 1 ตัว | ป้องกันแบต |
| 14 | Schottky Diode 1N5822 (3A) | 1 ตัว | กันต่อขั้วกลับ |
| 15 | Toggle/Rocker Switch (3A) | 1 ตัว | เปิด-ปิดระบบ |
| 16 | Buck Converter LM2596 | 1 ตัว | ลด 7.4V → 5V |
| 17 | Fuse 3A + ซองฟิวส์ | 1 ชุด | กันลัดวงจรฝั่ง 5V |
| 18 | ตัวเก็บประจุ 100µF Electrolytic | 1 ตัว | กรอง Noise ราง 5V หลัก |
| 19 | ตัวเก็บประจุ 100nF Ceramic | 3 ตัว | Decoupling ที่ ESP32, CCS811, PMS5003 |

### ตัวต้านทาน & อุปกรณ์ประกอบ

| # | รายการ | จำนวน | หมายเหตุ |
|---:|---|---:|---|
| 20 | ตัวต้านทาน 10kΩ | 7 ตัว | Voltage Divider R1 (MQ x4 + MiCS x3) |
| 21 | ตัวต้านทาน 15kΩ | 7 ตัว | Voltage Divider R2 (MQ x4 + MiCS x3) |
| 22 | ตัวต้านทาน 4.7kΩ | 1 ตัว | Pull-up DHT22 DATA |
| 23 | สาย Jumper / Dupont | ~30 เส้น | Male-Male และ Male-Female |
| 24 | Breadboard | 1-2 แผ่น | สำหรับต้นแบบ |

---

## ⚡ ข้อควรระวังเพิ่มเติมสำหรับขั้นตอนทดลอง

1. **ตั้ง Buck Converter ก่อนต่ออุปกรณ์** — ต่อแบต → วัด OUT ด้วยมัลติมิเตอร์ → หมุน Pot จนได้ 5.00V → ค่อยเสียบเซ็นเซอร์
2. **ต่อ Voltage Divider ก่อนจ่ายไฟทุกครั้ง** — ถ้าลืมต่อแล้วเสียบ MQ/MiCS ตรงเข้า ESP32 จะเกิน 3.3V ทันที
3. **Common Ground สำคัญมาก** — GND ของ ESP32, เซ็นเซอร์, Relay, และพัดลมต้องเชื่อมถึงกันทั้งหมด
4. **ลำดับการ Burn-in:**
   - MQ-2, MQ-3, MQ-135: เปิดทิ้งไว้ **24-48 ชม.** ก่อนใช้งานครั้งแรก
   - CCS811: Burn-in **48 ชม.** + Run-in **20 นาที** หลังเปิดเครื่องทุกครั้ง
   - MiCS-6814: Warm-up **120 นาที** หลังเปิดเครื่องทุกครั้ง
5. **ทดสอบทีละตัว** — ต่อเซ็นเซอร์ทีละชิ้น เขียนโค้ดทดสอบชิ้นนั้นก่อน ค่อยเพิ่มทีละชิ้น
6. **PMS5003 ต้องรอ 30 วินาที** หลังเปิดก่อนอ่านค่าที่เสถียร
7. **ต่อเสาอากาศ IPEX ก่อนเปิด Wi-Fi เสมอ** — ป้องกัน RF Amplifier เสียหาย

