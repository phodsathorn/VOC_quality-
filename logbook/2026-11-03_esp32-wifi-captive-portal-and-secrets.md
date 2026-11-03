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
