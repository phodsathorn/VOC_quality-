# 📘 คู่มือปฏิบัติ: ESP32 + MQ-2 ทดลองเบื้องต้น
## พร้อมคำอธิบาย Calibration, Harvard TinyMLx, และ Test Chamber

---

# 1. 🔧 แผนทดลอง ESP32 + MQ-2 เบื้องต้น

## 1.1 อุปกรณ์ที่ต้องมีตอนนี้

| อุปกรณ์ | ราคาประมาณ | หมายเหตุ |
|---------|-----------|---------|
| ESP32 Dev Board (ตัวเก่าทดลองก่อน) | มีอยู่แล้ว | ใช้ทดลอง code, เปลี่ยนเป็น ESP32-S3 ทีหลัง |
| MQ-2 Sensor Module | ~70 ฿ | มีอยู่แล้ว |
| สาย Jumper | ~30 ฿ | Male-to-Female |
| Breadboard | ~50 ฿ | สำหรับต่อวงจร |
| **รวม** | **~0 ฿** (มีอยู่แล้ว) | |

## 1.2 การต่อสาย (Wiring)

```
MQ-2 Module          ESP32
─────────────        ──────
VCC  ──────────────→  5V (หรือ VIN)
GND  ──────────────→  GND
AOUT ──────────────→  GPIO 34 (ADC1_CH6)
DOUT ──────────────→  GPIO 25 (ไม่จำเป็น แต่ต่อได้)
```

> [!WARNING]
> **สำคัญมาก: Burn-in ก่อนใช้งาน!**
> เซนเซอร์ MQ-2 ตัวใหม่ต้อง **เปิดทิ้งไว้ 24-48 ชั่วโมง** ก่อนเริ่มเก็บข้อมูล
> เพราะ Heater ภายในต้องร้อนจนแผ่น SnO₂ เสถียร ค่าถึงจะไม่แกว่ง

## 1.3 Code Arduino สำหรับเก็บข้อมูล (Data Collection)

```cpp
// ===== ESP32 + MQ-2 Data Collector =====
// ใช้เก็บข้อมูลส่งไป PC ผ่าน Serial → บันทึกเป็น CSV
// สำหรับ Train ML Model ตาม Harvard TinyMLx Workflow

#define MQ2_PIN 34          // ขา Analog ของ MQ-2
#define SAMPLE_INTERVAL 1000 // อ่านทุก 1 วินาที (1000 ms)
#define NUM_SAMPLES 10       // จำนวนครั้งที่อ่านแล้วเฉลี่ย (Moving Average)

void setup() {
  Serial.begin(115200);
  delay(2000);  // รอ Serial พร้อม
  
  // พิมพ์ Header ของ CSV
  Serial.println("timestamp_ms,mq2_raw,mq2_voltage,mq2_avg,label");
}

void loop() {
  // อ่านค่า ADC หลายครั้งแล้วเฉลี่ย (Moving Average Filter)
  long sum = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) {
    sum += analogRead(MQ2_PIN);
    delay(10);
  }
  int mq2_raw = sum / NUM_SAMPLES;
  
  // แปลง ADC → Voltage (ESP32 ADC = 12-bit = 0-4095, Vref = 3.3V)
  float mq2_voltage = (mq2_raw / 4095.0) * 3.3;
  
  // พิมพ์ออก Serial เป็น CSV format
  // label ให้ใส่เองตอนเก็บข้อมูล (เปลี่ยนในโค้ดตาม Class)
  String label = "clean_air";  // ← เปลี่ยนตรงนี้ตอนเก็บข้อมูลแต่ละ Class
  // label = "clean_air"   → Class 0
  // label = "smoke"        → Class 1 (จุดธูป/กระดาษ)
  // label = "thinner"      → Class 2 (หยดทินเนอร์ใส่สำลี)
  // label = "lpg_gas"      → Class 3 (ก๊าซไวไฟ — ถ้ามี)
  
  Serial.print(millis());
  Serial.print(",");
  Serial.print(mq2_raw);
  Serial.print(",");
  Serial.print(mq2_voltage, 4);
  Serial.print(",");
  Serial.print(mq2_raw);  // ตอนมี sensor เดียว avg = raw
  Serial.print(",");
  Serial.println(label);
  
  delay(SAMPLE_INTERVAL);
}
```

## 1.4 วิธีเก็บข้อมูล (Data Collection Protocol)

```
ขั้นตอนการเก็บข้อมูลใน Test Chamber (กล่องจำลอง):

1. Class 0 — Clean Air (อากาศปกติ):
   - เปิดฝากล่อง ให้ลมเข้า
   - อัปโหลด code ที่ label = "clean_air"
   - เก็บ ~500-1000 ตัวอย่าง (ใช้เวลา ~8-16 นาที)

2. Class 1 — Smoke (ควัน):
   - ปิดกล่อง → จุดธูป/กระดาษทิชชู่ใส่เข้าไป
   - เปลี่ยน label = "smoke"
   - เก็บ ~500-1000 ตัวอย่าง
   - เปิดฝากล่อง ระบายอากาศ → รอค่า ADC กลับ baseline

3. Class 2 — Thinner/VOC:
   - ปิดกล่อง → หยดทินเนอร์ลงสำลี ใส่เข้าไป
   - เปลี่ยน label = "thinner"
   - เก็บ ~500-1000 ตัวอย่าง
   - เปิดฝากล่อง ระบายอากาศ → รอค่ากลับ baseline

4. บันทึก CSV:
   - ใช้ Arduino Serial Monitor → Copy/Paste เป็น .csv
   - หรือใช้ Python script จับ Serial อัตโนมัติ (ดูด้านล่าง)
```

## 1.5 Python Script จับข้อมูลจาก Serial

```python
# save_serial_to_csv.py
# รันบน PC เพื่อจับข้อมูลจาก ESP32 บันทึกเป็น CSV อัตโนมัติ

import serial
import csv
from datetime import datetime

PORT = "/dev/cu.usbserial-0001"  # ← เปลี่ยนตามพอร์ตของ ESP32
BAUD = 115200
OUTPUT_FILE = f"mq2_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

ser = serial.Serial(PORT, BAUD, timeout=1)
print(f"Recording to {OUTPUT_FILE}... Press Ctrl+C to stop.")

with open(OUTPUT_FILE, "w", newline="") as f:
    writer = csv.writer(f)
    header_written = False
    try:
        while True:
            line = ser.readline().decode("utf-8").strip()
            if line:
                print(line)
                if not header_written:
                    writer.writerow(line.split(","))
                    header_written = True
                else:
                    writer.writerow(line.split(","))
    except KeyboardInterrupt:
        print(f"\nSaved to {OUTPUT_FILE}")
    finally:
        ser.close()
```

## 1.6 ML Training Pipeline (Google Colab)

```python
# ===== Google Colab Notebook: Train E-Nose Model =====
# ตาม Harvard TinyMLx Workflow: Data → Train → Convert → Deploy

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import tensorflow as tf

# === Step 1: Load Data ===
df = pd.read_csv("mq2_data_combined.csv")
print(f"Total samples: {len(df)}")
print(df['label'].value_counts())

# === Step 2: Preprocessing (ตาม Paper 2 — Z-score Standardization) ===
features = ['mq2_raw']  # ตอนมี sensor เดียว, ทีหลังจะเพิ่ม
X = df[features].values
y = df['label'].values

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)
num_classes = len(label_encoder.classes_)
print(f"Classes: {label_encoder.classes_}")

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# === Step 3: Train MLP Neural Network ===
model = tf.keras.Sequential([
    tf.keras.layers.Dense(16, activation='relu', input_shape=(len(features),)),
    tf.keras.layers.Dense(8, activation='relu'),
    tf.keras.layers.Dense(num_classes, activation='softmax')
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

history = model.fit(X_train, y_train, 
                    epochs=100, batch_size=32,
                    validation_split=0.2, verbose=1)

# === Step 4: Evaluate ===
y_pred = np.argmax(model.predict(X_test), axis=1)
print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"\nConfusion Matrix:\n{confusion_matrix(y_test, y_pred)}")
print(f"\nClassification Report:\n{classification_report(y_test, y_pred, target_names=label_encoder.classes_)}")

# === Step 5: Convert to TFLite (ตาม Harvard TinyMLx) ===
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]  # Quantize INT8
tflite_model = converter.convert()

with open("model.tflite", "wb") as f:
    f.write(tflite_model)
print(f"Model size: {len(tflite_model)/1024:.1f} KB")

# === Step 6: Convert to C Array (สำหรับฝังใน ESP32) ===
# รันคำสั่งนี้ใน terminal:
# xxd -i model.tflite > model_data.h
```

---

# 2. 🔬 การ Calibrate เซนเซอร์ MQ-2 (อธิบายละเอียด)

## 2.0 MQ-2 Datasheet Snapshot

MQ-2 เป็นเซนเซอร์กึ่งตัวนำแบบ `SnO2 (Tin Dioxide)` ที่ต้องอาศัยฮีตเตอร์ภายในเพื่อให้ชั้นไวต่อก๊าซทำงานได้เสถียร ตัวเซนเซอร์ตัวนี้เหมาะกับการตรวจจับก๊าซไวไฟและควัน แต่ไม่เหมาะกับการใช้เป็นเครื่องมือวัด ppm แบบ absolute ถ้าไม่ได้คาลิเบรตอย่างจริงจัง

### สิ่งที่ MQ-2 ตรวจจับได้ดี

| ก๊าซ/ไอระเหย | ความเหมาะสม |
|---|---|
| LPG / Propane | ดี |
| Methane / Hydrogen | ดี |
| Smoke | ดี |
| Alcohol / VOC บางชนิด | ปานกลางถึงดี |

### ค่าที่ควรจำจาก datasheet

| รายการ | ค่าใช้งานจริง |
|---|---|
| แรงดันฮีตเตอร์ | 5V |
| สัญญาณออก | Analog voltage |
| ค่าอ้างอิงอากาศสะอาด | `Rs/Ro ≈ 9.83` |
| การอุ่นเครื่องครั้งแรก | 24-48 ชม. |
| การอุ่นก่อนอ่านค่าแต่ละครั้ง | อย่างน้อย 20-30 นาที |

### ข้อจำกัดสำคัญ

- ค่า output เปลี่ยนตามอุณหภูมิ ความชื้น และ airflow
- โมดูลแต่ละตัวให้ค่า `Ro` ไม่เท่ากัน ต้องคาลิเบรตแยก
- ค่า ppm จากเส้นกราฟเป็นค่าประมาณ ต้องใช้ gas-specific curve
- ถ้าโมดูลจ่ายสัญญาณออกเกิน 3.3V ต้องลดระดับก่อนเข้า ESP32

## 2.1 MQ-2 ทำงานอย่างไร? (ทวน)

```
โครงสร้างภายใน MQ-2:

┌─────────────────────────────────┐
│         MQ-2 Module             │
│                                 │
│  ┌──────────────────────────┐   │
│  │   Heater (ขดลวดทำความร้อน)   │   │  ← ใช้ไฟ 5V กินไฟ ~150mA
│  │   อุณหภูมิ ~300-400°C        │   │     ทำให้ร้อนจัด
│  │                          │   │
│  │   ┌──────────────────┐   │   │
│  │   │  แผ่น SnO₂       │   │   │  ← Tin Dioxide Film
│  │   │  (ดีบุกออกไซด์)    │   │   │     เปลี่ยนความต้านทาน
│  │   └──────────────────┘   │   │     เมื่อมีก๊าซมาเกาะ
│  └──────────────────────────┘   │
│                                 │
│  VCC ──→ Heater ──→ GND        │
│                                 │
│  VCC ──→ [RL (Load Resistor)]   │
│          ──→ AOUT ──→ ADC       │  ← อ่านค่า Voltage ตรงนี้
│          ──→ [Rs (Sensor)]      │
│          ──→ GND                │
│                                 │
└─────────────────────────────────┘

- Rs = ความต้านทานของเซนเซอร์ (เปลี่ยนตามก๊าซ)
- RL = Load Resistor (ค่าคงที่ ปกติ 10 KΩ หรือ 20 KΩ)
- อากาศสะอาด: Rs สูง → Voltage ต่ำ
- มีก๊าซ:     Rs ต่ำ  → Voltage สูง
```

## 2.2 ขั้นตอน Calibrate MQ-2

### Step 1: Burn-in (เผาเซนเซอร์ให้เสถียร)

```
- ต่อไฟ 5V เข้า VCC ของ MQ-2
- เปิดทิ้งไว้ 24-48 ชั่วโมง ต่อเนื่อง (ห้ามปิด!)
- ในช่วงนี้ค่า ADC จะแกว่งมากๆ เป็นเรื่องปกติ
- หลัง 24 ชม. ค่าจะเริ่มนิ่ง → พร้อม Calibrate
```

ข้อควรระวัง:
- อย่าวางใกล้พัดลมหรือทางลมที่แรงเกินไป เพราะ airflow ที่ไม่คงที่ทำให้ค่าแกว่ง
- อย่าใช้บอร์ดใหม่ที่ยังไม่ burn-in มาวัด Ro เพราะค่า reference จะเพี้ยนตั้งแต่ต้น

### Step 2: วัดค่า Ro (Resistance in Clean Air)

**Ro คืออะไร?**
- Ro = ค่าความต้านทานของเซนเซอร์ **ในอากาศสะอาด**
- เป็นค่าอ้างอิง (reference) สำหรับคำนวณความเข้มข้นก๊าซ
- **แต่ละตัว MQ-2 มีค่า Ro ไม่เท่ากัน** → ต้อง Calibrate ทีละตัว

```
สูตรคำนวณ:

1. อ่านค่า ADC ในอากาศสะอาด (เปิดหน้าต่าง ไม่มีก๊าซ)
   ADC_clean = ค่าเฉลี่ยจากการอ่าน 100 ครั้ง

2. แปลง ADC → Voltage
   V_sensor = (ADC_clean / 4095.0) × 3.3V

3. คำนวณ Rs (ความต้านทานปัจจุบัน)
   Rs = RL × (Vc - V_sensor) / V_sensor
   
   โดย:
   - RL = Load Resistor บน Module (ปกติ 10KΩ หรือ 20KΩ ดูบน PCB)
   - Vc = Voltage จ่ายเข้า sensor circuit (ปกติ 5V)
   - V_sensor = Voltage ที่อ่านได้จาก AOUT

4. ค่า Rs ที่ได้ในอากาศสะอาด = Ro
   Ro = Rs_clean_air

5. จาก Datasheet: Rs/Ro ในอากาศสะอาดควรอยู่ประมาณ 9.8
   (ดูจากกราฟ ที่ 1000 ppm ของ H₂ จุดตัดกราฟ)
```

ข้อควรระวังตอนหา `Ro`:
- ต้องใช้สภาพอากาศสะอาดจริง ไม่มีกลิ่นทินเนอร์ ควัน หรือแอลกอฮอล์ค้าง
- ควรเก็บอย่างน้อย 100-200 samples แล้วใช้ค่าเฉลี่ย
- ถ้าค่ากระโดดเป็น outlier มาก ให้ตัดค่าผิดปกติออกก่อน
- ถ้าเป็นไปได้ ให้คาลิเบรตซ้ำ 2-3 รอบ แล้วใช้ค่ากลาง

### Step 3: แปลงค่า ADC → ppm

```
จาก Datasheet MQ-2 จะมี "กราฟ Sensitivity Characteristics":

   Rs/Ro
    │
 10 ┤ ╲
    │   ╲____ LPG
  1 ┤      ╲____ Smoke
    │          ╲____ CO
0.1 ┤
    └──┬──┬──┬──┬──┬── ppm
      200 1K 5K 10K

สูตรแปลง (Power Law / Log-Log Linear):

ppm = a × (Rs/Ro)^b

โดยค่า a, b ต่างกันตามชนิดก๊าซ (อ่านจากกราฟ Datasheet):

| ก๊าซ    | a (ค่าประมาณ) | b (ค่าประมาณ) |
|---------|--------------|--------------|
| LPG     | 574.25       | -2.222       |
| Smoke   | 3616.52      | -2.675       |
| CO      | 36974.2      | -3.109       |
| Methane | 4269.6       | -2.648       |

ตัวอย่าง: ถ้าวัดได้ Rs/Ro = 2.5
→ Smoke ppm = 3616.52 × (2.5)^(-2.675) ≈ 287 ppm
```

ข้อสรุปสำคัญ:
- สูตร ppm จากกราฟใช้ได้ดีเฉพาะกรณีที่ gas target ตรงกับกราฟนั้น
- ถ้าใช้ในงานจำแนกคลาสด้วย ML ให้ใช้ `Rs/Ro`, `ADC raw`, หรือ `normalized value` เป็น feature จะปลอดภัยกว่า
- ถ้าจะใช้ ppm จริง ควรคาลิเบรตกับ calibration gas หรือ reference instrument

### Arduino Code สำหรับ Calibrate

```cpp
// ===== MQ-2 Calibration Code =====

#define MQ2_PIN 34
#define RL_VALUE 10.0    // Load Resistance บน Module (KΩ) — ดูบน PCB!
#define VC 5.0           // Voltage จ่ายเข้า sensor circuit
#define CALIBRATION_SAMPLES 100
#define RO_CLEAN_AIR_FACTOR 9.83  // Rs/Ro in clean air จาก Datasheet

float Ro = 0;  // จะคำนวณได้จาก Calibration

// คำนวณ Rs จาก ADC
float calculateRs(int adc_value) {
  float voltage = (adc_value / 4095.0) * 3.3;
  // ถ้า AOUT ผ่านวงจรแบ่งแรงดันแล้ว Vout ไม่เกิน 3.3V ค่อยใช้สูตรนี้
  float rs = RL_VALUE * (VC - voltage) / voltage;
  return rs;
}

// Calibrate: วัด Ro ในอากาศสะอาด
float calibrateMQ2() {
  Serial.println("=== CALIBRATING MQ-2 ===");
  Serial.println("ตรวจสอบว่าอยู่ในอากาศสะอาด (เปิดหน้าต่าง ไม่มีก๊าซ)");
  Serial.println("กำลังวัด...");
  
  float rs_sum = 0;
  for (int i = 0; i < CALIBRATION_SAMPLES; i++) {
    int adc = analogRead(MQ2_PIN);
    rs_sum += calculateRs(adc);
    delay(50);
  }
  float rs_avg = rs_sum / CALIBRATION_SAMPLES;
  
  // Ro = Rs_in_clean_air / RO_CLEAN_AIR_FACTOR
  float ro = rs_avg / RO_CLEAN_AIR_FACTOR;
  
  Serial.print("Rs (clean air) = ");
  Serial.print(rs_avg);
  Serial.println(" KΩ");
  Serial.print("Ro = ");
  Serial.print(ro);
  Serial.println(" KΩ");
  Serial.println("=== CALIBRATION DONE ===\n");
  
  return ro;
}

// แปลง Rs/Ro → ppm (Smoke)
float readSmokePPM(float ro) {
  int adc = analogRead(MQ2_PIN);
  float rs = calculateRs(adc);
  float ratio = rs / ro;
  
  // Power law: ppm = a * (Rs/Ro)^b
  // ค่า a, b สำหรับ Smoke (จาก Datasheet MQ-2)
  float smoke_ppm = 3616.52 * pow(ratio, -2.675);
  return smoke_ppm;
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("MQ-2 Calibration & Reading");
  Serial.println("⚠️ ตรวจสอบว่า Burn-in ครบ 24 ชม. แล้ว!");
  Serial.println();
  
  // Calibrate ในอากาศสะอาด
  Ro = calibrateMQ2();
}

void loop() {
  int adc = analogRead(MQ2_PIN);
  float rs = calculateRs(adc);
  float ratio = rs / Ro;
  float smoke_ppm = readSmokePPM(Ro);
  
  Serial.print("ADC=");
  Serial.print(adc);
  Serial.print(" | Rs=");
  Serial.print(rs, 2);
  Serial.print(" KΩ | Rs/Ro=");
  Serial.print(ratio, 3);
  Serial.print(" | Smoke≈");
  Serial.print(smoke_ppm, 1);
  Serial.println(" ppm");
  
  delay(1000);
}
```

## 2.3 วิธีตรวจสอบการเสื่อมสภาพของเซนเซอร์

### สัญญาณที่บอกว่า MQ-2 เสื่อมสภาพ:

```
┌──────────────────────────────────────────────────────────┐
│         เช็ค 5 สัญญาณเซนเซอร์เสื่อม                       │
│                                                          │
│  1. ✅ Baseline Drift (ค่าพื้นฐานเลื่อน)                   │
│     - วัดค่า ADC ในอากาศสะอาด ทุกสัปดาห์                   │
│     - ถ้าค่า Ro เปลี่ยนไป > ±20% จากตอน Calibrate ครั้งแรก │
│     → เซนเซอร์อาจเสื่อม หรือต้อง Re-calibrate              │
│                                                          │
│  2. ✅ Response Time ช้าลง                                │
│     - ปกติ MQ-2 ตอบสนอง < 10 วินาที                       │
│     - ถ้าเริ่มตอบสนองช้า (> 30 วินาที) → เสื่อม              │
│                                                          │
│  3. ✅ Recovery Time ช้าลง                                │
│     - ปกติหลังเอาก๊าซออก ค่าจะกลับ baseline < 60 วินาที    │
│     - ถ้าใช้เวลา > 5 นาที กลับไม่ถึง baseline → เสื่อม      │
│                                                          │
│  4. ✅ ค่า ADC สูงผิดปกติแม้ในอากาศสะอาด                   │
│     - ถ้าค่า ADC ในอากาศสะอาดสูงกว่าปกติอย่างถาวร          │
│     → แผ่น SnO₂ อาจปนเปื้อน (contamination)              │
│                                                          │
│  5. ✅ Sensitivity ลดลง                                   │
│     - ทดสอบกับควันในปริมาณเท่ากัน                          │
│     - ถ้า ΔV (การเปลี่ยนแปลง Voltage) ลดลงอย่างมาก        │
│     → เซนเซอร์ตอบสนองต่อก๊าซน้อยลง = เสื่อม               │
│                                                          │
│  อายุการใช้งาน MQ-2: ประมาณ 5 ปี (ถ้าใช้ต่อเนื่อง)         │
│  ราคาตัวใหม่: ~70 บาท → เปลี่ยนตัวใหม่ง่ายกว่าซ่อม!        │
└──────────────────────────────────────────────────────────┘
```

### Code ตรวจสอบสุขภาพเซนเซอร์

```cpp
// ===== Sensor Health Check =====

struct SensorHealth {
  float initial_Ro;         // Ro ตอน Calibrate ครั้งแรก
  float current_Ro;         // Ro ปัจจุบัน
  float drift_percent;      // % ที่เปลี่ยนไป
  bool is_healthy;          // ผ่าน/ไม่ผ่าน
  String status_message;
};

SensorHealth checkSensorHealth(float initial_Ro, float current_Ro) {
  SensorHealth health;
  health.initial_Ro = initial_Ro;
  health.current_Ro = current_Ro;
  health.drift_percent = abs(current_Ro - initial_Ro) / initial_Ro * 100.0;
  
  if (health.drift_percent < 10) {
    health.is_healthy = true;
    health.status_message = "✅ ปกติ (Drift < 10%)";
  } else if (health.drift_percent < 20) {
    health.is_healthy = true;
    health.status_message = "⚠️ ควร Re-calibrate (Drift 10-20%)";
  } else {
    health.is_healthy = false;
    health.status_message = "❌ เสื่อมสภาพ! (Drift > 20%) ควรเปลี่ยนตัวใหม่";
  }
  
  return health;
}
```

## 2.4 วิธี Validate ความถูกต้อง (ไม่มี Calibration Gas)

เนื่องจาก Calibration Gas มีราคาสูง (~5,000-20,000 บาท) สำหรับโปรเจคจบสามารถใช้วิธี **Relative Validation** ได้:

| วิธี | รายละเอียด | ข้อดี/ข้อเสีย |
|------|-----------|-------------|
| **Cross-reference กับ SEN55** | ใช้ค่า VOC Index จาก SEN55 เทียบกับค่า MQ → ถ้าเทรนด์ตรงกัน แสดงว่า MQ อ่านถูก | ✅ ทำได้เลย, ❌ ไม่ได้ค่า absolute |
| **Relative Change Test** | ใช้ทินเนอร์ปริมาณเท่ากัน (เช่น 1 หยด) ทดสอบซ้ำ 5 ครั้ง → ถ้าค่า ΔV ใกล้กัน (CV < 10%) แสดงว่า repeatable | ✅ ง่ายมาก |
| **Known Source Test** | ใช้ "แก๊สไฟแช็ค" (Butane) ซึ่งมีความเข้มข้นค่อนข้างคงที่ เป็น reference source | ✅ ราคาถูก |
| **เปรียบเทียบ 2 ตัว** | ซื้อ MQ-2 มา 2 ตัว → อ่านค่าพร้อมกัน → ถ้าค่าใกล้กัน (ต่างกัน < 15%) แสดงว่าทั้งคู่ทำงานถูก | ✅ ง่าย, ❌ ต้องซื้อเพิ่ม |

> [!TIP]
> **สำหรับโปรเจคจบ:** ในรูปเล่มให้เขียนว่า
> *"การ Calibrate ใช้วิธี Relative Calibration โดยวัดค่า Ro ในอากาศสะอาดเป็น Baseline แล้วคำนวณ Rs/Ro Ratio ตาม Datasheet ซึ่งเป็นวิธีที่ยอมรับได้ในระดับ Low-cost Sensor ตามแนวทางของ [Paper 2]"*

## 2.5 วิธีใช้งานให้แม่นที่สุด

1. เปิดอุ่นเครื่องทุกครั้งก่อนอ่านค่าอย่างน้อย 20-30 นาที
2. ใช้แหล่งจ่ายไฟ 5V ที่นิ่ง โดยเฉพาะขา heater
3. อ่านค่า ADC หลายครั้งแล้วทำ moving average หรือ median filter
4. เก็บ calibration ในสภาพแวดล้อมเดียวกับที่จะใช้งานจริง
5. อย่าเปลี่ยน `RL` โดยไม่แก้สูตรคำนวณ `Rs`
6. ถ้าเซนเซอร์เริ่ม drift มากกว่าเดิมชัดเจน ให้คาลิเบรต `Ro` ใหม่

### ค่าที่มักทำให้ค่าวัดเพี้ยน

- ความชื้นสูงหรือเปลี่ยนเร็ว
- อุณหภูมิแกว่ง
- ลมพัดผ่านเซนเซอร์ไม่สม่ำเสมอ
- มี VOC ปะปนจากสารทำความสะอาด
- ไฟเลี้ยงกระพริบหรือร่วงตอน heater ทำงาน
- ใช้โมดูลที่ output เกินช่วง ADC ของ ESP32 โดยไม่ลดระดับ

---

# 3. 📚 Harvard TinyMLx คืออะไร? (อธิบายละเอียด)

## 3.1 ภาพรวม

```
Harvard TinyMLx = คอร์สออนไลน์ ฟรี บน edX
สอนโดย Harvard University + Google (TensorFlow Team)

ชื่อเต็ม: "Tiny Machine Learning (TinyML)" — รหัส CS249r
แบ่งเป็น 3 ส่วน:
  1. Fundamentals of TinyML
  2. Applications of TinyML  
  3. Deploying TinyML

เว็บไซต์: https://www.edx.org/professional-certificate/harvardx-tiny-machine-learning
```

## 3.2 TinyML คืออะไร?

```
┌──────────────────────────────────────────────────┐
│              Machine Learning ทั่วไป               │
│                                                  │
│  Cloud / Server (GPU)                            │
│  ┌──────────────────────────────────────────┐     │
│  │  CPU: Intel Xeon / GPU: NVIDIA A100     │     │
│  │  RAM: 32-256 GB                         │     │
│  │  Model Size: 100 MB - หลาย GB           │     │
│  │  Power: 200-500 Watts                   │     │
│  └──────────────────────────────────────────┘     │
│                     ↕ Internet                   │
│              ต้องส่งข้อมูลขึ้น Cloud               │
│              Latency: 100-1000 ms                │
└──────────────────────────────────────────────────┘

                    VS

┌──────────────────────────────────────────────────┐
│              ⭐ TinyML (Tiny Machine Learning)    │
│                                                  │
│  Microcontroller (ESP32, Arduino)                │
│  ┌──────────────────────────────────────────┐     │
│  │  CPU: 240 MHz (ไม่มี GPU!)              │     │
│  │  RAM: 512 KB (ไม่ใช่ GB!)               │     │
│  │  Model Size: 10-200 KB                  │     │
│  │  Power: 0.1-0.5 Watts (ประหยัดมาก!)     │     │
│  └──────────────────────────────────────────┘     │
│              ไม่ต้องต่อ Internet!                  │
│              ประมวลผลเองได้เลย (Edge AI)          │
│              Latency: < 10 ms                    │
└──────────────────────────────────────────────────┘
```

## 3.3 Workflow ของ Harvard TinyMLx (ที่โปรเจคเราจะใช้)

```
┌────────────────────────────────────────────────────────────────┐
│                  Harvard TinyMLx Workflow                       │
│                                                                │
│  Step 1: DATA COLLECTION                                       │
│  ┌─────────────────────────────────────┐                       │
│  │ ESP32 + MQ-2 → Serial → PC → CSV   │                       │
│  │ เก็บข้อมูลแต่ละ Class              │                       │
│  └──────────────┬──────────────────────┘                       │
│                 ↓                                              │
│  Step 2: MODEL TRAINING (บน PC / Google Colab)                 │
│  ┌─────────────────────────────────────┐                       │
│  │ Python + TensorFlow/Keras           │                       │
│  │ Train Neural Network (MLP)          │                       │
│  │ ผลลัพธ์: model.h5                   │                       │
│  └──────────────┬──────────────────────┘                       │
│                 ↓                                              │
│  Step 3: CONVERT (แปลงให้เล็กพอใส่ MCU)                        │
│  ┌─────────────────────────────────────┐                       │
│  │ Keras .h5 → TFLite .tflite          │                       │
│  │ Quantize INT8 (ลดขนาด ~4 เท่า)     │                       │
│  │ xxd -i model.tflite > model_data.h  │                       │
│  │ (แปลงเป็น C Array)                  │                       │
│  └──────────────┬──────────────────────┘                       │
│                 ↓                                              │
│  Step 4: DEPLOY (ฝังลง Microcontroller)                        │
│  ┌─────────────────────────────────────┐                       │
│  │ Arduino IDE / PlatformIO            │                       │
│  │ #include "model_data.h"             │                       │
│  │ ใช้ TensorFlow Lite Micro library   │                       │
│  │ สร้าง tflite::MicroInterpreter      │                       │
│  │ อ่าน sensor → normalize → inference │                       │
│  │ ได้ผลลัพธ์ Classification ทันที!     │                       │
│  └─────────────────────────────────────┘                       │
│                                                                │
│  📌 Library ที่ใช้:                                             │
│  - Harvard_TinyMLx (สำหรับ Arduino Nano 33 BLE)                │
│  - TensorFlow Lite Micro (สำหรับ ESP32 ← ใช้ตัวนี้!)           │
│  - EloquentTinyML (ตัวช่วยใช้ TFLite บน ESP32 ง่ายขึ้น)        │
│                                                                │
│  ⚠️ Harvard_TinyMLx Library ไม่รองรับ ESP32 โดยตรง             │
│  แต่ Workflow เหมือนกันทุกประการ!                                │
│  ใช้ TensorFlow Lite Micro แทนได้เลย                           │
└────────────────────────────────────────────────────────────────┘
```

## 3.4 สิ่งที่จะเขียนในรูปเล่มโปรเจคจบ

> ในรูปเล่ม **บทที่ 3 (วิธีดำเนินการวิจัย)** ให้เขียนว่า:
>
> *"โปรเจคนี้พัฒนาตามแนวทาง TinyML (Tiny Machine Learning) ที่สอนในหลักสูตร Harvard TinyMLx (CS249r) โดยใช้กระบวนการ End-to-End Machine Learning Pipeline ประกอบด้วย 4 ขั้นตอน: (1) Data Collection จาก Sensor Array (2) Model Training ด้วย TensorFlow/Keras บน Google Colab (3) Model Conversion เป็น TensorFlow Lite พร้อม INT8 Quantization (4) Deployment ลงบน ESP32 ผ่าน TensorFlow Lite for Microcontrollers ซึ่งเป็น core framework เดียวกับที่ใช้ในหลักสูตร Harvard TinyMLx"*

---

# 4. 📦 การสร้าง Test Chamber จำลองในห้อง Lab

## 4.1 แบบแปลนกล่องจำลอง

```
                ← ขนาดประมาณ 30×20×20 cm →
                
        ┌────────────────────────────────────┐
        │           ฝาปิด (ถอดได้)            │
        │    ┌──────────────────────────┐     │
        │    │                          │     │
        │    │   🔴 MQ-2               │     │  ← ห้อยหรือยึด
        │    │   Sensor                 │     │     ไว้กลางกล่อง
        │    │                          │     │     (ไม่ให้ติดผนัง)
        │    │           💨              │     │
        │    │    ┌──────────────┐       │     │
        │    │    │ ตำแหน่งวาง   │       │     │  ← วางสำลี/ธูป
        │    │    │ สารทดสอบ      │       │     │     ตรงนี้
        │    │    └──────────────┘       │     │
        │    │                          │     │
        │    └──────────────────────────┘     │
        │                                    │
        │  🔌 สายไฟ ESP32 ลอดออกรูเล็กๆ      │
        └────────────────────────────────────┘
              ↑
            รูเล็กๆ สำหรับ:
            1. สาย USB ของ ESP32
            2. รูใส่สารทดสอบ (เปิด/ปิดได้)
```

## 4.2 วัสดุที่ต้องใช้

| วัสดุ | ราคาประมาณ | หมายเหตุ |
|-------|-----------|---------|
| **กล่องพลาสติกใส** (มีฝาปิด) | ~50-100 ฿ | ขนาดประมาณ 30×20×20 cm, ไม่ต้องอากาศรั่ว 100% |
| **กาวซิลิโคน** | ~50 ฿ | อุดรอยรั่วรอบรูสาย |
| **สาย Jumper ยาว** | ~30 ฿ | ลอดออกจากกล่อง |
| **สำลี** | ~20 ฿ | สำหรับหยดทินเนอร์ |
| **ธูป / กระดาษทิชชู่** | ~10 ฿ | สำหรับจำลองควัน |
| **ทินเนอร์เล็ก** | ~30 ฿ | สำหรับจำลอง VOC |
| **พัดลมเล็ก USB** (optional) | ~50 ฿ | ช่วยกระจายก๊าซในกล่อง |
| **รวม** | **~250 ฿** | |

## 4.3 วิธีจำลองสถานการณ์

```
Protocol การเก็บข้อมูลแต่ละ Class:

═══════════════════════════════════════════════
 Class 0: Clean Air (อากาศสะอาด) 🟢
═══════════════════════════════════════════════
 1. เปิดฝากล่อง → ให้อากาศบริสุทธิ์เข้า
 2. รอ 2-3 นาที ให้ค่าเสถียร
 3. ปิดฝากล่อง
 4. เก็บข้อมูล 500-1000 ตัวอย่าง (~8-16 นาที)

═══════════════════════════════════════════════
 Class 1: Smoke (ควัน) 🔴
═══════════════════════════════════════════════
 1. เปิดฝากล่อง → เตรียมธูปหรือกระดาษทิชชู่
 2. จุดไฟ แล้วใส่เข้ากล่อง → ปิดฝา
 3. รอ 30 วินาที ให้ควันกระจาย
 4. เก็บข้อมูล 500-1000 ตัวอย่าง
 5. ⚠️ เปิดฝา + ระบายอากาศ ก่อนเก็บ Class ถัดไป
    → รอจนค่า ADC กลับมาใกล้ baseline (5-10 นาที)

═══════════════════════════════════════════════
 Class 2: Thinner / VOC 🟡
═══════════════════════════════════════════════
 1. เปิดฝากล่อง → เตรียมสำลีหยดทินเนอร์ 2-3 หยด
 2. ใส่สำลีเข้ากล่อง → ปิดฝา
 3. รอ 30 วินาที ให้ไอระเหยกระจาย
 4. เก็บข้อมูล 500-1000 ตัวอย่าง
 5. ⚠️ เปิดฝา + ระบายอากาศ + ทิ้งสำลี
    → รอจนค่า ADC กลับมาใกล้ baseline

═══════════════════════════════════════════════
 ⚠️ ข้อควรระวังด้านความปลอดภัย:
═══════════════════════════════════════════════
 - ทำในห้องที่มีอากาศถ่ายเท ไม่ใช่ห้องปิด
 - สวมหน้ากากเมื่อใช้ทินเนอร์
 - ไม่จุดไฟใกล้ทินเนอร์! (ไวไฟมาก)
 - ทิ้งระยะเวลาระหว่าง Class ให้เพียงพอ
```

## 4.4 ตารางเวลาเก็บข้อมูล (ตัวอย่าง 1 วัน)

| เวลา | กิจกรรม | จำนวนตัวอย่าง |
|------|---------|-------------|
| 09:00-09:30 | Burn-in check + Calibrate Ro | - |
| 09:30-09:45 | เก็บ Class 0 (Clean Air) | 500 |
| 09:45-10:00 | ระบายอากาศ | - |
| 10:00-10:20 | เก็บ Class 1 (Smoke) — ความเข้มข้นต่ำ | 300 |
| 10:20-10:35 | ระบายอากาศ | - |
| 10:35-10:55 | เก็บ Class 1 (Smoke) — ความเข้มข้นสูง | 300 |
| 10:55-11:15 | ระบายอากาศ (นานขึ้น เพราะจะเปลี่ยนสาร) | - |
| 11:15-11:35 | เก็บ Class 2 (Thinner) — ทินเนอร์ 1 หยด | 300 |
| 11:35-11:50 | ระบายอากาศ | - |
| 11:50-12:10 | เก็บ Class 2 (Thinner) — ทินเนอร์ 3 หยด | 300 |
| 12:10-12:30 | ระบายอากาศ + ตรวจสอบข้อมูล | - |
| **รวม** | | **~1,700 ตัวอย่าง** |

> [!TIP]
> **เคล็ดลับ:** เก็บข้อมูลหลายความเข้มข้น (เช่น ทินเนอร์ 1 หยด vs 3 หยด) จะทำให้โมเดล ML แม่นยำขึ้น เพราะเรียนรู้ทั้งความเข้มข้นต่ำและสูง

---

## 📋 สรุป Next Steps

| ลำดับ | สิ่งที่ต้องทำ | ระยะเวลา |
|-------|-------------|---------|
| 1 | **Burn-in MQ-2** — ต่อไฟ 5V เปิดทิ้ง 24-48 ชม. | วันที่ 1-2 |
| 2 | **Calibrate MQ-2** — วัด Ro ในอากาศสะอาด | วันที่ 3 |
| 3 | **สร้าง Test Chamber** — กล่องพลาสติก + ยึด sensor | วันที่ 3 |
| 4 | **เก็บข้อมูล 3 Class** ในกล่องจำลอง | วันที่ 4-5 |
| 5 | **Train ML Model** บน Google Colab | วันที่ 6 |
| 6 | **Deploy ลง ESP32** ด้วย TFLite Micro | วันที่ 7-8 |
| 7 | **ทดสอบ Real-time Classification** | วันที่ 9-10 |
