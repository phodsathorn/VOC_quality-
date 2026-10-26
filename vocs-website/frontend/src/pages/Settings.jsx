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
import { API } from '../config';
import {
  getBaseline, saveBaseline, resetBaseline, DEFAULT_R0
} from '../utils/ppmConverter';

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
  const [baseline,   setBaseline]   = useState(() => getBaseline());
  const [captureMsg, setCaptureMsg] = useState(null); // 'loading' | 'ok' | 'nodata' | 'error'
  const [saved,      setSaved]      = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'syncing' | 'ok' | 'error'
  const [modelMsg,   setModelMsg]   = useState(null);
  const [soundOn,    setSoundOn]    = useState(() => isSoundEnabled());
  const [calibration, setCalibration] = useState(null);
  const [health, setHealth] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const isMock = false;

  useEffect(() => {
    const handleToggle = (e) => setSoundOn(e.detail.enabled);
    window.addEventListener('voc_sound_toggle', handleToggle);
    return () => window.removeEventListener('voc_sound_toggle', handleToggle);
  }, []);

  useEffect(() => {
    const box = general.boxId || 'BOX-001';
    const loadHealth = () => {
      fetch(`${API}/api/sensor-health?box_id=${box}`).then(r => r.ok ? r.json() : null).then(setHealth).catch(() => {});
      fetch(`${API}/api/sensor-runtime?box_id=${box}&limit=10`).then(r => r.ok ? r.json() : null).then(setRuntime).catch(() => {});
    };
    loadHealth();
    const timer = setInterval(loadHealth, 5000);
    return () => clearInterval(timer);
  }, [general.boxId]);

  async function requestHardwareCalibration() {
    if (!window.confirm('ยืนยันว่าเครื่องอยู่ในอากาศสะอาดและ MQ-3 ผ่าน preheat แล้ว? ระบบจะบันทึก baseline จาก ESP32 จริง')) return;
    setCalibration({ status: 'requesting' });
    try {
      const res = await fetch(`${API}/api/calibration/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ box_id: general.boxId || 'BOX-001' }) });
      const job = await res.json();
      if (!res.ok) throw new Error(job.detail);
      setCalibration({ status: 'waiting', id: job.calibration_id });
      const poll = async () => {
        const r = await fetch(`${API}/api/calibration/${job.calibration_id}`);
        const result = await r.json();
        if (result.status === 'COMPLETE') {
          const next = { ...baseline, ...result.baselines };
          setBaseline(next); saveBaseline(next);
          setCalibration({ status: 'complete', id: job.calibration_id });
        } else if (result.status === 'REJECTED') {
          setCalibration({ status: 'error', detail: result.detail });
        } else setTimeout(poll, 3000);
      };
      setTimeout(poll, 3000);
    } catch (e) { setCalibration({ status: 'error', detail: e.message }); }
  }

  // Sync กับ Backend เมื่อเปิดหน้า Settings
  useEffect(() => {
    async function syncBackendThresholds() {
      try {
        const res = await fetch(`${API}/api/thresholds`);
        if (res.ok) {
          const t = await res.json();
          if (t && t.tvoc && t.pm25 && t.eco2) {
            const merged = {
              tvoc: { warn: t.tvoc.warn, critical: t.tvoc.critical },
              pm25: { warn: t.pm25.warn, critical: t.pm25.critical },
              eco2: { warn: t.eco2.warn, critical: t.eco2.critical },
            };
            setThresholds(merged);
            saveThresholds(merged);
          }
        }
      } catch {}
    }
    syncBackendThresholds();
  }, []);

  // ─── handlers ───────────────────────────────────────────────
  function handleThreshChange(key, field, raw) {
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    setThresholds(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  }

  function handleBaselineChange(key, raw) {
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    setBaseline(prev => ({ ...prev, [key]: val }));
  }

  async function handleCaptureBaseline() {
    setCaptureMsg('loading');
    try {
      const res = await fetch(`${API}/api/dashboard/latest?box_id=${general.boxId || 'BOX-001'}`);
      const json = await res.json();
      if (json && json.sensors) {
        const newB = {
          mq2:     json.sensors.mq2     ?? baseline.mq2,
          mq3:     json.sensors.mq3     ?? baseline.mq3,
          mq8:     json.sensors.mq8     ?? baseline.mq8,
          mq135:   json.sensors.mq135   ?? baseline.mq135,
          mics_co: json.sensors.mics_co ?? baseline.mics_co,
          no2:     json.sensors.no2     ?? baseline.no2,
          nh3:     json.sensors.nh3     ?? baseline.nh3,
        };
        setBaseline(newB);
        saveBaseline(newB);
        setCaptureMsg('ok');
      } else {
        setCaptureMsg('nodata');
      }
    } catch {
      setCaptureMsg('error');
    }
    setTimeout(() => setCaptureMsg(null), 4000);
  }

  async function handleSave() {
    // 1. บันทึกลง localStorage
    saveThresholds(thresholds);
    saveGeneral(general);
    saveBaseline(baseline);
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

        // บันทึก Activity Log ลง DB
        await fetch(`${API}/api/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'SETTINGS',
            action: 'UPDATE_THRESHOLDS',
            status: 'SUCCESS',
            detail: `ปรับปรุงเกณฑ์แจ้งเตือน: TVOC ${thresholds.tvoc.warn}/${thresholds.tvoc.critical} ppb, PM2.5 ${thresholds.pm25.warn}/${thresholds.pm25.critical} µg/m³`
          }),
        }).catch(() => {});
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
    resetBaseline();
    setThresholds({ ...DEFAULT_THRESHOLDS });
    setGeneral({ ...DEFAULT_GENERAL });
    setBaseline({ ...DEFAULT_R0 });
    setSaved(false);

    fetch(`${API}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'SETTINGS',
        action: 'RESET_DEFAULTS',
        status: 'WARNING',
        detail: 'รีเซ็ตการตั้งค่าและเกณฑ์ทั้งหมดกลับสู่ค่าเริ่มต้นจากโรงงาน'
      }),
    }).catch(() => {});
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

      {/* ── Section 3: Clean Air Baseline (R0 Calibration) ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🌬️ จุดอ้างอิงอากาศบริสุทธิ์ (Clean Air Baseline / R₀)</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              ค่าความต้านทาน / แรงดันอ้างอิงในอากาศบริสุทธิ์ ใช้สำหรับคำนวณอัตราส่วน Rs/R₀ เพื่อแปลงเป็นหน่วย ~ppm
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={requestHardwareCalibration} disabled={calibration?.status === 'waiting' || calibration?.status === 'requesting'} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              <Cpu size={13} /> {calibration?.status === 'waiting' ? 'รอ ESP32 ทำ Calibration...' : 'สั่ง ESP32 Capture Baseline'}
            </button>
            <button
              onClick={handleCaptureBaseline}
              disabled={captureMsg === 'loading'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
                border: '1px solid #10b981', backgroundColor: '#ecfdf5',
                color: '#047857', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} style={{ animation: captureMsg === 'loading' ? 'spin 1s linear infinite' : 'none' }} />
              {captureMsg === 'loading' ? 'กำลังดึงค่า...' : '📥 ดึงค่าสดจากเครื่องเป็น Baseline'}
            </button>
            {captureMsg === 'ok' && (
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>✅ บันทึก Baseline ปัจจุบันแล้ว!</span>
            )}
            {captureMsg === 'nodata' && (
              <span style={{ fontSize: '0.78rem', color: '#f59e0b' }}>⚠ ไม่พบข้อมูลเซนเซอร์</span>
            )}
            {captureMsg === 'error' && (
              <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>⚠ เชื่อมต่อไม่สำเร็จ</span>
            )}
            {calibration?.status === 'complete' && <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>✅ ESP32 ส่ง baseline จริงกลับมาแล้ว</span>}
            {calibration?.status === 'error' && <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>⚠ Calibration ไม่สำเร็จ: {calibration.detail}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {[
            { key: 'mq2', title: 'MQ-2 (Smoke/LPG)', unit: 'ADC', desc: 'Clean Air R₀ (ADC)' },
            { key: 'mq3', title: 'MQ-3 (Alcohol)', unit: 'ADC', desc: 'Clean Air R₀ (ADC)' },
            { key: 'mq8', title: 'MQ-8 (H₂)', unit: 'ADC', desc: 'Clean Air R₀ (ADC)' },
            { key: 'mq135', title: 'MQ-135 (NH₃/Benzene)', unit: 'ADC', desc: 'Clean Air R₀ (ADC)' },
            { key: 'mics_co', title: 'MiCS-6814 (CO)', unit: 'mV', desc: 'Clean Air V₀ (mV)' },
            { key: 'no2', title: 'MiCS-6814 (NO₂)', unit: 'mV', desc: 'Clean Air V₀ (mV)' },
            { key: 'nh3', title: 'MiCS-6814 (NH₃)', unit: 'mV', desc: 'Clean Air V₀ (mV)' },
          ].map(({ key, title, unit, desc }) => (
            <div key={key} style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-color)' }}>{title}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unit}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="number"
                  value={baseline[key] ?? ''}
                  onChange={e => handleBaselineChange(key, e.target.value)}
                  style={{
                    width: '100%', padding: '0.4rem 0.5rem',
                    borderRadius: '0.375rem', border: '1.5px solid var(--border-color)',
                    fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700,
                    background: 'white', outline: 'none',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4: Real sensor diagnostics ─────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem' }}>🩺 ตรวจคุณภาพสัญญาณจริงจากทุก Sensor</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>ตรวจขอบเขต datasheet/interface และความแกว่งของ 12 ตัวอย่างล่าสุด ไม่ใช่ค่าจำลอง</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.6rem' }}>
          {Object.entries(health?.sensors || {}).map(([id, item]) => <div key={id} style={{ padding: '0.65rem', borderRadius: 8, border: `1px solid ${item.state === 'OK' ? '#86efac' : item.state === 'WARNING' ? '#fcd34d' : '#fca5a5'}`, background: item.state === 'OK' ? '#f0fdf4' : '#fff7ed' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{item.rule.label} · {item.state}</div>
            <div style={{ fontSize: '0.75rem', marginTop: 3 }}>{item.value ?? '—'} {item.rule.unit}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 3 }}>{item.reason}</div>
          </div>)}
        </div>
        {health?.stale && <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 8 }}>⚠ ข้อมูลจากอุปกรณ์เก่ากว่า 30 วินาที</p>}
        <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>⏱ ชั่วโมงทำงานสะสมจริง (ใช้ ESP32 uptime)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(runtime?.sensors || []).map(s => <span key={s.sensor_id} style={{ padding: '0.35rem 0.55rem', background: '#f1f5f9', borderRadius: 6, fontSize: '0.72rem' }}><strong>{s.sensor_id.toUpperCase()}</strong> {(Number(s.online_seconds || 0) / 3600).toFixed(2)} ชม.</span>)}
          </div>
          {runtime?.logs?.[0] && <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 6 }}>มี status log ล่าสุด {new Date(runtime.logs[0].recorded_at).toLocaleString('th-TH')} · เก็บ log ทุก 60 วินาที</div>}
        </div>
      </div>

      {/* ── Section 5: AI Model ──────────────────────────────── */}
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
            { label: 'Backend URL',    value: API.replace(/^https?:\/\//, ''),    sub: 'FastAPI + Neon PostgreSQL' },
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
