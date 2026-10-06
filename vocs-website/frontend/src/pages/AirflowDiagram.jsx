import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, Wind, Thermometer, Droplets, AlertTriangle, CheckCircle, Activity, Info } from 'lucide-react';
import { getThresholds } from '../utils/settings';
import { convertAllToPpm, formatPpm, getUnitMode, setUnitMode, convertTvocToPpm } from '../utils/ppmConverter';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REFRESH_INTERVAL_MS = 3000;

// อ่านค่า threshold จาก Settings (localStorage) — sync อัตโนมัติกับหน้า Settings
function getSensorThresholds() {
  const t = getThresholds();
  return {
    tvoc:    { warn: t.tvoc.warn, crit: t.tvoc.critical, unit: 'ppb',    label: 'TVOC',              color: '#8b5cf6' },
    eco2:    { warn: t.eco2.warn, crit: t.eco2.critical, unit: 'ppm',    label: 'eCO\u2082',          color: '#0ea5e9' },
    pm25:    { warn: t.pm25.warn, crit: t.pm25.critical, unit: '\u00b5g/m\u00b3', label: 'PM2.5', color: '#f59e0b' },
    mq2:     { warn: 1500, crit: 2500, unit: 'ADC', label: 'MQ-2 (Smoke/LPG)',   color: '#eab308' },
    mq3:     { warn: 1500, crit: 2500, unit: 'ADC', label: 'MQ-3 (Alcohol)',    color: '#10b981' },
    mq135:   { warn: 1500, crit: 2500, unit: 'ADC', label: 'MQ-135 (NH\u2083/NOx)', color: '#ef4444' },
    mq8:     { warn: 2000, crit: 3000, unit: 'ADC', label: 'MQ-8 (H\u2082)',    color: '#f97316' },
    mics_co: { warn: 600,  crit: 1200, unit: 'mV',  label: 'MiCS (CO)',         color: '#ec4899' },
    no2:     { warn: 300,  crit: 600,  unit: 'mV',  label: 'NO\u2082',           color: '#a855f7' },
    nh3:     { warn: 500,  crit: 1000, unit: 'mV',  label: 'NH\u2083',           color: '#14b8a6' },
  };
}

function getLevel(val, thresh) {
  if (val == null) return 'normal';
  if (val >= thresh.crit) return 'critical';
  if (val >= thresh.warn) return 'warning';
  return 'normal';
}

function levelColor(level) {
  if (level === 'critical') return '#ef4444';
  if (level === 'warning') return '#f59e0b';
  return '#10b981';
}

function SensorBadge({ sensorKey, value, isPpm, ppmData }) {
  const thresh = getSensorThresholds()[sensorKey];
  let displayVal = value;
  let displayUnit = thresh.unit;

  if (isPpm) {
    if (sensorKey === 'tvoc') {
      const ppmVal = convertTvocToPpm(value);
      displayVal = ppmVal != null ? (ppmVal >= 10 ? ppmVal.toFixed(1) : ppmVal.toFixed(3)) : '—';
      displayUnit = 'ppm';
    } else if (ppmData && ppmData[sensorKey]) {
      const p = ppmData[sensorKey];
      displayVal = formatPpm(p.ppm, p.unit);
      displayUnit = p.unit;
    }
  }

  const level = getLevel(value, thresh);
  const color = levelColor(level);
  const pct = value != null ? Math.min(100, (value / thresh.crit) * 100) : 0;

  return (
    <div style={{
      background: 'white',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: '10px 14px',
      minWidth: 130,
      boxShadow: level !== 'normal' ? `0 0 12px ${color}44` : '0 2px 8px rgba(0,0,0,0.07)',
      transition: 'all 0.4s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* progress bar bg */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 3, width: `${pct}%`,
        background: color, transition: 'width 0.6s ease',
        borderRadius: '0 0 10px 10px',
      }} />
      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>
        {isPpm && ppmData?.[sensorKey]?.refGas ? `${thresh.label} (${ppmData[sensorKey].refGas})` : thresh.label}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: value != null ? color : '#94a3b8' }}>
        {displayVal != null ? displayVal : '—'}
      </div>
      <div style={{ fontSize: '0.65rem', color: isPpm ? '#059669' : '#94a3b8', fontWeight: isPpm ? 600 : 400 }}>
        {displayUnit}
      </div>
      {level !== 'normal' && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 8, height: 8, borderRadius: '50%',
          background: color,
          animation: 'pulse 1.5s infinite',
        }} />
      )}
    </div>
  );
}

// SVG animated particle along a path
function FlowParticles({ pathId, color = '#2563eb', count = 3, speed = 8, show = true }) {
  if (!show) return null;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} r="4" fill={color} opacity="0.75">
          <animateMotion
            dur={`${speed}s`}
            repeatCount="indefinite"
            begin={`${(i / count) * speed}s`}
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}

export default function AirflowDiagram() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [animTick, setAnimTick] = useState(0);
  const [unitMode, setUnitModeState] = useState(() => getUnitMode());

  const handleUnitToggle = (mode) => {
    setUnitModeState(mode);
    setUnitMode(mode);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/dashboard/latest`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setAnimTick(t => t + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchData]);

  const SENSOR_THRESHOLDS = getSensorThresholds();
  const env = data?.environment ?? {};
  const sensors = data?.sensors ?? {};
  const ai = data?.ai_detection;
  const ppmData = convertAllToPpm(sensors);
  const isPpm = unitMode === 'ppm';

  // รวมค่าทั้งหมดเพื่อดูว่า overall status เป็นอะไร
  const allValues = {
    tvoc: env.tvoc, eco2: env.eco2, pm25: env.pm25,
    mq2: sensors.mq2, mq3: sensors.mq3, mq135: sensors.mq135, mq8: sensors.mq8,
    mics_co: sensors.mics_co, no2: sensors.no2, nh3: sensors.nh3,
  };
  const hasCritical = Object.entries(allValues).some(
    ([k, v]) => v != null && v >= SENSOR_THRESHOLDS[k]?.crit
  );
  const hasWarning = !hasCritical && Object.entries(allValues).some(
    ([k, v]) => v != null && v >= SENSOR_THRESHOLDS[k]?.warn
  );
  const overallColor = hasCritical ? '#ef4444' : hasWarning ? '#f59e0b' : '#10b981';
  const overallLabel = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'NORMAL';

  // flow speed based on TVOC
  const tvocLevel = getLevel(env.tvoc, SENSOR_THRESHOLDS.tvoc);
  const flowSpeed = tvocLevel === 'critical' ? 3 : tvocLevel === 'warning' ? 5 : 8;
  const flowColor = overallColor;

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', padding: '2rem' }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
        กำลังโหลด Airflow Diagram...
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Airflow Diagram</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            โฟลว์อากาศจากภายนอกสู่ระบบเซนเซอร์ — realtime update ทุก 3 วินาที
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Unit Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            padding: '3px',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
          }}>
            <button
              type="button"
              onClick={() => handleUnitToggle('raw')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: unitMode === 'raw' ? 'white' : 'transparent',
                color: unitMode === 'raw' ? 'var(--primary-color)' : 'var(--text-muted)',
                boxShadow: unitMode === 'raw' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Raw (ADC/mV)
            </button>
            <button
              type="button"
              onClick={() => handleUnitToggle('ppm')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: unitMode === 'ppm' ? 'var(--primary-color)' : 'transparent',
                color: unitMode === 'ppm' ? 'white' : 'var(--text-muted)',
                boxShadow: unitMode === 'ppm' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              ~ppm
            </button>
          </div>

          {lastUpdated && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              อัปเดต {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.4rem 0.875rem', border: '1px solid var(--border-color)',
              borderRadius: '0.5rem', backgroundColor: 'white', cursor: 'pointer',
              fontSize: '0.875rem', color: 'var(--text-muted)',
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
        background: `${overallColor}18`,
        border: `1.5px solid ${overallColor}66`,
        transition: 'all 0.5s ease',
      }}>
        {hasCritical
          ? <AlertTriangle size={20} color={overallColor} />
          : hasWarning
          ? <AlertTriangle size={20} color={overallColor} />
          : <CheckCircle size={20} color={overallColor} />
        }
        <div>
          <span style={{ fontWeight: 700, color: overallColor, fontSize: '1rem' }}>{overallLabel}</span>
          <span style={{ color: '#64748b', marginLeft: '0.75rem', fontSize: '0.875rem' }}>
            {hasCritical
              ? 'ตรวจพบค่าเกินวิกฤต — ตรวจสอบแหล่งที่มาของก๊าซทันที'
              : hasWarning
              ? 'ค่าบางตัวสูงกว่าปกติ — กรุณาติดตามอย่างใกล้ชิด'
              : 'คุณภาพอากาศอยู่ในเกณฑ์ปกติ'}
          </span>
        </div>
        {ai && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>AI Detection</div>
            <div style={{ fontWeight: 700, color: overallColor }}>{ai.prediction}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ai.confidence}% confidence</div>
          </div>
        )}
      </div>

      {/* ===== MAIN SVG FLOW DIAGRAM ===== */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', color: '#334155' }}>
          แผนผังโฟลว์อากาศ (Air Flow Path)
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <svg
            viewBox="0 0 900 380"
            style={{ width: '100%', minWidth: 700, height: 'auto', fontFamily: 'Inter, sans-serif' }}
          >
            <defs>
              {/* Arrow marker */}
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={flowColor} />
              </marker>
              <marker id="arrow-gray" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
              </marker>
              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Gradient for sensor box */}
              <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="ambientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f766e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              {/* Flow paths (invisible, for particle animation) */}
              {/* Path 1: Outdoor → Intake */}
              <path id="flow1" d="M 95 190 L 185 190" />
              {/* Path 2: Intake → Pre-filter */}
              <path id="flow2" d="M 255 190 L 310 190" />
              {/* Path 3: Pre-filter → Sensor Chamber */}
              <path id="flow3" d="M 380 190 L 440 190" />
              {/* Path 4: Sensor Chamber top branch → E-Nose sensors */}
              <path id="flow4a" d="M 570 155 L 640 120" />
              <path id="flow4b" d="M 570 190 L 640 190" />
              <path id="flow4c" d="M 570 225 L 640 260" />
              {/* Path 5: exhaust */}
              <path id="flow5" d="M 570 190 Q 620 340 700 340" />
            </defs>

            {/* ======= ZONE: OUTDOOR ======= */}
            {/* Background zone */}
            <rect x="10" y="90" width="100" height="200" rx="12"
              fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" strokeDasharray="6,3" />
            <text x="60" y="116" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="600">ภายนอก</text>
            <text x="60" y="128" textAnchor="middle" fontSize="9" fill="#16a34a">OUTDOOR</text>

            {/* Wind icon area */}
            <circle cx="60" cy="175" r="28" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5" />
            <text x="60" y="179" textAnchor="middle" fontSize="20">🌿</text>
            {/* Outdoor temp/humidity labels */}
            <text x="60" y="218" textAnchor="middle" fontSize="9.5" fill="#16a34a" fontWeight="600">
              {env.temp != null ? `${env.temp}°C` : '—'}
            </text>
            <text x="60" y="230" textAnchor="middle" fontSize="9" fill="#4ade80">
              {env.rh != null ? `${env.rh}% RH` : '—'}
            </text>

            {/* Arrow: Outdoor → Intake */}
            <line x1="95" y1="190" x2="180" y2="190" stroke={flowColor}
              strokeWidth="2.5" markerEnd="url(#arrow)" />
            <FlowParticles pathId="flow1" color={flowColor} count={2} speed={flowSpeed} />

            {/* ======= INTAKE PORT ======= */}
            <rect x="185" y="165" width="70" height="50" rx="8"
              fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="220" y="187" textAnchor="middle" fontSize="10" fill="#0369a1" fontWeight="600">Intake</text>
            <text x="220" y="199" textAnchor="middle" fontSize="9" fill="#0284c7">Port</text>
            <text x="220" y="210" textAnchor="middle" fontSize="9" fill="#0ea5e9">⬇ กรอง</text>

            {/* Arrow: Intake → Pre-Filter */}
            <line x1="255" y1="190" x2="305" y2="190" stroke={flowColor}
              strokeWidth="2.5" markerEnd="url(#arrow)" />
            <FlowParticles pathId="flow2" color={flowColor} count={2} speed={flowSpeed} />

            {/* ======= PRE-FILTER ======= */}
            <rect x="310" y="155" width="70" height="70" rx="8"
              fill="#fef9c3" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="345" y="184" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="600">Pre-Filter</text>
            <text x="345" y="197" textAnchor="middle" fontSize="9" fill="#b45309">ฝุ่น / PM2.5</text>
            {/* PM2.5 value */}
            <text x="345" y="213" textAnchor="middle" fontSize="11" fontWeight="700"
              fill={levelColor(getLevel(env.pm25, SENSOR_THRESHOLDS.pm25))}>
              {env.pm25 != null ? `${env.pm25}` : '—'}
            </text>
            <text x="345" y="222" textAnchor="middle" fontSize="8" fill="#94a3b8">µg/m³</text>

            {/* Arrow: Pre-Filter → Sensor Box */}
            <line x1="380" y1="190" x2="435" y2="190" stroke={flowColor}
              strokeWidth="2.5" markerEnd="url(#arrow)" />
            <FlowParticles pathId="flow3" color={flowColor} count={2} speed={flowSpeed} />

            {/* ======= SENSOR CHAMBER (E-NOSE BOX) ======= */}
            <rect x="440" y="110" width="135" height="160" rx="14"
              fill="url(#boxGrad)" stroke="#60a5fa" strokeWidth="2"
              filter={hasCritical ? 'url(#glow)' : undefined}
              style={{ transition: 'all 0.5s' }}
            />
            <text x="507" y="138" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">E-Nose Box</text>
            <text x="507" y="152" textAnchor="middle" fontSize="9" fill="#bfdbfe">{data?.box_id ?? 'BOX-001'}</text>

            {/* Sensor icons inside box */}
            <text x="507" y="175" textAnchor="middle" fontSize="11" fill="#dbeafe">🔬 6 Gas Sensors</text>
            <text x="507" y="193" textAnchor="middle" fontSize="10" fill="#93c5fd">+ TVOC / eCO₂</text>
            <text x="507" y="211" textAnchor="middle" fontSize="10" fill="#93c5fd">+ Temp / RH</text>

            {/* Status dot */}
            <circle cx="507" cy="245" r="6" fill={overallColor}>
              {hasCritical && (
                <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
              )}
            </circle>
            <text x="520" y="249" fontSize="9" fill="white">{overallLabel}</text>

            {/* Branch arrows from sensor box */}
            {/* Up → E-Nose Array */}
            <line x1="575" y1="155" x2="638" y2="122" stroke="#94a3b8"
              strokeWidth="1.5" markerEnd="url(#arrow-gray)" />
            <FlowParticles pathId="flow4a" color="#94a3b8" count={1} speed={flowSpeed + 2} />
            {/* Mid → Environment */}
            <line x1="575" y1="190" x2="638" y2="190" stroke="#94a3b8"
              strokeWidth="1.5" markerEnd="url(#arrow-gray)" />
            <FlowParticles pathId="flow4b" color="#94a3b8" count={1} speed={flowSpeed + 2} />
            {/* Down → Gas Detection */}
            <line x1="575" y1="225" x2="638" y2="258" stroke="#94a3b8"
              strokeWidth="1.5" markerEnd="url(#arrow-gray)" />
            <FlowParticles pathId="flow4c" color="#94a3b8" count={1} speed={flowSpeed + 2} />

            {/* ======= OUTPUT PANELS ======= */}
            {/* E-Nose Array */}
            <rect x="640" y="85" width="190" height="85" rx="10"
              fill="white" stroke="#c084fc" strokeWidth="1.5" />
            <text x="735" y="106" textAnchor="middle" fontSize="10" fill="#7c3aed" fontWeight="700">E-Nose Array (6 Sensors)</text>
            <text x="695" y="125" textAnchor="middle" fontSize="9"
              fill={levelColor(getLevel(sensors.mq3, SENSOR_THRESHOLDS.mq3))}>
              MQ-3: {sensors.mq3 ?? '—'}
            </text>
            <text x="695" y="139" textAnchor="middle" fontSize="9"
              fill={levelColor(getLevel(sensors.mq135, SENSOR_THRESHOLDS.mq135))}>
              MQ-135: {sensors.mq135 ?? '—'}
            </text>
            <text x="775" y="125" textAnchor="middle" fontSize="9"
              fill={levelColor(getLevel(sensors.mq8, SENSOR_THRESHOLDS.mq8))}>
              MQ-8: {sensors.mq8 ?? '—'}
            </text>
            <text x="775" y="139" textAnchor="middle" fontSize="9"
              fill={levelColor(getLevel(sensors.mics_co, SENSOR_THRESHOLDS.mics_co))}>
              MICS CO: {sensors.mics_co ?? '—'}
            </text>
            <text x="695" y="155" textAnchor="middle" fontSize="9"
              fill={levelColor(getLevel(sensors.no2, SENSOR_THRESHOLDS.no2))}>
              NO₂: {sensors.no2 ?? '—'}
            </text>
            <text x="775" y="155" textAnchor="middle" fontSize="9"
              fill={levelColor(getLevel(sensors.nh3, SENSOR_THRESHOLDS.nh3))}>
              NH₃: {sensors.nh3 ?? '—'}
            </text>

            {/* Environment */}
            <rect x="640" y="170" width="190" height="50" rx="10"
              fill="white" stroke="#67e8f9" strokeWidth="1.5" />
            <text x="735" y="190" textAnchor="middle" fontSize="10" fill="#0891b2" fontWeight="700">Environment</text>
            <text x="695" y="208" textAnchor="middle" fontSize="9.5"
              fill="#0369a1">TVOC: {env.tvoc ?? '—'} ppb</text>
            <text x="790" y="208" textAnchor="middle" fontSize="9.5"
              fill="#0369a1">eCO₂: {env.eco2 ?? '—'} ppm</text>

            {/* Gas Detection */}
            <rect x="640" y="230" width="190" height="55" rx="10"
              fill="white" stroke={overallColor} strokeWidth="1.5" />
            <text x="735" y="250" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="700">AI Detection</text>
            <text x="735" y="268" textAnchor="middle" fontSize="12" fontWeight="700" fill={overallColor}>
              {ai?.prediction ?? '—'}
            </text>
            <text x="735" y="280" textAnchor="middle" fontSize="9" fill="#94a3b8">
              {ai?.confidence != null ? `${ai.confidence}% confidence` : ''}
            </text>

            {/* ======= EXHAUST ======= */}
            <path d="M 507 270 Q 507 340 580 340 L 700 340" stroke="#94a3b8"
              strokeWidth="2" strokeDasharray="5,3" fill="none" markerEnd="url(#arrow-gray)" />
            <rect x="700" y="320" width="90" height="38" rx="8"
              fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
            <text x="745" y="336" textAnchor="middle" fontSize="9.5" fill="#64748b" fontWeight="600">Exhaust</text>
            <text x="745" y="350" textAnchor="middle" fontSize="9" fill="#94a3b8">ระบาย</text>

            {/* Legend */}
            <text x="10" y="370" fontSize="9" fill="#94a3b8">
              ● อนุภาคเคลื่อนที่ = โฟลว์อากาศ  |  สีแดง = เกินวิกฤต  |  สีเหลือง = เกินเกณฑ์เตือน  |  สีเขียว = ปกติ
            </text>
          </svg>
        </div>
      </div>

      {/* ===== SENSOR DETAIL GRID ===== */}
      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155' }}>
        ค่าเซนเซอร์แบบละเอียด (Sensor Detail)
      </h2>

      {/* Environment Row */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
          🌡 ENVIRONMENT
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Temp & RH special cards */}
          <div style={{
            background: 'white', border: '2px solid #38bdf8', borderRadius: '12px',
            padding: '10px 14px', minWidth: 130,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>Temperature</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0369a1' }}>
              {env.temp != null ? env.temp : '—'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>°C</div>
          </div>
          <div style={{
            background: 'white', border: '2px solid #34d399', borderRadius: '12px',
            padding: '10px 14px', minWidth: 130,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>Humidity</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#047857' }}>
              {env.rh != null ? env.rh : '—'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>%RH</div>
          </div>
          <SensorBadge sensorKey="pm25" value={env.pm25} />
          <SensorBadge sensorKey="tvoc" value={env.tvoc} isPpm={isPpm} ppmData={ppmData} />
          <SensorBadge sensorKey="eco2" value={env.eco2} isPpm={isPpm} ppmData={ppmData} />
        </div>
      </div>

      {/* E-Nose Row */}
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
          🔬 E-NOSE SENSORS {isPpm ? '(~PPM CONCENTRATION)' : '(RAW ADC/mV)'}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <SensorBadge sensorKey="mq2"     value={sensors.mq2 != null ? sensors.mq2 : null} isPpm={isPpm} ppmData={ppmData} />
          <SensorBadge sensorKey="mq3"     value={sensors.mq3 != null ? sensors.mq3 : null} isPpm={isPpm} ppmData={ppmData} />
          <SensorBadge sensorKey="mq135"   value={sensors.mq135 != null ? sensors.mq135 : null} isPpm={isPpm} ppmData={ppmData} />
          <SensorBadge sensorKey="mq8"     value={sensors.mq8 != null ? sensors.mq8 : null} isPpm={isPpm} ppmData={ppmData} />
          <SensorBadge sensorKey="mics_co" value={sensors.mics_co != null ? sensors.mics_co : null} isPpm={isPpm} ppmData={ppmData} />
          <SensorBadge sensorKey="no2"     value={sensors.no2 != null ? sensors.no2 : null} isPpm={isPpm} ppmData={ppmData} />
          <SensorBadge sensorKey="nh3"     value={sensors.nh3 != null ? sensors.nh3 : null} isPpm={isPpm} ppmData={ppmData} />
        </div>
      </div>

      {/* Flow speed legend */}
      <div className="card" style={{ marginTop: '1.5rem', background: '#f8fafc' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>📘 คำอธิบายระบบ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '🌿', title: 'ภายนอก (Outdoor)', desc: 'อากาศจากสภาพแวดล้อมจริง มีอุณหภูมิและความชื้น' },
            { icon: '🔵', title: 'Intake Port', desc: 'ช่องรับอากาศเข้าสู่กล่อง E-Nose ด้วยพัดลมขนาดเล็ก' },
            { icon: '🟡', title: 'Pre-Filter', desc: 'กรองฝุ่น PM2.5 ก่อนเข้าสู่ห้องเซนเซอร์' },
            { icon: '🔷', title: 'Sensor Chamber', desc: 'ห้องเซนเซอร์หลัก มีเซนเซอร์ก๊าซ 6 ตัว + TVOC + eCO₂' },
            { icon: '🤖', title: 'AI Detection', desc: 'โมเดล ML วิเคราะห์ pattern ของเซนเซอร์ระบุชนิดสาร' },
            { icon: '⬛', title: 'Exhaust', desc: 'ระบายอากาศออกหลังวิเคราะห์เสร็จ' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>{item.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
      `}</style>
    </div>
  );
}
