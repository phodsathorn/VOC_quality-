import { useState, useEffect } from 'react';
import {
  Wind, Activity, ArrowRight, X,
  Radio, Thermometer, Filter, Cloud, ShieldCheck
} from 'lucide-react';
import { API } from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function AirflowDiagram() {
  const { t, isThai } = useLanguage();
  const [viewMode, setViewMode] = useState('factory'); // 'factory' (Factory ventilation) | 'sensorbox' (Sensor box pneumatic circuit)
  const [isScrubberDrawerOpen, setIsScrubberDrawerOpen] = useState(false);
  const [showExhaustPopover, setShowExhaustPopover] = useState(true);
  const [activeTooltipDot, setActiveTooltipDot] = useState(1);
  const [isSensorBoxTelemetryOpen, setIsSensorBoxTelemetryOpen] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [maintData, setMaintData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchTelemetry() {
      try {
        const [dashRes, maintRes] = await Promise.all([
          fetch(`${API}/api/dashboard/latest?box_id=BOX-001`).catch(() => null),
          fetch(`${API}/api/maintenance/status`).catch(() => null),
        ]);
        if (dashRes && dashRes.ok && isMounted) {
          const d = await dashRes.json();
          setLiveData(d);
        }
        if (maintRes && maintRes.ok && isMounted) {
          const m = await maintRes.json();
          setMaintData(m);
        }
      } catch (err) {
        console.warn('Airflow live fetch notice:', err);
      }
    }
    fetchTelemetry();
  }, []);

  const reading = liveData?.latest_reading || {};
  const bedTemp = reading.temp != null ? reading.temp.toFixed(1) : '21.8';
  const mediaPercent = maintData?.filter?.healthIndex ? Math.round(maintData.filter.healthIndex) : 42;
  const residualVoc = reading.tvoc != null ? `${Math.round(reading.tvoc / 4)}` : '14';

  const sensorBoxStages = [
    {
      id: 'intake',
      name: isThai ? 'ท่อดักอากาศตัวอย่าง' : 'Intake',
      role: isThai ? 'หัววัดอากาศเข้า' : 'Sample Probe',
      value: '0.45',
      unit: 'L/min',
      metric: isThai ? 'อัตราการดูดอากาศ' : 'Aspiration Rate',
      bgIcon: 'bg-[#dbe1ff] text-[#00174b]',
    },
    {
      id: 'hepa',
      name: isThai ? 'แผ่นกรองขั้นต้น (HEPA)' : 'HEPA Pre-Filter',
      role: isThai ? 'ดักจับละอองฝุ่น' : 'Particulate Trap',
      value: '99.8%',
      metric: isThai ? 'การแยกฝุ่น PM' : 'PM Separation',
      bgIcon: 'bg-[#d3e4fe] text-[#0b1c30]',
    },
    {
      id: 'chamber',
      name: isThai ? 'ห้องตรวจวัดก๊าซ' : 'Sensor Chamber',
      role: isThai ? 'เซลล์ก๊าซ' : 'Gas Cell',
      value: isThai ? '4 เซนเซอร์' : '4 Sensors',
      metric: isThai ? 'แผงเซนเซอร์ตรวจจับ' : 'Active Matrix',
      bgIcon: 'bg-[#dbe1ff] text-[#004ac6]',
      chips: ['MQ-135 1.2 V', 'MQ-3 0.8 V', 'PM2.5 14', isThai ? 'NOx — จำลอง' : 'NOx — Simulated'],
    },
    {
      id: 'mcu',
      name: isThai ? 'ไมโครคอนโทรลเลอร์' : 'Microcontroller',
      role: isThai ? 'แกนประมวลผล ESP32' : 'ESP32 Core',
      value: '100',
      unit: 'Hz',
      metric: isThai ? 'อัตราการสุ่มตัวอย่าง' : 'Sampling Rate',
      bgIcon: 'bg-[#d3e4fe] text-[#0b1c30]',
    },
    {
      id: 'exhaust',
      name: isThai ? 'ช่องระบายอากาศย่อย' : 'Exhaust',
      role: isThai ? 'ช่องปล่อยไมโคร' : 'Micro Vent',
      value: isThai ? 'พาสซีฟ' : 'Passive',
      metric: isThai ? 'การระบายออก' : 'Discharge',
      bgIcon: 'bg-[#e2e7ff] text-[#131b2e]',
    },
  ];

  // Telemetry drawer probes matching screenshots 1 & 5
  const probeRows = [
    {
      id: 'MQ-135',
      loc: isThai ? 'ช่องลมเข้าห้องพ่นสี' : 'Booth Inflow',
      val: '48 ppb',
      thresh: '100 ppb',
      status: isThai ? 'ปกติ' : 'Normal',
    },
    {
      id: 'MQ-137',
      loc: isThai ? 'ปล่องระบายอากาศ' : 'Vent Exhaust',
      val: '32 ppb',
      thresh: '80 ppb',
      status: isThai ? 'ปกติ' : 'Normal',
    },
    {
      id: 'PID',
      loc: isThai ? 'ห้องตรวจวัดหลัก' : 'Primary Chamber',
      val: '64 ppb',
      thresh: '120 ppb',
      status: isThai ? 'ปกติ' : 'Normal',
    },
    {
      id: 'SGP40',
      loc: isThai ? 'โซนอบแห้งเคลือบสี' : 'Curing Zone',
      val: '18 ppb',
      thresh: '50 ppb',
      status: isThai ? 'ปกติ' : 'Normal',
    },
    {
      id: 'TGS2602',
      loc: isThai ? 'ท่อหมุนเวียนอากาศ' : 'Recirculation Line',
      val: '55 ppb',
      thresh: '90 ppb',
      status: isThai ? 'ปกติ' : 'Normal',
    },
  ];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
      {/* ── Header with Mode Switcher matching Stitch ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[#434655] text-[13px] uppercase tracking-widest font-semibold mb-1">
            <span>{isThai ? 'ห้องพ่นสี 01' : 'Booth 01'}</span>
            <span>/</span>
            <span>{isThai ? 'ระบบระบายอากาศไอเสีย' : 'Aero Exhaust'}</span>
            <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
              {isThai ? 'แบบจำลองพลศาสตร์ของไหล' : 'SIMULATED DYNAMICS MODEL'}
            </span>
          </div>
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#131b2e] tracking-tight">
            {isThai ? 'แผนผังการไหลของลมและไอระเหย' : 'Airflow Telemetry'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle pill matching Stitch */}
          <div className="inline-flex items-center bg-[#eaedff] p-1 rounded-full shadow-2xs border border-[#dae2fd]">
            <button
              type="button"
              onClick={() => setViewMode('factory')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'factory'
                  ? 'bg-[#004ac6] text-white shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              {isThai ? 'ระบบระบายอากาศโรงงาน' : 'Factory ventilation'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sensorbox')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'sensorbox'
                  ? 'bg-[#004ac6] text-white shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              {isThai ? 'วงจรนิวเมติกส์กล่องเซนเซอร์' : 'Sensor box'}
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f2f3ff] shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004ac6]" />
            </span>
            <span className="text-[12px] font-bold text-[#131b2e]">
              {isThai ? 'ระบบไหลแบบราบเรียบทำงานปกติ' : 'Laminar Sync Active'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Mode 1: Factory Ventilation View (Matching airflow_telemetry_drawer_pathway_details) ── */}
      {viewMode === 'factory' && (
        <>
          <div className="relative bg-white rounded-3xl p-8 shadow-sm overflow-hidden border border-[#eaedff]">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
                {isThai ? 'เส้นทางการระบายไอระเหย' : 'Airstream Pathway'}
              </span>
              <div className="flex items-center gap-1.5 text-[#434655] text-[12px] font-semibold">
                <Wind size={16} className="text-[#004ac6]" />
                <span>{isThai ? 'อัตราไหลเชิงปริมาตร 1,850 m³/h' : '1,850 m³/h volumetric mass'}</span>
              </div>
            </div>

            {/* 4 Pipeline Stages */}
            <div className="relative w-full py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 items-start">
                {/* 1. Spray Booth */}
                <div className="group flex flex-col items-center text-center">
                  <div className="w-full bg-[#faf8ff] rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 hover:bg-[#f2f3ff] hover:shadow-md min-h-[140px] border border-[#f1f5f9]">
                    <div className="w-12 h-12 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#00174b] mb-3 transition-transform duration-300 group-hover:scale-110">
                      <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
                    </div>
                    <span className="text-[14px] font-bold text-[#131b2e]">{isThai ? 'ห้องพ่นสี' : 'Spray Booth'}</span>
                    <span className="text-[12px] text-[#434655] mt-0.5 font-medium">{isThai ? 'จุดดึงอากาศต้นทาง' : 'Source Intake'}</span>
                  </div>
                  <div className="mt-4 flex flex-col items-center">
                    <span className="text-[28px] font-bold text-[#131b2e] leading-tight">100%</span>
                    <span className="text-[13px] text-[#434655]">{isThai ? 'การดักจับอากาศเข้า' : 'Inflow capture'}</span>
                  </div>
                </div>

                {/* 2. Duct Transit Line A */}
                <div className="group flex flex-col items-center text-center relative">
                  <div className="w-full bg-[#faf8ff] rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 hover:bg-[#f2f3ff] hover:shadow-md min-h-[140px] border border-[#f1f5f9]">
                    <div className="w-12 h-12 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[#0b1c30] mb-3 transition-transform duration-300 group-hover:scale-110">
                      <span className="material-symbols-outlined text-[24px]">cyclone</span>
                    </div>
                    <span className="text-[14px] font-bold text-[#131b2e]">{isThai ? 'ท่อส่งลมไอเสีย' : 'Duct'}</span>
                    <span className="text-[12px] text-[#434655] mt-0.5 font-medium">{isThai ? 'แนวท่อส่งลมสาย A' : 'Transit Line A'}</span>
                  </div>
                  <div className="mt-4 flex flex-col items-center">
                    <span className="text-[28px] font-bold text-[#131b2e] leading-tight">
                      18.4 <span className="text-[14px] font-normal text-[#434655]">m/s</span>
                    </span>
                    <span className="text-[13px] text-[#434655]">{isThai ? 'ความเร็วลมระบาย' : 'Airflow velocity'}</span>
                  </div>
                </div>

                {/* 3. Carbon Scrubber (Clickable with active drawer trigger) */}
                <div className="group flex flex-col items-center text-center">
                  <button
                    type="button"
                    onClick={() => setIsScrubberDrawerOpen(true)}
                    className={`w-full cursor-pointer bg-[#faf8ff] hover:bg-[#f2f3ff] rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 shadow-sm min-h-[140px] text-center border ${
                      isScrubberDrawerOpen
                        ? 'ring-2 ring-[#004ac6] ring-offset-2 border-[#004ac6] shadow-md'
                        : 'border-[#f1f5f9] hover:shadow-md'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#004ac6] flex items-center justify-center text-white mb-3 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">filter_alt</span>
                    </div>
                    <span className="text-[14px] font-bold text-[#131b2e]">{isThai ? 'ชุดถ่านกัมมันต์ดูดซับ' : 'Carbon Scrubber'}</span>
                    <span className="text-[12px] text-[#004ac6] font-semibold mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] inline-block" />
                      {isThai ? 'ตรวจความพร้อมทำงาน' : 'Active Inspection'}
                    </span>
                  </button>
                  <div className="mt-4 flex flex-col items-center">
                    <span className="text-[28px] font-bold text-[#131b2e] leading-tight">94%</span>
                    <span className="text-[13px] text-[#434655]">{isThai ? 'ประสิทธิภาพการดูดซับ' : 'Efficiency'}</span>
                  </div>
                </div>

                {/* 4. Exhaust Stack with Popover */}
                <div className="group flex flex-col items-center text-center relative">
                  <button
                    type="button"
                    onClick={() => setShowExhaustPopover(!showExhaustPopover)}
                    className="w-full cursor-pointer bg-[#faf8ff] rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 hover:bg-[#f2f3ff] hover:shadow-md min-h-[140px] text-center border border-[#f1f5f9]"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#131b2e] mb-3 transition-transform duration-300 group-hover:scale-110">
                      <span className="material-symbols-outlined text-[24px]">cloud_done</span>
                    </div>
                    <span className="text-[14px] font-bold text-[#131b2e]">{isThai ? 'ปล่องระบายอากาศ' : 'Exhaust Stack'}</span>
                    <span className="text-[12px] text-[#434655] mt-0.5 font-medium">{isThai ? 'ช่องระบายออกสู่บรรยากาศ' : 'Atmospheric Port'}</span>
                  </button>

                  {/* Popover */}
                  {showExhaustPopover && (
                    <div className="absolute -top-11 z-30 transition-all duration-200">
                      <div className="bg-[#283044] text-[#eef0ff] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-[#737686]/20">
                        <span className="w-2 h-2 rounded-full bg-[#b4c5ff] inline-block" />
                        <span className="text-[11px] font-medium tracking-wide whitespace-nowrap">
                          {isThai ? 'ปล่อยออกสู่ภายนอก: ' : 'Stack output: '}<strong className="text-[#b4c5ff] font-bold">{residualVoc} ppb</strong>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowExhaustPopover(false);
                          }}
                          className="text-[#eef0ff]/70 hover:text-white ml-0.5 text-[14px] leading-none cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                      <div className="w-2.5 h-2.5 bg-[#283044] rotate-45 mx-auto -mt-1 border-r border-b border-[#737686]/20" />
                    </div>
                  )}

                  <div className="mt-4 flex flex-col items-center">
                    <span className="text-[28px] font-bold text-[#131b2e] leading-tight">
                      {residualVoc} <span className="text-[14px] font-normal text-[#434655]">ppb</span>
                    </span>
                    <span className="text-[13px] text-[#943700] font-medium">{isThai ? 'สารระเหยตกค้าง' : 'Residual VOC'}</span>
                  </div>
                </div>
              </div>

              {/* SVG Animated Connector Line for Desktop */}
              <div className="hidden md:block absolute top-[94px] left-0 w-full px-12 z-0 pointer-events-none">
                <svg className="w-full h-8 overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 32">
                  <line stroke="#dae2fd" strokeLinecap="round" strokeWidth="2" x1="120" x2="880" y1="16" y2="16" />
                  <line className="airflow-pulse" stroke="#2563eb" strokeDasharray="14 18" strokeLinecap="round" strokeWidth="3" x1="120" x2="880" y1="16" y2="16" />
                  <circle cx="375" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#2563eb" points="383,16 377,13 377,19" />
                  <circle cx="625" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#2563eb" points="633,16 627,13 627,19" />
                  <circle cx="875" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#875,16" points="883,16 877,13 877,19" />
                </svg>
              </div>

              {/* Duct Segments Interactive Info Dots & Velocity Tooltip */}
              <div className="hidden md:block absolute top-[94px] left-0 w-full px-12 z-20 pointer-events-auto">
                <div className="relative w-full h-8">
                  {/* Info Dot 1: between Spray Booth and Duct (approx 24.5%) */}
                  <div className="absolute -top-1 left-[24.5%] -translate-x-1/2 flex flex-col items-center group/dot">
                    {activeTooltipDot === 1 && (
                      <div className="absolute -top-12 flex flex-col items-center transition-all duration-200 pointer-events-auto">
                        <div className="bg-[#283044] text-[#eef0ff] px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 border border-[#737686]/20 whitespace-nowrap text-left">
                          <Wind size={14} className="text-[#b4c5ff]" />
                          <span className="text-[12px] font-medium">{isThai ? 'ความเร็วลมท่อส่งลม: ' : 'Velocity '}<strong className="text-[#b4c5ff] font-bold">18.4 m/s</strong></span>
                        </div>
                        <div className="w-2 h-2 bg-[#283044] rotate-45 -mt-1 border-r border-b border-[#737686]/20" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTooltipDot(activeTooltipDot === 1 ? null : 1)}
                      className="w-6 h-6 rounded-full bg-white border-2 border-[#004ac6] text-[#004ac6] flex items-center justify-center shadow-md hover:scale-125 transition-transform cursor-pointer relative"
                      title={isThai ? 'ความเร็วลมท่อส่งลม: 18.4 m/s' : 'Duct intake telemetry: Velocity 18.4 m/s'}
                    >
                      <span className="text-[11px] font-bold leading-none">i</span>
                    </button>
                  </div>

                  {/* Info Dot 2: between Duct and Carbon Scrubber (approx 50%) */}
                  <div className="absolute -top-1 left-[50%] -translate-x-1/2 flex flex-col items-center group/dot">
                    {activeTooltipDot === 2 && (
                      <div className="absolute -top-12 flex flex-col items-center transition-all duration-200 pointer-events-auto">
                        <div className="bg-[#283044] text-[#eef0ff] px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 border border-[#737686]/20 whitespace-nowrap text-left">
                          <span className="text-[12px] font-medium">
                            {isThai ? 'ทางเข้าชุดดูดซับ: ' : 'Scrubber inlet: '}
                            <strong className="text-[#b4c5ff] font-bold">
                              {isThai ? 'ท่อส่งลมสาย A เสถียร' : 'Transit Line A stable'}
                            </strong>
                          </span>
                        </div>
                        <div className="w-2 h-2 bg-[#283044] rotate-45 -mt-1 border-r border-b border-[#737686]/20" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTooltipDot(activeTooltipDot === 2 ? null : 2)}
                      className="w-6 h-6 rounded-full bg-white border-2 border-[#004ac6] text-[#004ac6] flex items-center justify-center shadow-md hover:scale-125 transition-transform cursor-pointer relative"
                      title={isThai ? 'ทางเข้าชุดดูดซับ: ท่อส่งลม A เสถียร' : 'Scrubber inlet: Transit Line A stable'}
                    >
                      <span className="text-[11px] font-bold leading-none">i</span>
                    </button>
                  </div>

                  {/* Info Dot 3: between Carbon Scrubber and Exhaust Stack (approx 75.5%) */}
                  <div className="absolute -top-1 left-[75.5%] -translate-x-1/2 flex flex-col items-center group/dot">
                    {activeTooltipDot === 3 && (
                      <div className="absolute -top-12 flex flex-col items-center transition-all duration-200 pointer-events-auto">
                        <div className="bg-[#283044] text-[#eef0ff] px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 border border-[#737686]/20 whitespace-nowrap text-left">
                          <span className="text-[12px] font-medium">
                            {isThai ? 'การส่งผ่านไอเสีย: ' : 'Exhaust transfer: '}
                            <strong className="text-[#b4c5ff] font-bold">
                              {isThai ? 'ตัวกรอง VOC ทำงาน' : 'VOC filter active'}
                            </strong>
                          </span>
                        </div>
                        <div className="w-2 h-2 bg-[#283044] rotate-45 -mt-1 border-r border-b border-[#737686]/20" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTooltipDot(activeTooltipDot === 3 ? null : 3)}
                      className="w-6 h-6 rounded-full bg-white border-2 border-[#004ac6] text-[#004ac6] flex items-center justify-center shadow-md hover:scale-125 transition-transform cursor-pointer relative"
                      title={isThai ? 'การส่งผ่านไอเสีย: ตัวกรอง VOC ทำงาน' : 'Exhaust duct transfer: VOC filter active'}
                    >
                      <span className="text-[11px] font-bold leading-none">i</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsScrubberDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#004ac6] hover:underline cursor-pointer group"
              >
                <span>{isThai ? 'บันทึกโทรมาตรเส้นทางลมไอเสีย' : 'Aero-pathway telemetry logs'}</span>
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* 3 Metric Cards for Factory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#eaedff]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
                  {isThai ? 'แรงดันตกคร่อมตัวกรอง' : 'Filter Pressure'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[12px] font-semibold text-[#004ac6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
                  {isThai ? 'ปกติ' : 'Normal'}
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
                  {isThai ? 'แรงดันตกคร่อมชุดตัวกรองขั้นที่ 2' : 'Differential pressure across stage 2 filter pack'}
                </span>
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-[#f1f5f9]">
                <span className="text-[12px] text-[#434655]">
                  {isThai ? 'เกณฑ์กำหนด: 450 Pa' : 'Threshold: 450 Pa'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsScrubberDrawerOpen(true)}
                  className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {isThai ? 'ดูรายละเอียด →' : 'View details →'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#eaedff]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
                  {isThai ? 'รอบหมุนพัดลมดูดอากาศ' : 'Fan RPM'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[12px] font-semibold text-[#131b2e]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
                  {isThai ? 'ซิงโครไนซ์' : 'Synchronized'}
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
                  {isThai ? 'อินเวอร์เตอร์ล็อกเป้าหมายที่ 82% ของกำลังพิกัด' : 'VFD target locked at 82% rated inverter output'}
                </span>
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-[#f1f5f9]">
                <span className="text-[12px] text-[#434655]">
                  {isThai ? 'เป้าหมาย: 1,400 rpm' : 'Target: 1,400 rpm'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsScrubberDrawerOpen(true)}
                  className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {isThai ? 'ดูรายละเอียด →' : 'View details →'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#eaedff]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
                  {isThai ? 'อุณหภูมิชั้นถ่านกัมมันต์' : 'Bed Temperature'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[12px] font-semibold text-[#004ac6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
                  {isThai ? 'เหมาะสม' : 'Optimal'}
                </span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                    {bedTemp}
                  </span>
                  <span className="text-[20px] font-normal text-[#434655]">°C</span>
                </div>
                <span className="text-[14px] text-[#434655] mt-1 block">
                  {isThai ? 'โซนดูดซับสารเคมีอยู่ในเกณฑ์อุณหภูมิเสถียร' : 'Adsorption active region thermally stabilized'}
                </span>
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-[#f1f5f9]">
                <span className="text-[12px] text-[#434655]">
                  {isThai ? 'เกณฑ์ปลอดภัย: 18 - 28°C' : 'Safe range: 18 - 28°C'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsScrubberDrawerOpen(true)}
                  className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {isThai ? 'ดูรายละเอียด →' : 'View details →'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Mode 2: Sensor Box View (Matching airflow_sensor_box_telemetry) ── */}
      {viewMode === 'sensorbox' && (
        <>
          <div className="relative bg-white rounded-3xl p-8 shadow-sm overflow-hidden border border-[#eaedff]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
                  Sensor Box Pneumatic Circuit
                </span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2e7ff] text-[#004ac6] text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] animate-pulse" />
                  Fan: AUTO 40%
                </div>
                <span className="text-[12px] text-[#505f76] font-medium">RPM 2,400</span>
              </div>
              <div className="flex items-center gap-1 text-[#434655] text-[12px] font-semibold">
                <Thermometer size={16} className="text-[#004ac6]" />
                <span>Continuous Micro-Stream</span>
              </div>
            </div>

            {/* 5 Pneumatic Stages */}
            <div className="relative w-full py-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10 items-stretch">
                {sensorBoxStages.map((stage) => (
                  <div key={stage.id} className="group flex flex-col items-center text-center">
                    <div className="w-full bg-[#faf8ff] rounded-2xl p-5 flex flex-col items-center justify-center transition-all duration-300 hover:bg-[#f2f3ff] hover:shadow-md min-h-[140px] border border-[#eaedff]">
                      <div
                        className={`w-12 h-12 rounded-full ${stage.bgIcon} flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Radio size={22} />
                      </div>
                      <span className="text-[14px] font-bold text-[#131b2e]">{stage.name}</span>
                      <span className="text-[11px] text-[#505f76] mt-0.5">{stage.role}</span>
                      {stage.chips && (
                        <div className="flex flex-wrap gap-1 justify-center mt-2">
                          {stage.chips.map((chip) => (
                            <span
                              key={chip}
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#eaedff] text-[10px] text-[#131b2e] font-semibold"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col items-center">
                      <span className="text-[22px] font-bold text-[#131b2e] leading-tight">
                        {stage.value}{stage.unit ? <span className="text-[14px] font-normal text-[#505f76] ml-1">{stage.unit}</span> : null}
                      </span>
                      <span className="text-[12px] text-[#505f76]">{stage.metric}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* SVG Pulse Line for 5 items */}
              <div className="hidden md:block absolute top-[94px] left-0 w-full px-12 z-0 pointer-events-none">
                <svg className="w-full h-8 overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 32">
                  <line stroke="#dae2fd" strokeLinecap="round" strokeWidth="2" x1="100" x2="900" y1="16" y2="16" />
                  <line className="airflow-pulse" stroke="#2563eb" strokeDasharray="14 18" strokeLinecap="round" strokeWidth="3" x1="100" x2="900" y1="16" y2="16" />
                  <circle cx="290" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#2563eb" points="298,16 292,13 292,19" />
                  <circle cx="490" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#2563eb" points="498,16 492,13 492,19" />
                  <circle cx="690" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#2563eb" points="698,16 692,13 692,19" />
                  <circle cx="890" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#898,16" points="898,16 892,13 892,19" />
                </svg>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSensorBoxTelemetryOpen(true)}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#004ac6] hover:underline cursor-pointer group"
              >
                <span>Sensor box diagnostic logs</span>
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* 3 Metric Cards for Sensor Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#eaedff]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
                  Fan Speed
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[12px] font-semibold text-[#004ac6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
                  Active
                </span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                    2,400
                  </span>
                  <span className="text-[20px] font-normal text-[#434655]">RPM</span>
                </div>
                <span className="text-[14px] text-[#434655] mt-1 block">
                  Micro-blower aspiration duty cycle at 40%
                </span>
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-[#f1f5f9]">
                <span className="text-[12px] text-[#434655]">Target: 2,400 RPM</span>
                <button
                  type="button"
                  onClick={() => setIsSensorBoxTelemetryOpen(true)}
                  className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  View details →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#eaedff]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
                  Chamber Temp
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[12px] font-semibold text-[#004ac6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
                  Optimal
                </span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                    24.2
                  </span>
                  <span className="text-[20px] font-normal text-[#434655]">°C</span>
                </div>
                <span className="text-[14px] text-[#434655] mt-1 block">
                  Gas sensor heater balance &amp; ambient enclosure
                </span>
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-[#f1f5f9]">
                <span className="text-[12px] text-[#434655]">Safe range: 20 - 30°C</span>
                <button
                  type="button"
                  onClick={() => setIsSensorBoxTelemetryOpen(true)}
                  className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  View details →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#eaedff]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
                  HEPA ΔP
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[12px] font-semibold text-[#004ac6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
                  Normal
                </span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                    45
                  </span>
                  <span className="text-[20px] font-normal text-[#434655]">Pa</span>
                </div>
                <span className="text-[14px] text-[#434655] mt-1 block">
                  Inlet membrane particulate restriction
                </span>
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-[#f1f5f9]">
                <span className="text-[12px] text-[#434655]">Max threshold: 90 Pa</span>
                <button
                  type="button"
                  onClick={() => setIsSensorBoxTelemetryOpen(true)}
                  className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  View details →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Sub-State Right-side Drawer: Carbon Scrubber Telemetry (100% Stitch airflow_telemetry_drawer_pathway_details) ── */}
      {isScrubberDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] z-50 transition-opacity"
            onClick={() => setIsScrubberDrawerOpen(false)}
          />
          <aside className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] animate-in slide-in-from-right duration-300 overflow-y-auto">
            {/* Header */}
            <div className="p-8 border-b border-[#eaedff] flex items-start justify-between bg-[#faf8ff]/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#004ac6] mt-0.5">
                  <span className="material-symbols-outlined text-[22px]">filter_alt</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[20px] font-bold text-[#131b2e] leading-tight">
                    {isThai ? 'โทรมาตรสครับเบอร์ถ่านกัมมันต์' : 'Carbon Scrubber Telemetry'}
                  </h2>
                  <span className="text-[12px] text-[#434655] mt-1 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#004ac6] inline-block" />
                    {isThai ? 'ชุดถ่านกัมมันต์สายที่ 01 • เรียลไทม์' : 'Adsorption Bed Line 01 • Real-time'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScrubberDrawerOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-[#eaedff] flex items-center justify-center text-[#434655] hover:text-[#131b2e] transition-colors cursor-pointer text-[20px] font-light"
              >
                ✕
              </button>
            </div>

            {/* 3 BIG NUMBERS ONLY with ample whitespace */}
            <div className="p-8 flex-1 flex flex-col justify-around gap-8 my-4">
              {/* Number 1: Differential Pressure 312 Pa */}
              <div className="flex flex-col p-6 rounded-2xl bg-[#f2f3ff]/60 hover:bg-[#f2f3ff] transition-colors border border-[#eaedff]">
                <span className="text-[12px] font-semibold text-[#434655] uppercase tracking-widest mb-1">
                  {isThai ? 'แรงดันตกคร่อม' : 'Differential pressure'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[54px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                    312
                  </span>
                  <span className="text-[22px] font-medium text-[#434655]">Pa</span>
                </div>
                <span className="text-[12px] text-[#004ac6] font-medium mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] inline-block" />
                  {isThai ? 'แรงต้านการไหลปกติ' : 'Nominal resistance'}
                </span>
              </div>

              {/* Number 2: Efficiency 94.2% */}
              <div className="flex flex-col p-6 rounded-2xl bg-[#f2f3ff]/60 hover:bg-[#f2f3ff] transition-colors border border-[#eaedff]">
                <span className="text-[12px] font-semibold text-[#434655] uppercase tracking-widest mb-1">
                  {isThai ? 'ประสิทธิภาพการดูดซับ' : 'Efficiency'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[54px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                    94.2
                  </span>
                  <span className="text-[28px] font-semibold text-[#434655]">%</span>
                </div>
                <span className="text-[12px] text-[#004ac6] font-medium mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] inline-block" />
                  {isThai ? 'อัตราดูดซับสารไฮโดรคาร์บอน' : 'Hydrocarbon adsorption yield'}
                </span>
              </div>

              {/* Number 3: Filter life 42% */}
              <div className="flex flex-col p-6 rounded-2xl bg-[#f2f3ff]/60 hover:bg-[#f2f3ff] transition-colors border border-[#eaedff]">
                <span className="text-[12px] font-semibold text-[#434655] uppercase tracking-widest mb-1">
                  {isThai ? 'อายุการใช้งานชั้นถ่าน' : 'Filter life'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[54px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                    {mediaPercent}
                  </span>
                  <span className="text-[28px] font-semibold text-[#434655]">%</span>
                </div>
                <span className="text-[12px] text-[#434655] font-medium mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#505f76] inline-block" />
                  {isThai ? 'เหลืออายุการทำงาน 1,280 ชั่วโมง' : '1,280 operating hours remaining'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-[#eaedff] bg-[#faf8ff]/30 flex items-center justify-between">
              <span className="text-[12px] text-[#434655]">
                {isThai ? 'อัปเดต 3 วินาทีที่แล้ว' : 'Updated 3s ago'}
              </span>
              <button
                type="button"
                onClick={() => setIsScrubberDrawerOpen(false)}
                className="px-6 py-2 rounded-full bg-[#e2e7ff] hover:bg-[#d0e1fb] text-[#131b2e] font-semibold text-[13px] transition-colors cursor-pointer"
              >
                {isThai ? 'ปิดหน้าต่าง' : 'Dismiss'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Sub-State Right-side Drawer: Live sensor telemetry (Sensor box mode) ── */}
      {isSensorBoxTelemetryOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] z-50 transition-opacity"
            onClick={() => setIsSensorBoxTelemetryOpen(false)}
          />
          <aside className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 px-6 border-b border-[#eaedff] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#d0e1fb] flex items-center justify-center text-[#004ac6]">
                  <Radio size={18} />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#131b2e] leading-tight">
                    {isThai ? 'โทรมาตรเซนเซอร์เรียลไทม์' : 'Live sensor telemetry'}
                  </h2>
                  <span className="text-[11px] text-[#505f76]">
                    {isThai ? 'ห้องพ่นสีที่ 1 • 5 หัววัดทำงาน' : 'Powder Coating Booth 1 • 5 Active Probes'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSensorBoxTelemetryOpen(false)}
                className="p-1.5 rounded-full text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-semibold">
                  {isThai ? 'ค่าตรวจวัดหัววัดเรียลไทม์' : 'Real-time probe readings'}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-[#00AA55] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#00CC66] animate-pulse" />
                  {isThai ? 'ทุกระบบทำงานปกติ' : 'All systems nominal'}
                </div>
              </div>

              {/* Probe Table matching Stitch exactly */}
              <div className="border border-[#eaedff] rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#f2f3ff] border-b border-[#eaedff] text-[#505f76] font-medium text-xs">
                      <th className="py-2.5 px-4">{isThai ? 'รหัสเซนเซอร์' : 'Sensor ID'}</th>
                      <th className="py-2.5 px-4">{isThai ? 'ตำแหน่ง' : 'Location'}</th>
                      <th className="py-2.5 px-4 text-right">{isThai ? 'ค่าที่อ่านได้' : 'Value'}</th>
                      <th className="py-2.5 px-4 text-right">{isThai ? 'เกณฑ์กำหนด' : 'Threshold'}</th>
                      <th className="py-2.5 px-4 text-center">{isThai ? 'สถานะ' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                    {probeRows.map((p) => (
                      <tr key={p.id} className="hover:bg-[#eaedff]/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#131b2e]">{p.id}</td>
                        <td className="py-3 px-4 text-[#505f76] text-xs">{p.loc}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#131b2e]">{p.val}</td>
                        <td className="py-3 px-4 text-right text-[#505f76] text-xs">{p.thresh}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#00CC66]/10 text-[#009944]">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sampling Rate Banner */}
              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#131b2e]">{isThai ? 'อัตราการสุ่มตัวอย่าง' : 'Sampling Rate'}</span>
                  <span className="text-xs text-[#505f76] font-medium">{isThai ? '2.5 Hz (ต่อเนื่อง)' : '2.5 Hz (Continuous)'}</span>
                </div>
                <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#004ac6] h-full rounded-full w-full" />
                </div>
                <p className="text-[11px] text-[#505f76] mt-2">
                  {isThai ? 'ซิงโครไนซ์ล่าสุดเมื่อ 3 วินาทีที่แล้วผ่านเกตเวย์ Modbus TCP' : 'Latest synchronization occurred 3 seconds ago via Modbus TCP gateway.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#eaedff] bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-[#505f76]">
                {isThai ? 'รหัสแผงอุปกรณ์: ' : 'Array ID: '}<strong className="font-mono text-[#131b2e]">BOX-001</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsSensorBoxTelemetryOpen(false)}
                className="px-5 py-2 rounded-2xl bg-[#eaedff] text-[#131b2e] text-xs font-semibold hover:bg-[#dbe1ff] transition-colors cursor-pointer"
              >
                {isThai ? 'ปิดหน้าต่าง' : 'Dismiss'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Global CSS for airflow flow animation */}
      <style>{`
        @keyframes airflowFlow {
          from { stroke-dashoffset: 64; }
          to { stroke-dashoffset: 0; }
        }
        .airflow-pulse {
          animation: airflowFlow 1.6s linear infinite;
        }
      `}</style>
    </div>
  );
}
