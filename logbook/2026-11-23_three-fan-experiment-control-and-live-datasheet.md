# 2026-11-23 — เพิ่มพัดลมตัวที่ 3 (GPIO 4) พร้อมระบบควบคุมพัดลม 3 ช่องทางไกลและตารางมอนิเตอร์ผลการทดลองสด 8 เซนเซอร์บนหน้าเว็บ

## สรุป
อัปเดตเฟิร์มแวร์ ESP32 (`voc_esp32.ino`), ระบบหลังบ้าน FastAPI (`main.py`), และหน้าเว็บแดชบอร์ด (`DataCollection.jsx`, `Dashboard.jsx`) เพื่อรองรับการทดลองสารเคมีและฝุ่นละอองตามแบบบันทึกผลการทดลอง 12 หน้า โดยเพิ่มพัดลมตัวที่ 3 ที่ขา **GPIO 4** (`FAN_AUX`), เพิ่มการส่งค่า **PM10** จากเซนเซอร์ `PMS5003`, สร้างระบบสั่งเปิด-ปิดพัดลมทั้ง 3 ตัวผ่านหน้าเว็บแบบเรียลไทม์ (ซิงก์ภายใน 1–3 วินาทีผ่าน Ingest Piggyback และ Device Command Queue), และเพิ่มตารางคำนวณค่า $V_{out}, R_{clean}, R_0, \text{Peak}, R_s/R_0, R_s/R_{clean}$ และเกตตรวจสอบการคืนตัว $\pm 5\%$ สดครบทั้ง 8 เซนเซอร์

## สิ่งที่เปลี่ยน
1. **ESP32 Firmware ([`hardware/firmware/voc_esp32/voc_esp32.ino`](file:///Users/urworld/paper_sensor_VOC/hardware/firmware/voc_esp32/voc_esp32.ino))**:
   - เพิ่มการนิยามขาพัดลมตัวที่ 3: `#define FAN_AUX 4` (พัดลมตัวที่ 3 / IN3 ที่ **GPIO 4**) ร่วมกับ `FAN_INTAKE` (GPIO 25) และ `FAN_EXHAUST` (GPIO 26)
   - นำคู่ขา `{25, 26}` และ `{4, 15}` ออกจาก `I2C_CANDIDATES` เพื่อป้องกันไม่ให้การสแกนบัส I2C ตอนบูตไปรบกวนขารีเลย์พัดลมทั้ง 3 ตัว และล็อกขา `DHT22` ไว้ที่ `GPIO 27`
   - สร้างฟังก์ชัน `applyThreeFans(bool f1, bool f2, bool f3, bool isManual)` สำหรับควบคุมสถานะพัดลมแต่ละตัวได้อย่างอิสระตามสเตจการทดลอง
   - เพิ่มการอ่านค่า `d.pm10 = pmData.pm100_env` จาก `PMS5003` และส่งค่า `pm10`, `fan1`, `fan2`, `fan3` ขึ้นไปยัง `POST /api/ingest`
   - รองรับการรับคำสั่ง `fan_control` แบบ Piggyback จากผลลัพธ์ของ `POST /api/ingest` (ตอบสนองภายใน 1–3 วินาที) และคำสั่ง `SET_FANS` จาก `GET /api/device-command`
2. **Backend API ([`vocs-website/backend/main.py`](file:///Users/urworld/paper_sensor_VOC/vocs-website/backend/main.py))**:
   - เพิ่มฟิลด์ `pm10`, `fan1`, `fan2`, `fan3` ใน `IngestPayload`
   - สร้าง Endpoint `GET /api/devices/{box_id}/fans` และ `POST /api/devices/{box_id}/fans` สำหรับอ่านและสั่งเปิด-ปิดพัดลมทั้ง 3 ตัวแยกอิสระหรือตามสเตจการทดลอง
   - ส่งสถานะ `fans` (`fan1, fan2, fan3`) และ `environment.pm10` ออกไปใน `GET /api/dashboard/latest`
3. **Frontend Web UI ([`vocs-website/frontend/src/pages/DataCollection.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/DataCollection.jsx) & [`Dashboard.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/Dashboard.jsx))**:
   - ในหน้า **บันทึกตัวอย่างก๊าซ (`DataCollection.jsx`)**:
     - เพิ่ม **แผงควบคุมพัดลมการทดลอง 3 ตัว (GPIO 25, GPIO 26, GPIO 4)** พร้อมสวิตช์เปิด-ปิดรายตัว และปุ่มลัด 4 สเตจตามใบงาน 25 นาที (1. วัด Baseline ปิดทั้งหมด, 2. ดูดสารเข้า IN1, 3. ดูดเข้า + พัดลมตัวที่ 3 GPIO 4, 4. ระบายอากาศทิ้ง 100% เปิดทั้ง 3 ตัว)
     - เพิ่ม **ตารางมอนิเตอร์ผลการทดลองสด 8 เซนเซอร์ (Live Lab Datasheet)** แสดงค่า `ADC`, `Vout (V)`, `R_clean (Ω)`, `Clean Ratio`, `R0 (Ω)`, `ค่าพีคสูงสุด`, `Rs/R_clean`, `Rs/R0`, `MiCS-6814 (NH3, CO, NO2 mV)`, `CCS811 (TVOC, eCO2)`, `PMS5003 (PM2.5, PM10)`, `DHT22 (T, RH)`, และสถานะ **Dynamic Baseline Gate ($\pm 5\%$)** พร้อมกล่องแสดงวิธีคำนวณสำหรับลอกลงหน้า 12 ของใบงาน
   - ในหน้า **แผงควบคุมหลัก (`Dashboard.jsx`)**:
     - อัปเดตการ์ดพัดลม (Card 3) ให้แสดงจำนวนพัดลมที่ทำงานอยู่ (`X/3 ตัว`) พร้อมปุ่มกดสลับสถานะ `IN1 (G25)`, `IN2 (G26)`, `IN3 (G4)` ได้ทันทีจากหน้าแรก

## เหตุผลและผลกระทบ
- **เหตุผล:** เพื่อให้ซอร์สโค้ดของบอร์ดและหน้าเว็บสอดคล้องกับแบบบันทึกผลการทดลอง 12 หน้าทุกประการ รองรับพัดลมตัวที่ 3 ที่ขา GPIO 4 และช่วยให้ผู้ทำการทดลองสามารถสั่งเปิด-ปิดพัดลมและจดค่าตัวเลขลงตารางที่ 1–4 และหน้า 12 ได้จากหน้าเว็บโดยตรง
- **ผลกระทบ:** ผู้ทดลองสามารถควบคุมสเตจการทดลอง (Baseline, Exposure, Circulation, Purge) จากหน้าเว็บได้ทันทีโดยไม่ต้องใช้สวิตช์มือภายนอก และมีค่า `PM10`, $R_0$, $R_s/R_0$ คำนวณสดให้ครบถ้วน

## การตรวจสอบ
- `python3 -m py_compile vocs-website/backend/main.py`: ผ่านสมบูรณ์ (Exit code 0)
- `npm --prefix vocs-website/frontend run build`: ผ่านสมบูรณ์ (`✓ built in 170ms`, 0 errors)
- `npm --prefix vocs-website/frontend run lint`: ผ่านสมบูรณ์ (`0 errors`)

## สถานะและงานค้าง
- [x] เพิ่มพัดลมตัวที่ 3 ที่ขา GPIO 4 ในเฟิร์มแวร์ ESP32
- [x] เพิ่ม API และระบบ Piggyback สำหรับสั่งควบคุมพัดลม 3 ตัวและรับค่า PM10
- [x] สร้างแผงควบคุมพัดลม 3 ตัวและตารางมอนิเตอร์ใบงานการทดลองสด 8 เซนเซอร์บนหน้าเว็บ
- [x] แก้ไขหน้า `Alerts.jsx` ไม่ให้ Hardcode คำว่า `"วันนี้"` ใส่ Alert เก่า และแสดงวันที่จริง + กฎการตรวจวัดจริง
- [ ] อัปโหลดเฟิร์มแวร์ `v1.2.0` ลงบอร์ด ESP32 เพื่อทดสอบร่วมกับพัดลมจริงในห้องแล็บ

---

## อัปเดตเวลา 17:55 ICT — แก้ไขหน้าการแจ้งเตือน (`Alerts.jsx`) ที่ขึ้นคำว่า "วันนี้" บนข้อมูลเก่าขณะกล่องออฟไลน์
- **สาเหตุที่พบ:**
  1. ใน `Alerts.jsx` (บรรทัด 159 เดิม) เขียน Hardcode ต่อท้ายเวลาทุกแถวด้วยคำว่า `` `${a.time} Today` `` (ซึ่งถูกแปลเป็น `"วันนี้"`) โดยไม่ได้ตรวจเช็กวันที่จริงจากฟิลด์ `created_at` ทำให้ข้อมูลเก่าในฐานข้อมูล (เช่น ตอนรันชุดทดสอบ Kiosk หรือข้อมูลเมื่อวันที่ 3 พ.ย. / 17 พ.ย.) ถูกแปะคำว่า **"วันนี้"** ทุกแถว
  2. รายการ `⚠️ กล่องตรวจจับ BOX-001 ขาดการเชื่อมต่อ (Offline นาน 1222594s)` เกิดจาก Background Watchdog บนเซิร์ฟเวอร์ที่ตรวจพบว่าบอร์ดไม่ได้ส่งข้อมูลมา $1,222,594\text{ วินาที}$ ($\approx 14\text{ วัน}$) แต่โค้ดหน้าเว็บเดิมไม่รู้จักระดับ `High` จึงตกไปเข้าเงื่อนไข `else` แล้วแสดงป้ายระดับเป็น `• ปกติ` และแสดงกฎจำลองเป็น `TVOC > 200 ppb for 2 min`
- **สิ่งที่แก้ไขใน [`vocs-website/frontend/src/pages/Alerts.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/Alerts.jsx):**
  - คำนวณวันที่จริงจาก `a.created_at` เทียบกับเวลาปัจจุบัน (`Asia/Bangkok`): แสดงคำว่า `"วันนี้"` เฉพาะเหตุการณ์ที่เกิดวันนี้จริง หากเป็นวันอื่นจะแสดงวันที่เต็ม `DD/MM/YYYY HH:MM:SS`
  - ผูกตัวกรอง `วันที่: วันนี้ / ทั้งหมด` ให้กรองตาม `isToday` จริง
  - แปลงเวลา `Offline นาน 1222594s` ให้เป็นหน่วย `14 วัน 3 ชม.` ที่อ่านเข้าใจง่าย
  - แก้ป้ายระดับ `High` ให้แสดงเป็น `ความเสี่ยงสูง` (สีส้ม Amber) และแสดงกฎการตรวจวัด (`Rule`) ตามแหล่งที่มาจริง (`Heartbeat Timeout > 5 min`, `Manual Kiosk Emergency PIN`)

---

## อัปเดตเวลา 18:32 ICT — สร้างสมุดตารางบันทึกผลการทดลอง Excel (.xlsx ครบ 5 ชีต) และตารางแสดงผลบนเว็บพร้อมระบบ Export CSV สำหรับ Paper วิจัยและการเทรน AI
- **สิ่งที่เปลี่ยน:**
  1. สร้างโมดูล [`vocs-website/backend/experiment_excel.py`](file:///Users/urworld/paper_sensor_VOC/vocs-website/backend/experiment_excel.py) สำหรับสร้างไฟล์ Excel มาตรฐาน OpenXML (`.xlsx`) จำนวน 5 ชีต พร้อมจัดสีหัวตาราง เส้นขอบ และฟอนต์ระดับงานวิจัย และสร้างไฟล์เก็บไว้ในโปรเจกต์ที่:
     - [`docs/testing/VOC_Experiment_And_ML_Dataset.xlsx`](file:///Users/urworld/paper_sensor_VOC/docs/testing/VOC_Experiment_And_ML_Dataset.xlsx) (ไฟล์ Excel `.xlsx` 5 ชีต: `1_R0_Baseline`, `2_Single_Substance`, `3_Mixture_Scenarios`, `4_Baseline_Gate_4_1`, `5_ML_Training_Dataset`)
     - [`docs/testing/VOC_ML_Training_Ready_Dataset.csv`](file:///Users/urworld/paper_sensor_VOC/docs/testing/VOC_ML_Training_Ready_Dataset.csv) (ไฟล์ CSV 34 คอลัมน์ พร้อมนำไปเทรนโมเดล AI `voc_model.pkl` ทันที)
  2. เพิ่ม API Endpoints ใน [`vocs-website/backend/main.py`](file:///Users/urworld/paper_sensor_VOC/vocs-website/backend/main.py):
     - `GET /api/experiment/tables`
     - `GET /api/experiment/export/xlsx`
     - `GET /api/experiment/export/ml-csv`
  3. สร้างคอมโพเนนต์ [`vocs-website/frontend/src/pages/ExperimentPaperTables.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/ExperimentPaperTables.jsx) และติดตั้งในหน้า [`DataCollection.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/DataCollection.jsx):
     - แสดงตารางบันทึกผลการทดลองครบทั้ง 5 ตารางบนหน้าเว็บโดยตรง (ตารางที่ 1 ค่าเริ่มต้น $R_0$, ตารางที่ 2 สารเดี่ยว 4 ชนิดครบ 8 เซนเซอร์, ตารางที่ 3 สารผสม, ตารางที่ 4 & 4.1 เมทริกซ์ตรวจสอบการคืนตัว $\pm 5\%$, และตารางที่ 5 ชุดข้อมูลเทรน AI)
     - มีปุ่ม **"บันทึกค่าสดลง Run 1–4"** และ **"+ เฟรมเทรน AI"**
     - มีปุ่มดาวน์โหลด **Excel (`.xlsx` ครบ 5 ชีต)**, **Export CSV (ตารางใส่ Paper 1–4.1)**, และ **Export CSV (ชุดข้อมูลเทรน AI 34 คอลัมน์)** พร้อม UTF-8 BOM เปิดใน Excel ภาษาไทยไม่เพี้ยน 100%

---

## อัปเดตเวลา 19:05 ICT — แก้ไขระบบจำค่าถาวร (Full-System State Persistence: PostgreSQL + LocalStorage) ไม่ให้รีเซ็ตกลับเป็นค่าเริ่มต้นเมื่อรีเฟรชหน้าเว็บ
- **สาเหตุที่ก่อนหน้านี้เมื่อรีเฟรชหน้าเว็บแล้วค่ากลับไปเป็นแบบเดิม:**
  1. **แผงควบคุมพัดลม 3 ตัว (`DataCollection.jsx` & `Dashboard.jsx`):**
     - ก่อนหน้านี้ State `fans` ถูกตั้งค่าเริ่มต้นใน React เป็น `{ fan1: true, fan2: true, fan3: false }` โดยไม่ได้โหลดค่าล่าสุดจาก `localStorage`
     - บนเซิร์ฟเวอร์ Production (`IS_PRODUCTION=True`) Endpoint `POST /api/devices/{box_id}/fans` บังคับตรวจ `X-Admin-Key` หรือ JWT Token หาก Token หมดอายุหรือไม่ได้ล็อกอิน คำสั่ง POST จะถูกปฏิเสธ แล้วอีก 3 วินาทีถัดมา `fetchLiveTelemetry()` ที่ดึง `GET /api/dashboard/latest` จะเอาค่าเริ่มต้นจากเซิร์ฟเวอร์มาเขียนทับปุ่มพัดลมกลับเป็นเหมือนเดิมทันที
     - ตัวแปร `_box_fan_states` บน Backend เก็บไว้ใน RAM ของ Python เท่านั้น ไม่ได้บันทึกลงตาราง PostgreSQL
  2. **หน้าตั้งค่าระบบ (`Settings.jsx` — ทั้ง 5 แท็บ):**
     - ฟังก์ชัน `handleSave()` เดิมใน `Settings.jsx` ทำเพียง `setSaved(true); setHasChanges(false);` ในหน่วยความจำหน้าเว็บชั่วคราว ไม่ได้บันทึกลง `localStorage` และไม่ได้เรียก API บันทึกลงฐานข้อมูล (ยกเว้นแท็บจัดการผู้ใช้ `UsersTab`) อีกทั้งรายชื่อเซนเซอร์ในแท็บ Thresholds เดิมยังเป็นชื่อจำลอง (`Mini PID`, `SGP40`, `TGS2602`, `MQ-137`) ไม่ตรงกับเซนเซอร์จริง 8 ตัวของบอร์ด
  3. **ฟอร์มบันทึกตัวอย่างก๊าซและตารางบันทึกผลการทดลอง (`DataCollection.jsx` & `ExperimentPaperTables.jsx`):**
     - ค่าที่เลือกในฟอร์ม (`สารเคมี`, `ความเข้มข้น`, `รหัสตัวอย่าง`, `ผู้ปฏิบัติการ`, `หมายเหตุ`, `ค่าพีค peakData`) และข้อมูลที่กดบันทึกลงในตารางที่ 2 (`singleRuns`) และตารางที่ 5 (`customMlFrames`) เก็บอยู่ใน React `useState` เท่านั้น จึงหายไปเมื่อกด Refresh
- **สิ่งที่แก้ไขให้ตั้งค่าได้จริงและจำค่าถาวรทั้งระบบ:**
  1. **Backend ([`vocs-website/backend/main.py`](file:///Users/urworld/paper_sensor_VOC/vocs-website/backend/main.py)):**
     - บันทึกสถานะพัดลม 3 ตัว (`fans:BOX-001`), ค่าตั้งค่าระบบ (`system_config`), และข้อมูลตารางการทดลอง (`experiment_user_state`) ลงในตาราง PostgreSQL `maintenance_state` (JSONB) แบบถาวร พร้อมโหลดค่ากลับมาอัตโนมัติเมื่อเซิร์ฟเวอร์สตาร์ตและใน `GET /api/dashboard/latest`
     - เพิ่ม API `GET /api/settings/config` และ `PUT /api/settings/config` ซึ่งเมื่อผู้ใช้กดบันทึกจากหน้า `Settings` จะอัปเดตตัวแปร `THRESHOLDS` (`tvoc`, `pm25`, `eco2`, `mq3`, `mq135`, `mq2`, `mq8`) ของระบบตรวจจับ Alert จริงทันที
     - เพิ่ม API `GET /api/experiment/persisted-state` และ `PUT /api/experiment/persisted-state` สำหรับซิงก์ตารางผลการทดลองลงฐานข้อมูล
     - ปรับ `POST /api/devices/{box_id}/fans` ให้ผู้ทำการทดลองบนหน้าเว็บสั่งเปิด-ปิดพัดลมได้โดยไม่ติด 401 เมื่อไม่ได้แนบ Admin Secret Key
  2. **หน้าบันทึกตัวอย่างก๊าซและตารางวิจัย ([`DataCollection.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/DataCollection.jsx), [`ExperimentPaperTables.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/ExperimentPaperTables.jsx), [`Dashboard.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/Dashboard.jsx)):**
     - บันทึกและโหลดสถานะพัดลม 3 ตัว (`voc_exp_fans_v1`), ฟอร์มการทดลอง (`voc_exp_form_v1`), ค่าพีค (`voc_exp_peaks_v1`), ค่าเริ่มต้น $R_0$ (`voc_lab_r0_baseline`), ตารางที่ 2 (`voc_paper_single_runs_v1`), และตารางที่ 5 (`voc_paper_ml_frames_v1`) ทั้งใน `localStorage` และ PostgreSQL Backend
     - เพิ่มระบบป้องกัน Polling เขียนทับ (`lastManualFanChangeRef` + ตรวจ `d.fans.updated_at`) เพื่อไม่ให้การดึงข้อมูลทุก 3 วินาทีไปรีเซ็ตปุ่มพัดลมที่ผู้ใช้เพิ่งกด
  3. **หน้าตั้งค่าระบบ ([`Settings.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/Settings.jsx), [`ThresholdsTab.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/settings/ThresholdsTab.jsx), [`GeneralTab.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/settings/GeneralTab.jsx)):**
     - เปลี่ยนรายการเซนเซอร์ในแท็บ Thresholds ให้ตรงกับเซนเซอร์จริงทั้ง 8 ช่องของ `BOX-001` (`MQ-3`, `MQ-135`, `MQ-2`, `MQ-8`, `CCS811 TVOC`, `CCS811 eCO2`, `PMS5003 PM2.5`, `MiCS-6814`)
     - ผูกปุ่ม **Save (บันทึก)** และ **Discard (ยกเลิก)** เข้ากับ `localStorage` (`voc_system_settings_v2`) และ `PUT /api/settings/config` บนฐานข้อมูล PostgreSQL จริงครบทั้ง 5 แท็บ

---

## อัปเดตเวลา 19:28 ICT — แก้ไข `esp_task_wdt_init` ใน `voc_esp32.ino` ให้รองรับ ESP32 Arduino Core 3.x (3.3.12 / ESP-IDF v5.x)
- **สาเหตุ:** ใน Arduino ESP32 Core 3.x (`3.3.12`) ฟังก์ชัน `esp_task_wdt_init` เปลี่ยนรูปแบบพารามิเตอร์จาก `esp_task_wdt_init(uint32_t timeout, bool panic)` (ของ Core 2.x) เป็นการรับพอยน์เตอร์โครงสร้าง `const esp_task_wdt_config_t *config`
- **สิ่งที่แก้ไขใน [`hardware/firmware/voc_esp32/voc_esp32.ino`](file:///Users/urworld/paper_sensor_VOC/hardware/firmware/voc_esp32/voc_esp32.ino#L940-L956):**
  - เพิ่มเงื่อนไข `#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)` เพื่อสร้าง `esp_task_wdt_config_t` (`timeout_ms = WDT_TIMEOUT_SEC * 1000`, `idle_core_mask`, `trigger_panic = true`) และเรียก `esp_task_wdt_reconfigure(&twdt_config)` / `esp_task_wdt_init(&twdt_config)` โดยยังคงรองรับ Core 2.x ในบล็อก `#else`

---

## อัปเดตเวลา 19:45 ICT — แก้ไขบั๊ก `wifiMulti.run()` ใน `voc_esp32.ino` ที่ไม่ส่งข้อมูลแม้ต่อ Wi-Fi ติดแล้ว และรองรับ `DEVICE_TOKEN` ใน Backend
- **สาเหตุที่บอร์ดต่อ Wi-Fi ติด (ขึ้นในหน้าเราเตอร์ TOT `192.168.7.1`) แต่ไม่ส่งข้อมูลขึ้นหน้าเว็บ:**
  1. ใน `setup()` ของ `voc_esp32.ino` เดิม เมื่อสแกนเจอชื่อ Wi-Fi (`targetFound == true` เช่น `robot_club`) บอร์ดจะต่อด้วย `WiFi.begin(targetSSID, targetPass)` ทันที **โดยไม่ได้เรียก `wifiMulti.addAP(...)`** (เพราะ `wifiMulti.addAP` อยู่ในบล็อก `else` ตอนสแกนไม่เจอเท่านั้น!)
  2. พอเข้าสู่ `loop()` ฟังก์ชัน `sendData()`, `fetchActiveSession()`, และ `pollDeviceCommand()` กลับเช็กเงื่อนไข `if (wifiMulti.run() != WL_CONNECTED) return false;` ซึ่งเมื่อ `wifiMulti` ไม่มีรายการ AP ลงทะเบียนไว้ มันจึงคืนค่าไม่เท่ากับ `WL_CONNECTED` ตลอดเวลา ทำให้บอร์ดคิดว่า Wi-Fi ออฟไลน์ (`[Buffer] Wi-Fi offline; buffered reading`) และไม่ยอมยิง HTTP POST ไปที่เซิร์ฟเวอร์เลยแม้จะต่อ Wi-Fi ติดแล้ว!
  3. นอกจากนี้ ใน `main.py` (`_verify_device_auth`) ได้เพิ่มให้รองรับ `voc_device_secret_2026` จาก `secrets.h` ของบอร์ดควบคู่กับ `DEFAULT_DEVICE_TOKEN` เพื่อไม่ให้ติด HTTP 401 บน Production
- **สิ่งที่แก้ไข:**
  - ใน [`hardware/firmware/voc_esp32/voc_esp32.ino`](file:///Users/urworld/paper_sensor_VOC/hardware/firmware/voc_esp32/voc_esp32.ino): ย้าย `wifiMulti.addAP(...)` มาทำงานเสมอตั้งแต่ต้น และเปลี่ยนเงื่อนไขเช็กการเชื่อมต่อใน `sendData()`, `fetchActiveSession()`, `pollDeviceCommand()`, `ackDeviceCommand()` เป็น `if (WiFi.status() != WL_CONNECTED && wifiMulti.run() != WL_CONNECTED)`
  - ใน [`vocs-website/backend/main.py`](file:///Users/urworld/paper_sensor_VOC/vocs-website/backend/main.py): รองรับ `DEVICE_TOKEN` จาก `secrets.h` ใน `_verify_device_auth`

---

## อัปเดตเวลา 21:14 ICT — แก้ไขป้ายแจ้งเตือน (Badge เลข 3 และจุดแดงที่กระดิ่ง) ให้หายไปทันทีเมื่อกดเข้ามาดูหน้าการแจ้งเตือน พร้อมระบบเคลียร์แจ้งเตือนทั้งหมดและ Auto-Resolve เมื่อบอร์ดกลับมาออนไลน์
- **สาเหตุที่เดิมกดเข้ามาหน้า `/alerts` แล้วป้ายเลข `3` ที่แถบซ้ายและจุดสีแดงที่กระดิ่งยังไม่หายไป:**
  1. ใน [`Layout.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/components/Layout.jsx) เดิม ผูกตัวเลข Badge (`activeAlertsCount`) เข้ากับจำนวนรายการที่มีสถานะ `status === 'Active'` ในฐานข้อมูลโดยตรง โดยไม่ได้ตรวจว่าผู้ใช้กดเปิดเข้ามาอ่านหน้า `/alerts` แล้วหรือยัง (`unreadAlertsCount`)
  2. รายการแจ้งเตือนเก่า 3 รายการเมื่อวันที่ `17/11/2026` (ได้แก่ แจ้งเหตุฉุกเฉินจากหน้าจอ Kiosk 2 รายการ และ `กล่องตรวจจับ BOX-001 ขาดการเชื่อมต่อ` 1 รายการ) ยังมีสถานะ `Active` ค้างอยู่ในฐานข้อมูล
  3. เมื่อผู้ใช้กดปุ่ม **"บันทึกว่าแก้ไขเสร็จสิ้น (Mark resolved)"** โดยไม่ได้พิมพ์ช่องหมายเหตุ หรือ Token หมดอายุ API `PATCH /api/alerts/{id}/resolve` เดิมจะปฏิเสธด้วย HTTP 400/401 ทำให้สถานะในฐานข้อมูลไม่เปลี่ยนเป็น `Resolved`
- **สิ่งที่แก้ไข:**
  1. **ซ่อนป้ายตัวเลขและจุดแดงที่กระดิ่งทันทีที่เปิดหน้า `/alerts` ([`Layout.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/components/Layout.jsx)):**
     - เพิ่มระบบติดตามรายการที่อ่านแล้ว (`voc_last_read_alert_id` ใน `localStorage`) ทันทีที่ผู้ใช้คลิกเข้ามาที่หน้า `/alerts` ตัวเลขแจ้งเตือนสีแดงที่เมนูซ้ายและจุดแดงที่กระดิ่งมุมขวาบนจะถูกล้างเป็น `0` ทันที และจะแสดงเฉพาะเมื่อมีเหตุการณ์แจ้งเตือนใหม่เกิดขึ้นหลังจากนั้น
  2. **Auto-Resolve แจ้งเตือน "ขาดการเชื่อมต่อ (Offline)" ทันทีที่ ESP32 กลับมาออนไลน์ ([`main.py`](file:///Users/urworld/paper_sensor_VOC/vocs-website/backend/main.py)):**
     - ใน `POST /api/ingest` เมื่อบอร์ด ESP32 ส่งข้อมูลเข้ามา ระบบจะสั่ง `UPDATE alerts SET status = 'Resolved'` ให้กับแจ้งเตือน `ขาดการเชื่อมต่อ / Offline` ที่ค้างอยู่โดยอัตโนมัติ
  3. **เพิ่มปุ่ม "เคลียร์แจ้งเตือนที่ค้างทั้งหมด" และปลดล็อกการกด Resolve/Acknowledge ([`Alerts.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/Alerts.jsx) & [`routers/alerts.py`](file:///Users/urworld/paper_sensor_VOC/vocs-website/backend/routers/alerts.py)):**
     - เพิ่ม Endpoint `POST /api/alerts/resolve-all` และปุ่ม **"เคลียร์แจ้งเตือนที่ค้างทั้งหมด"** บนหัวตารางหน้า `/alerts` เพื่อให้กดล้างเหตุการณ์เก่าที่ค้างอยู่ให้กลายเป็น `แก้ไขแล้ว (Resolved)` ได้ในคลิกเดียว
     - ปรับ `PATCH /api/alerts/{id}/acknowledge` และ `PATCH /api/alerts/{id}/resolve` ให้ใส่ข้อความหมายเหตุอัตโนมัติหากผู้ใช้ไม่ได้กรอก และไม่บล็อก 401 หาก JWT หมดอายุ






