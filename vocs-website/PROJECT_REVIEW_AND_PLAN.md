# สรุปรีวิวและแผนโครงการ VOC / E-Nose

เอกสารนี้เป็นสรุปรวมสำหรับส่งต่องาน โดยแยกแผนละเอียดเป็นสองส่วน:

- [แผน Web / Backend](WEB_BACKEND_REVIEW_AND_PLAN.md)
- [แผน Hardware / Firmware](HARDWARE_FIRMWARE_REVIEW_AND_PLAN.md)

> ทั้งสองแผนมีหัวข้อ **คำถามบังคับ — หยุดก่อนเริ่ม Implement** ต้องได้คำตอบจากผู้รับผิดชอบก่อนลงมือ เพื่อไม่ให้ระบบที่ใช้ในโรงงานถูกพัฒนาด้วยสมมติฐานที่ผิด

## ข้อสรุปปัจจุบัน

ระบบกำลังพัฒนาเป็น product ภายในโรงงานสำหรับพื้นที่พ่นสี/พ่นสีฝุ่น เริ่มต้นหนึ่งกล่องแต่ต้องรองรับหลายกล่อง ระบบมีพื้นฐานการอ่าน sensor, ตรวจ outlier, แจ้งเตือน, calibration request, status log และชั่วโมงทำงานแล้ว แต่ยัง **ไม่พร้อมใช้งาน production หรือใช้ตัดสินใจความปลอดภัยตามกฎหมาย** จนกว่าจะผ่าน security, วงจร, calibration และการทดสอบตามแผน

## ข้อกำหนดที่ยืนยันแล้ว

- Role: `operator`, `engineer`, `admin`, `viewer`
- `operator` รับทราบ alert และบันทึกการแก้ไข; `engineer` ดูแล maintenance/calibration; `admin` จัดการระบบ; `viewer` ดูและ export เท่านั้น
- SLA: Warning 10 นาที, High 5 นาที, Critical 5 นาที
- รับทราบผ่านจอที่กล่อง/จอพื้นที่/เว็บ; หากเกิน SLA จึง escalation ผ่าน LINE OA ในอนาคต
- เก็บข้อมูลและหลักฐาน 5 ปี; export PDF, XLSX, CSV
- ต้องมีแนวโน้ม maintenance, calibration, ชั่วโมงใช้งาน, error/noise/drift
- OTA จากภายนอกต้องเป็น outbound-only, signed, audit ได้; ห้ามเปิด local OTA/dashboard สู่ Internet
- E-Nose ในพื้นที่เป็นเครื่องคัดกรอง/ดูแนวโน้ม ไม่ใช่เครื่องยืนยัน concentration หรือการปล่อยปล่องตามกฎหมาย

## ลำดับความสำคัญ

1. **P0 Security:** rotate secret, login/RBAC, device identity, ปิด public control, signed OTA/model
2. **P1 Accuracy:** schematic/5V/ADC verification, protocol calibration, reference measurement, raw/validated provenance
3. **P1 Operation:** audit trail, alert workflow, kiosk, maintenance work order, report 5 ปี
4. **P2 Scale/quality:** test CI, backup/restore, monitoring, retention aggregation, performance/load test
5. **P2 Compliance:** ระบบปล่อง/CEMS หรือผล accredited lab, flow และ annual emissions report

## ขอบเขตการปล่อยอากาศตามกฎหมาย

ค่าจาก sensor ภายในพื้นที่ไม่สามารถสรุปว่าโรงงานปล่อยอากาศผ่านกฎหมายได้ การคำนวณรายปีต้องมีข้อมูลปล่องที่ชัดเจน, pollutant/limit/method ตาม permit, concentration ที่ถูกต้อง, exhaust flow ที่ตรวจสอบได้, operating duration และ QA/calibration record ระบบรายงานต้องแสดง `INSUFFICIENT EVIDENCE` จนกว่าข้อมูลครบ

## เอกสารประกอบ

- [การตรวจสอบ Sensor และ datasheet](SENSOR_VALIDATION.md)
- [OWASP API Security Top 10 2023](https://api-security.owasp.org/editions/2023/en/0x11-t10/)
- [OWASP IoT Top 10](https://owasp.github.io/www-project-internet-of-things/)
