# MQ-2 Sensor Notes

เอกสารนี้สรุปความรู้ที่คุยกันเกี่ยวกับ MQ-2 สำหรับโปรเจกต์ E-Nose / VOC / smoke classification โดยเน้นการเข้าใจ datasheet, calibration, การใช้งานกับ ESP32, การนำค่าไปทำ ML และการใช้ข้อมูล calibration เพื่อตรวจสุขภาพ sensor

## 1. MQ-2 คืออะไร

MQ-2 เป็น gas sensor แบบ Metal Oxide Semiconductor ใช้วัสดุไวต่อก๊าซชนิด `SnO2` หรือ Tin Dioxide ภายในมี heater เพื่อทำให้ผิว sensor ร้อนและเกิดปฏิกิริยากับก๊าซ

MQ-2 เหมาะกับการตรวจจับ:

| ก๊าซ/ไอระเหย | หมายเหตุ |
|---|---|
| LPG / propane / butane | ตอบสนองดี |
| methane | ตอบสนองได้ แต่ช่วง ppm สูงกว่า |
| hydrogen | ใช้เป็น reference ใน datasheet บางจุด |
| smoke | ใช้ตรวจควันได้ |
| alcohol / VOC บางชนิด | ตอบสนองได้ แต่ไม่จำเพาะเจาะจง |

ข้อสำคัญ: MQ-2 ไม่ได้จำแนกก๊าซเองโดยตรง มันเปลี่ยนความต้านทานเมื่อเจอก๊าซหลายชนิด ดังนั้นถ้าต้องการแยก `clean_air`, `smoke`, `VOC/thinner` ควรใช้ pattern ของสัญญาณและ ML แทนการดูค่าเดียว

## 2. คำศัพท์สำคัญ

| คำ | ความหมาย |
|---|---|
| `AOUT` | Analog output จากโมดูล MQ-2 ใช้เข้า ADC |
| `DOUT` | Digital output จาก comparator บนโมดูล มีค่า 0/1 ตาม threshold |
| `ADC` | Analog to Digital Converter เช่น ESP32 อ่าน 0-4095 |
| `Vc` | Circuit voltage ของวงจรวัด ปกติ 5V |
| `Vh` | Heater voltage ปกติ 5V |
| `Vout` | แรงดัน analog ที่อ่านจาก AOUT |
| `RL` | Load resistance ในวงจรแบ่งแรงดัน |
| `Rs` | Sensor resistance ตอนกำลังวัด |
| `Ro` | Reference resistance จากการ calibrate |
| `Rs/Ro` | Ratio สำคัญสำหรับเทียบกราฟ datasheet หรือใช้เป็น ML feature |
| `Baseline` | ค่าพื้นฐานตอนอากาศสะอาด |
| `Drift` | ค่า sensor ค่อย ๆ เปลี่ยนเองเมื่อเวลาผ่านไป |
| `Warm-up` | เปิด sensor รอก่อนอ่านค่าให้ heater และสัญญาณนิ่ง |
| `Burn-in` | เปิด sensor ใหม่ทิ้งไว้ 24-48 ชั่วโมง |
| `Calibration gas` | ก๊าซมาตรฐานที่รู้ ppm แน่นอน เช่น 1000ppm iso-butane in air |
| `Chamber` | กล่องหรือห้องทดสอบสำหรับควบคุมปริมาตร ก๊าซ airflow อุณหภูมิ และความชื้น |

## 3. Datasheet ที่ต้องเข้าใจ

ค่าหลักจาก datasheet:

| รายการ | ค่าโดยทั่วไป |
|---|---|
| `Vc` | 5V +/- 0.1V |
| `Vh` | 5V +/- 0.1V |
| `RL` | ปรับได้ บาง datasheet แนะนำประมาณ 20kΩ หรือช่วง 5kΩ-47kΩ |
| heater resistance | ประมาณ 33Ω +/- 5% |
| heater power | น้อยกว่า 800mW |
| operating temperature | ประมาณ -20°C ถึง 50°C |
| humidity | น้อยกว่า 95%RH |
| preheat time | มากกว่า 24 ชั่วโมง |

Sensitivity table ระบุว่า `Rs` ที่ `1000ppm iso-butane` ควรอยู่ประมาณ `3kΩ-30kΩ` ภายใต้เงื่อนไขมาตรฐาน

## 4. Rs, Ro และ Rs/Ro

`Rs` คือความต้านทานของ sensor ตอนวัดจริง

`Ro` คือค่าความต้านทานอ้างอิงของ sensor ตัวนั้น ตาม datasheet MQ-2 นิยามหนึ่งที่พบบ่อยคือ:

```text
Ro = sensor resistance at 1000ppm H2 in clean air
```

แต่ในงาน practical ที่ไม่มี 1000ppm H2 เรามักหา `Ro` จาก clean air โดยอาศัยกราฟ datasheet:

```text
ใน clean air, Rs/Ro ประมาณ 9.8
Ro = Rs_clean_air / 9.8
```

`Rs/Ro` คือ ratio ที่ใช้จริง:

```text
Rs/Ro = resistance ตอนวัดจริง / reference resistance
```

เหตุผลที่ใช้ ratio: sensor แต่ละตัวไม่เหมือนกัน ค่า ADC ดิบเทียบกันยาก แต่ `Rs/Ro` normalize ตาม sensor ตัวนั้นแล้ว จึงเหมาะกว่าในการเทียบกราฟหรือใช้เป็น ML feature

## 5. สูตรคำนวณ Rs

วงจร MQ เป็น voltage divider ระหว่าง `Rs` กับ `RL`

สูตรทั่วไป:

```text
Rs = RL * (Vc - Vout) / Vout
```

โดย:

| ตัวแปร | ความหมาย |
|---|---|
| `Rs` | sensor resistance ตอนวัด |
| `RL` | load resistance |
| `Vc` | circuit voltage เช่น 5V |
| `Vout` | analog output voltage |

ถ้าใช้ ESP32 ADC:

```text
Vout = ADC / 4095 * 3.3
```

ข้อควรระวัง: ถ้าโมดูล MQ-2 AOUT ออกได้ถึง 5V ห้ามต่อ ESP32 ADC ตรง ๆ ต้องใช้ voltage divider หรือวงจรลดระดับก่อน

## 6. Calibration คืออะไร

Calibration คือการสอบเทียบ sensor เพื่อให้รู้ว่า:

```text
ค่าที่ sensor อ่านได้สัมพันธ์กับสภาพจริงอย่างไร
```

สำหรับ MQ-2 มี 2 ระดับ:

| ระดับ | ใช้เมื่อไหร่ | ผลลัพธ์ |
|---|---|---|
| practical calibration | ใช้ทำ ML classification หรือทดลองทั่วไป | ได้ `Ro` จาก clean air และใช้ `Rs/Ro` เป็น feature |
| standard gas calibration | ใช้วัด ppm จริงจัง | ได้ calibration curve ของ sensor ตัวนั้น |

## 7. Practical Calibration ด้วย Clean Air

เหมาะเมื่อไม่มีก๊าซมาตรฐาน

ขั้นตอน:

1. Burn-in sensor ใหม่ 24-48 ชั่วโมง
2. Warm-up ก่อนวัด 20-30 นาที
3. วาง sensor ในอากาศสะอาด ไม่มีควัน ทินเนอร์ แอลกอฮอล์ สเปรย์ หรือ LPG
4. อ่าน ADC 100-200 samples แล้วเฉลี่ย
5. แปลง ADC เป็น `Vout`
6. คำนวณ `Rs_clean_air`
7. คำนวณ `Ro`

สูตร:

```text
Ro = Rs_clean_air / 9.8
```

ตัวอย่าง:

```text
RL = 10kΩ
Vc = 5V
ADC_clean_avg = 380
Vout = 380 / 4095 * 3.3 = 0.306V
Rs = 10 * (5 - 0.306) / 0.306 = 153.4kΩ
Ro = 153.4 / 9.8 = 15.65kΩ
```

หลังจากนั้น ถ้าวัดจริงได้ `Rs = 30kΩ`:

```text
Rs/Ro = 30 / 15.65 = 1.92
```

## 8. Standard Gas Calibration

ถ้าต้องการวัด ppm ให้เชื่อถือได้ ต้องใช้ calibration gas

อุปกรณ์:

| อุปกรณ์ | หน้าที่ |
|---|---|
| calibration gas | ก๊าซที่รู้ ppm แน่นอน เช่น 1000ppm iso-butane in air |
| regulator | หัวปรับแรงดันถังก๊าซ |
| flow meter / mass flow controller | คุมอัตราการไหล |
| chamber | กล่องทดสอบที่ควบคุมสภาพได้ |
| temperature/humidity sensor | บันทึกสภาพแวดล้อม |
| clean air source | purge และวัด baseline |
| exhaust / ventilation | ระบายก๊าซอย่างปลอดภัย |

ขั้นตอน:

1. Burn-in และ warm-up sensor
2. ปล่อย clean air เข้า chamber เพื่อวัด baseline
3. ปล่อย calibration gas ที่รู้ ppm เช่น `1000ppm iso-butane in air`
4. รอจนค่า stable
5. คำนวณ `Rs`
6. ทำซ้ำหลายรอบ
7. ถ้ามีก๊าซหลายความเข้มข้น ให้สร้าง calibration curve

Calibration curve มักใช้รูปแบบ:

```text
ppm = A * (Rs/Ro)^B
```

หรือ fit บน log-log scale:

```text
log(ppm) = a * log(Rs/Ro) + b
```

## 9. 1000ppm iso-butane in air คืออะไร

`iso-butane` คือก๊าซไอโซบิวเทน สูตร `C4H10` เป็นก๊าซไวไฟกลุ่มเดียวกับ butane/LPG

`1000ppm` คือ 1000 parts per million:

```text
1000ppm = 0.1%
```

ดังนั้น `1000ppm iso-butane in air` คืออากาศที่มีไอโซบิวเทน 0.1%

ใช้เพื่อ calibrate หรือ validate sensor เพราะ MQ-2 ไวต่อก๊าซไวไฟกลุ่มนี้

## 10. ถ้าไม่มี 1000ppm iso-butane ใช้อะไรแทนได้

ขึ้นกับเป้าหมาย:

| เป้าหมาย | สิ่งที่ใช้แทนได้ | ข้อจำกัด |
|---|---|---|
| หา `Ro` แบบ practical | clean air | ได้ค่าอ้างอิงประมาณ ไม่ใช่ ppm แม่น |
| ทำ ML classification | ควัน ทินเนอร์ สเปรย์ VOC จริงที่สนใจ | ไม่รู้ ppm แต่ใช้เรียน pattern ได้ |
| test response | ไฟแช็ก LPG alcohol smoke | ใช้ดูว่า sensor ตอบสนอง ไม่ใช่ calibration standard |
| วัด ppm จริง | ต้องใช้ calibration gas ที่รู้ ppm | แทนด้วยของทั่วไปไม่ได้ดีพอ |

ประโยคที่เหมาะสำหรับรายงานถ้าไม่ได้ใช้ gas standard:

```text
ระบบนี้ใช้ relative calibration โดยหา Ro จาก clean-air baseline และใช้ค่า Rs/Ro เป็น feature สำหรับ classification model ไม่ได้ใช้เป็นการวัด ppm แบบ absolute
```

## 11. Chamber คืออะไร

`Chamber` คือกล่องหรือห้องทดสอบที่ใช้ควบคุมสภาพการทดลอง

หน้าที่:

| หน้าที่ | เหตุผล |
|---|---|
| ควบคุมปริมาตรอากาศ | ทำให้ทดลองซ้ำได้ |
| คุมการปล่อยก๊าซ | ลดความมั่วของ concentration |
| คุม airflow | ลด noise จากลม |
| มีทางระบาย | ทำ recovery และ purge ได้ |
| เดินสาย sensor ได้ | อ่านค่าต่อเนื่องได้ |

แบบง่ายสำหรับโปรเจกต์:

```text
กล่องใสปิดฝาได้ + รู gas inlet + รู outlet + รูสาย sensor + พัดลมหรือทางระบาย
```

ข้อควรระวัง: ก๊าซไวไฟต้องใช้ในที่ระบายอากาศดี ไม่มีประกายไฟ relay เปลือย หรือเปลวไฟใกล้ chamber

## 12. น็อตหมุนบนโมดูล MQ-2 คืออะไร

น็อตหมุนคือ `potentiometer` หรือ `trimpot`

หน้าที่หลัก:

```text
ปรับ threshold ของ DOUT
```

บนโมดูล MQ-2 ทั่วไป:

| ขา | ใช้งาน |
|---|---|
| `AOUT` | ค่า analog ต่อเนื่อง ใช้กับ ADC และ ML |
| `DOUT` | ค่า digital 0/1 ตาม threshold |

การหมุน trimpot จะเปลี่ยนจุดที่ `DOUT` เปลี่ยนสถานะ ไม่ได้ calibrate `AOUT` ให้แม่นขึ้นโดยตรง

สำหรับโปรเจกต์ ML ควรใช้:

```text
AOUT -> ESP32 ADC -> CSV -> ML
```

`DOUT` เหมาะกับ alarm ง่าย ๆ เช่นเปิด buzzer เมื่อเกิน threshold

## 13. ถ้าค่าไม่ตรงควรปรับอะไร

ต้องแยกสาเหตุ:

| อาการ | สาเหตุที่ควรเช็ก | วิธีแก้ |
|---|---|---|
| ADC / Vout ไม่นิ่ง | ไฟ, heater, noise, airflow, humidity | power supply นิ่ง, warm-up, filter |
| `Rs/Ro` ไม่ตรง datasheet | `RL`, สูตร, `Vc`, `Vout`, `Ro` | วัด `RL`, calibrate `Ro` ใหม่ |
| ppm ไม่ตรง | ยังไม่มี calibration curve | ใช้ calibration gas หลาย concentration |
| ML ทำนายไม่ตรง | data, label, feature, split, drift | เก็บข้อมูลใหม่, retrain, ดู confusion matrix |

ไม่ควรเริ่มจากการหมุน trimpot เพราะ trimpot ไม่ได้แก้ analog calibration โดยตรง

## 14. ใช้ข้อมูล Calibration เพื่อตรวจสุขภาพ Sensor

ควรเก็บ calibration log เพื่อใช้บำรุงรักษาและตรวจ sensor drift

ตัวอย่าง CSV:

```csv
date,sensor_id,session_type,temperature,humidity,adc_clean,vout_clean,rs_clean,ro,rs_ro_clean,response_time_sec,recovery_time_sec,note
2026-07-10,MQ2_01,calibration,29.5,68,380,0.306,153.4,15.65,9.80,12,95,normal
```

ค่าที่ควรเก็บ:

| ค่า | ใช้ดูอะไร |
|---|---|
| `adc_clean` | baseline ADC drift |
| `rs_clean` | baseline resistance drift |
| `ro` | sensor reference drift |
| `rs_ro_clean` | ความสอดคล้องกับ clean air |
| `response_time_sec` | sensor ตอบสนองช้าลงไหม |
| `recovery_time_sec` | sensor กลับ baseline ช้าลงไหม |
| `temperature/humidity` | แยกปัญหาจากสิ่งแวดล้อม |

เกณฑ์ practical:

| เงื่อนไข | ความหมาย |
|---|---|
| `Ro drift < 10%` | ปกติ |
| `Ro drift 10-20%` | ควร re-calibrate |
| `Ro drift > 20%` | ตรวจ sensor / ระบบ / พิจารณาเปลี่ยน |
| response ลดมากกว่า 30% | sensitivity อาจลดลง |
| recovery ช้ามาก | อาจมี contamination หรือ airflow ไม่ดี |

ประโยคที่ใช้ในรายงานได้:

```text
มีการบันทึกค่า baseline, Ro, response time และ recovery time เป็น sensor health log เพื่อใช้ติดตาม drift และกำหนดรอบการ re-calibration
```

## 15. ใช้ MQ-2 กับ ML อย่างไร

สำหรับ ML classification ไม่จำเป็นต้องวัด ppm แม่นตั้งแต่แรก สิ่งสำคัญคือการเก็บ pattern ของ sensor ให้ดี

Feature ที่ควรลอง:

| Feature | ความหมาย |
|---|---|
| `mq2_raw` | ADC ดิบ |
| `mq2_avg` | ค่าเฉลี่ยลด noise |
| `mq2_delta` | `mq2_raw - baseline` |
| `mq2_ratio` | `mq2_raw / baseline` |
| `Rs` | resistance ตอนวัด |
| `Rs/Ro` | normalized sensor response |
| `temperature` | อธิบายผลกระทบสิ่งแวดล้อม |
| `humidity` | อธิบายผลกระทบสิ่งแวดล้อม |

Data collection ที่ดีควรมี:

```text
baseline -> rise -> steady -> recovery
```

และเก็บแยก session ชัดเจน:

```text
clean_air_01
smoke_01
voc_01
clean_air_02
smoke_02
voc_02
```

Split train/test ควรแยกด้วย session ไม่ใช่สุ่มแถวอย่างเดียว เพื่อป้องกัน data leakage

## 16. สรุปใช้งานจริง

สำหรับโปรเจกต์นี้ แนวทางที่เหมาะคือ:

1. ใช้ `AOUT` ไม่ใช่ `DOUT` สำหรับ ML
2. Burn-in sensor 24-48 ชั่วโมง
3. Warm-up ก่อนเก็บข้อมูล 20-30 นาที
4. หา `Ro` จาก clean air ด้วย `Ro = Rs_clean_air / 9.8`
5. ใช้ `Rs/Ro`, `mq2_delta`, `mq2_avg` เป็น feature
6. เก็บข้อมูลหลาย session พร้อม baseline
7. ใช้ calibration log เพื่อตรวจ sensor health
8. ถ้าจะรายงาน ppm จริง ต้องใช้ calibration gas และสร้าง calibration curve

