# 2026-10-26 — V2 PCB Preliminary Design

## สรุป

เพิ่มแบบร่างสถาปัตยกรรมวงจรและ PCB รุ่น 2 สำหรับ review ก่อนทำ KiCad schematic/Gerber โดยอ้างอิงรายการอุปกรณ์ที่ผู้ใช้เลือกสำหรับระบบเซนเซอร์รุ่นใหม่

## สิ่งที่เปลี่ยน

- เพิ่ม `docs/hardware/V2_PCB_PRELIMINARY_DESIGN_TH.md`
- ระบุ power tree, I2C topology ผ่าน TCA9548A, connector plan, แนววาง PCB, test points และรายการอะไหล่ที่ยังขาด
- แยกวงจร sensor/low-voltage ออกจาก AC/load control และกำหนดให้ G3MB-202P อยู่ในภาคควบคุมภายนอกเท่านั้น

## เหตุผลและผลกระทบ

- เฟิร์มแวร์เดิมใช้ ESP32-WROOM และเซนเซอร์เดิม จึงไม่สามารถย้าย pin mapping ไปยังบอร์ดจอ ESP32-S3 ได้โดยไม่ตรวจ pinout จริง
- แบบร่างลดความเสี่ยง noise จากพัดลม/บัคคอนเวอร์เตอร์และลดความเสี่ยงจากการนำไฟ AC เข้าบอร์ดเซนเซอร์
- ยังไม่ใช่แบบผลิต: ต้องยืนยันรุ่นโมดูล, โหลดจริง และผังกล่องก่อน lock schematic และ routing

## การตรวจสอบ

- ตรวจเอกสาร wiring เดิมและ firmware pin map เพื่อระบุความแตกต่างจาก v2
- ตรวจว่าเอกสารมีข้อจำกัดด้าน I2C level, power separation, GPIO lock และ acceptance tests ครบก่อนส่งต่อ

## การตัดสินใจ/ข้อสมมติ

- ใช้ ESP32-S3 display board เป็น HMI/controller และ carrier PCB เป็นบอร์ด sensor/power interface
- ไม่รวม mains routing บน carrier PCB และไม่ระบุการต่อ AC load จนกว่าจะได้สเปกและผู้รับผิดชอบด้านไฟฟ้า

## งานค้างและขั้นตอนถัดไป

1. ผู้ใช้ยืนยัน pinout รุ่นจอ, แหล่งจ่าย, พัดลม/โหลด และรูปด้านหลังโมดูลทั้งหมด
2. สร้าง KiCad schematic พร้อม footprint ที่ตรงรุ่น และทำ ERC/DRC
3. ให้ผู้เชี่ยวชาญไฟฟ้าตรวจภาคโหลด AC ก่อนผลิตหรือใช้งานในโรงงาน

## อัปเดตเวลา 16:40 ICT

### สิ่งที่เปลี่ยน

- เพิ่มภาพ SVG `docs/hardware/assets/v2-pcb-preliminary-layout.svg` และฝังในเอกสารแบบร่าง PCB เพื่อให้ตรวจ architecture ได้จากภาพเดียว

### การตรวจสอบ

- ตรวจว่าไฟล์ SVG ไม่มี resource ภายนอกและอ้างอิงจาก Markdown ด้วย relative path

## อัปเดตเวลา 16:55 ICT

### สิ่งที่เปลี่ยน

- ปรับแบบ v2 จากการติด sensor บน carrier PCB เป็น **backplane PCB** ที่ต่อ sensor module/บอร์ดไข่ปลาผ่าน JST-XH
- กำหนด pinout 4 pin สำหรับ sensor I2C และ 6 pin สำหรับ SPS30 บนเอกสารและภาพผัง

### เหตุผลและผลกระทบ

- เปลี่ยน sensor ได้ง่าย, ซ่อมและทดลอง sensor รุ่นอื่นได้โดยไม่ต้องทำ PCB หลักใหม่
- ช่วยวาง sensor ไว้ในตำแหน่งลมที่เหมาะสมและไกลจากความร้อนของ HMI/power supply
- ต้องใช้ keyed housing, silkscreen และตรวจ pin 1 ทุก connector ก่อนจ่ายไฟ
