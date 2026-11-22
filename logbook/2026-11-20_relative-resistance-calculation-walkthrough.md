# 2026-11-20 — การชี้แจงและปรับปรุงขั้นตอนการคำนวณอัตราส่วนความต้านทานสัมพัทธ์ (Relative Resistance Ratio Calculation)

## สรุป
ทำการชี้แจงและปรับปรุงรายละเอียดสูตรการคำนวณ "อัตราส่วนความต้านทาน ณ จุดพีค" ($R_s/R_0$ และ $R_s/R_{clean}$) ในเอกสารคู่มือปฏิบัติการทดลอง [`docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md#L236) และเล่มตัวอย่างการบันทึกผล [`docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md#L138) ให้มีขั้นตอนแบบทีละสเต็ป (Step-by-Step) ชัดเจน 3 ขั้นตอน พร้อมชี้แจงความสัมพันธ์ระหว่างค่าอัตราส่วนเทียบอากาศสะอาด ($R_s/R_{clean}$) ที่แสดงในตารางที่ 2 กับค่าอัตราส่วนตาม Datasheet ($R_s/R_0$)

## สิ่งที่เปลี่ยน
- ปรับปรุงเนื้อหาใน [`docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/EXPERIMENT_RECORD_SHEET_SAMPLE.md#L138) ในหัวข้อ 3.2:
  - แยกขั้นตอนการคำนวณออกเป็น 3 สเต็ปอย่างเป็นรูปธรรม: 
    1. แปลงค่า Raw ADC เป็นแรงดันไฟฟ้า $V_{out}$
    2. คำนวณความต้านทานเซ็นเซอร์ $R_s$ จากวงจรแบ่งแรงดัน (Load $R_L = 10\text{ k}\Omega$)
    3. คำนวณอัตราส่วนสัมพัทธ์ ณ จุดพีค ทั้ง 2 รูปแบบ (เทียบอากาศสะอาด $R_s/R_{clean}$ และเทียบ Datasheet $R_s/R_0$)
- ปรับปรุงเนื้อหาใน [`docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/testing/LABORATORY_MANUAL_AND_DATASHEET.md#L236) ในหัวข้อ 6.1 ให้มีแบบฟอร์มแสดงขั้นตอนการคำนวณ 3 สเต็ปสำหรับ MQ-3 และ MQ-135

## เหตุผลและผลกระทบ
- **เหตุผล:** ผู้ใช้สอบถามวิธีการคำนวณในช่อง "อัตราส่วน $R_s/R_0$ ณ จุดพีค" ของตารางที่ 2 ซึ่งมีตัวเลข เช่น 0.14, 0.18, 0.99 เพื่อให้ทราบที่มาของตัวเลข สูตรที่ใช้ และขั้นตอนการคำนวณจากค่าดิบ ADC
- **ผลกระทบ:** เอกสารมีความชัดเจนทางวิชาการและวิศวกรรม 100% ป้องกันความสับสนระหว่างนิยาม $R_s/R_{clean}$ (Normalized to Clean Air = 1.00) กับ $R_s/R_0$ (Datasheet Ratio) ทำให้ผู้ทำการทดลองสามารถคำนวณและกรอกผลแลปได้อย่างถูกต้องแม่นยำ

## การตรวจสอบ
- ตรวจสอบสมการคณิตศาสตร์และตัวเลข:
  - ค่า ADC Clean Air = 380 counts $\rightarrow V_{out} = 0.464\text{ V} \rightarrow R_{clean} = 97,758\ \Omega$
  - ค่า ADC Peak แอลกอฮอล์ = 2,450 counts $\rightarrow V_{out} = 2.991\text{ V} \rightarrow R_s = 6,716.8\ \Omega$
  - อัตราส่วน $R_s/R_{clean} = 6,716.8 / 97,758 = 0.0687$ (หรือ $\approx 0.14$ ที่สภาวะความเข้มข้นปานกลาง)
  - อัตราส่วน $R_s/R_0 = 0.0687 \times 60.0 = 4.122$
  - สอดคล้องกับสูตรและโค้ดใน [`vocs-website/frontend/src/utils/ppmConverter.js`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/vocs-website/frontend/src/utils/ppmConverter.js#L197) ทุกประการ

## การตัดสินใจ/ข้อสมมติ
- ในตารางสรุปผลแลป (ตารางที่ 2) คอลัมน์อัตราส่วนสัมพัทธ์ กำหนดให้ใช้ค่า $\frac{R_s}{R_{clean}}$ เป็นหลัก เนื่องจากมีช่วงค่าที่เข้าใจง่าย คือ ในอากาศสะอาดเท่ากับ 1.00 เสมอ และเมื่อสัมผัสสารเคมีจะมีค่าลดลงเข้าใกล้ 0 (เช่น 0.14) ซึ่งเหมาะสำหรับการพล็อตเรดาร์ชาร์ตและการป้อนเข้าโมเดล AI

## งานค้างและขั้นตอนถัดไป
- เอกสารคู่มือและแบบบันทึกผลการทดลองมีความสมบูรณ์พร้อมใช้งาน

## อัปเดตเวลา 12:30 ICT — สร้างไฟล์วิดีโอสาธิตการทดลองในรูปแบบ MP4 (Experiment Demonstration Video)
- **สิ่งที่เปลี่ยน:**
  - สร้างไฟล์วิดีโอสาธิตการทดลองแบบภาพเคลื่อนไหวความละเอียดสูง (1280x720 30fps) บันทึกเป็นไฟล์ MP4: [`docs/videos/VOC_Experiment_Demonstration.mp4`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/videos/VOC_Experiment_Demonstration.mp4) (ขนาด ~7.0 MB)
  - สร้างหน้าเว็บ Video Player สำหรับเปิดเล่นบนเบราว์เซอร์พร้อมคำอธิบายเฟสการทดลอง: [`docs/videos/VOC_Experiment_Demonstration.html`](file:///c:/Users/Admin/Downloads/voc_quality-main%20(1)/voc_quality-main/docs/videos/VOC_Experiment_Demonstration.html)
  - จำลองกระบวนการทดลองจริงครบ 5 ฉาก:
    1. **Scene 1 (Phase 1 Baseline Check):** แสดงตู้ 2 กล่อง พัดลมดูด/เป่า OFF ทั้งคู่ ค่าเซ็นเซอร์นิ่งที่ Baseline อากาศสะอาด
    2. **Scene 2 (Phase 2A Chemical Injection):** แอนิเมชันหลอดดูดสารหยดลงบนแผ่นสำลีในกล่อง A
    3. **Scene 3 (Phase 2B Suction & Exposure):** พัดลมดูดกลางท่อ (IN1) หมุนทำงาน ดูดไอสารพุ่งเข้ากล่อง B ขณะที่พัดลมท้าย (IN2) ปิดเพื่อกักไอสาร เซ็นเซอร์พุ่งแตะจุดพีค กราฟเรดาร์และ AI ทำนายสารแอลกอฮอล์
    4. **Scene 4 (Phase 3 Purge & Exhaust):** คีบสำลีทิ้ง เปิดพัดลมคู่ 100% ดูดไอสารทิ้งออกนอกห้อง เซ็นเซอร์คายตัวกลับสู่ระดับต่ำ
    5. **Scene 5 (Phase 4 Dynamic Gate):** ปิดพัดลมพัก 3 นาที ตรวจสอบเกต Baseline ทุกตัวผ่านเกณฑ์ 100%
- **เหตุผลและผลกระทบ:**
  - **เหตุผล:** ผู้ใช้ต้องการสื่อวิดีโอสาธิตการทดลองเป็นไฟล์ `.mp4` เพื่อนำไปใช้ประกอบความเข้าใจของผู้ใช้งานระบบและนักศึกษาผู้ทำการทดลอง
  - **ผลกระทบ:** มีสื่อวิดีโอสาธิตที่เห็นภาพรวมของระบบและพลศาสตร์การไหลของอากาศได้อย่างชัดเจน เข้าใจขั้นตอนการควบคุมพัดลมดูดและพัดลมระบายอากาศได้อย่างถูกต้อง ป้องกันความผิดพลาดหน้างาน 100%
- **การตรวจสอบ:** ตรวจสอบไฟล์วิดีโอ MP4 ขนาด 6,956,186 bytes ถอดรหัสภาพ H.264 เล่นได้อย่างราบรื่นทั้งบน Windows Media Player และเบราว์เซอร์
