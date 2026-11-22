# 2026-11-19 — การกำหนดค่ามาตรฐาน Clean Air Ratio ลงในตารางบันทึกผลการทดลอง (Standardized Clean Ratio Embedding)

## สรุป
ทำการปรับปรุงตารางบันทึกค่าอากาศสะอาดพื้นฐาน (ตารางที่ 1: Baseline $R_0$) ในคู่มือปฏิบัติการทดลองและแบบบันทึกผลการทดลอง โดยบรรจุคอลัมน์ค่าคงที่มาตรฐาน **Clean Air Ratio (จาก Datasheet)** ลงในตารางแบบถาวร (MQ-3 = 60.0, MQ-135 = 3.6, MQ-2 = 9.83, MQ-8 = 70.0) พร้อมระบุสูตรคำนวณกำกับในหัวตารางอย่างชัดเจน

## สิ่งที่เปลี่ยน
- แก้ไข [`docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md#L142) ในตารางที่ 1:
  - เพิ่มคอลัมน์ `ค่ามาตรฐาน Clean Air Ratio (จาก Datasheet)` และพิมพ์ค่าคงที่สำเร็จรูป (60.0, 3.6, 9.83, 70.0)
  - เพิ่มสูตรกำกับหัวตาราง: `$R_0 = R_{clean} / \text{Clean Air Ratio}$`
  - เพิ่มแถวเซ็นเซอร์ MQ-8 (Hydrogen) เพื่อความครบถ้วนตามวงจร
- แก้ไข [`docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md#L60) ในตารางที่ 1:
  - ระบุชัดเจนว่า Clean Air Ratio เป็นค่าคงที่มาตรฐานที่ฝังไว้ในตาราง

## เหตุผลและผลกระทบ
- **เหตุผล:** ผู้ใช้แนะนำว่าค่า Clean Air Ratio จาก Datasheet เป็นค่าคงที่ตายตัวจากผู้ผลิต ควรเขียนแนบไว้ในตารางให้เป็นค่ามาตรฐานสำเร็จรูป เพื่อให้ผู้ทดลองไม่ต้องเสียเวลาเปิดค้นหา Datasheet หน้างาน
- **ผลกระทบ:** แบบฟอร์มบันทึกผลมีความสมบูรณ์ ใช้งานได้สะดวกรวดเร็ว ลดความผิดพลาดในการคำนวณค่า $R_0$ ของผู้ทำการทดลอง

## การตรวจสอบ
- ตรวจสอบค่า Clean Air Ratio เทียบกับโค้ดจริงใน [`vocs-website/frontend/src/utils/ppmConverter.js`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/vocs-website/frontend/src/utils/ppmConverter.js#L50):
  - MQ-2 cleanRatio: 9.83
  - MQ-3 cleanRatio: 60.0
  - MQ-8 cleanRatio: 70.0
  - MQ-135 cleanRatio: 3.6
- ค่าในตารางตรงกับพารามิเตอร์ของระบบ 100%

## การตัดสินใจ/ข้อสมมติ
- กำหนดให้ค่า Clean Air Ratio เป็นค่าคงที่สำเร็จรูปในตาราง (Pre-filled Constant) ทำให้นักศึกษา/ผู้ทดลองกรอกเพียงค่า $V_{out}$ และ $R_{clean}$ ที่วัดได้จริง แล้วนำมาหารด้วยค่าในช่องนี้ได้ทันที

## งานค้างและขั้นตอนถัดไป
- เอกสารคู่มือและแบบบันทึกผลการทดลองพร้อมนำไปจัดพิมพ์หรือใช้งานหน้างานได้ทันที


## อัปเดตเวลา 15:25 ICT — ชี้แจงการใช้งานน้ำยาแอมโมเนียหอมสูดดมแก้วิงเวียน (Aromatic Ammonia Inhalant) ในการทดลอง
- **สิ่งที่เปลี่ยน:** ปรับปรุงรายการสารเคมีใน [`docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md#L101) ระบุชัดเจนว่าสามารถใช้ "น้ำยาแอมโมเนียหอมสูดดมแก้วิงเวียนเป็นลม" (Aromatic Ammonia Spirit) จากร้านขายยาแทนแอมโมเนียเกรดแลปได้
- **เหตุผลและข้อเท็จจริงทางเทคนิค:**
  1. **ความปลอดภัยสูง:** น้ำยาแอมโมเนียหอมมีความเข้มข้นของก๊าซแอมโมเนียอิสระเพียง 1.7–3.4% ปลอดภัยต่อระบบทางเดินหายใจของผู้ทำการทดลองมากกว่าการใช้แอมโมเนียเข้มข้นเกรดเคมี (25–28%) ซึ่งมีอันตรายสูง
  2. **ผลต่อเซ็นเซอร์ E-Nose:** เซ็นเซอร์ MQ-135 และ MiCS-6814 ($NH_3$) จะตอบสนองพุ่งสูงทันทีตามปกติ อย่างไรก็ตาม เนื่องจากน้ำยาแอมโมเนียหอมส่วนใหญ่มีส่วนผสมของเอทานอล (Alcohol ~60%) เพื่อละลายน้ำมันหอมระเหย อาจทำให้เซ็นเซอร์ MQ-3 ตอบสนองขึ้นมาบางส่วน ซึ่งถือเป็นกรณีศึกษาที่ดีในการทดสอบความจำเพาะ (Selectivity) ของ E-Nose

## อัปเดตเวลา 16:00 ICT — ปรับปรุงตารางบันทึกผลการทดสอบสารเดี่ยว (ตารางที่ 2) ให้ครอบคลุมเซ็นเซอร์ทั้ง 8 ตัวในกล่อง
- **สิ่งที่เปลี่ยน:**
  - แก้ไข [`docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md#L160) ในส่วนตารางที่ 2:
    - ขยายคอลัมน์เซ็นเซอร์จากเดิมที่ระบุเฉพาะ "เซ็นเซอร์ที่ตอบสนองเด่น" 4 ตัว ให้แสดง **เซ็นเซอร์ทั้ง 8 ตัวในกล่อง** อย่างครบถ้วน ได้แก่ MQ-3, MQ-135, MQ-2, MQ-8, MiCS-6814, CCS811, PMS5003, และ DHT22
    - เพิ่มแม่แบบแบบฟอร์ม **ตารางที่ 2.1 – 2.4 (Detailed 8-Sensor Datasheet per Run)** สำหรับกรอกข้อมูลเซ็นเซอร์ทั้ง 8 ตัวแบบรายตัวแยกรอบทดลอง
    - ปรับปรุงตารางตัวอย่างการกรอกผลจริง (Section 9.4) ให้มีค่าตัวเลขครบทั้ง 8 เซ็นเซอร์ในทั้ง 4 สารเคมี
  - แก้ไข [`docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md#L76) ในตารางที่ 2 ให้มีค่าโทรมาตรของเซ็นเซอร์ทั้ง 8 ตัวสอดคล้องกัน
- **เหตุผลและผลกระทบ:**
  - **เหตุผล:** ผู้ใช้ต้องการให้ตารางบันทึกผลการทดลองสามารถบันทึกค่าของเซ็นเซอร์ทุกตัวที่ติดตั้งอยู่ในกล่องวัด (8 ตัว) ได้ทั้งหมด เพื่อให้เห็นพฤติกรรม Cross-sensitivity, การไม่ตอบสนองของเซ็นเซอร์ตัวอื่น (Selectivity Matrix) และสภาวะแวดล้อม (T/RH) ขณะทดสอบ
  - **ผลกระทบ:** แบบบันทึกผลมีความครอบคลุมทางวิศวกรรม 100% สามารถนำข้อมูลไปพล็อต Odor Fingerprint Radar Chart 8 ทิศทาง และใช้เป็น Training Dataset สำหรับโมเดล AI ได้อย่างสมบูรณ์แบบ
- **การตรวจสอบ:** ตรวจสอบความถูกต้องของขาสัญญาณและประเภทเซ็นเซอร์ทั้ง 8 ตัว ตรงตามข้อกำหนดใน [`CORE_SPEC.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/CORE_SPEC.md#L127) ทุกประการ

## อัปเดตเวลา 22:55 ICT — ปรับปรุงตารางบันทึกผลการทดสอบสารผสม (ตารางที่ 3) ให้แสดงเซ็นเซอร์ร่วม (Co-responding Sensors)
- **สิ่งที่เปลี่ยน:**
  - ปรับปรุง [`docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md#L194) ในตารางที่ 3:
    - ขยายคอลัมน์ `พฤติกรรมการตอบสนองของเซ็นเซอร์หลักและเซ็นเซอร์ร่วม` ให้ระบุรายการเซ็นเซอร์ที่ทำงานร่วมกัน (Co-responding Sensors) ได้แก่ MQ-2, MQ-3, MiCS-6814, PMS5003 (PM10), MQ-8 (เซ็นเซอร์ที่นิ่ง), และ DHT22
  - ปรับปรุง [`docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md#L89) ในตารางที่ 3 ให้มีตัวเลขสมจริงของเซ็นเซอร์ร่วมครบทุกมิติ
- **เหตุผลและผลกระทบ:**
  - **เหตุผล:** ผู้ใช้สอบถามว่าในส่วนการทดสอบสารผสม สามารถดูค่าตอบสนองของเซ็นเซอร์ตัวอื่นที่ใช้ร่วมกันในกล่องได้หรือไม่
  - **ผลกระทบ:** ชี้แจงช่องทางการดูค่าโทรมาตร (Web Drawer, Serial Monitor, CSV Export) และปรับแบบฟอร์มให้บันทึกพฤติกรรม Additive/Synergistic effect ของสารเคมีหลายชนิดได้อย่างสมบูรณ์แบบ

## อัปเดตเวลา 23:15 ICT — ปรับปรุงตารางตรวจสอบเกตการคืนตัวสู่ Baseline (ตารางที่ 4 และ 4.1) ให้ตรวจเช็กเซ็นเซอร์ครบทั้ง 8 ตัว
- **สิ่งที่เปลี่ยน:**
  - ปรับปรุง [`docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md#L205):
    - ขยายตารางที่ 4 เพิ่มคอลัมน์ `ตรวจสอบเซ็นเซอร์ทุกตัว (1–8)` และบันทึกค่าของเซ็นเซอร์ที่ตอบสนองร่วมในแต่ละรอบ
    - เพิ่ม **ตารางที่ 4.1: เมทริกซ์ตรวจสอบการคืนตัวของเซ็นเซอร์ทั้ง 8 ตัวฉบับเต็ม (Full 8-Sensor Baseline Recovery Checklist)** เป็นเช็กลิสต์เทียบค่าเริ่มต้น $t_0$ vs ค่าหลังจบแต่ละรอบสำหรับทั้ง 8 เซ็นเซอร์
    - อัปเดตตัวอย่างการกรอกข้อมูลจริงใน Section 9.4
  - ปรับปรุง [`docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md#L98) ในตารางที่ 4 และเพิ่มตาราง 4.1 สอดคล้องกัน
- **เหตุผลและผลกระทบ:**
  - **เหตุผล:** ผู้ใช้สอบถามว่าในตารางที่ 4 (เกตตรวจสอบ Baseline ก่อนเริ่มสารตัวถัดไป) จำเป็นต้องแสดงค่าของเซ็นเซอร์ทุกตัวเหมือนก่อนเริ่มทดสอบ (ตารางที่ 1) หรือไม่ หรือบันทึกเฉพาะตัวแทน
  - **ผลกระทบ:** ชี้แจงว่าในเชิงวิศวกรรมที่รัดกุม การตรวจดูครบทั้ง 8 ตัวจะช่วยยืนยันว่าไม่มีไอระเหยตกค้าง (Residual Vapor) และไม่มี Sensor Drift ก่อนเริ่มรอบถัดไป พร้อมออกแบบให้มีทั้งตารางสรุปเร็ว (Quick Gate) และเมทริกซ์บันทึกครบ 8 ตัวเต็มรูปแบบ (Full 8-Sensor Audit Log)

## อัปเดตเวลา 23:42 ICT — สร้างเอกสารคู่มือและแผนการทดลองฉบับสมบูรณ์ในรูปแบบ PDF (Complete Experimental Plan PDF)
- **สิ่งที่เปลี่ยน:**
  - สร้างไฟล์ต้นฉบับ HTML สำหรับการพิมพ์: [`docs/testing/VOC_EXPERIMENT_PLAN_COMPLETE_GUIDE.html`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/VOC_EXPERIMENT_PLAN_COMPLETE_GUIDE.html)
  - แปลงเป็นไฟล์เอกสาร PDF เวกเตอร์คุณภาพสูงพร้อมพิมพ์ A4: [`docs/testing/VOC_EXPERIMENT_PLAN_COMPLETE_GUIDE.pdf`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/VOC_EXPERIMENT_PLAN_COMPLETE_GUIDE.pdf) (ขนาด 502 KB)
  - บรรจุเนื้อหาและภาพเวกเตอร์ SVG ชัดเจนตั้งแต่ต้นจนจบ:
    1. แผนผังจำลองโครงสร้างตู้ทดสอบ 2 แชมเบอร์ (Chamber A Dosing + Chamber B Sensor Array + Connecting Duct)
    2. รายละเอียดขาสัญญาณและบทบาทของเซ็นเซอร์ครบทั้ง 8 ตัว (MQ-3, MQ-135, MQ-2, MQ-8, MiCS-6814, CCS811, PMS5003, DHT22)
    3. แผนภูมิและตารางไทม์ไลน์ 25 นาที (Phase 1 Baseline -> Phase 2A Dosing -> Phase 2B Suction -> Phase 3 Purge -> Phase 4 Dynamic Gate) พร้อมสถานะรีเลย์พัดลมดูด/เป่า
    4. สูตรคำนวณ $V_{out}, R_s, R_0, t_{90}, t_{10}$
    5. ตารางบันทึกผลการทดลองครบทุกตาราง (ตารางที่ 1, 2, 3, 4, และ 4.1) พร้อมตัวเลขสมจริง
    6. ข้อกำหนดความปลอดภัย PPE และการรับมือสารเคมี
- **เหตุผลและผลกระทบ:**
  - **เหตุผล:** ผู้ใช้ต้องการให้สรุปแผนการทดลองตั้งแต่ต้นจนจบลงในไฟล์ PDF เพื่อให้เห็นภาพรวมของการทดลองทั้งหมดอย่างเป็นรูปธรรม
  - **ผลกระทบ:** ผู้ใช้และทีมทดลองมีเอกสาร PDF ทางการที่สามารถเปิดดูบนอุปกรณ์ใดก็ได้ หรือสั่งพิมพ์ลงกระดาษ A4 หน้างานเพื่อนำไปใช้ปฏิบัติตามขั้นตอนได้อย่างถูกต้อง 100%
