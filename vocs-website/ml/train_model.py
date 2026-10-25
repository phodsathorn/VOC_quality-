"""
VOC / E-Nose — Model Training Script
=====================================
สคริปต์สำหรับเทรน Random Forest Classifier จากข้อมูลที่เก็บผ่านระบบ E-Nose

ขั้นตอน:
1. โหลดข้อมูลจาก /api/export/csv หรือไฟล์ CSV
2. ทำความสะอาดข้อมูล และแปลง Label ให้เป็นมาตรฐาน
3. แบ่งข้อมูล Train / Test
4. เทรน Random Forest Classifier Pipeline (StandardScaler + RandomForest)
5. ประเมินผล (Accuracy, F1-Score, Feature Importance)
6. บันทึก Model (.pkl) ไปยัง backend และ ml/
7. สั่ง Reload โมเดลใน Backend ทันที
"""

import sys
import os
import json
import pickle
import urllib.request
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

# ================================================================
# 1. LOAD DATA
# ================================================================
CSV_URL = os.getenv("CSV_URL", "https://voc-backend-api.onrender.com/api/export/csv")
LOCAL_CSV = sys.argv[1] if len(sys.argv) > 1 else None

df = None
if LOCAL_CSV and os.path.exists(LOCAL_CSV):
    print(f"Loading data from local file: {LOCAL_CSV}")
    df = pd.read_csv(LOCAL_CSV)
else:
    print(f"Fetching data from API: {CSV_URL}")
    try:
        df = pd.read_csv(CSV_URL)
    except Exception as e:
        print(f"Failed to fetch from API: {e}")
        # fallback to local file if available
        for fallback in ["voc_training_data.csv", "voc_training_data_all.csv", "/app/voc_training_data.csv"]:
            if os.path.exists(fallback):
                print(f"Falling back to: {fallback}")
                df = pd.read_csv(fallback)
                break

if df is None or len(df) == 0:
    print("ERROR: No data available for training.")
    sys.exit(1)

print(f"Raw dataset rows: {len(df)}")

# ================================================================
# 2. PREPROCESS & LABEL MAPPING
# ================================================================
LABEL_MAP = {
    "แอลกอฮอล": "ALCOHOL",
    "แอลกอฮอล์": "ALCOHOL",
    "alcohol": "ALCOHOL",
    "ethanol": "ETHANOL",
    "ambient": "AMBIENT",
    "thinner": "THINNER",
    "acetone": "ACETONE",
    "ipa": "IPA",
    "ammonia": "AMMONIA",
}

def clean_label(val):
    if pd.isna(val):
        return "AMBIENT"
    s = str(val).strip()
    return LABEL_MAP.get(s, LABEL_MAP.get(s.lower(), s.upper()))

df["label"] = df["label"].apply(clean_label)

FEATURE_COLS = [
    "temp", "rh", "pm25", "tvoc", "eco2",
    "mq2", "mq3", "mq135", "mq8", "mics_co", "no2", "nh3"
]

# ตรวจสอบคอลัมน์เซนเซอร์
missing_cols = [c for c in FEATURE_COLS if c not in df.columns]
if missing_cols:
    print(f"ERROR: Missing columns: {missing_cols}")
    sys.exit(1)

# Drop missing values
df = df.dropna(subset=FEATURE_COLS + ["label"])

print("\n--- Distribution of Classes ---")
counts = df["label"].value_counts()
for label, cnt in counts.items():
    print(f"  • {label:12s}: {cnt:4d} readings")

num_classes = df["label"].nunique()
if num_classes < 2:
    print(f"\nERROR: At least 2 distinct classes are required to train a classifier. Found only {num_classes} ({df['label'].unique()})")
    sys.exit(1)

X = df[FEATURE_COLS]
y = df["label"]

# ================================================================
# 3. SPLIT DATA
# ================================================================
# Stratified split to ensure both classes exist in train & test
min_class_size = counts.min()
test_size = 0.2 if min_class_size >= 5 else 0.1

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=test_size, random_state=42, stratify=y
)

print(f"\nDataset Split: Train = {len(X_train)} samples, Test = {len(X_test)} samples")

# ================================================================
# 4. TRAIN MODEL PIPELINE
# ================================================================
print("\nTraining RandomForestClassifier Pipeline...")
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    ))
])

pipeline.fit(X_train, y_train)
print("Training completed successfully!")

# ================================================================
# 5. EVALUATION
# ================================================================
y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\n==========================================")
print(f"  Test Accuracy: {acc * 100:.2f}%")
print(f"==========================================")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Confusion Matrix
labels = sorted(y.unique())
cm = confusion_matrix(y_test, y_pred, labels=labels)
print("Confusion Matrix:")
print("Predicted ->", "  ".join([f"{l[:7]:>7}" for l in labels]))
for i, l in enumerate(labels):
    row_str = "  ".join([f"{val:>7d}" for val in cm[i]])
    print(f"Actual {l[:7]:>7}: {row_str}")

# Feature Importance
importances = pipeline.named_steps["clf"].feature_importances_
fi = pd.Series(importances, index=FEATURE_COLS).sort_values(ascending=False)
print("\nTop 5 Most Important Sensors:")
for feat, imp in fi.head(5).items():
    print(f"  • {feat:10s}: {imp * 100:.1f}%")

# Save plots if matplotlib is available
try:
    import matplotlib.pyplot as plt
    import seaborn as sns

    plt.figure(figsize=(7, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=labels, yticklabels=labels)
    plt.title("Confusion Matrix — VOC E-Nose")
    plt.ylabel("Actual")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig("confusion_matrix.png", dpi=150)
    plt.close()

    plt.figure(figsize=(8, 4))
    fi.plot(kind="bar", color="steelblue")
    plt.title("Sensor Feature Importance")
    plt.ylabel("Importance")
    plt.tight_layout()
    plt.savefig("feature_importance.png", dpi=150)
    plt.close()
    print("Saved evaluation charts to confusion_matrix.png and feature_importance.png")
except ImportError:
    pass

# ================================================================
# 6. SAVE MODEL & METADATA
# ================================================================
meta = {
    "model_type": "RandomForestClassifier",
    "features": FEATURE_COLS,
    "classes": labels,
    "accuracy": round(float(acc), 4),
    "n_train": len(X_train),
    "n_test": len(X_test),
    "feature_importance": {k: round(float(v), 4) for k, v in fi.items()},
}

# Save in current directory
with open("voc_model.pkl", "wb") as f:
    pickle.dump(pipeline, f)
with open("model_meta.json", "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=2, ensure_ascii=False)

# Also save directly into backend directory if reachable
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, "..", "backend"))
if os.path.isdir(backend_dir):
    backend_model_path = os.path.join(backend_dir, "voc_model.pkl")
    with open(backend_model_path, "wb") as f:
        pickle.dump(pipeline, f)
    with open(os.path.join(backend_dir, "model_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print(f"Copied voc_model.pkl to backend: {backend_model_path}")

print(f"\nModel artifacts saved successfully!")

# ================================================================
# 7. NOTIFY BACKEND TO RELOAD MODEL
# ================================================================
try:
    backend_base = os.getenv("BACKEND_URL", "https://voc-backend-api.onrender.com")
    reload_url = f"{backend_base}/api/model/reload"
    req = urllib.request.Request(reload_url, data=b"", method="POST")
    with urllib.request.urlopen(req, timeout=3) as resp:
        res_data = json.loads(resp.read().decode())
        print(f"Backend reload response: {res_data}")
except Exception as e:
    print(f"Could not automatically notify backend to reload (run POST /api/model/reload): {e}")

# ================================================================
# 8. TEST SAMPLE PREDICTION
# ================================================================
test_sample = X_test.iloc[0:1]
pred_label = pipeline.predict(test_sample)[0]
pred_proba = pipeline.predict_proba(test_sample)[0]
conf = max(pred_proba) * 100
print(f"\nValidation sample prediction:")
print(f"  • Actual   : {y_test.iloc[0]}")
print(f"  • Predicted: {pred_label} (Confidence: {conf:.1f}%)")
