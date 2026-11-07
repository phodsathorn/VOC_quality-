import { useState, useEffect, useMemo } from 'react';
import {
  Bell, Check, ChevronDown, X, ShieldAlert, Search, Calendar, SlidersHorizontal, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { API } from '../config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Alerts() {
  const { user } = useAuth();
  const { t, isThai } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Today');
  const [currentPage, setCurrentPage] = useState(1);

  const [incidents, setIncidents] = useState([
    {
      id: 204,
      title: 'Incident #204: Transient VOC spike',
      meta: '14:20 Today • Level: Warning',
      time: '14:20 Today',
      level: 'Warning',
      levelBg: 'bg-[#ffdbcd]',
      levelText: 'text-[#943700]',
      dotBg: 'bg-[#943700]',
      condition: 'Transient VOC spike in Booth 1 (142 ppb)',
      rule: 'TVOC > 200 ppb for 2 min',
      status: 'Open',
      statusBg: 'bg-[#ffdad6]',
      statusText: 'text-[#ba1a1a]',
      owner: 'E. Mitchell',
      ownerInitials: 'EM',
      slaMinutes: 6,
      slaTarget: 10,
      peakPpb: 218,
      limitPpb: 200,
    },
    {
      id: 203,
      title: 'Incident #203: Airflow verification',
      meta: '11:45 Today • Level: Advisory',
      time: '11:45 Today',
      level: 'Advisory',
      levelBg: 'bg-[#d3e4fe]',
      levelText: 'text-[#004ac6]',
      dotBg: 'bg-[#004ac6]',
      condition: 'Exhaust velocity nominal airflow verified',
      rule: 'Flow < 15 m/s for 30s',
      status: 'Acknowledged',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#54647a]',
      owner: 'P. Krai',
      ownerInitials: 'PK',
      slaMinutes: 3,
      slaTarget: 15,
      peakPpb: 110,
      limitPpb: 150,
    },
    {
      id: 202,
      title: 'Incident #202: Sensor auto-calibration',
      meta: '09:15 Today • Level: Normal',
      time: '09:15 Today',
      level: 'Normal',
      levelBg: 'bg-[#e2e7ff]',
      levelText: 'text-[#004ac6]',
      dotBg: 'bg-[#0053db]',
      condition: 'Sensor array auto-calibration completed',
      rule: 'Scheduled daily 09:00',
      status: 'Resolved',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#434655]',
      owner: 'S. Tanaka',
      ownerInitials: 'ST',
      slaMinutes: 2,
      slaTarget: 10,
      peakPpb: 45,
      limitPpb: 120,
    },
    {
      id: 201,
      title: 'Incident #201: Differential pressure',
      meta: 'Yesterday 18:30 • Level: Warning',
      time: 'Yesterday 18:30',
      level: 'Warning',
      levelBg: 'bg-[#ffdbcd]',
      levelText: 'text-[#943700]',
      dotBg: 'bg-[#943700]',
      condition: 'Filter pressure differential threshold',
      rule: 'ΔP > 350 Pa for 5 min',
      status: 'Resolved',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#434655]',
      owner: 'E. Mitchell',
      ownerInitials: 'EM',
      slaMinutes: 8,
      slaTarget: 10,
      peakPpb: 180,
      limitPpb: 200,
    },
    {
      id: 200,
      title: 'Incident #200: Valve recovery cycle',
      meta: 'Yesterday 15:10 • Level: Advisory',
      time: 'Yesterday 15:10',
      level: 'Advisory',
      levelBg: 'bg-[#d3e4fe]',
      levelText: 'text-[#004ac6]',
      dotBg: 'bg-[#004ac6]',
      condition: 'Solvent recovery unit valve cycle check',
      rule: 'Cycle timeout > 45s',
      status: 'Resolved',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#434655]',
      owner: 'P. Krai',
      ownerInitials: 'PK',
      slaMinutes: 4,
      slaTarget: 15,
      peakPpb: 78,
      limitPpb: 120,
    },
  ]);

  const [selectedIncident, setSelectedIncident] = useState(incidents[0]);
  const [actionSelection, setActionSelection] = useState('fan-boost');
  const [ownerSelection, setOwnerSelection] = useState('em');
  const [mitigationNote, setMitigationNote] = useState('');
  const [toastAck, setToastAck] = useState(null);
  const [summaryCounts, setSummaryCounts] = useState({ critical: 0, warning: 1, resolved: 5 });

  function showToast(msg) {
    setToastAck(msg);
    setTimeout(() => setToastAck(null), 2500);
  }

  // Live real data polling from backend
  useEffect(() => {
    let isMounted = true;
    async function loadAlerts() {
      try {
        const [listRes, summaryRes] = await Promise.all([
          fetch(`${API}/api/alerts?limit=20`),
          fetch(`${API}/api/alerts/summary`).catch(() => null),
        ]);
        if (listRes.ok && isMounted) {
          const data = await listRes.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((a) => {
              const level = a.level || 'Warning';
              const isWarning = level === 'Warning' || level === 'High';
              const isCritical = level === 'Critical';
              const isNormal = level === 'Normal';
              return {
                id: a.id,
                title: `Incident #${a.id}: ${a.message ? a.message.slice(0, 32) : 'VOC Anomaly'}`,
                meta: `${a.time || 'Today'} • Level: ${level}`,
                time: a.time ? `${a.time} Today` : 'Today',
                level: level,
                levelBg: isCritical ? 'bg-[#ffdad6]' : isWarning ? 'bg-[#ffdbcd]' : isNormal ? 'bg-[#e2e7ff]' : 'bg-[#d3e4fe]',
                levelText: isCritical ? 'text-[#ba1a1a]' : isWarning ? 'text-[#943700]' : 'text-[#004ac6]',
                dotBg: isCritical ? 'bg-[#ba1a1a]' : isWarning ? 'bg-[#943700]' : isNormal ? 'bg-[#0053db]' : 'bg-[#004ac6]',
                condition: a.message || 'Transient VOC condition',
                rule: a.rule || (isCritical ? 'TVOC > 300 ppb for 1 min' : 'TVOC > 200 ppb for 2 min'),
                status: a.status === 'Active' ? 'Open' : a.status || 'Open',
                statusBg: a.status === 'Open' || a.status === 'Active' ? 'bg-[#ffdad6]' : 'bg-[#eaedff]',
                statusText: a.status === 'Open' || a.status === 'Active' ? 'text-[#ba1a1a]' : a.status === 'Acknowledged' ? 'text-[#54647a]' : 'text-[#434655]',
                owner: a.acknowledged_by || a.resolved_by || 'E. Mitchell',
                ownerInitials: (a.acknowledged_by || a.resolved_by || 'EM').slice(0, 2).toUpperCase(),
                slaMinutes: a.remaining_sla_seconds ? Math.max(1, Math.round(a.remaining_sla_seconds / 60)) : 6,
                slaTarget: 10,
                peakPpb: a.peak_reading || 218,
                limitPpb: 200,
              };
            });
            setIncidents(mapped);
            setSelectedIncident((curr) => {
              if (!curr) return mapped[0];
              const found = mapped.find((m) => m.id === curr.id);
              return found || mapped[0];
            });
          }
        }
        if (summaryRes && summaryRes.ok && isMounted) {
          const s = await summaryRes.json();
          setSummaryCounts({
            critical: s.Critical || s.High || 0,
            warning: s.Warning || 1,
            resolved: s.Resolved || 5,
          });
        }
      } catch (err) {
        console.warn('Alerts live fetch notice:', err);
      }
    }

    loadAlerts();
    const interval = setInterval(loadAlerts, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  async function handleAcknowledge() {
    if (!selectedIncident) return;
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === selectedIncident.id
          ? { ...item, status: 'Acknowledged', statusBg: 'bg-[#eaedff]', statusText: 'text-[#54647a]' }
          : item
      )
    );
    setSelectedIncident((prev) => ({
      ...prev,
      status: 'Acknowledged',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#54647a]',
    }));
    showToast(`Acknowledged Incident #${selectedIncident.id}`);

    try {
      await fetch(`${API}/api/alerts/${selectedIncident.id}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({ source_screen: 'Web Dashboard' }),
      });
    } catch (err) {
      console.warn('Acknowledge patch:', err);
    }
  }

  async function handleResolve() {
    if (!selectedIncident) return;
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === selectedIncident.id
          ? { ...item, status: 'Resolved', statusBg: 'bg-[#eaedff]', statusText: 'text-[#434655]' }
          : item
      )
    );
    setSelectedIncident((prev) => ({
      ...prev,
      status: 'Resolved',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#434655]',
    }));
    showToast(`Marked Incident #${selectedIncident.id} as resolved ✓`);

    try {
      await fetch(`${API}/api/alerts/${selectedIncident.id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({
          note: mitigationNote || actionSelection,
          evidence: actionSelection,
        }),
      });
    } catch (err) {
      console.warn('Resolve patch:', err);
    }
  }

  function resetDrawer() {
    setSelectedIncident(null);
  }

  // Filter incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchSearch = searchTerm
        ? (inc.condition + inc.owner + (inc.rule || '')).toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchSeverity = severityFilter === 'All' ? true : inc.level.toLowerCase() === severityFilter.toLowerCase();
      return matchSearch && matchSeverity;
    });
  }, [incidents, searchTerm, severityFilter]);

  return (
    <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
      {/* ── Top Metric Cards (3-up Summary) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white rounded-3xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#434655] uppercase tracking-wider">
              {isThai ? 'แจ้งเตือนวิกฤต' : 'Critical'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
              {summaryCounts.critical} {isThai ? 'กำลังเกิดขึ้น' : 'Active'}
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
              {summaryCounts.critical}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#434655] text-[13px] pt-1">
            <span className="text-xs text-[#434655]">
              {isThai ? 'ต้องดำเนินการทันที' : 'Immediate action req.'}
            </span>
            <span className="text-[#004ac6] font-medium hover:translate-x-0.5 transition-transform cursor-pointer">
              {isThai ? 'ดูรายการ →' : 'View →'}
            </span>
          </div>
        </div>

        {/* Warning Thresholds */}
        <div className="bg-white rounded-3xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#434655] uppercase tracking-wider">
              {isThai ? 'แจ้งเตือนเฝ้าระวัง' : 'Warning'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdbcd] text-[#943700] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#943700]" />
              {summaryCounts.warning} {isThai ? 'รอดำเนินการ' : 'Pending'}
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
              {summaryCounts.warning}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#434655] text-[13px] pt-1">
            <span className="text-xs text-[#434655]">
              {isThai ? 'คำแนะนำตามเกณฑ์' : 'Threshold advisory'}
            </span>
            <span className="text-[#004ac6] font-medium hover:translate-x-0.5 transition-transform cursor-pointer">
              {isThai ? 'ดูรายการ →' : 'View →'}
            </span>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white rounded-3xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#434655] uppercase tracking-wider">
              {isThai ? 'แก้ไขแล้ววันนี้' : 'Resolved Today'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d3e4fe] text-[#004ac6] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
              {isThai ? 'ปกติ' : 'Normal'}
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
              {summaryCounts.resolved}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#434655] text-[13px] pt-1">
            <span className="text-xs text-[#434655]">
              {isThai ? 'บันทึกประวัติแล้ว' : 'Logs archived'}
            </span>
            <span className="text-[#004ac6] font-medium hover:translate-x-0.5 transition-transform cursor-pointer">
              {isThai ? 'ดูรายการ →' : 'View →'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Incidents Content Grid: Left Table (col-span-8), Right Drawer (col-span-4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Recent Incidents Table (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff]">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#004ac6]">
                <Bell size={20} />
              </span>
              <h2 className="text-[20px] font-semibold text-[#131b2e] tracking-tight">
                {isThai ? 'เหตุการณ์ล่าสุด' : 'Recent incidents'}
              </h2>
            </div>
            <span className="text-[12px] font-medium text-[#434655] uppercase tracking-wider">
              {filteredIncidents.length} {isThai ? 'บันทึกเหตุการณ์' : 'Events logged'}
            </span>
          </div>

          {/* Search and Filters Bar matching Stitch Sub-state */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none" />
              <input
                type="text"
                placeholder={isThai ? 'ค้นหาสภาวะ ผู้รับผิดชอบ หรือกฎเกณฑ์...' : 'Search condition, owner or rule...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#f2f3ff] text-[#131b2e] placeholder:text-[#737686]/70 text-xs rounded-2xl py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 border border-transparent focus:border-[#004ac6]/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDateFilter((d) => (d === 'Today' ? 'All time' : 'Today'))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] text-xs font-medium transition-colors"
              >
                <Calendar size={14} className="text-[#505f76]" />
                <span>{isThai ? `วันที่: ${dateFilter === 'Today' ? 'วันนี้' : 'ทั้งหมด'}` : `Date: ${dateFilter}`}</span>
                <ChevronDown size={14} className="text-[#505f76]" />
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter((s) => (s === 'All' ? 'Warning' : s === 'Warning' ? 'Critical' : 'All'))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] text-xs font-medium transition-colors"
              >
                <SlidersHorizontal size={14} className="text-[#505f76]" />
                <span>
                  {isThai
                    ? `ระดับ: ${severityFilter === 'All' ? 'ทั้งหมด' : severityFilter === 'Warning' ? 'เฝ้าระวัง' : 'วิกฤต'}`
                    : `Severity: ${severityFilter}`}
                </span>
                <ChevronDown size={14} className="text-[#505f76]" />
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#434655] text-[12px] uppercase tracking-wider font-medium">
                  <th className="py-3 px-4">{isThai ? 'เวลา' : 'Time'}</th>
                  <th className="py-3 px-4">{isThai ? 'ระดับ' : 'Level'}</th>
                  <th className="py-3 px-4">{isThai ? 'สภาวะตรวจพบ' : 'Condition'}</th>
                  <th className="py-3 px-4">{isThai ? 'กฎการตรวจวัด' : 'Rule'}</th>
                  <th className="py-3 px-4">{isThai ? 'สถานะ' : 'Status'}</th>
                  <th className="py-3 px-4">{isThai ? 'ผู้รับผิดชอบ' : 'Owner'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaedff]/60">
                {filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  const displayLevel = isThai
                    ? (inc.level === 'Warning' ? 'เฝ้าระวัง' : inc.level === 'Critical' ? 'วิกฤต' : inc.level === 'Advisory' ? 'ข้อแนะนำ' : 'ปกติ')
                    : (inc.level === 'เฝ้าระวัง' ? 'Warning' : inc.level === 'วิกฤต' ? 'Critical' : inc.level);
                  const displayStatus = isThai
                    ? (inc.status === 'Open' ? 'เปิดอยู่' : inc.status === 'Acknowledged' ? 'รับทราบแล้ว' : 'แก้ไขแล้ว')
                    : (inc.status === 'เปิดอยู่' ? 'Open' : inc.status === 'รับทราบแล้ว' ? 'Acknowledged' : inc.status === 'แก้ไขแล้ว' ? 'Resolved' : inc.status);
                  const displayTime = isThai
                    ? String(inc.time || '').replace('Today', 'วันนี้').replace('Yesterday', 'เมื่อวาน')
                    : String(inc.time || '').replace('วันนี้', 'Today').replace('เมื่อวาน', 'Yesterday');
                  let displayCondition = inc.condition;
                  if (!isThai) {
                    if (displayCondition?.includes('สูงเกินวิกฤต')) {
                      displayCondition = displayCondition.replace('สูงเกินวิกฤต:', 'Critical:').replace('(เกณฑ์', '(Threshold').replace(')', ' ppb)');
                    } else if (displayCondition?.includes('สูงเกินปกติ')) {
                      displayCondition = displayCondition.replace('สูงเกินปกติ:', 'Elevated:').replace('(เกณฑ์', '(Threshold').replace(')', ' ppb)');
                    }
                  } else {
                    if (displayCondition?.includes('Transient VOC spike')) {
                      displayCondition = 'ระดับไอระเหย TVOC สูงชั่วคราวในห้องพ่นสี 1 (142 ppb)';
                    } else if (displayCondition?.includes('Exhaust velocity')) {
                      displayCondition = 'ตรวจสอบความเร็วลมระบายอากาศอยู่ในเกณฑ์ปกติ';
                    } else if (displayCondition?.includes('auto-calibration')) {
                      displayCondition = 'การสอบเทียบแผงเซนเซอร์อัตโนมัติเสร็จสมบูรณ์';
                    } else if (displayCondition?.includes('differential pressure') || displayCondition?.includes('Filter pressure')) {
                      displayCondition = 'แรงดันตกคร่อมตัวกรองเกินเกณฑ์กำหนด';
                    } else if (displayCondition?.includes('valve cycle')) {
                      displayCondition = 'ตรวจสอบรอบการทำงานวาล์วชุดดักจับตัวทำละลาย';
                    }
                  }

                  return (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`group cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#e2e7ff]'
                          : 'hover:bg-[#f2f3ff]'
                      }`}
                    >
                      <td className="py-4 px-4 font-medium text-[#131b2e] tabular-nums whitespace-nowrap">
                        {displayTime}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${inc.levelBg} ${inc.levelText}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${inc.dotBg}`} />
                          {displayLevel}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#131b2e] font-normal min-w-[180px]">{displayCondition}</td>
                      <td className="py-4 px-4 text-xs font-mono text-[#505f76] whitespace-nowrap">{inc.rule || 'TVOC > 200 ppb'}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${inc.statusBg} ${inc.statusText}`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                              inc.id === 204
                                ? 'bg-[#004ac6] text-white'
                                : 'bg-[#e2e7ff] text-[#004ac6]'
                            }`}
                          >
                            {inc.ownerInitials}
                          </span>
                          <span
                            className={`text-[12px] ${
                              inc.id === 204
                                ? 'font-medium text-[#131b2e]'
                                : 'font-normal text-[#434655]'
                            }`}
                          >
                            {inc.owner}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with pagination matching Stitch */}
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#eaedff] text-xs text-[#505f76]">
            <span>
              {isThai ? (
                <>แสดง <strong className="font-semibold text-[#131b2e]">1-{filteredIncidents.length}</strong> จาก <strong className="font-semibold text-[#131b2e]">24</strong> รายการ</>
              ) : (
                <>Showing <strong className="font-semibold text-[#131b2e]">1-{filteredIncidents.length}</strong> of <strong className="font-semibold text-[#131b2e]">24</strong> incidents</>
              )}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`w-7 h-7 rounded-xl font-medium flex items-center justify-center transition-colors ${
                  currentPage === 1 ? 'opacity-40 cursor-not-allowed text-[#a0a5bd]' : 'hover:bg-[#f2f3ff] text-[#131b2e] cursor-pointer'
                }`}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className={`w-7 h-7 rounded-xl font-medium flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 1 ? 'bg-[#004ac6] text-white shadow-xs' : 'hover:bg-[#f2f3ff] text-[#131b2e]'
                }`}
              >
                1
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(2)}
                className={`w-7 h-7 rounded-xl font-medium flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 2 ? 'bg-[#004ac6] text-white shadow-xs' : 'hover:bg-[#f2f3ff] text-[#131b2e]'
                }`}
              >
                2
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(3)}
                className={`w-7 h-7 rounded-xl font-medium flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 3 ? 'bg-[#004ac6] text-white shadow-xs' : 'hover:bg-[#f2f3ff] text-[#131b2e]'
                }`}
              >
                3
              </button>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => setCurrentPage(p => Math.min(3, p + 1))}
                disabled={currentPage === 3}
                className={`w-7 h-7 rounded-xl font-medium flex items-center justify-center transition-colors ${
                  currentPage === 3 ? 'opacity-40 cursor-not-allowed text-[#a0a5bd]' : 'hover:bg-[#f2f3ff] text-[#131b2e] cursor-pointer'
                }`}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel: Action Taken / Incident Details (col-span-4) */}
        <div
          className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between transition-all duration-300"
          id="incident-drawer"
        >
          <div>
            {/* Header + Close button */}
            <div className="flex items-start justify-between pb-4">
              <div className="flex flex-col">
                <h3 className="text-[18px] font-semibold text-[#131b2e] leading-snug">
                  {selectedIncident
                    ? (isThai ? `เหตุการณ์ #${selectedIncident.id}: ${selectedIncident.condition}` : selectedIncident.title)
                    : (isThai ? 'การแจ้งเตือนสายพ่นสีฝุ่น' : 'Powder Coating Line Alerts')}
                </h3>
                <span className="text-[14px] text-[#434655] mt-1 font-normal">
                  {selectedIncident
                    ? (isThai
                        ? `${String(selectedIncident.time || '').replace('Today', 'วันนี้').replace('Yesterday', 'เมื่อวาน')} • ระดับ: ${selectedIncident.level === 'Warning' ? 'เฝ้าระวัง' : selectedIncident.level === 'Critical' ? 'วิกฤต' : 'ปกติ'}`
                        : selectedIncident.meta)
                    : (isThai ? 'เลือกเหตุการณ์จากตารางเพื่อดูรายละเอียด' : 'Select an incident from the log')}
                </span>
              </div>
              <button
                type="button"
                onClick={resetDrawer}
                className="p-1 rounded-full text-[#434655] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors cursor-pointer"
                aria-label="Dismiss panel"
              >
                <X size={20} />
              </button>
            </div>

            {selectedIncident && (
              <div className="flex flex-col gap-4 mt-3">
                {/* Sub-State SLA Card */}
                <div className="bg-[#f2f3ff] p-3.5 rounded-2xl flex flex-col gap-1.5 border border-[#eaedff]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#434655]">
                      {isThai ? 'การตอบสนองตาม SLA' : 'SLA Response'}
                    </span>
                    <span className="text-[#059669] font-semibold">
                      {isThai
                        ? `เป้าหมาย ${selectedIncident.slaMinutes} นาที / ${selectedIncident.slaTarget} นาที`
                        : `${selectedIncident.slaMinutes}m / ${selectedIncident.slaTarget}m target`}
                    </span>
                  </div>
                  <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#059669] h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (selectedIncident.slaMinutes / selectedIncident.slaTarget) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#505f76]">
                    <span>
                      {isThai
                        ? `ตอบสนองภายใน ${selectedIncident.slaMinutes} นาที • เป็นไปตามเกณฑ์`
                        : `Responded in ${selectedIncident.slaMinutes} min • Compliant`}
                    </span>
                    <span>
                      {isThai ? 'ยกระดับไปยัง: หัวหน้างาน, กลุ่ม LINE' : 'Escalates to: Supervisor, LINE group'}
                    </span>
                  </div>
                </div>

                {/* 30 Minutes Around the Event Sparkline Chart */}
                <div className="bg-[#f2f3ff] p-3.5 rounded-2xl flex flex-col gap-2 border border-[#eaedff]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#131b2e]">
                      {isThai ? 'ช่วงเวลา 30 นาทีก่อนและหลังเกิดเหตุ' : '30 minutes around the event'}
                    </span>
                    <span className="text-[10px] text-[#ba1a1a] font-medium">
                      {isThai ? `สูงสุด: ${selectedIncident.peakPpb || 218} ppb` : `Peak: ${selectedIncident.peakPpb || 218} ppb`}
                    </span>
                  </div>
                  <div className="relative w-full h-20">
                    <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                      <line x1="0" y1="28" x2="300" y2="28" stroke="#ba1a1a" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.75" />
                      <path d="M0,66 C35,66 50,65 80,63 C110,60 125,58 140,24 C148,10 156,12 165,34 C175,54 200,60 230,62 C260,64 280,64 300,65" fill="none" stroke="#004ac6" strokeWidth="2.5" />
                      <path d="M0,66 C35,66 50,65 80,63 C110,60 125,58 140,24 C148,10 156,12 165,34 C175,54 200,60 230,62 C260,64 280,64 300,65 L300,80 L0,80 Z" fill="#004ac6" fillOpacity="0.08" />
                      <circle cx="152" cy="18" r="4.5" fill="#ba1a1a" stroke="#ffffff" strokeWidth="2" />
                      <text x="156" y="16" fill="#ba1a1a" fontSize="9" fontWeight="bold">14:20</text>
                      <text x="4" y="24" fill="#ba1a1a" fontSize="8" fontWeight="500" opacity="0.9">
                        {isThai ? `เกณฑ์ ${selectedIncident.limitPpb || 200} ppb` : `Limit ${selectedIncident.limitPpb || 200} ppb`}
                      </text>
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#505f76] font-mono">
                    <span>14:05</span>
                    <span>14:20</span>
                    <span>14:35</span>
                  </div>
                </div>

                {/* Incident Timeline */}
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold">
                    {isThai ? 'ลำดับเหตุการณ์' : 'Incident Timeline'}
                  </span>
                  <div className="relative pl-5 flex flex-col gap-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#eaedff]">
                    <div className="relative flex items-start gap-2">
                      <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-white" />
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-[#131b2e]">
                          {isThai ? 'ตรวจพบเหตุการณ์' : 'Created'} <span className="text-[11px] text-[#505f76] font-normal">• 14:20</span>
                        </span>
                        <span className="text-[11px] text-[#505f76]">
                          {isThai ? 'ระบบตรวจพบอัตโนมัติ (TVOC > 200 ppb)' : 'System trigger (TVOC > 200 ppb)'}
                        </span>
                      </div>
                    </div>
                    <div className="relative flex items-start gap-2">
                      <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-white" />
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-[#131b2e]">
                          {isThai ? 'รับทราบเหตุการณ์' : 'Acknowledged'} <span className="text-[11px] text-[#505f76] font-normal">• 14:23</span>
                        </span>
                        <span className="text-[11px] text-[#505f76]">{selectedIncident.owner}</span>
                      </div>
                    </div>
                    <div className="relative flex items-start gap-2">
                      <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#004ac6] animate-pulse ring-2 ring-white" />
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-[#004ac6]">
                          {isThai ? 'กำลังแก้ไข' : 'In progress'} <span className="text-[11px] text-[#505f76] font-normal">• 14:26</span>
                        </span>
                        <span className="text-[11px] text-[#505f76]">
                          {selectedIncident.owner} {isThai ? '(เร่งพัดลมดูดอากาศ 100%)' : '(Exhaust fan boosted)'}
                        </span>
                      </div>
                    </div>
                    <div className="relative flex items-start gap-2">
                      <span className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${selectedIncident.status === 'Resolved' || selectedIncident.status === 'แก้ไขแล้ว' ? 'bg-[#10b981]' : 'border-2 border-[#c3c6d7] bg-white'}`} />
                      <div className="flex flex-col text-xs">
                        <span className={`font-medium ${selectedIncident.status === 'Resolved' || selectedIncident.status === 'แก้ไขแล้ว' ? 'text-[#10b981]' : 'text-[#505f76]'}`}>
                          {isThai ? 'แก้ไขเสร็จสิ้น' : 'Resolved'}
                        </span>
                        <span className="text-[11px] text-[#505f76]/70">
                          {selectedIncident.status === 'Resolved' || selectedIncident.status === 'แก้ไขแล้ว'
                            ? (isThai ? 'ตรวจสอบยืนยันเรียบร้อยแล้ว ✓' : 'Completed & verified ✓')
                            : (isThai ? 'รอดำเนินการให้เสร็จสิ้น' : 'Pending completion • Unassigned')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Taken Select */}
            <div className="mt-5 flex flex-col gap-1.5">
              <label
                className="text-[12px] uppercase tracking-wider text-[#434655] font-medium"
                htmlFor="incident-action"
              >
                {isThai ? 'การดำเนินการแก้ไข' : 'Action taken'}
              </label>
              <div className="relative">
                <select
                  id="incident-action"
                  value={actionSelection}
                  onChange={(e) => setActionSelection(e.target.value)}
                  className="w-full appearance-none bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 pr-10 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                >
                  <option value="fan-boost">
                    {isThai ? 'เร่งพัดลมดูดอากาศ 100% (ฉุกเฉิน)' : 'Exhaust fan boosted to 100%'}
                  </option>
                  <option value="inspection">
                    {isThai ? 'ตรวจสอบห้องพ่นสีด้วยตนเอง' : 'Manual booth inspection'}
                  </option>
                  <option value="filter-log">
                    {isThai ? 'บันทึกการเปลี่ยนแผ่นกรอง' : 'Filter replacement logged'}
                  </option>
                  <option value="dismiss">
                    {isThai ? 'ยกเลิกการเตือน (สัญญาณรบกวน)' : 'False positive dismissed'}
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#434655]">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Owner Select */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label
                className="text-[12px] uppercase tracking-wider text-[#434655] font-medium"
                htmlFor="incident-owner"
              >
                {isThai ? 'ผู้รับผิดชอบ' : 'Owner'}
              </label>
              <div className="relative">
                <select
                  id="incident-owner"
                  value={ownerSelection}
                  onChange={(e) => setOwnerSelection(e.target.value)}
                  className="w-full appearance-none bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 pr-10 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                >
                  <option value="em">E. Mitchell ({isThai ? 'เจ้าหน้าที่ความปลอดภัย (จป.)' : 'H&S Officer'})</option>
                  <option value="pk">P. Krai ({isThai ? 'หัวหน้าฝ่ายอาคารสถานที่' : 'Facility Lead'})</option>
                  <option value="st">S. Tanaka ({isThai ? 'วิศวกรความปลอดภัย' : 'Safety Eng.'})</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#434655]">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Mitigation Note */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label
                className="text-[12px] uppercase tracking-wider text-[#434655] font-medium"
                htmlFor="incident-note"
              >
                {isThai ? 'บันทึกผลการแก้ไข' : 'Mitigation note'}
              </label>
              <textarea
                id="incident-note"
                rows={3}
                value={mitigationNote}
                onChange={(e) => setMitigationNote(e.target.value)}
                placeholder={isThai ? 'บันทึกการแก้ไขหรือหลักฐานเพิ่มเติม...' : 'Add mitigation note or root-cause details...'}
                className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl p-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons: Acknowledge & Mark Resolved */}
          <div className="pt-6 flex items-center gap-3">
            <button
              type="button"
              id="btn-ack"
              onClick={handleAcknowledge}
              disabled={selectedIncident?.status === 'Acknowledged' || selectedIncident?.status === 'รับทราบแล้ว' || selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'}
              className={`flex-1 py-3 px-4 rounded-2xl font-medium text-[14px] transition-colors text-center cursor-pointer ${
                selectedIncident?.status === 'Acknowledged' || selectedIncident?.status === 'รับทราบแล้ว' || selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'
                  ? 'bg-[#eaedff] text-[#54647a] opacity-60 cursor-not-allowed'
                  : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dbe1ff]'
              }`}
            >
              {selectedIncident?.status === 'Acknowledged' || selectedIncident?.status === 'รับทราบแล้ว'
                ? (isThai ? 'รับทราบแล้ว ✓' : 'Acknowledged ✓')
                : (isThai ? 'รับทราบเหตุการณ์' : 'Acknowledge')}
            </button>
            <button
              type="button"
              id="btn-resolve"
              onClick={handleResolve}
              disabled={selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'}
              className={`flex-1 py-3 px-4 rounded-2xl font-medium text-[14px] shadow-xs transition-all text-center cursor-pointer ${
                selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'
                  ? 'bg-[#059669] text-white opacity-90 cursor-default'
                  : 'bg-[#004ac6] text-white hover:bg-[#003ea8]'
              }`}
            >
              {selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'
                ? (isThai ? 'แก้ไขแล้ว ✓' : 'Resolved ✓')
                : (isThai ? 'บันทึกว่าแก้ไขเสร็จสิ้น' : 'Mark resolved')}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastAck && (
        <div className="fixed bottom-6 right-6 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[14px] z-50 animate-fade-in">
          <Check size={18} className="text-[#00CC66]" />
          <span>{toastAck}</span>
        </div>
      )}
    </div>
  );
}
