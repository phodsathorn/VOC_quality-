# 2026-10-27 — Web Backend W0 Security and Data Safety

## สรุป

ดำเนินการยกระดับความปลอดภัยและนโยบายการจัดเก็บข้อมูลตามข้อกำหนดระยะ W0 (Security Gate Before Production) ใน `vocs-website/WEB_BACKEND_REVIEW_AND_PLAN.md` ครอบคลุมการป้องกัน RCE/OTA, การจำกัด CORS, การระงับการลบข้อมูลดิบเพื่อรักษานโยบาย 5 ปี และการติดป้ายความโปร่งใสข้อมูลจำลองในหน้า Maintenance

## สิ่งที่เปลี่ยน

1. **Backend Security & Authentication (`vocs-website/backend/main.py`)**:
   - เพิ่ม `ADMIN_API_KEY` และฟังก์ชัน Dependency `verify_admin_key()` เพื่อล็อก Endpoint ความเสี่ยงสูง ได้แก่:
     - `/api/model/upload` (ป้องกัน Remote Code Execution จาก Untrusted Pickle)
     - `/api/model/reload`
     - `/api/ota/upload` (ป้องกันการอัปโหลดเฟิร์มแวร์แปลกปลอม)
     - `/api/ota/rollback`
     - `DELETE /api/ota`
   - ปรับปรุงการตั้งค่า CORS จากเดิมที่อนุญาตทุกโดเมน (`*`) ให้จำกัดเฉพาะ Whitelist ที่กำหนดผ่าน `CORS_ORIGINS` หรือโดเมนที่ใช้งานจริง
   - ปรับปรุง `purge_old_data_task()` ให้ระงับการลบข้อมูลดิบเป็นค่าเริ่มต้น (`ENABLE_AUTO_PURGE=false`) และรองรับ `DATA_RETENTION_DAYS` (ค่าเริ่มต้น 1825 วัน = 5 ปี) เพื่อสอดคล้องกับข้อกำหนดการเก็บหลักฐานตรวจสอบย้อนหลัง

2. **Backend Environment Guide (`vocs-website/backend/.env.example`)**:
   - เพิ่มตัวอย่างตัวแปร `ADMIN_API_KEY`, `ENVIRONMENT`, `CORS_ORIGINS`, `ENABLE_AUTO_PURGE`, และ `DATA_RETENTION_DAYS`

3. **Frontend UI Transparency & Integration (`vocs-website/frontend/`)**:
   - `Maintenance.jsx`: ติดป้ายแบนเนอร์แจ้งเตือน **`DEMO / SIMULATION DATA`** อย่างชัดเจน เพื่อความโปร่งใสว่าค่า Health Index (HI) และ Remaining Useful Life (RUL) เป็นแบบจำลองทางคณิตศาสตร์ ยังไม่ใช่ผลการเสื่อมสภาพจริงจากห้องแล็บ
   - `Devices.jsx`: เพิ่มการส่ง Header `X-Admin-Key` เมื่อสั่ง OTA Upload หรือ Rollback พร้อมการแจ้งเตือนสิทธิ์หากพบ HTTP 401
   - `Settings.jsx`: เพิ่มช่องบันทึก Admin API Key ลงใน `localStorage` เพื่อให้ผู้ดูแลระบบใช้งานคำสั่ง OTA / Reload Model ได้อย่างปลอดภัย และส่ง Header ตรวจสอบสิทธิ์เมื่อกด Reload Model

## เหตุผลและผลกระทบ

- **ความปลอดภัย**: ปิดช่องโหว่ระดับวิกฤต (CWE-502 Deserialization of Untrusted Data) และป้องกันการแก้ไขเฟิร์มแวร์อุปกรณ์ ESP32 โดยไม่ได้รับอนุญาต
- **การปฏิบัติตามข้อกำหนด (Compliance)**: ป้องกันไม่ให้ข้อมูลดิบใน `sensor_readings` ถูกลบทิ้งทุก 30 วัน รักษาข้อมูลเพื่อการตรวจสอบย้อนหลัง 5 ปี
- **ความโปร่งใสของข้อมูล**: ผู้ใช้งานและผู้ตรวจประเมินรับทราบว่าข้อมูล RUL ในปัจจุบันเป็น Simulation Mode ป้องกันการเข้าใจผิดว่าเป็นผลตรวจวัดจริง

## การตรวจสอบ

- ตรวจสอบ Python syntax ใน `vocs-website/backend/main.py` ด้วย `python -m py_compile` ผ่านเรียบร้อย (Exit code 0)
- ทดสอบ Build Frontend ด้วย `vite build` ใน `vocs-website/frontend` ผ่านสำเร็จ ไร้ข้อผิดพลาด (Exit code 0)
- ตรวจสอบ `git diff` เพื่อยืนยันว่าไม่มีการบันทึก secret หรือ credential จริงลงในโค้ด

## การตัดสินใจ/ข้อสมมติ

- ในโหมด `ENVIRONMENT=development` (เมื่อไม่ได้ตั้ง `ADMIN_API_KEY`) ระบบจะบันทึก Warning ใน log เพื่อความสะดวกในการทดสอบ แต่ใน `ENVIRONMENT=production` หากไม่มีการตั้ง Key จะล็อก Endpoint ทันที (Fail-closed)
- ใช้ `localStorage` (`voc_admin_key`) ใน Frontend เพื่อให้ผู้ดูแลระบบตั้งค่า Admin Key ได้โดยตรงจากหน้า Settings โดยไม่ต้อง hardcode ใน source code

## งานค้างและขั้นตอนถัดไป

1. รอผลการตอบคำถาม 7 ข้อจากผู้รับผิดชอบโรงงาน เพื่อออกแบบระบบ Authentication เต็มรูปแบบ (JWT + Roles 4 ระดับ: Operator, Engineer, Admin, Viewer) ในระยะ W1
2. จัดทำตาราง Aggregation (Downsampling รายชั่วโมง/รายวัน) ในระยะ W3 เพื่อรองรับการเก็บข้อมูล 5 ปีอย่างมีประสิทธิภาพ
