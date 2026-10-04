# VOCs / E-Nose System : Technology Stack

ภาพรวมของเทคโนโลยีทั้งหมดที่ใช้ในโปรเจคระบบตรวจสอบสารอินทรีย์ระเหยง่าย (VOC) และคุณภาพอากาศ ด้วย E-Nose + AI Classification

---

## ⚡ 1. Hardware & Firmware
ส่วนประกอบและการพัฒนาโปรแกรมบนไมโครคอนโทรลเลอร์

*   **Microcontroller:** ESP32-S3
*   **Language:** C++ (Arduino Framework)
*   **Key Libraries:** 
    *   `ArduinoJson`
    *   `Adafruit_CCS811`
    *   `Adafruit_ADS1X15`
    *   `Adafruit_PM25AQI`
    *   `DHT sensor library`
*   **Sensors & ICs:** 
    *   CCS811 (TVOC/eCO2)
    *   PMS5003 (PM2.5)
    *   DHT22 (Temperature/Humidity)
    *   MQ-2, MQ-3, MQ-8, MQ-135 (Gas Sensors)
    *   MiCS-6814 (เชื่อมต่อผ่าน ADS1115 16-bit ADC)

## 🐍 2. Backend & API
ฝั่งเซิร์ฟเวอร์ประมวลผลและจัดการฐานข้อมูล

*   **Language:** Python 3.10+
*   **Framework:** FastAPI (RESTful API / Asynchronous)
*   **Server:** Uvicorn (ASGI Web Server)
*   **Database:** PostgreSQL 16
*   **DB Client:** `asyncpg`
*   **Data Validation:** `pydantic`

## 🧠 3. Machine Learning (AI)
ระบบปัญญาประดิษฐ์สำหรับแยกแยะและทำนายกลิ่น/ชนิดก๊าซ

*   **Core Library:** `scikit-learn`
*   **Algorithm:** Random Forest Classifier (w/ StandardScaler)
*   **Data Processing:** `pandas`, `numpy`
*   **Visualization:** `matplotlib`, `seaborn` (Training metrics)
*   **Model Format:** `.pkl` (Serialized via `joblib`)

## ⚛️ 4. Frontend (Web Dashboard)
ระบบแสดงผลและส่วนติดต่อผู้ใช้งาน (User Interface)

*   **Library:** React
*   **Build Tool:** Vite
*   **Language:** JavaScript (ES6+)
*   **Styling:** Vanilla CSS (Custom Properties / Design System)
*   **Routing:** `react-router-dom`
*   **Icons:** `lucide-react`

## 🐳 5. Infrastructure & DevOps
ระบบจัดเก็บ โครงสร้างพื้นฐาน และการปรับใช้ (Deployment)

*   **Containerization:** Docker & Docker Compose
*   **Web Server / Proxy:** Nginx (Serving React build)
*   **CI/CD Pipeline:** GitLab CI (`.gitlab-ci.yml` สำหรับ Automated Build/Deploy)
