import { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, ChevronRight, X, AlertTriangle, ShieldAlert,
  ArrowRight, Check, ChevronDown
} from 'lucide-react';
import { API } from '../config';

export default function Alerts() {
  const [incidents, setIncidents] = useState([
    {
      id: 204,
      title: 'Transient VOC spike',
      time: '14:20 Today',
      level: 'Warning',
      levelColor: 'bg-[#ffdbcd] text-[#943700]',
      dotColor: 'bg-[#943700]',
      condition: 'Transient VOC spike in Booth 1 (142 ppb)',
      status: 'Open',
      statusColor: 'bg-[#ffdad6] text-[#ba1a1a]',
      owner: 'E. Mitchell',
      ownerInitials: 'EM',
      slaMinutes: 6,
      slaTarget: 10,
    },
    {
      id: 203,
      title: 'Airflow verification',
      time: '11:45 Today',
      level: 'Advisory',
      levelColor: 'bg-[#d3e4fe] text-[#004ac6]',
      dotColor: 'bg-[#004ac6]',
      condition: 'Exhaust velocity nominal airflow verified',
      status: 'Acknowledged',
      statusColor: 'bg-[#eaedff] text-[#54647a]',
      owner: 'P. Krai',
      ownerInitials: 'PK',
      slaMinutes: 3,
      slaTarget: 15,
    },
    {
      id: 202,
      title: 'Sensor auto-calibration',
      time: '09:15 Today',
      level: 'Normal',
      levelColor: 'bg-[#e2e7ff] text-[#004ac6]',
      dotColor: 'bg-[#0053db]',
      condition: 'Sensor array auto-calibration completed',
      status: 'Resolved',
      statusColor: 'bg-[#eaedff] text-[#434655]',
      owner: 'S. Tanaka',
      ownerInitials: 'ST',
      slaMinutes: 2,
      slaTarget: 10,
    },
    {
      id: 201,
      title: 'Differential pressure',
      time: 'Yesterday 18:30',
      level: 'Warning',
      levelColor: 'bg-[#ffdbcd] text-[#943700]',
      dotColor: 'bg-[#943700]',
      condition: 'Filter pressure differential threshold',
      status: 'Resolved',
      statusColor: 'bg-[#eaedff] text-[#434655]',
      owner: 'E. Mitchell',
      ownerInitials: 'EM',
      slaMinutes: 8,
      slaTarget: 10,
    },
    {
      id: 200,
      title: 'Valve recovery cycle',
      time: 'Yesterday 15:10',
      level: 'Advisory',
      levelColor: 'bg-[#d3e4fe] text-[#004ac6]',
      dotColor: 'bg-[#004ac6]',
      condition: 'Solvent recovery unit valve cycle check',
      status: 'Resolved',
      statusColor: 'bg-[#eaedff] text-[#434655]',
      owner: 'P. Krai',
      ownerInitials: 'PK',
      slaMinutes: 4,
      slaTarget: 15,
    },
  ]);

  const [selectedIncident, setSelectedIncident] = useState(incidents[0]);
  const [actionSelection, setActionSelection] = useState('fan-boost');
  const [ownerSelection, setOwnerSelection] = useState('em');
  const [mitigationNote, setMitigationNote] = useState('');
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
    showToast(`Acknowledged Incident #${selectedIncident.id}`);
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
    showToast(`Marked Incident #${selectedIncident.id} as resolved ✓`);
  }

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* ── Top Metric Cards (3-up Summary) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#505f76] uppercase tracking-wider">
              Critical alerts
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
              Active
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
              {criticalCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#505f76] text-[13px] pt-1">
            <span className="text-xs">Immediate action required</span>
            <span className="text-[#004ac6] font-semibold hover:translate-x-0.5 transition-transform cursor-pointer">
              View →
            </span>
          </div>
        </div>

        {/* Warning Thresholds */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#505f76] uppercase tracking-wider">
              Warning thresholds
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdbcd] text-[#943700] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#943700]" />
              Active
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
              {warningCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#505f76] text-[13px] pt-1">
            <span className="text-xs">Threshold advisory</span>
            <span className="text-[#004ac6] font-semibold hover:translate-x-0.5 transition-transform cursor-pointer">
              View →
            </span>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#505f76] uppercase tracking-wider">
              Resolved today
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d3e4fe] text-[#004ac6] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
              Normal
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
              {resolvedCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#505f76] text-[13px] pt-1">
            <span className="text-xs">Logs archived</span>
            <span className="text-[#004ac6] font-semibold hover:translate-x-0.5 transition-transform cursor-pointer">
              View →
            </span>
          </div>
        </div>
      </div>

      {/* ── Incidents Table + Side Action Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Canvas (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm border border-[#eaedff]">
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-2.5">
              <Bell size={20} className="text-[#004ac6]" />
              <h2 className="text-[20px] font-bold text-[#131b2e] tracking-tight">
                Recent incidents
              </h2>
            </div>
            <span className="text-[12px] font-semibold text-[#505f76] uppercase tracking-wider">
              {incidents.length} Events logged
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#505f76] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 rounded-l-xl">Time</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-xl">Owner</th>
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
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${inc.statusColor}`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 rounded-r-xl">
                        <div className="inline-flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#eaedff] text-[#004ac6] text-[10px] font-bold flex items-center justify-center">
                            {inc.ownerInitials}
                          </span>
                          <span className="text-[12px] text-[#505f76] font-medium">
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
        </div>

        {/* Side Panel: Incident Detail with SLA & Owner (col-span-4) */}
        {selectedIncident && (
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-[#eaedff] flex flex-col justify-between">
            <div className="space-y-5">
              {/* Header */}
              <div>
                <h3 className="text-[18px] font-bold text-[#131b2e]">
                  Incident #{selectedIncident.id}: {selectedIncident.title}
                </h3>
                <div className="text-[12px] text-[#505f76] mt-1">
                  {selectedIncident.time} • Level: {selectedIncident.level}
                </div>
              </div>

              {/* SLA Response Card */}
              <div className="bg-[#f2f3ff] p-4 rounded-2xl flex flex-col gap-1.5 border border-[#eaedff]">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#505f76]">SLA Response</span>
                  <span className="text-[#059669] font-bold">
                    {selectedIncident.slaMinutes}m / {selectedIncident.slaTarget}m target
                  </span>
                </div>
                <div className="w-full bg-[#e2e7ff] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#059669] h-full rounded-full"
                    style={{
                      width: `${(selectedIncident.slaMinutes / selectedIncident.slaTarget) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#505f76]">
                  Responded in {selectedIncident.slaMinutes} min • Compliant
                </span>
              </div>

              {/* Action Taken Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider text-[#505f76] font-semibold">
                  Action taken
                </label>
                <div className="relative">
                  <select
                    value={actionSelection}
                    onChange={(e) => setActionSelection(e.target.value)}
                    className="w-full appearance-none bg-[#f2f3ff] text-[#131b2e] rounded-xl py-3 px-4 pr-10 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer border border-[#eaedff]"
                  >
                    <option value="fan-boost">Exhaust fan boosted to 100%</option>
                    <option value="inspection">Manual booth inspection</option>
                    <option value="filter-log">Filter replacement logged</option>
                    <option value="dismiss">False positive dismissed</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#505f76]">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* Owner Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider text-[#505f76] font-semibold">
                  Owner
                </label>
                <div className="relative">
                  <select
                    value={ownerSelection}
                    onChange={(e) => setOwnerSelection(e.target.value)}
                    className="w-full appearance-none bg-[#f2f3ff] text-[#131b2e] rounded-xl py-3 px-4 pr-10 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer border border-[#eaedff]"
                  >
                    <option value="em">E. Mitchell (H&amp;S Officer)</option>
                    <option value="pk">P. Krai (Facility Lead)</option>
                    <option value="st">S. Tanaka (Safety Eng.)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#505f76]">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* Mitigation Note Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider text-[#505f76] font-semibold">
                  Mitigation note
                </label>
                <textarea
                  value={mitigationNote}
                  onChange={(e) => setMitigationNote(e.target.value)}
                  placeholder="Add mitigation note or root-cause details..."
                  rows={3}
                  className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-xl p-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 resize-none border border-[#eaedff]"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleAcknowledge}
                className="flex-1 py-3 px-4 rounded-xl bg-[#eaedff] text-[#131b2e] font-semibold text-[14px] hover:bg-[#dbe1ff] transition-colors cursor-pointer"
              >
                Acknowledge
              </button>
              <button
                type="button"
                onClick={handleResolve}
                className="flex-1 py-3 px-4 rounded-xl bg-[#004ac6] text-white font-semibold text-[14px] shadow-sm hover:bg-[#003ea8] transition-all cursor-pointer"
              >
                Mark resolved
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toastAck && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#131b2e] text-white text-[13px] font-semibold shadow-lg flex items-center gap-2 animate-fadeIn">
          <Check size={16} className="text-[#00CC66]" />
          <span>{toastAck}</span>
        </div>
      )}
    </div>
  );
}
