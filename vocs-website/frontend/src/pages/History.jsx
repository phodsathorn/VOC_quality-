import { useState } from 'react';
import {
  Download, FileText, ArrowRight, ArrowLeft, Calendar, Filter, X,
  Clock, ChevronDown, Check, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function History() {
  const { t, isThai } = useLanguage();
  const [activeRange, setActiveRange] = useState('7d');
  const [isFullTable, setIsFullTable] = useState(false);
  const [isCustomPopoverOpen, setIsCustomPopoverOpen] = useState(false);
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
  const [showThreshold, setShowThreshold] = useState(true);
  const [intervalOption, setIntervalOption] = useState('1 hour');
  const [customRangeText, setCustomRangeText] = useState('Oct 18 – Oct 24, 2025');
  const [selectedMetrics, setSelectedMetrics] = useState({
    tvoc: true,
    pm25: true,
    eco2: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [calMonthOffset, setCalMonthOffset] = useState(0);
  const [toastMsg, setToastMsg] = useState(null);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  const dataPoints = [
    {
      date: 'Today, Oct 24',
      dateTh: 'วันนี้, 24 ต.ค.',
      min: '34 ppb',
      max: '89 ppb',
      avg: '62 ppb',
      pm25: '14 µg/m³',
      level: 'Normal',
      levelTh: 'ปกติ',
      levelColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      dot: 'bg-emerald-500',
      coverage: '99.8%',
      p95: '85 ppb',
      samples: '1,440',
    },
    {
      date: 'Yesterday, Oct 23',
      dateTh: 'เมื่อวาน, 23 ต.ค.',
      min: '41 ppb',
      max: '96 ppb',
      avg: '78 ppb',
      pm25: '18 µg/m³',
      level: 'Normal',
      levelTh: 'ปกติ',
      levelColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      dot: 'bg-emerald-500',
      coverage: '100.0%',
      p95: '92 ppb',
      samples: '1,440',
    },
    {
      date: 'Oct 22, 2025',
      dateTh: '22 ต.ค. 2025',
      min: '58 ppb',
      max: '148 ppb',
      avg: '115 ppb',
      pm25: '28 µg/m³',
      level: 'Warning',
      levelTh: 'เฝ้าระวัง',
      levelColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
      dot: 'bg-amber-500',
      coverage: '98.4%',
      p95: '138 ppb',
      samples: '1,410',
      isWarning: true,
    },
    {
      date: 'Oct 21, 2025',
      dateTh: '21 ต.ค. 2025',
      min: '29 ppb',
      max: '82 ppb',
      avg: '54 ppb',
      pm25: '12 µg/m³',
      level: 'Normal',
      levelTh: 'ปกติ',
      levelColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      dot: 'bg-emerald-500',
      coverage: '100.0%',
      p95: '72 ppb',
      samples: '1,440',
    },
    {
      date: 'Oct 20, 2025',
      dateTh: '20 ต.ค. 2025',
      min: '37 ppb',
      max: '91 ppb',
      avg: '68 ppb',
      pm25: '15 µg/m³',
      level: 'Normal',
      levelTh: 'ปกติ',
      levelColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      dot: 'bg-emerald-500',
      coverage: '99.5%',
      p95: '81 ppb',
      samples: '1,432',
    },
  ];

  function exportCSV() {
    setIsExportPopoverOpen(false);
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Min_TVOC,Max_TVOC,Avg_TVOC,Max_PM25,Level,Coverage,P95,Samples\n"
      + dataPoints.map(e => `${e.date},${e.min},${e.max},${e.avg},${e.pm25},${e.level},${e.coverage},${e.p95},${e.samples}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `voc_telemetry_history_${activeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isThai ? 'ส่งออกไฟล์ CSV เรียบร้อยแล้ว ✓' : 'Exported CSV file with selected columns ✓');
  }

  function handleSelectRange(mode) {
    setActiveRange(mode);
    if (mode === 'custom') {
      setIsCustomPopoverOpen(true);
    } else {
      setIsCustomPopoverOpen(false);
    }
  }

  const selectedMetricsCount = Object.values(selectedMetrics).filter(Boolean).length;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-6 select-none">
      {/* ── Top Controls: Range Toggle + Interval + Export Popover matching Stitch ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Range Selector Pill Group */}
          <div className="relative inline-flex p-1 bg-[#eaedff] rounded-full shadow-2xs border border-[#dae2fd]">
            <button
              type="button"
              onClick={() => handleSelectRange('today')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeRange === 'today'
                  ? 'bg-white text-[#004ac6] shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              {isThai ? 'วันนี้' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => handleSelectRange('7d')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeRange === '7d'
                  ? 'bg-white text-[#004ac6] shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              {isThai ? '7 วัน' : '7 days'}
            </button>
            <button
              type="button"
              onClick={() => handleSelectRange('30d')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeRange === '30d'
                  ? 'bg-white text-[#004ac6] shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              {isThai ? '30 วัน' : '30 days'}
            </button>
            <button
              type="button"
              onClick={() => handleSelectRange('custom')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRange === 'custom'
                  ? 'bg-white text-[#004ac6] shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              <span>{isThai ? 'กำหนดเอง' : 'Custom'}</span>
              <Calendar size={14} />
            </button>

            {/* Custom Date Popover matching Stitch sub-state */}
            {isCustomPopoverOpen && (
              <div className="absolute top-12 left-0 z-50 w-80 bg-white rounded-2xl p-4 shadow-xl border border-[#eaedff] flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#eaedff]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#505f76]">
                      {isThai ? 'ช่วงวันที่' : 'Date Range'}
                    </span>
                    <span className="text-xs font-bold text-[#131b2e]">{customRangeText}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomPopoverOpen(false)}
                    className="p-1 rounded-full text-[#505f76] hover:bg-[#eaedff] transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="text-xs text-[#505f76] flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-semibold text-[#131b2e]">
                      {calMonthOffset === -1 ? (isThai ? 'กันยายน 2568' : 'September 2025') :
                       calMonthOffset === 1 ? (isThai ? 'พฤศจิกายน 2568' : 'November 2025') :
                       (isThai ? 'ตุลาคม 2568' : 'October 2025')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalMonthOffset(p => Math.max(-1, p - 1))}
                        disabled={calMonthOffset <= -1}
                        className="p-1 rounded-full hover:bg-[#eaedff] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Previous month"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalMonthOffset(p => Math.min(1, p + 1))}
                        disabled={calMonthOffset >= 1}
                        className="p-1 rounded-full hover:bg-[#eaedff] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Next month"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px]">
                    <span className="text-[#505f76]">Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    <span className="text-[#c3c6d7]">28</span><span className="text-[#c3c6d7]">29</span><span className="text-[#c3c6d7]">30</span><span>1</span><span>2</span><span>3</span><span>4</span>
                    <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span>
                    <span>12</span><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span>
                    <span className="bg-[#004ac6] text-white rounded-l-full font-bold shadow-xs">18</span>
                    <span className="bg-[#eaedff] text-[#004ac6]">19</span>
                    <span className="bg-[#eaedff] text-[#004ac6]">20</span>
                    <span className="bg-[#eaedff] text-[#004ac6]">21</span>
                    <span className="bg-[#eaedff] text-[#004ac6]">22</span>
                    <span className="bg-[#eaedff] text-[#004ac6]">23</span>
                    <span className="bg-[#004ac6] text-white rounded-r-full font-bold shadow-xs">24</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#eaedff]">
                  <span className="text-[11px] text-[#505f76]">{isThai ? 'เลือก 7 วัน' : '7 days selected'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomPopoverOpen(false)}
                      className="px-3 py-1 rounded-full text-[#505f76] hover:text-[#131b2e] text-[12px] font-medium transition-colors cursor-pointer"
                    >
                      {isThai ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPopoverOpen(false);
                        showToast(isThai ? 'ปรับใช้ช่วงวันที่: 18 - 24 ต.ค. 2025' : 'Applied date range: Oct 18 – Oct 24, 2025');
                      }}
                      className="px-3.5 py-1 rounded-full bg-[#004ac6] text-white hover:bg-[#003ea8] text-[12px] font-medium shadow-xs transition-colors cursor-pointer"
                    >
                      {isThai ? 'นำไปใช้' : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interval selector */}
          <div className="inline-flex items-center gap-2 bg-[#f2f3ff] px-3.5 py-1.5 rounded-full shadow-2xs border border-[#eaedff] text-xs">
            <Clock size={14} className="text-[#505f76]" />
            <span className="text-[#505f76]">{isThai ? 'ความถี่:' : 'Interval:'}</span>
            <select
              value={intervalOption}
              onChange={(e) => setIntervalOption(e.target.value)}
              className="font-bold text-[#004ac6] bg-transparent outline-none cursor-pointer"
            >
              <option value="15 min">{isThai ? 'ทุก 15 นาที' : '15 min'}</option>
              <option value="1 hour">{isThai ? 'ทุก 1 ชั่วโมง' : '1 hour'}</option>
              <option value="1 day">{isThai ? 'ทุก 1 วัน' : '1 day'}</option>
            </select>
          </div>
        </div>

        {/* Actions: Export CSV with Column Popover & Export PDF matching Stitch */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportPopoverOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#131b2e] hover:bg-[#eaedff] transition-colors shadow-2xs border border-[#eaedff] text-xs font-semibold cursor-pointer"
            >
              <Download size={14} className="text-[#505f76]" />
              <span>{isThai ? 'ส่งออก CSV' : 'Export CSV'}</span>
            </button>

            {isExportPopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl p-4 shadow-xl border border-[#eaedff] z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#eaedff]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">
                    {isThai ? 'คอลัมน์ในไฟล์ CSV' : 'Included CSV Columns'}
                  </span>
                  <Info size={14} className="text-[#505f76]" />
                </div>
                <div className="mt-1 text-[11px] text-[#131b2e] font-mono leading-relaxed bg-[#f2f3ff] p-2.5 rounded-xl border border-[#eaedff]">
                  Date, Min TVOC, Max TVOC, Avg TVOC, Max PM2.5, Level, Coverage %, P95, Samples
                </div>
                <button
                  type="button"
                  onClick={exportCSV}
                  className="w-full mt-2 py-2 bg-[#004ac6] text-white rounded-xl text-xs font-semibold hover:bg-[#003ea8] transition-colors cursor-pointer"
                >
                  {isThai ? 'ดาวน์โหลด CSV ตอนนี้' : 'Download CSV Now'}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => showToast(isThai ? 'กำลังเตรียมเอกสาร PDF ประจำสัปดาห์...' : 'Preparing Weekly Telemetry PDF Report...')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#131b2e] hover:bg-[#eaedff] transition-colors shadow-2xs border border-[#eaedff] text-xs font-semibold cursor-pointer"
          >
            <FileText size={14} className="text-[#505f76]" />
            <span>{isThai ? 'ส่งออก PDF' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Trend Chart Card matching Stitch ── */}
      <div className="relative w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xs overflow-hidden border border-[#eaedff]">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-[#004ac6]/5 via-[#dbe1ff]/10 to-transparent rounded-full pointer-events-none blur-2xl" />

        {/* Card Header + Legends */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex flex-col">
            <span className="text-[12px] uppercase text-[#505f76] font-semibold tracking-wider">
              {isThai ? 'แนวโน้มโทรมาตร' : 'Telemetry Trend'}
            </span>
            <h2 className="text-[20px] font-bold text-[#131b2e] mt-0.5">
              {isThai ? 'ค่าเฉลี่ย TVOC ประจำวัน' : 'TVOC average per day'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]" />
              <span className="text-xs font-medium text-[#505f76]">{isThai ? 'ค่าเฉลี่ยรายวัน (ppb)' : 'Daily Avg (ppb)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#ba1a1a]" />
              <span className="text-xs font-medium text-[#ba1a1a]">{isThai ? 'เกณฑ์เตือน (100 ppb)' : 'Threshold (100 ppb)'}</span>
            </div>
          </div>
        </div>

        {/* Metric selection bar & Show Threshold Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#eaedff]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] mr-1">
              {isThai ? 'ตัวชี้วัด:' : 'Metrics:'}
            </span>
            <button
              type="button"
              onClick={() => setSelectedMetrics({ ...selectedMetrics, tvoc: !selectedMetrics.tvoc })}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold shadow-2xs transition-all cursor-pointer ${
                selectedMetrics.tvoc ? 'bg-[#004ac6] text-white' : 'bg-[#eaedff] text-[#505f76]'
              }`}
            >
              {selectedMetrics.tvoc && <Check size={14} />}
              <span>TVOC</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetrics({ ...selectedMetrics, pm25: !selectedMetrics.pm25 })}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold shadow-2xs transition-all cursor-pointer ${
                selectedMetrics.pm25 ? 'bg-[#004ac6] text-white' : 'bg-[#eaedff] text-[#505f76]'
              }`}
            >
              {selectedMetrics.pm25 && <Check size={14} />}
              <span>PM2.5</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetrics({ ...selectedMetrics, eco2: !selectedMetrics.eco2 })}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold shadow-2xs transition-all cursor-pointer ${
                selectedMetrics.eco2 ? 'bg-[#004ac6] text-white' : 'bg-[#eaedff] text-[#505f76]'
              }`}
            >
              {selectedMetrics.eco2 && <Check size={14} />}
              <span>eCO2</span>
            </button>
            <span className="text-[11px] text-[#505f76] ml-1">({selectedMetricsCount}/3 {isThai ? 'เลือกแล้ว' : 'selected'})</span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showThreshold}
              onChange={(e) => setShowThreshold(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-[#c3c6d7] peer-focus:outline-none rounded-full peer peer-checked:bg-[#004ac6] after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[18px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
            <span className="ml-2.5 text-[12px] font-semibold text-[#131b2e] select-none">
              {isThai ? 'แสดงเส้นเกณฑ์ความปลอดภัย' : 'Show threshold'}
            </span>
          </label>
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
            {showThreshold && (
              <line stroke="#ba1a1a" strokeDasharray="4 4" strokeOpacity="0.4" strokeWidth="1.5" x1="40" x2="740" y1="70" y2="70" />
            )}
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

            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="60" y="208">{isThai ? 'ส.' : 'Sat'}</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="173" y="208">{isThai ? 'อา.' : 'Sun'}</text>
            <text className="text-[12px] fill-[#ba1a1a] font-bold" textAnchor="middle" x="286" y="208">{isThai ? 'จ. (พุ่งสูง)' : 'Mon (Spike)'}</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="400" y="208">{isThai ? 'อ.' : 'Tue'}</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="513" y="208">{isThai ? 'พ.' : 'Wed'}</text>
            <text className="text-[12px] fill-[#505f76] font-medium" textAnchor="middle" x="626" y="208">{isThai ? 'พฤ.' : 'Thu'}</text>
            <text className="text-[12px] fill-[#004ac6] font-bold" textAnchor="middle" x="720" y="208">{isThai ? 'วันนี้' : 'Today'}</text>

            {/* Gap Annotation matching Stitch */}
            <g id="chart-gap-annotation">
              <rect x="212" y="30" width="34" height="150" fill="currentColor" className="text-[#eaedff]/40" rx="4" />
              <path d="M 212 98 L 246 72" fill="none" stroke="#737686" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="229" cy="85" r="3" className="fill-white stroke-[#737686] stroke-[1.5]" />
              <g transform="translate(176, 52)">
                <rect width="112" height="20" rx="10" className="fill-[#dae2fd]" />
                <text x="56" y="14" textAnchor="middle" className="text-[10px] fill-[#131b2e] font-semibold">
                  {isThai ? 'ปรับฐาน 02:10–02:40' : 'No data 02:10–02:40'}
                </text>
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* ── Table Card: Summary View vs Full Expanded View ── */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xs overflow-hidden border border-[#eaedff]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase text-[#505f76] tracking-wider">
                {isFullTable ? (isThai ? 'การตรวจสอบโทรมาตรฉบับเต็ม' : 'Full Telemetry Audit') : (isThai ? 'ประวัติบันทึกข้อมูล' : 'Historical Logs')}
              </span>
              {isFullTable && (
                <span className="px-2 py-0.5 rounded-full bg-[#e2e7ff] text-[#004ac6] text-[11px] font-bold">
                  {isThai ? '7 วัน • 9 มิติข้อมูล' : '7 days • 9 metrics'}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-[#131b2e] mt-0.5">
              {isFullTable ? (isThai ? 'บันทึกโทรมาตรเซนเซอร์ฉบับเต็ม' : 'Complete Sensor Telemetry Log') : (isThai ? 'สรุปภาพรวมรายวัน' : 'Daily Summary Breakdown')}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsFullTable(!isFullTable)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f2f3ff] text-[#004ac6] hover:bg-[#eaedff] transition-colors text-xs font-semibold cursor-pointer group"
          >
            {isFullTable ? (
              <>
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>{isThai ? 'ย่อกลับเป็นสรุป' : 'Collapse to summary view'}</span>
              </>
            ) : (
              <>
                <span>{isThai ? 'ดูตารางเต็มฉบับสมบูรณ์' : 'View full table'}</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Mode A: Summary View */}
        {!isFullTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#505f76] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{isThai ? 'วันที่' : 'Date'}</th>
                  <th className="py-3 px-4">{isThai ? 'TVOC เฉลี่ย' : 'Average TVOC'}</th>
                  <th className="py-3 px-4">{isThai ? 'PM2.5 สูงสุด' : 'Max PM2.5'}</th>
                  <th className="py-3 px-4">{isThai ? 'ระดับสถานะ' : 'Level'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                {dataPoints.map((row, i) => (
                  <tr key={i} className="hover:bg-[#f2f3ff]/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold">{isThai ? row.dateTh : row.date}</td>
                    <td className={`py-3.5 px-4 tabular-nums ${row.isWarning ? 'font-bold text-[#ba1a1a]' : 'font-medium'}`}>
                      {row.avg}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-[#505f76]">{row.pm25}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${row.levelColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                        {isThai ? row.levelTh : row.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-3 border-t border-[#eaedff] flex items-center justify-between">
              <span className="text-[12px] text-[#505f76]">{isThai ? 'แสดงสรุป 5 วันล่าสุด' : 'Showing recent 5 daily summaries'}</span>
              <button
                type="button"
                onClick={() => setIsFullTable(true)}
                className="inline-flex items-center gap-1 text-[#004ac6] hover:underline font-semibold text-xs cursor-pointer"
              >
                <span>{isThai ? 'ดูตารางเต็ม →' : 'View full table →'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode B: Complete Full Telemetry Audit View */}
        {isFullTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#505f76] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{isThai ? 'วันที่' : 'Date'}</th>
                  <th className="py-3 px-4">{isThai ? 'TVOC ต่ำสุด' : 'Min TVOC'}</th>
                  <th className="py-3 px-4">{isThai ? 'TVOC สูงสุด' : 'Max TVOC'}</th>
                  <th className="py-3 px-4">{isThai ? 'TVOC เฉลี่ย' : 'Avg TVOC'}</th>
                  <th className="py-3 px-4">{isThai ? 'PM2.5 สูงสุด' : 'Max PM2.5'}</th>
                  <th className="py-3 px-4">{isThai ? 'ระดับ' : 'Level'}</th>
                  <th className="py-3 px-4">{isThai ? 'ความสมบูรณ์' : 'Coverage %'}</th>
                  <th className="py-3 px-4">P95</th>
                  <th className="py-3 px-4 text-right">{isThai ? 'จำนวนตัวอย่าง' : 'Samples'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                {dataPoints.map((row, i) => (
                  <tr key={i} className={`hover:bg-[#f2f3ff]/40 transition-colors ${row.isWarning ? 'bg-[#ffdbcd]/15' : ''}`}>
                    <td className="py-3.5 px-4 font-semibold">{isThai ? row.dateTh : row.date}</td>
                    <td className="py-3.5 px-4 tabular-nums text-[#505f76]">{row.min}</td>
                    <td className="py-3.5 px-4 tabular-nums text-[#505f76]">{row.max}</td>
                    <td className={`py-3.5 px-4 tabular-nums ${row.isWarning ? 'font-bold text-[#ba1a1a]' : 'font-semibold'}`}>
                      {row.avg}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-[#505f76]">{row.pm25}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${row.levelColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                        {isThai ? row.levelTh : row.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#131b2e]">{row.coverage}</td>
                    <td className={`py-3.5 px-4 tabular-nums ${row.isWarning ? 'font-bold text-[#ba1a1a]' : 'text-[#131b2e]'}`}>{row.p95}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#505f76]">{row.samples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-3 border-t border-[#eaedff] flex items-center justify-between">
              <span className="text-[12px] text-[#505f76]">{isThai ? 'แสดง 1-5 จาก 7 วัน' : 'Showing 1-5 of 7 days'}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFullTable(false)}
                  className="inline-flex items-center gap-1 text-[#004ac6] hover:underline font-semibold text-xs cursor-pointer mr-2"
                >
                  <ArrowLeft size={14} />
                  <span>{isThai ? 'ย่อกลับ' : 'Collapse'}</span>
                </button>
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                      currentPage === 1 ? 'bg-[#004ac6] text-white shadow-xs' : 'text-[#505f76] hover:bg-[#eaedff]'
                    }`}
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(2)}
                    className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                      currentPage === 2 ? 'bg-[#004ac6] text-white shadow-xs' : 'text-[#505f76] hover:bg-[#eaedff]'
                    }`}
                  >
                    2
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(2)}
                    className="w-7 h-7 rounded-full text-[#505f76] hover:bg-[#eaedff] text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[14px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check size={18} className="text-[#00CC66]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
