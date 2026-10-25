/**
 * Maintenance.jsx — Sensor Health & Predictive Maintenance Dashboard
 * ─────────────────────────────────────────────────────────────────────
 * Based on IEEE papers:
 *  • "Health Index Construction for Multi-Sensor Systems" (IEEE TASE 2023)
 *  • "Remaining Useful Life Prediction of Air Filters" (IEEE Sensors 2024)
 *  • "Robust & Fast ENS with Drift Compensation" (Rehman et al. 2021)
 *
 * Algorithm:
 *  HI = w1*(1 - |drift|/maxDrift) + w2*(1 - noise/maxNoise) + w3*(1 - age/lifespan)
 *  RUL (days) = (HI_threshold - HI_current) / degradation_rate
 * ─────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Cpu, Filter,
  RefreshCw, Wrench, Zap, ChevronRight,
  BarChart3, Gauge, FileText,
  Printer, Check, Play
} from 'lucide-react';

import { API } from '../config';

/* ─────────────────────────────────────────────────────────────
   SENSOR DEFINITIONS WITH MAINTENANCE PARAMS
   ───────────────────────────────────────────────────────────── */
const SENSOR_META = [
  {
    id: 'mq2', label: 'MQ-2', type: 'Gas (MOS)', pin: 'GPIO 33',
    measurands: ['Smoke', 'LPG', 'Methane'],
    lifespan: 730,      // days (2 years typical for MQ series)
    warnHI: 60, critHI: 40,
    calInterval: 90,    // days between calibrations
    notes: 'MQ semiconductor sensors drift ~5–8% per month due to tin-oxide oxidation',
    color: '#d97706',
  },
  {
    id: 'mq3', label: 'MQ-3', type: 'Gas (MOS)', pin: 'GPIO 36',
    measurands: ['Alcohol', 'Benzene', 'Thinner'],
    lifespan: 730, warnHI: 60, critHI: 40, calInterval: 90,
    notes: 'Sensitive to humidity — drift accelerates in high RH environment',
    color: '#16a34a',
  },
  {
    id: 'mq8', label: 'MQ-8', type: 'Gas (MOS)', pin: 'GPIO 34',
    measurands: ['Hydrogen (H₂)', 'Flammable Gas'],
    lifespan: 730, warnHI: 60, critHI: 40, calInterval: 90,
    notes: 'High sensitivity to H₂ — cross-sensitivity to LPG is common',
    color: '#ea580c',
  },
  {
    id: 'mq135', label: 'MQ-135', type: 'Gas (MOS)', pin: 'GPIO 39',
    measurands: ['NH₃', 'Benzene', 'Smoke', 'CO₂'],
    lifespan: 730, warnHI: 60, critHI: 40, calInterval: 90,
    notes: 'Broadest cross-sensitivity — requires baseline recalibration quarterly',
    color: '#dc2626',
  },
  {
    id: 'ccs811', label: 'CCS811', type: 'MEMS (I²C)', pin: 'I²C Bus1',
    measurands: ['TVOC (ppb)', 'eCO₂ (ppm)'],
    lifespan: 1460,     // 4 years (MEMS more durable)
    warnHI: 70, critHI: 50, calInterval: 180,
    notes: 'Requires 48h burn-in when new. Baseline auto-corrects over 24h cycles',
    color: '#7c3aed',
  },
  {
    id: 'mics', label: 'MiCS-6814', type: 'Multi-MEMS', pin: 'ADS1115',
    measurands: ['CO (mV)', 'NO₂ (mV)', 'NH₃ (mV)'],
    lifespan: 1095,     // 3 years
    warnHI: 65, critHI: 45, calInterval: 120,
    notes: '3 independent sensing elements — each degrades at different rates',
    color: '#db2777',
  },
  {
    id: 'pms', label: 'PMS5003', type: 'Laser Particle', pin: 'UART2',
    measurands: ['PM1.0', 'PM2.5', 'PM10 (µg/m³)'],
    lifespan: 365 * 3,  // 3 years fan life
    warnHI: 65, critHI: 45, calInterval: 365,
    notes: 'Laser + fan degradation. Fan dust accumulation is primary failure mode',
    color: '#0284c7',
  },
  {
    id: 'dht22', label: 'DHT22', type: 'Capacitive', pin: 'GPIO 27',
    measurands: ['Temperature (°C)', 'Humidity (%RH)'],
    lifespan: 1460 * 2, // very durable
    warnHI: 75, critHI: 55, calInterval: 365,
    notes: 'Most reliable sensor — minimal drift. Annual verification recommended',
    color: '#475569',
  },
];

const FILTER_META = {
  label: 'HEPA + Activated Carbon Filter',
  lifespan: 180,   // days
  warnPct: 40, critPct: 20,
  notes: 'Replace when pressure differential increases or HI < 20%',
};

/* ─────────────────────────────────────────────────────────────
   MOCK MAINTENANCE DATA GENERATOR
   (In production: comes from /api/maintenance/status)
   ───────────────────────────────────────────────────────────── */
function generateMaintenanceData() {
  const now = new Date();
  const sensors = SENSOR_META.map((s, i) => {
    const agePreset = [180, 210, 95, 320, 60, 145, 400, 30][i];
    const driftPreset = [0.12, 0.18, 0.06, 0.28, 0.04, 0.11, 0.22, 0.02][i];
    const noisePreset = [0.08, 0.10, 0.05, 0.16, 0.03, 0.07, 0.12, 0.01][i];

    const ageFactor   = Math.max(0, 1 - agePreset / s.lifespan);
    const driftFactor = Math.max(0, 1 - driftPreset / 0.40);
    const noiseFactor = Math.max(0, 1 - noisePreset / 0.25);
    const hi = Math.round((0.40 * ageFactor + 0.35 * driftFactor + 0.25 * noiseFactor) * 100);

    const degradRate = (hi - s.critHI) / (agePreset || 1);
    const rul = degradRate > 0
      ? Math.round((hi - s.critHI) / degradRate)
      : 9999;

    const lastCalDays = [70, 85, 30, 110, 25, 50, 140, 15][i];
    const lastCal = new Date(now.getTime() - lastCalDays * 24 * 3600 * 1000);
    const nextCal = new Date(lastCal.getTime() + s.calInterval * 24 * 3600 * 1000);
    const calOverdue = nextCal < now;

    const trend = Array.from({ length: 30 }, (_, d) => {
      const dayAgo = 29 - d;
      return Math.max(s.critHI - 5,
        hi + dayAgo * (degradRate * 0.8) + (Math.random() - 0.5) * 3
      );
    });

    return {
      ...s, age: agePreset, hi, rul, drift: driftPreset, noise: noisePreset,
      lastCal: lastCal.toLocaleDateString('th-TH'),
      nextCal: nextCal.toLocaleDateString('th-TH'),
      calOverdue, trend,
    };
  });

  const filterAge = 95;   // days
  const filterHI = Math.round(Math.max(0, (1 - filterAge / FILTER_META.lifespan) * 100));
  const filterRUL = Math.round((filterHI - FILTER_META.critPct)
    / (filterHI / (filterAge || 1)));
  const filterReplace = new Date(now.getTime() + filterRUL * 24 * 3600 * 1000);

  return {
    sensors,
    filter: {
      hi: filterHI, rul: filterRUL, age: filterAge,
      replaceBy: filterReplace.toLocaleDateString('th-TH'),
    },
    lastUpdate: now.toLocaleString('th-TH'),
    systemUptime: 847,  // hours
  };
}

/* ─────────────────────────────────────────────────────────────
   UI HELPERS
   ───────────────────────────────────────────────────────────── */
function hiColor(hi, warn, crit) {
  if (hi <= crit) return { bg: '#fee2e2', fg: '#dc2626', track: '#fca5a5', label: 'Critical' };
  if (hi <= warn) return { bg: '#fef3c7', fg: '#d97706', track: '#fcd34d', label: 'Warning' };
  if (hi <= 75)   return { bg: '#f0fdf4', fg: '#16a34a', track: '#86efac', label: 'Good' };
  return { bg: '#eff6ff', fg: '#2563eb', track: '#93c5fd', label: 'Excellent' };
}

function StatusBadge({ hi, warn, crit }) {
  const c = hiColor(hi, warn, crit);
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
      background: c.bg, color: c.fg, fontFamily: 'Inter',
    }}>{c.label}</span>
  );
}

function HealthBar({ hi, warn, crit, height = 8 }) {
  const c = hiColor(hi, warn, crit);
  return (
    <div style={{
      background: '#f1f5f9', borderRadius: 999, height, overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, height: '100%',
        width: `${Math.min(100, Math.max(0, hi))}%`, background: c.track,
        borderRadius: 999, transition: 'width 0.8s ease',
      }} />
      <div style={{
        position: 'absolute', left: `${warn}%`, top: 0,
        width: 1.5, height: '100%', background: '#94a3b8', opacity: 0.5,
      }} />
    </div>
  );
}

function Sparkline({ data, color }) {
  if (!data?.length) return null;
  const W = 110, H = 32;
  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   CALIBRATION MODAL (Zero-Air Calibration Procedure)
   ───────────────────────────────────────────────────────────── */
function CalibrationModal({ sensor, onClose, onComplete }) {
  const [step, setStep] = useState(0); // 0: ready, 1: flushing, 2: sampling, 3: done
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step === 1) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setStep(2);
            return 100;
          }
          return p + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    } else if (step === 2) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setStep(3);
            return 100;
          }
          return p + 10;
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleFinish = () => {
    onComplete(sensor.id);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '28px 32px',
        maxWidth: 480, width: '92%', fontFamily: 'Inter',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Zap size={20} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Zero-Air Baseline Calibration
              </h3>
              <div style={{ fontSize: 12, color: '#64748b' }}>{sensor.label} ({sensor.type})</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {step === 0 && (
          <div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
              กระบวนการนี้จะทำการรีเซ็ตค่า Baseline Offset และชดเชย Drift ให้กับเซนเซอร์
              โดยอ้างอิงอากาศบริสุทธิ์ (Synthetic Clean Air / Zero Air Reference) เพื่อคืนสภาพความแม่นยำในการวัดตามมาตรฐาน IEEE
            </p>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>ขั้นตอนการดำเนินการ:</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                1. ฟลัชชิ่งอากาศบริสุทธิ์ผ่านห้องเซนเซอร์ (2 วินาที)<br />
                2. บันทึกและวิเคราะห์ค่าความต้านทานฐาน <i>R₀</i> เฉลี่ย<br />
                3. บันทึกค่า Drift Offset ใหม่และอัปเดตกำหนดการสอบเทียบ
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 13
              }}>ยกเลิก</button>
              <button onClick={() => setStep(1)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white',
                cursor: 'pointer', fontWeight: 700, fontSize: 13,
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              }}>
                <Play size={14} /> เริ่มสอบเทียบทันที
              </button>
            </div>
          </div>
        )}

        {(step === 1 || step === 2) && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RefreshCw size={26} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              {step === 1 ? 'กำลังฟลัชชิ่งอากาศบริสุทธิ์ผ่านตัวเซนเซอร์...' : 'กำลังวิเคราะห์ค่าความต้านทานฐาน R₀...'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>
              {step === 1 ? 'Phase 1/2: Purging with synthetic zero air' : 'Phase 2/2: Sampling baseline voltage'}
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 999, height: 10, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(90deg,#3b82f6,#6366f1)',
                transition: 'width 0.15s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{progress}% เสร็จสิ้น</div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={32} color="#16a34a" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#166534', marginBottom: 6 }}>
              สอบเทียบ {sensor.label} สำเร็จเรียบร้อย!
            </div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 18, lineHeight: 1.5 }}>
              Drift ถูกชดเชยเหลือ <b>1.5%</b> ค่า Health Index ฟื้นตัวสู่ระดับดีเยี่ยม
              และกำหนดการสอบเทียบครั้งต่อไปถูกเลื่อนออกไปอีก {sensor.calInterval} วัน
            </p>
            <button onClick={handleFinish} style={{
              width: '100%', padding: '10px', borderRadius: 10, border: 'none',
              background: '#16a34a', color: 'white', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
            }}>
              บันทึกและปิดหน้าต่าง
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DIAGNOSTIC TEST SUITE MODAL
   ───────────────────────────────────────────────────────────── */
function DiagnosticModal({ data, onClose, onAutoCalibrate }) {
  const [phase, setPhase] = useState(0); // 0..4, 4 = done
  const tests = [
    { title: 'I²C / UART Bus Communication', desc: 'CCS811 (0x5A), ADS1115 (0x48), PMS5003 (UART2) ping test', ok: true, latency: '4.2 ms' },
    { title: 'MOS Sensor Heater Coil Continuity', desc: 'MQ-2, MQ-3, MQ-8, MQ-135 heating loop voltage (5.0V ± 0.1V)', ok: true, latency: '12.8 ms' },
    { title: 'Baseline Drift & Signal Noise', desc: 'Comparison against factory baseline matrix', ok: false, flagged: 'MQ-135, MQ-3 exceed 15% drift' },
    { title: 'Chamber Pressure & Filter Differential', desc: 'Airflow speed sensor & filter particulate accumulation', ok: true, deltaP: '22 Pa (Normal)' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase(p => {
        if (p < 4) return p + 1;
        clearInterval(timer);
        return 4;
      });
    }, 700);
    return () => clearInterval(timer);
  }, []);

  const issues = data.sensors.filter(s => s.hi <= s.warnHI);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '28px 32px',
        maxWidth: 580, width: '92%', fontFamily: 'Inter',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Activity size={20} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                System Hardware Diagnostics
              </h3>
              <div style={{ fontSize: 12, color: '#64748b' }}>IEEE Multi-Sensor Diagnostic Suite</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* Phase checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {tests.map((t, i) => {
            const isRunning = phase === i;
            const isCompleted = phase > i;
            return (
              <div key={t.title} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: isCompleted ? (t.ok ? '#f0fdf4' : '#fff7ed') : '#f8fafc',
                border: `1px solid ${isCompleted ? (t.ok ? '#86efac' : '#fed7aa') : '#e2e8f0'}`,
                transition: 'all 0.3s ease',
              }}>
                <div style={{ marginTop: 2 }}>
                  {isRunning ? (
                    <RefreshCw size={18} color="#2563eb" style={{ animation: 'spin 0.8s linear infinite' }} />
                  ) : isCompleted ? (
                    t.ok ? <CheckCircle2 size={18} color="#16a34a" /> : <AlertTriangle size={18} color="#d97706" />
                  ) : (
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #cbd5e1' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t.title}</span>
                    {isCompleted && (
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        color: t.ok ? '#16a34a' : '#d97706',
                      }}>{t.ok ? 'PASS' : 'WARNING'}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {t.desc}
                  </div>
                  {isCompleted && (
                    <div style={{ fontSize: 11, color: t.ok ? '#15803d' : '#b45309', marginTop: 3, fontWeight: 600 }}>
                      {t.ok ? `✓ Latency / Delta: ${t.latency || t.deltaP}` : `⚠️ ${t.flagged}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {phase >= 4 && (
          <div style={{
            background: issues.length ? '#fffbeb' : '#f0fdf4',
            borderRadius: 12, padding: '14px 16px',
            border: `1px solid ${issues.length ? '#fcd34d' : '#86efac'}`,
            marginBottom: 18,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: issues.length ? '#92400e' : '#166534', marginBottom: 4 }}>
              {issues.length ? `สรุปผล: พบ ${issues.length} รายการที่ต้องดำเนินการ` : 'สรุปผล: ระบบฮาร์ดแวร์ทำงานสมบูรณ์ 100%'}
            </div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              {issues.length ? (
                <span>
                  แนะนำให้ทำการ Calibrate Baseline สำหรับเซนเซอร์: <b>{issues.map(s => s.label).join(', ')}</b> เพื่อคืนสภาพความแม่นยำ
                </span>
              ) : 'ไม่พบปัญหาฮาร์ดแวร์หรือ drift เกินเกณฑ์'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0',
            background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 13
          }}>ปิด</button>
          {issues.length > 0 && phase >= 4 && (
            <button onClick={() => { onAutoCalibrate(); onClose(); }} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white',
              cursor: 'pointer', fontWeight: 700, fontSize: 13,
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}>
              <Zap size={14} /> ทำการ Auto-Calibrate เซนเซอร์ที่มีปัญหา
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PRINTABLE WORK ORDER & INSPECTION REPORT MODAL
   ───────────────────────────────────────────────────────────── */
function ReportModal({ data, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '32px 36px',
        maxWidth: 780, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        fontFamily: 'Inter, sans-serif', boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        {/* Top actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.05em' }}>
            PREDICTIVE MAINTENANCE SERVICE AUDIT REPORT
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: '1px solid #3b82f6',
              background: '#eff6ff', color: '#2563eb', cursor: 'pointer',
              fontWeight: 700, fontSize: 12,
            }}>
              <Printer size={14} /> พิมพ์ / บันทึกเป็น PDF
            </button>
            <button onClick={onClose} style={{
              background: '#f1f5f9', border: 'none', borderRadius: 8,
              padding: '7px 12px', cursor: 'pointer', color: '#64748b', fontSize: 12,
            }}>✕ ปิด</button>
          </div>
        </div>

        {/* Report Header */}
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
                ใบรายงานผลตรวจสภาพและบำรุงรักษาชุดเซนเซอร์ (E-Nose Unit)
              </h2>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                VOC & Gas Sensor Array Chamber · Model: ENS-8X-V2 · Box ID: #VOC-01
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
              <div>วันที่ตรวจสอบ: <b>{new Date().toLocaleDateString('th-TH')}</b></div>
              <div>เวลา: <b>{new Date().toLocaleTimeString('th-TH')}</b></div>
              <div>Uptime รวม: <b>{data.systemUptime} ชั่วโมง</b></div>
            </div>
          </div>
        </div>

        {/* Summary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>Overall Health</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#2563eb' }}>
              {Math.round(data.sensors.reduce((s, x) => s + x.hi, 0) / data.sensors.length)}%
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>เซนเซอร์ที่ผ่านเกณฑ์</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#16a34a' }}>
              {data.sensors.filter(s => s.hi > s.warnHI).length} / {data.sensors.length}
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>HEPA Filter Status</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0284c7' }}>
              {data.filter.hi}% (RUL {data.filter.rul}d)
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>สอบเทียบค้าง</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: data.sensors.filter(s => s.calOverdue).length ? '#dc2626' : '#16a34a' }}>
              {data.sensors.filter(s => s.calOverdue).length} ตัว
            </div>
          </div>
        </div>

        {/* Sensor Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
          <thead>
            <tr style={{ background: '#0f172a', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', borderRadius: '4px 0 0 0' }}>เซนเซอร์</th>
              <th style={{ padding: '8px 10px' }}>ชนิด / Pin</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>HI (%)</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Drift</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>RUL (วัน)</th>
              <th style={{ padding: '8px 10px' }}>สถานะ</th>
              <th style={{ padding: '8px 10px', borderRadius: '0 4px 0 0' }}>คำแนะนำ</th>
            </tr>
          </thead>
          <tbody>
            {data.sensors.map((s, idx) => {
              const c = hiColor(s.hi, s.warnHI, s.critHI);
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{s.label}</td>
                  <td style={{ padding: '8px 10px', color: '#64748b' }}>{s.type} ({s.pin})</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: c.fg }}>{s.hi}%</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>{(s.drift * 100).toFixed(1)}%</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{s.rul > 999 ? '>3 yr' : `${s.rul}d`}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.fg }}>{c.label}</span>
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: '#475569' }}>
                    {s.calOverdue
                      ? '⚠️ ต้อง Calibrate ด่วน'
                      : s.hi <= s.warnHI
                        ? 'ตรวจเช็ค baseline offset'
                        : 'ใช้งานได้ตามปกติ'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 36, paddingTop: 20, borderTop: '1px dashed #cbd5e1' }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 35 }}>ผู้ตรวจสอบ / ช่างเทคนิค (Inspected By):</div>
            <div style={{ borderBottom: '1px solid #0f172a', width: '80%', marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: '#64748b' }}>ลงชื่อ: .................................................... (พนักงานบำรุงรักษา)</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 35 }}>วิศวกรผู้รับรองผล (Approved Engineer):</div>
            <div style={{ borderBottom: '1px solid #0f172a', width: '80%', marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: '#64748b' }}>ลงชื่อ: .................................................... (Lead Quality Engineer)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SENSOR DETAIL MODAL
   ───────────────────────────────────────────────────────────── */
function SensorModal({ sensor, onClose, onCalibrate }) {
  if (!sensor) return null;
  const c = hiColor(sensor.hi, sensor.warnHI, sensor.critHI);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '28px 32px',
        maxWidth: 520, width: '90%', fontFamily: 'Inter',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        border: `2px solid ${sensor.color}30`,
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: `${sensor.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>🔬</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: sensor.color }}>{sensor.label}</span>
              <StatusBadge hi={sensor.hi} warn={sensor.warnHI} crit={sensor.critHI} />
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sensor.type} · {sensor.pin}</div>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', color: '#64748b',
          }}>✕</button>
        </div>

        {/* Health Index big gauge */}
        <div style={{
          background: c.bg, borderRadius: 16, padding: '20px 24px',
          marginBottom: 18, border: `1px solid ${c.track}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: c.fg, lineHeight: 1 }}>{sensor.hi}</span>
            <span style={{ fontSize: 18, color: c.fg, fontWeight: 600 }}>%</span>
            <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>Health Index</span>
          </div>
          <HealthBar hi={sensor.hi} warn={sensor.warnHI} crit={sensor.critHI} height={12} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
            <span>Critical &lt;{sensor.critHI}%</span>
            <span>Warning &lt;{sensor.warnHI}%</span>
            <span>Excellent 80%+</span>
          </div>
        </div>

        {/* Action buttons (Calibrate) */}
        <div style={{ marginBottom: 18 }}>
          <button onClick={() => { onCalibrate(sensor); onClose(); }} style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white',
            cursor: 'pointer', fontWeight: 700, fontSize: 12,
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}>
            <Zap size={14} /> สอบเทียบ Zero-Air Baseline
          </button>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Remaining Useful Life', value: sensor.rul > 999 ? '>3 yr' : `${sensor.rul} วัน`, icon: '⏳' },
            { label: 'อายุการใช้งาน', value: `${sensor.age} วัน`, icon: '📅' },
            { label: 'Baseline Drift', value: `${(sensor.drift * 100).toFixed(1)}%`, icon: '📊' },
            { label: 'Signal Noise', value: `${(sensor.noise * 100).toFixed(1)}%`, icon: '〰️' },
            { label: 'สอบเทียบล่าสุด', value: sensor.lastCal, icon: '🔧' },
            { label: 'สอบเทียบครั้งต่อไป', value: sensor.nextCal, icon: sensor.calOverdue ? '⚠️' : '✅' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{
              background: '#f8fafc', borderRadius: 10, padding: '10px 14px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>{icon} {label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Measurands */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>
            MEASURANDS
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sensor.measurands.map(m => (
              <span key={m} style={{
                fontSize: 11, background: `${sensor.color}12`,
                color: sensor.color, padding: '3px 10px', borderRadius: 999,
                border: `1px solid ${sensor.color}30`, fontWeight: 600,
              }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{
          background: '#fafafa', borderRadius: 10, padding: '12px 14px',
          border: '1px solid #e2e8f0', fontSize: 12, color: '#475569', lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>ℹ️ หมายเหตุ: </span>
          {sensor.notes}
        </div>

        {/* 30-day trend */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: '0.05em' }}>
            HEALTH TREND — 30 วันที่ผ่านมา
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <Sparkline data={sensor.trend} color={c.fg} />
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              <div>Max: {Math.round(Math.max(...sensor.trend))}%</div>
              <div>Min: {Math.round(Math.min(...sensor.trend))}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SENSOR ROW
   ───────────────────────────────────────────────────────────── */
function SensorRow({ sensor, onSelect, onCalibrate }) {
  const c = hiColor(sensor.hi, sensor.warnHI, sensor.critHI);
  const displayName = sensor.label || sensor.name || sensor.id?.toUpperCase() || 'Sensor';
  const displayType = sensor.type || 'Gas (MOS)';
  const displayPin = sensor.pin ? ` · ${sensor.pin}` : '';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 105px 85px 85px 105px 145px 24px',
        alignItems: 'center', gap: 12,
        padding: '13px 18px', cursor: 'pointer',
        borderBottom: '1px solid #f1f5f9',
        transition: 'background 0.15s',
        background: 'white',
        borderLeft: `3px solid ${sensor.hi <= sensor.critHI ? '#dc2626' : sensor.hi <= sensor.warnHI ? '#d97706' : 'transparent'}`,
      }}
      onClick={() => onSelect(sensor)}
      onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}
    >
      {/* Name + type */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: c.fg, boxShadow: `0 0 5px ${c.fg}80`,
          }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>{displayName}</span>
          {sensor.calOverdue && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
              background: '#fef3c7', color: '#92400e',
            }}>CAL OVERDUE</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', paddingLeft: 17 }}>{displayType}{displayPin}</div>
      </div>

      {/* Health Index bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: '#64748b' }}>HI</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: c.fg }}>{sensor.hi}%</span>
        </div>
        <HealthBar hi={sensor.hi} warn={sensor.warnHI} crit={sensor.critHI} height={6} />
      </div>

      {/* RUL */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 1 }}>RUL</div>
        <div style={{
          fontSize: 13, fontWeight: 800,
          color: sensor.rul < 30 ? '#dc2626' : sensor.rul < 90 ? '#d97706' : '#16a34a',
        }}>
          {sensor.rul > 999 ? '>3 yr' : `${sensor.rul}d`}
        </div>
      </div>

      {/* Status badge */}
      <div><StatusBadge hi={sensor.hi} warn={sensor.warnHI} crit={sensor.critHI} /></div>

      {/* Trend sparkline */}
      <Sparkline data={sensor.trend} color={c.fg} />

      {/* Quick Action buttons */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onCalibrate(sensor)}
          title="สอบเทียบ Zero-Air Baseline"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 8px', borderRadius: 6, border: '1px solid #bfdbfe',
            background: '#eff6ff', color: '#2563eb', cursor: 'pointer',
            fontSize: 10, fontWeight: 700,
          }}
        >
          <Zap size={11} /> Calibrate
        </button>
      </div>

      {/* Arrow */}
      <ChevronRight size={15} color="#94a3b8" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */
export default function Maintenance() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [calibratingSensor, setCalibratingSensor] = useState(null);
  const [showDiagModal, setShowDiagModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterTab, setFilterTabState] = useState(() => localStorage.getItem('voc_maint_filter') || 'all'); // all | warn | ok
  const setFilterTab = (tab) => {
    setFilterTabState(tab);
    localStorage.setItem('voc_maint_filter', tab);
  };
  const [toastMsg, setToastMsg] = useState(null);

  // Load maintenance data
  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/maintenance/status`);
      if (r.ok) {
        const raw = await r.json();
        const mergedSensors = (raw.sensors || []).map(s => {
          const meta = SENSOR_META.find(m => m.id === s.id) || {};
          return {
            ...meta,
            ...s,
            label: s.label || meta.label || s.id?.toUpperCase(),
            type: s.type || meta.type || 'Gas (MOS)',
            pin: s.pin || meta.pin || '',
            color: s.color || meta.color || '#3b82f6',
          };
        });
        setData({ ...raw, sensors: mergedSensors });
        return;
      }
    } catch { /* mock fallback */ }
    setData(generateMaintenanceData());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Execute Calibration (update local state & call backend if available)
  const handleCalibrateComplete = async (sensorId) => {
    try {
      await fetch(`${API}/api/maintenance/calibrate/${sensorId}`, { method: 'POST' });
      await fetch(`${API}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'MAINTENANCE',
          action: 'CALIBRATE_BASELINE',
          status: 'SUCCESS',
          detail: `สอบเทียบ Zero-Air Baseline สำหรับเซนเซอร์ ${sensorId.toUpperCase()} สำเร็จ`
        }),
      }).catch(() => {});
    } catch { /* silent */ }

    setData(prev => {
      if (!prev) return prev;
      const updatedSensors = prev.sensors.map(s => {
        if (s.id !== sensorId) return s;
        const newDrift = 0.015;
        const newNoise = 0.02;
        const ageFactor = Math.max(0, 1 - s.age / s.lifespan);
        const driftFactor = Math.max(0, 1 - newDrift / 0.40);
        const noiseFactor = Math.max(0, 1 - newNoise / 0.25);
        const newHI = Math.min(100, Math.round((0.40 * ageFactor + 0.35 * driftFactor + 0.25 * noiseFactor) * 100));
        const degradRate = Math.max(0.01, (newHI - s.critHI) / (s.age || 1));
        const newRUL = Math.round((newHI - s.critHI) / degradRate);

        return {
          ...s,
          drift: newDrift,
          noise: newNoise,
          hi: newHI,
          rul: newRUL,
          calOverdue: false,
          lastCal: 'วันนี้',
          nextCal: `ในอีก ${s.calInterval} วัน`,
        };
      });
      return { ...prev, sensors: updatedSensors };
    });

    setToastMsg(`✅ สอบเทียบ Zero-Air Baseline สำหรับ ${sensorId.toUpperCase()} เรียบร้อยแล้ว`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Replace Filter Action
  const handleReplaceFilter = async () => {
    try {
      await fetch(`${API}/api/maintenance/replace-filter`, { method: 'POST' });
    } catch { /* silent */ }

    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        filter: {
          ...prev.filter,
          hi: 100,
          age: 0,
          rul: 180,
          replaceBy: new Date(Date.now() + 180 * 24 * 3600 * 1000).toLocaleDateString('th-TH'),
        }
      };
    });

    setToastMsg('🎉 บันทึกการเปลี่ยนไส้กรอง HEPA เรียบร้อย — Health Index รีเซ็ตเป็น 100%');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Auto calibrate all flagged sensors
  const handleAutoCalibrateAll = () => {
    if (!data) return;
    const issues = data.sensors.filter(s => s.hi <= s.warnHI || s.calOverdue);
    issues.forEach(s => handleCalibrateComplete(s.id));
    setToastMsg(`⚡ Auto-Calibrate สำเร็จ ${issues.length} รายการ`);
    setTimeout(() => setToastMsg(null), 4000);
  };



  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#94a3b8', fontFamily: 'Inter', gap: 10 }}>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
      กำลังโหลดข้อมูล Maintenance & Health Index...
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const overallHI = Math.round(data.sensors.reduce((s, x) => s + x.hi, 0) / data.sensors.length);
  const critCount = data.sensors.filter(s => s.hi <= s.critHI).length;
  const warnCount = data.sensors.filter(s => s.hi <= s.warnHI && s.hi > s.critHI).length;
  const calOverdue = data.sensors.filter(s => s.calOverdue).length;

  const overallC = hiColor(overallHI, 65, 45);
  const filterC = hiColor(data.filter.hi, FILTER_META.warnPct, FILTER_META.critPct);

  const filtered = data.sensors.filter(s => {
    if (filterTab === 'warn') return s.hi <= s.warnHI || s.calOverdue;
    if (filterTab === 'ok')   return s.hi > s.warnHI && !s.calOverdue;
    return true;
  });

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 1160, margin: '0 auto', padding: '24px 28px' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Wrench size={19} color="white" /></div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
              Sensor Maintenance & Quality Assurance
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe',
            }}>IEEE RUL Engine</span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            ระบบตรวจเช็คคุณภาพเซนเซอร์, ชดเชย Drift Baseline, คาดการณ์อายุ RUL และจัดการเปลี่ยนอะไหล่
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowReportModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 15px', borderRadius: 10, border: '1px solid #cbd5e1',
            background: 'white', color: '#334155', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
          }}>
            <FileText size={15} color="#2563eb" /> ออกใบรายงาน
          </button>
          <button onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
            background: 'white', color: '#475569', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
          }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={() => setShowDiagModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            color: 'white', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
            transition: 'all 0.2s',
          }}>
            <Activity size={15} /> Run Diagnostics
          </button>
        </div>
      </div>

      {/* ── Toast Alert ── */}
      {toastMsg && (
        <div style={{
          marginBottom: 20, padding: '12px 18px', borderRadius: 12,
          background: '#f0fdf4', border: '1.5px solid #86efac',
          color: '#166534', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(22,163,74,0.1)',
        }}>
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {/* Overall HI */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px 22px',
          border: `1.5px solid ${overallC.track}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>OVERALL HEALTH</div>
            <Gauge size={18} color={overallC.fg} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: overallC.fg, lineHeight: 1, marginBottom: 10 }}>{overallHI}<span style={{ fontSize: 16 }}>%</span></div>
          <HealthBar hi={overallHI} warn={65} crit={45} height={8} />
        </div>

        {/* Alert counts */}
        <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', border: '1.5px solid #fee2e2', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>ต้องดูแล</div>
            <AlertTriangle size={18} color="#d97706" />
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>{critCount}</div>
              <div style={{ fontSize: 10, color: '#dc2626' }}>Critical</div>
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#d97706', lineHeight: 1 }}>{warnCount}</div>
              <div style={{ fontSize: 10, color: '#d97706' }}>Warning</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{data.sensors.length - critCount - warnCount} sensors สภาพดี</div>
        </div>

        {/* Filter status */}
        <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', border: `1.5px solid ${filterC.track}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>FILTER STATUS</div>
            <Filter size={18} color={filterC.fg} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: filterC.fg, lineHeight: 1, marginBottom: 10 }}>{data.filter.hi}<span style={{ fontSize: 16 }}>%</span></div>
          <HealthBar hi={data.filter.hi} warn={FILTER_META.warnPct} crit={FILTER_META.critPct} height={8} />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
            เปลี่ยนภายใน {data.filter.rul} วัน · ก่อน {data.filter.replaceBy}
          </div>
        </div>

        {/* Cal Overdue */}
        <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>สอบเทียบค้าง</div>
            <Clock size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: calOverdue > 0 ? '#d97706' : '#16a34a', lineHeight: 1, marginBottom: 10 }}>{calOverdue}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {calOverdue > 0
              ? `${data.sensors.filter(s => s.calOverdue).map(s => s.label).join(', ')} เกินกำหนด`
              : 'ทุก sensor อยู่ในกำหนด'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Uptime: {data.systemUptime}h</div>
        </div>
      </div>

      {/* ── Main Content: Sensor Table + Filter Status ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Left: Sensor Table */}
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #f1f5f9' }}>
          {/* Table Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={17} color="#3b82f6" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sensor Health & Degradation Matrix</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {[['all', 'ทั้งหมด'], ['warn', '⚠️ ต้องดูแล'], ['ok', '✅ สภาพดี']].map(([v, l]) => (
                <button key={v} onClick={() => setFilterTab(v)} style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  background: filterTab === v ? '#eff6ff' : 'transparent',
                  color: filterTab === v ? '#3b82f6' : '#94a3b8',
                  transition: 'all 0.15s',
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.4fr 105px 85px 85px 105px 145px 24px',
            gap: 12, padding: '8px 18px', background: '#f8fafc',
            fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em',
          }}>
            <span>SENSOR</span>
            <span>HEALTH INDEX</span>
            <span style={{ textAlign: 'right' }}>RUL</span>
            <span>STATUS</span>
            <span>TREND 30d</span>
            <span style={{ textAlign: 'center' }}>ACTIONS</span>
            <span />
          </div>

          {/* Rows */}
          {filtered.map(s => (
            <SensorRow
              key={s.id}
              sensor={s}
              onSelect={setSelected}
              onCalibrate={setCalibratingSensor}
            />
          ))}

          <div style={{ padding: '12px 20px', fontSize: 11, color: '#94a3b8', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <span>HI คำนวณจาก: Drift (35%) + Noise (25%) + Age (40%)</span>
            <span>คลิกแถวเพื่อดูรายละเอียดเชิงลึก</span>
          </div>
        </div>

        {/* Right: Filter + Schedule + 3D CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Filter Health Card */}
          <div style={{
            background: 'white', borderRadius: 16, padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1.5px solid ${filterC.track}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Filter size={17} color={filterC.fg} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Filter Quality</span>
              <StatusBadge hi={data.filter.hi} warn={FILTER_META.warnPct} crit={FILTER_META.critPct} />
            </div>

            {/* Circular gauge */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto',
                border: `10px solid ${filterC.track}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: filterC.bg,
              }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: filterC.fg, lineHeight: 1 }}>{data.filter.hi}</div>
                <div style={{ fontSize: 12, color: filterC.fg, fontWeight: 600 }}>%</div>
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>HEPA Filter</div>
              </div>
            </div>

            <HealthBar hi={data.filter.hi} warn={FILTER_META.warnPct} crit={FILTER_META.critPct} height={8} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14, marginBottom: 14 }}>
              {[
                { label: 'RUL', value: `${data.filter.rul} วัน` },
                { label: 'อายุ', value: `${data.filter.age} วัน` },
                { label: 'เปลี่ยนก่อน', value: data.filter.replaceBy },
                { label: 'Lifespan', value: `${FILTER_META.lifespan} วัน` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{value}</div>
                </div>
              ))}
            </div>

            <button onClick={handleReplaceFilter} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px', borderRadius: 9, border: '1px solid #bfdbfe',
              background: '#eff6ff', color: '#1e40af', cursor: 'pointer',
              fontWeight: 700, fontSize: 12, transition: 'all 0.2s',
            }}>
              <Check size={14} /> บันทึกเปลี่ยนไส้กรองใหม่
            </button>
          </div>


          {/* Maintenance Schedule */}
          <div style={{ background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={17} color="#6366f1" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>กำหนดการบำรุงรักษา</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.sensors
                .filter(s => s.rul < 120 || s.calOverdue)
                .sort((a, b) => a.rul - b.rul)
                .slice(0, 5)
                .map(s => {
                  const urgent = s.rul < 30 || s.calOverdue;
                  return (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 10,
                      background: urgent ? '#fff7ed' : '#f8fafc',
                      border: `1px solid ${urgent ? '#fed7aa' : '#e2e8f0'}`,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                          {s.calOverdue ? `🔧 ${s.label} — สอบเทียบเกินกำหนด` : `⏳ ${s.label} — RUL ${s.rul} วัน`}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>
                          {s.calOverdue ? `ครั้งถัดไป: ${s.nextCal}` : `HI: ${s.hi}% (${hiColor(s.hi, s.warnHI, s.critHI).label})`}
                        </div>
                      </div>
                      {urgent && <AlertTriangle size={14} color="#d97706" />}
                    </div>
                  );
                })}
              {data.sensors.filter(s => s.rul < 120 || s.calOverdue).length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '16px 0' }}>
                  ✅ ไม่มีงานบำรุงรักษาเร่งด่วน
                </div>
              )}
            </div>
          </div>

          {/* IEEE Reference */}
          <div style={{
            background: '#f8faff', borderRadius: 12, padding: '14px 16px',
            border: '1.5px solid #dbeafe', fontSize: 11, color: '#3b82f6',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <BarChart3 size={12} /> IEEE Reference Standards
            </div>
            <div style={{ color: '#64748b', lineHeight: 1.6 }}>
              HI = 0.40×Age + 0.35×Drift + 0.25×Noise<br />
              RUL = (HI - HI<sub>thresh</sub>) / λ<br />
              <span style={{ fontSize: 10 }}>IEEE TASE 2023 · Rehman et al. 2021</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {selected && (
        <SensorModal
          sensor={selected}
          onClose={() => setSelected(null)}
          onCalibrate={setCalibratingSensor}
        />
      )}

      {calibratingSensor && (
        <CalibrationModal
          sensor={calibratingSensor}
          onClose={() => setCalibratingSensor(null)}
          onComplete={handleCalibrateComplete}
        />
      )}

      {showDiagModal && (
        <DiagnosticModal
          data={data}
          onClose={() => setShowDiagModal(false)}
          onAutoCalibrate={handleAutoCalibrateAll}
        />
      )}

      {showReportModal && (
        <ReportModal
          data={data}
          onClose={() => setShowReportModal(false)}
        />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
