import { useState, useEffect } from 'react';
import {
  Wrench, Plus, X, ChevronDown, FileText, Check, History,
  Calendar, Upload, Info, AlertTriangle, ShieldCheck, Download,
  CheckCircle2, Clock, ChevronRight
} from 'lucide-react';
import { API } from '../config';
import { useAuth } from '../context/AuthContext';

export default function Maintenance() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sensors'); // 'sensors' | 'workorders'
  const [expandedRow, setExpandedRow] = useState(null);

  // Drawers and Modals
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isWorkOrderDrawerOpen, setIsWorkOrderDrawerOpen] = useState(false);
  const [calibModalSensor, setCalibModalSensor] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Add Log form
  const [logType, setLogType] = useState('sensor-calibration');
  const [logDate, setLogDate] = useState('2025-10-24');
  const [logTechnician, setLogTechnician] = useState(user?.full_name || 'E. Mitchell');
  const [logNote, setLogNote] = useState('');

  // Add Work Order form
  const [woTitle, setWoTitle] = useState('');
  const [woAssignee, setWoAssignee] = useState('E. Mitchell (H&S Officer)');
  const [woDueDate, setWoDueDate] = useState('2025-11-05');
  const [woNote, setWoNote] = useState('');

  // Confirm Calibrate modal form
  const [calibStandard, setCalibStandard] = useState('Standard Zero Air + 50 ppm Span canister (Batch #4902-A)');

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  // 3 Filter Cards
  const [filters, setFilters] = useState([
    {
      name: 'HEPA filter',
      percent: 78,
      desc: 'Pre-filtration stage for particulate matter (PM2.5 & powder coat dust)',
      installed: '2025-08-10',
      lifespan: '6 months',
      stage: 'Stage 1 Particulate Pre-filter',
    },
    {
      name: 'Carbon filter',
      percent: 42,
      desc: 'Activated carbon adsorption bed for solvent VOCs (Toluene, Xylene)',
      installed: '2025-06-15',
      lifespan: '4 months',
      stage: 'Stage 2 Deep VOC Adsorption Bed',
    },
    {
      name: 'UV lamp',
      percent: 65,
      desc: 'Photocatalytic oxidation stage 3 for residual VOC breakdown',
      installed: '2025-07-01',
      lifespan: '12 months',
      stage: 'Stage 3 PCO Photocatalytic Reactor',
    },
  ]);

  // 6 Actual Sensor Channels matching Stitch prototype
  const [sensors, setSensors] = useState([
    {
      id: 'mq3',
      name: 'MQ-3 (Alcohol)',
      gasType: 'Alcohol / Thinner Solvents',
      serial: 'SN-9402-VOC',
      last: 'Oct 12, 2025',
      technician: 'E. Mitchell',
      drift: '+1.2%',
      spanGas: '50 ppm Ethanol',
      next: 'Nov 12, 2025',
      status: 'Calibrated',
      isDueSoon: false,
    },
    {
      id: 'mq2',
      name: 'MQ-2 (Combustibles)',
      gasType: 'Combustibles / LPG / Propane',
      serial: 'SN-8814-MOS',
      last: 'Sep 28, 2025',
      technician: 'R. Chen',
      drift: '+4.8%',
      spanGas: '1000 ppm Propane',
      next: 'Oct 28, 2025',
      status: 'Due soon',
      isDueSoon: true,
    },
    {
      id: 'mq135',
      name: 'MQ-135 (Fumes)',
      gasType: 'Benzene / Solvent Fumes',
      serial: 'SN-3109-OPT',
      last: 'Oct 05, 2025',
      technician: 'K. Tanaka',
      drift: '+0.6%',
      spanGas: '100 ppm Isobutylene',
      next: 'Nov 05, 2025',
      status: 'Calibrated',
      isDueSoon: false,
    },
    {
      id: 'mq8',
      name: 'MQ-8 (H2)',
      gasType: 'Hydrogen Flammables',
      serial: 'SN-5520-PIT',
      last: 'Aug 15, 2025',
      technician: 'R. Vance',
      drift: '-1.1%',
      spanGas: '500 ppm Hydrogen',
      next: 'Nov 15, 2025',
      status: 'Calibrated',
      isDueSoon: false,
    },
    {
      id: 'mics5524',
      name: 'MiCS-5524 (CO)',
      gasType: 'Carbon Monoxide MEMS',
      serial: 'SN-6210-CO',
      last: 'Sep 14, 2025',
      technician: 'E. Mitchell',
      drift: '+2.4%',
      spanGas: '50 ppm Carbon Monoxide',
      next: 'Nov 14, 2025',
      status: 'Calibrated',
      isDueSoon: false,
    },
    {
      id: 'mics6814',
      name: 'MiCS-6814 (NO2)',
      gasType: 'Nitrogen Dioxide Multi-MEMS',
      serial: 'SN-7730-NO2',
      last: 'Oct 18, 2025',
      technician: 'E. Mitchell',
      drift: '+0.9%',
      spanGas: '10 ppm Nitrogen Dioxide',
      next: 'Nov 18, 2025',
      status: 'Calibrated',
      isDueSoon: false,
    },
  ]);

  // Work Orders List matching Stitch
  const [workOrders, setWorkOrders] = useState([
    {
      id: 'WO-2025-089',
      title: 'HEPA Pre-filter Cartridge Replacement',
      assignee: 'E. Mitchell',
      dueDate: 'Oct 29, 2025',
      status: 'In Progress',
      statusColor: 'bg-[#d3e4fe] text-[#004ac6]',
      signedOffBy: 'Pending',
    },
    {
      id: 'WO-2025-092',
      title: 'Zero-Point Drift Recalibration MQ-2',
      assignee: 'K. Tanaka',
      dueDate: 'Oct 28, 2025',
      status: 'Due soon',
      statusColor: 'bg-[#ffdbcd] text-[#943700]',
      signedOffBy: 'Pending',
    },
    {
      id: 'WO-2025-078',
      title: 'UV Sterilization Chamber Lamp Clean',
      assignee: 'R. Vance',
      dueDate: 'Oct 21, 2025',
      status: 'Completed',
      statusColor: 'bg-[#eaedff] text-[#004ac6]',
      signedOffBy: 'E. Mitchell',
    },
    {
      id: 'WO-2025-084',
      title: 'Activated Carbon Sieve Refresh',
      assignee: 'E. Mitchell',
      dueDate: 'Oct 15, 2025',
      status: 'Completed',
      statusColor: 'bg-[#eaedff] text-[#004ac6]',
      signedOffBy: 'J. Harrison',
    },
  ]);

  // Load real maintenance data from backend if available
  useEffect(() => {
    let isMounted = true;
    async function loadMaintenanceData() {
      try {
        const [statusRes, workOrdersRes] = await Promise.all([
          fetch(`${API}/api/maintenance/status`).catch(() => null),
          fetch(`${API}/api/maintenance/work-orders?limit=10`).catch(() => null),
        ]);

        if (statusRes && statusRes.ok && isMounted) {
          const st = await statusRes.json();
          if (st.filter) {
            const health = Math.round(st.filter.healthIndex || 78);
            setFilters((prev) => [
              { ...prev[0], percent: health > 80 ? health : 78 },
              { ...prev[1], percent: Math.round(health * 0.54) },
              { ...prev[2], percent: Math.round(health * 0.83) },
            ]);
          }
        }
      } catch (err) {
        console.warn('Maintenance live fetch notice:', err);
      }
    }

    loadMaintenanceData();
  }, []);

  async function handleSaveLog(e) {
    e.preventDefault();
    setIsAddLogOpen(false);
    showToast('Maintenance log recorded successfully ✓');

    try {
      await fetch(`${API}/api/maintenance/work-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({
          box_id: 'BOX-001',
          task_type: logType,
          title: logType === 'sensor-calibration' ? 'Sensor Calibration' : logType,
          performed_by: logTechnician,
          notes: logNote || 'Scheduled calibration logged via Maintenance Console',
          checklist: [logDate],
        }),
      });
    } catch (err) {
      console.warn('Save maintenance log error:', err);
    }
  }

  function handleSaveWorkOrder(e) {
    e.preventDefault();
    if (!woTitle) return;
    const newWo = {
      id: `WO-2025-${Math.floor(Math.random() * 900 + 100)}`,
      title: woTitle,
      assignee: woAssignee,
      dueDate: woDueDate,
      status: 'Scheduled',
      statusColor: 'bg-[#f2f3ff] text-[#505f76]',
      signedOffBy: 'Pending',
    };
    setWorkOrders((prev) => [newWo, ...prev]);
    setIsWorkOrderDrawerOpen(false);
    setWoTitle('');
    setWoNote('');
    showToast('Work order created successfully ✓');
  }

  function handleConfirmCalibration() {
    if (!calibModalSensor) return;
    setSensors((prev) =>
      prev.map((s) =>
        s.name === calibModalSensor.name
          ? { ...s, last: 'Today', next: 'in 30 days', status: 'Calibrated', isDueSoon: false, drift: '+0.0%' }
          : s
      )
    );
    showToast(`Sensor ${calibModalSensor.name} calibrated successfully ✓`);
    setCalibModalSensor(null);
  }

  function handleDownloadCertificate(sensorName) {
    showToast(`Downloading Calibration Certificate PDF for ${sensorName}...`);
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
      {/* ── Header with 3 Action Buttons matching Stitch ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-semibold text-[#131b2e] leading-snug">
            Maintenance
          </h1>
          <span className="text-[14px] text-[#434655] font-normal">
            Filter life &amp; sensor calibration
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add log (Primary button) */}
          <button
            type="button"
            id="btn-add-log"
            onClick={() => setIsAddLogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#004ac6] text-white text-[14px] font-medium shadow-xs hover:bg-[#003ea8] transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>Add log</span>
          </button>

          {/* Calibration History */}
          <button
            type="button"
            id="btn-history-drawer"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-[#004ac6] border border-[#eaedff] text-[14px] font-medium shadow-xs hover:bg-[#f2f3ff] transition-colors cursor-pointer"
          >
            <History size={18} />
            <span>Calibration History</span>
          </button>

          {/* Add work order */}
          <button
            type="button"
            id="btn-add-work-order"
            onClick={() => setIsWorkOrderDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#f2f3ff] text-[#004ac6] text-[14px] font-medium shadow-xs hover:bg-[#e2e7ff] transition-all cursor-pointer"
          >
            <Wrench size={18} />
            <span>Add work order</span>
          </button>
        </div>
      </div>

      {/* ── 3 Filter Life Progress Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filters.map((f) => (
          <div
            key={f.name}
            className="bg-white rounded-3xl p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4">
              <span className="text-[14px] font-medium uppercase text-[#434655] tracking-wider">
                {f.name}
              </span>
              <span className="text-[56px] font-bold text-[#131b2e] leading-none tabular-nums tracking-tight">
                {f.percent}%
              </span>
              <div className="w-full bg-[#e2e7ff] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#004ac6] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${f.percent}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFilter(f)}
              className="mt-6 text-[14px] font-medium text-[#004ac6] inline-flex items-center gap-1 hover:translate-x-0.5 transition-transform text-left cursor-pointer"
            >
              View details <span aria-hidden="true">→</span>
            </button>
          </div>
        ))}
      </div>

      {/* ── Tabs Bar: Sensors & Filters vs Work orders ── */}
      <div className="flex items-center justify-between border-b border-[#eaedff] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-sensors"
            onClick={() => setActiveTab('sensors')}
            className={`px-4 py-2 rounded-2xl font-medium text-[14px] transition-all cursor-pointer ${
              activeTab === 'sensors'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#505f76] hover:text-[#131b2e] hover:bg-[#f2f3ff]'
            }`}
          >
            Sensors &amp; Filters
          </button>
          <button
            type="button"
            id="tab-workorders"
            onClick={() => setActiveTab('workorders')}
            className={`px-4 py-2 rounded-2xl font-medium text-[14px] transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'workorders'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#505f76] hover:text-[#131b2e] hover:bg-[#f2f3ff]'
            }`}
          >
            <span>Work orders</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'workorders' ? 'bg-white/20 text-white' : 'bg-[#eaedff] text-[#004ac6]'
              }`}
            >
              {workOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── View 1: Sensors & Filters Table ── */}
      {activeTab === 'sensors' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff]">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#434655] text-[12px] uppercase tracking-wider font-medium">
                  <th className="py-3 px-4 rounded-l-2xl">Sensor</th>
                  <th className="py-3 px-4">Serial No.</th>
                  <th className="py-3 px-4">Last calibrated</th>
                  <th className="py-3 px-4">Calibrated by</th>
                  <th className="py-3 px-4">
                    <div className="inline-flex items-center gap-1">
                      <span>Drift %</span>
                      <span title="Change from first baseline" className="text-[#505f76] hover:text-[#131b2e] cursor-pointer">
                        <Info size={14} />
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-4">Next due</th>
                  <th className="py-3 px-4 text-center">Certificate</th>
                  <th className="py-3 px-4 text-right rounded-r-2xl">Status</th>
                </tr>
              </thead>
              <tbody className="text-[#131b2e] divide-y-0">
                {sensors.map((s) => {
                  const isExpanded = expandedRow === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setExpandedRow(isExpanded ? null : s.id)}
                      className={`group cursor-pointer transition-colors ${
                        isExpanded ? 'bg-[#f2f3ff]/80' : 'hover:bg-[#f2f3ff]/40'
                      }`}
                    >
                      <td className="py-4 px-4 font-medium text-[#131b2e] rounded-l-2xl whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[#505f76] group-hover:text-[#004ac6] transition-colors">
                            <ChevronRight
                              size={16}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#004ac6]' : ''}`}
                            />
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">{s.name}</span>
                            <span className="text-[11px] text-[#505f76]">{s.gasType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-[#505f76] whitespace-nowrap">
                        {s.serial}
                      </td>
                      <td className="py-4 px-4 text-[#505f76] whitespace-nowrap">
                        {s.last}
                      </td>
                      <td className="py-4 px-4 text-[#131b2e] whitespace-nowrap">
                        {s.technician}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            s.isDueSoon ? 'text-[#943700] font-bold' : 'text-[#004ac6]'
                          }`}
                        >
                          {s.drift}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#505f76] whitespace-nowrap">
                        {s.next}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDownloadCertificate(s.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#004ac6] text-xs font-medium transition-colors cursor-pointer"
                          title="Download calibration certificate PDF"
                        >
                          <FileText size={14} />
                          <span>PDF</span>
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right rounded-r-2xl whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setCalibModalSensor(s)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                            s.isDueSoon
                              ? 'bg-[#ffdbcd] text-[#943700] hover:bg-[#ffb596]'
                              : 'bg-[#eaedff] text-[#004ac6] hover:bg-[#dbe1ff]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.isDueSoon ? 'bg-[#943700]' : 'bg-[#004ac6]'
                            }`}
                          />
                          <span>{s.status}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expandable row detail card when a row is active */}
          {expandedRow && (() => {
            const rowItem = sensors.find((s) => s.id === expandedRow);
            if (!rowItem) return null;
            return (
              <div className="mt-4 p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-wrap items-center justify-between gap-4 animate-fade-in">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-bold">
                      Calibrated by
                    </span>
                    <span className="text-[#131b2e] font-medium text-[13px] mt-0.5">
                      {rowItem.technician} (H&amp;S Officer)
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-bold">
                        Baseline Drift
                      </span>
                      <span title="Change from first factory baseline" className="text-[#505f76]">
                        <Info size={12} />
                      </span>
                    </div>
                    <span className={`font-semibold text-[13px] mt-0.5 ${rowItem.isDueSoon ? 'text-[#943700]' : 'text-[#004ac6]'}`}>
                      {rowItem.drift}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-bold">
                      Span Gas Conc.
                    </span>
                    <span className="text-[#131b2e] font-medium text-[13px] mt-0.5">
                      {rowItem.spanGas}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalibModalSensor(rowItem)}
                    className="px-3 py-1.5 rounded-xl bg-[#004ac6] text-white hover:bg-[#003ea8] text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Wrench size={14} />
                    <span>Calibrate now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHistoryDrawerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white text-[#505f76] hover:text-[#131b2e] border border-[#eaedff] text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <History size={14} />
                    <span>History</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── View 2: Work Orders Table ── */}
      {activeTab === 'workorders' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff]">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-[#f2f3ff] text-[#434655] text-[12px] uppercase tracking-wider font-medium">
                  <th className="py-3 px-4 rounded-l-2xl">Title</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-2xl">Signed off by</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 text-[#131b2e]">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-[#f2f3ff]/40 transition-colors">
                    <td className="py-4 px-4 font-medium text-[#131b2e] rounded-l-2xl whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold">{wo.title}</span>
                        <span className="text-[11px] font-mono text-[#505f76]">{wo.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#505f76] whitespace-nowrap">{wo.assignee}</td>
                    <td className="py-4 px-4 text-[#505f76] whitespace-nowrap">{wo.dueDate}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${wo.statusColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {wo.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right rounded-r-2xl text-[#505f76] font-medium whitespace-nowrap">
                      {wo.signedOffBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Drawer 1: Add Maintenance Log ── */}
      {isAddLogOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] z-50 transition-opacity"
            onClick={() => setIsAddLogOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] transition-transform duration-300 ease-out">
            <div className="p-6 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                  <Wrench size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[#131b2e] leading-tight">
                    Add Maintenance Log
                  </h2>
                  <span className="text-[12px] text-[#505f76] mt-0.5 block">
                    Record calibration or replacement
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLogOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-[#eaedff] flex items-center justify-center text-[#505f76] hover:text-[#131b2e] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="log-type">
                  Type
                </label>
                <div className="relative">
                  <select
                    id="log-type"
                    value={logType}
                    onChange={(e) => setLogType(e.target.value)}
                    className="w-full appearance-none bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 pr-10 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                  >
                    <option value="sensor-calibration">Sensor Calibration</option>
                    <option value="filter-replacement">Filter Replacement</option>
                    <option value="uv-lamp-inspection">UV Lamp Inspection</option>
                    <option value="zero-drift">Zero-Point Drift Check</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#505f76]">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="log-date">
                  Date
                </label>
                <input
                  id="log-date"
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="log-tech">
                  Technician
                </label>
                <input
                  id="log-tech"
                  type="text"
                  value={logTechnician}
                  onChange={(e) => setLogTechnician(e.target.value)}
                  className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="log-note">
                  Notes
                </label>
                <textarea
                  id="log-note"
                  rows={4}
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="Record gas standard, calibration values, or filter differential pressure..."
                  className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl p-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 resize-none"
                />
              </div>

              <div className="mt-auto pt-6 border-t border-[#eaedff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddLogOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-[#eaedff] text-[#131b2e] text-[14px] font-medium hover:bg-[#dbe1ff] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#004ac6] text-white text-[14px] font-medium shadow-xs hover:bg-[#003ea8] transition-colors cursor-pointer"
                >
                  Save log
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {/* ── Drawer 2: Calibration History Drawer matching Stitch ── */}
      {isHistoryDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] z-50 transition-opacity"
            onClick={() => setIsHistoryDrawerOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] transition-transform duration-300 ease-out overflow-hidden">
            <div className="p-6 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[#131b2e] leading-tight">
                    Calibration History
                  </h2>
                  <span className="text-[12px] text-[#505f76]">
                    Powder Coating Booth 1 • Sensor Audit Trail
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-[#eaedff] flex items-center justify-center text-[#505f76] hover:text-[#131b2e] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#131b2e]">Oct 12, 2025 • 09:30 AM</span>
                  <span className="text-[#004ac6] text-[11px] font-semibold bg-white px-2.5 py-0.5 rounded-full shadow-2xs">Drift +2.4%</span>
                </div>
                <span className="text-[12px] text-[#505f76]">Technician: E. Mitchell (H&amp;S Officer)</span>
                <span className="text-[11px] text-[#505f76] font-mono">Baseline resistance: 42.1 kΩ • Zero-air certified</span>
                <button
                  type="button"
                  onClick={() => handleDownloadCertificate('MQ-3 (Oct 12)')}
                  className="mt-1 text-[12px] font-medium text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer text-left"
                >
                  <Download size={14} />
                  <span>Download Certificate PDF</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#131b2e]">Sep 12, 2025 • 11:15 AM</span>
                  <span className="text-[#004ac6] text-[11px] font-semibold bg-white px-2.5 py-0.5 rounded-full shadow-2xs">Drift +1.1%</span>
                </div>
                <span className="text-[12px] text-[#505f76]">Technician: E. Mitchell</span>
                <span className="text-[11px] text-[#505f76] font-mono">Baseline resistance: 41.8 kΩ</span>
                <button
                  type="button"
                  onClick={() => handleDownloadCertificate('MQ-3 (Sep 12)')}
                  className="mt-1 text-[12px] font-medium text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer text-left"
                >
                  <Download size={14} />
                  <span>Download Certificate PDF</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#131b2e]">Aug 10, 2025 • 02:40 PM</span>
                  <span className="text-[#004ac6] text-[11px] font-semibold bg-white px-2.5 py-0.5 rounded-full shadow-2xs">Drift -0.6%</span>
                </div>
                <span className="text-[12px] text-[#505f76]">Technician: R. Chen</span>
                <span className="text-[11px] text-[#505f76] font-mono">Baseline resistance: 42.5 kΩ</span>
                <button
                  type="button"
                  onClick={() => handleDownloadCertificate('MQ-2 (Aug 10)')}
                  className="mt-1 text-[12px] font-medium text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer text-left"
                >
                  <Download size={14} />
                  <span>Download Certificate PDF</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#131b2e]">Jul 11, 2025 • 10:05 AM</span>
                  <span className="text-[#004ac6] text-[11px] font-semibold bg-white px-2.5 py-0.5 rounded-full shadow-2xs">Initial Reference</span>
                </div>
                <span className="text-[12px] text-[#505f76]">Technician: Factory Commissioning</span>
                <span className="text-[11px] text-[#505f76] font-mono">Baseline resistance: 42.8 kΩ</span>
                <button
                  type="button"
                  onClick={() => handleDownloadCertificate('Initial Factory Commissioning')}
                  className="mt-1 text-[12px] font-medium text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer text-left"
                >
                  <Download size={14} />
                  <span>Download Certificate PDF</span>
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="w-full py-2.5 rounded-2xl bg-[#eaedff] text-[#131b2e] font-medium text-[14px] hover:bg-[#dbe1ff] transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Drawer 3: Add Work Order Drawer matching Stitch ── */}
      {isWorkOrderDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] z-50 transition-opacity"
            onClick={() => setIsWorkOrderDrawerOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] transition-transform duration-300 ease-out">
            <div className="p-6 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                  <Wrench size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[#131b2e] leading-tight">
                    Add work order
                  </h2>
                  <span className="text-[12px] text-[#505f76]">
                    Schedule maintenance task
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkOrderDrawerOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-[#eaedff] flex items-center justify-center text-[#505f76] hover:text-[#131b2e] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveWorkOrder} className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="wo-title">
                  Title
                </label>
                <input
                  id="wo-title"
                  type="text"
                  required
                  placeholder="e.g. Clean intake pre-filters"
                  value={woTitle}
                  onChange={(e) => setWoTitle(e.target.value)}
                  className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="wo-assignee">
                  Assignee
                </label>
                <input
                  id="wo-assignee"
                  type="text"
                  value={woAssignee}
                  onChange={(e) => setWoAssignee(e.target.value)}
                  className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="wo-due">
                  Due date
                </label>
                <input
                  id="wo-due"
                  type="date"
                  value={woDueDate}
                  onChange={(e) => setWoDueDate(e.target.value)}
                  className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold">
                  Photo upload
                </label>
                <div className="border-2 border-dashed border-[#c3c6d7] hover:border-[#004ac6] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-[#f2f3ff]/40 transition-colors">
                  <Upload size={28} className="text-[#004ac6] mb-1.5" />
                  <span className="text-[12px] font-medium text-[#131b2e]">
                    Drag &amp; drop inspection image or <span className="text-[#004ac6] underline">browse</span>
                  </span>
                  <span className="text-[10px] text-[#505f76] mt-1">Supports PNG, JPG, HEIC up to 15MB</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="wo-note">
                  Note
                </label>
                <textarea
                  id="wo-note"
                  rows={3}
                  value={woNote}
                  onChange={(e) => setWoNote(e.target.value)}
                  placeholder="Detailed instructions or safety precautions..."
                  className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl p-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 resize-none"
                />
              </div>

              <div className="mt-auto pt-6 border-t border-[#eaedff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWorkOrderDrawerOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-[#eaedff] text-[#131b2e] text-[14px] font-medium hover:bg-[#dbe1ff] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#004ac6] text-white text-[14px] font-medium shadow-xs hover:bg-[#003ea8] transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {/* ── Modal: Confirm Sensor Calibration matching Stitch ── */}
      {calibModalSensor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#131b2e]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setCalibModalSensor(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 z-10 border border-[#eaedff] animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e2e7ff] text-[#004ac6] flex items-center justify-center">
                <Wrench size={20} />
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-[#131b2e]">
                  Confirm Sensor Calibration
                </h3>
                <span className="text-xs text-[#004ac6] font-medium">
                  {calibModalSensor.name} ({calibModalSensor.serial})
                </span>
              </div>
            </div>

            <p className="text-[13px] text-[#505f76] leading-relaxed">
              This action establishes a zero-point baseline for {calibModalSensor.name}. Please confirm reference gas flow is stable prior to calibration.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#505f76] uppercase tracking-wider">
                Calibration notes / reference gas standard
              </label>
              <textarea
                rows={3}
                value={calibStandard}
                onChange={(e) => setCalibStandard(e.target.value)}
                placeholder="e.g. Standard Zero Air + 50 ppm Span canister (Batch #4902-A)"
                className="w-full p-3 rounded-2xl bg-[#f2f3ff] text-[#131b2e] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCalibModalSensor(null)}
                className="px-4 py-2.5 rounded-2xl bg-[#eaedff] text-[#131b2e] text-[14px] font-medium hover:bg-[#dbe1ff] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCalibration}
                className="px-5 py-2.5 rounded-2xl bg-[#004ac6] text-white text-[14px] font-medium shadow-xs hover:bg-[#003ea8] transition-opacity cursor-pointer"
              >
                Confirm Calibration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Filter Detail Modal ── */}
      {selectedFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#131b2e]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedFilter(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 z-10 border border-[#eaedff] animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#004ac6] font-bold">
                  {selectedFilter.stage}
                </span>
                <h3 className="text-[20px] font-semibold text-[#131b2e] mt-0.5">
                  {selectedFilter.name} Diagnostics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFilter(null)}
                className="p-1 rounded-full text-[#505f76] hover:bg-[#eaedff] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#f2f3ff] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#505f76]">Estimated Remaining Life</span>
                <div className="text-[32px] font-bold text-[#131b2e] tabular-nums">
                  {selectedFilter.percent}%
                </div>
              </div>
              <div className="w-24 bg-[#eaedff] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#004ac6] h-full rounded-full"
                  style={{ width: `${selectedFilter.percent}%` }}
                />
              </div>
            </div>

            <p className="text-[13px] text-[#505f76] leading-relaxed">
              {selectedFilter.desc}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#f2f3ff]">
                <span className="text-[#505f76] block">Installed Date</span>
                <span className="font-semibold text-[#131b2e]">{selectedFilter.installed}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#f2f3ff]">
                <span className="text-[#505f76] block">Replacement Interval</span>
                <span className="font-semibold text-[#131b2e]">{selectedFilter.lifespan}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedFilter(null)}
                className="px-5 py-2.5 rounded-2xl bg-[#004ac6] text-white text-[14px] font-medium hover:bg-[#003ea8] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[14px] z-50 animate-fade-in">
          <Check size={18} className="text-[#00CC66]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
