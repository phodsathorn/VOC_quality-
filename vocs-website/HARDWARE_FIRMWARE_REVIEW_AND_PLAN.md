# รีวิวและแผนดำเนินงาน — Hardware / Firmware

**ขอบเขต:** ESP32, sensor, วงจร/ไฟเลี้ยง, การติดตั้ง, ความถูกต้องการวัด, device security, calibration, touch display และ firmware reliability  
**ไม่อยู่ในขอบเขต:** login/RBAC และ UI เว็บ — ดู `WEB_BACKEND_REVIEW_AND_PLAN.md`

## สถานะปัจจุบัน

มี range check, median sampling สำหรับ MQ, warm-up gate และ telemetry สถานะ/ชั่วโมงทำงานแล้ว แต่ **ยังไม่สามารถยืนยันความแม่นยำหรือใช้ยืนยันความปลอดภัยโรงงานได้** เพราะยังไม่มี schematic, รุ่น module ที่แน่นอน และผลวัดสภาพไฟฟ้าจริง อีกทั้ง firmware มี Wi-Fi credential ใน source, TLS ไม่ตรวจ certificate และ OTA ยังไม่มี authentication/signature

## ข้อกำหนดที่ยืนยันแล้ว

- ติดตั้งภายในโรงงานพ่นสีฝุ่น/สี เริ่มหนึ่งกล่องแต่รองรับหลายกล่อง
- Sensor: DHT22, CCS811, PMS5003, MQ-2/MQ-3/MQ-8/MQ-135 และ **MiCS-6814**
- มีจอสัมผัสที่กล่อง/พื้นที่งานเพื่อแสดงและรับทราบ Alert
- ต้อง OTA จากภายนอกได้ แต่เป็น outbound-only และ signed
- ต้องมี calibration/reference equipment และกราฟ maintenance trend

## คำถามบังคับ — หยุดก่อนเริ่ม Implement

ห้ามแก้ calibration, firmware security หรือ deploy หน้างานจนกว่าจะตอบครบ

1. ส่ง schematic, PCB revision, part number ของ module, รูปวงจร/การประกอบ และ pin map จริง
2. MQ ทุกช่องมี divider/buffer ให้ ADC ESP32 ไม่เกิน 3.3V หรือไม่? ส่งผลวัดแรงดันสูงสุดจริง
3. ส่งผลวัด rail 5V และกระแสตอน MOS heater ทุกตัวทำงาน, PSU rating, fuse/grounding
4. อธิบาย enclosure, airflow, จุดติดตั้งเทียบ spray/exhaust, อุณหภูมิ/ความชื้น, สารทำความสะอาด และ hazardous-area classification
5. มี zero air, calibration gas, chamber, stack flow meter, thermometer/RH reference, PM reference และ accredited lab อะไรบ้าง?
6. ยอมรับ downtime สำหรับ burn-in, calibration และ firmware update เท่าไร? ระหว่างล่มต้องอยู่ safe state ใด?
7. จอสัมผัส, badge/PIN, buzzer/stack light และ offline acknowledgement ใช้อุปกรณ์ใด/ต้องการแบบใด?
8. ส่ง permit, stack layout และ control equipment ก่อนออกแบบระบบตรวจปล่อยตามกฎหมาย

## ลำดับดำเนินงาน

### H0 — Electrical, Physical และ Cybersecurity Gate

1. จัดทำ as-built schematic/BOM และทำ electrical design review
2. วัด 5V heater supply/current, อุณหภูมิ, ADC input และ common ground ใน worst case
3. เพิ่ม divider/buffer/protection ให้ analog ที่อาจเกิน input ESP32 และยืนยัน ADC attenuation/calibration
4. ย้าย Wi-Fi/device secret ออกจาก firmware และ provision credential เฉพาะเครื่อง
5. ปิดหรือยืนยันตัวตน Web OTA/ArduinoOTA; แทน `setInsecure()` ด้วย CA validation หรือ certificate/public-key pinning
6. ใช้ signed outbound-only OTA พร้อม anti-rollback, recovery image และ post-reboot report
7. ให้ผู้เชี่ยวชาญความปลอดภัย/ไฟฟ้าโรงงานตรวจ enclosure, grounding, ignition/hazard และ placement ก่อน pilot

### H1 — Protocol ความถูกต้องราย Sensor

1. เขียน protocol: warm-up/burn-in, zero air, reference exposure, condition, จำนวนซ้ำ, pass/fail, uncertainty และ recalibration interval ของแต่ละ module
2. MQ: หา R0 ต่อ module จากวงจรจริง, จำกัดช่วง target gas, ระบุ cross-sensitivity/out-of-range เป็น estimate หรือ invalid
3. MQ-3: ต้อง conditioning 48 ชั่วโมงก่อนใช้ calibration/alert alcohol และต้องจับ baseline หลายตัวอย่างที่เสถียร
4. CCS811: ทำ burn-in/conditioning, temperature/RH compensation และแสดง eCO2 ว่าเป็น equivalent ไม่ใช่ CO2 จริง
5. MiCS-6814: ยืนยัน heater network/5V ตามผู้ผลิต และสอบเทียบ RED/OX/NH3 แยกกัน
6. PMS5003: ตรวจ fan/laser/air path, เทียบ reference และกำหนด cleaning/verification
7. DHT22: เทียบ thermometer/RH ที่สอบกลับได้ และ reject condensation/invalid condition

### H2 — Firmware Reliability และ Data Integrity

1. เพิ่ม state ต่อ sensor: `WARMING`, `OK`, `MISSING`, `NOISY`, `OUT_OF_RANGE`, `CALIBRATING`, `FAULT`
2. ส่ง sequence number, reset reason, uptime, RSSI, free heap, brownout/supply, I2C/UART error counter และ state/reason
3. Calibration ต้อง non-blocking/multi-sample และเก็บ approved baseline/calibration ID ใน NVS พร้อม version/CRC
4. Command ต้อง authenticated, idempotent และ acknowledge command ID เดียวกัน
5. ทำ offline queue แบบมีขอบเขต, exponential retry และ duplicate protection
6. จอต้อง queue acknowledgement ตอน network ล่มและ sync อย่างปลอดภัยเมื่อกลับมา

### H3 — ขอบเขตการตรวจปล่อยมลพิษ

E-Nose ภายในพื้นที่ **ยืนยันการปล่อยตามกฎหมายไม่ได้** การวัดรายปีต้องมีปล่องที่ระบุชัด, limit/method ที่เกี่ยวข้อง, การวัดมลพิษที่ผ่านเกณฑ์ และ exhaust flow ที่ตรวจสอบได้

1. ระบุ stack/duct, flow, ระบบบำบัด และ sampling point
2. จับคู่ permit กับ pollutant, sampling frequency, method และ QA ร่วมกับผู้รับผิดชอบสิ่งแวดล้อม/ห้องแล็บ
3. ใช้เครื่องมือ stack monitoring หรือ accredited periodic test ที่เหมาะสม; ห้ามใช้ MQ/CCS estimate เป็น monitor ปล่องตามกฎหมาย
4. เก็บ operating period (คาดไม่เกิน 2 วัน/สัปดาห์), flow และ pollutant ที่ผ่าน validation เพื่อรวมรายปี
5. ใช้ `INSUFFICIENT EVIDENCE` เมื่อไม่มี coverage/flow/concentration/QA ที่จำเป็น

## การทดสอบก่อน Factory Pilot

- Bench: ต่อ/ถอด sensor, ADC rail/short/open, I2C stuck, UART fault, heater power, Wi-Fi loss
- Reliability: power-cycle/brownout, soak 72 ชั่วโมง, reconnect, database outage, command retry, OTA interruption/recovery
- Measurement: zero/reference repeatability, ผล T/RH, cross-sensitivity, drift และเปรียบเทียบเครื่องอ้างอิง
- Safety: อุณหภูมิ enclosure, dust/ingress, grounding, protection และ hazardous-area review
- เก็บ acceptance record: ผู้ทำ, serial/device, firmware, calibration ID, เครื่องมือ/ใบรับรอง, condition, ผล, exception และผู้อนุมัติ

## แหล่งอ้างอิง

- [การตรวจสอบ Sensor และ datasheet](SENSOR_VALIDATION.md)
- [OWASP IoT Top 10](https://owasp.github.io/www-project-internet-of-things/)
- [สรุปแผนทั้งโครงการ](PROJECT_REVIEW_AND_PLAN.md)
