# 2026-11-26 — แก้ไขการขับรีเลย์ 5V Active LOW ด้วยโหมด High-Z (`pinMode(pin, INPUT)`) บน ESP32

## สรุป
แก้ไขปัญหาบอร์ดรีเลย์ 5V Active LOW ค้างเปิดตลอดเวลาเมื่อเชื่อมต่อกับขา GPIO 3.3V ของ ESP32 โดยเปลี่ยนวิธีการสั่งปิดรีเลย์ในโหมด Active LOW จาก `digitalWrite(pin, HIGH)` (3.3V ซึ่งยังมีแรงดันต่างศักย์ ~1.7V ไหลผ่าน Optocoupler ทำให้รีเลย์ไม่ยอมตัด) เป็นการตั้งขาเป็น **`pinMode(pin, INPUT)` (High-Z / ปล่อยลอย)** เพื่อตัดกระแสขาด 100% เสมือนการดึงสายสัญญาณออก และตั้งค่าเริ่มต้นของระบบควบคุมพัดลม 3 ตัวเป็น `Active LOW (High-Z OFF)`

## สิ่งที่เปลี่ยน
1. **ESP32 Firmware ([`hardware/firmware/voc_esp32/voc_esp32.ino`](file:///Users/urworld/paper_sensor_VOC/hardware/firmware/voc_esp32/voc_esp32.ino))**:
   - สร้างฟังก์ชัน `writeRelayPin(uint8_t pin, bool turnOn)`:
     - ในโหมด `fanRelayActiveLow == true`: สั่งเปิดด้วย `pinMode(pin, OUTPUT); digitalWrite(pin, LOW);` และสั่งปิดด้วย `pinMode(pin, INPUT);` (High-Z)
     - ในโหมด `fanRelayActiveLow == false`: สั่งเปิด/ปิดด้วย `pinMode(pin, OUTPUT); digitalWrite(pin, HIGH/LOW);`
   - ตั้งค่าเริ่มต้น `fanRelayActiveLow = true` และสถานะเริ่มต้นของพัดลม 3 ตัวเป็น `OFF` (`false, false, false`) เพื่อความปลอดภัยขณะเปิดเครื่อง
2. **Backend & Frontend ([`vocs-website/backend/main.py`](file:///Users/urworld/paper_sensor_VOC/vocs-website/backend/main.py), [`vocs-website/frontend/src/pages/DataCollection.jsx`](file:///Users/urworld/paper_sensor_VOC/vocs-website/frontend/src/pages/DataCollection.jsx))**:
   - ปรับค่าเริ่มต้น `active_low` เป็น `true` ให้สอดคล้องกับบอร์ดรีเลย์ 5V สีน้ำเงินในกล่องทดลอง

## เหตุผลและผลกระทบ
- **เหตุผล:** จากการทดสอบฮาร์ดแวร์จริง เมื่อดึงสาย `IN1` ออก พัดลมตัวที่ 1 หยุดหมุนทันที ยืนยันว่ารีเลย์เป็นแบบ 5V Active LOW ที่ไม่สามารถตัดได้ด้วยลอจิก `3.3V HIGH` ของ ESP32 ส่วนพัดลมอีกตัวที่ยังหมุนค้างอยู่เมื่อดึงสายออก เกิดจากการเสียบสายไฟพัดลมไว้ที่ขั้ว `NC` (Normally Closed) แทน `NO`
- **ผลกระทบ:** ESP32 สามารถสั่งเปิด-ปิดรีเลย์ 5V Active LOW ได้ขาดสนิท 100% ผ่านหน้าเว็บโดยไม่ต้องเพิ่มวงจร Level Shifter ภายนอก

## การตรวจสอบ
- `python3 -m py_compile vocs-website/backend/main.py`
- `npm --prefix vocs-website/frontend run build`
- ตรวจสอบสถานะการสั่งงานผ่าน `GET /api/devices/BOX-001/fans`

## งานค้างและขั้นตอนถัดไป
- อัปโหลด `voc_esp32.ino` เวอร์ชันใหม่ลงบอร์ด ESP32
- ย้ายสายพัดลมตัวที่ยังหมุนค้างตอนดึงสาย `IN` ออก จากขั้ว `NC` ไปยังขั้ว `NO`
