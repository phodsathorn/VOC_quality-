import { useState } from 'react';
import {
  Download, FileText, ArrowRight, ArrowLeft, Calendar, Filter, X,
  Clock, ChevronDown, Check, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function History() {
  const [activeRange, setActiveRange] = useState('7d');
  const [isFullTable, setIsFullTable] = useState(false);
  const [isCustomPopoverOpen, setIsCustomPopoverOpen] = useState(false);
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
  const [intervalOption, setIntervalOption] = useState('1 hour');
  const [customRangeText, setCustomRangeText] = useState('Oct 18 – Oct 24, 2025');
  const [toastMsg, setToastMsg] = useState(null);

  // Column selection for export
  const [exportCols, setExportCols] = useState({
    timestamp: true,
    tvoc: true,
    pm25: true,
    temp_rh: true,
    mq_sensors: true,
    status: true,
  });

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  const dataPoints = [
    { date: 'Today, Oct 24', min: '28 ppb', max: '84 ppb', avg: '62 ppb', pm25: '14 µg/m³', mq3: '0.8 V', mq2: '1.1 V', mq135: '1.2 V', uptime: '99.8%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Yesterday, Oct 23', min: '34 ppb', max: '98 ppb', avg: '78 ppb', pm25: '18 µg/m³', mq3: '0.9 V', mq2: '1.2 V', mq135: '1.4 V', uptime: '100.0%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 22, 2025', min: '45 ppb', max: '142 ppb', avg: '115 ppb', pm25: '28 µg/m³', mq3: '1.8 V', mq2: '2.1 V', mq135: '2.4 V', uptime: '98.2%', level: 'Warning', levelColor: 'bg-[#ffdbcd] text-[#943700]', dot: 'bg-[#943700]', isWarning: true },
    { date: 'Oct 21, 2025', min: '18 ppb', max: '72 ppb', avg: '54 ppb', pm25: '12 µg/m³', mq3: '0.7 V', mq2: '0.9 V', mq135: '1.1 V', uptime: '100.0%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 20, 2025', min: '37 ppb', max: '91 ppb', avg: '68 ppb', pm25: '15 µg/m³', mq3: '0.8 V', mq2: '1.0 V', mq135: '1.3 V', uptime: '99.5%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 19, 2025', min: '22 ppb', max: '64 ppb', avg: '42 ppb', pm25: '10 µg/m³', mq3: '0.6 V', mq2: '0.8 V', mq135: '1.0 V', uptime: '100.0%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { date: 'Oct 18, 2025', min: '25 ppb', max: '71 ppb', avg: '49 ppb', pm25: '11 µg/m³', mq3: '0.7 V', mq2: '0.9 V', mq135: '1.1 V', uptime: '99.1%', level: 'Normal', levelColor: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
  ];

  function exportCSV() {
    setIsExportPopoverOpen(false);
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Min_TVOC,Max_TVOC,Average_TVOC,PM25,MQ3,MQ2,MQ135,Uptime,Level\n"
      + dataPoints.map(e => `${e.date},${e.min},${e.max},${e.avg},${e.pm25},${e.mq3},${e.mq2},${e.mq135},${e.uptime},${e.level}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `voc_telemetry_history_${activeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file with selected columns ✓');
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
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-6">
      {/* ── Top Controls: Range Toggle + Interval + Export Popover matching Stitch ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Range Selector Pill Group */}
          <div className="relative inline-flex p-1 bg-[#f2f3ff] rounded-full shadow-2xs border border-[#eaedff]">
            <button
              type="button"
              onClick={() => handleSelectRange('today')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeRange === 'custom'
                  ? 'bg-white text-[#004ac6] shadow-xs'
                  : 'text-[#505f76] hover:text-[#131b2e]'
              }`}
            >
              <span>Custom</span>
              <Calendar size={14} />
            </button>

            {/* Custom Date Popover matching Stitch sub-state */}
            {isCustomPopoverOpen && (
              <div className="absolute top-12 left-0 z-50 w-80 bg-white rounded-2xl p-4 shadow-xl border border-[#eaedff] flex flex-col gap-3 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#eaedff]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#505f76]">Date Range</span>
                    <span className="text-xs font-bold text-[#131b2e]">{customRangeText}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomPopoverOpen(false)}
                    className="p-1 rounded-full text-[#505f76] hover:bg-[#f2f3ff]"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="text-xs text-[#505f76] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#131b2e]">October 2025</span>
                    <div className="flex items-center gap-1">
                      <button type="button" className="p-1 rounded hover:bg-[#f2f3ff]"><ChevronLeft size={16} /></button>
                      <button type="button" className="p-1 rounded hover:bg-[#f2f3ff]"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px]">
                    <span className="text-[#505f76]">Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    <span className="text-[#c3c6d7]">28</span><span className="text-[#c3c6d7]">29</span><span className="text-[#c3c6d7]">30</span><span>1</span><span>2</span><span>3</span><span>4</span>
                    <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span>
                    <span>12</span><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span>
                    <span className="bg-[#004ac6] text-white rounded-full font-bold">18</span>
                    <span className="bg-[#e2e7ff] text-[#004ac6]">19</span>
                    <span className="bg-[#e2e7ff] text-[#004ac6]">20</span>
                    <span className="bg-[#e2e7ff] text-[#004ac6]">21</span>
                    <span className="bg-[#e2e7ff] text-[#004ac6]">22</span>
                    <span className="bg-[#e2e7ff] text-[#004ac6]">23</span>
                    <span className="bg-[#004ac6] text-white rounded-full font-bold">24</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPopoverOpen(false);
                    showToast('Applied date range: Oct 18 – Oct 24, 2025');
                  }}
                  className="w-full py-2 bg-[#004ac6] text-white rounded-xl text-xs font-semibold hover:bg-[#003ea8] transition-colors"
                >
                  Apply Range
                </button>
              </div>
            )}
          </div>

          {/* Interval selector */}
          <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full shadow-2xs border border-[#eaedff] text-xs">
            <Clock size={14} className="text-[#505f76]" />
            <span className="text-[#505f76]">Interval:</span>
            <select
              value={intervalOption}
              onChange={(e) => setIntervalOption(e.target.value)}
              className="font-bold text-[#004ac6] bg-transparent outline-none cursor-pointer"
            >
              <option value="15 min">15 min</option>
              <option value="1 hour">1 hour</option>
              <option value="1 day">1 day</option>
            </select>
          </div>
        </div>

        {/* Export CSV with Column Popover matching Stitch */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportPopoverOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#131b2e] hover:bg-[#f2f3ff] transition-colors shadow-2xs border border-[#eaedff] text-xs font-semibold cursor-pointer"
          >
            <Download size={14} className="text-[#505f76]" />
            <span>Export CSV</span>
            <ChevronDown size={14} className="text-[#505f76]" />
          </button>

          {isExportPopoverOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl p-4 shadow-xl border border-[#eaedff] z-50 animate-fade-in flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#eaedff]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">Columns Included</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f2f3ff] text-[#004ac6] font-bold">6 selected</span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-[#131b2e]">
                {Object.keys(exportCols).map((k) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={exportCols[k]}
                      onChange={(e) => setExportCols({ ...exportCols, [k]: e.target.checked })}
                      className="rounded text-[#004ac6] focus:ring-0"
                    />
                    <span className="capitalize">{k.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={exportCSV}
                className="w-full mt-1 py-2 bg-[#004ac6] text-white rounded-xl text-xs font-semibold hover:bg-[#003ea8] transition-colors"
              >
                Download CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Trend Chart Card matching Stitch ── */}
      <div className="relative w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xs overflow-hidden border border-[#eaedff]">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-[#004ac6]/5 via-[#dbe1ff]/10 to-transparent rounded-full pointer-events-none blur-2xl" />

        {/* Card Header + Legends */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex flex-col">
            <span className="text-[12px] uppercase text-[#505f76] font-semibold tracking-wider">
              Telemetry Trend
            </span>
            <h2 className="text-[20px] font-bold text-[#131b2e] mt-0.5">
              TVOC average per day
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]" />
              <span className="text-xs font-medium text-[#505f76]">Daily Avg (ppb)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#ba1a1a]" />
              <span className="text-xs font-medium text-[#ba1a1a]">Threshold (100 ppb)</span>
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
            <line stroke="#eaedff" strokeDasharray="3 4" strokeWidth="1" x1="40" x2="740" y1="20" y2="20" />
            <line stroke="#EF4444" strokeDasharray="4 4" strokeOpacity="0.6" strokeWidth="1.5" x1="40" x2="740" y1="70" y2="70" />
            <line stroke="#eaedff" strokeDasharray="3 4" strokeWidth="1" x1="40" x2="740" y1="120" y2="120" />
            <line stroke="#eaedff" strokeDasharray="3 4" strokeWidth="1" x1="40" x2="740" y1="170" y2="170" />

            <text className="text-[11px] fill-[#505f76] font-mono" x="10" y="24">120</text>
            <text className="text-[11px] fill-[#ba1a1a] font-mono font-bold" x="10" y="74">100</text>
            <text className="text-[11px] fill-[#505f76] font-mono" x="10" y="124">60</text>
            <text className="text-[11px] fill-[#505f76] font-mono" x="10" y="174">20</text>

            <path
              d="M 60 132 C 120 126, 140 148, 173 148 C 210 148, 250 48, 286 48 C 320 48, 360 118, 400 118 C 440 118, 480 84, 513 84 C 550 84, 590 120, 626 120 C 660 120, 680 124, 720 124"
              fill="none"
              stroke="#004ac6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />

            <circle cx="60" cy="132" r="4.5" fill="white" stroke="#004ac6" strokeWidth="2.5" />
            <circle cx="173" cy="148" r="4.5" fill="white" stroke="#004ac6" strokeWidth="2.5" />
            <circle cx="286" cy="48" r="5.5" fill="white" stroke="#ba1a1a" strokeWidth="3" />
            <circle cx="400" cy="118" r="4.5" fill="white" stroke="#004ac6" strokeWidth="2.5" />
            <circle cx="513" cy="84" r="4.5" fill="white" stroke="#004ac6" strokeWidth="2.5" />
            <circle cx="626" cy="120" r="4.5" fill="white" stroke="#004ac6" strokeWidth="2.5" />
            <circle cx="720" cy="124" r="4.5" fill="white" stroke="#004ac6" strokeWidth="2.5" />

            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="60" y="208">Sat</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="173" y="208">Sun</text>
            <text className="text-[12px] fill-[#ba1a1a] font-bold" textAnchor="middle" x="286" y="208">Mon (Spike)</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="400" y="208">Tue</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="513" y="208">Wed</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="626" y="208">Thu</text>
            <text className="text-[12px] fill-[#004ac6] font-bold" textAnchor="middle" x="720" y="208">Today</text>
          </svg>
        </div>
      </div>

      {/* ── Table Card: Summary View vs Full Expanded View ── */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xs overflow-hidden border border-[#eaedff]">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-base font-bold text-[#131b2e]">
            {isFullTable ? 'Complete Sensor Telemetry Log' : 'Daily Summary Breakdown'}
          </h3>
          <button
            type="button"
            onClick={() => setIsFullTable(!isFullTable)}
            className="text-xs font-semibold text-[#004ac6] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{isFullTable ? 'Collapse view' : 'Expand full sensor matrix'}</span>
            <ArrowRight size={14} className={`transition-transform ${isFullTable ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f2f3ff] text-[#505f76] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-2xl">Date</th>
                <th className="py-3 px-4">Avg TVOC</th>
                <th className="py-3 px-4">Max TVOC</th>
                <th className="py-3 px-4">PM2.5</th>
                {isFullTable && (
                  <>
                    <th className="py-3 px-4">MQ-3</th>
                    <th className="py-3 px-4">MQ-2</th>
                    <th className="py-3 px-4">MQ-135</th>
                  </>
                )}
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4 text-right rounded-r-2xl">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
              {dataPoints.map((row, i) => (
                <tr key={i} className="hover:bg-[#f2f3ff]/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold">{row.date}</td>
                  <td className={`py-3.5 px-4 tabular-nums ${row.isWarning ? 'font-bold text-[#ba1a1a]' : 'font-medium'}`}>{row.avg}</td>
                  <td className="py-3.5 px-4 tabular-nums text-[#505f76]">{row.max}</td>
                  <td className="py-3.5 px-4 tabular-nums text-[#505f76]">{row.pm25}</td>
                  {isFullTable && (
                    <>
                      <td className="py-3.5 px-4 font-mono text-[#505f76]">{row.mq3}</td>
                      <td className="py-3.5 px-4 font-mono text-[#505f76]">{row.mq2}</td>
                      <td className="py-3.5 px-4 font-mono text-[#505f76]">{row.mq135}</td>
                    </>
                  )}
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${row.levelColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                      {row.level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium">{row.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
