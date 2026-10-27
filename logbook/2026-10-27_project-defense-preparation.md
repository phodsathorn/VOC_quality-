# 2026-10-27 — Project Defense Preparation

## สรุป

จัดทำคู่มือภาษาไทยสำหรับเตรียมตอบสอบหัวข้อโครงงาน ครอบคลุมระบบ, sensor, ความน่าเชื่อถือ, web/security, hardware v2 และ Machine Learning โดยยึดตามสถานะโค้ด/metadata ที่มีจริง

## สิ่งที่เปลี่ยน

- เพิ่ม `docs/product/PROJECT_DEFENSE_QA_TH.md`
- เพิ่มลิงก์จาก brief สำหรับสไลด์ไปยังคู่มือคำถาม-คำตอบ
- ระบุชัดเจนว่าโมเดลปัจจุบันคือ Random Forest backend baseline และผล accuracy 1.00 จาก random split ยังไม่ใช่ผลที่ใช้เคลมความพร้อมใช้งาน

## เหตุผลและผลกระทบ

- ลดความเสี่ยงของการตอบเกินกว่าหลักฐาน โดยเฉพาะเรื่อง ppm, compliance, AI confidence และความแม่นยำ
- ทำให้ผู้จัดทำอธิบายเหตุผลเลือกโมเดล, feature, data leakage, validation และ roadmap ได้เป็นระบบ

## การตรวจสอบ

- ตรวจ `train_model.py`, `model_loader.py` และ `model_meta.json` เพื่อยืนยันชนิดโมเดล, feature, sample count, class และ metric ปัจจุบัน
- ตรวจว่าเอกสารแยกสิ่งที่ทำแล้วจากงานที่ยังต้อง validation/deploy อย่างชัดเจน

## การตัดสินใจ/ข้อสมมติ

- ใช้ Random Forest เป็น baseline ในการอธิบาย ไม่กล่าวว่าเป็นโมเดลสุดท้ายหรือดีที่สุด
- สื่อสาร accuracy ปัจจุบันเป็น sanity check ของ pipeline เนื่องจาก random row split มีความเสี่ยง data leakage

## งานค้างและขั้นตอนถัดไป

1. เก็บข้อมูลแบบ session-based และประเมินด้วย group/time split
2. ทำสไลด์จาก brief พร้อมใส่รูปกล่อง/dashboard/ผลทดสอบจริง
3. ซ้อมตอบจากคู่มือและแทนที่ข้อมูล placeholder ด้วยผลทดลองจริงก่อนวันสอบ
