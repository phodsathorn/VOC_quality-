# รีวิวและแผนดำเนินงาน — Web / Backend

**ขอบเขต:** React web, หน้าจอสัมผัส/kiosk, FastAPI, PostgreSQL, login, audit trail, รายงาน, การแจ้งเตือน, OTA release และ ML service  
**ไม่อยู่ในขอบเขต:** วงจร/การติดตั้ง/การสอบเทียบเชิงกายภาพ — ดู `HARDWARE_FIRMWARE_REVIEW_AND_PLAN.md`

## สถานะปัจจุบัน

มี Dashboard, Alert, คำสั่ง calibration, สถานะ sensor และตัวนับชั่วโมงทำงานแล้ว แต่ **ยังไม่ปลอดภัยสำหรับ production**: API ส่วนใหญ่ยังไม่มี login/สิทธิ์, CORS กว้างเกินไป, OTA/model ยังไม่มี signed artifact, maintenance บางส่วนยังเป็นข้อมูลจำลอง และการลบข้อมูลที่ 30 วันขัดกับข้อกำหนดเก็บข้อมูล 5 ปี

## ข้อกำหนดที่ยืนยันแล้ว

- ใช้ภายในโรงงาน รองรับหลายกล่อง/หลายพื้นที่ แม้เริ่มจากหนึ่งกล่อง
- Role: `operator`, `engineer`, `admin`, `viewer`
- `viewer` ดูข้อมูลและ export report ได้อย่างเดียว
- SLA รับทราบ Alert: Warning 10 นาที; High 5 นาที; Critical 5 นาที
- รับทราบผ่านจอที่กล่อง, จอพื้นที่ทำงาน หรือเว็บ; LINE OA เป็นการ escalation เท่านั้นและยังไม่ implement
- เก็บหลักฐาน 5 ปี; export PDF, XLSX และ CSV

## คำถามบังคับ — หยุดก่อนเริ่ม Implement

ห้ามเริ่มทำตามแผนจนกว่าผู้รับผิดชอบโรงงาน/ผลิตภัณฑ์จะตอบครบ

1. พนักงานจะใช้บัญชี Microsoft/Google, username/password ภายใน, badge/PIN ที่จอสัมผัส หรือผสมกัน? ใครเป็นผู้สร้าง/ปิดบัญชี?
2. ยืนยันสิทธิ์: engineer ต้องตรวจยืนยันการปิด High/Critical และ calibration/เปลี่ยน sensor หรือไม่?
3. Backend อยู่ server โรงงาน, LAN + VPN หรือ cloud? ใครรับผิดชอบ firewall, VPN และ backup?
4. เก็บ raw sample ทุก 3 วินาที 5 ปี หรือ aggregate หลังระยะเวลาหนึ่งได้?
5. ใครเป็นเจ้าของ LINE OA, กลุ่มใดรับแจ้งเตือน, ตารางกะเป็นอย่างไร และแจ้งซ้ำทุกกี่นาที?
6. จอที่กล่องและจอพื้นที่เป็นเครื่องเดียวกันหรือไม่? ใช้ badge หรือ PIN ได้หรือไม่? ต้องทำอะไรได้เมื่อ network ล่ม?
7. ส่งเงื่อนไขใบอนุญาต/ตัวอย่างรายงานเดิมก่อนทำ report compliance

## สิทธิ์และ Workflow

| การทำงาน | Operator | Engineer | Admin | Viewer |
| --- | --- | --- | --- | --- |
| ดู dashboard/history ที่ได้รับสิทธิ์ | ได้ | ได้ | ได้ | ได้ |
| Export รายงาน | ไม่ได้ | ได้ | ได้ | ได้ |
| รับทราบ alert / บันทึกการแก้ไข | ได้ | ได้ | ได้ | ไม่ได้ |
| ปิด Warning | ได้ พร้อมหลักฐาน | ได้ | ได้ | ไม่ได้ |
| ยืนยันปิด High/Critical | ไม่ได้ | ได้ | ได้ | ไม่ได้ |
| สร้าง/อนุมัติ calibration | ไม่ได้ | ได้ | ได้ | ไม่ได้ |
| จัดการ user/role/device/threshold | ไม่ได้ | ไม่ได้ | ได้ | ไม่ได้ |

สถานะ Alert: `Active → Acknowledged → In progress → Resolved → Verified` ทุกการเปลี่ยนสถานะต้องบันทึกผู้กระทำ, role, เวลา, หน้าจอต้นทาง, note/หลักฐาน, box ID และก่อน/หลังเปลี่ยนค่า โดย audit event เป็น append-only แก้ย้อนหลังไม่ได้

## ลำดับดำเนินงาน

### W0 — ด่านความปลอดภัยก่อน Production

1. Rotate credential ที่อยู่ใน source และย้าย secret ไป configuration ที่ปลอดภัย
2. ปิด public write/control endpoint จนมี authentication
3. จำกัด CORS เป็น origin ที่ใช้งานจริง
4. ปิด public model/OTA upload และ rollback จนมีสิทธิ์และ signed artifact
5. เอา mock maintenance ออกจาก production หรือแสดง `DEMO DATA` อย่างชัดเจน

### W1 — Login, สิทธิ์ และ Audit

1. สร้าง user, role, site, box assignment, password/session policy และการปิดบัญชี
2. สร้าง device identity แยกจาก user: credential เฉพาะ ESP32, signed request หรือ mTLS, rotation/revocation
3. ใช้ default-deny และตรวจสิทธิ์ทุก endpoint/ทุก `box_id`
4. สร้าง audit event แบบ append-only พร้อมหน้า audit และ export
5. เพิ่ม rate limit แยก user/device, จำกัดขนาด body, schema validation, pagination และ security header

### W2 — Alert, Maintenance และ Kiosk

1. ทำ SLA timer, acknowledgement/verification state, หลักฐานแนบ และ escalation queue
2. ออกแบบ LINE OA adapter แต่ยังปิดไว้จนกว่าผู้รับ/credential จะอนุมัติ; ทดสอบ sandbox ก่อน
3. ทำ kiosk ด้วย badge/PIN, ปุ่ม Alert ใหญ่, auto logout และ offline acknowledgement queue
4. ทำ work order/checklist: filter, cleaning, inspection, calibration, sensor replacement
5. เชื่อม status/runtime/calibration จริงเข้ากับ maintenance health และลบ health score จำลอง

### W3 — Provenance, Trend และ Report

1. เก็บ raw reading แยก validated/derived value พร้อม calibration ID, firmware, model version และเหตุผล validity
2. กราฟ raw/validated signal, baseline drift, noise, error, uptime, calibration age, การเปลี่ยน filter/sensor และ alert history
3. ทำ retention: raw ระยะสั้น, aggregate ระยะยาว และ audit/certificate 5 ปี
4. Export PDF/XLSX/CSV จาก dataset เดียวกัน พร้อม parameter, ผู้ขอ, เวลา และ export hash

### W4 — OTA และ Model Governance

1. ใช้ update service แยกที่ device ดึงออกไปหาเท่านั้น ห้ามเปิด device-local OTA/dashboard สู่ Internet
2. Firmware ต้อง build/scanned/versioned/signed จาก CI และ admin อนุมัติแบบ audit
3. Device ตรวจ signature/version/rollback และรายงานผลหลัง reboot
4. ห้ามโหลด pickle ที่ upload ผ่านเว็บ; ใช้ trusted signed registry/artifact พร้อม hash, dataset version, metric และ approval

### W5 — รายงานการปล่อยมลพิษรายปี

สถานะต้องเป็น `INSUFFICIENT EVIDENCE` จนกว่าจะมีข้อมูลปล่อง/ห้องแล็บที่ผ่านการตรวจสอบ

1. เก็บ stack/exhaust ID, process, control equipment, กะทำงาน, SDS/paint inventory, permit/standard, pollutant, method และหลักฐาน
2. นำเข้าผล CEMS/ผลตรวจปล่องที่ผ่านการรับรอง พร้อม flow, QA/calibration/downtime และใบรับรองห้องแล็บ
3. คำนวณมวลรายปีจาก concentration × verified exhaust flow × valid operating duration ตามวิธีที่กฎหมายกำหนด
4. รายงาน `COMPLIANT`, `EXCEEDANCE`, หรือ `INSUFFICIENT EVIDENCE`; ห้ามใช้ค่า VOC indoor จาก E-Nose เป็นค่าปล่องตามกฎหมาย

## Test / Release Gate

- Test role, object access, audit immutability, SLA, escalation retry, kiosk offline sync และ report consistency
- ทดสอบ migration/restore และ retention/downsampling 5 ปี
- ทำ dependency, secret, SAST, container และ API security scan ใน CI
- ทำ factory acceptance test บน staging ด้วย account จริงทุก role

## แหล่งอ้างอิง

- [OWASP API Security Top 10 2023](https://api-security.owasp.org/editions/2023/en/0x11-t10/)
- [สรุปแผนทั้งโครงการ](PROJECT_REVIEW_AND_PLAN.md)
