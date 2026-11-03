import { useState } from 'react';
import {
  CheckCircle2, Radio, Sliders, ArrowRight, FileText
} from 'lucide-react';
import { Modal } from '../components/ui';

export default function AirQualityGuide() {
  const [selectedLevel, setSelectedLevel] = useState(null);

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

      {/* ── Level Detail Modal ── */}
      {selectedLevel && (
        <Modal
          isOpen={Boolean(selectedLevel)}
          onClose={() => setSelectedLevel(null)}
          title={`${selectedLevel.title} (${selectedLevel.range})`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl flex items-center justify-between"
              style={{ backgroundColor: `${selectedLevel.color}15` }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: selectedLevel.color }}>
                  Protocol Standard
                </span>
                <div className="text-[20px] font-bold text-[#131b2e]">
                  {selectedLevel.title} — {selectedLevel.titleTh}
                </div>
              </div>
              <span
                className="px-3 py-1 rounded-full text-[12px] font-bold"
                style={{ backgroundColor: selectedLevel.color, color: 'white' }}
              >
                {selectedLevel.action}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-[13px] font-bold text-[#131b2e] uppercase tracking-wider">
                คำอธิบายและการปฏิบัติการ
              </h4>
              <p className="text-[14px] text-[#434655] leading-relaxed">
                {selectedLevel.details}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
