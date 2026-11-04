# 2026-11-04 — อัปเดตเอกสารระบบ คู่มือการใช้งานเว็บ ลิงก์ และระบบแจ้งเตือน LINE OA

## สรุป
ทำการปรับปรุงและยกระดับเอกสารโครงการทั้งใน [`README.md`](../README.md) และ [`vocs-website/README.md`](../vocs-website/README.md) ให้ครอบคลุมการใช้งานระบบจริงทั้งหมด ทั้งลิงก์ระบบ Production (Web, Backend API, Swagger, LINE Webhook), ข้อมูลบัญชีผู้ใช้และการทดสอบ (Admin, Engineer, Operator, Viewer), คู่มือการใช้งานเว็บทั้ง 11 หน้าโดยละเอียด, และขั้นตอนการผูกบัญชีรับแจ้งเตือนผ่าน LINE Official Account (LINE Bot) เมื่อเกิดเหตุการณ์ SLA Breach

## สิ่งที่เปลี่ยน
1. **อัปเดต [`README.md`](../README.md) (Main Project README):**
   - **Production Links Table:** รวบรวม URL ใช้งานจริงทั้งหมด ได้แก่ Web Dashboard (`https://voc-quality.vercel.app`), Backend API (`https://voc-backend-api.onrender.com`), Swagger UI (`/docs`), และ LINE Webhook (`/api/line/webhook`)
   - **RBAC Matrix & Demo Accounts:** ระบุตารางบทบาท 4 สิทธิ์ (Admin, Engineer, Operator, Viewer) พร้อม Credentials เริ่มต้นและ Landing page
   - **LINE Integration Guide:** อธิบายวิธีการ Add LINE Bot, คำสั่งในแชท (`BIND <BOX_ID>`, `UNBIND <BOX_ID>`, `STATUS`, `HELP`), กลไกการแจ้งเตือน SLA Breach (5-10 นาที), ตัวอย่างข้อความแจ้งเตือน และการตั้งค่า Webhook ใน LINE Developers Console
   - **Complete Web Applications Guide:** รวบรวมคู่มือการใช้งานฟังก์ชันทุกหน้าอย่างละเอียด (Dashboard, Kiosk, Alerts & Incidents, Airflow Diagram, Emissions Report, Industrial Safety Reference, History & CSV Export, Maintenance & Zero-Air Calibration, Devices Registry, Data Collection & AI Training, และ Settings)
   - **Hardware Ingest API:** รูปแบบ JSON Payload สำหรับ ESP32-S3 (`POST /api/ingest`)
   - **Local Development & Build Instructions:** คำแนะนำการรัน Frontend, Backend, Lint (`oxlint`), และ Build
2. **อัปเดต [`vocs-website/README.md`](../vocs-website/README.md):**
   - สรุปภาพรวมของเว็บแอปพลิเคชัน โครงสร้างโฟลเดอร์ ระบบแจ้งเตือน และ API Endpoints สำคัญ
   - ตาราง Application Routes ทั้งหมด 11 เส้นทางพร้อมสิทธิ์ในการเข้าถึง (RBAC Guard)

## เหตุผลและผลกระทบ
- เพื่อให้ผู้ใช้งานทุกระดับ (ผู้บริหาร, วิศวกร, ผู้ปฏิบัติงานหน้างาน, และผู้ตรวจสอบภายนอก) สามารถเข้าใช้งานและทำความเข้าใจระบบได้อย่างถูกต้อง ครบถ้วน รวดเร็ว
- ไม่มีผลกระทบเชิงลบต่อโค้ดการทำงานของระบบ (Pure Documentation Enhancement)

## การตรวจสอบ
- ตรวจสอบความถูกต้องของลิงก์ URL, บัญชีผู้ใช้งาน, และคำสั่ง LINE Bot
- ตรวจสอบรูปแบบ Markdown และความสอดคล้องของเอกสารทั้งสองไฟล์

## การตัดสินใจ/ข้อสมมติ
- ยืนยันการใช้มาตรฐานความปลอดภัย VOC โรงงานอุตสาหกรรม (Industrial VOC Standards) ไม่ปะปนกับมาตรฐาน AQI ชุมชนภายนอก
- ไม่มีการบันทึก Secret หรือ API Token จริงลงในเอกสารสาธารณะ

## งานค้างและขั้นตอนถัดไป
- ดำเนินการ Commit และ Push ขึ้นทั้ง GitLab (`origin/main`) และ GitHub (`github/main`)

## อัปเดตเวลา 15:06 ICT (แสดงผลเซนเซอร์ครบทุกตัวในระบบทั้ง 12 แชนแนล)
### สิ่งที่เปลี่ยน
1. **`vocs-website/frontend/src/pages/Dashboard.jsx` (Live Telemetry Drawer):**
   - อัปเกรดตาราง Live Probe Readings จากเดิมที่เป็นตัวอย่าง Mock 5 ตัว (`MQ-135`, `MQ-137`, `PID`, `SGP40`, `TGS2602`) ให้แสดงผลเป็น **เซนเซอร์จริงทั้งหมดของระบบครบทั้ง 12 แชนแนล (จาก 8 โมดูลฮาร์ดแวร์จริง)**:
     1. `CCS811 (TVOC)` — Primary Chamber (ppb)
     2. `CCS811 (eCO₂)` — Exhaust Return (ppm)
     3. `MQ-135` — Booth Inflow (ADC)
     4. `MQ-3` — Solvent Spray Zone (ADC)
     5. `MQ-2` — Curing Line (ADC)
     6. `MQ-8` — Recirculation Line (ADC)
     7. `MiCS-6814 (CO)` — Burner / Heater Bed (mV)
     8. `MiCS-6814 (NO₂)` — Vent Exhaust (mV)
     9. `MiCS-6814 (NH₃)` — Pre-treatment Wash (mV)
     10. `PMS5003` — PM2.5 Particle Counter (µg/m³)
     11. `DHT22 (Temp)` — Chamber Temperature (°C)
     12. `DHT22 (Humidity)` — Relative Humidity (%RH)
   - ปรับ Subtitle ให้เป็น Dynamic ตามจำนวนโพรบจริง: `Powder Coating Booth 1 · 12 Active Probes`
   - เพิ่มระบบเช็คสถานะรวมแบบ Dynamic: แสดง `All systems nominal` (สีเขียว) หรือ `Warning threshold exceeded` (สีส้ม) ตามค่าของแต่ละหัววัด
2. **`vocs-website/frontend/src/pages/Maintenance.jsx`:**
   - ปรับรายการเซนเซอร์ในตาราง Calibration ให้ตรงกับโมดูลเซนเซอร์จริงทั้ง 8 ตัว (`CCS811`, `MQ-135`, `MQ-3`, `MQ-2`, `MQ-8`, `MiCS-6814`, `PMS5003`, `DHT22`) พร้อมดึงสถานะจริงจาก `/api/maintenance/status`

### การตรวจสอบ
- ตรวจสอบ `npm --prefix vocs-website/frontend run lint` ผ่าน 100% (0 errors)
- ทดสอบคอมไพล์ `npm --prefix vocs-website/frontend run build` ผ่าน 100% ใน 248ms
- Push โค้ดขึ้นทั้ง GitLab (`origin/main`) และ GitHub (`github/main`) เพื่อให้ Vercel Deploy อัตโนมัติ


