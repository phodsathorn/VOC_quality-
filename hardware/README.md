# ⚡ VOC / E-Nose Hardware & Embedded Firmware

โฟลเดอร์นี้รวบรวมทรัพยากรทุกอย่างที่เกี่ยวข้องกับ **ฮาร์ดแวร์, แผงวงจร (PCB), การเดินสายเซนเซอร์ (Wiring), การทดสอบ (Diagnostics), และเฟิร์มแวร์ไมโครคอนโทรลเลอร์ (Firmware)** ของระบบ VOC / E-Nose ทั้งหมดไว้ในที่เดียว

---

## 📁 โครงสร้างโฟลเดอร์ (Directory Layout)

```text
hardware/
├── firmware/                        # โค้ดเฟิร์มแวร์หลักที่ใช้งานบนบอร์ดจริง
│   └── voc_esp32/
│       ├── voc_esp32.ino            # ซอร์สโค้ด Arduino/C++ หลัก (ESP32)
│       ├── secrets.example.h        # ตัวอย่างการตั้งค่า Wi-Fi และ API Key
│       └── secrets.h                # ข้อมูลความลับจริง (Git-ignored)
│
├── pcb/                             # แผนผังและงานออกแบบแผงวงจรพิมพ์ (EasyEDA / Gerber)
│   ├── V2_PCB_PRELIMINARY_DESIGN_TH.md # เอกสารการออกแบบบอร์ด PCB V2
│   ├── easyeda_v2_update_guide.md   # คู่มือการวาดวงจรและอัปเดต EasyEDA
│   └── assets/
│       └── v2-pcb-preliminary-layout.svg # ภาพเลย์เอาต์การจัดวางตำแหน่งชิ้นส่วนบน PCB
│
├── wiring/                          # แผนผังการต่อสายและ Pinout ระดับฮาร์ดแวร์
│   └── wiring_design.md             # รายละเอียดการต่อขาเซนเซอร์ และวงจรตัวแบ่งแรงดัน
│
├── validation/                      # กระบวนการตรวจสอบและสอบเทียบเซนเซอร์
│   ├── SENSOR_VALIDATION.md         # ขั้นตอนการเบิร์นอิน (Burn-in) และวิเคราะห์ Drift
│   └── experimental_components.md   # รายการชิ้นส่วนและสเปกโมดูลเซนเซอร์
│
└── tests_and_diagnostics/           # เฟิร์มแวร์และสเก็ตช์ทดสอบย่อย
    ├── diagnostics/
    │   └── debug_diagnostic/        # สเก็ตช์ทดสอบ I2C Scanner, ADC Readout, Bus Health
    ├── firmware-tests/
    │   ├── dht22-only/              # สเก็ตช์ทดสอบอ่านค่า DHT22 แบบเดี่ยว
    │   └── first-air-quality-box/   # โค้ดต้นแบบกล่องวัดชุดแรก
    └── legacy-firmware/
        └── air_quality_monitor/     # เฟิร์มแวร์ทดลองรุ่นเก่า
```

---

## 🔌 สรุปการเชื่อมต่อฮาร์ดแวร์ (Hardware Pin Mapping - PROTO Rev A)

อ้างอิงตามข้อกำหนดหลักใน [`CORE_SPEC.md`](../CORE_SPEC.md) ข้อ 4.1:

| เซนเซอร์ | เทคโนโลยี | สารเป้าหมาย | ช่องสัญญาณ ESP32 / IC | แรงดัน / หมายเหตุ |
|---|---|---|---|---|
| **MQ-2** | MOS Semiconductor | ก๊าซไวไฟ, LPG, โพรเพน, มีเทน | **ADC1 CH5 (GPIO 33)** | ผ่านตัวแบ่งแรงดัน 5V ➔ 3.3V |
| **MQ-3** | MOS Semiconductor | แอลกอฮอล์, ทินเนอร์, ไอระเหยตัวทำละลาย | **ADC1 CH0 (GPIO 36 / VP)** | ผ่านตัวแบ่งแรงดัน 5V ➔ 3.3V |
| **MQ-8** | MOS Semiconductor | ก๊าซไฮโดรเจน (H₂) | **ADC1 CH6 (GPIO 34)** | ผ่านตัวแบ่งแรงดัน 5V ➔ 3.3V |
| **MQ-135** | MOS Semiconductor | เบนซีน, ควัน, แอมโมเนีย, คุณภาพอากาศ | **ADC1 CH3 (GPIO 39 / VN)** | ผ่านตัวแบ่งแรงดัน 5V ➔ 3.3V |
| **MiCS-6814** | Triple MEMS | CO, NO₂, NH₃ | **ADS1115 (I2C 0x48)**<br>• Ch 0: CO<br>• Ch 1: NO₂<br>• Ch 2: NH₃ | ต่อบัส I2C ร่วมกับเซนเซอร์ดิจิทัล |
| **CCS811** | MOX MEMS + MCU | TVOC, eCO₂ | **I2C 0x5A** (SDA 21 / SCL 22) | WAKE ต่อลง GND, pull-up 4.7 kΩ |
| **PMS5003** | Laser Scattering | ฝุ่นละเอียด PM1.0, PM2.5, PM10 | **UART2** (RX 16 / TX 17 / SET 23) | สื่อสาร Serial 9600 bps |
| **DHT22** | Capacitive / RTD | อุณหภูมิ และความชื้นสัมพัทธ์ | **Digital GPIO 27** | สื่อสารแบบ 1-Wire ดิจิทัล |
| **พัดลมดูด/เป่า** | 12V PWM Fan | ระบายอากาศและฟลัชสารเคมี | **GPIO 25 (Exhaust) / GPIO 26 (Intake)** | ควบคุมผ่านมอสเฟต 2N7000 / Logic Level |

> ⚠️ **กฎสำคัญ:** ใช้เฉพาะขาของ **ADC1** เท่านั้น (ห้ามใช้ ADC2 เนื่องจากพินจะชนกับโมดูล Wi-Fi ของ ESP32 ขณะทำงาน)

---

## 🚀 ขั้นตอนการแฟลชเฟิร์มแวร์ (Flashing Firmware)

1. เปิดโปรแกรม **Arduino IDE** หรือ **PlatformIO**
2. เปิดไฟล์: `hardware/firmware/voc_esp32/voc_esp32.ino`
3. คัดลอก `secrets.example.h` เป็น `secrets.h` แล้วกรอกค่า:
   ```c
   #define WIFI_SSID "YOUR_WIFI_SSID"
   #define WIFI_PASS "YOUR_WIFI_PASSWORD"
   #define API_SERVER "https://voc-backend-api.onrender.com"
   #define BOX_ID "BOX-001"
   ```
4. เลือกบอร์ด: **ESP32 Dev Module**
   - Flash Size: `4MB`
   - Partition Scheme: `Default 4MB with spiffs`
   - Upload Speed: `921600`
5. เสียบสาย USB และกดปุ่ม **Upload**
