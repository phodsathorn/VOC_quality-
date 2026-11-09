# 2026-11-02 — EasyEDA ESP32-WROOM-32 schematic

## สรุป
สถานะ: สร้างและบันทึก schematic ใหม่ในโปรเจกต์ VOCs แล้ว

## สิ่งที่เปลี่ยน
- Clone schematic VOC_Production_Modules_RevA เป็น VOC_ESP32_WROOM32_2026-11-02 ผ่าน EasyEDA Pro
- เปลี่ยนชื่อหน้าภายในเป็น ESP32_WROOM32_Module_Carrier
- เก็บภาพผลลัพธ์ที่ hardware/production_modules/EasyEDA_ESP32_WROOM32_2026-11-02.png
- เอกสารใหม่: https://pro.easyeda.com/editor#id=fe3e99114bd543adaeb37528164bc85c,tab=*7a8bb78b0db09d90@fe3e99114bd543adaeb37528164bc85c

## เหตุผลและผลกระทบ
ผู้ใช้ขอ schematic ใหม่และยืนยันใช้รุ่นเดิม ESP32-WROOM-32 จึงนำวงจรรุ่นเดิมมาสร้างเป็นเอกสารแยกสำหรับใช้งานต่อ โดยไม่เปลี่ยน topology หรือวงจรต้นฉบับ

## การตรวจสอบ
- โหลดหน้า EasyEDA ใหม่และยืนยันว่า schematic และชื่อหน้าใหม่คงอยู่
- ตรวจภาพว่ามีวงจรภาคจ่ายไฟ MCU เซนเซอร์ I2C/UART ADC และพัดลม
- ไม่ได้รัน ERC/netlist ใหม่ การสร้างสำเนาไม่ได้ยืนยันความพร้อมผลิต

## การตัดสินใจ/ข้อสมมติ
ใช้ชุด production modules Rev A ตามเอกสาร hardware/production_modules/README.md ไม่ใช้แบบ V2 ESP32-S3

## งานค้างและขั้นตอนถัดไป
ต้องยืนยัน SKU/pinout ของโมดูลจริง เลือก footprints และตรวจ ERC/DRC ก่อนทำ PCB; แบบนี้ยังเป็น module carrier schematic ที่สืบทอดข้อจำกัดจาก Rev A

## อัปเดตเวลา 19:55 ICT — ปรับตาม repository ปัจจุบัน

- ผู้ใช้อนุญาตให้ใช้ repository เป็นหลักและปรับให้เป็นปัจจุบัน
- พบว่า Rev A เป็นชุดอัปเกรด ไม่ตรง firmware ปัจจุบันซึ่งใช้ DHT22, CCS811, PMS5003, MQ-2/3/8/135 และ MiCS-6814 + ADS1115
- สร้าง hardware/current_wroom32/generate_schematic.py, VOC_WROOM32_Current_2026-11-02.json/.svg, connections.json และ verification.json
- ผลตรวจต้นทาง: 51 components, 32 named nets, 14 firmware pin definitions ตรงกัน; reference ไม่ซ้ำและแต่ละ named net มีอย่างน้อยสอง terminal
- ใช้ GPIO27 สำหรับ DHT22, ADS1115 อยู่ GPIO32/13, CCS811 อยู่ GPIO21/22; divider 10k/15k ทั้ง 7 analog channels; relay module interface ตาม wiring document พร้อมระบุว่ายังไม่ยืนยัน polarity/input compatibility
- เริ่มนำเข้า EasyEDA แต่ยังไม่สำเร็จ: ระบบควบคุมคอมพิวเตอร์หยุดเพราะไม่สามารถยืนยัน URL ของหน้าต่าง Chrome บน Windows ได้อย่างมั่นใจ
- สถานะ: ไฟล์วงจรใหม่อยู่ในเครื่องเท่านั้น; EasyEDA ยังคงเป็นสำเนา Rev A ที่สร้างก่อนหน้า ไม่ได้อัปเดตเป็นวงจรปัจจุบันแล้ว
- งานค้าง: ตรวจภาพ SVG, นำเข้าและตรวจ source/netlist ใน Pro, แก้เอกสาร wiring/update guide ที่ขัดกัน, ตรวจ relay และ footprint จริง ก่อน PCB; ยังไม่ผ่าน ERC และไม่ได้ส่งผลิต
