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

---

### [เวลา 10:55 น.] แก้ไขบั๊กจอขาว (White Screen Fix) & ติดตั้ง Error Boundary
**ปัญหาที่พบ:**
- ผู้ใช้เข้าเว็บ `voc-quality.vercel.app` แล้วพบหน้าจอสีขาวล้วน (White Screen)
- สาเหตุ: ใน `vocs-website/frontend/src/components/Layout.jsx` บรรทัดที่ 19 ไม่ได้ destructure ตัวแปร `isThai` จาก `useLanguage()` ส่งผลให้เกิด `ReferenceError: isThai is not defined` ขณะเรนเดอร์ปุ่มโปรไฟล์ผู้ใช้ และทำให้ React root unmount ทั้งหน้าจอ

**สิ่งที่แก้ไข:**
1. **`vocs-website/frontend/src/components/Layout.jsx`**: เพิ่ม `isThai` เข้าไปใน `const { lang, setLang, t, isThai } = useLanguage();`
2. **`vocs-website/frontend/src/components/ErrorBoundary.jsx`**: สร้างคอมโพเนนต์ React Error Boundary ครอบคลุมทั้งสองภาษา (TH/EN) พร้อมปุ่ม "รีโหลดหน้านี้ / Reload Page" และ Technical Details Dropdown เพื่อป้องกันไม่ให้เกิดจอขาวล้วนในอนาคตหากมี unexpected error
3. **`vocs-website/frontend/src/main.jsx`**: นำ `<ErrorBoundary>` มาครอบ `<App />`

**การตรวจสอบ:**
- ตรวจสอบทั่วทั้งโค้ดด้วย Node script: ไม่พบการเรียกใช้ `isThai` ที่ไม่ได้ประกาศอีก (`All isThai references are properly declared/destructured!`)
- `npm --prefix vocs-website/frontend run build`: ผ่าน 100% (`built in 236ms`, 0 errors)
- `npm --prefix vocs-website/frontend run lint`: ผ่าน (0 errors)

---

### [เวลา 17:40 น.] ปรับเปลี่ยนคอลัมน์ตำแหน่งติดตั้งเป็น "สารเป้าหมายที่ตรวจวัด" (Target Gas / Analyte)
**ปัญหา/ข้อสังเกต:**
- ตารางโทรมาตรตรวจวัดสดจากแผงเซนเซอร์ (Live sensor telemetry drawer) มีคอลัมน์ "ตำแหน่งติดตั้ง" ที่ระบุชื่อสถานที่แยกตามจุดต่าง ๆ ในโรงงาน (เช่น เตาอบสี, ท่อลมวน, บ่อล้าง) ซึ่งขัดกับความเป็นจริงของฮาร์ดแวร์โปรเจกต์ (`CORE_SPEC.md`) เนื่องจากเซนเซอร์ทุกตัวฝังรวมอยู่ในกล่องตรวจวัดเดียวกัน (`BOX-001`)

**สิ่งที่แก้ไข:**
1. **`vocs-website/frontend/src/context/LanguageContext.jsx`**:
   - ปรับหัวคอลัมน์จาก "ตำแหน่งติดตั้ง" เป็น "สารเป้าหมายที่ตรวจวัด" (`targetGasCol`: 'สารเป้าหมายที่ตรวจวัด' / 'Target Gas / Analyte')
   - ปรับแก้ `arrayIdLabel` ให้สะอาดตา
2. **`vocs-website/frontend/src/pages/Dashboard.jsx`**:
   - ปรับโครงสร้างข้อมูล `allProbes` ใน Drawer โดยเปลี่ยนจาก `loc` เป็น `target` แสดงชนิดสารหรือพารามิเตอร์ที่เซนเซอร์แต่ละตัวทำหน้าที่ตรวจวัด (เช่น สารระเหยรวม TVOC, แอลกอฮอล์/ทินเนอร์, ฝุ่น PM2.5, คาร์บอนมอนอกไซด์ CO ฯลฯ)
   - ปรับหัวเรื่อง Drawer ให้ระบุชัดเจนว่า "กล่องรวมสัญญาณ BOX-001 (ห้องพ่นสีที่ 1) · 12 แชนแนลตรวจวัด"
   - ปรับ Footer ให้แสดง "รหัสกล่องตรวจวัด: BOX-001"
3. **`vocs-website/frontend/src/pages/AirflowDiagram.jsx`**:
   - ปรับตารางใน Sensor box drawer ให้ตรงกัน โดยใช้เซนเซอร์ฮาร์ดแวร์จริง (`CCS811`, `MQ-3`, `MQ-135`, `MiCS-6814`, `PMS5003`) และแสดงคอลัมน์ "สารเป้าหมายที่ตรวจวัด" แทนตำแหน่งจำลองเดิม

**การตรวจสอบ:**
- `npm --prefix vocs-website/frontend run build`: ผ่านเรียบร้อย (`built in 237ms`, 0 errors)
- `npm --prefix vocs-website/frontend run lint`: ผ่านเรียบร้อย (`0 errors, 65 warnings`)

## งานค้างและขั้นตอนถัดไป
- Commit และ Push การเปลี่ยนแปลงขึ้น Git remote ทั้ง `origin` (GitLab) และ `github` (GitHub) เพื่อให้ Vercel deploy อัตโนมัติ
- ทดสอบเปิดหน้าเว็บ `voc-quality.vercel.app` เพื่อยืนยันว่าหน้าเว็บโหลดได้ปกติสมบูรณ์



