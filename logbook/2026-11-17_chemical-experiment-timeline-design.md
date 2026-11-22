# 2026-11-17 — แผนและไทม์ไลน์การทดลองสารเคมีกับวงจรตรวจวัดคุณภาพอากาศ (Chemical Experiment Timeline)

## สรุป
จัดทำแผนและออกแบบไทม์ไลน์การทดลองอย่างละเอียดสำหรับการทดสอบสารเคมีและมลพิษ 4 ชนิด (แอมโมเนีย, ทินเนอร์, แอลกอฮอล์, สีฝุ่น) ร่วมกับวงจรเซ็นเซอร์อาร์เรย์ ESP32-WROOM-32U (MQ-3, MQ-135, MQ-2, MiCS-6814, CCS811, PMS5003, DHT22, รีเลย์ระบายอากาศ) เพื่อใช้เป็นคู่มือปฏิบัติการทดลองจริง การเก็บชุดข้อมูล (Dataset Collection) และการประเมินปัญญาประดิษฐ์ E-Nose

## สิ่งที่เปลี่ยน
- สร้างเอกสาร [`docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md)
  - กำหนดตารางการตอบสนองจำเพาะของเซ็นเซอร์ต่อสารเคมีทั้ง 4 ชนิด (Sensor-Chemical Matrix)
  - วางกรอบเวลาโครงการระดับวัน (7-Day Phase Timeline) ตั้งแต่การ Burn-in 24-48 ชม., Baseline Ro, สารเดี่ยว, เก็บ Dataset, สภาวะผสม จนถึงการฝึก ML และ Live Alert
  - กำหนดไทม์ไลน์รอบการทดสอบในห้องแล็บรายนาที (30-Minute Cycle: Baseline, Injection, Rise, Saturation, Purge, Recovery)
  - ตัวอย่างตารางเวลาทดลองจริง 1 วัน (Full-Day Schedule ~2,100 ตัวอย่าง)
  - กฎและมาตรการความปลอดภัยขั้นสูง (Safety Protocols, ป้องกันไฟไหม้จากฮีตเตอร์, PPE, ป้องกันหัววัดเซ็นเซอร์)

## เหตุผลและผลกระทบ
- **เหตุผล:** ผู้ใช้ต้องการไทม์ไลน์และแนวทางการทดลองนำสารเคมี แอมโมเนีย ทินเนอร์ แอลกอฮอล์ และสีฝุ่น มาทดสอบกับวงจรที่สร้างขึ้น เพื่อให้การเก็บข้อมูลเป็นระบบ ไม่เกิดการปนเปื้อนข้าม (Cross-contamination) และปลอดภัยต่อผู้ทดลองและอุปกรณ์
- **ผลกระทบ:** มีเอกสารและแผนปฏิบัติการที่เป็นทางการ สามารถนำไปใช้ทำแล็บจริง เขียนรายงานโปรเจกต์จบ (Senior Project) หรือนำเสนอให้อาจารย์ที่ปรึกษาพิจารณาได้ทันที

## การตรวจสอบ
- ตรวจสอบความถูกต้องของขาสัญญาณและเซ็นเซอร์เทียบกับ [`hardware/wiring/wiring_design.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/hardware/wiring/wiring_design.md) และ [`hardware/validation/SENSOR_VALIDATION.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/hardware/validation/SENSOR_VALIDATION.md)
- ตรวจสอบความสอดคล้องกับโมเดลการจำแนกกลิ่นใน [`docs/ml/ml_model_analysis.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/ml/ml_model_analysis.md)
- เนื้อหาครอบคลุมสารเคมีและมลพิษครบทั้ง 4 ชนิดตามโจทย์ของผู้ใช้

## การตัดสินใจ/ข้อสมมติ
- กำหนดให้ใช้ Chamber ขนาดเล็ก (15–20 ลิตร) พร้อมพัดลมควบคุมด้วยรีเลย์ 2 ช่อง เพื่อควบคุมปริมาตรและอัตราการระบายอากาศให้คงที่
- แยกการทดสอบสารเดี่ยวออกจากสารผสม และกำหนดให้เริ่มจากสารที่มีการระเหยตกค้างน้อยไปสู่สารที่ระเหยตกค้างสูง เพื่อป้องกันการปนเปื้อนใน Chamber
- เน้นย้ำข้อควรระวังเรื่องอุณหภูมิฮีตเตอร์ของเซ็นเซอร์ MQ (~200–300°C) กับไอระเหยไวไฟของทินเนอร์และแอลกอฮอล์

## งานค้างและขั้นตอนถัดไป
- จัดเตรียมกล่อง Chamber และอุปกรณ์หยดสาร (Micropipette / Dropper)
- ดำเนินการอุ่นเซ็นเซอร์ (Burn-in) ตามกำหนดเวลาอย่างน้อย 24–48 ชม. ก่อนเริ่มหยดสารรอบแรก


## อัปเดตเวลา 21:50 ICT — เพิ่มแผนไทม์ไลน์ฉบับเร่งรัด 3 ชั่วโมง (Express 3-Hour Lab Session)
- **สิ่งที่เปลี่ยน:** เพิ่มหัวข้อ 5.1 ใน [`docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md) สำหรับการรันการทดลองครบ 4 สารภายในเวลาจำกัด 3 ชั่วโมง (180 นาที)
- **เหตุผล:** ผู้ใช้ต้องการตารางไทม์ไลน์การทดลองสำหรับช่วงเวลา 3 ชั่วโมง
- **การจัดสรรเวลา:** 
  1. เตรียมระบบ & Ro Baseline: 20 นาที
  2. สารที่ 1: สีฝุ่น (35 นาที: Baseline 3m + สัมผัสสาร 12m + ดูดออก 15m + พัก 5m)
  3. สารที่ 2: แอลกอฮอล์ (35 นาที: Baseline 3m + สัมผัสสาร 12m + ดูดออก 15m + พัก 5m)
  4. สารที่ 3: ทินเนอร์ (35 นาที: Baseline 3m + สัมผัสสาร 12m + ดูดออก 15m + พัก 5m)
  5. สารที่ 4: แอมโมเนีย (35 นาที: Baseline 3m + สัมผัสสาร 12m + ดูดออก 15m + พัก 5m)
  6. สรุปผลและส่งออก Dataset: 20 นาที
- **ข้อกำหนดทางเทคนิค:** กำหนดลำดับการทดสอบ (สีฝุ่น ➔ แอลกอฮอล์ ➔ ทินเนอร์ ➔ แอมโมเนีย) เพื่อลดปัญหาการปนเปื้อนข้ามของไอระเหยในกล่อง Chamber โดยมีเงื่อนไขว่าบอร์ดต้องผ่านการอุ่นเครื่อง (Preheat) ล่วงหน้ามาก่อนเริ่มเซสชัน 3 ชั่วโมงนี้


## อัปเดตเวลา 21:55 ICT — เพิ่มรายละเอียดไทม์ไลน์ 1 สารแบบครบวงจรจนกลับสู่ปกติ (Single Substance Full Lifecycle)
- **สิ่งที่เปลี่ยน:** ปรับปรุงหัวข้อที่ 4 ใน [`docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md#L128)
  - เพิ่มแผนภาพ Response & Recovery Curve แสดงเส้นกราฟสัญญาณ (Baseline ➔ Injection ➔ Rise t90 ➔ Peak ➔ Purge ➔ Decay t10 ➔ Stable)
  - แจกแจงเวลารายนาที (00:00 ถึง 30:00) แบ่งเป็น 7 สเตจย่อยพร้อมระบุสถานะพัดลมรีเลย์
  - เปรียบเทียบระยะเวลาฟื้นตัวแยกตามชนิดสาร: สีฝุ่น (~20m), แอลกอฮอล์ (~20-25m), ทินเนอร์ (~25-30m), แอมโมเนีย (~25-30m)
  - กำหนดเกณฑ์ทางคณิตศาสตร์ 4 ข้อที่ใช้ตัดสินว่า "วงจรกลับสู่ปกติแล้วจริง" (Baseline Drift $\le 5\%$, Noise SD < 10 counts, PM2.5 < 15 µg/m³, TVOC < 50 ppb, และ AI State: CLEAN)
- **เหตุผล:** ผู้ใช้ต้องการแนวทางปฏิบัติและไทม์ไลน์ที่เจาะจงสำหรับการทดสอบ 1 สาร ตั้งแต่เริ่มใส่สารจนกว่าค่าเซ็นเซอร์จะคืนตัวกลับสู่สภาวะปกติอย่างชัดเจน


## อัปเดตเวลา 22:02 ICT — เพิ่มมาตรฐานรอบเวลาเท่ากัน (25 นาที), ปริมาณสารที่เหมาะสม และคู่สารที่ผสมได้
- **สิ่งที่เปลี่ยน:** เพิ่มหัวข้อ 4.1, 4.2 และ 4.3 ใน [`docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md)
  - **รอบเวลาเท่ากัน:** กำหนดมาตรฐาน **25 นาทีต่อรอบคงที่** สำหรับทุกสาร (Baseline 3m ➔ Exposure 7m ➔ Purge 12m ➔ Rest 3m) เพื่อความเที่ยงตรงทางสถิติและทำซ้ำได้ง่าย
  - **ปริมาณสารที่เหมาะสม (Optimal Dosing Matrix):**
    - สีฝุ่น: 0.5–1.0 กรัม (ห้ามเกิน 1.5g ป้องกันเลเซอร์อุดตัน)
    - แอลกอฮอล์: 0.3 ml (~6 หยด บนสำลี 2x2 ซม.)
    - ทินเนอร์: 0.15 ml (~3 หยด บนสำลี 2x2 ซม., ห้ามเกิน 0.3 ml ป้องกันกลิ่นตกค้างนาน)
    - แอมโมเนียเจือจาง: 0.15 ml (~3 หยด บนสำลี 2x2 ซม., ห้ามใช้เข้มข้น > 20%)
  - **การผสมสารเคมี (Mixture Testing & Compatibility):**
    - ระบุ 3 สูตรผสมจำลองสถานการณ์จริง: (1) สีฝุ่น + ทินเนอร์, (2) ทินเนอร์ + แอลกอฮอล์, (3) สีฝุ่น + แอลกอฮอล์
    - ระเบียบวิธีผสมที่ปลอดภัย: ใช้วิธีแยกสำลีคนละก้อนใน Chamber เพื่อให้ไอระเหยผสมกันในอากาศ (Vapor-phase mixing) ห้ามเทของเหลวรวมกันในหลอดแก้ว
    - ข้อห้ามเด็ดขาด: ห้ามผสมแอมโมเนียกับคลอรีน/กรด และห้ามชโลมตัวทำละลายลงบนสีฝุ่นโดยตรง
- **เหตุผล:** ผู้ใช้ต้องการมาตรฐานเวลาต่อรอบที่เท่ากัน ปริมาณสารที่แม่นยำ และคำแนะนำเกี่ยวกับการผสมสารเคมีเพื่อทดสอบ E-Nose


## อัปเดตเวลา 22:04 ICT — ออกแบบกระบวนการหยดสารเคมีและแผนผังจำลองขั้นตอน (Chemical Dropping Process & Visual Workflow)
- **สิ่งที่เปลี่ยน:** เพิ่มหัวข้อที่ 7 ใน [`docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md#L360)
  - ออกแบบโครงสร้าง Chamber ตัดขวาง (Cutaway Diagram) แสดงตำแหน่งช่องหยดสาร (Injection Port Ø 1.5 ซม. พร้อมจุกยางซิลิโคน) วางตรงกับจานแก้วนาฬิการองสำลี 2x2 ซม. โดยเว้นระยะห่างจากแผงวงจรเซ็นเซอร์อย่างน้อย 15 ซม.
  - กำหนดอุปกรณ์ในกระบวนการหยดสาร (Transfer Pipette 1 ml มีสเกล, สำลีทางการแพทย์ 2x2 ซม., จานแก้วนาฬิกา, แหนบสแตนเลส, ถุงซิปล็อกทิ้งสาร)
  - วาดภาพขั้นตอน 5-Step Visual Procedure (1. วางสำลี ➔ 2. ดูดสารตามสเกล ➔ 3. สอดปลายหลอดและหยดตรงกลาง ➔ 4. ปิดจุกยางทันทีเพื่อคุมปริมาตร ➔ 5. คีบสำลีทิ้งหลัง 7 นาที)
  - เปรียบเทียบกระบวนการระหว่างสารเคมีเหลว (Liquid Dropping via Cotton Carrier) กับผงสีฝุ่น (Powder Agitation via Micro-tray)
- **เหตุผล:** ผู้ใช้ต้องการให้ออกแบบกระบวนการหยดสารและนำเสนอให้เห็นภาพกระบวนการปฏิบัติจริงอย่างชัดเจน


## อัปเดตเวลา 22:06 ICT — สร้างภาพ 3D/JPG สำหรับกล่องทดลองและกระบวนการหยดสาร (Chamber Visualization JPG)
- **สิ่งที่เปลี่ยน:** 
  - สร้างภาพจำลองทางวิทยาศาสตร์ความละเอียดสูงระดับ 3D Render ในรูปแบบไฟล์ JPG
  - คัดลอกและบันทึกไฟล์ภาพไว้ที่ [`docs/images/voc_test_chamber_setup.jpg`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/images/voc_test_chamber_setup.jpg)
  - แนบภาพลงในเอกสาร [`docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md#L368) ในหัวข้อที่ 7.1
- **รายละเอียดในภาพ JPG:**
  1. กล่องทดลองอะคริลิกใส (Acrylic Chamber ~30x20x20 cm) วางบนโต๊ะปฏิบัติการสีขาว
  2. แผงวงจรเซ็นเซอร์อาร์เรย์ด้านซ้าย (ESP32, MQ-3, MQ-135, MQ-2, PMS5003 laser dust sensor พร้อมการเดินสายเรียบร้อย)
  3. พัดลมระบายอากาศ DC ขนาดจิ๋วติดตั้งที่ผนังสองฝั่ง (Intake และ Exhaust)
  4. จานแก้วนาฬิกาตรงกลางกล่อง พร้อมแผ่นสำลีบริสุทธิ์สี่เหลี่ยมขนาด 2x2 ซม.
  5. ถุงมือยางไนไตรล์สีฟ้าของผู้ทดลองกำลังถือไมโครปิเปต/หลอดหยด สอดผ่านช่องจุกยางด้านบน และหยดสารละลายเคมีลงบนสำลี
  6. ขวดสารเคมีด้านนอกกล่องติดป้ายชัดเจน: Ethanol, Thinner, Ammonia (NH3) และกระปุกผงสีฝุ่น (Powder Coating Pigment)
- **เหตุผล:** ผู้ใช้ต้องการภาพกราฟิกไฟล์ JPG สำหรับจำลองและเห็นภาพกระบวนการหยดสารและการจัดตั้งวงจรทดลอง


## อัปเดตเวลา 22:07 ICT — จัดเก็บภาพ JPG ทั้ง 2 รูปแบบลงโฟลเดอร์ docs/images/
- **สิ่งที่เปลี่ยน:**
  - บันทึกภาพ 3D Clean Render ลงที่ [`docs/images/voc_test_chamber_clean.jpg`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/images/voc_test_chamber_clean.jpg)
  - บันทึกภาพ Infographic Setup ลงที่ [`docs/images/voc_test_chamber_setup.jpg`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/images/voc_test_chamber_setup.jpg)
  - อัปเดตการแสดงผลภาพทั้งสองลงใน [`docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md#L368)


## อัปเดตเวลา 22:55 ICT — ออกแบบระเบียบการทดสอบทีละสารแบบมี Dynamic Baseline Gate พร้อมเปเปอร์วิจัยอ้างอิง
- **สิ่งที่เปลี่ยน:** เพิ่มหัวข้อที่ 8 และ 9 ใน [`docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/CHEMICAL_EXPERIMENT_TIMELINE.md)
  - **Dynamic Baseline Gate Architecture:** ออกแบบ Flowchart และขั้นตอนการทดลองมาตรฐาน 25 นาทีต่อรอบ (Baseline 3m ➔ Exposure 7m ➔ Purge 12m ➔ Rest 3m) โดยมีเงื่อนไขตรวจสอบก่อนเริ่มสารตัวถัดไป (Gate Check: $R_s/R_0 \le \pm 5\%$, TVOC < 50 ppb, PM2.5 < 15 µg/m³) หากยังไม่ผ่าน ให้ยืดเวลาเปิดพัดลมดูดออกต่อทีละ 2–5 นาทีจนกว่าจะกลับสู่สภาวะปกติจริง
  - **ตารางเปรียบเทียบ 4 สาร:** ระบุปริมาณสาร (สีฝุ่น 0.5g, แอลกอฮอล์ 0.3ml, ทินเนอร์ 0.15ml, แอมโมเนีย 0.15ml) และเกณฑ์การผ่านเฉพาะของแต่ละตัว
  - **Data Schema & Labeling:** กำหนดโครงสร้าง JSON และฟิลด์ข้อมูลที่ส่งบันทึกเข้าสู่ PostgreSQL ทุกๆ 1–2 วินาที สำหรับใช้เทรน AI
  - **Academic References:** แนบเปเปอร์วิจัยระดับสากล 5 ฉบับ พร้อมชื่อผู้แต่ง, วารสาร/การประชุม, DOI ที่สืบค้นได้จริง และคำอธิบายความเกี่ยวข้องในการนำไปเขียนบทที่ 2 และบทที่ 3 ของเล่มรายงาน
- **เหตุผล:** ผู้ใช้ต้องการให้ออกแบบไทม์ไลน์และระเบียบการทดสอบสารเคมีทีละตัวแบบใช้เวลาเท่ากันหรือจนกว่าจะกลับสู่ Baseline ปกติ พร้อมขอเปเปอร์วิจัยอ้างอิงสำหรับใช้ประโยชน์ในงานวิจัยโครงงาน
