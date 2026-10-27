# VOC Quality Monitor — Powder Coating Factory

ระบบตรวจวัดคุณภาพอากาศสำหรับห้องพ่นสีฝุ่น โดยใช้ ESP32, sensor array และเว็บสำหรับติดตามค่า การแจ้งเตือน การสอบเทียบ และการบำรุงรักษา

> ข้อมูลจาก sensor array เป็นระบบเฝ้าระวังและช่วยตัดสินใจ (E-Nose) ไม่ใช่หลักฐานรับรองค่าการปล่อยจากปล่องหรือการปฏิบัติตามกฎหมายโดยลำพัง ต้องยืนยันด้วยวิธีเก็บตัวอย่างและเครื่องมืออ้างอิงที่เหมาะสม

## เริ่มต้นใช้งาน

- เว็บและ backend ที่ใช้งาน/deploy อยู่: [`vocs-website/`](vocs-website/README.md)
- firmware ปัจจุบัน: [`vocs-website/firmware/voc_esp32/voc_esp32.ino`](vocs-website/firmware/voc_esp32/voc_esp32.ino)
- ตั้งค่า Wi-Fi ในไฟล์ local `secrets.h` โดยคัดลอกจาก [`secrets.example.h`](vocs-website/firmware/voc_esp32/secrets.example.h) และห้าม commit ไฟล์จริง
- backend ต้องรับ `DATABASE_URL` จาก environment variable ของระบบ deploy; ดูตัวอย่างที่ [`vocs-website/backend/.env.example`](vocs-website/backend/.env.example)

## โครงสร้างโครงการ

```text
.
├── vocs-website/                 # ระบบที่ใช้งานจริง: frontend, backend, firmware, ML และ Docker
├── docs/                         # เอกสารปัจจุบัน
│   ├── architecture/             # สถาปัตยกรรม E-Nose และ web platform
│   ├── hardware/                 # Wiring, component และ datasheet notes
│   ├── ml/                       # การวิเคราะห์/ออกแบบ ML
│   ├── product/                  # Product spec, pitch และแผนอัปเกรด
│   └── research/reference/       # งานอ้างอิง, paper และการเปรียบเทียบ sensor
├── experimental/                 # โค้ดและผลการทดลองที่ไม่ใช่ production
│   ├── diagnostics/              # โปรแกรม diagnostic สำหรับ hardware
│   ├── firmware-tests/           # firmware test รายอุปกรณ์/กล่องรุ่นแรก
│   └── legacy-firmware/          # firmware รุ่นก่อนหน้า
├── tools/serial/                 # เครื่องมือ Python สำหรับ serial/ESP32
├── data/runtime-logs/            # log ที่สร้างระหว่างใช้งาน (ไม่ commit)
├── logbook/                      # ประวัติการแก้ไขและการตัดสินใจ
├── archive/                      # เอกสารและแบบออกแบบเก่าที่เก็บอ้างอิง
├── AGENTS.md                     # กติกาบังคับบันทึก logbook เมื่องานมีการแก้ไข
└── *.code-workspace              # การตั้งค่า workspace ของ editor
```

## เอกสารหลัก

- [แผนงานระบบเว็บและ backend](vocs-website/WEB_BACKEND_REVIEW_AND_PLAN.md)
- [แผนงาน hardware และ firmware](vocs-website/HARDWARE_FIRMWARE_REVIEW_AND_PLAN.md)
- [แนวทางตรวจสอบและ validation ของ sensor](vocs-website/SENSOR_VALIDATION.md)
- [กติกาและประวัติ Logbook](logbook/README.md)

## กติกาการทำงาน

ทุกการเปลี่ยนโค้ด เอกสาร การตั้งค่า หรือ deployment ต้องบันทึกใน `logbook/` ตาม [AGENTS.md](AGENTS.md) โดยห้ามบันทึก password, token, private key หรือ connection string จริง
