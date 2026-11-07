import { useState, useEffect, useRef } from 'react';
import {
  Play, Square, ChevronDown, Check, Download,
  Tag, FlaskConical, AlertTriangle, CheckCircle2,
  Sliders, User, Edit3, Thermometer
} from 'lucide-react';
import { API } from '../config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function DataCollection() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [compound, setCompound] = useState('Ambient');
  const [concentration, setConcentration] = useState('50');
  const [sampleId, setSampleId] = useState('SMP-2025-0842');
  const [operator, setOperator] = useState('E. Mitchell');
  const [note, setNote] = useState('');
  const [isSampling, setIsSampling] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(34);
  const timerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'past' | 'model'
  const [toastMsg, setToastMsg] = useState(null);

  const compounds = [
    { id: 'Ambient', labelEn: 'Ambient Air', labelTh: 'อากาศแวดล้อมบริสุทธิ์ (Ambient)' },
    { id: 'Alcohol', labelEn: 'Alcohol 70%', labelTh: 'แอลกอฮอล์ (Alcohol 70%)' },
    { id: 'Thinner', labelEn: 'Thinner', labelTh: 'ทินเนอร์ผสมสี (Thinner)' },
    { id: 'Smoke', labelEn: 'Smoke / Combustion', labelTh: 'ควัน / การเผาไหม้ (Smoke)' },
    { id: 'Acetone', labelEn: 'Acetone', labelTh: 'อะซิโตน (Acetone)' },
    { id: 'Other', labelEn: 'Other VOCs', labelTh: 'สารระเหยอื่นๆ (Other VOCs)' },
  ];

  const [pastSessions, setPastSessions] = useState([
    { id: 'SMP-2026-0103', compound: 'Alcohol', compoundTh: 'แอลกอฮอล์', quality: 'OK', isSuspect: false, profile: 'P-Standard' },
    { id: 'SMP-2026-0102', compound: 'Ambient', compoundTh: 'อากาศปกติ', quality: 'OK', isSuspect: false, profile: 'P-Standard' },
    { id: 'SMP-2026-0101', compound: 'Thinner', compoundTh: 'ทินเนอร์', quality: 'Suspect', isSuspect: true, profile: 'P-HighTemp' },
  ]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  // Live timer for active sampling
  useEffect(() => {
    if (isSampling) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => (prev >= 180 ? 0 : prev + 1));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSampling]);

  // Load real past sessions from backend if available
  useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      try {
        const res = await fetch(`${API}/api/training/sessions`);
        if (res.ok && isMounted) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const mapped = list.map((s) => ({
              id: `SMP-${s.id}`,
              compound: s.label || 'Toluene',
              compoundTh: s.label || 'โทลูอีน',
              quality: 'OK',
              isSuspect: false,
              profile: 'P-Standard',
            }));
            setPastSessions(mapped);
          }
        }
      } catch (err) {
        console.warn('Training sessions load notice:', err);
      }
    }
    loadSessions();
  }, []);

  async function toggleSampling() {
    const nextState = !isSampling;
    setIsSampling(nextState);

    if (nextState) {
      setTimerSeconds(0);
      const newId = `SMP-2025-${Math.floor(Math.random() * 900 + 100)}`;
      setSampleId(newId);
      showToast(lang === 'TH' ? 'เริ่มกระบวนการบันทึกข้อมูลตัวอย่างแล้ว...' : 'Started data acquisition session...');

      try {
        await fetch(`${API}/api/training/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
          },
          body: JSON.stringify({
            box_id: 'BOX-001',
            label: compound,
            target_ppm: parseFloat(concentration) || 50,
          }),
        });
      } catch (err) {
        console.warn('Start session API notice:', err);
      }
    } else {
      showToast(lang === 'TH' ? 'สิ้นสุดการเก็บตัวอย่างและบันทึกข้อมูลแล้ว ✓' : 'Acquisition stopped and sample saved ✓');
      const newSession = {
        id: sampleId,
        compound: compound,
        compoundTh: compound,
        quality: 'OK',
        isSuspect: false,
        profile: 'P-Standard',
      };
      setPastSessions((prev) => [newSession, ...prev]);
    }
  }

  function handleRelabel(id) {
    const target = pastSessions.find((s) => s.id === id);
    if (!target) return;
    const newCompound = prompt(lang === 'TH' ? 'ระบุชื่อสารเคมีใหม่:' : 'Enter new chemical compound:', target.compound);
    if (newCompound) {
      setPastSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, compound: newCompound, compoundTh: newCompound } : s))
      );
      showToast(lang === 'TH' ? 'อัปเดตป้ายชื่อตัวอย่างแล้ว ✓' : 'Sample relabeled successfully ✓');
    }
  }

  function handleDelete(id) {
    setPastSessions((prev) => prev.filter((s) => s.id !== id));
    showToast(lang === 'TH' ? 'ลบข้อมูลตัวอย่างแล้ว' : 'Sample deleted');
  }

  function handleFlag(id) {
    setPastSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, quality: s.quality === 'Suspect' ? 'OK' : 'Suspect', isSuspect: !s.isSuspect } : s))
    );
    showToast(lang === 'TH' ? 'เปลี่ยนสถานะตรวจสอบแล้ว' : 'Sample flag toggled');
  }

  function handleExportCsv() {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Sample_ID,Compound,Quality,Profile\n' +
      pastSessions.map((s) => `${s.id},${s.compound},${s.quality},${s.profile}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'past_acquisition_runs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(lang === 'TH' ? 'ส่งออกไฟล์ CSV สำเร็จแล้ว ✓' : 'Exported CSV successfully ✓');
  }

  return (
    <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
      {/* ── Breadcrumb & Header Bar matching Stitch AI ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[#505f76] text-[11px] font-semibold tracking-wider uppercase">
            <span className="text-[#004ac6]">{t('modelTraining', 'Model Training')}</span>
            <span className="text-[#c3c6d7]">/</span>
            <span>{t('sensorArrayAcquisition', 'Sensor Array Acquisition')}</span>
          </div>
          <h1 className="text-[20px] font-semibold text-[#131b2e] tracking-tight mt-1">
            {t('dataCollection', 'Data Collection')}
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 self-start md:self-auto px-3.5 py-1.5 rounded-full bg-white shadow-xs border border-[#eaedff]">
          <span className="w-2 h-2 rounded-full bg-[#004ac6] animate-pulse" />
          <span className="text-[11px] text-[#505f76] font-medium uppercase tracking-wider">
            {t('chamberStatusPill', 'Chamber Temp 23.4°C · RH 42%')}
          </span>
        </div>
      </div>

      {/* ── Strict 2-Card Layout (Left ~1/3, Right ~2/3) matching Stitch ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT CARD: Acquisition Initiation (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#eaedff] flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-[#f2f3ff]">
              <span className="text-[12px] uppercase tracking-widest text-[#505f76] font-semibold">
                {t('newSample', 'New Sample')}
              </span>
              <FlaskConical size={18} className="text-[#737686]" />
            </div>

            <form className="space-y-4 pt-5" onSubmit={(e) => e.preventDefault()}>
              {/* Field 1: Chemical Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="chem-select">
                  {t('chemicalCompound', 'Chemical Compound')}
                </label>
                <div className="relative">
                  <select
                    id="chem-select"
                    value={compound}
                    onChange={(e) => setCompound(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[14px] font-medium rounded-2xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                  >
                    {compounds.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'TH' ? c.labelTh : c.labelEn}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#505f76] pointer-events-none"
                  />
                </div>
              </div>

              {/* Field 2: Concentration */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="ppm-input">
                    {t('concentration', 'Concentration')}
                  </label>
                  <span className="text-[11px] text-[#004ac6] font-semibold">
                    {t('targetCalibrated', 'Target Calibrated')}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="ppm-input"
                    type="number"
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[14px] font-medium rounded-2xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono tabular-nums"
                  />
                  <span className="absolute right-4 text-[#505f76] pointer-events-none font-medium text-[12px]">
                    ppm
                  </span>
                </div>
              </div>

              {/* Field 3: Sample ID */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="sample-id">
                    {t('sampleId', 'Sample ID')}
                  </label>
                  <span className="text-[10px] text-[#505f76] uppercase tracking-wider">
                    {t('autoGenerated', 'Auto-Generated')}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="sample-id"
                    type="text"
                    readOnly
                    value={sampleId}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[13px] font-mono tracking-wider rounded-2xl px-4 py-3 select-all cursor-default"
                  />
                  <Tag size={16} className="absolute right-4 text-[#505f76]" />
                </div>
              </div>

              {/* Field 4: Operator */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="operator-input">
                  {t('operator', 'Operator')}
                </label>
                <div className="relative flex items-center">
                  <input
                    id="operator-input"
                    type="text"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[14px] font-medium rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                  />
                  <User size={16} className="absolute right-4 text-[#505f76]" />
                </div>
              </div>

              {/* Field 5: Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="note-input">
                  {t('note', 'Note')}
                </label>
                <div className="relative flex items-center">
                  <input
                    id="note-input"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={lang === 'TH' ? 'เช่น ตรวจสอบจุดฐานชุดผลิต #4' : 'e.g. Batch #4 baseline check'}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[14px] font-medium rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                  />
                  <Edit3 size={16} className="absolute right-4 text-[#505f76]" />
                </div>
              </div>

              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#737686] font-medium">
                <Thermometer size={14} />
                <span>{t('autoRecordedTempRh', 'Auto-recorded: 28° / 52%')}</span>
              </div>
            </form>
          </div>

          {/* Action Button matching Stitch */}
          <div className="pt-6 mt-4">
            <button
              type="button"
              onClick={toggleSampling}
              className={`w-full py-3.5 px-6 rounded-2xl font-medium text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] ${
                isSampling
                  ? 'bg-[#ba1a1a] text-white hover:bg-[#93000a]'
                  : 'bg-[#004ac6] text-white hover:bg-[#003ea8]'
              }`}
            >
              {isSampling ? (
                <>
                  <Square size={18} fill="currentColor" />
                  <span className="font-semibold tracking-wide">
                    {t('stopSampling', 'Stop sampling')}
                  </span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span className="font-semibold tracking-wide">
                    {t('startSampling', 'Start sampling')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT CARD: Dynamic Sensor Response Telemetry (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#eaedff] flex flex-col justify-between min-h-[520px]">
          <div>
            {/* Top Bar: Tabs & Active Profile */}
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3 mb-4">
              <div className="inline-flex p-1 rounded-2xl bg-[#f2f3ff] gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('live')}
                  className={`px-3 py-1 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
                    activeTab === 'live'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  {t('live', 'Live')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('past')}
                  className={`px-3 py-1 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
                    activeTab === 'past'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  {t('pastSessions', 'Past sessions')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('model')}
                  className={`px-3 py-1 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
                    activeTab === 'model'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  {t('model', 'Model')}
                </button>
              </div>

              <div className="text-[11px] text-[#505f76] font-medium hidden sm:flex items-center gap-1.5">
                <Sliders size={14} className="text-[#004ac6]" />
                <span>{t('activeProfile', 'Active Profile: Standard VOC Array')}</span>
              </div>
            </div>

            {/* TAB 1: LIVE matching Stitch 1:1 */}
            {activeTab === 'live' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#004ac6]" />
                    <h2 className="text-[14px] font-semibold text-[#131b2e] tracking-tight">
                      {t('sensorResponse', 'Sensor response (Rs/R0)')}
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d0e1fb] text-[#0b1c30] text-[11px] font-semibold self-start sm:self-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] animate-ping" />
                    <span>{t('acquiringArrayTransient', 'Acquiring array transient')}</span>
                  </div>
                </div>

                {/* 3-Phase Stepper Tracker */}
                <div className="w-full pt-1">
                  <div className="grid grid-cols-3 gap-2 text-[12px] mb-2 font-medium">
                    {/* Phase 1: Completed */}
                    <div className="flex items-center gap-1.5 text-[#131b2e]">
                      <span className="w-4 h-4 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#004ac6] text-[10px] font-bold">
                        ✓
                      </span>
                      <span className="text-[#505f76]">
                        {t('baseline', 'Baseline')} <span className="font-mono text-[11px]">30s</span>
                      </span>
                    </div>
                    {/* Phase 2: Active */}
                    <div className="flex items-center justify-center gap-1.5 text-[#004ac6] font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004ac6]" />
                      </span>
                      <span>
                        {t('exposure', 'Exposure')} <span className="font-mono text-[11px]">60s</span>
                      </span>
                      <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-[#dbe1ff] text-[#00174b] font-mono text-[10px]">
                        {timerSeconds}s
                      </span>
                    </div>
                    {/* Phase 3: Pending */}
                    <div className="flex items-center justify-end gap-1.5 text-[#737686]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c3c6d7]" />
                      <span>
                        {t('recovery', 'Recovery')} <span className="font-mono text-[11px]">90s</span>
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-[#eaedff] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#004ac6]" style={{ width: '35.5%' }} />
                    <div className="h-full bg-[#004ac6]/30" style={{ width: '17.5%' }} />
                    <div className="h-full bg-transparent flex-1" />
                  </div>
                </div>

                {/* Multi-Channel Line Graph (SVG) matching Stitch */}
                <div className="relative w-full h-[260px] my-2 flex items-center">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 720 240">
                    <defs>
                      <linearGradient id="ch1-fade" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1.5" x1="120" x2="120" y1="10" y2="210" />
                    <line stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1.5" x1="360" x2="360" y1="10" y2="210" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="30" y2="30" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="75" y2="75" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="120" y2="120" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="165" y2="165" />
                    <line stroke="#E2E8F0" strokeWidth="1" x1="45" x2="710" y1="210" y2="210" />
                    
                    {/* Y-axis labels */}
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="34">2.4</text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="79">2.0</text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="124">1.6</text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="169">1.2</text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="214">0.8</text>
                    
                    {/* X-axis labels */}
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="start" x="45" y="232">0s</text>
                    <text fill="#2563EB" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="120" y="232">
                      30s ({t('exposureStart', 'Exposure start')})
                    </text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="middle" x="360" y="232">
                      90s ({t('purgeRecovery', 'Purge recovery')})
                    </text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="700" y="232">180s</text>
                    
                    {/* Curves for 6 sensors */}
                    <path d="M 45 208 L 120 208 C 160 205 190 40 360 42 C 430 45 520 185 710 204" fill="none" stroke="#2563EB" strokeLinecap="round" strokeWidth="2.5" />
                    <path d="M 45 206 L 120 206 C 160 200 210 115 360 118 C 440 120 540 195 710 206" fill="none" stroke="#00CC66" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 210 L 120 210 C 160 208 215 142 360 144 C 450 147 560 200 710 209" fill="none" stroke="#00C0FF" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 207 L 120 207 C 160 204 220 85 360 88 C 430 92 530 190 710 205" fill="none" stroke="#FF7E00" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 209 L 120 209 C 160 207 230 166 360 168 C 460 170 580 202 710 208" fill="none" stroke="#8B5CF6" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 208 L 120 208 C 160 206 225 125 360 128 C 455 132 550 198 710 207" fill="none" stroke="#BA1A1A" strokeLinecap="round" strokeWidth="2" />
                    
                    {/* Active timestamp indicator line & circle */}
                    <line stroke="#2563EB" strokeDasharray="2 2" strokeWidth="1.5" x1="256" x2="256" y1="20" y2="210" />
                    <circle cx="256" cy="46" fill="#2563EB" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
                  </svg>
                </div>

                {/* Sensor Channels Legend matching Stitch */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MQ-3 <span className="text-[#505f76] font-normal">(Alcohol)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00CC66]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MQ-2 <span className="text-[#505f76] font-normal">(Combustibles)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00C0FF]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MQ-135 <span className="text-[#505f76] font-normal">(Fumes)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF7E00]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MQ-8 <span className="text-[#505f76] font-normal">(H2)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MiCS-5524 <span className="text-[#505f76] font-normal">(CO)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MiCS-6814 <span className="text-[#505f76] font-normal">(NO2)</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PAST SESSIONS matching Stitch */}
            {activeTab === 'past' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#131b2e]">
                      {t('pastAcquisitionRuns', 'Past Acquisition Runs')}
                    </span>
                    <span className="text-[11px] text-[#505f76] font-mono">
                      ({pastSessions.length} {t('runsRecorded', 'runs recorded')})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#004ac6] hover:underline cursor-pointer"
                  >
                    <Download size={14} />
                    <span>{t('exportCsv', 'Export CSV')}</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[#eaedff]">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#f2f3ff] text-[#505f76] uppercase font-semibold text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">{t('sampleId', 'Sample ID')}</th>
                        <th className="px-4 py-3">{t('compound', 'Compound')}</th>
                        <th className="px-4 py-3">{t('quality', 'Quality')}</th>
                        <th className="px-4 py-3">{t('profile', 'Profile')}</th>
                        <th className="px-4 py-3 text-right rounded-r-xl">{t('actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                      {pastSessions.map((run) => (
                        <tr key={run.id} className="hover:bg-[#f2f3ff]/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-[#131b2e]">{run.id}</td>
                          <td className="px-4 py-3 font-medium">{lang === 'TH' ? run.compoundTh : run.compound}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                run.isSuspect
                                  ? 'bg-[#FF7E00]/15 text-[#c45a00]'
                                  : 'bg-[#00CC66]/15 text-[#008a44]'
                              }`}
                            >
                              {run.quality}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] bg-[#eaedff] font-mono text-[#505f76]">
                              {run.profile}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleRelabel(run.id)}
                                className="px-2 py-0.5 rounded text-[11px] font-medium text-[#004ac6] hover:bg-[#eaedff] transition-colors cursor-pointer"
                              >
                                {t('relabel', 'Relabel')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFlag(run.id)}
                                className="px-2 py-0.5 rounded text-[11px] font-medium text-[#505f76] hover:bg-[#eaedff] transition-colors cursor-pointer"
                              >
                                {t('flag', 'Flag')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(run.id)}
                                className="px-2 py-0.5 rounded text-[11px] font-medium text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-colors cursor-pointer"
                              >
                                {t('delete', 'Delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: MODEL matching Stitch */}
            {activeTab === 'model' && (
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-2xl bg-[#ffdad6]/40 border border-[#ffdad6] flex items-center gap-2 text-[#93000a] text-[12px]">
                  <AlertTriangle size={18} className="text-[#ba1a1a]" />
                  <span className="font-medium">
                    {t('trainedOnDifferentSensor', 'Trained on a different sensor set')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-4 bg-[#f2f3ff] p-4 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-[#505f76]">
                        {t('model', 'Model')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#dbe1ff] text-[#00174b] text-[11px] font-mono font-semibold">
                        v1.3
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[32px] font-bold text-[#131b2e] leading-tight">94%</span>
                      <span className="text-[11px] text-[#505f76] font-medium">
                        {t('validationAccuracy', 'Validation Accuracy')}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#434655] flex items-center gap-1 font-medium">
                      <CheckCircle2 size={14} className="text-[#004ac6]" />
                      <span>5 {t('targetClasses', 'Target Classes')}</span>
                    </div>
                  </div>

                  <div className="md:col-span-8 bg-[#f2f3ff] p-4 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#505f76] uppercase tracking-wider">
                        {t('confusionMatrix', '5x5 Confusion Matrix')}
                      </span>
                      <span className="text-[10px] text-[#737686] font-mono">
                        {t('predictedVsActual', 'Predicted vs Actual')}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-[11px] font-mono border-collapse">
                        <thead>
                          <tr className="text-[#505f76]">
                            <th className="p-1.5 text-left font-medium"></th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">Amb</th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">Thn</th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">Ace</th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">IPA</th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">Eth</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">Amb</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">98%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                          </tr>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">Thn</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">93%</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 text-[#737686]">3%</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                          </tr>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">Ace</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">96%</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                          </tr>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">IPA</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">92%</td>
                            <td className="p-1.5 text-[#737686]">3%</td>
                          </tr>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">Eth</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 text-[#737686]">3%</td>
                            <td className="p-1.5 text-[#737686]">3%</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">93%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[14px] z-50 animate-fade-in">
          <Check size={18} className="text-[#00CC66]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
