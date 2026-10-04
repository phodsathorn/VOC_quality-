# 🛠️ สรุปจุดที่ต้องแก้ไขใน EasyEDA Schematic (อัปเดตเป็น Circuit Design v2)

เอกสารนี้สรุปจุดที่ต้อง "ลบ" และ "วาดเพิ่ม" ในโปรแกรมวาดวงจร (EasyEDA) เพื่อให้วงจรตรงกับสถาปัตยกรรม **Circuit Design v2** ล่าสุด และตรงกับ Pin Mapping ของ Firmware ปัจจุบัน

---

## 1. ระบบจ่ายไฟ (Power Supply)

*   **❌ ลบออก:**
    *   ลบ Battery 7-8V ออก
    *   ลบ `Stepdown 3.3V` Module (ตัวใหญ่) ออก
*   **✅ เพิ่ม/เปลี่ยน:**
    *   **5V Rail:** สร้าง Terminal Block 5V (2-Pin) สำหรับรับไฟเข้าจาก Adapter 5V/2A ภายนอก หรือ Mean Well PSU
    *   **3.3V Rail:** ใช้ชิป **AMS1117-3.3** แปลงไฟ 5V เป็น 3.3V เพื่อไปเลี้ยง ESP32, DHT22 และเซนเซอร์ I2C 
    *   **⚠️ สำคัญ (Capacitor):** ต้องใส่ Capacitor คร่อม AMS1117 ด้วย (เช่น Tantalum 10µF ที่ฝั่ง Output และ Ceramic 100nF ที่ฝั่ง Input) ป้องกันไฟแกว่งจนชิปค้าง

## 2. การเชื่อมต่อ MiCS-6814 (CJMCU-6814)

*   **❌ ลบออก:**
    *   ลบวงจร Voltage Divider (R 10k/20k) ที่ต่อออกจากขา `CO`, `NH3`, `NO2` ไปเข้า ESP32 ทิ้งทั้งหมด
*   **✅ เพิ่ม (สำคัญมาก):**
    *   ใส่ชิป/โมดูล **ADS1115 (16-bit ADC)** คั่นกลาง
    *   เอาขาจาก CJMCU-6814 ไปเข้า ADS1115 ดังนี้:
        *   `CO` → `A0`
        *   `NO2` → `A1`
        *   `NH3` → `A2`
    *   ต่อขา I2C ของ ADS1115 ไปเข้า ESP32:
        *   `SDA` → **GPIO 21**
        *   `SCL` → **GPIO 22**
    *   ต่อขา `ADDR` ของ ADS1115 ลง GND

## 3. ระบบพัดลมระบายอากาศ (Fans) — ส่วนที่ต้องเพิ่มใหม่

*   **✅ เพิ่ม:**
    *   วาดวงจร MOSFET **2N7000 (N-Channel)** จำนวน 2 ชุด สำหรับคุมพัดลม 5V (Intake 1 ตัว, Exhaust 1 ตัว)
    *   **ขา Gate (Q1 - Intake):** ต่อเข้า **GPIO 25**
    *   **ขา Gate (Q2 - Exhaust):** ต่อเข้า **GPIO 26**
    *   **⚠️ สำคัญ (Protection):** ต้องมี ไดโอด 1N4148 (Flyback Diode) คร่อมขั้วพัดลม และตัวต้านทาน 10kΩ (Pull-down) ที่ขา Gate ของ MOSFET แต่ละตัว

## 4. การจัดการ I2C Bus (แยก 2 บัส — Dual I2C)

*   **⚠️ สำคัญมาก:** จากผลทดสอบจริง CCS811 ดึง SDA ค้างช่วง Power-up และหากต่อขนานบนบัสเดียวกันจะทำให้ Pull-up ขนานกันจน Bus ล่ม จึงต้องแยกเป็น 2 บัส:
    *   **Bus #1 (Hardware I2C):** สำหรับ **CCS811** (Address 0x5B/0x5A)
        *   `SDA` → **GPIO 21**
        *   `SCL` → **GPIO 22**
        *   ขา `WAKE` ของโมดูล CCS811 **ต้องต่อลง GND** ตลอดเวลา
    *   **Bus #2 (Software/Secondary I2C):** สำหรับ **ADS1115** (Address 0x48)
        *   `SDA` → **GPIO 32**
        *   `SCL` → **GPIO 13**
        *   ขา `ADDR` ของ ADS1115 ต่อลง GND

## 5. เซนเซอร์อื่นๆ และการเช็ค Pin Mapping (Circuit Design v2)

ตรวจสอบการลากสายเข้า ESP32 ให้ตรงกับโค้ดล่าสุด:

| เซนเซอร์ | ขาบนเซนเซอร์ | ขาบน ESP32 (Firmware V2) | หมายเหตุ |
| :--- | :--- | :--- | :--- |
| **PMS5003** | TXD (Pin 5) | **GPIO 16 (RX2)** | ควรสลับไขว้กัน (TX→RX, RX→TX) |
| **PMS5003** | RXD (Pin 4) | **GPIO 17 (TX2)** | |
| **PMS5003** | SET (Pin 3) | **GPIO 23** | HIGH = ทำงาน, LOW = สลีป |
| **DHT22** | DATA | **GPIO 27** | ใส่ Pull-up 4.7kΩ ไปหา 3.3V ด้วย |
| **MQ-2** | AOUT | **GPIO 33** | ADC1 (ปลอดภัยเมื่อเปิด Wi-Fi) ผ่าน Voltage Divider |
| **MQ-3** | AOUT | **GPIO 36 (VP)** | ADC1 ผ่าน Voltage Divider |
| **MQ-8** | AOUT | **GPIO 34** | ADC1 ผ่าน Voltage Divider |
| **MQ-135** | AOUT | **GPIO 39 (VN)** | ADC1 ผ่าน Voltage Divider |

---
**💡 ทิปส์สำหรับการวาดใหม่ให้เป็นระเบียบ:**
แนะนำให้แยกบล็อกวงจรใน EasyEDA เป็นส่วนๆ (ใช้ Net Port / Net Label วิ่งแทนการลากสายระโยงระยาง) เช่น โซน Power, โซน I2C/Sensors, โซน MQ, และโซน MOSFET พัดลม จะช่วยให้อ่านวงจรและทำ PCB Routing ได้ง่ายขึ้นมากครับ
