import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw, CheckCircle, Info, RefreshCw, Cpu, Volume2, VolumeX, ShieldAlert, Volume1 } from 'lucide-react';
import {
  getThresholds, saveThresholds, DEFAULT_THRESHOLDS,
  getGeneral,    saveGeneral,    DEFAULT_GENERAL,
  resetThresholds, resetGeneral,
} from '../utils/settings';
import {
  isSoundEnabled, setSoundEnabled, toggleSoundEnabled, triggerAlertSound
} from '../utils/soundAlert';

// ข้อมูลประกอบแต่ละ sensor
const SENSOR_META = {
  tvoc: {
    color: '#8b5cf6',
    desc: 'Total Volatile Organic Compounds — สารอินทรีย์ระเหยง่ายรวม วัดโดย SGP30/SGP40',
    reference: 'WHO: < 300 ppb | ปกติในบ้าน: 50–250 ppb',
  },
  pm25: {
    color: '#f59e0b',
    desc: 'ฝุ่นละอองขนาดเล็ก < 2.5 µm วัดโดย SPS30 หรือ PMS5003',
    reference: 'WHO 24h: < 15 µg/m³ | มาตรฐาน TH: < 50 µg/m³',
  },
  eco2: {
    color: '#0ea5e9',
    desc: 'Equivalent CO₂ ประมาณจาก TVOC (SGP30) ไม่ใช่ CO₂ จริง',
    reference: 'บรรยากาศภายนอก: ~400 ppm | สบาย: < 1000 ppm',
  },
};

export default function Settings() {
  const [thresholds, setThresholds] = useState(() => getThresholds());
  const [general,    setGeneral]    = useState(() => getGeneral());
  const [saved,      setSaved]      = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'syncing' | 'ok' | 'error'
  const [modelMsg,   setModelMsg]   = useState(null);
  const [soundOn,    setSoundOn]    = useState(() => isSoundEnabled());
  const isMock = !!window.__VOC_MOCK_MODE;
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const handleToggle = (e) => setSoundOn(e.detail.enabled);
    window.addEventListener('voc_sound_toggle', handleToggle);
    return () => window.removeEventListener('voc_sound_toggle', handleToggle);
  }, []);

  // ─── handlers ───────────────────────────────────────────────
  function handleThreshChange(key, field, raw) {
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    setThresholds(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  }

  async function handleSave() {
    // 1. บันทึกลง localStorage
    saveThresholds(thresholds);
    saveGeneral(general);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    // 2. Sync threshold ไป Backend (ถ้าไม่ใช่ Mock Mode)
    if (!isMock) {
      setSyncStatus('syncing');
      try {
        const res = await fetch(`${API}/api/thresholds`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tvoc_warn:     thresholds.tvoc.warn,
            tvoc_critical: thresholds.tvoc.critical,
            pm25_warn:     thresholds.pm25.warn,
            pm25_critical: thresholds.pm25.critical,
            eco2_warn:     thresholds.eco2.warn,
            eco2_critical: thresholds.eco2.critical,
          }),
        });
        setSyncStatus(res.ok ? 'ok' : 'error');
      } catch {
        setSyncStatus('error');
      }
      setTimeout(() => setSyncStatus(null), 4000);
    }
  }

  async function handleReloadModel() {
    setModelMsg('loading');
    try {
      const res = await fetch(`${API}/api/model/reload`, { method: 'POST' });
      const d   = await res.json();
      setModelMsg(d.loaded ? 'ok' : 'notfound');
    } catch {
      setModelMsg('error');
    }
    setTimeout(() => setModelMsg(null), 5000);
  }

  function handleReset() {
    resetThresholds();
    resetGeneral();
    setThresholds({ ...DEFAULT_THRESHOLDS });
    setGeneral({ ...DEFAULT_GENERAL });
    setSaved(false);
  }

  // ─── sub-components ──────────────────────────────────────────
  function ThresholdCard({ sensorKey }) {
    const meta = SENSOR_META[sensorKey];
    const t    = thresholds[sensorKey] ?? DEFAULT_THRESHOLDS[sensorKey];
    const maxVal = t.critical * 1.5;
    const warnPct = Math.min(100, (t.warn / maxVal) * 100);
    const critPct = Math.min(100, (t.critical / maxVal) * 100);

    return (
      <div style={{
        border: `2px solid ${meta.color}30`,
        borderRadius: '0.875rem',
        padding: '1.25rem',
        background: `${meta.color}06`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: meta.color }}>{t.label}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{t.unit}</div>
          </div>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
            borderRadius: '999px', backgroundColor: `${meta.color}20`, color: meta.color,
            letterSpacing: '0.05em',
          }}>SENSOR</span>
        </div>

        {/* Visual gradient bar */}
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
          <div style={{ height: 10, borderRadius: 5, background: 'linear-gradient(to right, #10b981, #f59e0b 50%, #ef4444)' }} />
          {/* warn marker */}
          <div style={{ position: 'absolute', top: -2, left: `${warnPct}%`, width: 2, height: 14, background: '#b45309', borderRadius: 1, transform: 'translateX(-50%)' }} />
          {/* crit marker */}
          <div style={{ position: 'absolute', top: -2, left: `${critPct}%`, width: 2, height: 14, background: '#991b1b', borderRadius: 1, transform: 'translateX(-50%)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '1rem' }}>
          <span>0</span>
          <span style={{ color: '#b45309' }}>⚠ {t.warn}</span>
          <span style={{ color: '#991b1b' }}>🔴 {t.critical}</span>
          <span>{Math.round(maxVal)}+</span>
        </div>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { field: 'warn',     label: '⚠ Warning',  border: '#f59e0b55', labelColor: '#b45309' },
            { field: 'critical', label: '🔴 Critical', border: '#ef444455', labelColor: '#991b1b' },
          ].map(({ field, label, border, labelColor }) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: labelColor, marginBottom: '0.3rem' }}>{label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="number"
                  value={t[field]}
                  onChange={e => handleThreshChange(sensorKey, field, e.target.value)}
                  style={{
                    width: '100%', padding: '0.45rem 0.5rem',
                    borderRadius: '0.375rem', border: `1.5px solid ${border}`,
                    fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700,
                    background: 'white', outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>{t.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: `1px solid ${meta.color}20` }}>
          <p style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.6 }}>{meta.desc}</p>
          <p style={{ fontSize: '0.7rem', color: meta.color, fontWeight: 600, marginTop: '0.25rem' }}>📌 {meta.reference}</p>
        </div>
      </div>
    );
  }

  // ─── render ──────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 960 }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={22} /> Settings
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Saved badge */}
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
              <CheckCircle size={15} /> บันทึกแล้ว!
            </span>
          )}
          {/* Backend sync status */}
          {syncStatus === 'syncing' && (
            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Syncing...
            </span>
          )}
          {syncStatus === 'ok' && (
            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle size={13} /> Synced กับ Backend
            </span>
          )}
          {syncStatus === 'error' && (
            <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>⚠ Sync ไม่ได้ (Backend offline?)</span>
          )}
          <button onClick={handleReset} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1rem', border: '1px solid var(--border-color)',
            borderRadius: '0.5rem', backgroundColor: 'white', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)',
          }}>
            <RotateCcw size={13} /> รีเซ็ตค่าเริ่มต้น
          </button>
          <button onClick={handleSave} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem',
            backgroundColor: saved ? '#10b981' : 'var(--primary-color)',
            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'white',
            transition: 'background-color 0.3s',
          }}>
            <Save size={13} /> บันทึก
          </button>
        </div>
      </div>

      {/* ── Section 1: General ──────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>🔧 การตั้งค่าทั่วไป</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
              Box ID เริ่มต้น (Dashboard)
            </label>
            <input
              value={general.boxId}
              onChange={e => setGeneral(g => ({ ...g, boxId: e.target.value }))}
              placeholder="เช่น BOX-001"
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.875rem' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>กล่องเซนเซอร์ที่ Dashboard จะแสดงเมื่อเปิดครั้งแรก</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
              อัปเดตอัตโนมัติทุก (วินาที)
            </label>
            <input
              type="number" min="3" max="60"
              value={general.refreshInterval}
              onChange={e => setGeneral(g => ({ ...g, refreshInterval: Number(e.target.value) }))}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.875rem' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>ค่าแนะนำ: 5–10 วิ &nbsp;|&nbsp; ขั้นต่ำ: 3 วิ</p>
          </div>
        </div>

        {/* Sound Alert Setting Row */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {soundOn ? <Volume2 size={18} style={{ color: '#10b981' }} /> : <VolumeX size={18} style={{ color: '#64748b' }} />}
              เสียงแจ้งเตือนผ่านเว็บ (Web Audio Sound Alert)
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              ส่งสัญญาณเสียงเตือนอัตโนมัติเมื่อเกิดเหตุการณ์ Warning หรือ Critical (มีระบบ Cooldown 10 วิ ป้องกันเสียงดังรบกวน)
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                const next = toggleSoundEnabled();
                setSoundOn(next);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.875rem', borderRadius: '0.5rem',
                border: `1px solid ${soundOn ? '#86efac' : '#cbd5e1'}`,
                backgroundColor: soundOn ? '#dcfce7' : '#f1f5f9',
                color: soundOn ? '#166534' : '#475569',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {soundOn ? 'เปิดใช้งานอยู่' : 'ปิดใช้งาน'}
            </button>
            <button
              type="button"
              onClick={() => triggerAlertSound('Warning', true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
                border: '1px solid #93c5fd', backgroundColor: '#eff6ff',
                color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Volume1 size={14} /> ทดสอบ Warning
            </button>
            <button
              type="button"
              onClick={() => triggerAlertSound('Critical', true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
                border: '1px solid #fca5a5', backgroundColor: '#fef2f2',
                color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <ShieldAlert size={14} /> ทดสอบ Critical
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 2: Thresholds ───────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>🚨 เกณฑ์การแจ้งเตือน (Alert Thresholds)</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.875rem', borderRadius: '0.5rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '1.25rem' }}>
          <Info size={15} style={{ color: '#2563eb', flexShrink: 0 }} />
          <p style={{ fontSize: '0.8rem', color: '#1e40af', margin: 0 }}>
            ค่านี้ส่งผลต่อ<strong>สีตัวเลขบน Dashboard</strong> — หากต้องการให้ Backend สร้าง Alert จริง ต้องแก้ <code style={{ background: '#dbeafe', padding: '0 4px', borderRadius: 3 }}>THRESHOLDS</code> ใน <code style={{ background: '#dbeafe', padding: '0 4px', borderRadius: 3 }}>backend/main.py</code> ด้วย
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {Object.keys(SENSOR_META).map(key => (
            <ThresholdCard key={key} sensorKey={key} />
          ))}
        </div>
      </div>

      {/* ── Section 3: AI Model ──────────────────────────────── */}
      {!isMock && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} /> AI Model Management
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleReloadModel}
              disabled={modelMsg === 'loading'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.55rem 1.25rem', border: 'none', borderRadius: '0.5rem',
                backgroundColor: '#6366f1', color: 'white', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: 600, opacity: modelMsg === 'loading' ? 0.7 : 1,
              }}
            >
              <RefreshCw size={14} style={{ animation: modelMsg === 'loading' ? 'spin 1s linear infinite' : 'none' }} />
              {modelMsg === 'loading' ? 'กำลังโหลด...' : 'Reload Model'}
            </button>
            {modelMsg === 'ok' && (
              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <CheckCircle size={15} /> โหลด Model ใหม่สำเร็จ
              </span>
            )}
            {modelMsg === 'notfound' && (
              <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>
                ⚠ ไม่พบไฟล์ voc_model.pkl — วาง model ใน backend/ แล้วลองใหม่
              </span>
            )}
            {modelMsg === 'error' && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>⚠ เชื่อมต่อ Backend ไม่ได้</span>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              หลัง retrain ให้ copy <code style={{ background: '#f1f5f9', padding: '0 4px', borderRadius: 3 }}>voc_model.pkl</code> เข้า backend/ แล้วกด Reload — ไม่ต้อง restart server
            </span>
          </div>
        </div>
      )}

      {/* ── Section 4: System Info ──────────────────────────── */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>ℹ️ ข้อมูลระบบ</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            {
              label: 'โหมดข้อมูล',
              value: isMock ? '🟡 Mock Mode' : '🟢 Live Mode',
              sub: isMock ? 'ข้อมูลจำลอง — ยังไม่เชื่อมต่อ Backend' : 'เชื่อมต่อ Backend แล้ว',
            },
            { label: 'Backend URL',    value: 'localhost:8000',    sub: 'FastAPI + PostgreSQL' },
            { label: 'Frontend',       value: 'React + Vite',      sub: 'v1.0.0' },
            { label: 'AI Framework',   value: 'scikit-learn',      sub: 'RandomForest Classifier' },
          ].map(item => (
            <div key={item.label} style={{ padding: '0.875rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.3rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: item.label.includes('URL') ? 'monospace' : 'inherit' }}>{item.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`input[type=number]::-webkit-inner-spin-button { opacity: 1; }`}</style>
    </div>
  );
}
