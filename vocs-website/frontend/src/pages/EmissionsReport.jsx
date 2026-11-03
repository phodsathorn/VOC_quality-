import { useState, useEffect, useCallback } from 'react';
import {
  Download, BarChart2, Table, CheckCircle2, ShieldCheck,
  TrendingDown, FileText, ArrowRight, ArrowLeft
} from 'lucide-react';
import { API } from '../config';
import { useAuth } from '../context/AuthContext';

export default function EmissionsReport() {
  const { authHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('bars'); // 'bars' | 'table'
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${API}/api/reports/yearly-emissions?year=2026&stack_id=STACK-01`);
        if (res.ok) {
          const data = await res.json();
          setReportData(data);
        }
      } catch (err) {
        console.warn('Emissions load error:', err);
      }
    }
    loadData();
  }, []);

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
    link.setAttribute('download', 'EPA_Title_V_Emissions_Q3_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const solvents = [
    { name: 'Toluene', ppm: 14.2, mg: 53.6, rate: 3.2, share: 34, pct: 56.8, barColor: 'bg-[#004ac6]' },
    { name: 'Xylene', ppm: 9.8, mg: 32.1, rate: 1.4, share: 15, pct: 39.2, barColor: 'bg-[#2563eb]' },
    { name: 'Ethyl Acetate', ppm: 18.5, mg: 66.8, rate: 2.8, share: 30, pct: 74.0, barColor: 'bg-[#505f76]' },
    { name: 'MEK', ppm: 15.5, mg: 45.2, rate: 1.9, share: 21, pct: 62.0, barColor: 'bg-[#b4c5ff]' },
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-y-8 max-w-5xl mx-auto w-full py-2">
        {/* Top Header */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-semibold text-[#131b2e] tracking-tight">
              EPA Title V Overview
            </h1>
            <span className="text-[#434655] text-[14px]">· Q3 Rolling Assessment</span>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2563eb] text-white text-[14px] font-medium shadow-sm hover:opacity-95 transition-all active:scale-[0.98]"
          >
            <Download size={18} />
            <span>Download report</span>
          </button>
        </div>

        {/* Section 1: Regulatory Compliance Gauge Card */}
        <section
          className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col justify-between overflow-hidden border border-[#dae2fd]/60"
          style={{ boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02)' }}
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#dbe1ff]/20 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between w-full mb-8">
            <span className="text-[14px] uppercase text-[#434655] tracking-wider font-medium">
              Regulatory Compliance
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] text-[#131b2e] text-[12px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#004ac6] animate-pulse" />
              <span>Compliant</span>
            </div>
          </div>

          <div className="flex flex-col gap-y-2 my-4">
            <div className="flex items-baseline gap-x-4">
              <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight">
                42%
              </span>
              <span className="text-[20px] text-[#434655] font-normal">
                below legal threshold limit
              </span>
            </div>
          </div>

          <div className="w-full mt-6 pt-3">
            <div className="relative w-full h-2 rounded-full bg-[#e2e7ff] overflow-visible flex items-center">
              <div
                className="h-2 rounded-full bg-[#2563eb] transition-all duration-1000 ease-out"
                style={{ width: '58%' }}
              />
              <div
                className="absolute left-[58%] -top-1.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center -translate-x-1/2 border border-[#dae2fd]"
              >
                <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
              </div>
              <div className="absolute right-0 -top-6 flex flex-col items-end">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737686]">
                  Cap: 100 ppm
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 text-[11px] text-[#434655] font-medium">
              <span>0 ppm</span>
              <span className="text-[#004ac6] font-semibold">Current: 58 ppm</span>
              <span>100 ppm</span>
            </div>
          </div>
        </section>

        {/* Section 2: VOC Emissions by Solvent */}
        <section
          className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col overflow-hidden border border-[#dae2fd]/60"
          style={{ boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02)' }}
        >
          <div className="flex items-center justify-between w-full mb-8">
            <div className="flex items-center gap-3">
              <span className="text-[14px] uppercase text-[#434655] tracking-wider font-medium">
                VOC emissions by solvent
              </span>
              <div className="flex items-center bg-[#f2f3ff] p-0.5 rounded-lg border border-[#dae2fd]">
                <button
                  type="button"
                  onClick={() => setActiveTab('bars')}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                    activeTab === 'bars' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#434655] hover:text-[#131b2e]'
                  }`}
                >
                  Bars
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('table')}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                    activeTab === 'table' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#434655] hover:text-[#131b2e]'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
            <span className="text-[12px] text-[#434655] font-semibold">
              Limit: 25 ppm/solvent
            </span>
          </div>

          {activeTab === 'bars' ? (
            <div className="flex flex-col gap-y-6 w-full animate-fadeIn">
              {solvents.map((s) => (
                <div key={s.name} className="flex flex-col gap-y-1.5">
                  <div className="flex justify-between items-center text-[14px] font-medium text-[#131b2e]">
                    <span>{s.name}</span>
                    <span className="tabular-nums text-[#434655]">{s.ppm} ppm</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#f2f3ff] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.barColor} transition-all duration-700 ease-out`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center mt-6 pt-2 text-[11px] text-[#737686] tracking-wider uppercase font-medium">
                <span>0 ppm</span>
                <span>10 ppm</span>
                <span>20 ppm</span>
                <span>30 ppm Safe Ceiling</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col animate-fadeIn">
              <div className="overflow-hidden rounded-xl border border-[#eaedff]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f2f3ff] border-b border-[#eaedff]">
                    <tr>
                      <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-[#434655]">
                        Solvent
                      </th>
                      <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-[#434655] text-right">
                        Concentration mg/m³
                      </th>
                      <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-[#434655] text-right">
                        Rate kg/hr
                      </th>
                      <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-[#434655] text-right">
                        Share %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaedff] text-[14px] text-[#131b2e]">
                    {solvents.map((s) => (
                      <tr key={s.name} className="hover:bg-[#faf8ff] transition-colors">
                        <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${s.barColor}`} />
                          <span>{s.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#434655]">
                          {s.mg} mg/m³
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#434655]">
                          {s.rate} kg/hr
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-[#004ac6]">
                          {s.share}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4 pt-1 text-[11px] text-[#434655] font-medium">
                <span className="text-[#737686]">
                  Calculated against EPA continuous emission monitoring baseline.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('bars')}
                  className="text-[#004ac6] hover:underline inline-flex items-center gap-1 text-[12px] font-semibold"
                >
                  <ArrowLeft size={14} />
                  <span>View bar chart</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
