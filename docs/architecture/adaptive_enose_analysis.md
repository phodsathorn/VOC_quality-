# 🔄 วิเคราะห์แนวคิดใหม่: กล่องวัดอากาศที่ Retrain ได้

> **แนวคิด:** กล่อง sensor เก็บค่า → ส่งขึ้นเว็บ → label + train บนเว็บ → ส่งโมเดลกลับ ESP32
> แต่ละโรงงานใช้สารต่างกัน → retrain ให้เหมาะกับโรงงานนั้น

---

## 1. สถาปัตยกรรมระบบใหม่

```
╔══════════════════════════════════════════════════════════════════╗
║                    Adaptive E-Nose Platform                      ║
║                                                                  ║
║  ┌───────────────┐     WiFi/MQTT      ┌─────────────────────┐   ║
║  │  🟦 Sensor Box │ ──────────────────→│  🌐 Web Platform     │   ║
║  │  (ESP32)       │                    │  (เพื่อนทำ)           │   ║
║  │                │                    │                       │   ║
║  │  • อ่าน sensor │ → raw data ────→  │  • Dashboard          │   ║
║  │  • inference   │                    │  • Data labeling UI   │   ║
║  │  • แจ้งเตือน   │                    │  • ML Training        │   ║
║  │                │                    │  • Model management   │   ║
║  │  • รับโมเดลใหม่│ ←── .tflite ────  │  • OTA model push     │   ║
║  └───────────────┘                    └─────────────────────┘   ║
║                                                                  ║
║  Mode 1: เก็บ data (ส่ง raw ขึ้นเว็บ)                             ║
║  Mode 2: inference (ใช้โมเดลที่ฝังอยู่ จำแนกแบบ real-time)       ║
╚══════════════════════════════════════════════════════════════════╝
```

### Flow ทั้งหมด

```
ขั้นตอนที่ 1: โรงงาน A ซื้อกล่องไป
  กล่องยังไม่มีโมเดล → ทำงาน Mode 1 (เก็บ data อย่างเดียว)

ขั้นตอนที่ 2: ช่าง/วิศวกรเปิด Web Dashboard
  เห็นค่า sensor real-time ← ส่งจาก ESP32
  กดปุ่ม "Label" → เลือกว่าตอนนี้คือ "ทินเนอร์ A" / "สีฝุ่น B" / "อากาศสะอาด"
  เก็บไป 3-5 วัน ได้ labeled dataset

ขั้นตอนที่ 3: กดปุ่ม "Train Model" บนเว็บ
  Backend (Python) รัน: load data → preprocess → train MLP → convert TFLite → quantize

ขั้นตอนที่ 4: กดปุ่ม "Deploy to Box"
  เว็บส่ง .tflite + scaler params กลับไปที่ ESP32
  ESP32 บันทึกลง flash → restart → ทำงาน Mode 2 (inference)

ขั้นตอนที่ 5: โรงงาน A ใช้งาน
  กล่องจำแนก "ทินเนอร์ A" / "สีฝุ่น B" ได้แบบ real-time
  ถ้าเปลี่ยนสารเคมี → กลับไปขั้นตอน 2 train ใหม่
```

---

## 2. ทำได้จริงไหม? → ✅ ทำได้ แต่มี 5 ปัญหาที่ต้องแก้

### ✅ สิ่งที่ทำได้แน่นอน

| ส่วน | ทำได้ | เหตุผล |
|---|:---:|---|
| ESP32 อ่าน sensor ส่งขึ้นเว็บ | ✅ | MQTT/HTTP standard — ทำกันทั่วไป |
| เว็บแสดง dashboard + label data | ✅ | Web app ธรรมดา (เพื่อนทำ) |
| Train model บน server | ✅ | Python + TensorFlow — ไม่ต่างจาก Colab |
| Convert TFLite + quantize บน server | ✅ | ทำ automated ได้ |
| ส่ง model กลับไป ESP32 | ✅ | **ทำได้ แต่ต้องเลือกวิธี** (ดูด้านล่าง) |

---

### ⚠️ ปัญหาที่ 1: จะส่งโมเดลกลับ ESP32 ยังไง?

มี 2 วิธีหลัก:

#### วิธี A: OTA Full Firmware (ง่ายกว่า — แนะนำสำหรับโปรเจคจบ)

```
Server สร้าง firmware ใหม่ทั้ง binary
  (code เดิม + model_data.h ใหม่ + scaler_params.h ใหม่)
  → compile เป็น .bin
  → ส่งผ่าน HTTPS OTA ไป ESP32
  → ESP32 flash firmware ใหม่ทั้งหมด → restart
```

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ ใช้ ESP32 OTA library สำเร็จรูป | ❌ ต้อง compile firmware บน server |
| ✅ มั่นใจว่า code + model sync กัน | ❌ ขนาดไฟล์ใหญ่ (~1-2 MB) |
| ✅ มี rollback ถ้า update ล้มเหลว | ❌ restart ใช้เวลา 2-3 วินาที |

```cpp
// ESP32 side — รับ OTA update
#include <HTTPUpdate.h>

void checkForUpdate() {
  WiFiClient client;
  t_httpUpdate_return ret = httpUpdate.update(client,
    "https://your-server.com/api/firmware/latest.bin");
  
  if (ret == HTTP_UPDATE_OK) {
    Serial.println("✅ Update สำเร็จ! Restarting...");
    ESP.restart();
  }
}
```

#### วิธี B: SPIFFS Model-as-Data (ยากกว่า แต่ elegant)

```
เก็บ model.tflite เป็นไฟล์ใน SPIFFS (flash filesystem ของ ESP32)
  → ESP32 ดาวน์โหลดแค่ไฟล์ model.tflite + scaler.json ใหม่
  → เขียนทับไฟล์เก่า
  → โหลดโมเดลใหม่จาก SPIFFS ไม่ต้อง restart
```

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ อัพเดทเฉพาะโมเดล ไม่ต้อง compile ใหม่ | ❌ ต้องเขียน code จัดการไฟล์ใน SPIFFS |
| ✅ ไฟล์เล็ก (~5-100 KB) | ❌ SPIFFS ของ ESP32 มีพื้นที่จำกัด (~1.5 MB) |
| ✅ ไม่ต้อง restart | ❌ ต้อง load model จาก file → ซับซ้อนกว่า |
| ✅ ตรงกับ "OTA-TinyML" framework ใน IEEE | ❌ ต้อง handle กรณีไฟล์เสียหาย |

```cpp
// ESP32 side — โหลด model จาก SPIFFS
#include <SPIFFS.h>

void loadModelFromSPIFFS() {
  File f = SPIFFS.open("/model.tflite", "r");
  size_t model_size = f.size();
  uint8_t* model_buf = (uint8_t*)malloc(model_size);
  f.read(model_buf, model_size);
  f.close();
  
  // โหลดโมเดลจาก buffer
  model = tflite::GetModel(model_buf);
  // ... สร้าง interpreter ใหม่ ...
}
```

> [!TIP]
> **สำหรับโปรเจคจบ แนะนำ วิธี A (OTA Full Firmware)** เพราะง่ายกว่ามาก มี library สำเร็จรูป และมี dual-partition safety (ถ้า update ล้มเหลว ESP32 จะ boot firmware เก่า)

---

### ⚠️ ปัญหาที่ 2: Scaler Parameters ต้อง sync ด้วย

ถ้า retrain model ใหม่ → **ค่า mean/std ก็เปลี่ยนด้วย**

```
โรงงาน A:  clean air ADC เฉลี่ย = 350   → mean = 350, std = 120
โรงงาน B:  clean air ADC เฉลี่ย = 500   → mean = 500, std = 85

ถ้าใช้ scaler ของ A กับ model ของ B → ผลทำนายผิดหมด!
```

**วิธีแก้:** ส่ง scaler params ไปพร้อมกับ model ทุกครั้ง

```
// ถ้าใช้วิธี A: ฝังทั้ง model + scaler ใน firmware ใหม่ → ไม่มีปัญหา
// ถ้าใช้วิธี B: ส่ง 2 ไฟล์ → /model.tflite + /scaler.json
```

---

### ⚠️ ปัญหาที่ 3: Sensor Drift ข้ามโรงงาน

```
กล่องชุดที่ 1 (โรงงาน A): MQ-2 ตัว #001 → Ro = 15.6 kΩ
กล่องชุดที่ 2 (โรงงาน B): MQ-2 ตัว #002 → Ro = 22.3 kΩ

Sensor คนละตัว ให้ค่าต่างกัน แม้อากาศเหมือนกัน!
→ model ที่ train จากกล่อง #1 ใช้กับกล่อง #2 ไม่ได้ตรงๆ
```

**วิธีแก้:** ทุกกล่องต้อง **calibrate baseline ของตัวเอง** ก่อน → ใช้ Rs/Ro (normalized) แทน raw ADC เป็น feature

**ยิ่งดีถ้า:** ทุกครั้งที่ retrain ใช้ data จากกล่องตัวเองเท่านั้น (ซึ่งตรงกับแนวคิดของระบบนี้อยู่แล้ว ✅)

---

### ⚠️ ปัญหาที่ 4: ใครจะ validate model ก่อน deploy?

```
สถานการณ์:
  โรงงาน label ข้อมูลผิด (เช่น label "ทินเนอร์" ตอนอากาศสะอาด)
  → train model → accuracy 40%
  → deploy ลงกล่อง → กล่องทำนายผิดหมด
  → ไม่มีใครรู้ว่าผิด!
```

**วิธีแก้:** เว็บต้องแสดง accuracy + confusion matrix **ก่อน** ให้กด deploy:

```
┌─────────────────────────────────────────┐
│  ✅ Training Complete                     │
│                                           │
│  Accuracy: 89.5%                          │
│  Confusion Matrix:                        │
│  ┌────────┬─────┬──────┬───────┐         │
│  │        │clean│thinner│ smoke │         │
│  │ clean  │ 95% │   3%  │   2% │         │
│  │thinner │  5% │  90%  │   5% │         │
│  │ smoke  │  2% │   8%  │  90% │         │
│  └────────┴─────┴──────┴───────┘         │
│                                           │
│  [Deploy to Box]  [Cancel]                │
└─────────────────────────────────────────┘
```

---

### ⚠️ ปัญหาที่ 5: ESP32 Flash มีขีดจำกัด

```
ESP32-WROOM-32U Flash: 4 MB

ใช้แล้ว:
  Bootloader + partition table:  ~  0.1 MB
  Firmware (code + libraries):   ~  1.0 MB
  OTA partition (สำรอง):         ~  1.0 MB
  SPIFFS:                        ~  1.5 MB
  NVS:                           ~  0.1 MB
  
เหลือให้ model:
  ถ้าใช้ OTA: model ฝังใน firmware → ~100 KB ได้สบาย
  ถ้าใช้ SPIFFS: เก็บ model.tflite ~100 KB ได้สบาย
  
→ ขนาด model MLP ~100 KB ไม่มีปัญหา ✅
→ แต่ถ้าใช้ model ใหญ่ (เช่น CNN >500 KB) อาจมีปัญหา
```

---

## 3. แบ่งงานกับเพื่อน

| ส่วน | ใครทำ | งาน |
|---|---|---|
| **ESP32 Firmware** | **คุณ** | อ่าน sensor, ส่ง data ผ่าน MQTT, รับ OTA update, run inference |
| **Web Frontend** | เพื่อน | Dashboard, labeling UI, model management UI |
| **Web Backend** | เพื่อน | API รับ data, ML training pipeline, OTA distribution |
| **ML Pipeline** | **ร่วมกัน** | ออกแบบ feature, เลือก model, ทดสอบ accuracy |

### API ที่ต้องตกลงกัน

```
ESP32 → Web:
  POST /api/data        ← ส่ง sensor readings (ทุก 5 วินาที)
  GET  /api/model/check ← ถามว่ามีโมเดลใหม่ไหม

Web → ESP32:
  GET  /api/model/download ← ดาวน์โหลด firmware/model ใหม่

Web Internal:
  POST /api/label       ← user label ข้อมูล
  POST /api/train       ← สั่ง train model
  GET  /api/model/status ← ดูสถานะ training
```

---

## 4. งานวิจัย IEEE ที่เกี่ยวข้อง

### 📄 Paper 1: OTA-TinyML Framework
- **ชื่อ:** *"OTA-TinyML: Over-the-Air Deployment of TinyML Models for IoT Microcontrollers"*
- **วารสาร:** IEEE Internet Computing, 2022
- **สาระ:** Framework สำหรับ deploy + update TFLite model บน MCU (STM32/ESP32) ผ่าน HTTPS โดยไม่ต้อง reflash firmware ทั้งหมด ใช้แนวคิด **Model-as-Data** เก็บ model เป็นไฟล์ใน filesystem
- **เกี่ยวข้องกับโปรเจค:** ✅ **ตรงเป๊ะ** — เป็นพื้นฐานของการส่ง model กลับไป ESP32

### 📄 Paper 2: Transfer Learning สำหรับ E-Nose Drift
- **ชื่อ:** *"Domain Adaptation for Gas Sensor Drift Compensation"*
- **วารสาร:** IEEE Sensors Journal (หลายฉบับ 2020-2024)
- **สาระ:** ใช้ Transfer Learning / Domain Adaptation เพื่อชดเชย sensor drift — train model จากข้อมูลเก่า แล้ว adapt ให้ทำงานกับข้อมูลใหม่ที่ sensor เปลี่ยนไป **โดยไม่ต้อง train ใหม่ทั้งหมด**
- **เกี่ยวข้องกับโปรเจค:** ✅ ถ้าเพิ่ม Transfer Learning → โรงงานใหม่ไม่ต้องเก็บ data จากศูนย์

### 📄 Paper 3: Edge-Cloud IoT Air Quality Monitoring
- **ชื่อ:** *"Edge-Cloud Collaborative Architecture for IoT Air Quality Monitoring"*
- **วารสาร/ประชุม:** IEEE IoT Journal / IEEE Sensors Conference (2023-2024)
- **สาระ:** ระบบ 2 ชั้น — Edge (MCU) ทำ real-time inference + Cloud ทำ retraining/calibration โดย sensor ที่มี confidence ต่ำจะส่ง data ขึ้น cloud เพื่อ re-label + retrain
- **เกี่ยวข้องกับโปรเจค:** ✅ **สถาปัตยกรรมเหมือนกันเลย**

### 📄 Paper 4: Incremental Learning บน E-Nose
- **ชื่อ:** *"Incremental Learning for Electronic Nose Gas Classification"*
- **วารสาร:** IEEE Transactions on Instrumentation and Measurement
- **สาระ:** วิธี train model เพิ่มเติม (เรียนรู้สารใหม่) โดยไม่ลืมสารเก่า (Catastrophic Forgetting) ใช้เทคนิค CILN (Correlation-Based Incremental Learning Network)
- **เกี่ยวข้องกับโปรเจค:** ⚠️ เกี่ยวข้องแต่ซับซ้อนมาก — อ้างอิงเป็น "future work" ได้

### คำค้นหาสำหรับหา paper เพิ่มใน IEEE Xplore

```
1. "OTA TinyML model deployment microcontroller"
2. "adaptive electronic nose transfer learning"
3. "edge cloud air quality monitoring machine learning"
4. "IoT sensor drift compensation retraining"
5. "gas sensor array customizable classification"
```

---

## 5. เปรียบเทียบคุณค่าโปรเจค: เดิม vs ใหม่

| เกณฑ์ | แบบเดิม (ML ฝังตายตัว) | แบบใหม่ (Retrain ได้) |
|---|---|---|
| **ความยืดหยุ่น** | ❌ ใช้ได้แค่สารที่ train ไว้ | ✅ ปรับตามโรงงานได้ |
| **ความน่าสนใจทางวิชาการ** | 🟡 ปานกลาง | 🟢 **สูงมาก — มี paper IEEE รองรับ** |
| **ความซับซ้อน** | 🟢 ง่าย (คนเดียวทำได้) | 🟠 ซับซ้อนขึ้น (ต้องทำกับเพื่อน) |
| **ความเสี่ยง** | 🟢 ต่ำ | 🟠 สูงขึ้น (OTA อาจมี bug) |
| **Novelty** | 🟡 ไม่ค่อยใหม่ | 🟢 **ใหม่ — Adaptive E-Nose Platform** |
| **Scalability** | ❌ ใช้ได้กล่องเดียว | ✅ ขยายหลายโรงงานได้ |
| **Paper อ้างอิง** | 🟡 มี 3 ฉบับ | 🟢 **มีเพิ่มอีก 3-4 ฉบับ (OTA, Edge-Cloud)** |

---

## 6. คำแนะนำ

> [!IMPORTANT]
> **แนวคิดนี้ดีมาก ทำได้จริง และยกระดับโปรเจคจากดีขึ้นไปอีกขั้น** แต่ต้องกำหนดขอบเขตให้ชัด

### สำหรับโปรเจคจบ ทำแค่นี้พอ:

```
MVP ที่ทำได้จริง:
  ✅ ESP32 อ่าน sensor → ส่ง raw data ผ่าน MQTT/HTTP ไปเว็บ
  ✅ เว็บแสดง dashboard + มีปุ่ม label (เพื่อนทำ)
  ✅ เว็บ train MLP → convert TFLite (เพื่อนทำ backend)
  ✅ ESP32 รับ OTA firmware update (วิธี A — Full Firmware)
  ✅ ESP32 switch ระหว่าง Mode 1 (เก็บ data) กับ Mode 2 (inference)
  ✅ Demo: label 3 สาร → train → deploy → กล่องจำแนกได้

เขียน Future Work ในรูปเล่ม:
  ⬜ SPIFFS Model-as-Data (ไม่ต้อง reflash)
  ⬜ Transfer Learning (ใช้ data น้อยลง)
  ⬜ Incremental Learning (เรียนสารใหม่ไม่ลืมสารเก่า)
  ⬜ Federated Learning (หลายกล่องเรียนรู้ร่วมกัน)
```

### ข้อที่ต้องตกลงกับเพื่อน

```
1. Protocol:  ใช้ MQTT หรือ HTTP REST API?
2. Data format: JSON schema ของ sensor data เป็นอย่างไร?
3. Training: เพื่อนทำ backend training pipeline?
4. OTA: ใครสร้าง firmware binary — เพื่อน (server-side) หรือ คุณ (manual)?
5. Timeline: เพื่อนทำเว็บเสร็จเมื่อไหร่ → คุณถึงจะ integrate ได้
```
