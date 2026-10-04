# QA Review — Arduino Diagnostic สำหรับ E-Nose AQM

> วันที่ตรวจ: 21 กันยายน 2026  
> ขอบเขต: ตรวจโค้ดแบบ static review ของ `test_1st_air_quality_box.ino`, `debug_diagnostic.ino` และ `test_dht22_only.ino` รวมถึงเทียบ pinout กับเอกสารวงจรที่เกี่ยวข้อง  
> สถานะ: **ไม่อนุมัติให้ประกาศว่า “ระบบพร้อมใช้งาน”**

รายงานนี้แยกคำว่า **สื่อสารได้/มีสัญญาณ** ออกจาก **อุปกรณ์ทำงานจริงและค่ามีความน่าเชื่อถือ** อย่างเคร่งครัด โดยยังไม่มี log จากบอร์ดจริง, การทดสอบกับฮาร์ดแวร์, หรือผล compile ที่ตรวจสอบได้ใน repository นี้ จึงไม่มีข้อใดในรายงานนี้เป็นการรับรองฮาร์ดแวร์จริง

## ผลสรุปสำหรับ QA

โค้ดหลักเป็น *diagnostic sketch* ที่ช่วยหาอุปกรณ์และอ่านข้อมูลได้บางส่วน แต่ไม่ใช่ระบบวัดคุณภาพอากาศพร้อมใช้งาน และมีการตั้ง PASS ที่หลักฐานไม่พออยู่จริง โดยเฉพาะ Relay และ MiCS-6814 ดังนั้นข้อความ `🎉 ทุกอย่างผ่านหมด! ระบบพร้อมใช้งาน` ใน [test_1st_air_quality_box.ino](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:143) เป็นข้อความที่ **ไม่ถูกต้องตามหลักฐานที่โค้ดเก็บได้**

### เกณฑ์ความหมายของผล

| ระดับ | ความหมายที่อนุญาตให้แสดง |
|---|---|
| DETECTED | พบ ACK / frame / ตัวเลขหนึ่งครั้ง: ยืนยันได้แค่ช่องทางสื่อสารหรือสัญญาณเข้ามา |
| FUNCTIONAL | มีการทดสอบ input-output ที่สังเกตได้และผ่านเกณฑ์: ยืนยันการทำงานเฉพาะฟังก์ชันนั้น |
| VALIDATED | ผ่าน warm-up, calibration/reference และการทดสอบซ้ำ: จึงกล่าวได้ว่าค่าเหมาะกับการใช้งานตามที่กำหนด |

โค้ดปัจจุบันควรแสดงสูงสุดเป็น `DETECTED` สำหรับ I2C/PMS/DHT บางกรณีเท่านั้น ไม่ควรใช้คำว่า `PASS` โดยไม่มีระดับและหลักฐาน

## ข้อบกพร่องที่ต้องแก้ก่อนรับงาน

| ระดับ | จุดที่พบ | หลักฐานในโค้ด | เหตุผลที่ผลเดิมใช้ไม่ได้ | เกณฑ์แก้ไข/รับได้ |
|---|---|---|---|---|
| Blocker | Relay ถูกบังคับ PASS | [บรรทัด 417](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:417) กำหนด `ok_relay = true` หลังสั่ง GPIO โดยไม่มีการอ่าน feedback | MCU เขียน LOW/HIGH สำเร็จไม่ได้แปลว่า relay ดูดหน้าสัมผัส, พัดลมมีไฟ หรือพัดลมหมุน | เพิ่ม feedback จริง เช่น tachometer/current sensor/auxiliary contact แล้วทดสอบ ON/OFF ทั้งสองช่อง; ถ้าไม่มี feedback ต้องแสดง `MANUAL_CONFIRM_REQUIRED` และห้ามรวมใน `allPass` |
| Blocker | ADS1115 ถูกตีความว่า “ADS1115 + MiCS ผ่าน” | [บรรทัด 305–315](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:305) ตั้ง PASS ทันทีที่ `ads.begin()` สำเร็จ | เป็นเพียง I2C ACK ของ ADS1115; ไม่พิสูจน์ว่า MiCS มีไฟ, heater ทำงาน, สาย A0/A1/A2 ต่ออยู่ หรือสัญญาณไม่ลอย | แยก `ads_detected` จาก `mics_channels_valid`; ตรวจหลาย sample, rail/floating/stuck fault และต้องมี baseline หลัง warm-up ก่อนรับรอง MiCS |
| High | MQ ผ่านจากค่าเดียวที่ไม่ติดขอบ ADC | [บรรทัด 364–385](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:364) ใช้เพียง `10 < raw < 4090` | ขา floating, divider ผิดค่า, sensor ไม่มี heater หรือสัญญาณรบกวนสามารถอยู่กลางช่วงและผ่านได้ จึงเป็น false positive | เก็บ sample ต่อเนื่อง, ตรวจ range/variance/stuck พร้อม test fixture ที่ป้อนแรงดันอ้างอิง; การรับรอง sensor ต้องผ่าน warm-up และ calibration (เช่น baseline/Ro) |
| High | วงจร divider ตามเอกสารไม่มี margin ความปลอดภัย | [circuit_design_test_relay.md](/Users/urworld/paper_sensor_VOC/circuit_design_test_relay.md:76) ระบุ R1=10k/R2=20k | สูตร `Vout = Vin × 20/(10+20)` ทำให้ 5.00 V เป็น 3.33 V ซึ่งเกิน rail 3.3 V แล้ว; แหล่งจ่ายที่สูงกว่านี้เสี่ยง ADC ของ ESP32 และ ADS1115 ที่จ่าย VDD 3.3 V | วัด Vin/Vout จริงด้วยมิเตอร์ก่อนต่อ ADC และออกแบบอัตราส่วนให้ worst-case ต่ำกว่า 3.3 V อย่างมี margin; ห้ามใช้ผล ADC เป็นหลักฐานว่าแรงดันปลอดภัย |
| High | Live DHT ตรวจเพียง temperature | [บรรทัด 161–167](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:161) ตรวจ `!isnan(temp)` แต่พิมพ์ `hum` เสมอ | ถ้า humidity เป็น NaN จะรายงานบรรทัดเหมือนอ่านสำเร็จ | ตรวจ `!isnan(temp) && !isnan(hum)` ทุกครั้ง และบันทึก/แสดง error ของทั้งคู่ |
| High | Wi-Fi test ไม่ได้ตรวจ “เสาอากาศ” | [บรรทัด 230–243](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:230) ใช้ association และ RSSI ครั้งเดียว | เชื่อม AP ได้ไม่ได้ยืนยันว่าเสาอากาศภายนอกต่อถูกหรือประสิทธิภาพดี และไม่มีการตรวจ network/DNS/server ตามที่ระบบจะใช้ | เปลี่ยนชื่อผลเป็น `WiFi association`; หากต้องตรวจ network ให้ทดสอบ endpoint ที่กำหนดและเกณฑ์ latency/packet-loss; antenna ต้องเทียบ RSSI แบบควบคุมหรือวัด RF |
| Medium | PMS debug ตรวจ header 2 bytes เท่านั้น | [debug_diagnostic.ino](/Users/urworld/paper_sensor_VOC/debug_diagnostic/debug_diagnostic.ino:152) | `0x42 0x4D` ไม่พิสูจน์ length, checksum หรือความสดใหม่ของ frame; จึงไม่ควรกล่าวว่า “ส่งข้อมูลถูกต้อง” | ใช้ parser ที่ตรวจ frame length/checksum และผ่านอย่างน้อย N frame ภายในเวลาที่กำหนด; รายงาน timeout/checksum error แยกกัน |
| Medium | ข้อผิดพลาดระหว่าง live read ถูกกลืน | CCS811 จะไม่พิมพ์อะไรเมื่อ `available()` เป็น false หรือ `readData()` error ([บรรทัด 170–175](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:170)); PMS timeout ก็เงียบ ([บรรทัด 197–203](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:197)) | ผู้ใช้เห็นว่าระบบยังรันอยู่ แต่ไม่รู้ว่า sensor หยุดส่งข้อมูลแล้ว | ทุก sensor ต้องมี `last_good_timestamp`, timeout, error counter และเปลี่ยนสถานะเป็น `STALE/FAIL` อย่างชัดเจน |
| Medium | Debug GPIO ทำลาย state ที่เพิ่งตั้งไว้และไม่ได้ทดสอบ GPIO จริง | [debug_diagnostic.ino](/Users/urworld/paper_sensor_VOC/debug_diagnostic/debug_diagnostic.ino:77) ตั้งทุก pin เป็น `INPUT` หลังใช้ I2C/UART/SET/relay | เปลี่ยน GPIO 21/22, 16/17, 23, 25/26 เป็น input แล้วอ่านค่าไม่บอกว่า I2C/UART/relay ทำงาน; `analogRead()` บนขาดิจิทัลก็ไม่ใช่การทดสอบอุปกรณ์ | อย่าเปลี่ยน mode ของ bus/actuator เพื่อ “สำรวจ”; แยก test ตามชนิดขาและตรวจผลผ่าน protocol/feedback ที่ถูกต้อง |
| Medium | pinout ใน source/เอกสารขัดกัน | header โค้ดหลักยังบอก DHT=GPIO 4 และ CCS=Wire1 18/19 ([บรรทัด 10–12](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:10)) แต่ code ใช้ DHT=27/Wire=21,22; [test_dht22_only.ino](/Users/urworld/paper_sensor_VOC/test_dht22_only/test_dht22_only.ino:3) และ [wiring_design.md](/Users/urworld/paper_sensor_VOC/wiring_design.md:86) ก็ยังบอก GPIO 4 | ผู้ปฏิบัติงานต่อสายตามเอกสารแล้ว fail หรืออ่านผิดพินได้ | กำหนด pin map ฉบับเดียวเป็น source of truth แล้วให้ทุก sketch/เอกสารอ้างอิงไฟล์เดียวกัน; แก้ comment และข้อความ Serial ก่อนทดสอบจริง |
| Medium | `DHT22 only` แสดงพินไม่ตรงกับค่าที่ compile | macro ใช้ GPIO 27 แต่ comments/Serial บอก GPIO 4 ([test_dht22_only.ino](/Users/urworld/paper_sensor_VOC/test_dht22_only/test_dht22_only.ino:3)) | ผลทดสอบอาจถูกตีความว่าเป็นการยืนยันสาย GPIO 4 ทั้งที่โค้ดอ่าน GPIO 27 | สร้างข้อความจาก `DHTPIN` เดียวกัน เช่น `Serial.printf(..., DHTPIN)` |
| Medium | สถานะ test ครั้งเดียวถูกใช้ต่อใน loop โดยไม่ revalidate | `ok_ccs811` และ `ok_ads1115` ตั้งใน setup แล้ว gate การอ่านตลอดไป | อุปกรณ์ที่หลุดหรือค้างหลัง setup ยังมีสถานะ PASS เดิม | state ต้องอิงความสำเร็จล่าสุดและ timeout ไม่ใช่ผลจาก boot เพียงครั้งเดียว |
| Low | credentials Wi-Fi อยู่ใน source | [บรรทัด 41–42](/Users/urworld/paper_sensor_VOC/test_1st_air_quality_box/test_1st_air_quality_box.ino:41) | เสี่ยงเผยรหัสใน repo/ภาพหน้าจอ และไม่เหมาะกับ code ที่แจก | หมุนรหัสหากเป็นรหัสจริง; ใช้ `secrets.h` ที่ไม่ commit หรือ provisioning |

## สิ่งที่โค้ดตรวจได้จริงในปัจจุบัน

| ส่วน | สิ่งที่อนุมานได้เมื่อผลสำเร็จ | สิ่งที่ยังห้ามอ้าง |
|---|---|---|
| DHT22 | มีการตอบกลับเป็นตัวเลข T/RH หนึ่งครั้ง (ช่วง setup ตรวจ NaN ทั้งคู่) | ความแม่นยำ, ความเสถียร, การชดเชยอุณหภูมิ/ความชื้น |
| CCS811 | ชิปตอบ I2C และมี data-ready/read สำเร็จหนึ่งครั้ง | ค่า eCO2/TVOC แม่นยำ หรือผ่าน burn-in/calibration |
| ADS1115 | ADC ตอบ I2C ที่ address 0x48 | MiCS-6814 ทั้ง 3 ช่องหรือ heater ทำงาน |
| PMS5003 ใน sketch หลัก | library ให้ frame ที่ parser รับได้อย่างน้อยหนึ่ง frame | ความแม่นยำ/ความคงที่ของ PM; ใน debug sketch ยืนยันได้แค่พบ header |
| MQ | ADC ได้ค่าเดียวไม่ใช่ 0 หรือใกล้เต็ม scale | MQ ทุกตัวต่อถูก, heater ทำงาน, มี gas response หรือค่าพร้อมใช้งาน |
| Relay | ESP32 ส่งระดับ logic ออก GPIO 25/26 ตามคำสั่ง | relay/contact/fan ทำงานจริง |
| Wi-Fi | เชื่อม association กับ SSID ที่กำหนดได้ ณ เวลานั้น | เสาอากาศดี, Internet หรือบริการปลายทางใช้งานได้ |

## ความเสี่ยงด้านระบบที่ต้องบันทึก

- โค้ดไม่มี control loop สำหรับ fan, alarm, data logging หรือ fail-safe; จึงเป็นเครื่องมือวินิจฉัย ไม่ใช่ firmware ปฏิบัติงานของระบบ AQM
- อ่านค่า MQ เป็น raw ADC และ MiCS เป็น voltage เท่านั้น ไม่มี calibration หรือ gas model จึงห้ามแสดงเป็น ppm หรือใช้ตัดสินคุณภาพอากาศ.
- ค่า CCS811/MQ/MiCS ต้อง warm-up/burn-in ตามข้อกำหนดของแต่ละเซ็นเซอร์ และต้องมีเงื่อนไขใน code ที่บล็อก `VALIDATED` ก่อนครบเวลา ไม่ใช่เพียงข้อความเตือนใน Serial.
- `analogRead()` ของ ESP32 ต้องกำหนด attenuation/การแปลงแรงดันและยืนยันกับแรงดันอ้างอิง; สูตร `raw * 3.3 / 4095` ในโค้ดเป็นเพียงค่าประมาณ ไม่ใช่ผลสอบเทียบ.
- โมดูล relay 5 V บางรุ่นไม่รับ logic HIGH 3.3 V ได้แน่นอน แม้เป็น optocoupler; ต้องวัด logic threshold/ทดสอบกับโมดูลจริงก่อนกล่าวว่าควบคุมได้.

## เกณฑ์ทดสอบภาคสนามก่อนเปลี่ยนเป็น PASS

1. ระบุ firmware/commit, board package และ version library; compile และเก็บผล build ที่ไม่มี error/warning สำคัญ.
2. ใช้ pin map ฉบับเดียว ตรวจสายและแรงดันด้วยมัลติมิเตอร์ก่อนเสียบ ADC; วัด output ของ divider ที่ Vin ต่ำสุด/ปกติ/สูงสุด.
3. บันทึก serial log ที่มีเวลาอย่างน้อย 10 นาทีหลัง warm-up ตามข้อกำหนดของ sensor และบันทึก failure/timeout ด้วย.
4. ทดสอบ DHT กับ reference, PMS กับแหล่งอากาศ/เครื่องอ้างอิงตามที่หาได้, และ MQ/MiCS ด้วย baseline และ stimulus ที่ควบคุมได้; ระบุ acceptance range ล่วงหน้า.
5. ทดสอบ relay/fan ด้วย feedback: OFF ต้องไม่มี pulse/current, ON ต้องมี pulse/current ภายใน timeout และทดสอบซ้ำหลายรอบทั้งสองช่อง.
6. ตัดสาย/ปิดไฟของ sensor แต่ละตัว, ทำ I2C/UART fault, ทำ Wi-Fi หลุด และตรวจว่า code รายงาน `FAIL/STALE` ไม่ใช่ PASS ค้าง.
7. จึงออกผลแยก `DETECTED`, `FUNCTIONAL`, `VALIDATED` พร้อม log และหมายเลขชิ้นงาน; หากไม่มีหลักฐานให้รายงาน `NOT VERIFIED` เท่านั้น.

## คำตัดสิน QA

**REJECT — ต้องแก้ Blocker และ High ทุกข้อก่อนอนุญาตให้มีข้อความ “ระบบพร้อมใช้งาน”**  
ระหว่างนี้คำที่ถูกต้องสำหรับโค้ดคือ: **“เครื่องมือ diagnostic เบื้องต้น; ผล PASS บางรายการยืนยันเพียงการสื่อสาร/ค่า ADC และยังไม่ยืนยันฮาร์ดแวร์หรือความถูกต้องของการวัด”**
