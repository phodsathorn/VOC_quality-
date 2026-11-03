import { useState } from 'react';
import {
  Play, Tag, ChevronDown, Check, RefreshCw
} from 'lucide-react';

export default function DataCollection() {
  const [compound, setCompound] = useState('Toluene (C7H8)');
  const [concentration, setConcentration] = useState(50);
  const [sampleId, setSampleId] = useState('SMP-2025-0842');
  const [isSampling, setIsSampling] = useState(false);

  function startSampling() {
    setIsSampling(true);
    setTimeout(() => {
      alert(`บันทึกข้อมูลสภาวะตัวอย่างเคมี ${compound} สำเร็จ และอัปเดตลง Model Training Database เรียบร้อย`);
      setIsSampling(false);
    }, 2000);
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-6">
      {/* ── Breadcrumb & Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[#505f76] text-[11px] font-semibold tracking-wider uppercase">
            <span className="text-[#004ac6]">Model Training</span>
            <span className="text-[#c3c6d7]">/</span>
            <span>Sensor Array Acquisition</span>
          </div>
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#131b2e] tracking-tight mt-0.5">
            Data Collection
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-xs border border-[#e2e8f0]">
          <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse" />
          <span className="text-[12px] font-semibold text-[#505f76] uppercase tracking-wider">
            Chamber Temp 23.4°C · RH 42%
          </span>
        </div>
      </div>

      {/* ── Strict 2-Card Layout (Left ~1/3, Right ~2/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT CARD: Acquisition Initiation (col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between pb-6">
              <span className="text-[12px] uppercase tracking-widest text-[#505f76] font-bold">
                New Sample
              </span>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); startSampling(); }}>
              {/* Field 1: Chemical Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                  Chemical Compound
                </label>
                <div className="relative">
                  <select
                    value={compound}
                    onChange={(e) => setCompound(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] font-semibold text-[14px] rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:bg-[#eaedff] transition-all cursor-pointer"
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
                    className="w-full bg-[#f2f3ff] text-[#131b2e] font-semibold text-[14px] rounded-xl px-4 py-2.5 pr-14 focus:outline-none focus:bg-[#eaedff] transition-all font-mono tabular-nums"
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
                    className="w-full bg-[#f2f3ff] text-[#131b2e] font-semibold text-[13px] rounded-xl px-4 py-2.5 font-mono tracking-wider select-all cursor-default"
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
              onClick={startSampling}
              disabled={isSampling}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3.5 px-6 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
            >
              <Play size={18} fill="white" />
              <span>{isSampling ? 'Sampling in progress...' : 'Start sampling'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT CARD: Dynamic Sensor Response Telemetry (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[520px]">
          {/* Top Bar: Title & Stepper Timeline */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]" />
                <h2 className="text-[16px] font-bold text-[#131b2e] tracking-tight">
                  Sensor response (Rs/R0)
                </h2>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d0e1fb] text-[#0b1c30] text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] animate-ping" />
                Acquiring array transient
              </div>
            </div>

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
              {/* Ch 1: MOS-1 (Royal Blue) */}
              <path d="M 45 208 L 120 208 C 160 205 190 40 360 42 C 430 45 520 185 710 204" fill="none" stroke="#2563EB" strokeLinecap="round" strokeWidth="2.5" />
              {/* Ch 2: MOS-2 (Emerald Green) */}
              <path d="M 45 206 L 120 206 C 160 200 210 115 360 118 C 440 120 540 195 710 206" fill="none" stroke="#00CC66" strokeLinecap="round" strokeWidth="2" />
              {/* Ch 3: MOS-3 (Sky Blue) */}
              <path d="M 45 210 L 120 210 C 160 208 215 150 360 152 C 450 155 560 202 710 209" fill="none" stroke="#00C0FF" strokeLinecap="round" strokeWidth="2" />
              {/* Ch 4: MOS-4 (Orange) */}
              <path d="M 45 207 L 120 207 C 160 204 220 85 360 88 C 430 92 530 190 710 205" fill="none" stroke="#FF7E00" strokeLinecap="round" strokeWidth="2" />
              {/* Ch 5: MOS-5 (Purple) */}
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
      </div>
    </div>
  );
}
