# 📚 สรุปงานวิจัยอ้างอิง (Literature Review References)
เอกสารนี้รวบรวมและแปลงข้อมูลจาก PDF งานวิจัยทั้ง 3 ฉบับ เพื่อใช้เป็นข้อมูลอ้างอิงหลัก (Reference) สำหรับการเขียนรูปเล่มโปรเจคจบ (บทที่ 2: ทฤษฎีและงานวิจัยที่เกี่ยวข้อง และ บทที่ 3: วิธีดำเนินการ)

---

## 📄 เอกสารที่ 1: Classification and Concentration Prediction of VOC Gases Based on Sensor Array with Machine Learning Algorithms
**งานประชุม:** 15th Annual IEEE International Conference on Nano/Micro Engineered and Molecular Systems (NEMS 2020)
**ผู้แต่ง:** Yingming Liu, et al.

### 🎯 วัตถุประสงค์ (Abstract & Intro)
เสนอวิธีการตรวจสอบความสดของเนื้อสัตว์และผลไม้ โดยใช้ **Gas Sensor Array ร่วมกับ Machine Learning**
- ใช้เซนเซอร์แบบ Metal Oxide Semiconductor (MOS) เชิงพาณิชย์ 4 ตัว
- ตรวจจับก๊าซ VOC 3 ชนิด: เอทานอล (Ethanol), ไตรเมทิลามีน (TMA), และแอมโมเนีย (Ammonia)

### 🛠 วิธีการและระบบ (Method and System)
1. **Sensor Array:** ใช้เซนเซอร์ 4 ตัว ได้แก่ **MQ-3B, MQ-136, MQ-137, และ MQ-4B**
2. **Gas Classification (การแยกแยะชนิดก๊าซ):**
   - ใช้ **BPNN (Back-Propagation Neural Network)**
   - โครงสร้าง: 4 Input (ค่าเซนเซอร์ 4 ตัว), 10 Hidden Neurons, 3 Output (ความน่าจะเป็นของก๊าซแต่ละชนิด)
3. **Gas Concentration Prediction (การทำนายความเข้มข้น):**
   - นำข้อมูลจาก Training set เดียวกันมาทดสอบ 4 โมเดล:
     1. BPNN
     2. RBFNN (Radial Basis Function Neural Network)
     3. SVM (Support Vector Machine) - ใช้ Polynomial kernel
     4. LDA-SVM (ใช้ Linear Discriminant Analysis ลดมิติข้อมูลก่อนเข้า SVM)

### 📊 ผลการทดลอง (Results & Conclusion)
- **การแยกแยะก๊าซ:** BPNN ทำความแม่นยำ (Accuracy) เฉลี่ยได้สูงถึง **98.8%**
- **การทำนายความเข้มข้น:** 
  - **RBFNN** ทำผลงานได้ดีที่สุดสำหรับเอทานอลและแอมโมเนีย (Relative Error < 5% และ 6.5%)
  - สำหรับ TMA, RBFNN มี Error 4.41% ดีกว่า SVM (5.11%)
- **สรุป:** การผสมผสาน BPNN (จำแนกชนิด) และ RBFNN (ทำนายความเข้มข้น) เพียงพอต่อการใช้งานจริง

---

## 📄 เอกสารที่ 2: Hybrid Gas Sensor Array to Identify and Quantify Low-Concentration VOCs Mixtures Commonly Found in Chemical Industrial Parks
**วารสาร:** IEEE SENSORS JOURNAL (2022)
**ผู้แต่ง:** Linjie Xu, et al.

### 🎯 วัตถุประสงค์ (Abstract & Intro)
พัฒนาระบบตรวจวัด VOC ความเข้มข้นต่ำในนิคมอุตสาหกรรมเคมี ซึ่งมีความหลากหลายและตรวจวัดยาก โดยใช้เซนเซอร์แบบผสม (Hybrid Sensor Array) เนื่องจาก VOC เป็นสาเหตุของโอโซนและมลพิษทางอากาศ

### 🛠 วิธีการและระบบ (Method and System)
1. **Hybrid Sensor Array (6 ตัว):** 
   - 4 MOS Sensors (เซนเซอร์กึ่งตัวนำ)
   - 1 EC Sensor (เซนเซอร์ไฟฟ้าเคมี - 4ETO)
   - 1 PID (Photo Ionization Detector - PID-A1)
2. **ก๊าซเป้าหมาย (≤ 5 ppm):** Toluene (PhMe), Dichloromethane (DCM), Ethyl Acetate (EA) และสารผสม
3. **Feature Extraction (การลดมิติข้อมูล):**
   - ทดสอบเปรียบเทียบระหว่าง **PCA (Principal Component Analysis)** และ **LDA**
   - พบว่า **PCA เหมาะสมกว่า** โดย PC1 และ PC2 สามารถอธิบาย Variance ของข้อมูลได้ถึง 92.3%
4. **Machine Learning:**
   - ทดสอบ **SVM (Support Vector Machine)** และ **BP-ANN (Back-Propagation Artificial Neural Network)**

### 📊 ผลการทดลอง (Results & Conclusion)
- **การเตรียมข้อมูล (Preprocessing):** ใช้การหักลบค่า Baseline (Baseline Subtraction)
- **ความแม่นยำ:** โมเดล SS-SVM (Steady-State SVM) และ SS-ANN ให้ผลดีที่สุด
- Accuracy อยู่ที่ประมาณ **94%** และค่า R² สำหรับการทำนายความเข้มข้นสูงถึง **0.95**
- **สรุป:** Hybrid Sensor Array ร่วมกับ SVM หรือ ANN มีประสิทธิภาพสูงเพียงพอสำหรับการตรวจวัด VOC ความเข้มข้นต่ำแบบ Online Monitoring ในอุตสาหกรรมราคาถูก

---

## 📄 เอกสารที่ 3: IoT Based Industrial Air Quality Monitoring System
**งานประชุม:** 2022 Second International Conference on Computer Science, Engineering and Applications (ICCSEA)
**ผู้แต่ง:** Souptik Das, et al.

### 🎯 วัตถุประสงค์ (Abstract & Intro)
สร้างอุปกรณ์ IoT สำหรับตรวจสอบคุณภาพอากาศในโรงงานอุตสาหกรรมแบบ Real-time โดยสามารถส่งข้อมูลขึ้น Cloud และแจ้งเตือนผ่านสมาร์ทโฟนได้ เพื่อลดผลกระทบด้านสุขภาพจากมลพิษ

### 🛠 วิธีการและระบบ (Hardware & IoT Design)
1. **เซนเซอร์:** ใช้ **MQ-135** เป็นหลักในการตรวจจับ CO₂, แอมโมเนีย (NH₃), แอลกอฮอล์, และควัน
2. **บอร์ดควบคุม:** ใช้ **Node MCU ESP8266** (มี Wi-Fi ในตัว)
3. **IoT Platform:** ใช้ **Blynk** สำหรับสร้าง User Interface บนมือถือ เพื่อดูค่า AQI (Air Quality Index) ในหน่วย ppm แบบ Real-time
4. **นวัตกรรมเพิ่มเติม (Remote Controlled Robot):**
   - ติดตั้งอุปกรณ์วัดอากาศบน **หุ่นยนต์บังคับวิทยุ** (ใช้มอเตอร์, L298N, โมดูล RF 433 MHz)
   - เพื่อให้สามารถส่งหุ่นยนต์เข้าไปวัดค่าในพื้นที่อันตราย (Hazardous areas) โดยที่คนไม่ต้องเข้าไปเสี่ยง

### 📊 มาตรฐานและการตัดสินใจ (Air Quality Parameters)
ใช้เกณฑ์อ้างอิงปริมาณ CO₂ ในการเตือน:
- **<400 ppm:** ปกติ (Normal)
- **400-2000 ppm:** เริ่มมีอาการปวดหัว (Warning)
- **>2000 ppm:** ส่งผลเสียต่อสุขภาพ (Hazardous)
- หากค่าสูงเกินเกณฑ์ ระบบจะสั่งให้ LED สีแดงกระพริบเตือน

### 📊 ผลการทดลอง (Conclusion)
ระบบสามารถอ่านค่าจาก MQ-135 ส่งข้อมูลขึ้น Blynk ได้อย่างเสถียร จุดเด่นคือโครงสร้างระบบที่เรียบง่าย ปรับแก้โค้ดและ Threshold ได้ง่าย และมีความปลอดภัยสูงจากการใช้หุ่นยนต์บังคับวิทยุ

---

## 💡 แนวทางการนำไปประยุกต์ใช้กับโปรเจคของคุณ
1. **จาก Paper 1 & 2:** การใช้ Sensor หลายตัว (MQ Series) เรียกว่า Sensor Array การทำ ML ต้องมีขั้นตอน **Baseline subtraction (หักลบค่าเริ่มต้นในอากาศสะอาด)** และการลดมิติข้อมูลแบบ **PCA** จะช่วยให้โมเดล (เช่น MLP/ANN) ทำงานได้ดีขึ้น
2. **จาก Paper 2:** การใช้เทคนิค **Hybrid / Multiple Sensors** ช่วยให้จำแนกสารระเหยง่าย (VOCs) ที่ซับซ้อน เช่น ทินเนอร์ ได้แม่นยำกว่าการใช้เซนเซอร์ตัวเดียว
3. **จาก Paper 3:** โครงสร้างระบบ IoT ของคุณสามารถใช้ **ESP32** แทน ESP8266 ได้เลย และใช้แนวคิดการเทียบ Threshold (แต่เปลี่ยนจาก CO₂ เป็นมาตรฐาน กรมควบคุมมลพิษ) เพื่อสั่งงานแจ้งเตือนหรือสั่งปิด Damper (พัดลมดูดอากาศ)
