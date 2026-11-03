# บันทึกงาน: การตั้งค่า Wi-Fi เฟิร์มแวร์ ESP32 และระบบ Captive Portal Auto-Login

- **วันที่**: 2026-11-03
- **เวลา**: 18:35 น. ICT
- **ผู้รับผิดชอบ**: Antigravity Pair Programmer
- **หัวข้อ**: Firmware Wi-Fi Credentials Provisioning & Campus Captive Portal Handler

---

## 1. ปัญหาและเหตุผล (Context & Objective)
บอร์ด ESP32 ไม่สามารถเชื่อมต่อ Wi-Fi ได้ โดย Serial Monitor ค้างอยู่ที่ขั้นตอน `[WiFi] Connecting using provisioned networks...` เนื่องจากในเครื่องยังไม่มีไฟล์กำหนดค่าการเชื่อมต่อเฉพาะเครื่อง (`secrets.h`) ทำให้ระบบดึงค่าตัวอย่างที่ไม่มีอยู่จริงมาใช้งาน นอกจากนี้ เครือข่ายของมหาวิทยาลัยนเรศวร (NU Net) เป็นระบบเปิดที่ต้องยืนยันตัวตนผ่านเว็บเพจ (Captive Portal Web Login ที่ `login6.nu.ac.th`)

## 2. สิ่งที่เปลี่ยนแปลง (Changes)
1. **การปกป้องข้อมูลลับใน Git (`.gitignore`)**:
   - ปรับปรุง `.gitignore` เพิ่มกฎ `**/secrets.h` และ `secrets.h` เพื่อป้องกันไม่ให้ข้อมูลรหัสผ่านและโทเคนของบอร์ดหลุดขึ้นสู่ Git repository
2. **สร้างไฟล์ Credential ของอุปกรณ์ (`vocs-website/firmware/voc_esp32/secrets.h`)**:
   - กำหนด SSID เป็นชื่อเครือข่ายของมหาวิทยาลัย (`@NU-WiFi`, `NU-WiFi`) แบบไม่มีรหัสผ่านชั้น Wi-Fi
   - จัดเก็บข้อมูลบัญชีผู้ใช้สำหรับยื่นยันตัวตนกับ Web Authentication Gateway
3. **ระบบ Auto-Login Captive Portal (`vocs-website/firmware/voc_esp32/voc_esp32.ino`)**:
   - เพิ่มฟังก์ชัน `performNuWebLogin()` สำหรับส่ง HTTP POST พร้อมเพย์โหลดของบัญชีไปยังเกตเวย์ `login6.nu.ac.th` อัตโนมัติทันทีที่เกาะสัญญาณ Wi-Fi สำเร็จ
   - เพิ่มรายชื่อ SSID มาตรฐานของมหาวิทยาลัยเข้าสู่ `wifiMulti` เพื่อให้ค้นหาจุดเชื่อมต่อที่ดีที่สุดโดยอัตโนมัติ

## 3. การตรวจสอบความปลอดภัย (Security Verification)
- ตรวจสอบ `git status` ยืนยันว่าไฟล์ `secrets.h` ไม่ถูกจัดเข้าสู่ Git Staging Area
- ไม่มีข้อมูลรหัสผ่านหรือโทเคนถูกบันทึกไว้ใน Git commits หรือ Logbook

## 4. สถานะและข้อแนะนำหน้างาน (Status & Operational Note)
- **สถานะ**: พร้อมสำหรับ Compile & Flash ลง ESP32
- **ข้อแนะนำ**: เครือข่าย Captive Portal มหาวิทยาลัยบางจุดอาจมีการเข้ารหัส HTTPS / CSRF Token หรือตัดเซสชันเป็นระยะ หากพบปัญหากล่องหลุดการเชื่อมต่อ แนะนำให้ใช้ **Mobile Hotspot (2.4GHz)** หรือ **Internet Sharing จากเครื่องคอมพิวเตอร์ที่ล็อกอินเน็ตไว้แล้ว** เป็นทางเลือกสำรองที่เสถียรที่สุดสำหรับอุปกรณ์ IoT


---

## รายการบันทึกต่อเนื่อง: เวลา 18:38 น. ICT — Automated 10-Hour Captive Session Keep-Alive & Reactive Re-login

### สรุป (Summary)
แก้ปัญหาเครือข่ายของมหาวิทยาลัยที่มีการตัดการเชื่อมต่อและเพิกถอนสิทธิ์ทุกๆ 10 ชั่วโมง (Captive Session Expiry / 600-min DHCP Lease timeout):
1. **Proactive Session Keep-Alive (ทุก 3 ชั่วโมง)**:
   - เพิ่มตัวนับเวลา `NU_REAUTH_INTERVAL_MS = 3 ชม.` ให้ ESP32 ส่งคำขอยืนยันตัวตนไปยังเกตเวย์ `login6.nu.ac.th` ล่วงหน้าอย่างสม่ำเสมอ เพื่อต่ออายุเซสชันโดยไม่ต้องรอให้ถูกตัด
2. **Reactive Auto-Re-login on Failure**:
   - ในฟังก์ชัน `sendData()`: ตรวจจับสัญญาณ HTTP Redirect (301, 302) หรือการส่งข้อมูลล้มเหลวติดต่อกัน 2 ครั้ง
   - หากตรวจพบว่าถูกเกตเวย์ดีดกลับหน้าล็อกอิน บอร์ดจะเรียก `performNuWebLogin()` ทันทีเพื่อกู้คืนการส่งข้อมูล
   - หากล้มเหลวเกิน 6 ครั้ง จะรีเซ็ต Wi-Fi Driver และ Re-authenticate ใหม่อัตโนมัติ ป้องกันบอร์ดค้าง

---

## รายการบันทึกต่อเนื่อง: เวลา 19:05 น. ICT — I2C Universal Auto-Detect & Wi-Fi Pre-Scan Diagnoser

### สรุป (Summary)
ตรวจสอบประวัติและรหัสต้นฉบับเปรียบเทียบระหว่างบอร์ดต้นแบบกล่องที่ 1 (`test_1st_air_quality_box.ino` / `debug_diagnostic.ino`) กับแบบวงจร `Circuit Design v2`:
1. **สาเหตุที่หา ADS1115 ไม่พบบน Bus #2 (GPIO 32/13)**:
   - บอร์ดจริงของเครื่องต้นแบบเดิม ต่อทั้ง **ADS1115 (0x48)** และ **CCS811 (0x5A)** อยู่บนบัสเดียวกัน คือ **GPIO 21 (SDA) และ GPIO 22 (SCL)**
   - แต่โค้ด `voc_esp32.ino` ถูกแยกบัสตามเอกสาร v2 ไปที่ GPIO 32/13 ทำให้เมื่อรันบนฮาร์ดแวร์จริง จึงขึ้นข้อผิดพลาดหา ADS1115 ไม่พบบน Bus #2
   - **การแก้ไข**: เพิ่มระบบ **Universal I2C Auto-Detect** โดยสแกนหาอุปกรณ์บน Bus #1 (GPIO 21/22) ก่อน หากพบที่ 0x48 จะผูกกับ `Wire` ทันที แต่ถ้าไม่พบจึงจะสลับไปสแกน Bus #2 (GPIO 32/13) ทำให้รองรับฮาร์ดแวร์ทั้ง 2 รุ่นโดยอัตโนมัติ
2. **สาเหตุที่หา CCS811 ไม่เจอ**:
   - แอดเดรสจริงของโมดูลในกล่องเดิมคือ **`0x5A`** แต่ในโค้ดตั้งต้นเป็น `0x5B`
   - ระบบสแกนเนอร์ใหม่จะดึงแอดเดรสที่ตอบกลับมาใช้งานทันที (รองรับทั้ง 0x5A และ 0x5B) และพิมพ์แสดงผลชัดเจนว่าตรวจพบที่ Address ใด
3. **สาเหตุและแนวทางแก้ไข Wi-Fi เชื่อมต่อไม่ได้**:
   - เพิ่มตัวสแกนเครือข่ายก่อนเชื่อมต่อ (`WiFi.scanNetworks()`) แสดงชื่อ SSID, ความแรงสัญญาณ (dBm) และสถานะ OPEN/Secured ออกทาง Serial Monitor
   - สำหรับ Open Wi-Fi (เช่น `@NU-WiFi`) ให้เรียกคำสั่ง `WiFi.begin(ssid)` โดยตรงโดยไม่ส่ง Passphrase ว่าง ซึ่งเคยทำให้ ESP32 ค้าง

---

## รายการบันทึกต่อเนื่อง: เวลา 19:15 น. ICT — Exhaustive Multi-Pin I2C Probing & Robot Club Router AP Migration

### สรุป (Summary)
1. **Wi-Fi Credential Migration**:
   - ปรับการเชื่อมต่อ Wi-Fi หลักไปใช้เราท์เตอร์ประจำห้อง `robot_club` (รหัสผ่าน `robot123`) เพื่อลดปัญหาการติด Captive Portal ของเครือข่ายกลางมหาวิทยาลัย
   - คง `@NU-WiFi` ไว้เป็นระบบสำรอง
2. **Exhaustive Multi-Pin I2C Probing Engine**:
   - เนื่องจากบอร์ดจริงอาจมีการสลับคู่ขา I2C ที่แตกต่างกันไป จึงเพิ่มระบบสแกนทดสอบทุกคู่ขาที่เป็นไปได้ใน ESP32:
     - คู่ที่ 1: `SDA: 21, SCL: 22` (Standard Bus)
     - คู่ที่ 2: `SDA: 32, SCL: 13` (Circuit v2 Bus #2)
     - คู่ที่ 3: `SDA: 18, SCL: 19` (Legacy Alt Bus)
     - คู่ที่ 4: `SDA: 25, SCL: 26` (Alt Header)
     - คู่ที่ 5: `SDA: 4,  SCL: 15` (Dev Header)
   - วนสแกนทุกคู่ขาและทุก Address (0x08 - 0x77): หากตรวจพบ `ADS1115 (0x48)` หรือ `CCS811 (0x5A/0x5B)` ที่คู่ขาใด ระบบจะ Lock-in และจดจำขานั้นไว้ใช้งานตลอดการทำงานทันที
   - ป้องกันอาการ Crash เมื่อไม่พบ ADS1115 โดยกำหนดค่าแอนะล็อกเริ่มต้นเป็น 0 แทนการสั่งอ่าน I2C
