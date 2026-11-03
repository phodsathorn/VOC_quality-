import { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, ChevronRight, X, AlertTriangle, ShieldAlert,
  ArrowRight, Check, RefreshCw
} from 'lucide-react';
import { API } from '../config';

export default function Alerts() {
  const [incidents, setIncidents] = useState([
    {
      id: 204,
      time: '14:20 Today',
      level: 'Warning',
      levelColor: 'bg-[#ffdbcd] text-[#943700]',
      dotColor: 'bg-[#943700]',
      condition: 'Transient VOC spike in Booth 1 (142 ppb)',
      status: 'Open',
      statusColor: 'bg-[#ffdad6] text-[#ba1a1a]',
      actionTaken: 'Exhaust fan boosted to 100%',
    },
    {
      id: 203,
      time: '11:45 Today',
      level: 'Advisory',
      levelColor: 'bg-[#d3e4fe] text-[#004ac6]',
      dotColor: 'bg-[#004ac6]',
      condition: 'Exhaust velocity nominal airflow verified',
      status: 'Acknowledged',
      statusColor: 'bg-[#eaedff] text-[#54647a]',
      actionTaken: 'Standard VFD cycle maintained',
    },
    {
      id: 202,
      time: '09:15 Today',
      level: 'Normal',
      levelColor: 'bg-[#e2e7ff] text-[#004ac6]',
      dotColor: 'bg-[#0053db]',
      condition: 'Sensor array auto-calibration completed',
      status: 'Resolved',
      statusColor: 'bg-[#eaedff] text-[#434655]',
      actionTaken: 'R0 Baseline locked across 8 channels',
    },
    {
      id: 201,
      time: 'Yesterday 18:30',
      level: 'Warning',
      levelColor: 'bg-[#ffdbcd] text-[#943700]',
      dotColor: 'bg-[#943700]',
      condition: 'Filter pressure differential threshold',
      status: 'Resolved',
      statusColor: 'bg-[#eaedff] text-[#434655]',
      actionTaken: 'Pre-filter dust backwashed',
    },
    {
      id: 200,
      time: 'Yesterday 15:10',
      level: 'Advisory',
      levelColor: 'bg-[#d3e4fe] text-[#004ac6]',
      dotColor: 'bg-[#004ac6]',
      condition: 'Solvent recovery unit valve cycle check',
      status: 'Resolved',
      statusColor: 'bg-[#eaedff] text-[#434655]',
      actionTaken: 'Pneumatic seal test passed',
    },
  ]);

  const [selectedIncident, setSelectedIncident] = useState(incidents[0]);
  const [actionSelection, setActionSelection] = useState('Exhaust fan boosted to 100%');
  const [toastAck, setToastAck] = useState(null);

  const criticalCount = incidents.filter((i) => i.level === 'Critical' && i.status === 'Open').length;
  const warningCount = incidents.filter((i) => i.level === 'Warning' && i.status === 'Open').length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;

  function showToast(msg) {
    setToastAck(msg);
    setTimeout(() => setToastAck(null), 2500);
  }

  function handleAcknowledge() {
    if (!selectedIncident) return;
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === selectedIncident.id
          ? { ...item, status: 'Acknowledged', statusColor: 'bg-[#eaedff] text-[#54647a]' }
          : item
      )
    );
    setSelectedIncident((prev) => ({
      ...prev,
      status: 'Acknowledged',
      statusColor: 'bg-[#eaedff] text-[#54647a]',
    }));
    showToast(`รับทราบเหตุการณ์ #${selectedIncident.id} แล้ว`);
  }

  function handleResolve() {
    if (!selectedIncident) return;
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === selectedIncident.id
          ? { ...item, status: 'Resolved', statusColor: 'bg-[#eaedff] text-[#434655]' }
          : item
      )
    );
    setSelectedIncident((prev) => ({
      ...prev,
      status: 'Resolved',
      statusColor: 'bg-[#eaedff] text-[#434655]',
    }));
    showToast(`ปิดและแก้ไขเหตุการณ์ #${selectedIncident.id} สำเร็จ`);
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
      {/* ── Top 3 Metric KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Critical */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
              Critical
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
              {criticalCount} Active
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
              {criticalCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#434655] text-[13px]">
            <span>Immediate action req.</span>
            <span className="text-[#004ac6] font-semibold hover:translate-x-0.5 transition-transform cursor-pointer">
              View →
            </span>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
              Warning
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdbcd] text-[#943700] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#943700]" />
              {warningCount} Pending
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
              {warningCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#434655] text-[13px]">
            <span>Threshold advisory</span>
            <span className="text-[#004ac6] font-semibold hover:translate-x-0.5 transition-transform cursor-pointer">
              View →
            </span>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
              Resolved today
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d3e4fe] text-[#004ac6] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
              Normal
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
              {resolvedCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#434655] text-[13px]">
            <span>Logs archived</span>
            <span className="text-[#004ac6] font-semibold hover:translate-x-0.5 transition-transform cursor-pointer">
              View →
            </span>
          </div>
        </div>
      </div>

      {/* ── Incidents Table + Side Action Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Canvas (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-2.5">
              <Bell size={20} className="text-[#004ac6]" />
              <h2 className="text-[20px] font-bold text-[#131b2e] tracking-tight">
                Recent incidents
              </h2>
            </div>
            <span className="text-[12px] font-semibold text-[#434655] uppercase tracking-wider">
              {incidents.length} Events logged
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#434655] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 rounded-l-xl">Time</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {incidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`group cursor-pointer transition-colors rounded-xl ${
                        isSelected
                          ? 'bg-[#e2e7ff]'
                          : 'hover:bg-[#f2f3ff]'
                      }`}
                    >
                      <td className="py-4 px-4 font-semibold text-[#131b2e] rounded-l-xl tabular-nums">
                        {inc.time}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${inc.levelColor}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${inc.dotColor}`} />
                          {inc.level}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#131b2e] font-medium">{inc.condition}</td>
                      <td className="py-4 px-4 rounded-r-xl">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${inc.statusColor}`}
                        >
                          {inc.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Incident Detail & Action (col-span-4) */}
        {selectedIncident && (
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-[#e2e8f0] space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#131b2e]">
                  Incident #{selectedIncident.id}:
                </h3>
                <div className="text-[16px] font-semibold text-[#131b2e] mt-0.5">
                  {selectedIncident.condition.split('(')[0]}
                </div>
                <div className="text-[12px] text-[#64748b] mt-1">
                  {selectedIncident.time} • Level: {selectedIncident.level}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#434655] mb-2">
                Action Taken
              </label>
              <select
                value={actionSelection}
                onChange={(e) => setActionSelection(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[13px] font-semibold text-[#131b2e] focus:ring-2 focus:ring-[#2563eb]/20 outline-none cursor-pointer"
              >
                <option value="Exhaust fan boosted to 100%">Exhaust fan boosted to 100%</option>
                <option value="Secondary Scrubber Activated">Secondary Scrubber Activated</option>
                <option value="Solvent Valve Cut-off Initiated">Solvent Valve Cut-off Initiated</option>
                <option value="Operator Notified & Logged">Operator Notified & Logged</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAcknowledge}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#eaedff] text-[#004ac6] text-[13px] font-bold hover:bg-[#dbe1ff] transition-colors"
              >
                Acknowledge
              </button>
              <button
                type="button"
                onClick={handleResolve}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#004ac6] text-white text-[13px] font-bold hover:bg-[#2563eb] transition-colors shadow-xs"
              >
                Mark resolved
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toastAck && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-[#283044] text-white px-6 py-3 rounded-full shadow-2xl text-[16px] font-semibold z-50 flex items-center gap-2 animate-fadeIn">
          <Check size={20} className="text-[#00CC66]" />
          <span>{toastAck}</span>
        </div>
      )}
    </div>
  );
}
