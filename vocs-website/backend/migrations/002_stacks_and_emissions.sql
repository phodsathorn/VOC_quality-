-- Migration 002: Exhaust Stacks, Emission Permits, and CEMS Measurements

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
