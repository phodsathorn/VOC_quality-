-- =============================================
-- VOC / E-Nose Database Schema
-- =============================================

-- Table: devices
-- เก็บข้อมูลกล่องเซนเซอร์ทุกตัว
CREATE TABLE IF NOT EXISTS devices (
    id          SERIAL PRIMARY KEY,
    box_id      VARCHAR(50) UNIQUE NOT NULL,
    firmware    VARCHAR(20),
    model_ver   VARCHAR(20),
    status      VARCHAR(10) DEFAULT 'OFFLINE',
    last_seen   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: sensor_readings
-- เก็บค่าเซนเซอร์แบบ Time-series (หนึ่ง row = หนึ่ง packet จากกล่อง)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id          BIGSERIAL PRIMARY KEY,
    box_id      VARCHAR(50) NOT NULL REFERENCES devices(box_id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Environment
    temp        NUMERIC(6, 2),
    rh          NUMERIC(6, 2),
    pm25        NUMERIC(8, 2),
    tvoc        NUMERIC(8, 2),
    eco2        NUMERIC(8, 2),

    -- E-Nose Sensors (raw ADC values)
    mq2         INTEGER,
    mq3         INTEGER,
    mq135       INTEGER,
    mq8         INTEGER,
    mics_co     INTEGER,
    no2         INTEGER,
    nh3         INTEGER,
    session_id  BIGINT
);

-- Index สำหรับ query เร็ว (Time-series by box_id)
CREATE INDEX IF NOT EXISTS idx_sensor_readings_box_time
    ON sensor_readings (box_id, recorded_at DESC);

-- Table: ai_predictions
-- เก็บผลทำนายจาก AI Model แต่ละครั้ง
CREATE TABLE IF NOT EXISTS ai_predictions (
    id          BIGSERIAL PRIMARY KEY,
    box_id      VARCHAR(50) NOT NULL REFERENCES devices(box_id),
    reading_id  BIGINT REFERENCES sensor_readings(id),
    predicted_at TIMESTAMPTZ DEFAULT NOW(),
    prediction  VARCHAR(100) NOT NULL,
    confidence  NUMERIC(5, 2) NOT NULL
);

-- Table: alerts
-- เก็บการแจ้งเตือนของระบบ
CREATE TABLE IF NOT EXISTS alerts (
    id          BIGSERIAL PRIMARY KEY,
    box_id      VARCHAR(50) REFERENCES devices(box_id),
    level       VARCHAR(20) NOT NULL,
    message     TEXT NOT NULL,
    status      VARCHAR(20) DEFAULT 'Active',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Seed Data (ข้อมูลตัวอย่างสำหรับทดสอบ)
-- =============================================

INSERT INTO devices (box_id, firmware, model_ver, status, last_seen)
VALUES
    ('BOX-001', '1.0.0', 'v2.1', 'ONLINE',  NOW()),
    ('BOX-002', '0.9.5', 'v1.5', 'OFFLINE', NOW() - INTERVAL '2 hours')
ON CONFLICT (box_id) DO NOTHING;

INSERT INTO sensor_readings (box_id, recorded_at, temp, rh, pm25, tvoc, eco2, mq3, mq135, mq8, mics_co, no2, nh3)
VALUES
    ('BOX-001', NOW() - INTERVAL '30 min', 31.2, 66.5, 12, 45, 410, 2100, 1400, 1600, 1100, 800, 1300),
    ('BOX-001', NOW() - INTERVAL '15 min', 31.8, 67.1, 15, 55, 415, 2400, 1490, 1680, 1150, 840, 1390),
    ('BOX-001', NOW(),                    32.5, 68.2, 25, 85, 420, 2847, 1560, 1732, 1200, 890, 1450)
ON CONFLICT DO NOTHING;

INSERT INTO ai_predictions (box_id, reading_id, prediction, confidence)
VALUES ('BOX-001', 3, 'THINNER', 92.00)
ON CONFLICT DO NOTHING;

INSERT INTO alerts (box_id, level, message, status)
VALUES ('BOX-001', 'High', 'High TVOC detected (85 ppb)', 'Active')
ON CONFLICT DO NOTHING;
