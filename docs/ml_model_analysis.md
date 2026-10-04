# 🔬 วิเคราะห์ ML Model — ดีพอแล้วหรือยัง? มีวิธีที่ดีกว่าไหม?

> วิเคราะห์แนวทาง ML ที่วางแผนไว้ vs ทางเลือกอื่น สำหรับการวัดคุณภาพอากาศห้องพ่นสีฝุ่น

---

## 1. สิ่งที่วางแผนไว้ตอนนี้ (สรุป)

```
Input:   MQ-3, MQ-135, MQ-2, MiCS-6814(×3), Temp, Humidity, PM2.5, PM10
         → Feature Vector 10 มิติ

Model:   MLP Neural Network (Dense 16 → 8 → 4)
         → TFLite Micro INT8 Quantized (~100 KB)

Output:  Classification 4 classes
         Class 0: อากาศสะอาด
         Class 1: ฝุ่นสี
         Class 2: ทินเนอร์/VOC
         Class 3: ควัน/อันตราย

Deploy:  ESP32 → inference ทุก 5 วินาที
```

---

## 2. การให้คะแนนแนวทางปัจจุบัน

### ✅ จุดที่ดีแล้ว

| หัวข้อ | เหตุผล |
|---|---|
| **ใช้ Sensor Array** หลายตัว | ตรงกับหลักการ E-Nose ใน paper ทุกฉบับ ดีกว่าใช้ตัวเดียว |
| **เลือก MLP** สำหรับ deploy | MLP แปลงเป็น TFLite ได้ง่ายที่สุด ขนาดเล็ก inference เร็ว |
| **Quantize INT8** | ลดขนาดโมเดล 4 เท่า ประหยัด RAM บน MCU |
| **ใช้ StandardScaler** | ถูกต้อง เพราะ MQ sensor แต่ละตัวมีสเกลต่างกันมาก |
| **มี T/RH เป็น feature** | ช่วย compensate sensor drift จากสภาพแวดล้อม |

### ⚠️ จุดที่มีปัญหา — แบ่งเป็น 5 เรื่อง

---

### ปัญหาที่ 1: Feature ที่เลือกยังไม่ดีพอ

```
ตอนนี้ใช้:    [MQ3_ADC, MQ135_ADC, MQ2_ADC, ...]
ใน MQ-2.md:   แนะนำ Rs/Ro, mq2_delta, mq2_avg
```

**ทำไม raw ADC ไม่ดีพอ:**

```
Sensor ตัว A:  ADC clean air = 200,  ADC smoke = 800   → ΔV = 600
Sensor ตัว B:  ADC clean air = 350,  ADC smoke = 950   → ΔV = 600

ค่า ADC ต่างกัน แต่ response เท่ากัน!
ถ้าใช้ raw ADC → โมเดลจะสับสนเมื่อเปลี่ยนตัว sensor
ถ้าใช้ Rs/Ro   → ค่า normalized เท่ากันทุกตัว ✅
```

**Feature ที่ควรใช้จริง (เรียงตามความสำคัญ):**

| Feature | สูตร | ทำไมดีกว่า ADC ดิบ |
|---|---|---|
| `Rs/Ro` | `(Vc-Vout)/Vout × RL/Ro` | **Normalize ตามตัว sensor** — ข้ามปัญหา unit variation |
| `delta` | `current - baseline` | **วัดการเปลี่ยนแปลง** — ไม่สนว่า baseline อยู่ตรงไหน |
| `ratio_to_baseline` | `current / baseline` | **เปรียบเทียบเป็นสัดส่วน** — ใกล้เคียง Rs/Ro |
| `slope` (ΔV/Δt) | `(V[t] - V[t-n]) / n` | **จับ temporal pattern** — ก๊าซเพิ่มขึ้นเร็วหรือช้า |
| `T, RH` | จาก DHT22/SEN55 | **Compensation** — MQ drift ตาม T/RH |

> [!TIP]
> **คำแนะนำ:** ใช้ทั้ง raw ADC **และ** Rs/Ro **และ** delta เป็น feature พร้อมกัน → ให้โมเดลเลือกเองว่าอะไรสำคัญ (ใช้ Feature Importance จาก Random Forest ช่วยวิเคราะห์)

---

### ปัญหาที่ 2: 4-class Classification อาจไม่เหมาะกับ use case จริง

**สถานการณ์จริงในห้องพ่นสี:**

```
ความเป็นจริง:
  ✗ ก๊าซไม่ได้มาทีละชนิดแบบใน chamber จำลอง
  ✗ ฝุ่นสี + ทินเนอร์ มักมาพร้อมกัน (Mixed)
  ✗ ความเข้มข้นค่อยๆ เพิ่ม ไม่ได้กระโดด step function

สิ่งที่โมเดลเรียนรู้ใน chamber:
  ✓ Class 0 = ไม่มีอะไรเลย
  ✓ Class 1 = ฝุ่นสีอย่างเดียว
  ✓ Class 2 = ทินเนอร์อย่างเดียว
  ✓ Class 3 = ควันอย่างเดียว

สิ่งที่เจอในโรงงานจริง:
  ? ฝุ่นสี + ทินเนอร์ปนกัน → โมเดลจะจัดเป็น class ไหน?
  ? ทินเนอร์ความเข้มข้นต่ำมากๆ → โมเดลจะเห็นเป็น clean air?
  ? อากาศเปลี่ยนช้าๆ → โมเดลจะ switch class ไปมารัวๆ?
```

**ปัญหาหลัก:** Classification 4 class **บังคับให้เลือก 1 คำตอบ** แต่ความเป็นจริงคือหลายสารมาพร้อมกัน

---

### ปัญหาที่ 3: โมเดล MLP ที่ออกแบบไว้เล็กเกินไป

```python
model = Sequential([
    Dense(16, activation='relu', input_shape=(10,)),  # 10 features
    Dense(8, activation='relu'),
    Dense(4, activation='softmax')                     # 4 classes
])
# Total params: ~300
```

**ปัญหา:**
- 300 parameters สำหรับ 10 features → **อาจ underfit** ถ้า pattern ซับซ้อน
- ไม่มี **Dropout** → เสี่ยง overfit กับ training data
- ไม่มี **Batch Normalization** → ค่าจาก sensor แต่ละตัวอาจมี distribution ต่างกันมาก
- ไม่ได้ใช้ **temporal information** (ค่าก่อนหน้า) → เสียข้อมูลเรื่อง "แนวโน้ม"

---

### ปัญหาที่ 4: Accuracy จาก Paper ≠ Accuracy ที่จะได้จริง

| ใน Paper (IEEE) | ในโปรเจคของเรา |
|---|---|
| ใช้ calibration gas ที่รู้ ppm แน่นอน | ใช้ "2-3 หยดทินเนอร์" |
| ควบคุม T/RH ใน chamber | ไม่มีการควบคุม T/RH |
| Sensor ชุดเดียว ไม่เปลี่ยน | อาจเปลี่ยนตัว sensor ได้ |
| Dataset หลายพัน samples | เป้าหมาย 500-1000 (อาจน้อย) |
| Accuracy >99% | **คาดหวังจริง: ~80-90%** ← ซึ่งก็ดีพอ! |

> [!IMPORTANT]
> accuracy 80-90% ไม่ได้แปลว่าแย่ — แต่ต้อง **ตั้งความคาดหวังให้ถูก** ไม่ควรเขียนในรูปเล่มว่า "คาดว่าจะได้ >99% ตาม paper"

---

### ปัญหาที่ 5: Train/Test Split ที่ใช้มี Data Leakage

```python
# ตอนนี้:
X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)
```

**ปัญหา:** ข้อมูลจาก session เดียวกัน (เช่น ควัน session #1) จะถูกแบ่งไปทั้ง train และ test → โมเดล "จำ" pattern ของ session นั้นได้ → accuracy สูงเกินจริง

**วิธีที่ถูกต้อง:**
```python
# ✅ Session-based split (Leave-One-Session-Out)
# session 1-8 → train
# session 9-10 → test
# ไม่มีข้อมูลจาก session เดียวกันอยู่ทั้ง 2 ฝั่ง
```

---

## 3. ทางเลือกอื่นที่ควรพิจารณา

### 🅰️ ทางเลือก A: ไม่ใช้ ML เลย — ใช้ Threshold Rules

```
IF PM2.5 > 25 µg/m³           → แจ้งเตือนฝุ่น
IF MQ3_Rs/Ro < 2.0             → แจ้งเตือน VOC/ทินเนอร์  
IF MQ2_Rs/Ro < 1.5             → แจ้งเตือนควัน
IF CO_ppm > 25                 → แจ้งเตือน CO
IF ทุกค่าปกติ                   → อากาศสะอาด
```

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ เข้าใจง่าย อธิบายได้ | ❌ ไม่สามารถแยกก๊าซผสมได้ |
| ✅ ไม่ต้อง train ไม่ต้องเก็บ dataset | ❌ threshold ตายตัว ไม่ adaptive |
| ✅ ใช้ RAM น้อยมาก | ❌ ไม่มี "ความฉลาด" ไม่ใช่งานวิจัย |
| ✅ debug ง่าย | ❌ ไม่แยก "ฝุ่นสี" กับ "ฝุ่นทั่วไป" |

**เหมาะกับ:** ผลิตภัณฑ์ใช้จริง แต่ **ไม่เหมาะกับโปรเจคจบ** เพราะไม่มี ML ให้เขียนรายงาน

---

### 🅱️ ทางเลือก B: Hybrid (Threshold + ML Anomaly Detection) ⭐⭐⭐

```
Layer 1 — Threshold (ตัดสินใจทันที):
  IF PM2.5 > 50   → DANGER (ไม่ต้องรอ ML)
  IF CO > 25 ppm  → DANGER (ไม่ต้องรอ ML)

Layer 2 — ML Classification (จำแนกละเอียด):
  ถ้า threshold ไม่ trigger → ส่งเข้า ML model
  ML บอกว่า: "ฝุ่นสี", "ทินเนอร์", "ปกติ"

Layer 3 — Confidence Check:
  ถ้า ML confidence < 70% → แจ้ง "ไม่แน่ใจ" ไม่ฟันธง
```

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ **ปลอดภัยที่สุด** — ค่าอันตรายจัดถูก threshold จับทันที | ❌ ซับซ้อนกว่า pure ML |
| ✅ ML ทำหน้าที่ "เสริม" ไม่ใช่ "ตัดสินใจคนเดียว" | ❌ ต้อง tune ทั้ง threshold + model |
| ✅ อธิบายได้ (explainable) | |
| ✅ ยังเขียนรายงาน ML ได้เต็มที่ | |
| ✅ ลด false negative (ไม่พลาดอันตราย) | |

> [!TIP]
> **นี่คือแนวทางที่แนะนำมากที่สุด** — ใช้ได้จริง ปลอดภัย และยังมี ML ให้เขียนรายงาน

---

### 🅲 ทางเลือก C: Multi-Output Regression (ทำนาย ppm แทน class)

```
Input:   [MQ3_Rs/Ro, MQ135_Rs/Ro, MQ2_Rs/Ro, MiCS_CO, ...]
Output:  [estimated_VOC_ppm, estimated_PM25, estimated_CO_ppm]
         → ค่าตัวเลขต่อเนื่อง ไม่ใช่ class
```

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ ได้ค่า "ตัวเลข" ที่ actionable | ❌ **ต้องมี reference instrument** เพื่อสร้าง ground truth |
| ✅ ไม่ต้องกังวลเรื่อง mixed classes | ❌ MQ sensor ไม่แม่นพอจะทำนาย ppm จริง |
| ✅ เปรียบเทียบกับมาตรฐานได้ตรงๆ | ❌ ถ้าค่า ppm ผิด → อันตราย |

**ปัญหาหลัก:** ต้องมี **เครื่องมือวัดมาตรฐาน** (เช่น PID detector ราคา 50,000+ บาท) มาสร้าง ground truth → **ไม่เหมาะกับงบโปรเจคจบ**

---

### 🅳 ทางเลือก D: 1D-CNN บน Time-Series Window

```
แทนที่จะใช้ค่า ณ เวลาเดียว:
  [MQ3, MQ135, MQ2, ...] ← snapshot เดียว

ใช้ค่าหลายเวลาต่อเนื่อง (time window):
  [MQ3_t-9, MQ3_t-8, ..., MQ3_t-0,
   MQ135_t-9, MQ135_t-8, ..., MQ135_t-0,
   ...]
  ← 10 timesteps × 6 sensors = 60 features

ส่งเข้า 1D-CNN:
  Conv1D(16) → Conv1D(8) → Flatten → Dense(4)
```

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ **จับ pattern เวลาได้** (ควันขึ้นเร็ว ทินเนอร์ขึ้นช้า) | ❌ โมเดลใหญ่ขึ้น (~200-500 KB) |
| ✅ แยก "กำลังเพิ่ม" กับ "คงที่" ได้ | ❌ ต้องเก็บ buffer 10 timesteps ใน RAM |
| ✅ ลด false positive จากค่ากระโดดชั่วครู่ | ❌ ซับซ้อนกว่า MLP มาก |
| ✅ Paper support เยอะ | ❌ อาจไม่พอดีกับ RAM ของ ESP32 Classic |

**เหมาะกับ:** โปรเจคที่ต้องการ **"novelty"** ทางวิชาการ — แต่ยากขึ้นมากในการ implement

---

### 🅴 ทางเลือก E: Autoencoder Anomaly Detection

```
แนวคิด: ไม่ต้องรู้ว่า "อันตรายหน้าตาเป็นอย่างไร"
         แค่เรียนรู้ว่า "ปกติหน้าตาเป็นอย่างไร"
         ถ้าค่าผิดจากปกติ → แจ้งเตือน

Autoencoder:
  Encoder: [10] → [8] → [4]  (บีบอัด)
  Decoder: [4] → [8] → [10]  (คลายกลับ)
  
  Loss = MSE(input, output)
  ถ้า Loss > threshold → "ผิดปกติ!"
```

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ **Train ด้วย clean air อย่างเดียวก็พอ!** | ❌ ไม่บอกว่าผิดปกติ "เพราะอะไร" |
| ✅ ตรวจจับ "สิ่งใหม่" ที่ไม่เคยเห็นได้ | ❌ ต้อง tune anomaly threshold |
| ✅ เก็บ data ง่ายมาก (แค่ clean air) | ❌ ไม่แยกประเภท (ฝุ่น/ทินเนอร์/ควัน) |
| ✅ ขนาดเล็ก (~50-100 KB) | ❌ อาจ sensitive เกินไปกับ sensor drift |

**เหมาะกับ:** ระบบ early warning ที่ไม่ต้องจำแนกประเภท — **ใช้ร่วมกับ Hybrid ได้ดีมาก**

---

## 4. ตารางเปรียบเทียบทุกแนวทาง

| เกณฑ์ | A: Threshold | **B: Hybrid** ⭐ | C: Regression | D: 1D-CNN | E: Autoencoder | ปัจจุบัน: MLP |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **ความปลอดภัย** | 🟢 สูง | **🟢 สูงสุด** | 🟡 กลาง | 🟡 กลาง | 🟡 กลาง | 🟡 กลาง |
| **Accuracy** | 🟡 ต่ำ | **🟢 สูง** | 🟡 กลาง | 🟢 สูง | — (anomaly) | 🟡-🟢 |
| **ความซับซ้อน** | 🟢 ง่ายมาก | **🟡 ปานกลาง** | 🔴 ยาก | 🔴 ยากมาก | 🟡 ปานกลาง | 🟡 ปานกลาง |
| **RAM ที่ใช้** | 🟢 <1 KB | **🟡 ~100 KB** | 🟡 ~100 KB | 🔴 ~300+ KB | 🟡 ~80 KB | 🟡 ~100 KB |
| **Data ที่ต้องเก็บ** | 🟢 ไม่ต้อง | **🟡 500+/class** | 🔴 ต้องมี ref | 🟡 500+/class | 🟢 clean air | 🟡 500+/class |
| **Explainability** | 🟢 สูงมาก | **🟢 สูง** | 🟡 กลาง | 🔴 ต่ำ | 🔴 ต่ำ | 🟡 กลาง |
| **เหมาะโปรเจคจบ** | ❌ ไม่มี ML | **✅✅ ดีที่สุด** | ❌ ขาด ref | ⚠️ ยากเกิน | ⚠️ ไม่แยกประเภท | ✅ ใช้ได้ |
| **Deploy ง่าย** | 🟢 ง่ายมาก | **🟢 ง่าย** | 🟢 ง่าย | 🟡 ปานกลาง | 🟢 ง่าย | 🟢 ง่าย |

---

## 5. คำแนะนำสุดท้าย

### แนวทางที่แนะนำ: **Hybrid (B)** = Threshold + MLP Classification

```
┌─────────────────────────────────────────────────────────┐
│                  Hybrid Air Quality System                │
│                                                           │
│  Sensor Array อ่านค่าทุก 5 วินาที                          │
│       ↓                                                   │
│  ┌─────────────────────────────────────┐                  │
│  │  Layer 1: HARD THRESHOLD            │ ← ทำงานก่อน     │
│  │  PM2.5 > 50?  → 🔴 DANGER          │    ไม่รอ ML     │
│  │  CO > 25 ppm? → 🔴 DANGER          │                  │
│  │  MQ ทุกตัวพุ่งพร้อมกัน? → 🔴       │                  │
│  └──────────┬──────────────────────────┘                  │
│             │ (ถ้าไม่ trigger)                             │
│             ↓                                             │
│  ┌─────────────────────────────────────┐                  │
│  │  Layer 2: ML CLASSIFICATION         │ ← ละเอียดขึ้น   │
│  │  Features: Rs/Ro, delta, T, RH      │                  │
│  │  MLP: [20] → [12] → [4]            │                  │
│  │  + Dropout 0.2                      │                  │
│  │                                     │                  │
│  │  Output + Confidence:               │                  │
│  │  "ฝุ่นสี" (87%)  → 🟡 WARNING      │                  │
│  │  "ทินเนอร์" (92%) → 🟠 ALERT      │                  │
│  │  "ปกติ" (95%)     → 🟢 OK         │                  │
│  └──────────┬──────────────────────────┘                  │
│             │                                             │
│             ↓                                             │
│  ┌─────────────────────────────────────┐                  │
│  │  Layer 3: CONFIDENCE FILTER         │ ← ป้องกัน       │
│  │  ถ้า confidence < 70%               │   false alarm    │
│  │  → แจ้ง "ไม่แน่ใจ" + log ไว้ดู     │                  │
│  │  ถ้า confidence ≥ 70%               │                  │
│  │  → ดำเนินการตาม class              │                  │
│  └─────────────────────────────────────┘                  │
│                                                           │
│  📊 ทุกค่า log ขึ้น Dashboard ตลอด                         │
└─────────────────────────────────────────────────────────┘
```

### MLP ที่ปรับปรุงแล้ว

```python
# ✅ ปรับปรุงจากเดิม
model = tf.keras.Sequential([
    tf.keras.layers.Dense(20, activation='relu', input_shape=(num_features,)),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(12, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(num_classes, activation='softmax')
])

# ✅ ใช้ learning rate scheduler
optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
model.compile(optimizer=optimizer,
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# ✅ เพิ่ม EarlyStopping + ReduceLROnPlateau
callbacks = [
    tf.keras.callbacks.EarlyStopping(patience=15, restore_best_weights=True),
    tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5)
]

history = model.fit(X_train, y_train,
                    epochs=200, batch_size=32,
                    validation_split=0.2,
                    callbacks=callbacks)
```

### Feature ที่ควรใช้

```python
# ✅ Feature engineering ที่ดีกว่า raw ADC
features_per_sensor = {
    'mq2': ['mq2_rs_ro', 'mq2_delta', 'mq2_avg_10'],
    'mq3': ['mq3_rs_ro', 'mq3_delta', 'mq3_avg_10'],
    'mq135': ['mq135_rs_ro', 'mq135_delta', 'mq135_avg_10'],
    'mics_co': ['mics_co_rs_ro', 'mics_co_delta'],
    'mics_no2': ['mics_no2_rs_ro', 'mics_no2_delta'],
    'mics_nh3': ['mics_nh3_rs_ro', 'mics_nh3_delta'],
    'env': ['temperature', 'humidity'],
    'pm': ['pm25']  # ถ้ามี PMS5003/SEN55
}
# Total: ~20 features → ให้ Random Forest ทำ Feature Importance
# แล้วค่อย prune เหลือ 10-12 ตัวที่สำคัญที่สุด
```

---

## 6. สรุปตอบคำถาม

| คำถาม | คำตอบ |
|---|---|
| **โมเดลตอนนี้ดีพอไหม?** | ใช้ได้ แต่มี **4 จุดที่ควรปรับ**: feature (ใช้ Rs/Ro), model (เพิ่ม Dropout/BN), split (session-based), ตั้ง expectation ถูก |
| **มีวิธีที่ดีกว่าไหม?** | **ใช่ — Hybrid (Threshold + ML)** ดีกว่า pure ML อย่างเดียว ปลอดภัยกว่า อธิบายได้ดีกว่า |
| **ควรเปลี่ยนจาก MLP ไหม?** | **ไม่ต้อง** — MLP ยังเป็นตัวเลือกที่ดีที่สุดสำหรับ TFLite deployment แค่ปรับ architecture นิดหน่อย |
| **ต้องเพิ่มอะไร?** | เพิ่ม threshold layer, confidence filter, feature engineering ที่ดีขึ้น, session-based split |
