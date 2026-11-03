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
