import { useState, useEffect } from 'react';
import {
  Wind, Activity, CheckCircle2, ArrowRight, Gauge, ShieldCheck, Filter, X,
  Radio, Cpu, ArrowDownLeft, ArrowUpRight, Thermometer, Fan
} from 'lucide-react';
import { API } from '../config';

export default function AirflowDiagram() {
  const [viewMode, setViewMode] = useState('factory'); // 'factory' (Factory ventilation) | 'sensorbox' (Sensor box pneumatic circuit)
  const [selectedStage, setSelectedStage] = useState(null);
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
  const mediaPercent = maintData?.filter?.healthIndex ? Math.round(maintData.filter.healthIndex) : 78;
  const residualVoc = reading.tvoc != null ? `${Math.round(reading.tvoc / 4)} ppb` : '14 ppb';

  const factoryStages = [
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
      name: 'Scrubber Bed',
      role: 'Activated Carbon',
      value: `${mediaPercent}%`,
      metric: 'Bed saturation',
      bgIcon: 'bg-[#d0e1fb] text-[#004ac6]',
      details: `ชุดถ่านกัมมันต์ดูดซับสารอินทรีย์ระเหยง่าย ประสิทธิภาพการดูดซับคงเหลือ ${mediaPercent}% อุณหภูมิผิวสัมผัส ${bedTemp} °C`,
    },
    {
      id: 'stack',
      name: 'Exhaust Stack',
      role: 'Atmospheric Port',
      value: residualVoc,
      metric: 'Residual VOC',
      bgIcon: 'bg-[#e2e7ff] text-[#131b2e]',
      details: `ปล่องระบายอากาศสู่ภายนอก ตรวจวัดไอสารเคมีตกค้าง ${residualVoc} (ต่ำกว่าเกณฑ์มาตรฐาน 100 ppb อย่างปลอดภัย)`,
    },
  ];

  const sensorBoxStages = [
    {
      id: 'intake',
      name: 'Intake',
      role: 'Sample Probe',
      value: '0.45 L/min',
      metric: 'Aspiration Rate',
      bgIcon: 'bg-[#dbe1ff] text-[#004ac6]',
    },
    {
      id: 'hepa',
      name: 'HEPA Pre-Filter',
      role: 'Particulate Trap',
      value: '99.8%',
      metric: 'PM Separation',
      bgIcon: 'bg-[#d3e4fe] text-[#505f76]',
    },
    {
      id: 'chamber',
      name: 'Sensor Chamber',
      role: 'Gas Cell',
      value: '4 Sensors',
      metric: 'Active Matrix',
      bgIcon: 'bg-[#dbe1ff] text-[#004ac6]',
      chips: ['MQ-135 1.2 V', 'MQ-3 0.8 V', 'PM2.5 14', 'NOx — Simulated'],
    },
    {
      id: 'mcu',
      name: 'Microcontroller',
      role: 'ESP32 Core',
      value: '100 Hz',
      metric: 'Sampling Rate',
      bgIcon: 'bg-[#d3e4fe] text-[#505f76]',
    },
    {
      id: 'exhaust',
      name: 'Exhaust',
      role: 'Micro Vent',
      value: 'Passive',
      metric: 'Discharge',
      bgIcon: 'bg-[#e2e7ff] text-[#131b2e]',
    },
  ];

  // Telemetry drawer probes matching screenshots 1 & 5
  const probeRows = [
    { id: 'MQ-135', loc: 'Booth Inflow', val: '48 ppb', thresh: '100 ppb', status: 'Normal' },
    { id: 'MQ-137', loc: 'Vent Exhaust', val: '32 ppb', thresh: '80 ppb', status: 'Normal' },
    { id: 'PID', loc: 'Primary Chamber', val: '64 ppb', thresh: '120 ppb', status: 'Normal' },
    { id: 'SGP40', loc: 'Curing Zone', val: '18 ppb', thresh: '50 ppb', status: 'Normal' },
    { id: 'TGS2602', loc: 'Recirculation Line', val: '55 ppb', thresh: '90 ppb', status: 'Normal' },
  ];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
      {/* ── Header with Mode Toggle matching Stitch ── */}
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

        <div className="flex items-center gap-3">
          {/* Toggle pill matching Stitch */}
          <div className="inline-flex items-center bg-[#f2f3ff] p-1 rounded-full shadow-2xs border border-[#eaedff]">
            <button
              type="button"
              onClick={() => setViewMode('factory')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'factory'
                  ? 'bg-[#004ac6] text-white shadow-xs'
                  : 'text-[#505f76] hover:text-[#131b2e]'
              }`}
            >
              Factory ventilation
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sensorbox')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'sensorbox'
                  ? 'bg-[#004ac6] text-white shadow-xs'
                  : 'text-[#505f76] hover:text-[#131b2e]'
              }`}
            >
              Sensor box
            </button>
          </div>

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

      {/* ── Mode 1: Factory Ventilation View ── */}
      {viewMode === 'factory' && (
        <>
          <div className="relative bg-white rounded-3xl p-8 shadow-sm overflow-hidden border border-[#eaedff]">
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
                {factoryStages.map((stage) => (
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
                onClick={() => setSelectedStage(factoryStages[2])}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#004ac6] hover:underline cursor-pointer"
              >
                <span>Aero-pathway telemetry logs</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* 3 Metric Cards for Factory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#eaedff]">
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
                  onClick={() => setSelectedStage(factoryStages[2])}
                  className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  View details →
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#eaedff]">
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
                  onClick={() => setSelectedStage(factoryStages[1])}
                  className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  View details →
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#eaedff]">
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
                    {bedTemp}
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
                  onClick={() => setSelectedStage(factoryStages[2])}
                  className="text-[13px] font-bold text-[#004ac6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  View details →
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Mode 2: Sensor Box View matching Stitch airflow_sensor_box_telemetry ── */}
      {viewMode === 'sensorbox' && (
        <>
          <div className="relative bg-white rounded-3xl p-8 shadow-sm overflow-hidden border border-[#eaedff]">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#004ac6]/5 rounded-full blur-3xl pointer-events-none" />

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
                        {stage.value}
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
                  <line stroke="#2563eb" strokeDasharray="14 18" strokeLinecap="round" strokeWidth="3" x1="100" x2="900" y1="16" y2="16" />
                  <circle cx="290" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#2563eb" points="298,16 292,13 292,19" />
                  <circle cx="490" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#2563eb" points="498,16 492,13 492,19" />
                  <circle cx="690" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#2563eb" points="698,16 692,13 692,19" />
                  <circle cx="890" cy="16" fill="#2563eb" r="4" />
                  <polygon fill="#2563eb" points="898,16 892,13 892,19" />
                </svg>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSensorBoxTelemetryOpen(true)}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#004ac6] hover:underline cursor-pointer"
              >
                <span>Sensor box live telemetry drawer</span>
                <ArrowRight size={16} />
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[11px] font-bold text-[#004ac6]">
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[11px] font-bold text-[#004ac6]">
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[11px] font-bold text-[#004ac6]">
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

      {/* ── Sub-State Right-side Drawer: Live sensor telemetry matching User Screenshots 1 & 5 ── */}
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
                    Live sensor telemetry
                  </h2>
                  <span className="text-[11px] text-[#505f76]">
                    Powder Coating Booth 1 • 5 Active Probes
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
                  Real-time probe readings
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-[#00AA55] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#00CC66] animate-pulse" />
                  All systems nominal
                </div>
              </div>

              {/* Probe Table matching Stitch exactly */}
              <div className="border border-[#eaedff] rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#f2f3ff] border-b border-[#eaedff] text-[#505f76] font-medium text-xs">
                      <th className="py-2.5 px-4">Sensor ID</th>
                      <th className="py-2.5 px-4">Location</th>
                      <th className="py-2.5 px-4 text-right">Value</th>
                      <th className="py-2.5 px-4 text-right">Threshold</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                    {probeRows.map((p) => (
                      <tr key={p.id} className="hover:bg-[#eaedff]/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#004ac6]">{p.id}</td>
                        <td className="py-3 px-4 text-[#505f76] text-xs">{p.loc}</td>
                        <td className="py-3 px-4 text-right font-medium">{p.val}</td>
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
                  <span className="text-xs font-semibold text-[#131b2e]">Sampling Rate</span>
                  <span className="text-xs text-[#505f76] font-medium">2.5 Hz (Continuous)</span>
                </div>
                <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#004ac6] h-full rounded-full w-full" />
                </div>
                <p className="text-[11px] text-[#505f76] mt-2">
                  Latest synchronization occurred 3 seconds ago via Modbus TCP gateway.
                </p>
              </div>
            </div>

            {/* Footer matching Screenshots 1 & 5 */}
            <div className="p-6 border-t border-[#eaedff] bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-[#505f76]">
                Array ID: <strong className="font-mono text-[#131b2e]">BOX-001</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsSensorBoxTelemetryOpen(false)}
                className="px-5 py-2 rounded-2xl bg-[#eaedff] text-[#131b2e] text-xs font-semibold hover:bg-[#dbe1ff] transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Sub-State Carbon Scrubber Telemetry Drawer ── */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#131b2e]/20 backdrop-blur-[2px] transition-opacity">
          <div className="w-full max-w-[440px] h-full bg-white shadow-2xl flex flex-col justify-between border-l border-[#eaedff] animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-[#eaedff] flex items-start justify-between bg-[#faf8ff]/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#d0e1fb] flex items-center justify-center text-[#004ac6] mt-0.5">
                  <Filter size={22} />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#131b2e] leading-tight">
                    Carbon Scrubber Telemetry
                  </h3>
                  <span className="text-[12px] text-[#505f76] mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#004ac6] inline-block" />
                    Adsorption Bed Line 01 • Real-time
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="w-9 h-9 rounded-full hover:bg-[#f2f3ff] flex items-center justify-center text-[#505f76] hover:text-[#131b2e] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-around gap-6 my-2">
              <div className="flex flex-col p-5 rounded-2xl bg-[#f2f3ff]/60 hover:bg-[#f2f3ff] transition-colors border border-[#eaedff]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#505f76] mb-1">
                  Differential Pressure
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[44px] font-bold text-[#131b2e] leading-none tabular-nums">
                    312
                  </span>
                  <span className="text-[16px] text-[#505f76] font-medium">Pa</span>
                </div>
                <span className="text-[12px] text-[#505f76] mt-2">
                  Pressure drop across Stage 2 activated carbon bed. Normal range: 250 - 450 Pa.
                </span>
              </div>

              <div className="flex flex-col p-5 rounded-2xl bg-[#f2f3ff]/60 hover:bg-[#f2f3ff] transition-colors border border-[#eaedff]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#505f76] mb-1">
                  Bed Temperature
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[44px] font-bold text-[#131b2e] leading-none tabular-nums">
                    {bedTemp}
                  </span>
                  <span className="text-[16px] text-[#505f76] font-medium">°C</span>
                </div>
                <span className="text-[12px] text-[#505f76] mt-2">
                  Thermal stabilization within optimal adsorption envelope. Threshold: 45.0 °C.
                </span>
              </div>

              <div className="flex flex-col p-5 rounded-2xl bg-[#f2f3ff]/60 hover:bg-[#f2f3ff] transition-colors border border-[#eaedff]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#505f76] mb-1">
                  Media Life Remaining
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[44px] font-bold text-[#004ac6] leading-none tabular-nums">
                    {mediaPercent}%
                  </span>
                  <span className="text-[14px] text-[#505f76] font-medium">(~{Math.round(mediaPercent * 5.4)} hrs)</span>
                </div>
                <span className="text-[12px] text-[#505f76] mt-2">
                  Pelletized virgin coconut shell carbon bed. Real-time adsorption index.
                </span>
              </div>
            </div>

            <div className="p-6 border-t border-[#eaedff] flex items-center justify-between bg-white">
              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="w-full py-2.5 rounded-2xl bg-[#004ac6] text-white hover:bg-[#003ea8] transition-colors text-[13px] font-semibold cursor-pointer text-center"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
