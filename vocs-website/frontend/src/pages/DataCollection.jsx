import { useState, useEffect } from 'react';
import {
  Play, Square, ChevronDown, CheckCircle2, RotateCcw,
  Sparkles, Sliders, ArrowRight, Tag
} from 'lucide-react';
import { API } from '../config';
import { useAuth } from '../context/AuthContext';

export default function DataCollection() {
  const { user } = useAuth();
  const [compound, setCompound] = useState('Toluene (C7H8)');
  const [concentration, setConcentration] = useState('50');
  const [sampleId, setSampleId] = useState('SMP-2026-0842');
  const [isSampling, setIsSampling] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'past'

  const [pastSessions, setPastSessions] = useState([
    { id: 'SMP-2025-0841', chemical: 'Toluene', ppm: '50 ppm', date: 'Oct 24, 14:15' },
    { id: 'SMP-2025-0840', chemical: 'Acetone', ppm: '120 ppm', date: 'Oct 24, 11:30' },
    { id: 'SMP-2025-0839', chemical: 'IPA', ppm: '75 ppm', date: 'Oct 23, 16:45' },
    { id: 'SMP-2025-0838', chemical: 'Solvent 100', ppm: '40 ppm', date: 'Oct 23, 09:20' },
    { id: 'SMP-2025-0837', chemical: 'Toluene', ppm: '100 ppm', date: 'Oct 22, 15:10' },
  ]);

  // Load real past sessions from backend
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
              date: s.started_at ? new Date(s.started_at).toLocaleDateString() : 'Today',
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
      try {
        await fetch(`${API}/api/training/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
          },
          body: JSON.stringify({
            box_id: 'BOX-001',
            label: compound.split(' ')[0],
            target_ppm: parseFloat(concentration) || 50,
            note: sampleId,
          }),
        });
      } catch (err) {
        console.warn('Start session API notice:', err);
      }
    }
  }

  return (
    <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#131b2e] tracking-tight">
            Chemical Data Acquisition
          </h1>
          <p className="text-[14px] text-[#434655] mt-0.5">
            5-channel MOS sensor array transient profiling for Coating Line 1 solvents.
          </p>
        </div>
      </div>

      {/* ── Main Two-Column Layout (4 / 8 Grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT CARD: Acquisition Protocol Form (col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[520px] border border-[#eaedff]">
          <div>
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                  <Sliders size={18} />
                </div>
                <h2 className="text-[18px] font-bold text-[#131b2e]">New Sample</h2>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] bg-[#ecfdf5] px-2.5 py-1 rounded-full">
                Ready
              </span>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {/* Field 1: Target Chemical */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                  Target Chemical
                </label>
                <div className="relative">
                  <select
                    value={compound}
                    onChange={(e) => setCompound(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] font-semibold text-[14px] rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:bg-[#eaedff] transition-all cursor-pointer border border-[#eaedff]"
                  >
                    <option>Toluene (C7H8)</option>
                    <option>Xylene (C8H10)</option>
                    <option>Methyl Ethyl Ketone (MEK)</option>
                    <option>Acetone (C3H6O)</option>
                    <option>Ethylbenzene (C8H10)</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#505f76] pointer-events-none" />
                </div>
              </div>

              {/* Field 2: Concentration */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                    Concentration
                  </label>
                  <span className="text-[11px] font-bold text-[#004ac6]">Target Calibrated</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] font-semibold text-[14px] rounded-xl px-4 py-2.5 pr-14 focus:outline-none focus:bg-[#eaedff] transition-all font-mono tabular-nums border border-[#eaedff]"
                  />
                  <span className="absolute right-3 text-[#505f76] font-medium text-[12px] pointer-events-none">
                    ppm
                  </span>
                </div>
              </div>

              {/* Field 3: Sample ID */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
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
                    className="w-full bg-[#f2f3ff] text-[#131b2e] font-semibold text-[13px] rounded-xl px-4 py-2.5 font-mono tracking-wider select-all cursor-default border border-[#eaedff]"
                  />
                  <Tag size={16} className="absolute right-3 text-[#505f76]" />
                </div>
              </div>
            </form>
          </div>

          {/* Action Button */}
          <div className="pt-8">
            <button
              type="button"
              onClick={toggleSampling}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
                isSampling
                  ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-[0_8px_20px_-4px_rgba(239,68,68,0.35)]'
                  : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white'
              }`}
            >
              {isSampling ? (
                <>
                  <Square size={18} fill="white" />
                  <span>Stop sampling</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="white" />
                  <span>Start sampling</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT CARD: Dynamic Sensor Response Telemetry (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[520px] border border-[#eaedff]">
          {/* Top Bar: Title & Tab Switcher */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]" />
                  <h2 className="text-[16px] font-bold text-[#131b2e] tracking-tight">
                    Sensor response (Rs/R0)
                  </h2>
                </div>

                {/* Segmented Tab Switcher */}
                <div className="inline-flex items-center p-0.5 rounded-full bg-[#f2f3ff] border border-[#eaedff]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('live')}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                      activeTab === 'live'
                        ? 'bg-[#2563eb] text-white shadow-xs'
                        : 'text-[#505f76] hover:text-[#131b2e]'
                    }`}
                  >
                    Live
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('past')}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                      activeTab === 'past'
                        ? 'bg-[#2563eb] text-white shadow-xs'
                        : 'text-[#505f76] hover:text-[#131b2e]'
                    }`}
                  >
                    Past sessions
                  </button>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d0e1fb] text-[#0b1c30] text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] animate-ping" />
                Acquiring array transient
              </div>
            </div>

            {/* TAB CONTENT: LIVE VIEW */}
            {activeTab === 'live' ? (
              <div className="flex flex-col justify-between flex-1 animate-fadeIn">
                {/* 3-Phase Stepper Tracker */}
                <div className="w-full pt-1">
                  <div className="grid grid-cols-3 gap-2 text-[12px] mb-2 font-semibold">
                    {/* Phase 1: Completed */}
                    <div className="flex items-center gap-1.5 text-[#131b2e]">
                      <span className="w-4 h-4 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#004ac6] text-[10px] font-bold">
                        ✓
                      </span>
                      <span className="text-[#505f76]">Baseline <span className="font-mono text-[11px]">30s</span></span>
                    </div>
                    {/* Phase 2: Active */}
                    <div className="flex items-center justify-center gap-1.5 text-[#004ac6]">
                      <span className="w-2 h-2 rounded-full bg-[#004ac6] animate-ping" />
                      <span>Exposure <span className="font-mono text-[11px]">60s</span></span>
                      <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-[#dbe1ff] text-[#00174b] font-mono text-[10px]">34s</span>
                    </div>
                    {/* Phase 3: Pending */}
                    <div className="flex items-center justify-end gap-1.5 text-[#505f76]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c3c6d7]" />
                      <span>Recovery <span className="font-mono text-[11px]">90s</span></span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-[#eaedff] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#2563eb]" style={{ width: '35.5%' }} />
                    <div className="h-full bg-[#2563eb]/30" style={{ width: '17.5%' }} />
                    <div className="h-full bg-transparent flex-1" />
                  </div>
                </div>

                {/* Multi-Channel SVG Response Curves */}
                <div className="relative w-full h-[260px] my-2 flex items-center">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 720 240">
                    {/* Phase Vertical Guides */}
                    <line stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1.5" x1="120" x2="120" y1="10" y2="210" />
                    <line stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1.5" x1="360" x2="360" y1="10" y2="210" />

                    {/* Horizontal Reference Grids */}
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="30" y2="30" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="75" y2="75" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="120" y2="120" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="165" y2="165" />
                    <line stroke="#E2E8F0" strokeWidth="1" x1="45" x2="710" y1="210" y2="210" />

                    {/* Y-Axis Labels */}
                    <text fill="#64748B" fontSize="11" textAnchor="end" x="35" y="34">2.4</text>
                    <text fill="#64748B" fontSize="11" textAnchor="end" x="35" y="79">2.0</text>
                    <text fill="#64748B" fontSize="11" textAnchor="end" x="35" y="124">1.6</text>
                    <text fill="#64748B" fontSize="11" textAnchor="end" x="35" y="169">1.2</text>
                    <text fill="#64748B" fontSize="11" textAnchor="end" x="35" y="214">0.8</text>

                    {/* X-Axis Labels */}
                    <text fill="#64748B" fontSize="11" textAnchor="start" x="45" y="232">0s</text>
                    <text fill="#2563EB" fontSize="11" fontWeight="600" textAnchor="middle" x="120" y="232">30s (Exposure start)</text>
                    <text fill="#64748B" fontSize="11" textAnchor="middle" x="360" y="232">90s (Purge recovery)</text>
                    <text fill="#64748B" fontSize="11" textAnchor="end" x="700" y="232">180s</text>

                    {/* Transient Curves: 5 Channels */}
                    <path d="M 45 208 L 120 208 C 160 205 190 40 360 42 C 430 45 520 185 710 204" fill="none" stroke="#2563EB" strokeLinecap="round" strokeWidth="2.5" />
                    <path d="M 45 206 L 120 206 C 160 200 210 115 360 118 C 440 120 540 195 710 206" fill="none" stroke="#00CC66" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 210 L 120 210 C 160 208 215 150 360 152 C 450 155 560 202 710 209" fill="none" stroke="#00C0FF" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 207 L 120 207 C 160 204 220 85 360 88 C 430 92 530 190 710 205" fill="none" stroke="#FF7E00" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 209 L 120 209 C 160 207 225 130 360 132 C 445 136 535 198 710 207" fill="none" stroke="#8B5CF6" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                </div>

                {/* Bottom Channel Legends */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-[#f1f5f9] text-[12px] font-semibold text-[#505f76]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    <span>MOS-1 (Aromatic)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00CC66]" />
                    <span>MOS-2 (Ketone)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00C0FF]" />
                    <span>MOS-3 (Alcohol)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF7E00]" />
                    <span>MOS-4 (Aliphatic)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                    <span>MOS-5 (Oxide)</span>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB CONTENT: PAST SESSIONS TABLE */
              <div className="flex flex-col flex-1 justify-between animate-fadeIn">
                <div className="overflow-x-auto w-full rounded-2xl border border-[#eaedff]">
                  <table className="w-full text-left text-[14px]">
                    <thead className="bg-[#f2f3ff] text-[#505f76] uppercase text-[11px] tracking-wider border-b border-[#eaedff]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Sample ID</th>
                        <th className="py-3 px-4 font-semibold">Chemical</th>
                        <th className="py-3 px-4 font-semibold">ppm</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                      {pastSessions.map((row) => (
                        <tr key={row.id} className="hover:bg-[#f2f3ff]/60 transition-colors">
                          <td className="py-3 px-4 font-mono text-[#004ac6] font-medium">{row.id}</td>
                          <td className="py-3 px-4 font-medium">{row.chemical}</td>
                          <td className="py-3 px-4 font-mono tabular-nums">{row.ppm}</td>
                          <td className="py-3 px-4 text-[#505f76]">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between text-[12px] text-[#505f76] pt-4">
                  <span className="font-medium">Showing 5 recent acquisition sessions</span>
                  <span className="font-mono">Chamber 1 Archive</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
