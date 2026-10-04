"""
VOC / E-Nose — Model Training Script
=====================================
สคริปต์สำหรับเทรน Random Forest Classifier จากข้อมูลที่เก็บผ่านหน้า Data Collection

ขั้นตอน:
1. ดาวน์โหลด CSV จาก /api/export/csv
2. ทำความสะอาดข้อมูล
3. เทรน Random Forest
4. ประเมินผล
5. บันทึก Model เป็น .pkl
"""

# ================================================================
# 1. LOAD DATA
# ================================================================
import pandas as pd
import numpy as np

# โหลด CSV ที่ export จากระบบ
# วิธีที่ 1: โหลดโดยตรงจาก API (ต้องเปิด backend ก่อน)
# df = pd.read_csv("http://localhost:8000/api/export/csv")

# วิธีที่ 2: โหลดจากไฟล์ที่ดาวน์โหลดมาแล้ว
df = pd.read_csv("voc_training_data.csv")

print(f"Total rows: {len(df)}")
print(f"Labels: {df['label'].value_counts().to_dict()}")
print(df.head())

# ================================================================
# 2. PREPROCESS
# ================================================================
# Features ที่ใช้เทรน (ค่าเซนเซอร์ทั้งหมด)
FEATURE_COLS = ['temp', 'rh', 'pm25', 'tvoc', 'eco2',
                'mq2', 'mq3', 'mq135', 'mq8', 'mics_co', 'no2', 'nh3']

# ตัดแถวที่มีค่าว่าง
df = df.dropna(subset=FEATURE_COLS + ['label'])

X = df[FEATURE_COLS]
y = df['label']

print(f"\nAfter cleaning: {len(df)} rows, {y.nunique()} classes")
print(f"Classes: {sorted(y.unique())}")

# ================================================================
# 3. SPLIT DATA
# ================================================================
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")

# ================================================================
# 4. TRAIN MODEL
# ================================================================
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        random_state=42,
        n_jobs=-1
    ))
])

pipeline.fit(X_train, y_train)
print("Model trained!")

# ================================================================
# 5. EVALUATE
# ================================================================
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

y_pred = pipeline.predict(X_test)

print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred, labels=sorted(y.unique()))
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=sorted(y.unique()),
            yticklabels=sorted(y.unique()))
plt.title('Confusion Matrix — VOC Classifier')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
plt.tight_layout()
plt.savefig("confusion_matrix.png", dpi=150)
plt.show()

# Feature Importance
fi = pd.Series(
    pipeline.named_steps['clf'].feature_importances_,
    index=FEATURE_COLS
).sort_values(ascending=False)

plt.figure(figsize=(8, 4))
fi.plot(kind='bar', color='steelblue')
plt.title('Feature Importance')
plt.ylabel('Importance')
plt.tight_layout()
plt.savefig("feature_importance.png", dpi=150)
plt.show()
print("\nTop features:\n", fi.head(5))

# ================================================================
# 6. SAVE MODEL
# ================================================================
import pickle
import json

model_path = "voc_model.pkl"
with open(model_path, "wb") as f:
    pickle.dump(pipeline, f)

# บันทึก metadata ของโมเดล
meta = {
    "model_type": "RandomForestClassifier",
    "features": FEATURE_COLS,
    "classes": sorted(y.unique()),
    "n_train": len(X_train),
    "n_test": len(X_test),
}
with open("model_meta.json", "w") as f:
    json.dump(meta, f, indent=2)

print(f"\nModel saved to: {model_path}")
print(f"Classes: {meta['classes']}")

# ================================================================
# 7. TEST PREDICTION (ตัวอย่างการทำนาย)
# ================================================================
sample = pd.DataFrame([{
    "temp": 32.5, "rh": 68.0, "pm25": 25.0,
    "tvoc": 85.0, "eco2": 420.0,
    "mq2": 1950, "mq3": 2847, "mq135": 1560, "mq8": 1732,
    "mics_co": 1200, "no2": 890, "nh3": 1450
}])

pred = pipeline.predict(sample)[0]
proba = pipeline.predict_proba(sample)[0]
conf = max(proba) * 100

print(f"\nSample prediction: {pred} ({conf:.1f}% confidence)")
