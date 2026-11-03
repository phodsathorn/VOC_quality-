import { useState, useEffect } from 'react';
import {
  Download, FileText, ArrowRight, Calendar, Filter
} from 'lucide-react';
import { API } from '../config';

export default function History() {
  const [activeRange, setActiveRange] = useState('7d');
  const [dataPoints, setDataPoints] = useState([
    { date: 'Today, Oct 24', tvoc: '62 ppb', pm25: '14 µg/m³', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Yesterday, Oct 23', tvoc: '78 ppb', pm25: '18 µg/m³', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 22, 2025', tvoc: '115 ppb', pm25: '28 µg/m³', level: 'Warning', levelColor: 'bg-[#ffdbcd] text-[#943700]', dot: 'bg-[#943700]', isWarning: true },
    { date: 'Oct 21, 2025', tvoc: '54 ppb', pm25: '12 µg/m³', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 20, 2025', tvoc: '68 ppb', pm25: '15 µg/m³', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
  ]);

  function exportCSV() {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Average TVOC,Max PM2.5,Level\n"
      + dataPoints.map(e => `${e.date},${e.tvoc},${e.pm25},${e.level}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `voc_telemetry_history_${activeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
      {/* ── Top Controls: Range Toggle + Export Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Range Selector Pill Group */}
        <div className="inline-flex p-1 bg-[#f2f3ff] rounded-full shadow-xs">
          <button
            type="button"
            onClick={() => setActiveRange('today')}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-all ${
              activeRange === 'today'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setActiveRange('7d')}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-all ${
              activeRange === '7d'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            7 days
          </button>
          <button
            type="button"
            onClick={() => setActiveRange('30d')}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-all ${
              activeRange === '30d'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            30 days
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#131b2e] hover:bg-[#eaedff] transition-colors shadow-xs border border-[#e2e8f0] text-[13px] font-semibold"
          >
            <Download size={16} className="text-[#505f76]" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#131b2e] hover:bg-[#eaedff] transition-colors shadow-xs border border-[#e2e8f0] text-[13px] font-semibold"
          >
            <FileText size={16} className="text-[#505f76]" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ── Main Trend Chart Card ── */}
      <div className="relative w-full bg-white rounded-3xl p-8 shadow-sm overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-[#004ac6]/5 via-[#dbe1ff]/10 to-transparent rounded-full pointer-events-none blur-2xl" />

        {/* Card Header + Legends */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex flex-col">
            <span className="text-[13px] uppercase text-[#505f76] font-semibold tracking-wider">
              Telemetry Trend
            </span>
            <h2 className="text-[20px] font-bold text-[#131b2e] mt-0.5">
              TVOC average per day
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
              <span className="text-[12px] font-medium text-[#505f76]">Daily Avg (ppb)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#ba1a1a]" />
              <span className="text-[12px] font-medium text-[#505f76]">Threshold (100 ppb)</span>
            </div>
          </div>
        </div>

        {/* 7-Day Trend SVG Curve Canvas */}
        <div className="w-full h-72 relative">
          <svg
            aria-label="TVOC 7-day trend chart"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 760 220"
          >
            {/* Horizontal Grid lines */}
            <line stroke="#e2e8f0" strokeDasharray="3 4" strokeWidth="1" x1="40" x2="740" y1="20" y2="20" />
            <line stroke="#EF4444" strokeDasharray="4 4" strokeOpacity="0.6" strokeWidth="1.5" x1="40" x2="740" y1="70" y2="70" />
            <line stroke="#eaedff" strokeDasharray="3 4" strokeWidth="1" x1="40" x2="740" y1="120" y2="120" />
            <line stroke="#eaedff" strokeDasharray="3 4" strokeWidth="1" x1="40" x2="740" y1="170" y2="170" />

            {/* Y-Axis scale labels */}
            <text className="text-[11px] fill-[#505f76] font-mono" x="10" y="24">120</text>
            <text className="text-[11px] fill-[#ba1a1a] font-mono font-bold" x="10" y="74">100</text>
            <text className="text-[11px] fill-[#505f76] font-mono" x="10" y="124">60</text>
            <text className="text-[11px] fill-[#505f76] font-mono" x="10" y="174">20</text>

            {/* Main Trend Line Stroke */}
            <path
              d="M 60 132 C 120 126, 140 148, 173 148 C 210 148, 250 48, 286 48 C 320 48, 360 118, 400 118 C 440 118, 480 84, 513 84 C 550 84, 590 120, 626 120 C 660 120, 680 124, 720 124"
              fill="none"
              stroke="#2563eb"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />

            {/* Data Points */}
            <circle cx="60" cy="132" r="4.5" fill="white" stroke="#2563eb" strokeWidth="2.5" />
            <circle cx="173" cy="148" r="4.5" fill="white" stroke="#2563eb" strokeWidth="2.5" />
            {/* Exceeded threshold point in Red */}
            <circle cx="286" cy="48" r="5.5" fill="white" stroke="#ba1a1a" strokeWidth="3" />
            <circle cx="400" cy="118" r="4.5" fill="white" stroke="#2563eb" strokeWidth="2.5" />
            <circle cx="513" cy="84" r="4.5" fill="white" stroke="#2563eb" strokeWidth="2.5" />
            <circle cx="626" cy="120" r="4.5" fill="white" stroke="#2563eb" strokeWidth="2.5" />
            <circle cx="720" cy="124" r="4.5" fill="white" stroke="#2563eb" strokeWidth="2.5" />

            {/* X-Axis Day Labels */}
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="60" y="208">Sat</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="173" y="208">Sun</text>
            <text className="text-[12px] fill-[#ba1a1a] font-bold" textAnchor="middle" x="286" y="208">Mon</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="400" y="208">Tue</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="513" y="208">Wed</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="626" y="208">Thu</text>
            <text className="text-[12px] fill-[#004ac6] font-bold" textAnchor="middle" x="720" y="208">Today</text>
          </svg>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f2f3ff]/60 text-[#505f76] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 rounded-l-xl">Date</th>
                <th className="py-3 px-4">Average TVOC</th>
                <th className="py-3 px-4">Max PM2.5</th>
                <th className="py-3 px-4 rounded-r-xl">Level</th>
              </tr>
            </thead>
            <tbody className="text-[#131b2e] divide-y divide-[#f1f5f9]">
              {dataPoints.map((row, i) => (
                <tr key={i} className="hover:bg-[#f2f3ff]/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#131b2e]">{row.date}</td>
                  <td className={`py-3.5 px-4 tabular-nums ${row.isWarning ? 'font-bold text-[#ba1a1a]' : 'font-medium'}`}>
                    {row.tvoc}
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-[#434655] font-medium">{row.pm25}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${row.levelColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                      {row.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
