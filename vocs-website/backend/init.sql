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
    session_id  BIGINT,

    -- Diagnostics & Telemetry (Phase W3 / H2)
    seq_no      BIGINT,
    wifi_rssi   INTEGER,
    free_heap_kb INTEGER,
    reset_reason VARCHAR(60),
    is_valid    BOOLEAN DEFAULT TRUE,
    validation_reason VARCHAR(100) DEFAULT 'PASS',
    calibration_id VARCHAR(50),
    firmware_ver VARCHAR(20) DEFAULT '1.0.0',
    model_ver   VARCHAR(20) DEFAULT 'v2.1'
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
    status      VARCHAR(30) DEFAULT 'Active',
    sla_deadline TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(50),
    acknowledged_role VARCHAR(20),
    in_progress_at TIMESTAMPTZ,
    in_progress_by VARCHAR(50),
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(50),
    resolution_note TEXT,
    evidence_url TEXT,
    verified_at TIMESTAMPTZ,
    verified_by VARCHAR(50),
    verification_note TEXT,
    source_screen VARCHAR(50) DEFAULT 'Web Dashboard',
    is_sla_breached BOOLEAN DEFAULT FALSE,
    escalated BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Phase W2: Maintenance Work Orders & Checklists
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_work_orders (
    id SERIAL PRIMARY KEY,
    box_id VARCHAR(50) NOT NULL REFERENCES devices(box_id),
    task_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mwo_box_time ON maintenance_work_orders (box_id, completed_at DESC);

-- =============================================
-- Phase W1: Authentication, RBAC & Audit Trail
-- =============================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    username       VARCHAR(50) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(100),
    role           VARCHAR(20) NOT NULL CHECK (role IN ('operator', 'engineer', 'admin', 'viewer')),
    site           VARCHAR(50) DEFAULT 'Main Plant',
    assigned_boxes TEXT[] DEFAULT '{}',
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    last_login     TIMESTAMPTZ
);

-- Device token support on devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_token_hash VARCHAR(255);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS site VARCHAR(50) DEFAULT 'Main Plant';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Table: audit_events (Append-only Audit Trail)
CREATE TABLE IF NOT EXISTS audit_events (
    id             BIGSERIAL PRIMARY KEY,
    timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id        INTEGER REFERENCES users(id),
    username       VARCHAR(50),
    role           VARCHAR(20),
    ip_address     VARCHAR(45),
    action         VARCHAR(50) NOT NULL,
    resource_type  VARCHAR(50) NOT NULL,
    resource_id    VARCHAR(100),
    details        JSONB NOT NULL DEFAULT '{}'::jsonb,
    status         VARCHAR(20) NOT NULL DEFAULT 'SUCCESS'
);

CREATE INDEX IF NOT EXISTS idx_audit_events_time ON audit_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events (username, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events (resource_type, resource_id);

-- Immutability trigger for audit_events (Strictly Append-Only)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_audit_tampering') THEN
        CREATE OR REPLACE FUNCTION prevent_audit_tampering()
        RETURNS TRIGGER AS $func$
        BEGIN
            RAISE EXCEPTION 'Audit trail is append-only and cannot be updated or deleted.';
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_events_immutable') THEN
        CREATE TRIGGER trg_audit_events_immutable
        BEFORE UPDATE OR DELETE ON audit_events
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- Seed Data (ข้อมูลตัวอย่างสำหรับทดสอบ)
-- =============================================

INSERT INTO devices (box_id, firmware, model_ver, status, last_seen, device_token_hash)
VALUES
    ('BOX-001', '1.0.0', 'v2.1', 'ONLINE',  NOW(), '$2b$12$R85.RR54e7FJqg1z0JZ4.Oh4wRYHhhbu517fTd34HgbxkTKiBsDHG'),
    ('BOX-002', '0.9.5', 'v1.5', 'OFFLINE', NOW() - INTERVAL '2 hours', NULL)
ON CONFLICT (box_id) DO NOTHING;

-- Initial Development Role Accounts:
-- In production, these sample credentials must be rotated immediately or provisioned
-- securely via administrative CLI / environment secrets. DO NOT commit plaintext passwords.
INSERT INTO users (username, password_hash, full_name, role, site)
VALUES
    ('admin',    '$2b$12$R85.RR54e7FJqg1z0JZ4.Oh4wRYHhhbu517fTd34HgbxkTKiBsDHG', 'System Administrator',        'admin',    'Main Plant'),
    ('engineer', '$2b$12$2ftINa0VLTGA71xS9DCxLO0ylDOL8UQiTqEvRQLsmXk.htnupZxau', 'Process & Calibration Engineer', 'engineer', 'Main Plant'),
    ('operator', '$2b$12$LjHTu4H5PQJ5yC1f/SLp/e07AwdF2Gz8umgmuy2Q6AlbOt3iykH/C', 'Line Operator',                 'operator', 'Main Plant'),
    ('viewer',   '$2b$12$agntqqTS7JBX9YfHr7.6d.BQifYeiQGUQcGXFX8QO/JcvasLxCe8O', 'Safety & Compliance Auditor',   'viewer',   'Main Plant')
ON CONFLICT (username) DO NOTHING;

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

-- =================================================================
-- Phase W3: 5-Year Retention Downsampling, Provenance & Export Audit
-- =================================================================

ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT TRUE;
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS validation_reason VARCHAR(100) DEFAULT 'PASS';
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS calibration_id VARCHAR(50);
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS firmware_ver VARCHAR(20) DEFAULT '1.0.0';
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS model_ver VARCHAR(20) DEFAULT 'v2.1';

CREATE TABLE IF NOT EXISTS sensor_readings_hourly (
    id            BIGSERIAL PRIMARY KEY,
    box_id        VARCHAR(20) NOT NULL,
    bucket_start  TIMESTAMPTZ NOT NULL,
    sample_count  INT NOT NULL,
    temp_avg      REAL, temp_min REAL, temp_max REAL,
    rh_avg        REAL, rh_min REAL, rh_max REAL,
    tvoc_avg      REAL, tvoc_min REAL, tvoc_max REAL,
    eco2_avg      REAL, eco2_min REAL, eco2_max REAL,
    pm25_avg      REAL, pm25_min REAL, pm25_max REAL,
    UNIQUE (box_id, bucket_start)
);
CREATE INDEX IF NOT EXISTS idx_readings_hourly_time ON sensor_readings_hourly (box_id, bucket_start DESC);

CREATE TABLE IF NOT EXISTS sensor_readings_daily (
    id            BIGSERIAL PRIMARY KEY,
    box_id        VARCHAR(20) NOT NULL,
    bucket_date   DATE NOT NULL,
    sample_count  INT NOT NULL,
    temp_avg      REAL, temp_min REAL, temp_max REAL,
    rh_avg        REAL, rh_min REAL, rh_max REAL,
    tvoc_avg      REAL, tvoc_min REAL, tvoc_max REAL,
    eco2_avg      REAL, eco2_min REAL, eco2_max REAL,
    pm25_avg      REAL, pm25_min REAL, pm25_max REAL,
    UNIQUE (box_id, bucket_date)
);
CREATE INDEX IF NOT EXISTS idx_readings_daily_date ON sensor_readings_daily (box_id, bucket_date DESC);

CREATE TABLE IF NOT EXISTS export_audit_records (
    id            BIGSERIAL PRIMARY KEY,
    export_id     VARCHAR(64) UNIQUE NOT NULL,
    exported_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    username      VARCHAR(50) NOT NULL,
    role          VARCHAR(20) NOT NULL,
    format        VARCHAR(10) NOT NULL,
    date_from     TIMESTAMPTZ,
    date_to       TIMESTAMPTZ,
    box_id        VARCHAR(20),
    record_count  INT NOT NULL,
    sha256_hash   VARCHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_export_audit_time ON export_audit_records (exported_at DESC);

-- =================================================================
-- Phase W4: Cryptographic OTA Signatures & Model Artifact Governance
-- =================================================================

ALTER TABLE ota_firmwares ADD COLUMN IF NOT EXISTS sha256_checksum VARCHAR(64);
ALTER TABLE ota_firmwares ADD COLUMN IF NOT EXISTS signature_ecdsa VARCHAR(256);
ALTER TABLE ota_firmwares ADD COLUMN IF NOT EXISTS signed_by VARCHAR(50);
ALTER TABLE ota_firmwares ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS model_governance_registry (
    id               SERIAL PRIMARY KEY,
    model_ver        VARCHAR(30) UNIQUE NOT NULL,
    sha256_hash      VARCHAR(64) NOT NULL,
    algorithm        VARCHAR(50) NOT NULL,
    dataset_version  VARCHAR(50) NOT NULL,
    accuracy         REAL NOT NULL,
    f1_score         REAL NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    approved_by      VARCHAR(50) NOT NULL,
    approved_at      TIMESTAMPTZ DEFAULT NOW(),
    signature        VARCHAR(256) NOT NULL
);

INSERT INTO model_governance_registry (model_ver, sha256_hash, algorithm, dataset_version, accuracy, f1_score, status, approved_by, signature)
VALUES
    ('v2.1', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'RandomForestClassifier (Ensemble 100-trees)', 'DATASET-2026-Q1', 0.942, 0.938, 'ACTIVE', 'admin', 'SIG_ECDSA_SHA256_ROOT_CERT_2026')
ON CONFLICT (model_ver) DO NOTHING;

-- =================================================================
-- Phase W5: Exhaust Stacks, Emission Permits & Annual Mass Reports
-- =================================================================

CREATE TABLE IF NOT EXISTS exhaust_stacks (
    stack_id            VARCHAR(30) PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    process_type        VARCHAR(100) NOT NULL,
    flow_rate_m3_h      NUMERIC(12, 2) NOT NULL,
    diameter_m          NUMERIC(6, 2) NOT NULL,
    temp_c              NUMERIC(6, 2) DEFAULT 35.0,
    is_verified_cems    BOOLEAN DEFAULT FALSE,
    cems_calibrated_at  TIMESTAMPTZ,
    active              BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS emission_permits (
    permit_no                   VARCHAR(50) PRIMARY KEY,
    pollutant                   VARCHAR(50) NOT NULL,
    max_annual_kg               NUMERIC(12, 2) NOT NULL,
    concentration_limit_mg_m3   NUMERIC(8, 2) NOT NULL,
    valid_until                 DATE NOT NULL,
    authority                   VARCHAR(100) DEFAULT 'Industrial Estate Authority / Dept of Industrial Works'
);

CREATE TABLE IF NOT EXISTS stack_measurements (
    id                      SERIAL PRIMARY KEY,
    stack_id                VARCHAR(30) REFERENCES exhaust_stacks(stack_id),
    sampled_at              TIMESTAMPTZ NOT NULL,
    pollutant               VARCHAR(50) NOT NULL,
    concentration_mg_m3     NUMERIC(10, 4) NOT NULL,
    verified_flow_m3_h      NUMERIC(12, 2) NOT NULL,
    operating_hours_annual  NUMERIC(10, 2) NOT NULL,
    lab_cert_id             VARCHAR(100),
    lab_certified_at        DATE,
    is_accredited_lab       BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Phase W5 Exhaust Stacks and Industrial Permits
INSERT INTO exhaust_stacks (stack_id, name, process_type, flow_rate_m3_h, diameter_m, temp_c, is_verified_cems, cems_calibrated_at, active)
VALUES
    ('STACK-01', 'Exhaust Stack 01 (Painting Booth A)', 'Automotive Primer Spraying', 12500.0, 0.85, 38.0, TRUE, NOW() - INTERVAL '30 days', TRUE),
    ('STACK-02', 'Exhaust Stack 02 (Drying Oven Line B)', 'Thermal Cure Oven', 8200.0, 0.65, 85.0, FALSE, NULL, TRUE)
ON CONFLICT (stack_id) DO NOTHING;

INSERT INTO emission_permits (permit_no, pollutant, max_annual_kg, concentration_limit_mg_m3, valid_until, authority)
VALUES
    ('PERMIT-IEAT-2026-VOC', 'Total VOCs (as Carbon)', 5000.0, 150.0, '2026-12-31', 'Industrial Estate Authority of Thailand (IEAT)'),
    ('PERMIT-DIW-2026-BENZENE', 'Benzene', 250.0, 5.0, '2026-12-31', 'Department of Industrial Works (DIW)')
ON CONFLICT (permit_no) DO NOTHING;

-- =================================================================
-- LINE Bot Device Pairing (Subscribers per Box ID)
-- =================================================================

CREATE TABLE IF NOT EXISTS line_subscribers (
    id            SERIAL PRIMARY KEY,
    line_user_id  VARCHAR(100) NOT NULL,
    box_id        VARCHAR(50) NOT NULL,
    display_name  VARCHAR(100) DEFAULT 'LINE User',
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (line_user_id, box_id)
);
CREATE INDEX IF NOT EXISTS idx_line_sub_box ON line_subscribers (box_id, is_active);

-- Sample paired subscribers
INSERT INTO line_subscribers (line_user_id, box_id, display_name, is_active)
VALUES
    ('U_demo_engineer_01', 'BOX-001', 'Somchai (Lead Engineer)', TRUE),
    ('U_demo_safety_officer', 'BOX-001', 'Wichai (Safety Officer)', TRUE),
    ('U_demo_line_b_mgr', 'BOX-002', 'Anan (Line B Supervisor)', TRUE)
ON CONFLICT (line_user_id, box_id) DO NOTHING;

