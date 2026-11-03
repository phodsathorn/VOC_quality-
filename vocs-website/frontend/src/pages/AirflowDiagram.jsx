import { useState } from 'react';
import {
  Wind, Activity, CheckCircle2, ArrowRight, Gauge, ShieldCheck
} from 'lucide-react';
import { Drawer } from '../components/ui';

export default function AirflowDiagram() {
  const [selectedStage, setSelectedStage] = useState(null);

  const stages = [
    {
      id: 'booth',
      name: 'Spray Booth',
      role: 'Source Intake',
      value: '100%',
      metric: 'Inflow capture',
      bgIcon: 'bg-[#dbe1ff] text-[#00174b]',
      details: 'ห้องพ่นสีหลัก ความดันลบมาตรฐาน Inflow velocity 0.45 m/s ป้องกันไอละอองฟุ้งกระจายออกนอกพื้นที่',
    },
    {
      id: 'duct',
      name: 'Duct',
      role: 'Transit Line A',
      value: '18.4 m/s',
      metric: 'Airflow velocity',
      bgIcon: 'bg-[#d3e4fe] text-[#0b1c30]',
      details: 'ท่อลำเลียงไอระเหยสแตนเลส 316L ความเร็วลมลำเลียง 18.4 m/s ความดันสถิต -220 Pa',
    },
    {
      id: 'scrubber',
      name: 'Carbon Scrubber',
      role: 'Adsorption Bed',
      value: '94%',
      metric: 'Efficiency',
      bgIcon: 'bg-[#dbe1ff] text-[#00174b]',
      details: 'ถังดักไอสารเคมี Activated Carbon ขนาด 4mm CTC 60% ประสิทธิภาพการดูดซับ 94% อุณหภูมิเบด 21.8 °C',
    },
    {
      id: 'stack',
      name: 'Exhaust Stack',
      role: 'Atmospheric Port',
      value: '14 ppb',
      metric: 'Residual VOC',
      bgIcon: 'bg-[#e2e7ff] text-[#131b2e]',
      details: 'ปล่องระบายอากาศสู่ภายนอก ตรวจวัดไอสารเคมีตกค้าง 14 ppb (ต่ำกว่าเกณฑ์มาตรฐาน 100 ppb อย่างปลอดภัย)',
    },
  ];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[#434655] text-[13px] uppercase tracking-widest font-semibold mb-1">
            <span>Booth 01</span>
            <span>/</span>
            <span>Aero Exhaust</span>
          </div>
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#131b2e] tracking-tight">
            Airflow Telemetry
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f2f3ff] shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004ac6]" />
            </span>
            <span className="text-[12px] font-bold text-[#131b2e]">
              Laminar Sync Active
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Airstream Pathway Canvas ── */}
      <div className="relative bg-white rounded-3xl p-8 shadow-sm overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#004ac6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-8">
          <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
            Airstream Pathway
          </span>
          <div className="flex items-center gap-1.5 text-[#434655] text-[12px] font-semibold">
            <Wind size={16} className="text-[#004ac6]" />
            <span>1,850 m³/h volumetric mass</span>
          </div>
        </div>

        {/* 4 Pipeline Stages */}
        <div className="relative w-full py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 items-start">
            {stages.map((stage) => (
              <div
                key={stage.id}
                onClick={() => setSelectedStage(stage)}
                className="group flex flex-col items-center text-center cursor-pointer"
              >
                <div className="w-full bg-[#faf8ff] rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 hover:bg-[#f2f3ff] hover:shadow-md min-h-[140px] border border-[#f1f5f9]">
                  <div
                    className={`w-12 h-12 rounded-full ${stage.bgIcon} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Activity size={24} />
                  </div>
                  <span className="text-[14px] font-bold text-[#131b2e]">{stage.name}</span>
                  <span className="text-[12px] text-[#434655] mt-0.5">{stage.role}</span>
                </div>
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-[28px] font-bold text-[#131b2e] leading-tight">
                    {stage.value}
                  </span>
                  <span className="text-[12px] text-[#434655] font-semibold">
                    {stage.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* SVG Animated Connector Line for Desktop */}
          <div className="hidden md:block absolute top-[94px] left-0 w-full px-12 z-0 pointer-events-none">
            <svg className="w-full h-8 overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 32">
              <line stroke="#dae2fd" strokeLinecap="round" strokeWidth="2" x1="120" x2="880" y1="16" y2="16" />
              <line stroke="#2563eb" strokeDasharray="14 18" strokeLinecap="round" strokeWidth="3" x1="120" x2="880" y1="16" y2="16" />
              <circle cx="375" cy="16" fill="#2563eb" r="4" />
              <polygon fill="#2563eb" points="383,16 377,13 377,19" />
              <circle cx="625" cy="16" fill="#2563eb" r="4" />
              <polygon fill="#2563eb" points="633,16 627,13 627,19" />
              <circle cx="875" cy="16" fill="#2563eb" r="4" />
              <polygon fill="#2563eb" points="883,16 877,13 877,19" />
            </svg>
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setSelectedStage(stages[2])}
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#004ac6] hover:underline"
          >
            <span>Aero-pathway telemetry logs</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Bottom 3 Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Filter Pressure */}
        <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
              Filter Pressure
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[11px] font-bold text-[#004ac6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
              Normal
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                312
              </span>
              <span className="text-[20px] font-normal text-[#434655]">Pa</span>
            </div>
            <span className="text-[14px] text-[#434655] mt-1 block">
              Differential pressure across stage 2 filter pack
            </span>
          </div>
          <div className="pt-4 flex items-center justify-between border-t border-[#f1f5f9]">
            <span className="text-[12px] text-[#434655]">Threshold: 450 Pa</span>
            <span
              onClick={() => setSelectedStage(stages[2])}
              className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              View details →
            </span>
          </div>
        </div>

        {/* Card 2: Fan RPM */}
        <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
              Fan RPM
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[11px] font-bold text-[#131b2e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
              Synchronized
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                1,420
              </span>
              <span className="text-[20px] font-normal text-[#434655]">rpm</span>
            </div>
            <span className="text-[14px] text-[#434655] mt-1 block">
              VFD target locked at 82% rated inverter output
            </span>
          </div>
          <div className="pt-4 flex items-center justify-between border-t border-[#f1f5f9]">
            <span className="text-[12px] text-[#434655]">Target: 1,400 rpm</span>
            <span
              onClick={() => setSelectedStage(stages[1])}
              className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              View details →
            </span>
          </div>
        </div>

        {/* Card 3: Bed Temperature */}
        <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
              Bed Temperature
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[11px] font-bold text-[#004ac6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
              Optimal
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                21.8
              </span>
              <span className="text-[20px] font-normal text-[#434655]">°C</span>
            </div>
            <span className="text-[14px] text-[#434655] mt-1 block">
              Adsorption active region thermally stabilized
            </span>
          </div>
          <div className="pt-4 flex items-center justify-between border-t border-[#f1f5f9]">
            <span className="text-[12px] text-[#434655]">Safe range: 18 - 28°C</span>
            <span
              onClick={() => setSelectedStage(stages[2])}
              className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              View details →
            </span>
          </div>
        </div>
      </div>

      {/* ── Sub-State Drawer ── */}
      {selectedStage && (
        <Drawer
          isOpen={Boolean(selectedStage)}
          onClose={() => setSelectedStage(null)}
          title={`${selectedStage.name} Details`}
          subtitle={selectedStage.role}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="text-[11px] font-bold text-[#64748b] uppercase">Operational Reading</div>
              <div className="text-[28px] font-bold text-[#131b2e]">{selectedStage.value}</div>
              <div className="text-[12px] text-[#004ac6] font-semibold">{selectedStage.metric}</div>
            </div>
            <p className="text-[14px] text-[#434655] leading-relaxed">
              {selectedStage.details}
            </p>
          </div>
        </Drawer>
      )}
    </div>
  );
}
