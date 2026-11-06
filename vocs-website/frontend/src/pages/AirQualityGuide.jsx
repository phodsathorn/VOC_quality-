import { useState } from 'react';
import {
  CheckCircle2, Radio, Sliders, ArrowRight, FileText, X, ShieldAlert,
  Info, Calculator, Cpu
} from 'lucide-react';
import { Modal } from '../components/ui';

export default function AirQualityGuide() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  // Quick Calculator state
  const [calcPollutant, setCalcPollutant] = useState('PM2.5');
  const [calcVal, setCalcVal] = useState(38);

  // Calculate AQI category for Quick Calculator
  const calcResult = (() => {
    const val = Number(calcVal) || 0;
    if (val <= 25) {
      return { score: val, title: 'ดีมาก (Very Good)', color: '#00C0FF', desc: 'ปลอดภัย ทำงานได้ปกติ', bg: 'bg-[#00C0FF]/10 text-[#0088cc]' };
    }
    if (val <= 50) {
      return { score: val, title: 'ดี (Good)', color: '#00CC66', desc: 'ปลอดภัย ทำงานได้ปกติ', bg: 'bg-[#00CC66]/10 text-[#00994d]' };
    }
    if (val <= 100) {
      return { score: val, title: 'ปานกลาง (Moderate)', color: '#FFD100', desc: 'เฝ้าระวังผู้ที่ไวต่อสาร', bg: 'bg-[#FFD100]/20 text-[#b38600]' };
    }
    if (val <= 200) {
      return { score: val, title: 'เริ่มมีผลกระทบ (Unhealthy for Sensitive)', color: '#FF7E00', desc: 'เพิ่มการระบายอากาศและสวมใส่ PPE', bg: 'bg-[#FF7E00]/15 text-[#cc6600]' };
    }
    return { score: val, title: 'มีผลกระทบ (Hazardous)', color: '#FF0000', desc: 'หยุดกระบวนการพ่นสีและอพยพทันที', bg: 'bg-[#FF0000]/15 text-[#cc0000]' };
  })();

  const thresholdLevels = [
    {
      level: 1,
      range: 'AQI 0–50',
      title: 'Good',
      titleTh: 'ดีมาก',
      color: '#10B981',
      bgTag: 'bg-[#10B981]/10',
      textTag: 'text-[#047857]',
      desc: 'Air quality is ideal for all normal factory operations.',
      action: 'Standard Shift',
      actionColor: 'text-[#059669]',
      details: 'บรรยากาศสะอาดบริสุทธิ์ ค่าไอระเหยสารทำละลายอยู่ในเกณฑ์ปลอดภัยมาตรฐานสากล สามารถปฏิบัติงานตามรอบปกติ (Standard Shift) ระบบระบายอากาศทำงานที่ Inflow พื้นฐาน 40%'
    },
    {
      level: 2,
      range: 'AQI 51–100',
      title: 'Moderate',
      titleTh: 'ปานกลาง',
      color: '#F59E0B',
      bgTag: 'bg-[#F59E0B]/10',
      textTag: 'text-[#B45309]',
      desc: 'Acceptable quality; sensitive operators should maintain standard ventilation.',
      action: 'Monitor Lines',
      actionColor: 'text-[#B45309]',
      details: 'คุณภาพอากาศยอมรับได้ เฝ้าระวังผู้ปฏิบัติงานที่มีความไวต่อกลิ่นสารเคมี รักษาระดับการระบายอากาศมาตรฐาน และตรวจสอบความดันตกคร่อมของ Scrubber สม่ำเสมอ'
    },
    {
      level: 3,
      range: 'AQI 101–150',
      title: 'Sensitive Alert',
      titleTh: 'เริ่มมีผลกระทบ',
      color: '#F97316',
      bgTag: 'bg-[#F97316]/10',
      textTag: 'text-[#C2410C]',
      desc: 'Increase booth exhaust rate and limit prolonged solvent exposure.',
      action: 'Exhaust Boost',
      actionColor: 'text-[#C2410C]',
      details: 'ความเข้มข้นสารระเหยเกินเกณฑ์มาตรฐานชั่วคราว เร่งพัดลมดูดอากาศ (Exhaust Boost 60–80%) สวมใส่อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล และจำกัดเวลาสัมผัส'
    },
    {
      level: 4,
      range: 'AQI 151–200',
      title: 'Unhealthy',
      titleTh: 'มีผลกระทบต่อสุขภาพ',
      color: '#EF4444',
      bgTag: 'bg-[#EF4444]/10',
      textTag: 'text-[#B91C1C]',
      desc: 'Activate secondary scrubbers immediately and reduce line throughput.',
      action: 'Secondary Filter',
      actionColor: 'text-[#B91C1C]',
      details: 'มลพิษทางอากาศสูง เดินระบบ Carbon Scrubber สเตจ 2 ทันที ลดอัตรากำลังการพ่นสีในไลน์ สวมหน้ากากกรองไอสารอินทรีย์ระเหยง่าย (Organic Vapor Cartridge)'
    },
    {
      level: 5,
      range: 'AQI 201+',
      title: 'Hazardous',
      titleTh: 'มีผลกระทบมาก',
      color: '#8B5CF6',
      bgTag: 'bg-[#8B5CF6]/10',
      textTag: 'text-[#6D28D9]',
      desc: 'Halt spray application and evacuate booth enclosure now.',
      action: 'Emergency Cut',
      actionColor: 'text-[#6D28D9]',
      details: 'ระดับอันตรายวิกฤต หยุดการจ่ายสารทำละลายและหยุดเครื่องจักรทันที (Emergency Cut-off) อพยพเจ้าหน้าที่ออกจากห้องพ่นสี และส่งสัญญาณเตือนภัยฉุกเฉิน'
    }
  ];

  return (
    <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
      {/* ── Operational Context Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e2e7ff] text-[#004ac6] mb-2">
            <CheckCircle2 size={16} />
            <span className="text-[12px] font-semibold uppercase tracking-wider">
              Calibration Standard OSHA / ISO 16000
            </span>
          </div>
          <h1 className="text-[32px] md:text-[56px] font-bold text-[#131b2e] tracking-tight leading-tight">
            Air Quality Reference
          </h1>
          <p className="text-[14px] text-[#434655] mt-1">
            Real-time dynamic VOC & particulate threshold parameters for Coating Line 1.
          </p>
        </div>

        {/* Active Line Telemetry Anchor */}
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm shrink-0">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-[#434655] font-semibold">
              Active Line Index
            </span>
            <span className="text-[20px] font-bold text-[#131b2e]">
              38 <span className="text-[14px] text-[#434655] font-normal">AQI</span>
            </span>
          </div>
          <div className="h-8 w-px bg-[#eaedff]" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#059669]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[12px] font-semibold uppercase">Optimal</span>
          </div>
        </div>
      </div>

      {/* ── Top Hero Element: Wide 5-Color Spectrum Gauge ── */}
      <section className="w-full bg-white rounded-3xl p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 gap-2">
          <div className="flex flex-col">
            <span className="text-[14px] uppercase text-[#434655] tracking-wider font-semibold">
              Operational Scale
            </span>
            <h2 className="text-[20px] font-bold text-[#131b2e]">
              Air Quality Index Calibration
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#434655] font-semibold">UNIT:</span>
            <span className="text-[14px] text-[#131b2e] font-semibold bg-[#f2f3ff] px-2 py-0.5 rounded">
              μg/m³ & ppm equiv.
            </span>
          </div>
        </div>

        {/* Continuous 5-Stage Segment Spectrum Bar */}
        <div className="w-full flex flex-col gap-3">
          <div className="relative w-full h-4 rounded-full bg-[#f2f3ff] p-0.5 flex gap-1 shadow-inner overflow-hidden">
            {/* Level 1: Emerald Green */}
            <div className="h-full rounded-full transition-all duration-300 relative group" style={{ width: '20%', backgroundColor: '#10B981' }}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
            </div>
            {/* Level 2: Warm Amber */}
            <div className="h-full rounded-full transition-all duration-300 relative group" style={{ width: '20%', backgroundColor: '#F59E0B' }}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
            </div>
            {/* Level 3: Vibrant Orange */}
            <div className="h-full rounded-full transition-all duration-300 relative group" style={{ width: '20%', backgroundColor: '#F97316' }}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
            </div>
            {/* Level 4: Crimson Red */}
            <div className="h-full rounded-full transition-all duration-300 relative group" style={{ width: '20%', backgroundColor: '#EF4444' }}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
            </div>
            {/* Level 5: Rich Purple */}
            <div className="h-full rounded-full transition-all duration-300 relative group" style={{ width: '20%', backgroundColor: '#8B5CF6' }}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
            </div>
          </div>

          {/* Segment Interval Breakpoints */}
          <div className="w-full flex justify-between text-[#434655] text-[12px] px-1 select-none font-semibold">
            <span>0</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
            <span>201+</span>
          </div>
        </div>

        {/* Active Indicator Bar Micro-Detail */}
        <div className="mt-8 pt-4 flex flex-wrap items-center justify-between gap-4 bg-[#f2f3ff]/50 px-4 py-2.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-[#004ac6]" />
            <span className="text-[14px] text-[#131b2e] font-medium">Real-time Chamber Monitoring</span>
          </div>
          <div className="flex items-center gap-4 text-[#434655] text-[13px] font-medium">
            <span>Booth Baseline: <strong className="text-[#131b2e]">Stable</strong></span>
            <span>Sensor Drift: <strong className="text-[#131b2e]">±0.2%</strong></span>
            <span>Gate Latency: <strong className="text-[#131b2e]">240ms</strong></span>
          </div>
        </div>
      </section>

      {/* ── Bottom Element: 5 Threshold Cards (Single Horizontal Row) ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
        {thresholdLevels.map((lvl) => (
          <div
            key={lvl.level}
            onClick={() => setSelectedLevel(lvl)}
            className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[250px] cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-3.5 h-3.5 rounded-full ring-4"
                  style={{
                    backgroundColor: lvl.color,
                    boxShadow: `0 0 0 4px ${lvl.color}33`,
                  }}
                />
                <span className={`text-[12px] font-bold tracking-wider px-2 py-0.5 rounded-full ${lvl.bgTag} ${lvl.textTag}`}>
                  {lvl.range}
                </span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-[16px] leading-tight text-[#131b2e] font-bold">
                  {lvl.title}
                </h3>
                <span className="text-[13px] text-[#434655] mb-2 font-medium">
                  {lvl.titleTh}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#f1f5f9]">
              <p className="text-[13px] text-[#131b2e] leading-snug line-clamp-2">
                {lvl.desc}
              </p>
              <span className={`mt-2 inline-block text-[11px] uppercase tracking-wider font-bold ${lvl.actionColor}`}>
                {lvl.action}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Interactive Control & Operational Protocol Trigger ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-[#f2f3ff] rounded-3xl gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#004ac6] flex items-center justify-center text-white shrink-0">
            <Sliders size={20} />
          </div>
          <div>
            <h4 className="text-[16px] font-bold text-[#131b2e]">
              Automatic Scrubber Linkage
            </h4>
            <p className="text-[14px] text-[#434655]">
              Interlock valves trigger automatically at index breach &gt; 100.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alert('ดาวน์โหลด Threshold Matrix เรียบร้อย')}
            className="px-4 py-2.5 rounded-xl bg-white text-[14px] font-semibold text-[#131b2e] hover:bg-[#eaedff] transition-colors border border-[#e2e8f0] shadow-xs"
          >
            Export Threshold Matrix
          </button>
          <button
            type="button"
            onClick={() => alert('กำลังเริ่มต้นกระบวนการ Line Calibration อัตโนมัติ...')}
            className="px-4 py-2.5 rounded-xl bg-[#004ac6] text-[14px] font-semibold text-white hover:bg-[#2563eb] transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Line Calibration</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Sub-State Level Detail Modal ── */}
      {selectedLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/40 backdrop-blur-sm animate-fadeIn">
          <div
            aria-hidden="true"
            className="fixed inset-0 cursor-pointer"
            onClick={() => setSelectedLevel(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-8 flex flex-col gap-5 z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#eaedff]">
              <div className="flex flex-col gap-1.5">
                <div>
                  <span
                    className="text-[12px] font-bold tracking-wider px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${selectedLevel.color}18`, color: selectedLevel.color }}
                  >
                    {selectedLevel.range}
                  </span>
                </div>
                <h2 className="text-[22px] text-[#131b2e] font-bold">
                  {selectedLevel.title} / {selectedLevel.titleTh}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setSelectedLevel(null)}
                className="p-1.5 rounded-full hover:bg-[#f2f3ff] text-[#505f76] hover:text-[#131b2e] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* 3 Detailed Guidelines */}
            <div className="flex flex-col gap-3 py-1">
              {/* Section 1: General Public */}
              <div className="p-4 rounded-2xl bg-[#f2f3ff] flex items-start gap-3.5 border border-[#eaedff]">
                <div className="w-9 h-9 rounded-full bg-[#d0e1fb] flex items-center justify-center shrink-0 text-[#004ac6]">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                    General personnel
                  </span>
                  <p className="text-[14px] text-[#131b2e] leading-snug mt-1 font-medium">
                    {selectedLevel.level <= 2
                      ? 'Air quality is acceptable for daily factory work. No general operational restrictions required.'
                      : 'Non-essential operators should limit time in Coating Line 1. Maintain standard barrier separation.'}
                  </p>
                </div>
              </div>

              {/* Section 2: Sensitive Groups */}
              <div className="p-4 rounded-2xl bg-[#f2f3ff] flex items-start gap-3.5 border border-[#eaedff]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${selectedLevel.color}20`, color: selectedLevel.color }}
                >
                  <ShieldAlert size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                    Sensitive groups
                  </span>
                  <p className="text-[14px] text-[#131b2e] leading-snug mt-1 font-medium">
                    {selectedLevel.level === 1
                      ? 'No special restrictions. Full normal activity allowed.'
                      : selectedLevel.level === 2
                      ? 'Individuals with respiratory sensitivities should reduce heavy exertion. Keep standard mechanical ventilation active.'
                      : 'Immediate rotation of sensitive operators out of booth area. Monitor for symptoms.'}
                  </p>
                </div>
              </div>

              {/* Section 3: Factory Protocol and PPE */}
              <div className="p-4 rounded-2xl bg-[#f2f3ff] flex items-start gap-3.5 border border-[#eaedff]">
                <div className="w-9 h-9 rounded-full bg-[#dbe1ff] flex items-center justify-center shrink-0 text-[#004ac6]">
                  <Sliders size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                    Factory protocol and PPE
                  </span>
                  <p className="text-[14px] text-[#131b2e] leading-snug mt-1 font-medium">
                    {selectedLevel.details}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={() => setSelectedLevel(null)}
                className="px-4 py-2 rounded-xl bg-[#eaedff] text-[#131b2e] text-[13px] font-semibold hover:bg-[#dbe1ff] transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Slim Utility Row matching Stitch ── */}
      <section className="w-full flex items-center justify-start gap-3 pt-2">
        <button
          type="button"
          onClick={() => setIsMethodModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold text-[#505f76] hover:text-[#131b2e] bg-white hover:bg-[#f2f3ff] border border-[#eaedff] transition-all cursor-pointer shadow-2xs"
        >
          <Info size={16} className="text-[#004ac6]" />
          <span>How it is calculated</span>
        </button>
        <button
          type="button"
          onClick={() => setIsCalcModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold text-[#505f76] hover:text-[#131b2e] bg-white hover:bg-[#f2f3ff] border border-[#eaedff] transition-all cursor-pointer shadow-2xs"
        >
          <Calculator size={16} className="text-[#004ac6]" />
          <span>Calculator</span>
        </button>
      </section>

      {/* ── Modal 1: Calculation Methodology matching Stitch ── */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/40 backdrop-blur-sm animate-fade-in">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsMethodModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#eaedff] z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-2 text-[#004ac6] font-semibold text-sm">
                <Calculator size={20} />
                <span>How it is calculated</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMethodModalOpen(false)}
                className="text-[#505f76] hover:text-[#131b2e] p-1 rounded-full hover:bg-[#f2f3ff] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="py-2 text-xs text-[#131b2e] flex flex-col gap-3">
              <p className="text-[#505f76]">
                AQI is computed by standard piecewise linear interpolation between defined pollutant concentration breakpoints:
              </p>
              <div className="bg-[#f2f3ff] p-3.5 rounded-2xl font-mono text-[11px] text-[#004ac6] overflow-x-auto border border-[#eaedff]">
                AQI = [(I_high - I_low) / (C_high - C_low)] × (C - C_low) + I_low
              </div>
              <div className="space-y-1.5 text-[#505f76] pt-1 text-[11px]">
                <div>• <strong className="text-[#131b2e]">C:</strong> Pollutant concentration value</div>
                <div>• <strong className="text-[#131b2e]">[C_low, C_high]:</strong> Concentration breakpoint bracket</div>
                <div>• <strong className="text-[#131b2e]">[I_low, I_high]:</strong> Corresponding AQI index bracket</div>
              </div>
            </div>
            <div className="pt-3 border-t border-[#eaedff] flex justify-end">
              <button
                type="button"
                onClick={() => setIsMethodModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold rounded-2xl bg-[#004ac6] text-white hover:bg-[#003ea8] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Quick AQI Calculator matching Stitch ── */}
      {isCalcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/40 backdrop-blur-sm animate-fade-in">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsCalcModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#eaedff] z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-2 text-[#004ac6] font-semibold text-sm">
                <Calculator size={20} />
                <span>AQI Calculator</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCalcModalOpen(false)}
                className="text-[#505f76] hover:text-[#131b2e] p-1 rounded-full hover:bg-[#f2f3ff] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="py-2 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] block mb-1">
                  Pollutant
                </label>
                <select
                  value={calcPollutant}
                  onChange={(e) => setCalcPollutant(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] text-xs text-[#131b2e] outline-none font-medium cursor-pointer"
                >
                  <option value="PM2.5">PM2.5 Laser Optical</option>
                  <option value="TVOC">TVOC Solvent Multi-gas</option>
                  <option value="MQ-3">MQ-3 Alcohol / Thinner</option>
                  <option value="Ammonia">Ammonia MiCS / MQ-137</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">
                    Concentration
                  </label>
                  <button
                    type="button"
                    onClick={() => setCalcVal(38)}
                    className="text-[11px] font-medium text-[#004ac6] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Radio size={12} />
                    <span>Use live sensor value</span>
                  </button>
                </div>
                <div className="flex items-center rounded-2xl bg-[#f2f3ff] border border-[#eaedff] overflow-hidden">
                  <input
                    type="number"
                    value={calcVal}
                    onChange={(e) => setCalcVal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-transparent text-xs font-semibold text-[#131b2e] outline-none"
                  />
                  <span className="px-3 py-2.5 bg-[#eaedff] text-[11px] text-[#505f76] font-medium">
                    {calcPollutant === 'PM2.5' ? 'µg/m³' : 'ppb'}
                  </span>
                </div>
              </div>

              <div className="mt-1">
                <div className={`p-3.5 rounded-2xl border border-current/20 flex items-center justify-between ${calcResult.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: calcResult.color }} />
                    <span className="text-xs font-semibold">{calcResult.score} {calcResult.title}</span>
                  </div>
                  <span className="text-[11px] font-medium">{calcResult.desc}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

