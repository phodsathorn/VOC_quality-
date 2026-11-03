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
