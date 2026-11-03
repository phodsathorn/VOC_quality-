import { useState } from 'react';
import {
  Download, FileText, ArrowRight, ArrowLeft, Calendar, Filter, X
} from 'lucide-react';

export default function History() {
  const [activeRange, setActiveRange] = useState('7d');
  const [isFullTable, setIsFullTable] = useState(false);
  const [isCustomPopoverOpen, setIsCustomPopoverOpen] = useState(false);
  const [customStart, setCustomStart] = useState('2025-10-18');
  const [customEnd, setCustomEnd] = useState('2025-10-24');

  const dataPoints = [
    { date: 'Today, Oct 24', min: '28 ppb', max: '84 ppb', avg: '62 ppb', pm25: '14 µg/m³', uptime: '99.8%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Yesterday, Oct 23', min: '34 ppb', max: '98 ppb', avg: '78 ppb', pm25: '18 µg/m³', uptime: '100.0%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 22, 2025', min: '45 ppb', max: '142 ppb', avg: '115 ppb', pm25: '28 µg/m³', uptime: '98.2%', level: 'Warning', levelColor: 'bg-[#ffdbcd] text-[#943700]', dot: 'bg-[#943700]', isWarning: true },
    { date: 'Oct 21, 2025', min: '18 ppb', max: '72 ppb', avg: '54 ppb', pm25: '12 µg/m³', uptime: '100.0%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 20, 2025', min: '37 ppb', max: '91 ppb', avg: '68 ppb', pm25: '15 µg/m³', uptime: '99.5%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 19, 2025', min: '22 ppb', max: '64 ppb', avg: '42 ppb', pm25: '10 µg/m³', uptime: '100.0%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 18, 2025', min: '25 ppb', max: '71 ppb', avg: '49 ppb', pm25: '11 µg/m³', uptime: '99.1%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
  ];

  function exportCSV() {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Min TVOC,Max TVOC,Average TVOC,Max PM2.5,Uptime,Level\n"
      + dataPoints.map(e => `${e.date},${e.min},${e.max},${e.avg},${e.pm25},${e.uptime},${e.level}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `voc_telemetry_history_${activeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleSelectRange(mode) {
    setActiveRange(mode);
    if (mode === 'custom') {
      setIsCustomPopoverOpen(true);
    } else {
      setIsCustomPopoverOpen(false);
    }
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
      {/* ── Top Controls: Range Toggle + Export Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Range Selector Pill Group */}
        <div className="relative inline-flex p-1 bg-[#f2f3ff] rounded-full shadow-xs border border-[#eaedff]">
          <button
            type="button"
            onClick={() => handleSelectRange('today')}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
              activeRange === 'today'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleSelectRange('7d')}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
              activeRange === '7d'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            7 days
          </button>
          <button
            type="button"
            onClick={() => handleSelectRange('30d')}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
              activeRange === '30d'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            30 days
          </button>
          <button
            type="button"
            onClick={() => handleSelectRange('custom')}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
              activeRange === 'custom'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            Custom
          </button>

          {/* Custom Date Range Popover */}
          {isCustomPopoverOpen && (
            <div className="absolute top-12 left-0 z-50 p-4 bg-white rounded-2xl shadow-xl border border-[#eaedff] flex flex-col gap-3 min-w-[280px] animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#131b2e]">Select Date Range</span>
                <button
                  type="button"
                  onClick={() => setIsCustomPopoverOpen(false)}
                  className="p-1 rounded-full text-[#505f76] hover:bg-[#f2f3ff]"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#505f76] font-semibold">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#eaedff] text-[13px] text-[#131b2e] bg-[#f2f3ff] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#505f76] font-semibold">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#eaedff] text-[13px] text-[#131b2e] bg-[#f2f3ff] outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsCustomPopoverOpen(false)}
                className="mt-1 w-full py-2 bg-[#004ac6] text-white rounded-xl text-[12px] font-semibold hover:bg-[#2563eb]"
              >
                Apply Range
              </button>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#131b2e] hover:bg-[#eaedff] transition-colors shadow-xs border border-[#e2e8f0] text-[13px] font-semibold cursor-pointer"
          >
            <Download size={16} className="text-[#505f76]" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#131b2e] hover:bg-[#eaedff] transition-colors shadow-xs border border-[#e2e8f0] text-[13px] font-semibold cursor-pointer"
          >
            <FileText size={16} className="text-[#505f76]" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ── Main Trend Chart Card ── */}
      <div className="relative w-full bg-white rounded-3xl p-8 shadow-sm overflow-hidden border border-[#eaedff]">
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
              <span className="text-[12px] font-medium text-[#ba1a1a]">Threshold (100 ppb)</span>
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

      {/* ── Table Card: Summary View vs Full Expanded View ── */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-sm overflow-hidden border border-[#eaedff]">
        {!isFullTable ? (
          /* Summary Table View */
          <div className="flex flex-col animate-fadeIn">
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
                  {dataPoints.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-[#f2f3ff]/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#131b2e]">{row.date}</td>
                      <td className={`py-3.5 px-4 tabular-nums ${row.isWarning ? 'font-bold text-[#ba1a1a]' : 'font-medium'}`}>
                        {row.avg}
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

            <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
              <span className="text-[12px] text-[#505f76]">Showing 5 of 7 records</span>
              <button
                type="button"
                onClick={() => setIsFullTable(true)}
                className="inline-flex items-center gap-1.5 text-[#004ac6] hover:text-[#131b2e] font-semibold text-[13px] transition-colors cursor-pointer"
              >
                <span>Expand telemetry view</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Full Expanded Telemetry Table View */
          <div className="flex flex-col animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f2f3ff]/60 text-[#505f76] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 rounded-l-xl">Date</th>
                    <th className="py-3 px-4">Min TVOC</th>
                    <th className="py-3 px-4">Max TVOC</th>
                    <th className="py-3 px-4">Avg TVOC</th>
                    <th className="py-3 px-4">PM2.5</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 rounded-r-xl">Uptime</th>
                  </tr>
                </thead>
                <tbody className="text-[#131b2e] divide-y divide-[#f1f5f9]">
                  {dataPoints.map((row, i) => (
                    <tr key={i} className="hover:bg-[#f2f3ff]/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#131b2e]">{row.date}</td>
                      <td className="py-3.5 px-4 tabular-nums text-[#505f76]">{row.min}</td>
                      <td className="py-3.5 px-4 tabular-nums text-[#505f76]">{row.max}</td>
                      <td className={`py-3.5 px-4 tabular-nums font-semibold ${row.isWarning ? 'text-[#ba1a1a]' : 'text-[#131b2e]'}`}>
                        {row.avg}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-[#505f76]">{row.pm25}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${row.levelColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                          {row.level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] text-[#131b2e] tabular-nums">
                        {row.uptime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
              <span className="text-[12px] text-[#505f76]">Showing all 7 days for current date range</span>
              <button
                type="button"
                onClick={() => setIsFullTable(false)}
                className="inline-flex items-center gap-1.5 text-[#004ac6] hover:text-[#131b2e] font-semibold text-[13px] transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Collapse to summary view</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
