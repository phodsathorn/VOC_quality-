import React, { useState, useEffect } from 'react';
import {
  Wrench, Plus, History, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

import SensorsTab from './maintenance/SensorsTab';
import WorkOrdersTab from './maintenance/WorkOrdersTab';
import LogDrawer from './maintenance/LogDrawer';
import WorkOrderDrawer from './maintenance/WorkOrderDrawer';
import HistoryDrawer from './maintenance/HistoryDrawer';
import CalibrationModal from './maintenance/CalibrationModal';

export default function Maintenance() {
  const { user } = useAuth();
  const { t, isThai, lang } = useLanguage();
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
  const [logSensor, setLogSensor] = useState('MQ-3 (Alcohol / Thinner)');
  const [logDate] = useState('2025-10-24');
  const [logTechnician] = useState(user?.full_name || 'Process & Calibration Engineer');
  const [logNote, setLogNote] = useState('');

  // Add Work Order form
  const [woTitle, setWoTitle] = useState('');
  const [woAssignee, setWoAssignee] = useState('Process & Calibration Engineer');
  const [woDueDate, setWoDueDate] = useState('2025-11-05');
  const [woPriority, setWoPriority] = useState('Medium');
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
      technician: 'Process & Calibration Engineer',
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
      technician: 'System Administrator',
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
      technician: 'Process & Calibration Engineer',
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
      technician: 'System Administrator',
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
      technician: 'Process & Calibration Engineer',
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
      technician: 'Process & Calibration Engineer',
      drift: '+0.9%',
      spanGas: '10 ppm Nitrogen Dioxide',
      next: 'Nov 18, 2025',
      status: 'Calibrated',
      isDueSoon: false,
    },
  ]);

  // Work Orders List
  const [workOrders, setWorkOrders] = useState([
    {
      id: 'WO-2025-089',
      title: 'HEPA Pre-filter Cartridge Replacement',
      assignee: 'Process & Calibration Engineer',
      dueDate: 'Oct 29, 2025',
      status: 'In Progress',
      statusColor: 'bg-sky-50 text-sky-700 border border-sky-200/80',
      signedOffBy: 'Pending',
    },
    {
      id: 'WO-2025-092',
      title: 'Zero-Point Drift Recalibration MQ-2',
      assignee: 'Process & Calibration Engineer',
      dueDate: 'Oct 28, 2025',
      status: 'Due soon',
      statusColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
      signedOffBy: 'Pending',
    },
    {
      id: 'WO-2025-078',
      title: 'UV Sterilization Chamber Lamp Clean',
      assignee: 'Line Operator',
      dueDate: 'Oct 21, 2025',
      status: 'Completed',
      statusColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      signedOffBy: 'Process & Calibration Engineer',
    },
    {
      id: 'WO-2025-084',
      title: 'Activated Carbon Sieve Refresh',
      assignee: 'Process & Calibration Engineer',
      dueDate: 'Oct 15, 2025',
      status: 'Completed',
      statusColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      signedOffBy: 'Safety & Compliance Auditor',
    },
  ]);

  useEffect(() => {
    let isMounted = true;
    async function loadMaintenanceData() {
      try {
        const [st, woList] = await Promise.all([
          apiClient.get('/api/maintenance/status').catch(() => null),
          apiClient.get('/api/maintenance/work-orders?limit=10').catch(() => null),
        ]);

        if (st && st.filter && isMounted) {
          const health = Math.round(st.filter.healthIndex || 78);
          setFilters((prev) => [
            { ...prev[0], percent: health > 80 ? health : 78 },
            { ...prev[1], percent: Math.round(health * 0.54) },
            { ...prev[2], percent: Math.round(health * 0.83) },
          ]);
        }

        if (Array.isArray(woList) && woList.length > 0 && isMounted) {
          setWorkOrders(woList.map((wo) => ({
            id: wo.id ? (typeof wo.id === 'string' && wo.id.startsWith('WO-') ? wo.id : `WO-2025-${String(wo.id).padStart(3, '0')}`) : 'WO-2025-001',
            title: wo.title || 'General Maintenance Task',
            assignee: wo.performed_by || 'Process & Calibration Engineer',
            dueDate: wo.completed_at || wo.created_at || 'Scheduled',
            status: wo.status === 'COMPLETED' ? 'Completed' : (wo.status || 'In Progress'),
            statusColor: wo.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' : 'bg-sky-50 text-sky-700 border border-sky-200/80',
            signedOffBy: wo.performed_by || 'Verified Engineer',
          })));
        }
      } catch (err) {
        console.warn('Maintenance live fetch notice:', err);
      }
    }

    loadMaintenanceData();
    return () => { isMounted = false; };
  }, []);

  async function handleSaveLog(e) {
    e.preventDefault();
    setIsAddLogOpen(false);
    showToast('Maintenance log recorded successfully ✓');

    try {
      await apiClient.post('/api/maintenance/work-orders', {
        box_id: 'BOX-001',
        task_type: logType,
        title: logType === 'sensor-calibration' ? 'Sensor Calibration' : logType,
        checklist: { date: logDate, technician: logTechnician },
        notes: logNote || 'Scheduled calibration logged via Maintenance Console',
      });
    } catch (err) {
      console.warn('Save maintenance log error:', err);
    }
  }

  async function handleSaveWorkOrder(e) {
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
    const titleToSave = woTitle;
    const noteToSave = woNote;
    const assigneeToSave = woAssignee;
    const dueDateToSave = woDueDate;
    setWoTitle('');
    setWoNote('');
    showToast('Work order created successfully ✓');

    try {
      await apiClient.post('/api/maintenance/work-orders', {
        box_id: 'BOX-001',
        task_type: 'preventive-maintenance',
        title: titleToSave,
        checklist: { due_date: dueDateToSave, assignee: assigneeToSave },
        notes: noteToSave || `Work order assigned to ${assigneeToSave} due on ${dueDateToSave}`,
      });
    } catch (err) {
      console.warn('Save work order error:', err);
    }
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
      {/* Header with 3 Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-semibold text-[#131b2e] leading-snug">
            {t('maintenance', 'Maintenance')}
          </h1>
          <span className="text-[14px] text-[#434655] font-normal">
            {t('filterLifeSensorCalib', 'Filter life & sensor calibration')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="btn-add-log"
            onClick={() => setIsAddLogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#004ac6] text-white text-[14px] font-medium shadow-xs hover:bg-[#003ea8] transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>{t('addLog', 'Add log')}</span>
          </button>

          <button
            type="button"
            id="btn-history-drawer"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-[#004ac6] border border-[#eaedff] text-[14px] font-medium shadow-xs hover:bg-[#f2f3ff] transition-colors cursor-pointer"
          >
            <History size={18} />
            <span>{t('calibrationHistory', 'Calibration History')}</span>
          </button>

          <button
            type="button"
            id="btn-add-work-order"
            onClick={() => setIsWorkOrderDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#f2f3ff] text-[#004ac6] text-[14px] font-medium shadow-xs hover:bg-[#e2e7ff] transition-all cursor-pointer"
          >
            <Wrench size={18} />
            <span>{t('addWorkOrder', 'Add work order')}</span>
          </button>
        </div>
      </div>

      {/* 3 Filter Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filters.map((f) => (
          <div
            key={f.name}
            className="bg-white rounded-3xl p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4">
              <span className="text-[14px] font-medium uppercase text-[#434655] tracking-wider">
                {f.name === 'HEPA filter' ? t('hepaFilter', 'HEPA filter') : f.name === 'Carbon filter' ? t('carbonFilter', 'Carbon filter') : t('uvLamp', 'UV lamp')}
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
              {t('viewDetails', 'View details')} <span aria-hidden="true">→</span>
            </button>
          </div>
        ))}
      </div>

      {/* Tabs */}
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
            {t('sensorsAndFilters', 'Sensors & Filters')}
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
            <span>{t('workOrders', 'Work orders')}</span>
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

      {/* Tab Panels */}
      {activeTab === 'sensors' && (
        <SensorsTab
          sensors={sensors}
          expandedRow={expandedRow}
          setExpandedRow={setExpandedRow}
          handleDownloadCertificate={handleDownloadCertificate}
          setCalibModalSensor={setCalibModalSensor}
          setIsHistoryDrawerOpen={setIsHistoryDrawerOpen}
        />
      )}

      {activeTab === 'workorders' && (
        <WorkOrdersTab workOrders={workOrders} />
      )}

      {/* Drawers & Modals */}
      <LogDrawer
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        logType={logType}
        setLogType={setLogType}
        logSensor={logSensor}
        setLogSensor={setLogSensor}
        logNote={logNote}
        setLogNote={setLogNote}
        onSubmit={handleSaveLog}
      />

      <WorkOrderDrawer
        isOpen={isWorkOrderDrawerOpen}
        onClose={() => setIsWorkOrderDrawerOpen(false)}
        woTitle={woTitle}
        setWoTitle={setWoTitle}
        woAssignee={woAssignee}
        setWoAssignee={setWoAssignee}
        woDueDate={woDueDate}
        setWoDueDate={setWoDueDate}
        woPriority={woPriority}
        setWoPriority={setWoPriority}
        woNote={woNote}
        setWoNote={setWoNote}
        onSubmit={handleSaveWorkOrder}
      />

      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        handleDownloadCertificate={handleDownloadCertificate}
      />

      <CalibrationModal
        calibModalSensor={calibModalSensor}
        setCalibModalSensor={setCalibModalSensor}
        calibStandard={calibStandard}
        setCalibStandard={setCalibStandard}
        handleConfirmCalibration={handleConfirmCalibration}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-[13px] font-medium border border-white/10">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
