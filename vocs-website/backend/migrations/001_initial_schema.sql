-- Migration 001: Initial Core Schema (Devices, Readings, AI Predictions, Alerts, Users, Audit Events)

CREATE TABLE IF NOT EXISTS devices (
    id          SERIAL PRIMARY KEY,
    box_id      VARCHAR(50) UNIQUE NOT NULL,
    firmware    VARCHAR(20),
    model_ver   VARCHAR(20),
    status      VARCHAR(10) DEFAULT 'OFFLINE',
    last_seen   TIMESTAMPTZ,
    device_token_hash VARCHAR(255),
    site        VARCHAR(50) DEFAULT 'Main Plant',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id          BIGSERIAL PRIMARY KEY,
    box_id      VARCHAR(50) NOT NULL REFERENCES devices(box_id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temp        NUMERIC(6, 2),
    rh          NUMERIC(6, 2),
    pm25        NUMERIC(8, 2),
    tvoc        NUMERIC(8, 2),
    eco2        NUMERIC(8, 2),
    mq2         INTEGER,
    mq3         INTEGER,
    mq135       INTEGER,
    mq8         INTEGER,
    mics_co     INTEGER,
    no2         INTEGER,
    nh3         INTEGER,
    session_id  BIGINT,
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

CREATE INDEX IF NOT EXISTS idx_sensor_readings_box_time
    ON sensor_readings (box_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS ai_predictions (
    id          BIGSERIAL PRIMARY KEY,
    box_id      VARCHAR(50) NOT NULL REFERENCES devices(box_id),
    reading_id  BIGINT REFERENCES sensor_readings(id),
    predicted_at TIMESTAMPTZ DEFAULT NOW(),
    prediction  VARCHAR(100) NOT NULL,
    confidence  NUMERIC(5, 2) NOT NULL
);

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

INSERT INTO users (username, password_hash, full_name, role, site, assigned_boxes)
VALUES
    ('admin',    '$2b$12$R85.RR54e7FJqg1z0JZ4.Oh4wRYHhhbu517fTd34HgbxkTKiBsDHG', 'System Administrator',        'admin',    'Main Plant', '{}'),
    ('engineer', '$2b$12$2ftINa0VLTGA71xS9DCxLO0ylDOL8UQiTqEvRQLsmXk.htnupZxau', 'Process & Calibration Engineer', 'engineer', 'Main Plant', '{"BOX-001", "BOX-002"}'),
    ('operator', '$2b$12$LjHTu4H5PQJ5yC1f/SLp/e07AwdF2Gz8umgmuy2Q6AlbOt3iykH/C', 'Line Operator',                 'operator', 'Main Plant', '{"BOX-001", "BOX-002"}'),
    ('viewer',   '$2b$12$agntqqTS7JBX9YfHr7.6d.BQifYeiQGUQcGXFX8QO/JcvasLxCe8O', 'Safety & Compliance Auditor',   'viewer',   'Main Plant', '{}')
ON CONFLICT (username) DO NOTHING;
