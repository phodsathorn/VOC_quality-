import { useState } from 'react';
import {
  Bell, Check, ChevronDown, X, ShieldAlert
} from 'lucide-react';

export default function Alerts() {
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
      status: 'Open',
      statusBg: 'bg-[#ffdad6]',
      statusText: 'text-[#ba1a1a]',
      owner: 'E. Mitchell',
      ownerInitials: 'EM',
      slaMinutes: 6,
      slaTarget: 10,
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
      status: 'Acknowledged',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#54647a]',
      owner: 'P. Krai',
      ownerInitials: 'PK',
      slaMinutes: 3,
      slaTarget: 15,
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
      status: 'Resolved',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#434655]',
      owner: 'S. Tanaka',
      ownerInitials: 'ST',
      slaMinutes: 2,
      slaTarget: 10,
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
      status: 'Resolved',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#434655]',
      owner: 'E. Mitchell',
      ownerInitials: 'EM',
      slaMinutes: 8,
      slaTarget: 10,
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
      status: 'Resolved',
      statusBg: 'bg-[#eaedff]',
      statusText: 'text-[#434655]',
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
  const [viewMode, setViewMode] = useState('standard'); // 'standard' (main_pages) | 'substate' (sub_states with SLA & Owner)

  function showToast(msg) {
    setToastAck(msg);
    setTimeout(() => setToastAck(null), 2500);
  }

  function handleAcknowledge() {
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
  }

  function handleResolve() {
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
  }

  function resetDrawer() {
    setSelectedIncident(null);
  }

  return (
    <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
      {/* ── Top Metric Cards (3-up Summary) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white rounded-3xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#434655] uppercase tracking-wider">
              Critical
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
              0 Active
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
              0
            </span>
          </div>
          <div className="flex items-center justify-between text-[#434655] text-[13px] pt-1">
            <span className="text-xs text-[#434655]">Immediate action req.</span>
            <span className="text-[#004ac6] font-medium hover:translate-x-0.5 transition-transform cursor-pointer">
              View →
            </span>
          </div>
        </div>

        {/* Warning Thresholds */}
        <div className="bg-white rounded-3xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#434655] uppercase tracking-wider">
              Warning
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdbcd] text-[#943700] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#943700]" />
              1 Pending
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
              1
            </span>
          </div>
          <div className="flex items-center justify-between text-[#434655] text-[13px] pt-1">
            <span className="text-xs text-[#434655]">Threshold advisory</span>
            <span className="text-[#004ac6] font-medium hover:translate-x-0.5 transition-transform cursor-pointer">
              View →
            </span>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white rounded-3xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#434655] uppercase tracking-wider">
              Resolved today
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d3e4fe] text-[#004ac6] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
              Normal
            </span>
          </div>
          <div className="my-2">
            <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
              5
            </span>
          </div>
          <div className="flex items-center justify-between text-[#434655] text-[13px] pt-1">
            <span className="text-xs text-[#434655]">Logs archived</span>
            <span className="text-[#004ac6] font-medium hover:translate-x-0.5 transition-transform cursor-pointer">
              View →
            </span>
          </div>
        </div>
      </div>

      {/* ── Incidents Table + Side Action Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Canvas (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-xs border border-[#eaedff]">
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 flex items-center justify-center text-[#004ac6]">
                <Bell size={20} className="fill-[#004ac6]/10" />
              </span>
              <h2 className="text-[20px] font-semibold text-[#131b2e] tracking-tight">
                Recent incidents
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* View Switcher: Standard vs Sub-State (SLA & Owner) */}
              <div className="inline-flex items-center p-1 rounded-xl bg-[#f2f3ff] border border-[#eaedff] text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('standard')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'standard'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('substate')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'substate'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  SLA &amp; Owner
                </button>
              </div>

              <span className="text-[12px] font-medium text-[#434655] uppercase tracking-wider">
                5 Events logged
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#434655] text-[12px] uppercase tracking-wider font-medium">
                  <th className="py-3 px-4 rounded-l-2xl">Time</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className={`py-3 px-4 ${viewMode === 'standard' ? 'rounded-r-2xl' : ''}`}>
                    Status
                  </th>
                  {viewMode === 'substate' && (
                    <th className="py-3 px-4 rounded-r-2xl">Owner</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {incidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`group cursor-pointer transition-colors rounded-2xl ${
                        isSelected
                          ? 'bg-[#e2e7ff]'
                          : 'hover:bg-[#f2f3ff]'
                      }`}
                    >
                      <td className="py-4 px-4 font-medium text-[#131b2e] rounded-l-2xl tabular-nums whitespace-nowrap">
                        {inc.time}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${inc.levelBg} ${inc.levelText}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${inc.dotBg}`} />
                          {inc.level}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#131b2e] font-normal">{inc.condition}</td>
                      <td className={`py-4 px-4 whitespace-nowrap ${viewMode === 'standard' ? 'rounded-r-2xl' : ''}`}>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${inc.statusBg} ${inc.statusText}`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      {viewMode === 'substate' && (
                        <td className="py-4 px-4 rounded-r-2xl whitespace-nowrap">
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
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Action Taken / Incident Details (col-span-4) */}
        <div
          className="lg:col-span-4 bg-white rounded-3xl p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between transition-all duration-300"
          id="incident-drawer"
        >
          <div>
            {/* Header + Close button */}
            <div className="flex items-start justify-between pb-4">
              <div className="flex flex-col">
                <h3 className="text-[18px] font-semibold text-[#131b2e] leading-snug">
                  {selectedIncident
                    ? selectedIncident.title
                    : 'Powder Coating Line Alerts'}
                </h3>
                <span className="text-[14px] text-[#434655] mt-1 font-normal">
                  {selectedIncident
                    ? selectedIncident.meta
                    : 'Select an incident from the log'}
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

            {/* Sub-State SLA Card (only shown in substate mode) */}
            {viewMode === 'substate' && selectedIncident && (
              <div className="mt-4 bg-[#f2f3ff] p-3 rounded-2xl flex flex-col gap-1.5 border border-[#eaedff]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#434655]">SLA Response</span>
                  <span className="text-[#059669] font-semibold">
                    {selectedIncident.slaMinutes}m / {selectedIncident.slaTarget}m target
                  </span>
                </div>
                <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#059669] h-full rounded-full"
                    style={{
                      width: `${(selectedIncident.slaMinutes / selectedIncident.slaTarget) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#434655]">
                  Responded in {selectedIncident.slaMinutes} min • Compliant
                </span>
              </div>
            )}

            {/* Action Taken Select */}
            <div className="mt-6 flex flex-col gap-1.5">
              <label
                className="text-[12px] uppercase tracking-wider text-[#434655] font-medium"
                htmlFor="incident-action"
              >
                Action taken
              </label>
              <div className="relative">
                <select
                  id="incident-action"
                  value={actionSelection}
                  onChange={(e) => setActionSelection(e.target.value)}
                  className="w-full appearance-none bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 pr-10 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                >
                  <option value="fan-boost">Exhaust fan boosted to 100%</option>
                  <option value="inspection">Manual booth inspection</option>
                  <option value="filter-log">Filter replacement logged</option>
                  <option value="dismiss">False positive dismissed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#434655]">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Sub-State: Owner Select & Mitigation Note (only in substate mode) */}
            {viewMode === 'substate' && (
              <>
                <div className="mt-4 flex flex-col gap-1.5">
                  <label
                    className="text-[12px] uppercase tracking-wider text-[#434655] font-medium"
                    htmlFor="incident-owner"
                  >
                    Owner
                  </label>
                  <div className="relative">
                    <select
                      id="incident-owner"
                      value={ownerSelection}
                      onChange={(e) => setOwnerSelection(e.target.value)}
                      className="w-full appearance-none bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 pr-10 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                    >
                      <option value="em">E. Mitchell (H&amp;S Officer)</option>
                      <option value="pk">P. Krai (Facility Lead)</option>
                      <option value="st">S. Tanaka (Safety Eng.)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#434655]">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                  <label
                    className="text-[12px] uppercase tracking-wider text-[#434655] font-medium"
                    htmlFor="incident-note"
                  >
                    Mitigation note
                  </label>
                  <textarea
                    id="incident-note"
                    value={mitigationNote}
                    onChange={(e) => setMitigationNote(e.target.value)}
                    placeholder="Add mitigation note or root-cause details..."
                    rows={3}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl p-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={selectedIncident?.status === 'Acknowledged' || selectedIncident?.status === 'Resolved'}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#eaedff] text-[#131b2e] font-medium text-[14px] hover:bg-[#e2e7ff] transition-colors text-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {selectedIncident?.status === 'Acknowledged' ? 'Acknowledged' : 'Acknowledge'}
            </button>
            <button
              type="button"
              onClick={handleResolve}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#2563eb] text-white font-medium text-[14px] shadow-xs hover:opacity-95 transition-all text-center cursor-pointer"
            >
              {selectedIncident?.status === 'Resolved' ? 'Resolved ✓' : 'Mark resolved'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastAck && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#131b2e] text-white text-[13px] font-medium shadow-lg flex items-center gap-2 animate-fadeIn">
          <Check size={16} className="text-[#00CC66]" />
          <span>{toastAck}</span>
        </div>
      )}
    </div>
  );
}
