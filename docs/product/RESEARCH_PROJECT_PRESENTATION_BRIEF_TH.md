# Brief สำหรับสไลด์สอบโครงงานวิจัย

## ชื่อโครงงาน (เสนอ)

**ระบบเฝ้าระวังคุณภาพอากาศแบบ Electronic Nose และ IoT สำหรับพื้นที่พ่นสีฝุ่น**  
*Adaptive E-Nose and IoT Air-Quality Monitoring System for Powder-Coating Work Areas*

## 1. โครงร่างสไลด์แนะนำ (15–18 สไลด์)

### สไลด์ 1 — หน้าปก

- ชื่อโครงงาน, ชื่อผู้จัดทำ, อาจารย์ที่ปรึกษา, สาขา/สถานศึกษา และปีการศึกษา
- ภาพประกอบ: กล่องต้นแบบหรือแผนภาพระบบ

### สไลด์ 2 — ปัญหาและแรงจูงใจ

- พื้นที่พ่นสีฝุ่นมีความเสี่ยงจากฝุ่นสี สภาพอากาศไม่เหมาะสม และก๊าซ/ไอระเหยที่อาจเกิดจากกระบวนการหรือการทำความสะอาด
- การตรวจด้วยเครื่องมืออุตสาหกรรมมีต้นทุนสูงและอาจไม่แสดงแนวโน้มแบบต่อเนื่องในพื้นที่ทำงาน
- โรงงานต้องการระบบภายในที่ดูค่าแบบ real-time, แจ้งเตือน, บันทึกประวัติ และช่วยวางแผนบำรุงรักษา

### สไลด์ 3 — ขอบเขตปัญหาและข้อจำกัดที่ต้องสื่อสาร

- ระบบนี้เป็น **E-Nose เพื่อเฝ้าระวังและจำแนก pattern** ไม่ใช่เครื่องวิเคราะห์สารรายชนิดระดับห้องปฏิบัติการ
- ค่า MOX/MQ/CCS/MiCS มี cross-sensitivity, drift และผลจากอุณหภูมิ/ความชื้น
- จึงไม่กล่าวอ้างว่าเป็นค่า ppm ที่ใช้ยืนยันกฎหมาย หรือแทนผลตรวจปล่อง/ห้องแล็บได้
- การใช้ตัดสินใจด้านความปลอดภัยต้องมี calibration, เครื่องมืออ้างอิง และขั้นตอนรับรองเพิ่มเติม

### สไลด์ 4 — วัตถุประสงค์

1. พัฒนากล่องตรวจวัดคุณภาพอากาศแบบ sensor array บน ESP32
2. เก็บข้อมูลหลายตัวแปร ส่งขึ้นระบบเว็บ และแสดงผลแบบ real-time
3. ตรวจจับความผิดปกติของ sensor และลด false alert จากข้อมูลผิดปกติ
4. วางระบบ calibration, sensor health, runtime log และ maintenance trend
5. วางแนวทาง ML เพื่อจำแนกสภาวะอากาศตามข้อมูลที่เก็บและมี label

### สไลด์ 5 — คำถามวิจัย (Research Questions)

- Sensor array ร่วมกับข้อมูลอุณหภูมิ/ความชื้นสามารถจำแนกสภาวะ `clean air`, `paint dust`, `solvent/thinner` และ `smoke` ในบริบทที่เก็บข้อมูลได้หรือไม่?
- วิธี median sampling, warm-up gate, range/noise check และ baseline calibration ลด false positive ได้มากเพียงใด?
- ตัวชี้วัด sensor health, uptime, noise และ drift ช่วยวางแผน maintenance ได้หรือไม่?
- โมเดลมีความแม่นยำและความทนต่อการเปลี่ยนสภาพแวดล้อมเพียงใดเมื่อเทียบกับข้อมูลอ้างอิง?

### สไลด์ 6 — ภาพรวมสถาปัตยกรรม

```text
Sensor Array → ESP32 Firmware → Wi-Fi/HTTPS → FastAPI Backend → PostgreSQL/Neon
                                        ↓                         ↓
                                  Local display/kiosk      React Dashboard / Reports
                                        ↓
                                  OTA (outbound-only, signed: แผน production)
```

- Frontend: Vercel, backend: Render, database: Neon ตามการ deploy ปัจจุบัน
- ระบบออกแบบให้เริ่มจากหนึ่งกล่องและต่อยอดหลายกล่องได้

### สไลด์ 7 — Sensor Array ต้นแบบ

| กลุ่ม | Sensor ปัจจุบัน | บทบาทในการวิจัย |
|---|---|---|
| สิ่งแวดล้อม | DHT22 | Temperature/RH สำหรับติดตามและชดเชยผลของ sensor gas |
| ฝุ่น | PMS5003 | PM1.0/PM2.5/PM10 สำหรับแนวโน้มฝุ่น |
| VOC/คุณภาพอากาศ | CCS811 | TVOC และ eCO2 แบบ estimated |
| Gas array | MQ-2, MQ-3, MQ-8, MQ-135 | สัญญาณ MOX แบบ cross-sensitive เพื่อสร้าง fingerprint |
| Gas array | MiCS-6814 ผ่าน ADS1115 | ช่อง RED/OX/NH3 เพื่อเพิ่มความหลากหลายของ fingerprint |

> `eCO2` จาก CCS811 เป็นค่าประมาณ ไม่ใช่การวัด CO2 โดยตรง

### สไลด์ 8 — แนวคิด E-Nose และ Machine Learning

- Sensor เดี่ยวแยกสารหลายชนิดได้ไม่ดี; sensor array ให้รูปแบบสัญญาณ (fingerprint) ที่ต่างกัน
- นำ raw/derived signals, T/RH, เวลา, สถานะ warm-up และ baseline มาเป็น feature
- ผู้ปฏิบัติงานช่วยติด label เหตุการณ์ผ่านเว็บ/จอ เพื่อสร้าง dataset จริงของหน้างาน
- โมเดลต้อง versioned พร้อม dataset version, calibration condition, metric และการอนุมัติก่อนนำไปใช้

### สไลด์ 9 — การลด False Alert: กรณี MQ-3

- ปัญหาที่พบ: แจ้งเตือน alcohol สูงในอากาศที่ดูสะอาด
- สาเหตุที่เป็นไปได้: cross-sensitivity, warm-up ไม่ครบ, noise/ADC saturation, baseline ไม่ถูกต้อง, T/RH และ sensor drift
- วิธีที่เพิ่ม:
  - median จาก 9 samples และตรวจ sample spread
  - ตรวจ ADC range 0–4095 และจับ rail/saturation fault
  - ต้อง warm-up MQ-3 มากกว่า 48 ชั่วโมงก่อนใช้ alert/calibration
  - ต้องผ่านเงื่อนไขความเชื่อมั่นและหลายการอ่านต่อเนื่องก่อนแจ้งเตือน
  - แสดงค่าเป็น estimate; ไม่แสดงเกินช่วง 25–500 ppm ของ datasheet เป็นค่าที่ valid

### สไลด์ 10 — Sensor Validation และ Calibration

- ตรวจ live health: range, missing signal, noise, stale reading และ uptime
- เก็บ baseline/R0 ต่อ module และวงจรจริง ไม่ใช้ baseline ร่วมกันทุกตัว
- Calibration request จากเว็บส่งถึง device แล้ว device เก็บค่าและตอบกลับเพื่อบันทึกผล
- Protocol ที่ต้องทำต่อ: zero air, reference exposure, จำนวนซ้ำ, pass/fail, uncertainty และ recalibration interval
- ต้อง co-locate กับเครื่องมืออ้างอิง/ก๊าซมาตรฐานก่อนอ้างความแม่นยำเชิงปริมาณ

### สไลด์ 11 — Web Dashboard และ Operation

- Dashboard: ค่าปัจจุบัน, แนวโน้ม, alert และสถานะอุปกรณ์
- Settings: calibration, sensor health, runtime/ชั่วโมงใช้งาน และ diagnostic
- Maintenance: ตรวจ noise/drift, อายุ calibration, filter/sensor replacement
- Export: เป้าหมาย PDF, XLSX, CSV และเก็บหลักฐาน 5 ปี
- ผู้ใช้รับทราบ alert ผ่านเว็บ/จอสัมผัส; LINE OA เป็นแผน escalation ในอนาคต

### สไลด์ 12 — สิทธิ์ผู้ใช้และ Audit Trail (แผน production)

| Role | หน้าที่ |
|---|---|
| Operator | ดูข้อมูล, รับทราบ alert, บันทึกการแก้ไข |
| Engineer | calibration, maintenance และยืนยันการปิด alert รุนแรง |
| Admin | จัดการ user, device, role และ threshold |
| Viewer | ดูข้อมูลและ export แบบ read-only |

- Alert workflow: `Active → Acknowledged → In progress → Resolved → Verified`
- บันทึกผู้กระทำ, เวลา, role, box ID, note และหลักฐานแบบ append-only
- เป้าหมาย SLA: Warning 10 นาที; High/Critical 5 นาที

### สไลด์ 13 — Data, Log และ Predictive Maintenance

- บันทึก telemetry, sensor status, error/noise, calibration และ model/firmware version
- เก็บ online hours ต่อ sensor; นับเฉพาะเวลาที่มี valid field และจำกัด gap เพื่อไม่สร้าง runtime เทียม
- วิเคราะห์ trend: baseline drift, noise, PM load, uptime, อายุ calibration และประวัติเปลี่ยน filter/sensor
- ใช้ DuckDB สำหรับวิเคราะห์ CSV/Parquet/log แบบ read-only ในงานวิจัย

### สไลด์ 14 — Security และการ Deploy

- แยก Wi-Fi secret และ database URL ออกจาก source code
- Backend ใช้ environment variable `DATABASE_URL`; deployment ปัจจุบันคือ Vercel + Render + Neon
- ล้าง credential ที่เคยอยู่ใน Git history และควร rotate credential เดิม
- แผน production: login/RBAC, device identity, restricted CORS, signed artifact, signed outbound-only OTA, audit log และ backup/restore

### สไลด์ 15 — ผลงานที่ทำแล้ว และสถานะ

| ส่วนงาน | สถานะ |
|---|---|
| ESP32 รับอ่าน sensor และส่ง telemetry | มีต้นแบบแล้ว |
| Dashboard/Backend/Database | มีและ deploy แล้ว |
| Health/range/noise check, median sampling, warm-up gate | เพิ่มแล้วในระดับต้นแบบ |
| Calibration command จากเว็บ | มีแนวทางและส่วนเชื่อมต่อแล้ว ต้องทดสอบกับ hardware จริง |
| Runtime/status logging | มีแนวทางและ schema/endpoint ที่เกี่ยวข้อง |
| ML classification ที่ผ่าน validation หน้างาน | ยังต้องเก็บ dataset และประเมินอย่างเป็นระบบ |
| Login/RBAC/audit/OTA signature | เป็นแผนก่อน production |
| รายงาน compliance การปล่อยจากปล่อง | ยังทำไม่ได้จาก sensor ภายในพื้นที่เพียงอย่างเดียว |

### สไลด์ 16 — วิธีประเมินผลที่เสนอ

- **Hardware reliability:** uptime, missing-frame rate, sensor fault rate, reconnect time, power-cycle/soak test
- **Measurement quality:** repeatability, noise, response/recovery time, drift, cross-sensitivity และเทียบ reference
- **ML:** train/validation/test แยกตามเวลา/วัน, confusion matrix, precision/recall/F1 ต่อ class, false alarm rate และ confidence calibration
- **Operation:** เวลา acknowledge/resolve alert, maintenance completion, completeness ของ audit log
- แยกผล `raw`, `validated`, `derived/estimated` อย่างชัดเจน

### สไลด์ 17 — แผนดำเนินงานต่อ

1. ตรวจ schematic/BOM, rail 5V, heater current, ADC input และ enclosure/airflow
2. ทำ calibration protocol และเก็บ reference dataset
3. ทำ login/RBAC/device identity/audit trail ก่อนเปิด production จริง
4. ทำ test plan: sensor fault, Wi-Fi loss, DB outage, OTA interruption, 72-hour soak
5. ทำ model evaluation และกำหนด threshold จากหลักฐานข้อมูล ไม่กำหนดจากการเดา
6. ศึกษา/เลือก sensor รุ่น production เช่น SPS30, SHT41-F, SCD41, BME68x/SGP41 ตามชนิดสารและผลทดสอบจริง

### สไลด์ 18 — บทสรุป

- โครงงานสร้างระบบเฝ้าระวังคุณภาพอากาศแบบ low-cost, connected และต่อยอด ML ได้
- จุดเด่นคือ integration ของ sensor array, telemetry, dashboard, calibration/health log และแนวทาง maintenance
- คุณค่าทางวิจัยอยู่ที่การทำ sensor validation, false-alert reduction, dataset ที่มี label และการประเมินโมเดลอย่างถูกต้อง
- เป้าหมาย production ต้องดำเนินควบคู่กับความปลอดภัย การสอบเทียบ และการทดสอบหน้างาน ไม่ใช่เพิ่ม sensor หรือ AI เพียงอย่างเดียว

## 2. ข้อมูลที่ควรเก็บเป็นหลักฐานก่อนวันสอบ

1. ภาพกล่องจริง, wiring/PCB และตำแหน่งติดตั้ง
2. ภาพ Dashboard, Settings/Calibration, Alert และ Maintenance
3. Serial log หรือ API telemetry ที่แสดง sensor ทุกตัว
4. ตารางทดสอบก่อน/หลัง median sampling และ warm-up gate สำหรับ false alert
5. CSV จริงอย่างน้อยช่วง clean air และเหตุการณ์ที่ติด label พร้อมเวลาชัดเจน
6. กราฟ trend ของ PM, T/RH, raw gas signal, uptime และ status fault
7. ผล calibration/reference หรือระบุตรงไปตรงมาว่าอยู่ระหว่างจัดหาเครื่องมืออ้างอิง
8. ผลทดสอบระบบอย่างน้อย Wi-Fi reconnect, sensor disconnect และ reboot

## 3. ข้อความที่ควรหลีกเลี่ยงในการสอบ

- “วัด VOC/แอลกอฮอล์เป็น ppm แม่นยำตามกฎหมายแล้ว” หากไม่มี calibration traceable และ reference result
- “ผ่านมาตรฐานการปล่อยอากาศของโรงงาน” จาก sensor ในห้องเพียงอย่างเดียว
- “AI แยกสารได้ทุกชนิด” เพราะโมเดลแยกได้เฉพาะ classes และเงื่อนไขที่มีใน dataset
- “ระบบพร้อม production” ก่อนผ่าน security, electrical, reliability และ acceptance test

## 4. แหล่งข้อมูลใน repository

- `docs/product/PROJECT_DEFENSE_QA_TH.md` — ชุดคำถาม-คำตอบสำหรับเตรียมสอบ รวมถึงเหตุผลเลือกโมเดลและข้อจำกัดของผลปัจจุบัน

- `vocs-website/SENSOR_VALIDATION.md` — validation rule, datasource และข้อจำกัด
- `vocs-website/PROJECT_REVIEW_AND_PLAN.md` — สรุปสถานะและ roadmap
- `vocs-website/WEB_BACKEND_REVIEW_AND_PLAN.md` — web/backend/security/operation plan
- `vocs-website/HARDWARE_FIRMWARE_REVIEW_AND_PLAN.md` — hardware/firmware/calibration plan
- `docs/product/PRODUCTION_SENSOR_SPEC.md` — แนวทาง sensor รุ่น production (ต้องตรวจ datasheet จริงก่อนจัดซื้อ)
- `docs/research/reference/` — paper และข้อมูลอ้างอิง
- `logbook/2026-10-26_sensor-validation-planning-and-secure-deployment.md` — บันทึกการตัดสินใจและงานที่ทำ
