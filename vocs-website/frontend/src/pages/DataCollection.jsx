import { useState, useEffect, useRef } from 'react';
import {
  Play, Square, ChevronDown, CheckCircle2, RotateCcw,
  Sparkles, Sliders, ArrowRight, Tag, FlaskConical, Check, Download,
  Activity, Clock, Cpu, BarChart2
} from 'lucide-react';
import { API } from '../config';
import { useAuth } from '../context/AuthContext';

export default function DataCollection() {
  const { user } = useAuth();
  const [compound, setCompound] = useState('Ambient');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [concentration, setConcentration] = useState('50');
  const [sampleId, setSampleId] = useState('SMP-2025-0842');
  const [isSampling, setIsSampling] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(42);
  const timerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'past' | 'model'
  const [toastMsg, setToastMsg] = useState(null);

  const chemicals = [
    { name: 'Ambient', formula: 'Clean Air Baseline', desc: 'Reference zero baseline' },
    { name: 'Thinner', formula: 'Mixed Solvents', desc: 'Solvent thinner for spray booth' },
    { name: 'Acetone', formula: 'C3H6O', desc: 'Solvent cleaner 58.08 g/mol' },
    { name: 'IPA', formula: 'C3H8O', desc: 'Isopropanol wipe alcohol' },
    { name: 'Ethanol', formula: 'C2H6O', desc: 'Ethanol denatured 46.07 g/mol' },
    { name: 'Toluene', formula: 'C7H8', desc: 'Aromatic solvent 92.14 g/mol' },
  ];

  const [pastSessions, setPastSessions] = useState([
    { id: 'SMP-2025-0841', chemical: 'Toluene', ppm: '50 ppm', duration: '120s', date: 'Oct 24, 14:15', status: 'Completed' },
    { id: 'SMP-2025-0840', chemical: 'Acetone', ppm: '120 ppm', duration: '90s', date: 'Oct 24, 11:30', status: 'Completed' },
    { id: 'SMP-2025-0839', chemical: 'IPA', ppm: '75 ppm', duration: '120s', date: 'Oct 23, 16:45', status: 'Completed' },
    { id: 'SMP-2025-0838', chemical: 'Thinner', ppm: '40 ppm', duration: '180s', date: 'Oct 23, 09:20', status: 'Completed' },
    { id: 'SMP-2025-0837', chemical: 'Ethanol', ppm: '100 ppm', duration: '120s', date: 'Oct 22, 15:10', status: 'Completed' },
  ]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  // Timer effect for sampling
  useEffect(() => {
    if (isSampling) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
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
              chemical: s.label || 'Toluene',
              ppm: s.target_ppm ? `${s.target_ppm} ppm` : '50 ppm',
              duration: '120s',
              date: s.started_at ? new Date(s.started_at).toLocaleDateString() : 'Today',
              status: 'Completed',
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
      setSampleId(`SMP-2025-${Math.floor(Math.random() * 900 + 100)}`);
      showToast('Started data acquisition session...');

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
      showToast('Acquisition stopped and sample saved ✓');
      const newSession = {
        id: sampleId,
        chemical: compound,
        ppm: `${concentration} ppm`,
        duration: `${timerSeconds}s`,
        date: 'Just now',
        status: 'Completed',
      };
      setPastSessions((prev) => [newSession, ...prev]);
    }
  }

  function handleExportPastSessions() {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Sample_ID,Chemical,Concentration,Duration,Timestamp,Status\n' +
      pastSessions.map((s) => `${s.id},${s.chemical},${s.ppm},${s.duration},${s.date},${s.status}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sensor_acquisition_sessions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV successfully ✓');
  }

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* ── Breadcrumb & Header Bar matching Stitch ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold">
            <span className="text-[#004ac6]">Model Training</span>
            <span className="text-[#c3c6d7]">/</span>
            <span className="text-[#505f76] font-medium">Sensor Array Acquisition</span>
          </div>
          <h1 className="text-[28px] font-bold text-[#131b2e] tracking-tight mt-0.5">
            Data Collection
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-1.5 rounded-full bg-white shadow-2xs border border-[#eaedff]">
          <span className="w-2 h-2 rounded-full bg-[#004ac6] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#505f76]">
            Chamber Temp 23.4°C · RH 42%
          </span>
        </div>
      </div>

      {/* ── Strict 2-Card Layout (Left ~1/3, Right ~2/3) matching Stitch ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT CARD: Acquisition Initiation (col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between pb-6">
              <span className="text-xs uppercase tracking-widest text-[#505f76] font-semibold">
                New Sample
              </span>
              <span className="text-[#737686]">
                <Sliders size={18} />
              </span>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {/* Field 1: Chemical Selector with custom dropdown matching sub-state */}
              <div className="flex flex-col gap-1.5 relative z-30">
                <label className="text-[11px] uppercase tracking-wider text-[#505f76] font-semibold">
                  Chemical Compound
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] font-medium text-[14px] rounded-2xl px-4 py-2.5 flex items-center justify-between focus:outline-none focus:bg-[#eaedff] transition-all cursor-pointer text-left border border-[#eaedff]"
                  >
                    <span className="font-semibold">{compound}</span>
                    <ChevronDown size={18} className={`text-[#505f76] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-[#eaedff] p-2 flex flex-col gap-1 z-50 animate-fade-in">
                      {chemicals.map((c) => (
                        <div
                          key={c.name}
                          onClick={() => {
                            setCompound(c.name);
                            setIsDropdownOpen(false);
                          }}
                          className={`p-2.5 rounded-xl flex flex-col cursor-pointer transition-colors ${
                            compound === c.name ? 'bg-[#f2f3ff] text-[#004ac6]' : 'hover:bg-[#f2f3ff]/60 text-[#131b2e]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-semibold">{c.name}</span>
                            <span className="text-[11px] font-mono text-[#505f76]">{c.formula}</span>
                          </div>
                          <span className="text-[11px] text-[#505f76]">{c.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Field 2: Concentration */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] uppercase tracking-wider text-[#505f76] font-semibold">
                    Concentration
                  </label>
                  <span className="text-[11px] font-bold text-[#004ac6]">Target Calibrated</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] font-semibold text-[14px] rounded-2xl px-4 py-2.5 pr-14 focus:outline-none focus:bg-[#eaedff] transition-all font-mono tabular-nums border border-[#eaedff]"
                  />
                  <span className="absolute right-4 text-[#505f76] font-medium text-[12px] pointer-events-none">
                    ppm
                  </span>
                </div>
              </div>

              {/* Field 3: Sample ID */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] uppercase tracking-wider text-[#505f76] font-semibold">
                    Sample ID
                  </label>
                  <span className="text-[10px] text-[#505f76] tracking-wider uppercase font-semibold">
                    Auto-Generated
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={sampleId}
                    readOnly
                    className="w-full bg-[#f2f3ff] text-[#131b2e] font-semibold text-[13px] rounded-2xl px-4 py-2.5 font-mono tracking-wider select-all cursor-default border border-[#eaedff]"
                  />
                  <Tag size={16} className="absolute right-4 text-[#505f76]" />
                </div>
              </div>
            </form>
          </div>

          {/* Action Button: Start / Stop Recording with Active Timer */}
          <div className="pt-8">
            <button
              type="button"
              onClick={toggleSampling}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer ${
                isSampling
                  ? 'bg-[#ba1a1a] hover:bg-[#93000a] text-white shadow-md'
                  : 'bg-[#004ac6] hover:bg-[#003ea8] text-white'
              }`}
            >
              {isSampling ? (
                <>
                  <Square size={18} fill="currentColor" />
                  <span>Stop recording ({formatTimer(timerSeconds)})</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>Start recording</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT CARD: Sensor Response & Tabs (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between min-h-[520px]">
          <div>
            {/* Top Bar: Title, Tabs & Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#004ac6]" />
                  <h2 className="text-[16px] font-bold text-[#131b2e] tracking-tight">
                    Sensor response (Rs/R0)
                  </h2>
                </div>

                {/* Segmented Tab Switcher */}
                <div className="inline-flex items-center p-0.5 rounded-full bg-[#f2f3ff] border border-[#eaedff]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('live')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'live'
                        ? 'bg-[#004ac6] text-white shadow-xs'
                        : 'text-[#505f76] hover:text-[#131b2e]'
                    }`}
                  >
                    Live
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('past')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'past'
                        ? 'bg-[#004ac6] text-white shadow-xs'
                        : 'text-[#505f76] hover:text-[#131b2e]'
                    }`}
                  >
                    Past sessions
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('model')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'model'
                        ? 'bg-[#004ac6] text-white shadow-xs'
                        : 'text-[#505f76] hover:text-[#131b2e]'
                    }`}
                  >
                    Model status
                  </button>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f3ff] text-[#505f76] text-xs font-semibold self-start sm:self-auto">
                <span className={`w-1.5 h-1.5 rounded-full ${isSampling ? 'bg-[#ba1a1a] animate-pulse' : 'bg-[#004ac6]'}`} />
                <span>{isSampling ? 'Acquiring...' : 'Standby'}</span>
              </div>
            </div>

            {/* ── Tab 1: Live Transient Response Graph ── */}
            {activeTab === 'live' && (
              <div className="flex flex-col gap-4">
                {/* SVG Graph Canvas matching Stitch */}
                <div className="w-full h-64 bg-[#faf8ff] rounded-2xl p-4 border border-[#eaedff] relative flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-40">
                    <div className="w-full border-b border-dashed border-[#c3c6d7]" />
                    <div className="w-full border-b border-dashed border-[#c3c6d7]" />
                    <div className="w-full border-b border-dashed border-[#c3c6d7]" />
                    <div className="w-full border-b border-dashed border-[#c3c6d7]" />
                  </div>

                  {/* SVG Multi-Sensor Curves */}
                  <svg className="w-full h-full relative z-10" viewBox="0 0 500 180" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="180" x2="500" y2="180" stroke="#c3c6d7" strokeWidth="1" />
                    {/* Curve 1: MQ-135 (Blue) */}
                    <path
                      d={isSampling ? "M0,160 C50,150 100,60 180,45 C260,35 380,38 500,40" : "M0,150 C80,148 200,146 320,147 C420,148 500,148 500,148"}
                      fill="none"
                      stroke="#004ac6"
                      strokeWidth="2.5"
                    />
                    {/* Curve 2: MQ-3 (Orange) */}
                    <path
                      d={isSampling ? "M0,165 C60,160 120,80 200,65 C280,55 380,58 500,60" : "M0,155 C90,154 210,152 330,153 C430,154 500,154 500,154"}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2"
                    />
                    {/* Curve 3: MQ-2 (Purple) */}
                    <path
                      d={isSampling ? "M0,170 C70,165 140,110 220,100 C300,95 400,98 500,100" : "M0,160 C100,159 220,158 340,158 C440,159 500,159 500,159"}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2"
                    />
                    {/* Curve 4: MQ-8 (Green) */}
                    <path
                      d={isSampling ? "M0,175 C80,170 160,130 240,125 C320,120 420,122 500,124" : "M0,165 C110,164 230,163 350,163 C450,164 500,164 500,164"}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    {/* Active point indicator when sampling */}
                    {isSampling && (
                      <>
                        <circle cx="280" cy="35" r="4" fill="#004ac6" className="animate-ping" />
                        <circle cx="280" cy="35" r="4" fill="#004ac6" />
                      </>
                    )}
                  </svg>

                  {/* X Axis Time Labels */}
                  <div className="flex justify-between text-[11px] text-[#505f76] font-mono relative z-10 pt-1">
                    <span>0s</span>
                    <span>30s</span>
                    <span>60s</span>
                    <span>90s</span>
                    <span>120s</span>
                  </div>
                </div>

                {/* Sensor Legend Pills */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f3ff] text-xs font-semibold text-[#131b2e]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]" />
                    <span>MQ-135 (0.28)</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f3ff] text-xs font-semibold text-[#131b2e]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                    <span>MQ-3 (0.42)</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f3ff] text-xs font-semibold text-[#131b2e]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                    <span>MQ-2 (0.64)</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f3ff] text-xs font-semibold text-[#131b2e]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span>MQ-8 (0.81)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 2: Past Sessions Table ── */}
            {activeTab === 'past' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs text-[#505f76] font-semibold uppercase tracking-wider">
                    {pastSessions.length} Recorded Sessions
                  </span>
                  <button
                    type="button"
                    onClick={handleExportPastSessions}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-xs font-semibold text-[#004ac6] transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="border border-[#eaedff] rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="bg-[#f2f3ff] border-b border-[#eaedff] text-[#505f76] font-medium text-xs">
                        <th className="py-2.5 px-4">Sample ID</th>
                        <th className="py-2.5 px-4">Chemical</th>
                        <th className="py-2.5 px-4">Conc.</th>
                        <th className="py-2.5 px-4">Duration</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                      {pastSessions.map((s) => (
                        <tr key={s.id} className="hover:bg-[#f2f3ff]/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-[#004ac6]">{s.id}</td>
                          <td className="py-3 px-4 font-medium">{s.chemical}</td>
                          <td className="py-3 px-4 font-mono text-[#505f76]">{s.ppm}</td>
                          <td className="py-3 px-4 text-[#505f76]">{s.duration}</td>
                          <td className="py-3 px-4 text-[#505f76] text-xs">{s.date}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00CC66]/10 text-[#009944]">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tab 3: Model Status Tab ── */}
            {activeTab === 'model' && (
              <div className="flex flex-col gap-5 p-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#505f76] font-semibold">Classifier Accuracy</span>
                    <div className="text-[32px] font-bold text-[#004ac6] leading-none my-2">94.2%</div>
                    <span className="text-[11px] text-[#505f76]">Support Vector Machine (RBF)</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#505f76] font-semibold">Dataset Samples</span>
                    <div className="text-[32px] font-bold text-[#131b2e] leading-none my-2">842</div>
                    <span className="text-[11px] text-[#505f76]">5 Target Chemical Classes</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#505f76] font-semibold">Last Retrained</span>
                    <div className="text-[20px] font-bold text-[#131b2e] leading-tight my-2">Today 04:30</div>
                    <span className="text-[11px] text-[#009944] font-semibold">Model active &amp; loaded</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#faf8ff] border border-[#eaedff] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#d0e1fb] flex items-center justify-center text-[#004ac6]">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#131b2e]">Retrain Chemical Classifier</h4>
                      <p className="text-xs text-[#505f76]">Run hyperparameter optimization with latest acquired sessions.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Triggered model training job in background...')}
                    className="px-4 py-2 rounded-2xl bg-[#004ac6] text-white text-xs font-semibold hover:bg-[#003ea8] transition-colors cursor-pointer"
                  >
                    Start retrain
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[14px] z-50 animate-fade-in">
          <Check size={18} className="text-[#00CC66]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
