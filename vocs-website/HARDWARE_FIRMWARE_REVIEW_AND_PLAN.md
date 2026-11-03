# รีวิวและแผนดำเนินงาน — Hardware / Firmware

**ขอบเขต:** ESP32, sensor array, วงจรไฟฟ้า/ไฟเลี้ยง, การติดตั้ง, ความถูกต้องของการวัด, device cybersecurity, sensor calibration, touch display และ firmware reliability  
**ไม่อยู่ในขอบเขต:** การจัดการผู้ใช้, สิทธิ์ RBAC, และ UI หน้าเว็บ — ให้ดูที่ [WEB_BACKEND_REVIEW_AND_PLAN.md](WEB_BACKEND_REVIEW_AND_PLAN.md)

---

## 1. สถานะปัจจุบันและการทบทวนสถาปัตยกรรม (Current Status & Architecture)

ระบบฮาร์ดแวร์และเฟิร์มแวร์ปัจจุบันได้รับการพัฒนาและจัดทำโครงสร้างบนสถาปัตยกรรม **Circuit Design v2** รองรับการทำงานในสภาพแวดล้อมโรงงานพ่นสี (Powder Coating / Paint Shop) พร้อมทั้งติดตั้งเกราะป้องกันทางดิจิทัลและเฟิร์มแวร์ (Defense-in-depth):

### ตารางสถานะงาน (Implementation Status Matrix)

> [!NOTE]
> สถานะงานอ้างอิงตามเกณฑ์การตรวจสอบ [2026-11-03_plan-implementation-review-th.md](../docs/reviews/2026-11-03_plan-implementation-review-th.md) โดยแยกแยะระหว่างสิ่งที่เขียนลงใน Source Code กับสิ่งที่ต้องได้รับการทดสอบและยืนยันด้วยฮาร์ดแวร์/สภาพแวดล้อมจริง

| หมวดงาน | หัวข้อย่อย | สถานะ | รายละเอียดที่ทำแล้ว |
| :--- | :--- | :---: | :--- |
| **H0: Security & Electrical** | การแยก Credential ออกจากโค้ด | 🔄 **Implemented in source** | แยก Wi-Fi & OTA secrets ไว้ใน `secrets.h` พร้อม template `secrets.example.h` ไม่หลุดขึ้น Git (รอทดสอบตั้งค่าจริงบนเครื่อง) |
| | Web OTA Access Control | 🔄 **Implemented in source** | ป้องกันหน้า Web OTA `/update` ด้วย Basic Authentication และรหัสผ่านป้องกันใน ArduinoOTA |
| | Cloud Pull OTA & Digital Signature | 🔄 **Implemented in source** | มีโค้ดตรวจ SHA-256 Checksum, HMAC Signature และ Rollback (รอทดสอบแฟลชจริงบนอุปกรณ์) |
| | การป้องกันไฟเกิน ADC ESP32 | ⏳ **Blocked by hardware test** | ต้องใช้ Voltage Divider สำหรับสัญญาณ Analog จากเซนเซอร์ MQ เพื่อไม่ให้เกิน 3.3V (ต้องวัดด้วย Multimeter จริง) |
| **H1: Sensor Protocol** | MQ-3 Conditioning & Pre-heat | 🔄 **Implemented in source** | ระบบ 48-Hour Pre-heat Gate (`mq3_ready`) และ Median Spread Filter (< 150 ADC count) (รอทดสอบในโรงงานจริง) |
| | CCS811 Environmental Compensation | 🔄 **Implemented in source** | ชดเชย T/RH ทุก 60 วินาที พร้อมฟิลเตอร์กรอง I2C Glitch Error Frames (64319, 39064) |
| | MiCS-6814 Dual-Bus Isolation | 🔄 **Implemented in source** | แยก ADS1115 (16-bit ADC) ไปอยู่บน I2C Bus #2 ป้องกันบัสชนกับ CCS811 |
| | Clean Air Baseline Capture | 🔄 **Implemented in source** | รองรับคำสั่ง Capture Baseline จาก Web UI แบบ Non-blocking ผ่าน API (รอทดสอบขั้นตอนในสภาพอากาศสะอาดจริง) |
| **H2: Reliability & Telemetry**| Monotonic Uptime Tracking | 🔄 **Implemented in source** | ส่ง `device_uptime_sec` คำนวณชั่วโมงทำงานเซนเซอร์จริง ป้องกันการรีเซ็ตหลอก |
| | Packet Sequence & Diagnostics | 🔄 **Implemented in source** | ส่ง `seq_no`, `wifi_rssi`, `free_heap_kb`, และ `reset_reason` พร้อมบันทึกลง Database |
| | ADC 12-bit & Attenuation Lock | 🔄 **Implemented in source** | ล็อก `analogReadResolution(12)` และ `analogSetAttenuation(ADC_11db)` ในเฟิร์มแวร์ |
| | Dual WiFi Network Failover | 🔄 **Implemented in source** | ใช้ `WiFiMulti` สลับระหว่างเน็ตโรงงานและฮอตสปอตอัตโนมัติ (รอทดสอบเครือข่ายหลุดจำลอง) |
| **H3: Statutory Boundary** | ขอบเขตการตรวจปล่อยมลพิษ | 🔄 **Implemented in source** | กำหนดขอบเขต E-Nose เป็น Indoor Safety และแยกรายงานมลพิษปล่อง (Stack CEMS/Lab) ออกชัดเจน |

---

## 2. ตาราง Pinout และการจัดสรรบัสสัญญาณ (Hardware Pinout Specification)

ตามแบบแผน **Circuit Design v2**:

```
                              ┌───────────────────┐
                              │    ESP32 DEVKIT   │
                              │                   │
         [DHT22 Data] ────────┤ GPIO 27           │
                              │                   │
   [I2C Bus #1 - CCS811] ─────┤ GPIO 21 (SDA)     │
                              │ GPIO 22 (SCL)     │
                              │                   │
  [I2C Bus #2 - ADS1115] ─────┤ GPIO 32 (SDA)     │ (สำหรับ MiCS-6814: CO, NO2, NH3)
                              │ GPIO 13 (SCL)     │
                              │                   │
      [UART2 - PMS5003] ──────┤ GPIO 16 (RX)      │
                              │ GPIO 17 (TX)      │
                              │ GPIO 23 (SET)     │
                              │                   │
      [Analog MQ Sensors] ────┤ GPIO 33 (MQ-2)    │ (ผ่าน Voltage Divider ให้แรงดัน ≤ 3.3V)
                              │ GPIO 36 (MQ-3)    │
                              │ GPIO 34 (MQ-8)    │
                              │ GPIO 39 (MQ-135)  │
                              │                   │
     [Airflow Fan Relays] ────┤ GPIO 25 (Intake)  │
                              │ GPIO 26 (Exhaust) │
                              └───────────────────┘
```

> [!IMPORTANT]
> **การใช้ ADC1 ของ ESP32:** ขา GPIO 33, 34, 36 (VP), 39 (VN) อยู่บน ADC1 ภายในตัวชิป จึงสามารถอ่านค่าสัญญาณแอนะล็อกได้อย่างแม่นยำและไม่ถูกขัดจังหวะจากการทำงานของสัญญาณวิทยุ Wi-Fi (ซึ่งจะกระทบเฉพาะขา ADC2)

---

## 3. รายละเอียดแผนงานราย Phase (H0 — H3)

### Phase H0 — Electrical, Physical และ Cybersecurity Gate

1. **การจัดการพลังงานและไฟเลี้ยงขดลวดความร้อน (MOS Heater Power Budget)**:
   - เซนเซอร์ตระกูล MQ (MQ-2, MQ-3, MQ-8, MQ-135) มีขดลวดความร้อนภายในที่ใช้กระแสตัวละประมาณ 150–200 mA ที่ 5.0V
   - รวมกับ MiCS-6814, พัดลมระบายอากาศ 2 ตัว, และ ESP32 $\rightarrow$ **ต้องการแหล่งจ่ายไฟ 5V DC ไม่น้อยกว่า 2.5A – 3.0A**
   - แหล่งจ่ายไฟต้องติดตั้ง Fuse ป้องกันไฟเกิน และต่อสายดิน (Chassis Earth Ground) ของ Enclosure โลหะเพื่อป้องกันสัญญาณรบกวนในโรงงาน
2. **การป้องกันแรงดันเกิน ADC (Voltage Clamping & Attenuation)**:
   - วงจรเปรียบเทียบหรือสัญญาณ Analog เอาต์พุตของบอร์ดโมดูล MQ บางรุ่นใช้ไฟ 5V $\rightarrow$ ต้องต่อผ่านวงจรแบ่งแรงดัน (Resistor Voltage Divider เช่น $10\text{k}\Omega / 20\text{k}\Omega$) เพื่อจำกัดแรงดันเข้าขา ESP32 ไม่เกิน 3.3V
   - เฟิร์มแวร์กำหนด `analogSetAttenuation(ADC_11db)` เพื่อขยายช่วงการวัดของ ADC ให้รองรับ $0 - 3.3\text{V}$ เต็มสเกล
3. **การแยกความปลอดภัยของ Credential & Dual OTA Architecture**:
   - บัญชี Wi-Fi และรหัสผ่าน Web OTA ถูกย้ายออกจาก Git เข้าสู่ `secrets.h`
   - ระบบ Web OTA หน้าเว็บภายในวง LAN (`http://airmon.local/update`) บังคับใช้ **HTTP Basic Authentication**
   - ระบบ Cloud OTA ผ่านเว็บหลักใช้งาน **Outbound Pull-only Model**: ESP32 เป็นฝ่ายติดต่อขอตรวจสอบอัปเดตจาก Cloud HTTPS พร้อมตรวจสอบ SHA-256 Checksum และ HMAC Digital Signature ก่อนทำการ Flash เสมอ ป้องกันการถูกโจมตีแบบ Man-in-the-Middle

---

### Phase H1 — Protocol ความถูกต้องราย Sensor

1. **MQ-3 Alcohol & Solvent Conditioning Protocol**:
   - Datasheet ของ MQ-3 กำหนดว่าต้องอุ่นเครื่อง (Pre-heat) ติดต่อกันอย่างน้อย **48 ชั่วโมง** ก่อนที่ค่าความต้านทาน $R_0$ จะเสถียร
   - เฟิร์มแวร์มีตัวแปร `MQ3_PREHEAT_TIME_MS` และส่งแฟล็ก `mq3_ready` ไปยัง Backend
   - หากยังไม่ครบ 48 ชั่วโมง Backend จะไม่นำค่า MQ-3 ไปประมวลผลเป็น Alcohol Alert เพื่อป้องกัน False Alarm
   - ใช้อัลกอริทึม **Median Sampling 9 ค่า** (`readMedianAdc`) และคำนวณค่า Spread: หากสัญญาณกวัดแกว่งเกิน 150 ADC count ระบบจะระบุว่ามีคลื่นรบกวน (Noisy Frame) และไม่นำไปใช้ตัดสินใจ
2. **CCS811 TVOC/eCO2 Environmental Compensation**:
   - CCS811 ไวต่ออุณหภูมิและความชื้นสูง $\rightarrow$ เฟิร์มแวร์ดึงค่าอุณหภูมิและความชื้นจริงจาก DHT22 ส่งเข้าไปชดเชยผ่านคำสั่ง `ccs.setEnvironmentalData()` ทุกๆ 60 วินาที
   - ติดตั้ง I2C Glitch Filter: ตัดเฟรมผิดพลาดของบัส I2C (เช่น $64319, 39064$) ที่หลุดมาจากชิปไม่ให้ส่งไปยังโมเดล AI
3. **MiCS-6814 ผ่าน ADS1115 16-bit Precision ADC**:
   - แยก ADS1115 ออกมาอยู่บนบัส I2C Bus #2 (GPIO 32, 13) แยกเด็ดขาดจากบัสหลัก เพื่อป้องกันปัญหา CCS811 ดึงสายสัญญาณ SDA ค้างตอนเริ่มต้นทำงาน
   - ตรวจวัด 3 ก๊าซเป้าหมาย: คาร์บอนมอนอกไซด์ (CO), ไนโตรเจนไดออกไซด์ (NO2), และแอมโมเนีย (NH3) ในหน่วยมิลลิโวลต์ (mV)
4. **PMS5003 Laser Dust Sensor Protocol**:
   - อ่านข้อมูลผ่านฮาร์ดแวร์ UART2 พร้อม Pin SET (GPIO 23) สำหรับสั่งเปิด-ปิดเซนเซอร์เพื่อยืดอายุการใช้งาน Laser Diode
   - พัดลมเป่าเข้า (Intake) และพัดลมดูดออก (Exhaust) ทำงานต่อเนื่องเพื่อสร้าง Laminar Airflow ผ่านห้องตรวจวัดอย่างสม่ำเสมอ
5. **Clean Air Baseline Capture Protocol**:
   - ไม่ใช้วิธีรีเซ็ตศูนย์อัตโนมัติ (Forced Zeroing)
   - ผู้ใช้งานต้องนำกล่องเซนเซอร์ไปไว้ในที่อากาศบริสุทธิ์ (Clean Air) แล้วกดปุ่มสั่ง **Capture Baseline** จากหน้า Dashboard หรือ Kiosk เท่านั้น

---

### Phase H2 — Firmware Reliability และ Data Integrity

1. **Monotonic Telemetry Tracking**:
   - ส่ง `device_uptime_sec` ที่นับเวลาต่อเนื่องภายใน ESP32 ในทุก Payload ช่วยให้ Backend คำนวณอายุการใช้งานเซนเซอร์ (`sensor_runtime`) ได้ถูกต้อง แม้ Server จะมี Network Latency
2. **Sequence Numbering & Reset Diagnostics**:
   - ทุกแพ็กเก็ตส่ง `seq_no` ที่นับเพิ่มทีละ 1 ช่วยให้ตรวจจับ Packet Loss ทางสถิติได้
   - ส่ง `reset_reason` (เช่น `POWERON`, `BROWNOUT`, `SW_RESTART`, `CRASH_PANIC`, `WDT_TASK`) ช่วยให้ทีมวิศวกรวินิจฉัยปัญหาไฟกระชากหรือไฟตกในโรงงานได้ทันที
   - ส่ง `free_heap_kb` และ `wifi_rssi` เพื่อตรวจจับ Memory Leak และความแรงของสัญญาณ Wi-Fi ในจุดติดตั้ง
3. **Command Queue & Baseline Acknowledgment**:
   - ระบบรองรับคำสั่งระยะไกล (เช่น การสั่ง Capture Baseline) ผ่าน Polling Loop ที่ทำงานแบบ Non-blocking
   - ส่งรายงานผลการ Calibration กลับไปพร้อม `calibration_id` เดิม เพื่อให้มั่นใจในหลักการ Idempotency

---

### Phase H3 — ขอบเขตการตรวจปล่อยมลพิษตามกฎหมาย (Statutory Boundary)

> [!CAUTION]
> **ข้อกำหนดทางกฎหมายที่ต้องระบุให้ชัดเจน:**
> 1. อุปกรณ์ตรวจวัดก๊าซแบบ E-Nose เป็นอุปกรณ์ตรวจวัดสภาพแวดล้อมเพื่อ **ความปลอดภัยและเตือนภัยล่วงหน้าภายในพื้นที่ปฏิบัติงาน (Indoor Safety & Early Warning Monitoring)** เท่านั้น
> 2. **ห้ามนำผลการวัดหรือการประมาณการจากเซนเซอร์ E-Nose ไปใช้รายงานการปล่อยมลพิษจากปล่องระบายอากาศ (Exhaust Stacks) ต่อกรมโรงงานอุตสาหกรรม หรือนิคมอุตสาหกรรม**
> 3. การรายงานมลพิษประจำปีตามกฎหมาย (Statutory Yearly Emission Compliance) ต้องใช้ผลการตรวจวัดจากระบบ **Continuous Emission Monitoring System (CEMS)** ที่ติดตั้งถาวรที่ปล่อง หรือผลการเก็บตัวอย่างและวิเคราะห์จาก **ห้องปฏิบัติการที่ได้รับการรับรองมาตรฐาน ISO/IEC 17025** เท่านั้น

---

## 4. Checklist การตรวจสอบความพร้อมก่อน Factory Pilot (Pre-pilot Validation Checklist)

ก่อนนำกล่องเซนเซอร์ไปติดตั้งจริงในโรงงานพ่นสี ให้ตรวจสอบตามรายการต่อไปนี้:

- [x] **Firmware Secrets Template**: แยก Wi-Fi password และ OTA credentials ออกจาก Git repository โดยใช้ `secrets.h`
- [x] **Web OTA Authentication in Code**: เพิ่มระบบ Basic Authentication ในหน้า `/update` และรหัสผ่านใน ArduinoOTA
- [ ] **Cloud OTA & Rollback Field Test**: ต้องทดสอบสั่งอัปเดตและสั่ง Rollback เฟิร์มแวร์ผ่าน Cloud Backend จริงกับกล่อง ESP32
- [ ] **ADC Safety Range Measurement**: ต้องตรวจสอบด้วยมัลติมิเตอร์จริงว่าแรงดัน Analog เข้าขา GPIO 33, 34, 36, 39 ไม่เกิน 3.3V ในทุกสภาวะ
- [ ] **Power Rail Soak Test**: เสียบปลั๊กเปิดเครื่องทิ้งไว้ 72 ชั่วโมง ตรวจสอบว่าไม่มีอาการ Brownout Reset หรือความร้อนสะสมใน Enclosure เกิน $55^\circ\text{C}$
- [ ] **MQ-3 Pre-heat Burn-in**: บันทึก Log ติดต่อกัน 48 ชั่วโมง และยืนยันว่าสถานะ `mq3_ready` เปลี่ยนเป็น `true`
- [ ] **Airflow Ingress & Filter**: ติดตั้งตาข่ายกันฝุ่น/ฟิลเตอร์กรองฝุ่นหยาบที่ทางลมเข้า เพื่อป้องกันละอองสีอุดตันผิวหน้าเซนเซอร์ MOS
- [ ] **Physical Enclosure Grounding**: ต่อสายกราวด์ของโครงตู้โลหะเข้ากับระบบกราวด์โรงงานเพื่อลดสัญญาณรบกวนและป้องกันอันตรายจากไฟฟ้าสถิต

---

## เอกสารอ้างอิง
- [คู่มือสเปกเซนเซอร์และการทดสอบ (SENSOR_VALIDATION.md)](SENSOR_VALIDATION.md)
- [รีวิวและแผนระบบ Web/Backend (WEB_BACKEND_REVIEW_AND_PLAN.md)](WEB_BACKEND_REVIEW_AND_PLAN.md)
- [แผนภาพรวมทั้งโครงการ (PROJECT_REVIEW_AND_PLAN.md)](PROJECT_REVIEW_AND_PLAN.md)
