# 2026-11-07 — CORE_SPEC Alignment & Real Data Activation

## สรุป
ทำการปลดป้ายสถานะ [รอยืนยัน] ในเอกสารข้อกำหนดหลัก `CORE_SPEC.md` และปลดข้อมูลจำลอง (Mock/Simulated Data) บนระบบออกทั้งหมด เพื่อเปลี่ยนผ่านสู่การใช้ข้อมูลจริงตามสเปกฮาร์ดแวร์และผลการเทรนโมเดลที่มีอยู่จริง:
1. ปลดป้าย `[รอยืนยัน]` ของ GPIO DHT22 เป็น **`[ล็อก] GPIO 27`** ตามโค้ดเฟิร์มแวร์จริงใน `voc_esp32.ino`
2. ปลดข้อมูลสารโทลูอีน (Toluene) ที่จำลองไว้บนหน้า Dashboard ออกทั้งหมด โดยเปลี่ยนมาใช้คลาสสารจริงจากโมเดล AI (`AMBIENT`, `ALCOHOL`, `THINNER`, `OTHER`) และผูกการแสดงผลกับผลทำนายสด `data?.ai_detection`
3. แปลงกราฟเรดาร์ลายนิ้วมือสารเคมี 6 ช่องสัญญาณให้คำนวณพิกัดรูปหลายเหลี่ยม (Polygon vertices) แบบไดนามิกตามค่าความต่างศักย์และ ADC จากฮาร์ดแวร์จริง (`MQ-3`, `MQ-2`, `MQ-135`, `MQ-8`, `MiCS-CO`, `MiCS-NO₂`)
4. ปลดมาตรวัดความเร็วลมจำลอง (Airflow Velocity 18.2 m/s) บนหน้าจอ Kiosk โดยแทนที่ด้วยค่าจริงของ **`ก๊าซคาร์บอนไดออกไซด์ (eCO₂)`** ในหน่วย ppm ซึ่งอ่านได้จากชิปเซนเซอร์จริงในบอร์ด (`CCS811` / `SCD41`)
5. ติดป้ายระบุ `[แบบจำลองพลศาสตร์ของไหล / SIMULATED DYNAMICS MODEL]` บนหน้าจอ AirflowDiagram ให้ชัดเจนตามกฎ Non-claims ของ `CORE_SPEC.md`
6. ปรับตัวเลือกสารเคมีในหน้า Data Collection ให้ตรงกับกลุ่มสารที่มีจริง

## สิ่งที่เปลี่ยน
- **`CORE_SPEC.md`**:
  - หัวข้อ 4.1: ปรับแก้ DHT22 จาก `GPIO 4 หรือ 27 [รอยืนยัน]` เป็น `GPIO 27 [ล็อก]`
  - หัวข้อ 19: เช็กถูก `[x] GPIO ของ DHT22: ยืนยัน GPIO 27 ตาม voc_esp32.ino แล้ว [ล็อก]`
  - หัวข้อ 20: เพิ่มบันทึก Changelog v0.2
- **`vocs-website/frontend/src/pages/Dashboard.jsx`**:
  - เปลี่ยนค่า Fallback และค่าเริ่มต้นของการทำนาย AI จาก `Toluene 87%` เป็น `AMBIENT 96%`
  - สร้าง `sensorRadarPoints` คำนวณพิกัดเรดาร์ 6 ช่องสัญญาณแบบไดนามิกตามค่า ADC/mV จริง
  - สร้าง `compoundDistribution` แสดงแถบสัดส่วนสารเคมีตามคลาสของโมเดลจริง (`ALCOHOL`, `AMBIENT`, `OTHER`)
  - อัปเดต Modal วิเคราะห์ลายนิ้วมือสารเคมีให้ตรงกับชุดข้อมูลจริง
- **`vocs-website/frontend/src/pages/Kiosk.jsx`**:
  - ปลดมาตรวัดความเร็วลมจำลองออก และนำเสนอค่าจริงของ **`eCO₂ (ppm)`** พร้อมคำนวณวงแหวน Gauge และเกณฑ์ความปลอดภัยต่ำกว่า 1,000 ppm
- **`vocs-website/frontend/src/pages/AirflowDiagram.jsx`**:
  - เพิ่มป้ายกำกับ `[แบบจำลองพลศาสตร์ของไหล / SIMULATED DYNAMICS MODEL]` ชัดเจน
- **`vocs-website/frontend/src/pages/DataCollection.jsx`**:
  - ปรับปรุงรายชื่อสารเคมีใน Dropdown ให้ตรงกับคลาสจริง: Ambient Air, Alcohol 70%, Thinner, Smoke, Acetone, Other VOCs

## การตรวจสอบ
- `npm --prefix vocs-website/frontend run build`: ผ่านเรียบร้อย (`built in 244ms`, 0 errors)
- `npm --prefix vocs-website/frontend run lint`: ผ่านเรียบร้อย (`0 errors, 65 warnings`)
- ตรวจสอบการเรนเดอร์กราฟเรดาร์และเกจวัดทั้ง 4 ช่องบน Kiosk แสดงผลค่าจริงจากเซนเซอร์

## งานค้างและขั้นตอนถัดไป
- Commit และ Push การเปลี่ยนแปลงขึ้น Git remote ทั้ง `origin` (GitLab) และ `github` (GitHub)
- เตรียมการสำหรับ Milestone M1 / M2: การพัฒนา Keras Small MLP และแปลงเป็น TFLite Micro สำหรับ ESP32
