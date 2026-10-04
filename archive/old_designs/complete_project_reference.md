# 📘 โปรเจคจบ: ระบบตรวจวัดคุณภาพอากาศห้องพ่นสีฝุ่น
## E-Nose + Machine Learning + IoT บน ESP32-S31

> **เอกสารรวมข้อมูลทั้งหมด (Complete Project Reference)**
> สรุปจากการศึกษาและวิเคราะห์ระบบ ณ วันที่ 5 กรกฎาคม 2569

---

# สารบัญ

1. [ภาพรวมโครงการ](#1-ภาพรวมโครงการ)
2. [มาตรฐานความปลอดภัยที่เกี่ยวข้อง](#2-มาตรฐานความปลอดภัยที่เกี่ยวข้อง)
3. [ค่าที่ต้องวัดและเกณฑ์มาตรฐาน](#3-ค่าที่ต้องวัดและเกณฑ์มาตรฐาน)
4. [Sensor ทั้งหมด — หลักการทำงานและ Datasheet](#4-sensor-ทั้งหมด--หลักการทำงานและ-datasheet)
5. [เปรียบเทียบ Microcontroller Board](#5-เปรียบเทียบ-microcontroller-board)
6. [สถาปัตยกรรมระบบ E-Nose](#6-สถาปัตยกรรมระบบ-e-nose)
7. [Machine Learning Pipeline](#7-machine-learning-pipeline)
8. [การส่งข้อมูลและปัญหากล่องโลหะ](#8-การส่งข้อมูลและปัญหากล่องโลหะ)
9. [ระบบจ่ายไฟ (Power Supply)](#9-ระบบจ่ายไฟ-power-supply)
10. [Logic การตัดสินใจ](#10-logic-การตัดสินใจ)
11. [การส่งข้อมูลออกภายนอก (Web / LINE OA)](#11-การส่งข้อมูลออกภายนอก)
12. [รายการอุปกรณ์และงบประมาณ](#12-รายการอุปกรณ์และงบประมาณ)
13. [คีย์เวิร์ดสำหรับค้นงานวิจัย](#13-คีย์เวิร์ดสำหรับค้นงานวิจัย)
14. [งานวิจัย IEEE ที่เกี่ยวข้อง](#14-งานวิจัย-ieee-ที่เกี่ยวข้อง)
15. [แผนการพัฒนา (Timeline)](#15-แผนการพัฒนา-timeline)
16. [ความรู้เพิ่มเติมที่จำเป็น](#16-ความรู้เพิ่มเติมที่จำเป็น)

---

# 1. ภาพรวมโครงการ

ระบบตรวจวัดคุณภาพอากาศอัตโนมัติสำหรับห้องพ่นสีฝุ่น (Powder Coating Booth) ก่อนปล่อยอากาศสู่ภายนอก โดยใช้สถาปัตยกรรม **Adaptive E-Nose Platform** ทำงานร่วมกับ **Machine Learning** ที่สามารถ Retrain ปรับตัวให้เข้ากับสารเคมีของแต่ละโรงงานได้ และส่งข้อมูล/อัพเดทโมเดลผ่าน WiFi แบบ Real-time (Over-the-Air Model Update)

**แบ่งเป็น 2 ชุดการทำงาน:**
1. **ชุดทดลอง (Experimental Setup):** ฮาร์ดแวร์ปัจจุบันที่มีอยู่สำหรับใช้เก็บข้อมูล (Phase 0-3) และทดสอบระบบ MVP (ESP32-WROOM-32U + PMS5003 + CCS811 + DHT22 + MQ Array + MiCS-6814)
2. **ชุดจริง (Production Setup):** ฮาร์ดแวร์เป้าหมายสำหรับการนำไปติดตั้งใช้งานจริงในโรงงาน ซึ่งมีความแม่นยำและความทนทานสูงกว่า (ESP32-S31 + SEN55 + SCD41 + MQ Array + MiCS-6814)

**เหตุผลที่ไม่ใช้ BME688:** เนื่องจาก BME688 มี BSEC AI Library สำเร็จรูปในตัว ทำให้ไม่สามารถแสดงผลงานการพัฒนา Machine Learning ด้วยตนเองในโปรเจคจบได้ จึงเปลี่ยนมาใช้ E-Nose Array (MQ Series) แล้ว Train โมเดลเองทั้ง Pipeline

---

# 2. มาตรฐานความปลอดภัยที่เกี่ยวข้อง

| มาตรฐาน | หน่วยงาน | ค่าที่เกี่ยวข้อง |
|---------|-----------|----------------|
| ประกาศกรมโรงงานอุตสาหกรรม (2549) | DIW ไทย | VOC, ฝุ่น PM, CO |
| OSHA PEL (Permissible Exposure Limits) | USA | Toluene, Xylene, Acetone ฯลฯ |
| ACGIH TLV-TWA | USA/Global | สารอินทรีย์ระเหยง่าย |
| WHO Air Quality Guidelines | WHO | PM2.5, PM10, NO2, O3 |
| NFPA 33 (Spray Finishing) | USA | ความเข้มข้น LEL ของสารไวไฟ |

---

# 3. ค่าที่ต้องวัดและเกณฑ์มาตรฐาน

## 3.1 กลุ่มฝุ่น (Particulate Matter)

ห้องพ่นสีฝุ่น (Powder Coating) เป็นกระบวนการ **แห้ง 100% (Dry Process)** ไม่มีการผสมทินเนอร์ในเนื้อสี ใช้หลักการไฟฟ้าสถิต (Electrostatic) พ่นสีฝุ่น

เม็ดสีฝุ่น (Powder Paint) มีขนาดเฉลี่ยประมาณ **30-50 ไมครอน (µm)** (ช่วง 10-100 µm) ซึ่งใหญ่กว่า PM10 จึงตกลงพื้นเร็ว แต่ในกระบวนการพ่นจะมี:
- **Fine Particles:** ฝุ่นละเอียดขนาดเล็กกว่า 10 µm ปะปนมาเสมอ
- **ฝุ่นจากการกระแทก:** เม็ดสีกระแทกกันจนแตกตัวเป็นอนุภาคขนาดเล็ก
- **Suspended Particles:** ฝุ่น PM10/PM2.5 ลอยแขวนลอยในอากาศ ไม่ตกลงพื้น จึงถูกพัดลมดูดออกไปสู่ภายนอก → ตรงนี้แหละที่เราต้องจับ

| พารามิเตอร์ | ค่าจำกัด (DIW/WHO) | หน่วย |
|------------|-------------------|------|
| **PM1.0** | — (reference) | µg/m³ |
| **PM2.5** | ≤ 25 (WHO 24h) | µg/m³ |
| **PM10** | ≤ 50 (WHO 24h) | µg/m³ |
| **TSP** (Total Suspended Particle) | ≤ 330 (DIW) | µg/m³ |

## 3.2 กลุ่ม VOC (Volatile Organic Compounds)

แม้การพ่นสีฝุ่นจะเป็นกระบวนการแห้ง แต่ทินเนอร์/สารละลายยังถูกใช้ในขั้นตอนแวดล้อม เช่น:
- **เช็ดล้างชิ้นงาน (Degreasing):** ก่อนพ่นสี ต้องเช็ดคราบน้ำมันด้วยทินเนอร์
- **ล้างปืนพ่นสี (Equipment Cleaning):** เวลาเปลี่ยนสี ต้องล้างปืนด้วยสารละลาย
- **การลอกสี (Rework/Stripping):** ถ้าพ่นผิด ต้องใช้น้ำยาลอกสีที่มี VOC สูง

| สาร | แหล่งที่มา | ค่า TLV-TWA | หน่วย |
|----|-----------|------------|------|
| **Toluene** | ทินเนอร์, สีสเปรย์ | 20 ppm | ppm |
| **Xylene** | ทินเนอร์, เรซิน | 100 ppm | ppm |
| **Acetone** | ทินเนอร์ | 250 ppm | ppm |
| **Benzene** | ทินเนอร์เก่า | 0.5 ppm (ก่อมะเร็ง!) | ppm |
| **Total VOC (TVOC)** | รวมทุกชนิด | ≤ 300 µg/m³ | µg/m³ |

> **หน่วย ppm คืออะไร?** ย่อมาจาก **"Parts Per Million" (ส่วนในล้านส่วน)** ใช้วัดความเข้มข้นของสสารที่มีปริมาณน้อยมาก เช่น ถ้า CO2 = 1,000 ppm หมายความว่า ในอากาศ 1 ล้านส่วน มี CO2 อยู่ 1,000 ส่วน (= 0.1%)

## 3.3 กลุ่มก๊าซอื่น

| พารามิเตอร์ | ค่าจำกัด | หน่วย |
|------------|---------|------|
| **CO** (Carbon Monoxide) | 25 ppm TWA | ppm |
| **CO2** | ≤ 1000 ppm | ppm |

## 3.4 สภาพแวดล้อม

| พารามิเตอร์ | เหตุผลที่ต้องวัด |
|------------|----------------|
| **อุณหภูมิ (T)** | VOC ระเหยเร็วขึ้นเมื่อร้อน, ส่งผลต่อค่า MQ Sensor |
| **ความชื้น (RH)** | ถ้าชื้นสูง สีฝุ่นจะจับตัวเป็นก้อน, ส่งผลต่อค่า Sensor drift |
| **CO2** | ตัวชี้วัดว่าระบบระบายอากาศทำงานดีหรือไม่ |

---

# 4. Sensor ทั้งหมด — หลักการทำงานและ Datasheet

## 4.1 SEN55 (Sensirion) — ตัววัดฝุ่นสี + VOC + สภาพแวดล้อม

ตัวพระเอกสำหรับวัด **"ฝุ่นสี (PM)"** โดยเฉพาะ

| รายละเอียด | สเปค |
|-----------|------|
| **ผู้ผลิต** | Sensirion (สวิตเซอร์แลนด์) |
| **สิ่งที่วัดได้** | PM1.0, PM2.5, PM4, PM10, VOC Index, NOx Index, อุณหภูมิ, ความชื้น |
| **การเชื่อมต่อ** | I2C |
| **ไฟเลี้ยง** | 4.5V - 5.5V |
| **อายุการใช้งาน** | > 10 ปี |

**หลักการทำงาน — Laser Scattering (การกระเจิงของแสงเลเซอร์):**
- มีพัดลมดูดอากาศเข้าไปในช่องแคบๆ แล้วยิงแสงเลเซอร์ผ่าน
- เมื่อเม็ดฝุ่น (สีฝุ่น) วิ่งผ่านแสงเลเซอร์ แสงจะเกิดการหักเห (กระเจิง) ไปกระทบกับตัวรับภาพ (Photodiode)
- อัลกอริทึมในชิปจะคำนวณขนาดและจำนวนเม็ดฝุ่นจาก "มุมและความเข้มของแสงที่กระเจิง"
- ส่วน VOC/NOx จะใช้เซนเซอร์ MOX (Metal-Oxide) ที่ฝังไว้ในโมดูลเดียวกัน

**ความละเอียด/ความแม่นยำ (จาก Datasheet):**
| ขนาดฝุ่น | ช่วงการวัด | ความคลาดเคลื่อน |
|---------|-----------|----------------|
| PM1.0, PM2.5 | 0 – 1,000 µg/m³ | **±5 µg/m³** (และ ±5% ของค่าวัด) |
| PM4, PM10 | 0 – 1,000 µg/m³ | ±25 µg/m³ |

**ข้อจำกัดด้านขนาดฝุ่น:**
- **ฝุ่นใหญ่กว่า 10 µm:** มักถูกกรองตั้งแต่ช่องทางเข้าเซนเซอร์ (ถ้ารอดเข้าไปได้จะถูกนับรวมใน PM10)
- **ฝุ่นเล็กกว่า 0.3 µm:** เซนเซอร์จะ "ตาบอด" (มองไม่เห็น) เนื่องจากขนาดเล็กกว่าความยาวคลื่นของแสงเลเซอร์ แสงจะทะลุหรืออ้อมผ่านไปเลย
- **ก๊าซ/ไอระเหย (VOC):** มีขนาดระดับ "โมเลกุล" เล็กกว่า 0.3 µm เป็นหมื่นเท่า แสงเลเซอร์ไม่มีทางมองเห็น จึงต้องมีเซนเซอร์จมูก (MQ Series) แยกไว้ต่างหากเพื่อดม

🔗 **Datasheet:** [Sensirion SEN55 Datasheet (PDF)](https://sensirion.com/media/documents/6791ECA0/62A1DDB3/Sensirion_Datasheet_Environmental_Node_SEN5x.pdf)

---

## 4.2 MQ-3 — เซนเซอร์ดมทินเนอร์ (E-Nose ตัวที่ 1)

| รายละเอียด | สเปค |
|-----------|------|
| **ผู้ผลิต** | Winsen (จีน) |
| **ความไวต่อสาร** | แอลกอฮอล์, ทินเนอร์, ไอระเหยสารละลาย |
| **การเชื่อมต่อ** | Analog (ADC) |
| **ไฟเลี้ยง** | 5V (Heater) + 5V (Circuit) |
| **ราคาประมาณ** | 60-80 บาท |

**หลักการทำงาน — Chemiresistor (SnO2 - Tin Dioxide):**
- ตัวเซนเซอร์มีแผ่นฟิล์มดีบุกออกไซด์ (SnO2) บางๆ และแผ่นทำความร้อน (Heater) อยู่ข้างใต้
- ต้องจ่ายไฟ 5V เข้าขา Heater เพื่อให้เซนเซอร์ร้อนจัด (ต้อง Burn-in เปิดทิ้ง 24 ชม. ก่อนใช้จริง)
- เมื่อมีก๊าซทินเนอร์มาเกาะที่ผิว SnO2 จะเกิดการแลกเปลี่ยนอิเล็กตรอน ทำให้ค่าความต้านทานเปลี่ยน
- ปล่อย Voltage ออกทางขา A0 (Analog Out) ตั้งแต่ 0V - 5V ตามความเข้มข้นของก๊าซ
- **MQ-3 ตอบสนองต่อทินเนอร์ได้ดีมาก** เหมาะเป็นตัวหลักในการจำแนก

🔗 **Datasheet:** [MQ-3 Datasheet (PDF)](https://www.winsen-sensor.com/d/files/semiconductor/mq3.pdf)

---

## 4.3 MQ-135 — เซนเซอร์ดมก๊าซพิษรวม (E-Nose ตัวที่ 2)

| รายละเอียด | สเปค |
|-----------|------|
| **ความไวต่อสาร** | ก๊าซพิษรวม, แอมโมเนีย, เบนซีน (VOC) |
| **การเชื่อมต่อ** | Analog (ADC) |
| **ไฟเลี้ยง** | 5V |
| **ราคาประมาณ** | 60-80 บาท |

**หลักการทำงาน:** เหมือน MQ-3 (SnO2 Chemiresistor) แต่ใช้สูตรโลหะออกไซด์ที่ตอบสนองต่อก๊าซพิษคนละชนิด ทำให้ ML สามารถเปรียบเทียบ "ลายเซ็น (Signature)" ของค่า ADC จากเซนเซอร์ MQ แต่ละตัวเพื่อแยกประเภทก๊าซได้

🔗 **Datasheet:** [MQ-135 Datasheet (PDF)](https://www.winsen-sensor.com/d/files/semiconductor/mq135.pdf)

---

## 4.4 MQ-2 — เซนเซอร์จับควันและก๊าซไวไฟ (E-Nose ตัวที่ 3)

| รายละเอียด | สเปค |
|-----------|------|
| **ความไวต่อสาร** | ควัน (Smoke), ก๊าซไวไฟ (LPG, Propane) |
| **การเชื่อมต่อ** | Analog (ADC) |
| **ไฟเลี้ยง** | 5V |
| **ราคาประมาณ** | 60-80 บาท |

**หน้าที่ใน E-Nose:** จับสัญญาณควันหรือความผิดปกติ (Smoke/Fire) เพิ่มมิติข้อมูลให้ ML

---

## 4.5 MiCS-6814 — เซนเซอร์ 3-in-1 (E-Nose ตัวที่ 4)

| รายละเอียด | สเปค |
|-----------|------|
| **ผู้ผลิต** | Amphenol (ฝรั่งเศส) |
| **สิ่งที่วัดได้** | CO (คาร์บอนมอนอกไซด์), NO2 (ไนโตรเจนไดออกไซด์), NH3 (แอมโมเนีย) |
| **การเชื่อมต่อ** | Analog (ADC) — 3 ช่องจากชิปเดียว |
| **ไฟเลี้ยง** | 5V |
| **ราคาประมาณ** | 400 บาท |

**จุดเด่นสำหรับ ML:** ให้ค่า 3 ตัวแปรอิสระ (CO, NO2, NH3) จากชิปเดียว เพิ่ม Features ให้โมเดลอีก 3 มิติ

---

## 4.6 SCD41 (Sensirion) — เซนเซอร์วัด CO2

| รายละเอียด | สเปค |
|-----------|------|
| **ผู้ผลิต** | Sensirion (สวิตเซอร์แลนด์) |
| **สิ่งที่วัดได้** | CO2 (400-5,000 ppm), อุณหภูมิ, ความชื้น |
| **การเชื่อมต่อ** | I2C |
| **ไฟเลี้ยง** | 2.4V - 5.5V |
| **ราคาประมาณ** | 800 บาท |

**หลักการทำงาน — Photoacoustic NDIR (PASens):**
- ยิงแสงอินฟราเรด (IR) เข้าไปในห้องแคบๆ ที่มีอากาศอยู่
- ก๊าซ CO2 มีคุณสมบัติ "ดูดซับแสง IR"
- เมื่อ CO2 ดูดซับแสง พลังงานแสงเปลี่ยนเป็น "ความร้อน" ทำให้อากาศขยายตัวและหดตัวอย่างรวดเร็ว (เกิดเป็นคลื่นเสียงจิ๋วๆ)
- มี "ไมโครโฟนจิ๋ว" คอยฟังเสียงนี้ → เสียงยิ่งดัง = CO2 ยิ่งเยอะ

🔗 **Datasheet:** [Sensirion SCD41 Datasheet (PDF)](https://sensirion.com/media/documents/C4B87CE6/627C2DCD/Datasheet_SCD4x.pdf)

---

## 4.7 สรุปตารางเซนเซอร์ (แยกชุดทดลอง vs ชุดจริง)

### 4.7.1 ชุดทดลอง (Experimental Setup) - สำหรับเก็บข้อมูลและทำ MVP
| เซนเซอร์ | วัดอะไร | Interface | หมายเหตุ |
|---------|-------|----------|----------|
| **DHT22** | T, RH | 1-Wire | เปลี่ยนแปลงช้า (2 วินาที/ครั้ง) |
| **PMS5003** | PM1/2.5/10 | UART (Serial) | วัดฝุ่นทั่วไป |
| **CCS811** | eCO2, TVOC | I2C | ต้องการ Burn-in 48 ชม., Warm-up 20 นาที |
| **MQ-3** | ทินเนอร์ | ADC | E-Nose #1 |
| **MQ-135** | ก๊าซพิษรวม | ADC | E-Nose #2 |
| **MQ-2** | ควัน, ก๊าซไวไฟ | ADC | E-Nose #3 |
| **MiCS-6814**| CO, NO2, NH3 | ADC (x3) | E-Nose #4 (ต้องการ Warm-up 120 นาที) |

### 4.7.2 ชุดจริง (Production Setup) - สเปคเป้าหมายสำหรับใช้งานจริง
| เซนเซอร์ | วัดอะไร | หลักการ | Interface | หน้าที่ในโปรเจค |
|---------|-------|--------|----------|---------------|
| **SEN55** | PM1/2.5/4/10, VOC, T, RH | Laser Scattering + MOX | I2C | วัดฝุ่นสี + สภาพแวดล้อม แบบ All-in-One |
| **SCD41** | CO2, T, RH | Photoacoustic NDIR | I2C | วัดคุณภาพอากาศ (แม่นยำกว่า CCS811) |
| **MQ-3** | ทินเนอร์, แอลกอฮอล์ | SnO2 Chemiresistor | ADC | E-Nose #1 (จับทินเนอร์) |
| **MQ-135** | ก๊าซพิษรวม, เบนซีน | SnO2 Chemiresistor | ADC | E-Nose #2 (จับ VOC รวม) |
| **MQ-2** | ควัน, ก๊าซไวไฟ | SnO2 Chemiresistor | ADC | E-Nose #3 (จับควัน) |
| **MiCS-6814**| CO, NO2, NH3 | MEMS MOX 3-in-1 | ADC (x3) | E-Nose #4 (เพิ่มมิติ ML) |

---

# 5. เปรียบเทียบ Microcontroller Board

## 5.1 ตระกูล ESP32 (Espressif Systems)

| ฟีเจอร์ | ESP32 Classic | ESP32-S3 (2021) | ESP32-C6 (2023) | **ESP32-S31 (2026) 🏆** |
|:---|:---|:---|:---|:---|
| **CPU** | Xtensa Dual-core | Xtensa Dual-core | RISC-V Single-core | **RISC-V Dual-Core** |
| **Clock Speed** | 240 MHz | 240 MHz | 160 MHz | **320 MHz** |
| **RAM (SRAM)** | 520 KB | 512 KB | 512 KB | **512 KB** |
| **PSRAM** | รองรับ | รองรับ 8-32 MB | - | **DDR PSRAM สูงสุด 32 MB** |
| **WiFi** | WiFi 4 | WiFi 4 | WiFi 6 | **WiFi 6** |
| **Bluetooth** | BLE 4.2 | BLE 5.0 | BLE 5.3 | **BLE 5.4** |
| **Zigbee/Thread** | ❌ | ❌ | ✅ | **✅ IEEE 802.15.4** |
| **AI/ML** | พื้นฐาน | Vector Instructions | จำกัด | **SIMD Acceleration** |
| **ราคา** | ~150-200 ฿ | ~250-450 ฿ | ~200-300 ฿ | **~400 ฿** |

## 5.2 ตระกูล Arduino (รุ่น 32-bit)

| ฟีเจอร์ | Arduino Uno R4 WiFi (2023) | Arduino Nano 33 BLE Sense (2019) | Arduino Nano ESP32 (2023) |
|:---|:---|:---|:---|
| **CPU** | ARM Cortex-M4F (48 MHz) | ARM Cortex-M4F (64 MHz) | Xtensa Dual-core (ESP32-S3) |
| **RAM** | 32 KB | 256 KB | 512 KB |
| **WiFi** | ✅ (ใช้ชิป ESP32-S3!) | ❌ | ✅ |
| **AI/ML** | RAM น้อยเกินไป | พื้นฐาน | ดี (เพราะเป็น ESP32-S3) |
| **ราคา** | ~1,100 ฿ | ~1,200 ฿ | ~850 ฿ |

## 5.3 ทำไมต้อง ESP32-S31?

**ESP32-S31 (เปิดตัวมีนาคม 2026)** คือตัวเลือกอันดับ 1 สำหรับโปรเจคนี้เพราะ:
1. **SIMD Acceleration:** ช่วยรันโมเดล TFLite (Neural Network) ให้คำนวณการจำแนก E-Nose ได้เร็วที่สุด
2. **ADC 12-bit หลายช่อง:** จำเป็นสำหรับอ่านค่า MQ Sensor หลายตัวพร้อมกัน
3. **WiFi 6:** ลดปัญหาสัญญาณรบกวนในโรงงานอุตสาหกรรม
4. **PSRAM สูงสุด 32 MB:** รองรับโมเดล ML ขนาดใหญ่
5. **ราคาถูกกว่า Arduino** ที่มีสเปคใกล้เคียงกัน

> **ข้อสำคัญ:** ชื่อรุ่นที่ถูกต้องคือ **"ESP32-S31"** (ไม่ใช่ S3 เฉยๆ) ตัวมันคือชิปรุ่นใหม่ล่าสุดของ Espressif
> 
> **การซื้อ:** ต้องเลือกซื้อในระดับ **"Development Board (บอร์ดพัฒนา)"** ที่มีพอร์ต USB-C สำหรับเสียบคอมพิวเตอร์ลงโปรแกรม และมีขาเข็ม (Pin Header) สำหรับเสียบสาย Jumper ต่อกับ Sensor ได้เลย อย่าซื้อแค่ระดับ "Module" (เช่น WROOM-1) หรือ "SoC" (ชิปดำๆ เปล่าๆ) เพราะเอามาเสียบสายทดลองไม่ได้ครับ

---

# 6. สถาปัตยกรรมระบบ (Adaptive E-Nose Platform)

เปลี่ยนจาก "โมเดลฝังตายตัว" เป็น **"ระบบที่ Retrain ได้ตามสภาพแวดล้อมโรงงาน"** ผ่าน OTA (Over-The-Air) Model Update

```text
╔══════════════════════════════════════════════════════════════════╗
║                    Adaptive E-Nose Platform                      ║
║                                                                  ║
║  ┌───────────────┐     WiFi/MQTT      ┌─────────────────────┐   ║
║  │  🟦 Sensor Box │ ──────────────────→│  🌐 Web Platform     │   ║
║  │  (ESP32)       │                    │  (เพื่อนทำ)           │   ║
║  │                │                    │                       │   ║
║  │  • อ่าน sensor │ → raw data ────→  │  • Dashboard          │   ║
║  │  • inference   │                    │  • Data labeling UI   │   ║
║  │  • แจ้งเตือน   │                    │  • ML Training        │   ║
║  │                │                    │  • Model management   │   ║
║  │  • รับโมเดลใหม่│ ←── OTA Update ── │  • OTA model push     │   ║
║  └───────────────┘                    └─────────────────────┘   ║
║                                                                  ║
║  Mode 1: เก็บ data (ส่ง raw ขึ้นเว็บ) ให้ user ช่วย label         ║
║  Mode 2: inference (ใช้ TFLite โมเดลที่ฝังอยู่ จำแนกแบบ real-time)║
╚══════════════════════════════════════════════════════════════════╝
```

**หมายเหตุ:** 
- **ชุดทดลอง (Experimental):** กล่อง Sensor Box จะใช้ ESP32-WROOM-32U และ Sensor ชุดที่มีอยู่ (PMS5003/CCS811/DHT22) เพื่อทำ PoC (Proof of Concept) โชว์กระบวนการอัพเดท OTA และ ML Inference ให้ได้ก่อน
- **ชุดจริง (Production):** กล่อง Sensor Box จะใช้ ESP32-S31 ควบคู่กับเซนเซอร์อุตสาหกรรม (SEN55/SCD41) และระบบไฟ AC-DC (Hi-Link) ในการติดตั้งจริงเพื่อความคงทน

---

# 7. Machine Learning Pipeline

เนื่องจากไม่ใช้ BME688 (ที่มี AI สำเร็จรูป) เราจึง **สร้าง ML Model เองทั้งหมด 100%**

## 7.1 Input Features (ข้อมูลเข้า ML)

```
Feature Vector (10 มิติ):
[MQ3_ADC, MQ135_ADC, MQ2_ADC, MiCS_CO, MiCS_NO2, MiCS_NH3, Temp, Humidity, PM2.5, PM10]
```

## 7.2 Output Classes (ผลลัพธ์การจำแนก)

```
Class 0: อากาศสะอาด (Clean Air)
Class 1: ฝุ่นสี (Paint Dust / Powder)
Class 2: ทินเนอร์ / VOC สูง (Thinner / Solvent)
Class 3: อันตราย — ควันหรือผิดปกติ (Smoke / Danger)
```

## 7.3 ขั้นตอน ML Pipeline

### Step 1: Data Collection (เก็บข้อมูล)
1. ต่อ E-Nose Array + SEN55 + SCD41 เข้ากับ ESP32-S31
2. เขียนโค้ด Arduino อ่านค่า ADC จาก MQ ทุกตัว + I2C ทุกๆ 1 วินาที
3. สร้างสภาพแวดล้อมจำลอง (Scenarios):
   - ใส่เซนเซอร์ในกล่องปิดทึบ (Chamber)
   - **Class 0:** อากาศปกติ — เปิดฝากล่องให้ลมเข้า
   - **Class 1:** ฝุ่นสี — เอาผงสีฝุ่นมาเป่าเข้าไปในกล่อง
   - **Class 2:** ทินเนอร์ — หยดทินเนอร์ลงสำลีใส่เข้ากล่อง
   - **Class 3:** ควัน — จุดธูปหรือกระดาษใส่เข้ากล่อง
4. บันทึกค่าลง CSV (ตั้งเป้า 500-1000 ตัวอย่างต่อ Class)

### Step 2: Model Training (บน PC / Google Colab)
1. นำ CSV เข้า Python (Jupyter Notebook / Google Colab)
2. Data Preprocessing:
   - Normalize / Standardize (เพราะ MQ ค่าแกว่ง)
   - แบ่งข้อมูล Train 80% / Test 20%
3. ทดลอง Train หลายโมเดลเปรียบเทียบ:
   - **K-Nearest Neighbors (KNN)** — ง่ายสุด
   - **Random Forest (RF)** — accuracy สูง (งานวิจัย IEEE ได้ >99%)
   - **Multi-Layer Perceptron (MLP Neural Network)** — แนะนำตัวนี้สำหรับ Deploy ลงบอร์ด
4. Evaluate: Accuracy, Precision, Recall, Confusion Matrix

### Step 3: Deployment (TinyML → ESP32-S31)
1. แปลง Keras model (`.h5`) → **TensorFlow Lite (`.tflite`)**
2. Quantize เป็น INT8 เพื่อประหยัด RAM
3. แปลง `.tflite` เป็น C Array (`xxd -i model.tflite > model_data.h`)
4. ฝังเข้าโค้ด C++ บน ESP32-S31 ผ่าน TensorFlow Lite Micro library
5. **Real-time:** ESP32 อ่าน sensor → ส่งเข้า TFLite → ได้ Class ออกมา (ทุก 5 วินาที)

### Model ที่แนะนำ

| Model | ขนาดหลัง Quantize | Accuracy (จาก IEEE) | เหมาะกับ |
|-------|-------------------|---------------------|---------|
| KNN | ~20 KB | ~95% | Baseline / เปรียบเทียบ |
| Random Forest → TFLite | ~50 KB | ~99% | งานวิจัย |
| **MLP Neural Net (TFLite)** | **~100 KB** | **~93-97%** | **✅ แนะนำสำหรับโปรเจคจบ** |

---

# 8. การส่งข้อมูลและปัญหากล่องโลหะ

## 8.1 ปัญหา Faraday Cage Effect

เมื่อกล่องเครื่องวัดอยู่ในตู้เหล็กหรือห้องพ่นสีที่เป็นผนังเหล็ก จะเกิดปรากฏการณ์ **กรงฟาราเดย์ (Faraday Cage Effect)** โลหะจะสะท้อนและบล็อกคลื่นแม่เหล็กไฟฟ้า (WiFi/BLE) ทำให้ส่งสัญญาณไม่ออก

## 8.2 วิธีแก้ปัญหา (3 แนวทาง)

### แนวทางที่ 1: External Antenna (เสาอากาศภายนอก) ⭐ แนะนำที่สุด
- เลือกซื้อ ESP32-S31 Dev Board รุ่นที่มีหัวต่อ **U.FL (IPEX)** — มักจะเป็นรุ่นที่มีตัว **"U"** ต่อท้าย (เช่น `ESP32-S31-WROOM-1U`)
- เจาะรูที่กล่อง ต่อสาย U.FL to SMA ออกไปเสียบเสาอากาศแท่ง (เสายาง) ด้านนอก
- กล่องเหล็กจะทำหน้าที่เป็น Ground Plane ช่วยสะท้อนสัญญาณให้ส่งได้ดียิ่งขึ้น
- ค่าใช้จ่ายเพิ่ม: ~50-100 บาท

### แนวทางที่ 2: กล่องพลาสติก (RF Window)
- ใช้กล่องพลาสติก ABS/Polycarbonate มาตรฐานกันฝุ่น IP65/IP66 แทนกล่องเหล็ก
- คลื่น WiFi ทะลุพลาสติกได้เกือบ 100%
- ห้ามบุฟอยล์อะลูมิเนียมภายในกล่อง

### แนวทางที่ 3: Wired Gateway
- ใช้สาย RS485 (Modbus) หรือสาย LAN เดินจากกล่องเซนเซอร์ออกมานอกห้อง
- มี ESP32 อีกตัวเป็น Gateway ทำหน้าที่ส่ง WiFi แทน
- เสถียรที่สุด 100% แต่ต้องเดินสาย

**สำหรับโปรเจคนี้แนะนำ:** ใช้กล่องพลาสติก IP65 + เสาอากาศภายนอก (External Antenna) ผสมกันครับ

---

# 9. ระบบจ่ายไฟ (Power Supply)

เนื่องจากโปรเจคนี้เป็น **ระบบความปลอดภัย (Safety System)** ที่ต้องทำงาน Real-time ตลอด 24 ชม. จึง **ไม่แนะนำให้ใช้แบตเตอรี่** (เพราะถ้าแบตหมดตอนก๊าซรั่ว ระบบจะแจ้งเตือนไม่ได้)

### วิธีที่แนะนำ: Internal AC-DC Power Supply ⭐
- ใช้โมดูลแปลงไฟ **Hi-Link (HLK-PM01)** ขนาดจิ๋ว ซ่อนไว้ในกล่อง
- แปลงไฟ 220V AC จากปลั๊กบ้าน → 5V DC ไปเลี้ยงบอร์ดและเซนเซอร์ทั้งหมด
- ที่ตัวกล่องด้านนอก ติด **เต้ารับ IEC 320 C14** (แบบคอมพิวเตอร์)
- ใช้งาน: เอาสายไฟมาเสียบตูดกล่อง 1 เส้น จบเลย ดูโปร ไม่มีอะแดปเตอร์ห้อย

---

# 10. Logic การตัดสินใจ

```
[ลูปการทำงานทุก 5 วินาที บน ESP32-S31]

1. อ่านค่า ADC จากเซนเซอร์ MQ ทั้งหมด (E-Nose Array)
2. อ่านค่า I2C จาก SEN55 (PM, T, RH) และ SCD41 (CO2)
3. ส่งค่า Features ทั้งหมดเข้าโมเดล TensorFlow Lite Micro
4. โมเดลคืนค่าผลลัพธ์ (Classification):

   IF Result == "Thinner VOC" OR "Smoke/Danger"
      OR PM2.5 > 25 µg/m³
      OR CO > 25 ppm
   THEN:
       → สั่ง Relay ปิด outlet damper (หยุดปล่อยอากาศออก)
       → เปิด recirculation filter
       → ส่งแจ้งเตือน LINE OA ⚠️
       → แสดง LED แดง + เสียง buzzer

   ELSE IF Result == "Normal" OR "Powder Paint (Low PM)"
   THEN:
       → อนุญาตให้ปล่อยอากาศออก
       → แสดง LED เขียว
       → log ค่าลง database

5. ส่งข้อมูลทั้งหมด (Raw Data + ML Result) ขึ้น Dashboard ทุกรอบ
```

---

# 11. การส่งข้อมูลออกภายนอก

## 11.1 Protocol Stack

```
ESP32-S31
    ├─ MQTT → Node-RED → Dashboard + LINE Notify
    ├─ HTTP REST → Web Server (Node.js / FastAPI)
    ├─ WebSocket → Real-time Web Dashboard
    └─ LINE Messaging API → LINE OA Bot (Flex Message)
```

## 11.2 Web Dashboard Stack

```
Frontend: React/Vue + Chart.js
Backend:  FastAPI (Python) หรือ Node.js + Express
Database: InfluxDB (time-series) หรือ Firebase Realtime DB
Viz:      Grafana Dashboard (ฟรี, ง่าย, สวย)
```

## 11.3 LINE OA Integration

```
POST https://api.line.me/v2/bot/message/push
{
  "to": "<LINE_USER_ID>",
  "messages": [{
    "type": "flex",
    "altText": "⚠️ คุณภาพอากาศเกินมาตรฐาน!",
    "contents": { ... Flex Message ... }
  }]
}
```

---

# 12. รายการอุปกรณ์และงบประมาณ

| อุปกรณ์ | หน้าที่ | ราคาประมาณ |
|---------|--------|-----------|
| ESP32-S31 Dev Board (U.FL) | สมองกล + ML + WiFi 6 | ~400 ฿ |
| MQ-3 | E-Nose: ดมทินเนอร์ | ~70 ฿ |
| MQ-135 | E-Nose: ดม VOC รวม | ~70 ฿ |
| MQ-2 | E-Nose: ดมควัน | ~70 ฿ |
| MiCS-6814 | E-Nose: CO/NO2/NH3 | ~400 ฿ |
| SEN55 | วัดฝุ่น PM + VOC + T/RH | ~900 ฿ |
| SCD41 | วัด CO2 | ~800 ฿ |
| Hi-Link HLK-PM01 | จ่ายไฟ 220V→5V | ~150 ฿ |
| Relay Module 5V | ควบคุม fan/damper | ~50 ฿ |
| External Antenna SMA + สาย U.FL | เสาอากาศภายนอก | ~100 ฿ |
| กล่องพลาสติก IP65 | กล่องกันฝุ่นกันน้ำ | ~200 ฿ |
| LED RGB + Buzzer | แสดงสถานะ | ~50 ฿ |
| IEC 320 C14 Inlet | เต้ารับสายไฟแบบคอม | ~40 ฿ |
| **รวม** | | **~3,300 บาท** |

---

# 13. คีย์เวิร์ดสำหรับค้นงานวิจัย

## 13.1 คีย์เวิร์ดหลัก (ภาษาอังกฤษ)

| หมวด | คีย์เวิร์ด |
|------|-----------|
| **Core** | VOC monitoring, Paint booth air quality, Spray painting emission |
| **E-Nose** | Electronic nose, e-nose, Metal oxide semiconductor gas sensor, MOS gas sensor array, Sensor array VOC classification |
| **ML/AI** | Machine learning gas classification, TinyML gas sensor, Random Forest gas sensor, SVM gas detection, Edge AI air quality |
| **IoT** | ESP32 air quality monitoring, IoT environmental monitoring, MQTT air quality |
| **อุตสาหกรรม** | Paint booth ventilation, Occupational exposure VOC, OSHA VOC limit |

## 13.2 คีย์เวิร์ด (ภาษาไทย — สำหรับ ThaiJo / TDC)

```
จมูกอิเล็กทรอนิกส์
การจำแนกประเภทก๊าซด้วยการเรียนรู้ของเครื่อง
สารอินทรีย์ระเหยง่าย
ระบบตรวจวัดคุณภาพอากาศ IoT
คุณภาพอากาศห้องพ่นสี
```

## 13.3 Boolean Query สำเร็จรูป (Copy-Paste ลง IEEE Xplore)

**Query 1 — E-Nose + ML:**
```
("electronic nose" OR "e-nose" OR "sensor array")
AND ("VOC" OR "gas classification" OR "odor recognition")
AND ("machine learning" OR "pattern recognition")
```

**Query 2 — IoT + Air Quality:**
```
("IoT" OR "ESP32" OR "embedded system")
AND ("air quality" OR "gas sensor")
AND ("classification" OR "monitoring")
```

**Query 3 — TinyML:**
```
("TinyML" OR "TensorFlow Lite" OR "edge AI")
AND ("gas sensor" OR "air quality" OR "VOC")
```

## 13.4 ฐานข้อมูลที่แนะนำ

| ฐานข้อมูล | URL | เหมาะกับ |
|----------|-----|---------|
| **Google Scholar** | scholar.google.com | ค้นหาง่าย ฟรี (เริ่มที่นี่ก่อน) |
| **IEEE Xplore** | ieeexplore.ieee.org | Hardware, IoT, Embedded |
| **MDPI Sensors** | mdpi.com/journal/sensors | Open Access ฟรี! |
| **Scopus** | scopus.com | วิชาการทุกแขนง |
| **ResearchGate** | researchgate.net | ขอ full paper จากผู้เขียนได้ |

---

# 14. งานวิจัย IEEE ที่เกี่ยวข้อง

## 14.1 หมวด VOC + ห้องพ่นสี

| # | หัวข้อ | สิ่งที่น่าสนใจ |
|---|-------|--------------|
| 1 | RANFIS-based Sensor System for VOC in Paint Booth | ใช้ MOS + PID sensor ทดสอบใน paint booth จริง |
| 2 | Air Recirculation and VOC Oxidation Module for Spray Booth | ระบบวนกรองก่อนปล่อยออก — สำหรับ literature review |

## 14.2 หมวด Gas Sensor + Machine Learning (E-Nose)

| # | หัวข้อ | ML Model | Accuracy |
|---|-------|---------|---------|
| 3 | **Metal Oxide Sensor Array + ML for VOC Mixture** ⭐ | KNN / RF / SVM | **>99%** |
| 4 | Enhanced VOC Gas Mixture Recognition + SSA-BP Neural Network | Optimized NN | High |
| 5 | Lightweight Neural Net (LTNet) for VOC Classification | LTNet → TFLite | เหมาะ ESP32 |
| 6 | **Classification and Concentration Prediction of VOC Gases Based on Sensor Array with ML** | ML | IEEE NEMS |

## 14.3 หมวด IoT + Embedded + Dashboard

| # | หัวข้อ | Hardware | Platform |
|---|-------|---------|---------|
| 7 | **IoT Air Quality + ESP32 + Cloud Dashboard** ⭐ | ESP32 + MQ | ThingsBoard |
| 8 | Low-Cost IoT + ML Prediction | ESP32/Pi | Firebase |
| 9 | LoRaWAN E-Nose for Industrial VOC Monitoring | LoRa + e-nose | LoRaWAN |

**ค้นหาตรงใน IEEE Xplore:**
- [Query: VOC + IoT + Sensor Industrial](https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=VOC+monitoring+IoT+sensor+industrial&newsearch=true&dateRange=custom&startYear=2020&endYear=2025)
- [Query: Electronic Nose + Machine Learning](https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=electronic+nose+machine+learning+gas+classification&newsearch=true&dateRange=custom&startYear=2020&endYear=2025)
- [Query: TinyML + Gas Sensor](https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=TinyML+gas+sensor+classification+embedded&newsearch=true)

---

# 15. แผนการพัฒนา (Timeline)

| สัปดาห์ | งาน |
|---------|-----|
| 1-2 | วางระบบ + สั่งซื้ออุปกรณ์ + ออกแบบกล่อง |
| 3-4 | ประกอบฮาร์ดแวร์ + เขียน firmware อ่านค่า E-Nose + SEN55 + SCD41 |
| 5-6 | **Burn-in เซนเซอร์ MQ (24-48 ชม.)** + เก็บ Dataset (Class 0-3) ในกล่องจำลอง |
| 7-8 | Train ML Model บน Google Colab + เปรียบเทียบ KNN/RF/MLP |
| 9-10 | Convert TFLite + Deploy ลง ESP32-S31 + ทดสอบ Real-time Classification |
| 11-12 | พัฒนา Web Dashboard + LINE OA Integration |
| 13-14 | ทดสอบระบบรวม (Integration Test) ในห้องพ่นสีจริง |
| 15-16 | เขียนรายงาน + เตรียมสอบป้องกัน |

---

# 16. ความรู้เพิ่มเติมที่จำเป็น

## 16.1 เรื่องสีฝุ่นและทินเนอร์

- **สีฝุ่น (Powder Coating):** เป็นกระบวนการ **แห้ง 100% (Dry Process)** ใช้ไฟฟ้าสถิต ไม่ผสมทินเนอร์ในเนื้อสี
- **ทำไมยังต้องวัดทินเนอร์?** เพราะทินเนอร์ถูกใช้ในขั้นตอนแวดล้อม:
  1. เช็ดล้างทำความสะอาดชิ้นงาน (Degreasing/Pre-treatment)
  2. ล้างทำความสะอาดปืนพ่นสีและตู้พ่น (Equipment Cleaning)
  3. ลอกสีเก่า (Rework/Stripping)
- **ทำไมต้องแยกประเภท?** เพราะ ฝุ่นสี (PM) กรองด้วย HEPA แต่ ทินเนอร์ (VOC) ต้องกรองด้วย Activated Carbon ระบบต้องรู้ว่ามลพิษชนิดไหนเพื่อจัดการถูกวิธี

## 16.2 หน่วยวัด ppm

- **ppm** ย่อมาจาก **"Parts Per Million" (ส่วนในล้านส่วน)**
- ตัวอย่าง: CO2 = 1,000 ppm หมายความว่า ในอากาศ 1 ล้านส่วน มี CO2 อยู่ 1,000 ส่วน (= 0.1%)
- เซนเซอร์วัดก๊าซ (MQ, SCD41) จะรายงานค่าเป็น ppm
- เซนเซอร์วัดฝุ่น (SEN55) จะรายงานค่าเป็น µg/m³ (ไมโครกรัมต่อลูกบาศก์เมตร)

## 16.3 ข้อควรระวังเซนเซอร์ MQ Series

1. **Burn-in:** ต้องเปิดเซนเซอร์ทิ้งไว้ 24-48 ชั่วโมง ก่อนเริ่มเก็บ Data ไม่เช่นนั้นค่าจะแกว่งมาก
2. **กินไฟสูง:** เซนเซอร์ MQ แต่ละตัวมี Heater ที่ร้อนจัด กินกระแสตัวละ ~150mA
3. **ค่าแปรผันตามอุณหภูมิ/ความชื้น:** จึงต้องมี T/RH เป็น Feature ให้ ML ชดเชย (Compensation)
4. **ADC ของ ESP32 แกว่ง:** ควรเขียน Moving Average Filter ก่อนส่งค่าให้ ML

---

> 📌 **เอกสารฉบับนี้เป็นข้อมูลอ้างอิงรวมทั้งหมดจากการศึกษาและวิเคราะห์ระบบ**
> สามารถนำไปใช้เป็นเนื้อหาในบทที่ 2 (ทฤษฎีที่เกี่ยวข้อง) และบทที่ 3 (วิธีดำเนินการวิจัย) ของรูปเล่มโปรเจคจบได้
