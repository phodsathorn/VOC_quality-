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

