import { useState, useEffect } from 'react';
import {
  Download, BarChart2, Table, CheckCircle2, ShieldCheck,
  TrendingDown, FileText, ArrowRight, ArrowLeft, AlertTriangle,
  Calendar, ChevronDown, Check, PieChart, Layers
} from 'lucide-react';
import { API } from '../config';
import { useAuth } from '../context/AuthContext';

export default function EmissionsReport() {
  const { authHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'methodology' | 'solvents' | 'lab-reports'
  const [selectedYear, setSelectedYear] = useState('2024 (Current)');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  const handleDownload = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Solvent,Concentration_ppm,Concentration_mg_m3,Rate_kg_hr,Share_pct\n' +
      'Toluene,14.2,53.6,3.2,34%\n' +
      'Ethyl Acetate,18.5,66.8,2.8,30%\n' +
      'MEK,15.5,45.2,1.9,21%\n' +
      'Xylene,9.8,32.1,1.4,15%\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EPA_Title_V_Emissions_Q3_${selectedYear.slice(0, 4)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded EPA Title V report CSV ✓');
  };

  const solvents = [
    { name: 'Toluene', ppm: 14.2, mg: 53.6, rate: 3.2, share: 34, barColor: 'bg-[#004ac6]' },
    { name: 'Ethyl Acetate', ppm: 18.5, mg: 66.8, rate: 2.8, share: 30, barColor: 'bg-[#2563eb]' },
    { name: 'MEK', ppm: 15.5, mg: 45.2, rate: 1.9, share: 21, barColor: 'bg-[#505f76]' },
    { name: 'Xylene', ppm: 9.8, mg: 32.1, rate: 1.4, share: 15, barColor: 'bg-[#b4c5ff]' },
  ];

  const labReports = [
    {
      id: 'REP-2024-Q3-01',
      title: 'PCD Audit & Stack Method 25A Certification',
      date: 'Sep 15, 2024',
      auditor: 'Industrial Pollution Control Dept (PCD)',
      status: 'Passed / Certified',
      result: 'Total VOC: 14.2 ppm (Threshold 50 ppm)',
    },
    {
      id: 'REP-2024-Q2-04',
      title: 'Quarterly Summa Canister TO-15 GC/MS Analysis',
      date: 'Jun 20, 2024',
      auditor: 'EnviroLab Thailand Accredited',
      status: 'Passed / Certified',
      result: 'Speciated recovery: 99.4%',
    },
    {
      id: 'REP-2024-Q1-02',
      title: 'Semi-annual Carbon Bed Breakthrough Audit',
      date: 'Mar 10, 2024',
      auditor: 'Internal H&S Engineering Team',
      status: 'Compliant',
      result: 'Bed efficiency: 94.2%',
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* ── Advisory Banner matching Stitch ── */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#fff8e1] border border-[#ffe082] text-[#855700] shadow-2xs">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-[#b26a00]" />
          <span className="text-xs font-semibold leading-none">
            Notice: E-Nose does not replace certified stack CEMS
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#ffecb3] text-[#7c4a00] text-[10px] font-bold uppercase tracking-wider">
          Advisory Only
        </span>
      </div>

      {/* ── Title & Download Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold text-[#131b2e] tracking-tight">
            EPA Title V Overview
          </h1>
          <span className="text-[#505f76] text-xs">
            · Q3 Rolling Assessment
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Year selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-[#eaedff] text-[#131b2e] text-xs font-semibold shadow-2xs hover:bg-[#f2f3ff] transition-all cursor-pointer"
            >
              <Calendar size={14} className="text-[#505f76]" />
              <span>Year: {selectedYear}</span>
              <ChevronDown size={14} className="text-[#505f76]" />
            </button>
            {isYearDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#eaedff] p-1.5 z-50 text-xs min-w-[140px] animate-fade-in">
                {['2024 (Current)', '2023 (Archived)', '2022 (Archived)'].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setSelectedYear(y);
                      setIsYearDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#f2f3ff] text-[#131b2e] font-medium"
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download Report Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#004ac6] text-white text-xs font-semibold shadow-2xs hover:bg-[#003ea8] transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download size={14} />
            <span>Download report</span>
          </button>
        </div>
      </div>

      {/* ── 4 Tabs Bar matching Stitch ── */}
      <div className="flex items-center gap-1 p-1 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-[#004ac6] shadow-xs'
              : 'text-[#505f76] hover:text-[#131b2e]'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('methodology')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'methodology'
              ? 'bg-white text-[#004ac6] shadow-xs'
              : 'text-[#505f76] hover:text-[#131b2e]'
          }`}
        >
          Inputs &amp; Methodology
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('solvents')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'solvents'
              ? 'bg-white text-[#004ac6] shadow-xs'
              : 'text-[#505f76] hover:text-[#131b2e]'
          }`}
        >
          Solvent Breakdown
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lab-reports')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'lab-reports'
              ? 'bg-white text-[#004ac6] shadow-xs'
              : 'text-[#505f76] hover:text-[#131b2e]'
          }`}
        >
          Lab Reports
        </button>
      </div>

      {/* ── Tab 1: Overview matching Stitch ── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <section className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#004ac6]/5 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between w-full mb-6">
              <span className="text-xs uppercase tracking-wider text-[#505f76] font-semibold">
                Regulatory Compliance
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] text-[#004ac6] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#004ac6] animate-pulse" />
                <span>Compliant</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                  3.2
                </span>
                <span className="text-[20px] font-medium text-[#505f76]">tons / 10 ton limit</span>
              </div>
              <span className="text-xs text-[#505f76]">
                Rolling 12-month VOC total · 32% of permit limit
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#eaedff] h-2 rounded-full overflow-hidden my-2">
              <div className="bg-[#004ac6] h-full rounded-full" style={{ width: '32%' }} />
            </div>

            {/* 4 Rolling Quarter Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#eaedff]">
              <div className="p-3.5 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[11px] text-[#505f76] block font-medium">Q1 2024</span>
                <span className="text-lg font-bold text-[#131b2e] mt-1 block">0.82 tons</span>
                <span className="text-[10px] text-[#009944] font-semibold">Nominal</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[11px] text-[#505f76] block font-medium">Q2 2024</span>
                <span className="text-lg font-bold text-[#131b2e] mt-1 block">0.78 tons</span>
                <span className="text-[10px] text-[#009944] font-semibold">Nominal</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[11px] text-[#505f76] block font-medium">Q3 2024 (Active)</span>
                <span className="text-lg font-bold text-[#004ac6] mt-1 block">0.85 tons</span>
                <span className="text-[10px] text-[#004ac6] font-semibold">Active Run</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[11px] text-[#505f76] block font-medium">Q4 Projected</span>
                <span className="text-lg font-bold text-[#505f76] mt-1 block">0.75 tons</span>
                <span className="text-[10px] text-[#505f76] font-semibold">Target Safe</span>
              </div>
            </div>
          </section>

          {/* Stack Physical Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#eaedff]">
              <span className="text-xs uppercase text-[#505f76] font-semibold">Stack Velocity</span>
              <div className="text-[32px] font-bold text-[#131b2e] leading-none my-2">18.4 m/s</div>
              <span className="text-xs text-[#505f76]">Continuous Pitot Differential</span>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#eaedff]">
              <span className="text-xs uppercase text-[#505f76] font-semibold">Volumetric Flow</span>
              <div className="text-[32px] font-bold text-[#131b2e] leading-none my-2">12,400 Nm³/h</div>
              <span className="text-xs text-[#505f76]">Standardized Pressure/Temp</span>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#eaedff]">
              <span className="text-xs uppercase text-[#505f76] font-semibold">Stack Temperature</span>
              <div className="text-[32px] font-bold text-[#131b2e] leading-none my-2">42.1 °C</div>
              <span className="text-xs text-[#505f76]">Thermal Scrubber Outlet</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Inputs & Methodology matching Stitch ── */}
      {activeTab === 'methodology' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col gap-6">
          <div>
            <h3 className="text-base font-bold text-[#131b2e]">Mass Balance Calculation Model</h3>
            <p className="text-xs text-[#505f76] mt-1">
              Industrial VOC rate calculation derived from continuous pneumatic probe telemetry and EPA Method 25A standards:
            </p>
          </div>

          <div className="bg-[#f2f3ff] p-4 rounded-2xl font-mono text-xs text-[#004ac6] border border-[#eaedff] leading-relaxed">
            E = Q × C × (1 - η) × 10⁻⁶ × (M / V_m)<br />
            Where:<br />
            • E = Hourly emission rate (kg/hr)<br />
            • Q = Volumetric exhaust airflow rate (12,400 m³/h)<br />
            • C = Sensor array mean VOC concentration (ppmv)<br />
            • η = Activated carbon scrubber adsorption efficiency (92.4%)<br />
            • M = Average solvent molecular weight (92.14 g/mol)<br />
            • V_m = Standard molar volume of gas (24.45 L/mol at 25°C)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#eaedff]">
              <span className="font-semibold text-[#131b2e] block mb-1">Scrubber Control Efficiency (η)</span>
              <span className="text-2xl font-bold text-[#004ac6]">92.4%</span>
              <span className="text-[#505f76] block mt-1">Based on dual-point pitot differential and upstream/downstream MOS array.</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#eaedff]">
              <span className="font-semibold text-[#131b2e] block mb-1">Data Completeness Index</span>
              <span className="text-2xl font-bold text-[#004ac6]">99.8%</span>
              <span className="text-[#505f76] block mt-1">Exceeds EPA minimum regulatory uptime criteria (&gt;90%).</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Tab 3: Solvent Breakdown matching Stitch ── */}
      {activeTab === 'solvents' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">Speciated Solvent Emissions</h3>
              <p className="text-xs text-[#505f76] mt-1">
                Chemical decomposition from MOS array pattern recognition and historical gas chromatography ratios.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#004ac6] px-3 py-1 rounded-full bg-[#eaedff]">
              4 Compounds Tracked
            </span>
          </div>

          <div className="flex flex-col gap-5">
            {solvents.map((s) => (
              <div key={s.name} className="flex flex-col gap-2 p-4 rounded-2xl bg-[#f2f3ff]/60 border border-[#eaedff]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#131b2e] text-sm">{s.name}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#505f76]">{s.ppm} ppm</span>
                    <span className="text-[#505f76]">{s.mg} mg/m³</span>
                    <span className="font-bold text-[#004ac6]">{s.rate} kg/hr</span>
                    <span className="font-bold text-[#131b2e]">{s.share}%</span>
                  </div>
                </div>
                <div className="w-full bg-[#eaedff] h-2 rounded-full overflow-hidden">
                  <div className={`${s.barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${s.share * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Tab 4: Lab Reports matching Stitch ── */}
      {activeTab === 'lab-reports' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">Certified Third-Party Lab Audits</h3>
              <p className="text-xs text-[#505f76] mt-1">
                Official stack testing and canister audits for PCD regulatory submission.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {labReports.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#131b2e]">{r.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#00CC66]/10 text-[#009944] text-[10px] font-bold">
                      {r.status}
                    </span>
                  </div>
                  <span className="text-xs text-[#505f76]">Auditor: {r.auditor} • Date: {r.date}</span>
                  <span className="text-xs font-mono text-[#004ac6]">{r.result}</span>
                </div>
                <button
                  type="button"
                  onClick={() => showToast(`Downloading ${r.id} PDF Certificate...`)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#eaedff] text-xs font-semibold text-[#004ac6] hover:bg-[#eaedff] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  Download PDF
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

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
