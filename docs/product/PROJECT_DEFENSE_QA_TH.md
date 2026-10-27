# คู่มือเตรียมตอบสอบหัวข้อโครงงาน

> โครงงาน: **ระบบเฝ้าระวังคุณภาพอากาศแบบ Electronic Nose และ IoT สำหรับพื้นที่พ่นสีฝุ่น**
>
> เอกสารนี้ใช้ตอบหัวข้อสอบ/สอบความก้าวหน้า โดยแยกชัดเจนระหว่าง **สิ่งที่ทำแล้ว**, **สิ่งที่ผลปัจจุบันยังพิสูจน์ไม่ได้**, และ **แผนทดลองถัดไป**

## 1. คำตอบเปิดโครงงาน (60 วินาที)

“โครงงานนี้พัฒนาระบบเฝ้าระวังคุณภาพอากาศสำหรับบริเวณพ่นสีฝุ่น โดยใช้ sensor array, ESP32, ระบบเว็บ และฐานข้อมูล เพื่อดูข้อมูลแบบ real-time, แจ้งเตือน, เก็บประวัติ และช่วยบำรุงรักษาเซนเซอร์ จุดวิจัยคือการนำสัญญาณจากหลายเซนเซอร์ที่มี cross-sensitivity มาสร้าง gas fingerprint หรือ Electronic Nose แล้วใช้ Machine Learning จำแนกสภาวะอากาศที่มี label จากหน้างาน เช่น ambient และ alcohol/VOC pattern เราไม่ได้อ้างว่าแทนเครื่องวิเคราะห์ก๊าซมาตรฐานหรือใช้ยืนยันกฎหมายได้ เพราะต้องมี calibration และเครื่องมืออ้างอิงก่อน เป้าหมายคือระบบเฝ้าระวังที่ตรวจสอบย้อนหลังได้ ลด false alert และต่อยอดเป็นระบบโรงงานได้อย่างปลอดภัย”

## 2. สถานะจริงของโครงการ: ต้องตอบให้ตรง

| หัวข้อ | สถานะที่ควรพูด |
|---|---|
| กล่อง ESP32 อ่านค่าและส่ง telemetry | มีต้นแบบ firmware |
| Backend / dashboard / database | มีต้นแบบและ deploy แล้ว |
| ระบบ ML ปัจจุบัน | `scikit-learn RandomForestClassifier` ทำ inference ที่ backend |
| Dataset ที่มีผลบันทึกใน model metadata | 254 แถว, 2 classes: `ALCOHOL`, `AMBIENT` |
| Metric ปัจจุบัน | accuracy 1.00 บน random test split 51 แถว — **เป็น baseline เท่านั้น ยังห้ามอ้างว่าใช้จริงได้** |
| Validation แบบแยก session/วัน | ยังต้องทำ |
| Ground-truth reference analyzer / calibration traceable | ยังไม่มีผลยืนยันครบ |
| โมเดลบน ESP32 / TFLite OTA | เป็นแผนต่อยอด ยังไม่ใช่สิ่งที่ deploy ปัจจุบัน |
| รุ่น hardware v2 | เป็นแบบออกแบบและ BOM/PCB preliminary; ยังไม่ใช่ hardware ที่ผ่าน test ภาคสนาม |

คำว่า **baseline** สำคัญมาก: หมายถึงโมเดลเริ่มต้นที่ใช้พิสูจน์ pipeline การเก็บข้อมูล → train → evaluate → inference ได้ ไม่ใช่หลักฐานว่าระบบแม่นยำเพียงพอสำหรับความปลอดภัย

## 3. ภาพรวมระบบที่ตอบได้

```text
Sensor array → ESP32 firmware → HTTPS telemetry → FastAPI backend → PostgreSQL
     ↑                                                        ↓
local display / calibration command                   React dashboard / alert / export
                                                             ↓
                                              Random Forest prediction (backend)
```

- Frontend: React/Vite, deploy บน Vercel
- Backend: FastAPI, deploy บน Render
- Database: PostgreSQL บน Neon
- การเชื่อมต่อปัจจุบันเป็นการส่งข้อมูลจากกล่องออกไปที่ backend
- `DATABASE_URL` และ Wi-Fi secret ต้องอยู่ใน environment/secrets ไม่อยู่ใน source code

## 4. คำถาม-คำตอบ: ปัญหา วัตถุประสงค์ และขอบเขต

### Q1: ปัญหาที่ต้องการแก้คืออะไร?

พื้นที่พ่นสีฝุ่นต้องการเห็นแนวโน้มอากาศและเหตุผิดปกติอย่างต่อเนื่อง ขณะที่เครื่องมืออ้างอิงอุตสาหกรรมมีต้นทุนสูง โครงงานจึงสร้างระบบเฝ้าระวังต้นทุนเหมาะสมที่ดูข้อมูล, แจ้งเตือน, เก็บ log และวางแผนบำรุงรักษาได้ ไม่ได้ตั้งเป้าแทนการตรวจรับรองตามกฎหมายตั้งแต่ต้น

### Q2: ทำไมไม่ใช้เซนเซอร์ตัวเดียว?

เซนเซอร์ก๊าซ MOX/MEMS หนึ่งตัวไวต่อสารหลายชนิดและได้รับผลจากอุณหภูมิ/ความชื้น การใช้หลายตัวทำให้เกิดรูปแบบสัญญาณร่วมกัน หรือ gas fingerprint ซึ่งมีข้อมูลมากกว่าสัญญาณเดียว แต่ยังต้อง train/validate กับข้อมูลจริงก่อนจึงจะตีความได้

### Q3: Electronic Nose คืออะไร?

เป็นแนวคิดที่ใช้ sensor array ซึ่งแต่ละตัวตอบสนองกว้างและไม่จำเพาะ 100% รวมสัญญาณเข้ากับ algorithm เพื่อจำแนก “pattern” ของสภาวะหรือสารที่เคยมีในชุดข้อมูล ไม่ใช่จมูกมนุษย์และไม่ใช่เครื่อง chromatography

### Q4: ขอบเขตของโครงงานคืออะไร?

วัด/บันทึกสภาพแวดล้อม, ฝุ่น, gas-sensor signals, สถานะอุปกรณ์ และการจำแนก class ที่อยู่ใน dataset พร้อมแสดงผล/แจ้งเตือนผ่านเว็บ ขอบเขตไม่รวมการรับรองการปล่อยอากาศจากปล่อง, การวัดสารทุกชนิด หรือการสั่งเครื่องจักร AC โดยตรง

### Q5: งานนี้ต่างจากเครื่องวัดคุณภาพอากาศทั่วไปอย่างไร?

จุดต่างคือการรวม sensor array + telemetry + dataset labeling + ML + sensor health/maintenance log เพื่อให้ระบบปรับปรุงกับบริบทโรงงานได้ ไม่ได้มีเพียงค่าปัจจุบันบนจอ

### Q6: ประโยชน์ที่วัดผลได้คืออะไร?

1) ข้อมูล time series ย้อนหลัง, 2) เวลาในการรู้เหตุผิดปกติและรับทราบ alert, 3) ลดข้อมูลผิด/false alert จาก warm-up/range/noise checks, 4) ข้อมูลสำหรับวางแผนเปลี่ยน sensor/filter, และ 5) performance ของ classifier บนชุดทดสอบที่แยกอย่างถูกต้อง

## 5. คำถาม-คำตอบ: Sensor และความแม่นยำ

### Q7: ทำไม MQ-3 ถึงแจ้ง alcohol สูงทั้งที่อากาศสะอาด?

MQ-3 เป็น MOX ที่มี cross-sensitivity และค่าขึ้นกับอุณหภูมิ ความชื้น อายุ, warm-up, ไฟเลี้ยง/ADC noise และ baseline จึงไม่ควรตีค่า ADC เดี่ยวเป็น alcohol ppm ที่เชื่อถือได้ วิธีลดปัญหาในต้นแบบคือ median sampling, range/rail check, sample spread, warm-up gate อย่างน้อย 48 ชั่วโมง และต้องผ่านหลายตัวอย่างต่อเนื่องก่อน alert

### Q8: ค่า MQ-3 ที่แสดงเป็น ppm เชื่อถือได้หรือไม่?

ไม่ควรอ้างว่าเป็น ppm ที่ traceable หากยังไม่มี calibration gas และ reference instrument; ควรเรียกว่า estimate หรือ raw/derived signal เท่านั้น โดยเฉพาะเมื่อมีไอระเหยหลายชนิดปนกัน

### Q9: ทำไมต้องมี T/RH เป็น feature?

เพราะ gas sensor โดยเฉพาะ MOX เปลี่ยนการตอบสนองตามอุณหภูมิและความชื้น หากไม่ให้โมเดลเห็น T/RH โมเดลอาจเรียนรู้ว่าความชื้นเปลี่ยนเป็นก๊าซเปลี่ยน ทำให้ false positive

### Q10: PMS5003, CCS811 และ eCO2 มีข้อจำกัดอย่างไร?

PMS5003 เป็น optical particulate sensor ที่ใช้ดูแนวโน้มฝุ่น แต่ต้องตรวจการสะสม/การไหลของอากาศและเทียบ reference ก่อนอ้างความแม่นยำ. CCS811 ให้ TVOC และ `eCO2` ซึ่งเป็นค่า estimated จาก VOC algorithm ไม่ใช่ NDIR CO2 จริง จึงไม่ใช้ `eCO2` เป็นหลักฐานการวัด CO2 เชิงกฎหมาย

### Q11: ทำไม v2 จึงเสนอ SPS30, SHT41, SCD41, SGP41 และ BME690?

SPS30 เป็น sensor PM คุณภาพสูงกว่า PMS5003, SHT41 เพิ่มความน่าเชื่อถือของ T/RH, SCD41 เป็น CO2 แบบ NDIR, และ SGP41/BME690 ให้ raw gas features เพื่อสร้าง E-Nose ที่เสถียรและประหยัดพลังงานกว่า MQ หลายตัว อย่างไรก็ตาม SGP41/BME690 ยังไม่ใช่เครื่องวัดสารเฉพาะเป็น ppm และต้อง validate เช่นเดิม

### Q12: ใช้ sensor v2 แล้วผ่านมาตรฐานโรงงานทันทีหรือไม่?

ไม่ผ่านโดยอัตโนมัติ คุณภาพ sensor ดีขึ้นไม่ได้แทนการติดตั้งที่ถูกตำแหน่ง, calibration, reference comparison, electrical safety และการเลือกจุดวัดที่ตรงกับข้อกำหนดกฎหมาย การปล่อยจากปล่องต้องวัดที่จุดและวิธีที่ข้อกำหนดระบุ

### Q13: ทำไมต้องเก็บ sensor health และ online hours?

เพื่อแยก “เหตุจากอากาศจริง” ออกจาก “เหตุจาก sensor/สาย/ไฟ/firmware” และวาง maintenance จาก drift, noise, missing values, time since calibration และ runtime แทนการรอให้เสียก่อน

### Q14: จะตรวจว่า sensor เสียได้อย่างไร?

ตรวจ missing/stale value, value นอกช่วงทางกายภาพ, ADC rail/saturation, noise spread สูงผิดปกติ, I2C/UART error, baseline drift, runtime และเปรียบเทียบกับ sensor ที่เกี่ยวข้อง. การแจ้ง fault ต้องแยกจาก alert คุณภาพอากาศ

### Q15: สัญญาณจาก sensor มี noise จะแก้อย่างไร?

ใช้ median/rolling statistics, decoupling capacitor, แยกราง 3.3V sensor ออกจากพัดลม/โหลด, ground layout ที่ถูกต้อง, I2C 100 kHz เริ่มต้น, connector ที่ล็อกได้ และทำ data quality gate ก่อนส่งเข้าโมเดล ไม่ใช่ลบข้อมูลที่ไม่ชอบหลังเห็นผล

## 6. คำถาม-คำตอบ: โมเดล AI ปัจจุบัน

### Q16: ตอนนี้ใช้ AI model อะไร?

ใช้ **Random Forest Classifier** จาก scikit-learn ทำงานเป็น pipeline `StandardScaler → RandomForestClassifier` ที่ backend. ค่าเริ่มต้นในโค้ดคือ 150 trees, `max_depth=12`, `class_weight="balanced"`, และ `random_state=42` เพื่อทำซ้ำการทดลองได้

### Q17: โมเดลรับ input อะไรบ้าง?

12 features: `temp`, `rh`, `pm25`, `tvoc`, `eco2`, `mq2`, `mq3`, `mq135`, `mq8`, `mics_co`, `no2`, `nh3` โดย train script ตัดแถวที่ feature หรือ label หายก่อน training

### Q18: โมเดลทำนายอะไร?

เป็น **multiclass classification**: ทำนาย label ของสภาวะที่ถูกกำหนดไว้ใน training session เช่น `AMBIENT`, `ALCOHOL`, `THINNER`, `ACETONE`, `IPA`, `AMMONIA` ตามที่ dataset มีจริง ไม่ใช่ regression เพื่อบอก ppm

### Q19: ทำไมเลือก Random Forest?

- เหมาะกับ tabular sensor data ขนาดเล็กถึงกลาง
- เรียนรู้ความสัมพันธ์แบบ non-linear และ interaction ระหว่าง sensor ได้ โดยไม่ต้องตั้งสมการก๊าซที่ซับซ้อน
- ไม่ไวต่อ scaling เท่าหลายโมเดล แม้ pipeline ยังใช้ StandardScaler เพื่อให้ preprocessing เป็นมาตรฐาน
- มี feature importance สำหรับอธิบายเบื้องต้นว่า feature ใดช่วยแยก class
- เทรน/inference เร็ว, reproducible, และ deploy ใน FastAPI ด้วย pickle ได้ง่าย

คำตอบที่ควรเสริม: “เราไม่ได้เลือกเพราะมันดีที่สุดเสมอ แต่เลือกเป็น baseline ที่เหมาะกับข้อมูล tabular ปริมาณปัจจุบัน จากนั้นจะเปรียบเทียบกับ Logistic Regression, SVM, Gradient Boosting/XGBoost และ MLP ภายใต้ split เดียวกันก่อนสรุป”

### Q20: ทำไมไม่ใช้ Deep Learning / MLP ตั้งแต่แรก?

ข้อมูลปัจจุบันมีเพียง 254 แถวและ 2 class ซึ่งน้อยเกินไปสำหรับกล่าวว่า neural network เหมาะกว่า MLP เพิ่มพารามิเตอร์และความเสี่ยง overfit; Random Forest จึงเป็น baseline ที่อธิบายง่ายกว่า เมื่อเก็บ data มากพอและมี temporal structure จึงค่อยทดสอบ MLP/1D-CNN/LSTM อย่างเป็นธรรม

### Q21: StandardScaler จำเป็นกับ Random Forest หรือไม่?

ไม่จำเป็นโดยหลักการ split ของ tree ไม่เปลี่ยนตาม affine scaling แต่ใส่ไว้เพื่อให้ pipeline คงรูปแบบเดียวกับโมเดลเปรียบเทียบในอนาคต และป้องกัน preprocessing หลุดจาก training/inference. ต้อง fit scaler เฉพาะ training set เสมอ ซึ่ง pipeline ทำให้ถูกต้องใน train flow ปัจจุบัน

### Q22: ทำไมใส่ `class_weight="balanced"`?

เพื่อเพิ่มน้ำหนักให้ class ที่มีจำนวนตัวอย่างน้อย ลดโอกาสที่โมเดลทายแต่ class ใหญ่แล้วได้ accuracy สูงลวง ๆ อย่างไรก็ตาม class weight ไม่ทดแทนข้อมูลของ class ส่วนน้อย ต้องเก็บ dataset ให้สมดุลตาม session ด้วย

### Q23: Feature importance หมายความว่าเป็นเหตุและผลหรือไม่?

ไม่ใช่ เป็นเพียงความสำคัญต่อการแบ่ง node ของต้นไม้ในชุดข้อมูลนั้น อาจ bias ไปที่ feature ที่มีความแปรปรวนหรือสัมพันธ์กัน จึงใช้เพื่อหาแนวทางตรวจสอบ ไม่ใช้สรุปว่า sensor นั้น “เป็นสาเหตุ” หรือ “สำคัญที่สุดในโลกจริง”

### Q24: ค่า confidence ของ Random Forest คืออะไร?

คือสัดส่วน/ความน่าจะเป็นจากต้นไม้ในโมเดลที่เลือก class นั้น ไม่เท่ากับความน่าจะเป็นเชิงกายภาพว่ามีก๊าซจริง และอาจ calibration ไม่ดี จึงต้องวัด reliability/calibration curve หรือ Brier score ก่อนใช้เป็นเกณฑ์ความปลอดภัย

### Q25: โมเดลอยู่ที่ ESP32 หรือ backend?

ปัจจุบันอยู่ที่ **backend**: FastAPI โหลดไฟล์ `voc_model.pkl` แล้วทำนายเมื่อรับ telemetry. การแปลงเป็น TFLite และส่งโมเดลไป ESP32 ผ่าน OTA เป็นแนวทางอนาคต ยังต้องออกแบบ signature, version compatibility, rollback และ validation ก่อน deploy

### Q26: ถ้า model file ไม่พบ ระบบเป็นอย่างไร?

โค้ดปัจจุบันมี mock mode ที่คืน `AMBIENT` ความมั่นใจ 85% เพื่อให้หน้า dashboard ทำงานต่อได้ นี่เหมาะกับ development เท่านั้น; สำหรับ production ต้องแสดงสถานะ “AI unavailable” ชัดเจนและห้ามให้ mock result ขับ alert หรือการตัดสินใจความปลอดภัย

## 7. คำถามที่กรรมการน่าจะถามแรง: ผลโมเดลและความน่าเชื่อถือ

### Q27: ทำไม accuracy 100% ถึงไม่น่าเชื่อถือ?

model metadata ปัจจุบันระบุ 254 แถว train 203/test 51 และ accuracy 1.00 แต่ใช้ `train_test_split(..., stratify=y, random_state=42)` แบบสุ่มแถว. การอ่านหลายครั้งใน training session เดียวกันมีความคล้ายกันสูง จึงมีโอกาสที่ข้อมูลจากเหตุการณ์เดียวกันไปอยู่ทั้ง train และ test ซึ่งเรียกว่า **data leakage** ทำให้ผลดีเกินจริง. คำตอบที่ถูกต้องคือ “ผล 100% เป็น sanity check ของ pipeline ไม่ใช่ผลวิจัยสุดท้าย”

### Q28: จะแก้ data leakage อย่างไร?

เก็บ `session_id`, `box_id`, วัน/รอบการทดลอง และแบ่งชุดทดสอบเป็นกลุ่ม ไม่ใช่สุ่มแถว:

- GroupKFold หรือ Leave-One-Group-Out โดย group = training session
- ทดสอบวัน/สัปดาห์ถัดไปที่ไม่เคยเห็นระหว่าง train
- หากมีหลายกล่อง ให้ hold out อย่างน้อยหนึ่งกล่องเพื่อวัด generalization
- fit baseline/scaler และเลือก hyperparameter จาก training folds เท่านั้น

### Q29: จะรายงาน metric อะไรนอกจาก accuracy?

รายงาน confusion matrix, precision, recall, F1-score ต่อ class, macro-F1, false-positive rate, false-negative rate, support ต่อ class และ confidence calibration. สำหรับ safety screening ต้องเน้น recall ของ class อันตรายและ false negative มากกว่า accuracy รวม

### Q30: ground truth/label ได้มาอย่างไร?

ตอนนี้ label ได้จาก training session ที่ผู้ปฏิบัติงานกำหนดบนระบบ จึงเป็น operational label ไม่ใช่ chemical reference. การทดลองระยะต่อไปต้องบันทึกสาร/ขั้นตอน/เวลา/ปริมาณ/ผู้ทำ และ co-locate กับ reference analyzer หรือ controlled reference exposure หากต้องการอ้างระดับความเข้มข้น

### Q31: ถ้าสารหลายชนิดมาพร้อมกัน โมเดล multiclass ทำอย่างไร?

multiclass แบบบังคับเลือกหนึ่ง label จะไม่เพียงพอ อาจต้องสร้าง class “mixed”, เปลี่ยนเป็น multi-label classification หรือใช้ anomaly score ร่วมกับ threshold. ก่อนทำต้องเก็บตัวอย่าง mixture ที่มี label ถูกต้อง ไม่ควรอ้างว่าโมเดลแก้ปัญหา mixture ได้หากไม่มี data

### Q32: ทำไมไม่ทำ regression เป็น ppm?

regression ต้องมี target ppm ที่เชื่อถือได้จาก reference analyzer และการสอบเทียบในสภาพควบคุม. หากใช้ label จากการหยดสาร/ความรู้สึก จะสร้างเลข ppm ที่ดูแม่นแต่ไม่จริงและอาจเสี่ยง จึงเริ่มจาก classification/monitoring ก่อน

### Q33: drift ของ sensor มีผลกับ ML อย่างไร?

distribution ของ features เปลี่ยนตามอายุ sensor, T/RH, ฝุ่นเกาะ และการเปลี่ยน sensor ทำให้ model performance ลดลง. ต้องเก็บ raw + baseline, normalize อย่างระมัดระวัง, ติดตาม drift, version sensor/firmware/model และ retrain เฉพาะเมื่อผ่าน approval จาก holdout evaluation

### Q34: ป้องกัน model overfitting อย่างไร?

เพิ่มจำนวน session อิสระ, group/time split, cross-validation, จำกัด hyperparameter, เปรียบเทียบ baseline ง่าย, ใช้ holdout set ที่ไม่แตะจนจบ, ตรวจ performance แยกตาม T/RH/วัน/กล่อง และไม่เลือก model จาก test set ซ้ำ ๆ

### Q35: ถ้าค่า input นอกช่วงที่เคย train โมเดลจะทำอย่างไร?

ต้องทำ data-quality/OOD gate: ตรวจ missing, range, warm-up, sensor fault, baseline drift และระยะห่างจาก training distribution. หากไม่ผ่าน ให้ผลเป็น “invalid/unknown” ไม่ใช่บังคับให้โมเดลทาย class พร้อมลด confidence

## 8. คำถาม-คำตอบ: การทดลองและระเบียบวิธีวิจัย

### Q36: ตัวแปรต้น ตัวแปรตาม และตัวแปรควบคุมคืออะไร?

| ประเภท | ตัวอย่าง |
|---|---|
| ตัวแปรต้น | สภาวะ/สารที่กำหนดใน session, ความเข้มข้นเมื่อมี reference, ระยะเวลาสัมผัส |
| ตัวแปรตาม | feature sensor, class prediction, accuracy/F1, false alerts, response/recovery time |
| ตัวแปรควบคุม | ตำแหน่ง sensor, ระยะห่างแหล่งสาร, volume/airflow, sampling rate, warm-up, T/RH ที่บันทึก, รุ่น sensor/firmware |

### Q37: จะเก็บ dataset อย่างไรให้มีคุณภาพ?

กำหนด protocol ก่อนเริ่ม: clean-air baseline, warm-up, ชนิดเหตุการณ์/สาร, วิธีสร้าง exposure ที่ปลอดภัย, เวลาเริ่ม-สิ้นสุด, repeat อย่างน้อยหลาย session ในวันต่างกัน, recovery period, ผู้ปฏิบัติงาน, sensor/firmware version และ reference reading ถ้ามี. ทุกแถวต้อง timestamp และ session ID

### Q38: ต้องมีตัวอย่างกี่แถว?

ไม่มีเลขตายตัว แต่ “จำนวนแถว” จากการอ่านถี่ ๆ ไม่เท่ากับ independent samples. เป้าหมายควรเป็นจำนวน **independent sessions** ต่อ class/สภาวะที่ครอบคลุมวัน, T/RH และความเข้มข้นต่างกัน แล้วทำ learning curve แสดงว่าประสิทธิภาพเริ่มคงที่หรือยัง

### Q39: ทำไมต้องแยก test set ตามวันหรือ session?

เพราะโจทย์จริงคือทำนายเหตุการณ์ใหม่ ไม่ใช่จำการอ่านใกล้กันจากเหตุการณ์เดิม การแยกตาม session/day จำลองการใช้งานจริงและป้องกัน leakage

### Q40: จะพิสูจน์ว่าลด false alert ได้อย่างไร?

กำหนดช่วงก่อน/หลังใช้ quality gate โดยใช้ protocol และช่วงเวลาที่เทียบกันได้, นับ alert ต่อชั่วโมงการทำงาน, ตรวจ log ว่า alert ใดมี fault/warm-up/out-of-range, และรายงาน false positive/false negative พร้อมนิยามที่ประกาศก่อนวิเคราะห์

### Q41: จะทดสอบ reliability ของระบบอย่างไร?

ทำ 72-hour soak test, repeated power-cycle, Wi-Fi loss/reconnect, sensor disconnect/reconnect, backend outage, database failure handling, command timeout และตรวจว่า log ไม่มี timestamp/reading duplication. รายงาน uptime, missing-frame rate, reconnect time และ error rate

### Q42: ถ้า sensor หลุดระหว่างทำงาน ระบบทำอย่างไร?

firmware/backend ต้อง mark field/status เป็น invalid/fault, ห้ามใช้แถวนั้นกับ ML/alert และแสดงให้ operator/engineer เห็นพร้อมสร้าง maintenance ticket/log. ห้ามแทนค่าที่หายด้วย 0 แล้วส่งเข้าโมเดล

## 9. คำถาม-คำตอบ: Alert, Web, Security และการใช้งานโรงงาน

### Q43: ใครรับ alert และใช้เวลาตอบสนองเท่าไร?

แนวทาง operation คือ operator รับทราบจากจอ/เว็บ, engineer ตรวจ/ปิดเหตุ, admin จัดการ role. SLA ที่ตกลงไว้คือ warning ภายใน 10 นาที และ high/critical ภายใน 5 นาที; ถ้าไม่มีการรับทราบจึงค่อย escalate ผ่าน LINE OA ซึ่งยังเป็นแผน ไม่ใช่ feature ที่เปิดใช้งานแล้ว

### Q44: ระบบเก็บว่าใครทำอะไรได้หรือไม่?

เป็น requirement สำหรับ production: audit trail ต้องเก็บ actor, role, action, เวลา, box ID, เหตุผล/หมายเหตุ และการเปลี่ยนก่อน-หลัง. Login/RBAC/audit แบบ production ยังต้องทำให้ครบก่อนเปิดใช้งานจริง

### Q45: มี role อะไรบ้าง?

Operator (ดู/acknowledge), Engineer (calibration/maintenance/verify resolution), Admin (ผู้ใช้/สิทธิ์/threshold/device), Viewer (read-only/export). เจ้าของโรงงานเหมาะกับ Viewer ที่ดูรายงานได้แต่แก้ค่าไม่ได้

### Q46: ถ้าอินเทอร์เน็ตล่ม ระบบจะทำอย่างไร?

การแจ้งบนจอท้องถิ่นและการเก็บคิว/telemetry ใน device เป็นสิ่งที่ต้องยืนยันด้วย test; backend cloud ไม่ควรเป็น single point of failure สำหรับการเตือนเฉพาะหน้า. ต้องกำหนด retention/local queue, reconnect/backoff และวิธีบอกผู้ใช้ว่า cloud offline

### Q47: OTA ปลอดภัยอย่างไร?

OTA production ต้องให้ device ดึง artifact ผ่าน HTTPS จาก endpoint ที่ยืนยันตัวตน, ตรวจ signature/hash, ตรวจ version compatibility, ใช้ partition/rollback และบันทึกผล update. “OTA จากภายนอกได้” อย่างเดียวไม่เท่ากับปลอดภัย

### Q48: ข้อมูลเก็บนานเท่าไร และ export ได้อะไร?

ความต้องการคือ retention 5 ปี และ export CSV/XLSX/PDF. ก่อนประกาศต้องกำหนด backup, retention, access control, schema migration และทดสอบ restore จริง; CSV เป็น format ที่มีอยู่/ง่ายสุด ส่วน PDF/XLSX เป็นแผนที่ต้องทดสอบ end-to-end

### Q49: ระบบช่วยตรวจว่าปล่อยอากาศเกินกฎหมายตลอดปีได้หรือไม่?

ยังไม่ทำได้จากกล่องในพื้นที่เพียงตัวเดียว การประเมินต้องทราบ pollutant ที่กฎหมายกำหนด, จุดปล่อย/ปล่อง, flow rate, เวลาการเดินระบบ, วิธีเก็บตัวอย่าง และเครื่องมืออ้างอิงตามข้อกำหนด. ระบบนี้ช่วยเป็น log/process evidence และ early warning ได้ แต่ไม่แทน stack emission monitoring

## 10. คำถาม-คำตอบ: Hardware v2 และ PCB

### Q50: ทำไมแยก sensor module ออกจาก PCB หลัก?

เพื่อเปลี่ยน sensor ได้ง่าย, วาง sensor ใกล้ทางลมและไกลความร้อนจากจอ/regulator, ลดการรื้อระบบเมื่อเสีย และทำให้ทดลองเปรียบเทียบ sensor ได้ โดย PCB หลักเป็น backplane มี power, I2C mux, connector, current monitor และ fan interface

### Q51: ทำไมใช้ JST-XH?

เพราะมี key, ราคาหาได้ง่าย และทนการถอดเสียบมากกว่า Dupont สำหรับ prototype/low-voltage. ต้องกำหนด pinout และ silkscreen ตายตัว; หากสายยาวหรือ noise สูง ต้องใช้สายบิดเกลียว/บัส differential เพราะ connector ไม่ได้แก้ signal integrity เอง

### Q52: ทำไมแยก 5V กับ 3.3V?

SPS30, จอ และพัดลมต้องใช้กำลัง 5V ขณะที่ I2C logic/sensor บางตัวใช้ 3.3V การแยกรางช่วยลด noise และป้องกันการป้อน 5V เข้า GPIO/I2C. ทั้งสองรางต้องมี fuse/protection/decoupling และวัดภายใต้โหลดจริง

### Q53: ทำไมไม่รวม AC relay/SSR ไว้บน PCB เดียว?

เพื่อลดความเสี่ยงไฟฟ้า, creepage/clearance, ความร้อน และ noise. G3MB-202P ไม่ควรสมมติว่าเหมาะกับมอเตอร์/โหลดโรงงานทุกชนิด. ภาค AC ต้องอยู่ในกล่องแยก พร้อม fuse/MCB/contactor หรือ industrial SSR ที่เลือกโดยช่างไฟตามชนิดโหลด

## 11. คำถามปิดท้ายและคำตอบที่ปลอดภัย

### Q54: จุดเด่นที่สุดของโครงงานคืออะไร?

ไม่ใช่การเคลมว่า AI แม่นยำที่สุด แต่เป็นการวางระบบครบวงจรที่ตรวจสอบได้: sensor array → data quality → web/log/maintenance → labeled dataset → evaluation → controlled deployment

### Q55: จุดอ่อนที่สุดคืออะไร?

dataset ปัจจุบันเล็ก, label ยังไม่ใช่ chemical ground truth, random split ทำให้ metric ปัจจุบัน optimistic และ hardware v2 ยังไม่ผ่าน field validation. การระบุจุดอ่อนตรงไปตรงมาเป็นส่วนหนึ่งของความน่าเชื่อถือของงานวิจัย

### Q56: ถ้ามีเวลาเพิ่ม 1 เดือน จะทำอะไรเป็นอันดับแรก?

เก็บ dataset แบบ session-based ตาม protocol พร้อม clean-air/repeated exposure ที่ปลอดภัย, เปลี่ยน evaluation เป็น group/time split, รายงาน confusion matrix/F1/false alarm rate และทำ 72-hour reliability test ก่อนเพิ่มโมเดลซับซ้อน

### Q57: ถ้ามีงบเพิ่ม จะลงทุนอะไร?

ลงทุนกับ reference instrument/การสอบเทียบและการเก็บ data คุณภาพก่อนลงทุน Deep Learning เพราะ ground truth และการทดลองที่ดีเพิ่มความน่าเชื่อถือของทุกโมเดลมากที่สุด

### Q58: จะนำไปใช้จริงได้เมื่อไร?

เมื่อผ่าน acceptance criteria ด้านไฟฟ้า/ความปลอดภัย, sensor validation, fault handling, security/RBAC/audit, reliability/soak test, backup/restore และ model evaluation บน unseen sessions. ก่อนถึงจุดนั้นให้ใช้เป็น research/pilot monitoring เท่านั้น

## 12. สิ่งที่ต้องนำไปวันสอบ

1. สไลด์จาก [RESEARCH_PROJECT_PRESENTATION_BRIEF_TH.md](RESEARCH_PROJECT_PRESENTATION_BRIEF_TH.md)
2. ภาพระบบ/กล่องจริง และ [ผัง PCB v2](../hardware/V2_PCB_PRELIMINARY_DESIGN_TH.md)
3. ภาพ dashboard, alert, calibration และ maintenance
4. CSV จริง 1 ชุด พร้อมอธิบาย column, timestamp, box ID และ label
5. ผล model metadata ปัจจุบัน พร้อมย้ำว่า baseline และอธิบาย data leakage
6. แผนทดลอง session-based, ตาราง protocol และ acceptance criteria
7. เอกสาร sensor validation และ datasheet ที่เกี่ยวข้อง
8. Demo flow: เปิดกล่อง → telemetry → dashboard → log/status → training session → prediction

## 13. ประโยคที่ไม่ควรพูด

- “accuracy 100% แปลว่าโมเดลพร้อมใช้”
- “MQ-3 วัด alcohol ppm ได้ถูกต้องตามกฎหมาย”
- “eCO2 คือค่า CO2 จริง”
- “AI แยกสารทุกชนิดได้”
- “ระบบทำ compliance ปล่องได้แล้ว”
- “OTA ปลอดภัย เพราะใช้ Wi-Fi/HTTPS” โดยไม่อธิบาย signature/rollback

## 14. แหล่งหลักฐานใน repository

- `vocs-website/ml/train_model.py` — feature, model และ training flow ปัจจุบัน
- `vocs-website/backend/model_loader.py` — inference flow และ mock-mode behavior
- `vocs-website/backend/model_meta.json` — metadata ของ model artifact ปัจจุบัน
- `docs/product/RESEARCH_PROJECT_PRESENTATION_BRIEF_TH.md` — โครงสไลด์
- `vocs-website/SENSOR_VALIDATION.md` — การตรวจข้อมูล/ข้อจำกัด sensor
- `docs/hardware/V2_PCB_PRELIMINARY_DESIGN_TH.md` — แบบสถาปัตยกรรม v2

## 15. Checklist ก่อนเริ่มตอบ

- [ ] เริ่มด้วย problem → objective → scope ไม่เริ่มด้วยรายชื่อ sensor
- [ ] แยก “ค่าที่วัด”, “ค่าที่ estimate”, “ผล AI”, “สิ่งที่ยังเป็นแผน” ทุกครั้ง
- [ ] หากถูกถาม accuracy 100% ให้ตอบเรื่อง random split/data leakage ก่อน
- [ ] หากถูกถามเรื่อง ppm/กฎหมาย ให้ตอบว่าอ้างอิงได้เมื่อมี calibration/reference ตาม protocol เท่านั้น
- [ ] หากไม่ทราบ ให้ตอบว่าจะตรวจ datasheet/ทดลองอะไร ไม่เดาตัวเลข
