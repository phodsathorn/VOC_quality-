# 📖 วิธีใช้งาน test_1st_air_quality_box

## 1. ติดตั้ง Library ก่อน (Arduino Library Manager)

เปิด Arduino IDE → Tools → Manage Libraries แล้วค้นหาและติดตั้ง:

| Library | ผู้พัฒนา |
|---|---|
| `DHT sensor library` | Adafruit |
| `Adafruit Unified Sensor` | Adafruit |
| `Adafruit CCS811 Library` | Adafruit |
| `Adafruit ADS1X15` | Adafruit |
| `PMS Library` | fu-hsi |

---

## 2. แก้ไข WiFi Config

เปิดไฟล์ `secrets.h` แล้วแก้ 2 บรรทัดนี้:

```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";    // ← ชื่อ WiFi ของคุณ
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // ← รหัสผ่าน WiFi
```

---

## 3. อัพโหลดโค้ด

1. เสียบสาย USB เข้า ESP32
2. เลือก Board: `ESP32 Dev Module`
3. เลือก Port ที่ถูกต้อง
4. กด Upload

---

## 4. เปิด Serial Monitor

- Tools → Serial Monitor
- ตั้ง Baud Rate เป็น **115200**
- กดปุ่ม Reset บน ESP32 1 ครั้ง เพื่อเริ่มการทดสอบใหม่

---

## 5. อ่านผลแบบ Real-time

โปรแกรมไม่หยุดรอทดสอบทีละตัว และจะพิมพ์ JSON หนึ่งบรรทัดทุก **2 วินาที** เช่น:

```json
{"uptime_s":2,"wifi":{"status":"CONNECTED","rssi_dbm":-58},"fans":{"intake":"COMMANDED_ON","exhaust":"COMMANDED_ON"},"dht22":{"status":"OK","temp_c":27.4,"humidity_pct":65.1}}
```

- `OK` = เพิ่งอ่านข้อมูลสำเร็จภายใน 15 วินาที
- `STALE` = เคยอ่านได้ แต่ไม่มีข้อมูลใหม่เกิน 15 วินาที
- `NO_DATA` = ยังไม่เคยได้รับข้อมูลจากอุปกรณ์นั้น
- `warmup: true` = ยังอยู่ในช่วงอุ่นเซ็นเซอร์; ค่ายังแสดงแบบ real-time แต่ไม่ควรใช้เป็นค่าที่สอบเทียบแล้ว

รีเลย์ทั้งสองช่องจะถูกสั่ง **ON ตลอดเวลา** ตั้งแต่เริ่มระบบ (active-low) เพื่อให้พัดลม Intake และ Exhaust ทำงานต่อเนื่อง. วงจรที่กำหนดไม่มีสาย feedback จากพัดลม ดังนั้น `COMMANDED_ON` ยืนยันได้เพียง ESP32 สั่งรีเลย์แล้ว—ยังต้องดูพัดลมจริงว่าหมุนอยู่.

---

## 6. แก้ปัญหาเบื้องต้น (Troubleshooting)

| อาการ | สาเหตุที่พบบ่อย |
|---|---|
| WiFi FAIL | SSID/Password ผิด หรือเสาอากาศยังไม่ได้เสียบ |
| DHT22 FAIL | ลืมต่อ Pull-up 4.7kΩ |
| CCS811 FAIL | ลืมต่อขา WAKE ลง GND |
| ADS1115 FAIL | ลืมต่อขา ADDR ลง GND |
| MQ ค่าเป็น 0 | ไม่ได้ต่อ Voltage Divider |
| MQ ค่าเป็น 4095 | สายขาด หรือ Voltage Divider ผิดขา |
| Relay ไม่มีเสียง | ไม่มีไฟ 5V เข้า VCC ของ Relay Module |
| Relay ดัง แต่พัดลมไม่หมุน | สาย COM/NO ผิด |

---

## 7. หมายเหตุสำคัญ

> ⚠️ **ค่าเซ็นเซอร์แรกๆ จะยังไม่นิ่ง** เป็นเรื่องปกติครับ เพราะฮีตเตอร์ยังไม่ร้อนได้ที่
> - MQ Series: ต้อง Warm-up **24-48 ชั่วโมง** ก่อนค่าจะนิ่ง
> - CCS811: ต้อง Warm-up **48 ชั่วโมง** + Run-in 20 นาทีหลังเปิดทุกครั้ง
> - MiCS-6814: ต้อง Warm-up **2 ชั่วโมง** ก่อนอ่านค่าจริง

> ✅ **การทดสอบนี้ใช้เพื่อ:** ยืนยันว่าต่อสายถูก และเซ็นเซอร์ทุกตัวสื่อสารกับ ESP32 ได้ ไม่ใช่ทดสอบความแม่นยำของค่าครับ
