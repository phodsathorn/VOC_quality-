-- Migration: เพิ่มระบบ Labeling สำหรับเก็บข้อมูลเทรน

-- 1. Table: training_sessions
-- เก็บ session การเก็บข้อมูล เช่น "ทดสอบ Thinner ขวดที่ 1 วันที่ 2 ก.ย."
CREATE TABLE IF NOT EXISTS training_sessions (
    id          BIGSERIAL PRIMARY KEY,
    box_id      VARCHAR(50) REFERENCES devices(box_id),
    label       VARCHAR(100) NOT NULL,       -- ชื่อสาร เช่น THINNER, ALCOHOL
    note        TEXT,                        -- หมายเหตุเพิ่มเติม
    started_at  TIMESTAMPTZ DEFAULT NOW(),
    ended_at    TIMESTAMPTZ,
    created_by  VARCHAR(100) DEFAULT 'admin'
);

-- 2. เพิ่ม column session_id ให้ sensor_readings
-- เพื่อรู้ว่า reading นี้อยู่ใน session ไหน (optional - null = ไม่ได้เทรน)
ALTER TABLE sensor_readings
    ADD COLUMN IF NOT EXISTS session_id BIGINT REFERENCES training_sessions(id);

-- Index สำหรับ query เร็ว
CREATE INDEX IF NOT EXISTS idx_sensor_readings_session
    ON sensor_readings (session_id)
    WHERE session_id IS NOT NULL;
