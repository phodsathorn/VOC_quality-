# 2026-10-26 — Sensor validation, planning and secure deployment

## สรุป

รวบรวมงานพัฒนาระบบตรวจวัด VOC สำหรับโรงงาน ตั้งแต่การลด false alert ของ sensor, การตรวจสอบตาม datasheet, การสั่ง calibration และดู diagnostic จากเว็บ, การวางแผนระบบ production ไปจนถึงการจัดการ credential ก่อนเผยแพร่ source code

## สิ่งที่เปลี่ยน

### Firmware และการตรวจสอบ sensor

- ปรับ firmware ESP32 สำหรับลดการแจ้งเตือนแอลกอฮอล์สูงเกินจริงของ MQ-3 โดยใช้การอ่านหลายตัวอย่าง/ค่ากลางและช่วง preheat ก่อนใช้งานจริง
- เพิ่มแนวทางส่งสถานะ sensor, runtime, การตรวจหาอ่านค่าผิดปกติ และคำสั่ง calibration ระหว่าง firmware กับ backend
- เพิ่มไฟล์ตัวอย่าง Wi-Fi ที่ `vocs-website/firmware/voc_esp32/secrets.example.h` และให้ firmware อ่านค่าจริงจาก `secrets.h` ซึ่งถูก ignore จาก Git
- แก้จุด compile ที่ย้าย `SensorData` ไปอยู่ก่อน prototype ตามประวัติ commit ก่อนหน้า

### Backend และเว็บ

- เพิ่มแนวทาง/ส่วนประกอบสำหรับ monitor สถานะ sensor, diagnostic, calibration และ log runtime จากหน้าเว็บ
- ระบุแผนการเก็บ log สถานะ sensor และชั่วโมง online เพื่อใช้ maintenance และเตือนอายุการใช้งาน
- วางแผน login, RBAC, audit trail และการรับทราบการแจ้งเตือนสำหรับ Operator, Engineer, Admin และ Viewer
- กำหนดเป้าหมาย alert: ระดับไม่รุนแรงให้รับทราบภายใน 10 นาที และระดับสูง/วิกฤตภายใน 5 นาที; หากไม่รับทราบให้เป็นแผน escalates ผ่าน LINE OA ในอนาคต
- วางแผนเก็บข้อมูล 5 ปี และ export PDF, Excel, CSV พร้อมกราฟแนวโน้มสำหรับ maintenance

### เอกสารและแผนงาน

- เพิ่ม/ปรับเอกสารภาษาไทย:
  - `vocs-website/SENSOR_VALIDATION.md`
  - `vocs-website/PROJECT_REVIEW_AND_PLAN.md`
  - `vocs-website/WEB_BACKEND_REVIEW_AND_PLAN.md`
  - `vocs-website/HARDWARE_FIRMWARE_REVIEW_AND_PLAN.md`
- แยก review/plan ฝั่งเว็บและ backend ออกจาก hardware/firmware เพื่อส่งต่องานคนละทีม
- ระบุข้อจำกัดสำคัญ: sensor ภายในกล่องเป็น E-Nose สำหรับเฝ้าระวัง/แนวโน้ม ไม่เพียงพอที่จะรับรอง compliance ของปล่องระบายอากาศหรือค่าการปล่อยรายปี ต้องมีจุดวัด วิธีเก็บตัวอย่าง และเครื่องมืออ้างอิงที่กฎหมาย/ผู้เชี่ยวชาญรับรองก่อนสรุปผล

### ความปลอดภัยและ Git

- ตรวจพบ Wi-Fi credential และ database credential ที่เคยอยู่ใน source code และ history
- ย้าย database connection ให้รับจาก environment variable `DATABASE_URL` ใน backend และ migration; เพิ่ม `vocs-website/backend/.env.example` เป็นตัวอย่างที่ไม่มีข้อมูลจริง
- เพิ่ม ignore สำหรับ `backend/.env` และ firmware `secrets.h`
- rewrite ประวัติ Git ใน local repository เพื่อลบ credential ที่ตรวจพบ และตรวจทุก reachable revision แล้วไม่พบ credential เดิม
- force-push branch `main` ที่ล้างประวัติแล้วขึ้น GitHub สำเร็จ
- GitLab ยัง push ไม่สำเร็จ เนื่องจาก `main` เป็น protected branch และไม่อนุญาต force-push

## เหตุผลและผลกระทบ

- ค่าจาก MQ-series และ MICS-6814 มีผลจากอุณหภูมิ ความชื้น ระยะ warm-up การเสื่อมสภาพ และ cross-sensitivity จึงไม่ควรตีความเป็นความเข้มข้นที่แม่นยำโดยไม่มี calibration/validation กับเครื่องอ้างอิง
- การแยก credential ออกจาก Git เป็นข้อกำหนดพื้นฐานก่อนนำระบบใช้จริง เพราะ commit ที่เผยแพร่หรือ clone อาจทำให้ secret รั่วได้
- Backend ที่ deploy บน Render ต้องมี `DATABASE_URL` ใน Environment Variables ก่อน deploy code รุ่นที่ตัดค่า default ออก มิฉะนั้น backend เชื่อม Neon ไม่ได้

## การตรวจสอบ

- ตรวจ Git history ที่เข้าถึงได้ทั้งหมดหลัง rewrite สำหรับ credential ที่พบ และผลเป็นไม่พบ
- ตรวจว่า working tree สะอาดก่อน push
- GitHub `main` ได้รับ cleaned history แล้ว
- ผู้ใช้ยืนยันว่าได้ตั้งค่า deploy แล้ว (คาดว่า frontend: Vercel, backend: Render, database: Neon)

## การตัดสินใจ/ข้อสมมติ

- โรงงานเริ่มต้นมีกล่องตรวจวัดหนึ่งกล่อง แต่ระบบควรออกแบบรองรับหลายกล่อง
- ผู้ใช้ทั่วไป/พนักงานเห็นค่า รับทราบ alert และทำงานแก้ไขตามที่ได้รับมอบหมาย; Engineer ดูแล calibration/maintenance; ผู้ดูแลจัดการสิทธิ์; เจ้าของโรงงานดูแบบ read-only และ export ได้
- LINE OA เป็นแผนในอนาคต ยังไม่ถูก implement

## สรุปข้อมูลย้อนหลังจาก Antigravity

แหล่งข้อมูล: `archive/old_references/conversation_log.md` ซึ่งเป็นบันทึกแชทเดิมใน workspace และถูกตรวจพบภายหลังจากสร้าง log ฉบับแรก

- มีการหารือเรื่องลดจำนวน MQ sensor เพื่อให้ระบบเล็กลงและประหยัดพลังงาน แต่ยังต้องสามารถแยก pattern ของสารและเก็บข้อมูลได้
- ข้อสรุปเชิงเทคนิคเดิมคือ sensor กลุ่ม MOX/MQ มี cross-sensitivity จึงไม่สามารถยืนยันชนิดสารหรือค่า ppm แบบ absolute ได้เพียงลำพัง; แนวทาง E-Nose array ร่วมกับ ML เหมาะกับการจำแนก pattern แต่ต้อง calibration กับเครื่องมืออ้างอิงหากต้องการเชิงปริมาณ
- เคยเสนอแนวทางลด array เหลือ MQ-135 + MiCS-6814 + CCS811 และแนวทาง product phase ถัดไป เช่น SGP41, BME688 และ SEN55 ข้อเสนอนี้เป็นข้อมูลสำหรับประเมินใหม่กับ datasheet, ชนิดฝุ่น/สารจริง และเครื่องมืออ้างอิงก่อนเลือกใช้งานจริง
- มีการค้นคว้า/จัดทำเอกสารเปรียบเทียบ sensor เชิงพาณิชย์และแนวทางจากงานวิจัย IEEE โดยเน้นว่าโรงงานพ่นสีฝุ่นต้องวิเคราะห์ process และสารจริงก่อนกำหนด target pollutant ไม่ควรเหมารวม VOC ทุกชนิด
- มีการวางแนวทางให้ผู้ปฏิบัติงานเก็บ label ข้อมูลเองด้วย UI แบบใช้งานง่าย และใช้ Active Learning เพื่อลดภาระการติด label
- มีการจัดโครงสร้างเอกสารเดิมเป็น `docs/` (ออกแบบจริง), `experimental/` (งานทดสอบ), `reference/` (งานอ้างอิง) และ `images/`; โฟลเดอร์ Arduino ไม่ถูกย้ายในขณะนั้นเพื่อลดความเสี่ยงที่ Arduino IDE จะ compile ไม่ได้

## แก้ไขข้อมูล log

- แก้ไขข้อความเดิมที่ระบุว่าไม่พบข้อมูล Antigravity: พบไฟล์ใน `archive/old_references/conversation_log.md` แล้ว และได้สรุปสาระสำคัญข้างต้น
- ไฟล์ต้นฉบับเป็นบันทึกประวัติ ไม่ใช่หลักฐานยืนยันความถูกต้องของข้อเสนอทางวิศวกรรมทุกข้อ ดังนั้นการตัดสินใจ hardware/มาตรฐานต้องตรวจ datasheet และแหล่งอ้างอิงทางการอีกครั้ง

## งานค้างและขั้นตอนถัดไป

1. เปลี่ยน (rotate) Wi-Fi password และ Neon database password เดิม แม้ล้าง Git history แล้ว เพราะเคยอยู่ในประวัติ
2. GitLab: ผู้มีสิทธิ์ Maintainer ต้องเปิดอนุญาต force-push ชั่วคราวบน protected branch `main` แล้วจึง push cleaned history ด้วย `--force-with-lease`
3. ตรวจ Render log หลัง deploy ให้พบการเชื่อมต่อฐานข้อมูลสำเร็จ และทดสอบอ่าน/บันทึกข้อมูลจาก Dashboard
4. สร้างไฟล์ `secrets.h` เฉพาะเครื่องจาก `secrets.example.h` ก่อน compile firmware และไม่ commit ไฟล์จริง
5. ก่อน implement แต่ละ phase ตามแผน ต้องถาม/ยืนยันคำถามเปิดในเอกสารแผนก่อน เพื่อไม่กำหนดมาตรฐานกฎหมาย, threshold, calibration procedure หรือผู้รับ alert เอง

## อัปเดตเวลา 12:xx ICT — จัดระเบียบโครงสร้าง repository

### สิ่งที่เปลี่ยน

- คง `vocs-website/` ไว้ที่เดิม เพื่อไม่เปลี่ยน path ของระบบที่ deploy บน Vercel/Render
- รวมเอกสารระดับ root เข้า `docs/` และแยกเป็น `architecture/`, `hardware/`, `ml/`, `product/` และ `research/reference/`
- ย้าย firmware เก่า, firmware ทดสอบ และ diagnostic เข้า `experimental/` โดยแยก `legacy-firmware/`, `firmware-tests/` และ `diagnostics/`
- ย้ายเครื่องมือ Python สำหรับ serial/ESP32 เข้า `tools/serial/`
- ย้าย runtime log เข้า `data/runtime-logs/` และ ignore จาก Git
- ปรับ README รากให้ชี้ไปที่ firmware และระบบ production ที่ใช้งานจริง พร้อมเพิ่ม `docs/README.md` เป็นดัชนีเอกสาร
- ปรับ reference สำคัญหลังย้าย path และเอา `experimental/firmware-tests/first-air-quality-box/secrets.h` ออกจาก Git index โดยเก็บไฟล์ local ไว้ตามเดิมและ ignore จาก Git

### การตรวจสอบ

- ใช้ `git diff --check` แล้วไม่พบ whitespace error
- ตรวจ path หลักใน README และเอกสารที่ปรับแล้ว

### ผลกระทบและงานค้าง

- คำสั่งหรือ bookmark เก่าที่อ้าง root path เดิมของ firmware/test/tool ต้องเปลี่ยนตามโครงสร้างใหม่
- เอกสาร historical ใน `archive/` จะคง path เดิมไว้โดยตั้งใจ เพราะเป็นหลักฐานย้อนหลัง ไม่ใช่คู่มือใช้งานปัจจุบัน
