-- Migration 003: LINE Bot Pairing & Persistent Maintenance Health State

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

CREATE TABLE IF NOT EXISTS maintenance_state (
    key         VARCHAR(50) PRIMARY KEY,
    state       JSONB NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO maintenance_state (key, state)
VALUES
    ('sensors', '{
        "mq2":    {"age": 180, "drift": 0.12, "noise": 0.08, "lastCalDaysAgo": 70},
        "mq3":    {"age": 210, "drift": 0.18, "noise": 0.10, "lastCalDaysAgo": 85},
        "mq8":    {"age": 95,  "drift": 0.06, "noise": 0.05, "lastCalDaysAgo": 30},
        "mq135":  {"age": 320, "drift": 0.28, "noise": 0.16, "lastCalDaysAgo": 110},
        "ccs811": {"age": 60,  "drift": 0.04, "noise": 0.03, "lastCalDaysAgo": 25},
        "mics":   {"age": 145, "drift": 0.11, "noise": 0.07, "lastCalDaysAgo": 50},
        "pms":    {"age": 400, "drift": 0.22, "noise": 0.12, "lastCalDaysAgo": 140},
        "dht22":  {"age": 30,  "drift": 0.02, "noise": 0.01, "lastCalDaysAgo": 15}
    }'::jsonb),
    ('filter', '{
        "age": 95,
        "replacedDate": null
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;
