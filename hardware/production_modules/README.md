# VOC / E-Nose — Production Module Carrier, Rev A

ออกแบบตาม `PRODUCTION_SENSOR_SPEC.md` โดยใช้โมดูลสำเร็จรูป ตามคำขอวันที่ 13 ตุลาคม 2026

## ไฟล์

- `VOC_Production_Modules_RevA.json`: schematic แบบแก้ไขได้ในรูปแบบ EasyEDA Standard exchange สำหรับนำเข้า EasyEDA Pro
- `VOC_Production_Modules_RevA.svg` / `.png`: ภาพวงจรสำหรับตรวจแบบ
- `connections.json`: รายการอุปกรณ์ ขา และ net ที่ใช้ตรวจการเชื่อมต่อ
- `generate_schematic.py`: สคริปต์สร้างไฟล์ข้างต้น
- `EasyEDA_Pro_source_snapshot.txt`: source ที่อ่านจากหน้า File Source ของ Pro หลังนำเข้า (อ้างอิง symbol library ที่อยู่ในโปรเจกต์ออนไลน์)
- `EasyEDA_Pro_saved.png`: ภาพหน้า EasyEDA Pro หลังบันทึก
- `verification.json`: ผลเทียบ reference 50 ชื่อและ net 27 ชื่อกับ source ของ Pro

บันทึกไว้ในโปรเจกต์ VOCs ที่ผู้ใช้ระบุ เป็นบอร์ดและ schematic ใหม่ชื่อ `VOC_Production_Modules_RevA`:
[เปิด schematic ใน EasyEDA Pro](https://pro.easyeda.com/editor#id=fe3e99114bd543adaeb37528164bc85c,tab=*2b93c2959cb0c000@fe3e99114bd543adaeb37528164bc85c)

ใช้ File → Import → EasyEDA(Standard) ใน Pro แล้วเลือก JSON; ใช้ source file style และปิดการจับคู่ footprint อัตโนมัติ จนกว่าจะเลือกรุ่นโมดูล/คอนเนกเตอร์จริง

## ขอบเขต

เป็น schematic บอร์ดหลักที่ต่อกับโมดูลผ่านสาย/คอนเนกเตอร์ ไม่ใช่แผงชิปเซนเซอร์เปล่า และยังไม่ใช่แบบ PCB พร้อมผลิต เลขขา J2–J4, J6–J11 เป็น **ขาของ harness ที่กำหนดในแบบนี้** ต้องจับคู่กับชื่อสัญญาณของโมดูลจริง ห้ามถือว่าเป็นลำดับขาบนโมดูลยี่ห้อใดก็ได้ ส่วน J5 ใช้ pin assignment ของ SPS30 ตาม datasheet

U1 เป็น logical interface ของ ESP32-WROOM-32 DevKit ซึ่งตรงกับตระกูล MCU ในโค้ดเดิม ไม่ใช่ ESP32-S3 ที่ชื่อสัญลักษณ์บางชิ้นในวงจรเก่าระบุไว้ ขา U1 ที่เป็นเลข GPIO ไม่ใช่ตำแหน่งขา header ตามลำดับ ต้องเลือกรุ่น DevKit จริงก่อนทำ footprint

## อุปกรณ์และการต่อ

| ส่วน | อุปกรณ์ | การเชื่อมต่อ |
|---|---|---|
| J2 | SHT40 module รุ่น address 0x44 | I2C1, 3.3V |
| J3 | SGP41 module, 0x59 | I2C1, 3.3V |
| J4 | BME680 module, 0x76 | I2C1, 3.3V; ตั้ง CSB สูง และ SDO ต่ำที่โมดูล |
| J5 | SPS30, 0x69 | I2C2; จ่ายไฟ 5V; SEL ลง GND |
| J6 | ZE03-O3 | 5V, TXD → GPIO16, RXD ← GPIO17 |
| J7 | ZE03-CO | 5V, TXD → GPIO18, RXD ← GPIO19 |
| J8/J9 | ADS1115 module, 0x48 | I2C1; ADDR ลง GND ที่โมดูล; A0/A1/A2 รับ MiCS; A3 รับ MQ-131 |
| J10 | MiCS-6814 analog module ที่มีวงจร heater ภายใน | 5V; RED/OX/NH3 ผ่าน divider 10k/15k ไป ADS1115 |
| J11 | MQ-131 low-concentration module, optional | 5V, AOUT ผ่าน divider ไป A3; ไม่ใช้ DOUT |
| J12/J13 | พัดลม 5V สองสาย ≤0.5A ต่อตัว | AO3400A low-side; GPIO25/GPIO26; HIGH เปิด |

I2C1: SDA=GPIO21, SCL=GPIO22. I2C2: SDA=GPIO32, SCL=GPIO13. UART0 ของ ESP32 เก็บไว้สำหรับ USB programming/debug; UART1 ต้อง remap ไป GPIO18/19 ส่วน UART2 ใช้ GPIO16/17

## ภาคจ่ายไฟและสัญญาณ

- รับ 5.00V ±0.10V จากแหล่งจ่าย regulated ที่มีกำลังจ่ายอย่างน้อย 3A; ตรวจแรงดันที่ ZE03/MiCS เมื่อพัดลมเริ่มหมุน ไม่ใช่วัดเฉพาะที่ adapter
- F1 3A เป็นค่าเริ่มต้นสำหรับพัดลมรวม ≤1A; ต้องเลือกตามกระแสกระชาก สาย และ connector จริง
- U2 AP2112K-3.3 จ่ายเฉพาะโมดูลเซนเซอร์ ไม่รวม ESP32; ตรวจ thermal budget และกระแสเมื่อใช้ heater ของ SHT40
- ESP32 DevKit รับ 5V ที่ VIN และใช้ regulator บนบอร์ด; ไม่ผูก output 3V3 ของ DevKit กับ output ของ U2
- เมื่อเสียบ USB และไฟภายนอกพร้อมกัน ต้องใช้สาย USB data-only หรือยืนยันวงจร isolation ของ DevKit รุ่นนั้น
- R1/R2 เป็น pull-up 4.7k ที่ใส่เมื่อโมดูลไม่มี pull-up เพียงพอ ตรวจค่ารวมเมื่อหลายโมดูลต่อขนาน; ทุก pull-up ไป 3.3V
- SPS30 แยก I2C2 เพื่อจัดการสาย/โหลดต่างจาก array. สาย I2C ไป SPS30 ควรสั้นไม่เกิน 20cm; สายยาวให้เปลี่ยนสถาปัตยกรรมเป็น UART/บัสที่เหมาะสม
- Divider 10k/15k ให้ gain 0.6; อินพุต 5.1V เป็น 3.06V nominal. RC ใช้ capacitor 100nF ที่ ADC node; ต้องรวม divider loading, tolerance และ ADS1115 input impedance ใน calibration
- ADS1115 ใช้ VDD=3.3V และตั้ง PGA ±4.096V ได้ แต่ PGA ไม่ทำให้รับ input สูงกว่า VDD ได้ ห้ามจ่าย analog 5V ตรงเข้า AIN
- ใช้ MiCS รุ่น analog ที่มี heater drive และ load resistors ภายในเท่านั้น; โมดูล MiCS แบบ I2C ไม่ใช้ harness ชุดนี้ และชิปเปล่าต้องมีวงจร heater แยก
- MQ-131 เป็นตัวเลือกที่ต้องยืนยันรุ่น low-concentration และแรงดัน heater ของโมดูล ไม่สลับกับรุ่น high-concentration
- ZE03 ระบุ UART 3V TTL; ก่อนประกอบต้องยืนยันว่า RXD ของ revision ที่ซื้อรองรับ TX 3.3V ของ ESP32 หากไม่รองรับให้ใส่ level translation ตามสเปกโมดูล

## การตรวจและงานก่อนทำ PCB

สคริปต์ตรวจ reference ไม่ซ้ำ และ named net ทั้ง 27 ชื่อมีอย่างน้อยสอง terminal. ภาพ preview สร้างจากข้อมูลเดียวกับ JSON. การตรวจนี้ไม่แทน ERC/netlist ที่โปรแกรม CAD สร้างหลังนำเข้า หรือการทดสอบวงจรจริง

นำเข้า Pro สำเร็จและตรวจ source หลังนำเข้า: component 50 ตัว, reference 50 ชื่อตรงกัน และ named net 27 ชื่อตรงกับไฟล์ต้นทาง. ทดลอง export netlist แล้ว Pro หยุดที่ component ทั้ง 50 ตัวไม่มี Footprint; ยังไม่ยืนยัน netlist สำหรับ PCB หรือ ERC ผ่านครบ. ไม่ใส่ footprint สมมติแทนโมดูลที่ยังไม่เลือก SKU

ต้องยืนยัน module SKU, pin order, connector pitch, DevKit header spacing และ footprints ก่อน PCB layout. โมดูลสำเร็จรูปต้องมี decoupling ภายในตามผู้ผลิต; ADS1115 ใช้ onboard decoupling ของโมดูล

เฟิร์มแวร์เดิมยังอ่าน DHT22/PMS5003/CCS811/MQ จึงต้องเพิ่ม driver และ data schema ของเซนเซอร์ใหม่ก่อนใช้งานชุดนี้ งาน firmware/PCB layout ไม่ได้ทำในชุดไฟล์นี้

วงจรนี้มี O3 และ CO แบบ electrochemical แต่ไม่มี SO2 แบบเฉพาะทาง หากต้องวัด SO2 โดยตรงให้เพิ่ม ZE03-SO2 และขยาย UART. SGP41/BME680/MiCS raw features ไม่ใช่การวัด SO2 หรือสารเฉพาะโดยตรง. ชุดโมดูลนี้ยังไม่ได้รับการรับรองเป็นระบบเตือนภัยอุตสาหกรรม และ ZE03 ไม่ทดแทนเครื่องอ้างอิงที่สอบเทียบสำหรับ validation

## Datasheet ที่ใช้อ้างอิง

- [Sensirion SPS30](https://sensirion.com/file/datasheet_sps30)
- [Sensirion SHT4x](https://sensirion.com/resource/datasheet/sht4x)
- [Sensirion SGP41](https://sensirion.com/media/documents/5FE8673C/61E96F50/Sensirion_Gas_Sensors_Datasheet_SGP41.pdf)
- [Bosch BME680](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme680-ds001.pdf)
- [TI ADS1115](https://www.ti.com/lit/ds/symlink/ads1115.pdf)
- [SGX MiCS-6814](https://www.sgxsensortech.com/content/uploads/2015/02/1143_Datasheet-MiCS-6814-rev-8.pdf)
- [Winsen ZE03](https://www.winsen-sensor.com/sensors/toxic-gas-sensor/ze03-electrochemical-detection-module.html)
- [Diodes AP2112](https://www.diodes.com/datasheet/download/AP2112.pdf)
- [AOS AO3400A](https://www.aosmd.com/res/data_sheets/AO3400A.pdf)
- [EasyEDA exchange format](https://docs.easyeda.com/en/DocumentFormat/2-EasyEDA-Schematic-File-Format/)
