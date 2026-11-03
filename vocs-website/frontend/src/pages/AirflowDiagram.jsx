import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Wind, Cpu, Filter, Box, Compass, BookOpen, Activity, Gauge, Droplets, Thermometer } from 'lucide-react';
import { getThresholds } from '../utils/settings';
import { convertAllToPpm, formatPpm, getUnitMode, setUnitMode, convertTvocToPpm } from '../utils/ppmConverter';
import { Card, Button, Drawer } from '../components/ui';

import { API } from '../config';
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
  const [unitMode, setUnitModeState] = useState(() => getUnitMode());
  const [isScrubberDrawerOpen, setIsScrubberDrawerOpen] = useState(false);

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
    <div className="max-w-[1280px] mx-auto pb-16">
      {/* ── Page Header & Sync ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">
            <span>Booth 01</span>
            <span>/</span>
            <span>Aero Exhaust</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-primary inline-block"></span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Airflow Telemetry</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Laminar Sync Active</span>
          </div>

          {/* Unit Toggle */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleUnitToggle('raw')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${unitMode === 'raw' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Raw (ADC/mV)
            </button>
            <button
              type="button"
              onClick={() => handleUnitToggle('ppm')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${unitMode === 'ppm' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ~ppm
            </button>
          </div>

          {lastUpdated && (
            <span className="text-xs text-slate-500">
              {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}

          <Button variant="secondary" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>รีเฟรช</span>
          </Button>
        </div>
      </div>

      {/* ── Stitch 4-Stage Pathway Overview Cards ───────────── */}
      <Card className="mb-6 p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            Airstream Pathway &amp; Scrubber Telemetry
          </span>
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Wind size={15} className="text-primary" />
            <span>1,850 m³/h volumetric mass</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          {/* Stage 1: Spray Booth */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex flex-col items-center text-center justify-between transition-all hover:bg-slate-100/70">
            <div className="w-11 h-11 rounded-full bg-blue-100 text-primary flex items-center justify-center mb-2">
              <Box size={22} />
            </div>
            <div className="font-semibold text-slate-800 text-sm">Spray Booth</div>
            <div className="text-[11px] text-slate-500">Source Intake</div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900 tnum">100%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Inflow capture</div>
            </div>
          </div>

          {/* Stage 2: Duct Line */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex flex-col items-center text-center justify-between transition-all hover:bg-slate-100/70">
            <div className="w-11 h-11 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mb-2">
              <Wind size={22} />
            </div>
            <div className="font-semibold text-slate-800 text-sm">Duct Transit</div>
            <div className="text-[11px] text-slate-500">Transit Line A</div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900 tnum">18.4 <span className="text-xs font-normal text-slate-500">m/s</span></div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Airflow velocity</div>
            </div>
          </div>

          {/* Stage 3: Carbon Scrubber (Clickable trigger for Drawer) */}
          <button
            type="button"
            onClick={() => setIsScrubberDrawerOpen(true)}
            className="rounded-2xl bg-blue-50/60 border-2 border-primary/40 hover:border-primary p-4 flex flex-col items-center text-center justify-between transition-all hover:shadow-md cursor-pointer group text-left relative"
          >
            <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
              <Filter size={22} />
            </div>
            <div className="font-semibold text-slate-900 text-sm">Carbon Scrubber</div>
            <div className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Active Inspection →
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900 tnum">94%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Adsorption Efficiency</div>
            </div>
          </button>

          {/* Stage 4: Exhaust Stack */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex flex-col items-center text-center justify-between transition-all hover:bg-slate-100/70">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <CheckCircle size={22} />
            </div>
            <div className="font-semibold text-slate-800 text-sm">Exhaust Stack</div>
            <div className="text-[11px] text-slate-500">Atmospheric Port</div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900 tnum">14 <span className="text-xs font-normal text-slate-500">ppb</span></div>
              <div className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Residual VOC</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Overall Status Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl mb-6 transition-all border"
        style={{
          background: `${overallColor}14`,
          borderColor: `${overallColor}44`,
        }}
      >
        {hasCritical
          ? <AlertTriangle size={20} color={overallColor} />
          : hasWarning
          ? <AlertTriangle size={20} color={overallColor} />
          : <CheckCircle size={20} color={overallColor} />
        }
        <div>
          <span className="font-bold text-sm" style={{ color: overallColor }}>{overallLabel}</span>
          <span className="text-slate-600 text-xs ml-3">
            {hasCritical
              ? 'ตรวจพบค่าเกินวิกฤต — ตรวจสอบแหล่งที่มาของก๊าซทันที'
              : hasWarning
              ? 'ค่าบางตัวสูงกว่าปกติ — กรุณาติดตามอย่างใกล้ชิด'
              : 'คุณภาพอากาศและทิศทางการไหลเวียนอยู่ในเกณฑ์ปกติ'}
          </span>
        </div>
        {ai && (
          <div className="ml-auto text-right">
            <div className="text-[11px] text-slate-500">AI Detection</div>
            <div className="font-bold text-sm" style={{ color: overallColor }}>{ai.prediction}</div>
            <div className="text-[10px] text-slate-400">{ai.confidence}% confidence</div>
          </div>
        )}
      </div>

      {/* ===== MAIN SVG FLOW DIAGRAM ===== */}
      <Card className="mb-6 p-6 overflow-hidden">
        <h2 className="text-base font-semibold mb-6 text-slate-800 flex items-center gap-2">
          <span>แผนผังโฟลว์อากาศ (Air Flow Path)</span>
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
      </Card>

      {/* ===== SENSOR DETAIL GRID ===== */}
      <Card className="mb-6 p-6">
        <h2 className="text-base font-semibold mb-4 text-slate-800">
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
      </Card>

      {/* Flow speed legend */}
      <Card className="mt-6 p-6 bg-slate-50/70 border border-slate-100">
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <BookOpen size={16} color="#2563eb" />
          <span>คำอธิบายระบบและการไหลเวียนอากาศ (Airflow Architecture)</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            { icon: <Compass size={18} color="#059669" />, title: 'ภายนอก (Outdoor Ambient)', desc: 'อากาศจากสภาพแวดล้อมจริง มีอุณหภูมิและความชื้นตามธรรมชาติ' },
            { icon: <Wind size={18} color="#2563eb" />, title: 'ช่องรับอากาศ (Intake Port)', desc: 'ช่องรับอากาศเข้าสู่กล่อง E-Nose ด้วยพัดลมแรงดันต่ำ' },
            { icon: <Filter size={18} color="#d97706" />, title: 'แผ่นกรองฝุ่น (Pre-Filter)', desc: 'กรองฝุ่นอนุภาคขนาดใหญ่และ PM2.5 ก่อนเข้าห้องวัด' },
            { icon: <Box size={18} color="#7c3aed" />, title: 'ห้องวัดก๊าซ (Sensor Chamber)', desc: 'ห้องเซนเซอร์หลัก มีก๊าซเซนเซอร์ 6 ชนิด พร้อม TVOC และ eCO₂' },
            { icon: <Cpu size={18} color="#0284c7" />, title: 'ระบบ AI (Pattern Classifier)', desc: 'ประมวลผลสัญญาณ Signature สารระเหยเพื่อจำแนกชนิดก๊าซ' },
            { icon: <Wind size={18} color="#475569" />, title: 'ท่อไอเสีย (Exhaust Port)', desc: 'ระบายอากาศออกหลังการตรวจวัดเพื่อลดการสะสมตกค้าง' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '6px',
                backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{item.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Sub-state: Carbon Scrubber Telemetry Drawer (Stitch sub_states/airflow_telemetry_drawer_pathway_details) ── */}
      <Drawer
        isOpen={isScrubberDrawerOpen}
        onClose={() => setIsScrubberDrawerOpen(false)}
        title="Carbon Scrubber"
        subtitle="Adsorption Bed • Diagnostic Telemetry"
        width={440}
        footer={
          <Button variant="primary" className="w-full" onClick={() => setIsScrubberDrawerOpen(false)}>
            Close Inspection
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 px-1">
            Scrubber Bed Dynamics
          </div>
          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-500">Adsorption Efficiency</span>
            <span className="text-sm font-bold text-primary tnum">94.2%</span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-500">Differential Pressure (ΔP)</span>
            <span className="text-sm font-semibold text-slate-800 font-mono">142 Pa <span className="text-xs font-normal text-slate-500">(Normal)</span></span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-500">Bed Core Temperature</span>
            <span className="text-sm font-semibold text-slate-800 font-mono">24.8 °C</span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-500">Filter Media</span>
            <span className="text-sm font-semibold text-slate-800">Activated Carbon (4mm Pellets)</span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-500">Remaining Useful Life (RUL)</span>
            <span className="text-sm font-semibold text-emerald-600 font-mono">184 days</span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-500">Volumetric Air Mass</span>
            <span className="text-sm font-semibold text-slate-800 font-mono">1,850 m³/h</span>
          </div>
        </div>
      </Drawer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
      `}</style>
    </div>
  );
}
