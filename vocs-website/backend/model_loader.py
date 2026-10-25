"""
model_loader.py
---------------
โหลด ML Model (.pkl) เมื่อ Backend เริ่มต้น
และให้บริการ predict() สำหรับเรียกใช้จาก endpoint อื่น
"""
import pickle
import os
import pandas as pd

MODEL_PATH = os.getenv("MODEL_PATH", "voc_model.pkl")

# Feature columns ต้องตรงกับที่ใช้ตอนเทรน
FEATURE_COLS = [
    "temp", "rh", "pm25", "tvoc", "eco2",
    "mq2", "mq3", "mq135", "mq8", "mics_co", "no2", "nh3"
]

DANGEROUS_LABELS = {
    "THINNER", "ALCOHOL", "ETHANOL", "IPA", "ACETONE",
    "BENZENE", "TOLUENE", "GASOLINE", "BLEACH", "AMMONIA", "แอลกอฮอล"
}

_pipeline = None


def load_model():
    """โหลด model จากไฟล์ .pkl — เรียกตอน app startup"""
    global _pipeline
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            _pipeline = pickle.load(f)
        print(f"AI Model loaded from {MODEL_PATH}")
    else:
        print(f"WARNING: Model file not found at {MODEL_PATH}. Running in mock-prediction mode.")
        _pipeline = None


def is_loaded() -> bool:
    return _pipeline is not None


def predict(reading: dict) -> dict:
    """
    รับ dict ของค่าเซนเซอร์ คืน dict ที่มี prediction และ confidence
    ถ้าโมเดลยังไม่ได้โหลด จะคืนค่า mock
    """
    if _pipeline is None:
        # Mock mode: คืนค่าจำลองเมื่อยังไม่มีโมเดล
        return {
            "prediction": "AMBIENT",
            "confidence": 85.0,
            "is_dangerous": False,
            "mock": True,
        }

    # เตรียม DataFrame ให้ตรงกับที่ pipeline คาดหวัง
    row = {col: reading.get(col) for col in FEATURE_COLS}
    X = pd.DataFrame([row])

    pred = _pipeline.predict(X)[0]
    proba = _pipeline.predict_proba(X)[0]
    conf = round(float(max(proba)) * 100, 2)

    return {
        "prediction": str(pred),
        "confidence": conf,
        "is_dangerous": str(pred).upper() in DANGEROUS_LABELS,
        "mock": False,
    }
