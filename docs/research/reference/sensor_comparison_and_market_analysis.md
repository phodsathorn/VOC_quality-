# 📊 วิเคราะห์เซ็นเซอร์: การลด MQ Sensor, เซ็นเซอร์ทดแทน และเซ็นเซอร์ในเครื่องวัดเชิงพาณิชย์

เอกสารนี้รวบรวมข้อมูลเชิงลึกเกี่ยวกับ:
1. ข้อจำกัดของเซ็นเซอร์ตระกูล MQ ในการแยกชนิดสารและบอกปริมาณ
2. เซ็นเซอร์ดิจิทัลรุ่นใหม่ที่สามารถใช้ทดแทนได้
3. เซ็นเซอร์ที่ใช้จริงในเครื่องวัดคุณภาพอากาศเชิงพาณิชย์ (Air Quality Monitor) ในท้องตลาด
4. แนวทางสำหรับโปรเจกต์ Adaptive E-Nose

---

## 1. 🔬 ความจริงเกี่ยวกับการ "แยกชนิดสาร" และ "บอกปริมาณ"

### 1.1 ระดับความสามารถในการแยกสารของเซ็นเซอร์แต่ละประเภท

| เทคโนโลยี | แยกชนิดสารได้? | บอกปริมาณ (ppm) ได้? | ราคาโดยประมาณ | ใช้ในงาน |
|---|:---:|:---:|---|---|
| **GC-MS** (Gas Chromatography - Mass Spectrometry) | ✅ แยกได้รายตัว | ✅ แม่นยำมาก (ppb-ppm) | หลายแสน – หลายล้านบาท | ห้องปฏิบัติการ, งานวิจัย |
| **PID** (Photoionization Detector) | ❌ วัดรวม Total VOC | ✅ แม่นยำ (ppb-ppm) | 15,000 – 150,000 บาท | อุตสาหกรรม, ตรวจรั่ว |
| **FID** (Flame Ionization Detector) | ❌ วัดรวม Hydrocarbon | ✅ แม่นยำ | สูงมาก | โรงงาน, ปล่อยมลพิษ |
| **NDIR** (Non-Dispersive Infrared) | ✅ เจาะจง CO2 ตัวเดียว | ✅ แม่นยำ (±30-50 ppm) | 500 – 3,000 บาท | อาคาร, ห้องเรียน |
| **Electrochemical Cell** | ✅ เจาะจงแก๊สเฉพาะ (CO, NO2, O3) | ✅ ดี (ppm) | 1,000 – 10,000 บาท | อุตสาหกรรม, ความปลอดภัย |
| **MOX Digital** (SGP41, BME688, ENS160) | ❌ วัดรวม VOC Index / IAQ Index | ⚠️ เป็น Index ไม่ใช่ ppm จริง | 200 – 800 บาท | IoT, Smart Home, IAQ |
| **MOX Analog** (MQ Series) | ❌ วัดรวม, cross-sensitive สูงมาก | ❌ ค่าไม่แม่นยำ (สัมพัทธ์) | 50 – 200 บาท | งาน Hobby, สัญญาณเตือน |
| **E-Nose Array** (MOX หลายตัว + ML) | ⚠️ จำแนก "กลุ่ม" ได้ด้วย ML | ⚠️ Semi-quantitative | รวม 1,000 – 5,000 บาท | งานวิจัย, ต้นแบบ |

### 1.2 สรุปข้อจำกัดที่สำคัญ

> **⚠️ ไม่มีเซ็นเซอร์ MOX ตัวใด (ไม่ว่า MQ หรือ SGP41 หรือ BME688) ที่สามารถ "แยกชนิดสารเคมีแต่ละตัว" ออกมาได้อย่างแม่นยำด้วยตัวมันเอง**
>
> เหตุผลคือ MOX ทุกตัวมี **Cross-sensitivity** — มันเปลี่ยนค่าความต้านทานเมื่อเจอแก๊สหลายชนิดพร้อมกัน โดยไม่สามารถแยกแยะได้ว่าสัญญาณที่เปลี่ยนมาจากแก๊สตัวไหน

> **✅ แต่สิ่งที่ทำได้:** ใช้ **E-Nose Array (เซ็นเซอร์หลายตัว + Machine Learning)** เพื่อจำแนก "ลายนิ้วมือ" (Pattern/Fingerprint) ของส่วนผสมแก๊สที่ต่างกัน → ซึ่งคือสิ่งที่โปรเจกต์ Adaptive E-Nose ของเรากำลังทำอยู่

---

## 2. 🏪 เซ็นเซอร์ที่ใช้ในเครื่องวัดคุณภาพอากาศเชิงพาณิชย์

### 2.1 เครื่องวัดระดับผู้บริโภค / สำนักงาน (Consumer / Office Grade)

| ยี่ห้อ / รุ่น | ราคาโดยประมาณ | เซ็นเซอร์ฝุ่น (PM) | เซ็นเซอร์ CO2 | เซ็นเซอร์ VOC | เซ็นเซอร์อุณหภูมิ/ความชื้น | หมายเหตุ |
|---|---|---|---|---|---|---|
| **AirGradient ONE** | ~$150 | Plantower **PMS5003** | SenseAir **S8** (NDIR) | Sensirion **SGP41** | Sensirion **SHT40** | Open-source, แม่นยำสูง, นิยมมากในชุมชน DIY |
| **Awair Element** | ~$150 | Honeywell **HPM Series** | Telaire **T6703-5K** (NDIR) | MOX (CMOS-based) | CMOS Integrated | ดีไซน์สวย, 5-in-1 |
| **IQAir AirVisual Pro** | ~$260 | Laser Scattering (Proprietary) | NDIR (Proprietary) | — | Integrated | ระดับ Pro, ข้อมูลเมือง |
| **Qingping Air Monitor** | ~$80 | GrandWay / Laser | SenseAir / Sensirion (NDIR) | Sensirion | Sensirion | ราคาดี, มาตรฐานสูง |
| **Aranet4** | ~$200 | — | NDIR (High-precision) | — | Integrated | เน้น CO2, แบตอึด, BLE |
| **uHoo** | ~$300 | Laser Scattering | NDIR | MOX (TVOC) | Integrated | 9-in-1, วัดได้ครบ (CO, NO2, O3) |

### 2.2 เครื่องวัดระดับอุตสาหกรรม / มืออาชีพ (Professional / Industrial Grade)

| ยี่ห้อ / รุ่น | เซ็นเซอร์หลัก | เทคโนโลยี | จุดเด่น |
|---|---|---|---|
| **TSI AirAssure™** | Laser PM, NDIR CO2, EC cells | Multi-technology | Cloud-based, OSHA compliance |
| **Aeroqual Series 500** | **PID** (Photoionization) + MOX | PID + MOS | วัด VOC ได้ระดับ ppb, แม่นยำสูง |
| **RAE Systems MiniRAE** | **PID** | Photoionization | มาตรฐานอุตสาหกรรม, ตรวจจับสารเคมีรั่ว |
| **Sensirion SEN55 Module** | PM + VOC + NOx + T + RH | All-in-one | ใช้ในผลิตภัณฑ์ OEM มากมาย |
| **Pressac IAQ** | Multi-sensor | MOX + NDIR | RESET-accredited, Smart Building |

### 2.3 สรุป: เซ็นเซอร์ยอดนิยมที่ใช้มากที่สุดในตลาด

```
🏆 อันดับความนิยมของเซ็นเซอร์ในเครื่องวัดเชิงพาณิชย์:

ฝุ่น (PM):
  1. Plantower PMS5003 / PMS7003  ← นิยมที่สุด (ราคาถูก, ข้อมูลวิจัยเยอะ)
  2. Sensirion SPS30              ← แม่นยำ, อายุยาว, มี HEPA filter ภายใน
  3. Honeywell HPM Series         ← ระดับ Premium

CO2:
  1. SenseAir S8 (NDIR)           ← มาตรฐานอุตสาหกรรม, แม่นยำ
  2. Sensirion SCD41 (NDIR)       ← ขนาดเล็กจิ๋ว, I2C
  3. Telaire T6703 (NDIR)         ← ใช้ใน Awair

VOC:
  1. Sensirion SGP41              ← ดีที่สุดในระดับราคา, VOC + NOx Index
  2. Sensirion SGP30              ← รุ่นก่อนหน้า, ยังนิยม
  3. ScioSense ENS160             ← ทดแทน CCS811, มี AQI ในตัว
  4. Bosch BME688                 ← 4-in-1, trainable AI
  ❌ MQ Series                   ← ไม่มีเครื่องวัดเชิงพาณิชย์ยี่ห้อไหนใช้เลย

อุณหภูมิ/ความชื้น:
  1. Sensirion SHT40 / SHT31      ← มาตรฐาน
  2. Bosch BME280                 ← ราคาถูก, ครบ T/H/P
```

> **📌 สังเกต:** ไม่มีเครื่องวัดคุณภาพอากาศเชิงพาณิชย์ยี่ห้อใดในตลาดที่ใช้เซ็นเซอร์ตระกูล MQ เลย
> เพราะ MQ มีข้อเสียหลายอย่าง: กินไฟสูง (ต้องใช้ Heater), ค่าไม่แม่นยำ, ต้อง Burn-in นาน, มี Drift สูง, และให้แค่สัญญาณ Analog ที่ต้องแปลงเอง

---

## 3. 🔄 เปรียบเทียบ: MQ Series vs เซ็นเซอร์ดิจิทัลรุ่นใหม่

### 3.1 ตาราง Head-to-Head

| คุณสมบัติ | MQ Series (MQ-2, MQ-3, MQ-135) | SGP41 (Sensirion) | ENS160 (ScioSense) | BME688 (Bosch) |
|---|---|---|---|---|
| **ประเภทสัญญาณ** | Analog (ต้องใช้ ADC) | Digital I2C | Digital I2C | Digital I2C/SPI |
| **วัดอะไร** | แก๊สรวมๆ (cross-sensitive) | VOC Index + NOx Index | TVOC + eCO2 + AQI | T + H + P + Gas Resistance |
| **ความแม่นยำ** | ❌ ต่ำ (indicative only) | ✅ ดี (มี baseline correction) | ✅ ดี (มี AI ในชิป) | ✅ ดี (trainable) |
| **Calibration** | ต้องทำเอง, ยาก | อัตโนมัติภายในชิป | อัตโนมัติภายในชิป | ต้อง Train ผ่าน Bosch AI Studio |
| **ขนาด** | ❌ ใหญ่ (~16mm ∅ ต่อตัว) | ✅ เล็กจิ๋ว (2.44 x 2.44 mm) | ✅ เล็ก (3 x 3 mm) | ✅ เล็ก (3 x 3 mm) |
| **กินไฟ** | ❌ สูงมาก (~750-900 mW/ตัว) | ✅ ต่ำ (~3 mW) | ✅ ต่ำ (~27 mW) | ✅ ต่ำ (~12 mW) |
| **Warm-up** | 24-48 ชม. (Burn-in ครั้งแรก) | ไม่กี่นาที | ไม่กี่นาที | ไม่กี่นาที |
| **อายุการใช้งาน** | ~2-5 ปี (Heater เสื่อม) | ~10 ปี | ~10 ปี | ~10 ปี |
| **ราคา (โมดูล)** | 50-200 ฿/ตัว | ~250-400 ฿ | ~200-350 ฿ | ~300-500 ฿ |
| **รวมกินไฟ (3 ตัว MQ)** | ~2.4 W | — | — | — |
| **ใช้ในเครื่องเชิงพาณิชย์** | ❌ ไม่มียี่ห้อไหนใช้ | ✅ AirGradient, Qingping ฯลฯ | ✅ ใช้แทน CCS811 | ✅ Bosch products |

### 3.2 เปรียบเทียบเชิงภาพ: ขนาด & พลังงาน

```
ขนาดทางกายภาพ:
┌─────────────────────┐
│    MQ-2 Module       │  ~32mm x 22mm x 16mm (ต่อตัว)
│    ██████████████     │  × 3 ตัว = พื้นที่รวม ~20 cm²
│    ██████████████     │
└─────────────────────┘

        vs.

┌────────┐
│ SGP41  │  2.44mm x 2.44mm x 0.85mm (เล็กกว่า MQ ~170 เท่า!)
│  ██    │
└────────┘

กำลังไฟเปรียบเทียบ:
MQ-2 + MQ-3 + MQ-135  =  ~2,400 mW  ████████████████████████
SGP41                  =  ~3 mW      █
ENS160                 =  ~27 mW     █
BME688                 =  ~12 mW     █
                                     ↑
                            ประหยัดไฟกว่า ~800 เท่า!
```

---

## 4. 🏭 เซ็นเซอร์สำหรับการตรวจจับ VOC ในงานอุตสาหกรรม (ห้องพ่นสี)

สำหรับโปรเจกต์ที่เน้นตรวจจับ VOC ในห้องพ่นสีฝุ่น (Powder Coating Booth) โดยเฉพาะ:

### 4.1 ข้อเท็จจริง: Powder Coating vs Liquid Painting

| | Powder Coating (พ่นสีฝุ่น) | Liquid Painting (พ่นสีน้ำ/ทินเนอร์) |
|---|---|---|
| **VOC Emission** | ต่ำมาก – แทบไม่มี | สูงมาก (ทินเนอร์ระเหย) |
| **สิ่งที่ต้องจับหลัก** | ฝุ่นสี (PM), ฝุ่นโลหะ | VOC, ควัน, ไอระเหย |
| **อันตราย** | ฝุ่นระเบิด (Dust Explosion) | สารเคมีพิษ (Toluene, Xylene) |

### 4.2 เซ็นเซอร์ที่เหมาะกับแต่ละสถานการณ์

| สถานการณ์ | เซ็นเซอร์ที่แนะนำ | เหตุผล |
|---|---|---|
| วัดฝุ่นสี PM2.5/PM10 | **PMS5003** หรือ **SPS30** | Laser scattering, ราคาเหมาะสม |
| วัด VOC รวม (TVOC) | **SGP41** หรือ **ENS160** | ดิจิทัล, เสถียร, กินไฟต่ำ |
| วัด VOC แม่นยำ (ppb) | **PID Sensor** (เช่น Alphasense PID-AH2) | มาตรฐานอุตสาหกรรม แต่ราคาสูง |
| วัด CO2 (ระบายอากาศ) | **SenseAir S8** หรือ **SCD41** | NDIR, แม่นยำ |
| วัด CO / NO2 เฉพาะตัว | **Electrochemical Cell** (เช่น Alphasense CO-B4) | เจาะจงแก๊สเดียว, แม่นยำ |
| จำแนกประเภทแก๊ส (E-Nose) | **MOX Array + ML** (แนวทางของโปรเจกต์เรา) | ใช้ Pattern Recognition |

---

## 5. 🧠 E-Nose Array: วิธีเดียวที่ "แยกชนิดสาร" ได้ในราคา DIY

### 5.1 หลักการทำงาน

```
                    E-Nose Array
    ┌─────────────────────────────────────────┐
    │                                         │
    │  Sensor 1 (MiCS-6814 RED → CO)    ──┐  │
    │  Sensor 2 (MiCS-6814 OX  → NO2)  ──┤  │
    │  Sensor 3 (MiCS-6814 NH3 → NH3)  ──┤  │     ┌──────────────┐
    │  Sensor 4 (MQ-135 → Broad VOC)   ──┼──┼────→│  ML Model    │
    │  Sensor 5 (CCS811 → TVOC/eCO2)   ──┤  │     │  (TFLite)    │
    │  Sensor 6 (DHT22 → Temp/Hum)     ──┤  │     │              │
    │  Sensor 7 (PMS5003 → PM2.5)      ──┘  │     │  Output:     │
    │                                         │     │  • ชนิดสาร    │
    │  แต่ละเซ็นเซอร์ตอบสนองต่อแก๊สต่างกัน    │     │  • ระดับอันตราย │
    │  → สร้าง "ลายนิ้วมือ" เฉพาะตัว           │     │  • ความเชื่อมั่น │
    └─────────────────────────────────────────┘     └──────────────┘
```

### 5.2 ทำไม E-Nose + ML ถึงแยกสารได้ (ในระดับหนึ่ง)

แม้เซ็นเซอร์แต่ละตัวจะมี Cross-sensitivity แต่เมื่อ **ใช้หลายตัวพร้อมกัน** แต่ละตัวจะมี **สัดส่วนการตอบสนอง (Selectivity)** ที่ต่างกัน:

| | MiCS RED | MiCS OX | MiCS NH3 | MQ-135 | CCS811 |
|---|:---:|:---:|:---:|:---:|:---:|
| **ทินเนอร์ (Toluene)** | ▲▲▲ | ▲ | ▲ | ▲▲▲▲ | ▲▲ |
| **แอลกอฮอล์ (Ethanol)** | ▲▲ | ▲ | ▲ | ▲▲▲ | ▲▲ |
| **แอมโมเนีย (NH3)** | ▲ | ▲ | ▲▲▲▲ | ▲▲ | ▲ |
| **ควัน (Smoke)** | ▲▲▲ | ▲▲ | ▲ | ▲▲ | ▲▲▲ |
| **ไอเสียรถ (CO/NO2)** | ▲▲▲▲ | ▲▲▲▲ | ▲ | ▲ | ▲ |

> ▲ = ระดับการตอบสนอง (มากขึ้น = ตอบสนองแรงกว่า)

ML จะเรียนรู้ว่า "ถ้า MiCS NH3 สูงมาก แต่ MiCS OX ต่ำ → น่าจะเป็นแอมโมเนีย" หรือ "ถ้า MQ-135 + MiCS RED สูงพร้อมกัน → น่าจะเป็นทินเนอร์" เป็นต้น

### 5.3 ระดับความแม่นยำที่คาดหวังได้จาก E-Nose

| ระดับ | สามารถทำได้? | ตัวอย่าง |
|---|:---:|---|
| **Classification (จำแนกประเภท)** | ✅ ทำได้ดี (80-95%+) | "นี่คือไอทินเนอร์" vs "นี่คือควัน" vs "อากาศปกติ" |
| **Semi-Quantitative (บอกระดับคร่าวๆ)** | ⚠️ พอได้ | "ระดับต่ำ / ปานกลาง / สูง / อันตราย" |
| **Quantitative (บอก ppm แม่นยำ)** | ❌ ยาก | ต้องสอบเทียบกับเครื่อง PID/GC ทุกครั้ง |

---

## 6. 💡 แนวทางสำหรับโปรเจกต์ของเรา

### 6.1 แผน A: ลด MQ ลง เหลือ Array ที่กะทัดรัด (แนะนำสำหรับ Phase 1)

**ตัดออก:** MQ-2, MQ-3, MQ-8
**เหลือไว้:** MQ-135 (Broad VOC), MiCS-6814 (3 ch), CCS811

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ ลดขนาดลงมาก | ❌ ยังต้องใช้ Heater (MQ-135) |
| ✅ ประหยัดไฟ ~1.5W | ❌ MQ-135 ยังกินไฟ ~750mW |
| ✅ ลดความซับซ้อนวงจร | ❌ ความแม่นยำยังต่ำกว่า Digital |
| ✅ ยังแสดงผลงาน ML Pipeline ได้ | |
| ✅ ช่องสัญญาณ 5 ช่องเพียงพอ | |

### 6.2 แผน B: อัปเกรดเป็นดิจิทัลทั้งหมด (สำหรับ Phase 2)

**ตัดออก:** MQ ทั้งหมด + CCS811
**ใช้แทน:** SGP41 + MiCS-6814 + SEN55

| เซ็นเซอร์ใหม่ | แทนอะไร | วัดอะไร | ขนาด | ไฟ |
|---|---|---|---|---|
| **SGP41** | MQ-135 + CCS811 | VOC Index + NOx Index | เล็กจิ๋ว | ~3 mW |
| **MiCS-6814** | (เก็บไว้) | CO + NO2 + NH3 (3 ch) | เดิม | ~600 mW |
| **SEN55** | PMS5003 + DHT22 | PM1/2.5/4/10 + VOC + T + H | เล็กกว่า | ~63 mW |

### 6.3 แผน C: Full Digital + High Accuracy (สำหรับ Production)

| เซ็นเซอร์ | วัดอะไร | เทคโนโลยี | ราคา |
|---|---|---|---|
| **SEN55** | PM + VOC + NOx + T + H | All-in-one | ~1,200 ฿ |
| **SCD41** | CO2 (แม่นยำ) | NDIR | ~1,000 ฿ |
| **SGP41** | VOC Index + NOx Index (เสริม) | Digital MOX | ~300 ฿ |
| **Alphasense PID-AH2** | Total VOC (ppb accuracy) | PID | ~5,000 ฿ |

---

## 7. 📚 แหล่งอ้างอิง

### เอกสารเทคนิค (Datasheets)
- [Sensirion SGP41 Datasheet](https://sensirion.com/products/catalog/SGP41/)
- [Sensirion SEN55 Datasheet](https://sensirion.com/products/catalog/SEN55/)
- [Sensirion SCD41 Datasheet](https://sensirion.com/products/catalog/SCD41/)
- [ScioSense ENS160 Datasheet](https://www.sciosense.com/products/environmental-sensors/ens160/)
- [Bosch BME688 Datasheet](https://www.bosch-sensortec.com/products/environmental-sensors/gas-sensors/bme688/)
- [SenseAir S8 Datasheet](https://senseair.com/product/s8-residential/)

### เครื่องวัดเชิงพาณิชย์
- [AirGradient ONE - Sensor Specs](https://www.airgradient.com/)
- [Awair Element - Teardown](https://www.awair.me)
- [Aranet4 - Technical Specs](https://aranet.com/products/aranet4/)

### งานวิจัย E-Nose ที่เกี่ยวข้อง
- Electronic Nose sensor arrays using MOX with ML for gas classification (IEEE, MDPI Sensors)
- Temperature-cycled MOX sensor arrays for improved gas discrimination
- Calibration transfer methods for portable E-Nose devices

---

## 8. ✅ สรุป

1. **เครื่องวัดเชิงพาณิชย์ไม่มียี่ห้อใดใช้ MQ** — ทั้งหมดใช้ Sensirion SGP series, SenseAir NDIR, Plantower PMS series
2. **การแยกชนิดสารต้องใช้ E-Nose Array + ML** — ซึ่งคือสิ่งที่โปรเจกต์เราทำอยู่แล้ว
3. **การบอกปริมาณ ppm ที่แม่นยำ** ต้องใช้ PID หรือ Electrochemical Cell ซึ่งราคาสูง
4. **สำหรับ Phase 1:** ลด MQ เหลือ 1 ตัว (MQ-135) ร่วมกับ MiCS-6814 + CCS811 เป็น E-Nose Array 5 ช่อง → เพียงพอสำหรับ ML Classification
5. **สำหรับ Phase 2:** อัปเกรดเป็น SGP41 + SEN55 + MiCS-6814 → ขนาดเล็กลง กินไฟน้อยลง แม่นยำขึ้น
