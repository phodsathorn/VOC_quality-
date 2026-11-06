import { useState } from 'react';
import {
  Check, Sliders, Bell, Users, Clock, Settings as SettingsIcon,
  Eye, EyeOff, Send, UserPlus, Volume2, VolumeX, ShieldAlert,
  Flame, Wind, Activity, MoreVertical, Trash2
} from 'lucide-react';
import { getThresholds, saveThresholds } from '../utils/settings';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('thresholds');
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('ESP32 Node 01');

  // Tab 1: Thresholds
  const [thresholds, setThresholds] = useState({
    mq3: { warn: 400, crit: 750, duration: 5, hyst: 20 },
    mq2: { warn: 500, crit: 900, duration: 5, hyst: 25 },
    mq135: { warn: 350, crit: 700, duration: 5, hyst: 15 },
    mq8: { warn: 200, crit: 500, duration: 5, hyst: 10 },
    mics: { warn: 300, crit: 600, duration: 5, hyst: 15 },
    ccs811: { warn: 120, crit: 250, duration: 5, hyst: 10 },
    pm25: { warn: 37.5, crit: 75.0, duration: 10, hyst: 5 },
  });

  // Tab 2: Notifications
  const [lineConfig, setLineConfig] = useState({
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token1234567890',
    secret: '88fbc91024e039bf41098cb7290192',
    groupId: 'C9814421b8c9104ef1092',
  });
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Tab 3: SLA
  const [sla, setSla] = useState({
    warningMinutes: 10,
    criticalMinutes: 5,
    escalateToLine: true,
    autoBoostFan: true,
  });

  // Tab 4: Users
  const [usersList, setUsersList] = useState([
    {
      id: 1,
      initials: 'EM',
      name: 'E. Mitchell',
      email: 'mitchell@safety-dept.org',
      role: 'Admin',
      roleBadge: 'bg-[#004ac6]/10 text-[#004ac6]',
      permissions: 'Full Control & Thresholds',
      status: 'Active',
    },
    {
      id: 2,
      initials: 'TH',
      name: 'T. Henderson',
      email: 't.henderson@plant-ops.com',
      role: 'Engineer',
      roleBadge: 'bg-[#505f76]/10 text-[#505f76]',
      permissions: 'Calibrations & OTA Updates',
      status: 'Active',
    },
    {
      id: 3,
      initials: 'PK',
      name: 'P. Krai',
      email: 'p.krai@booth1-floor.org',
      role: 'Operator',
      roleBadge: 'bg-[#943700]/10 text-[#943700]',
      permissions: 'Kiosk & Alert Acknowledgements',
      status: 'Active',
    },
    {
      id: 4,
      initials: 'ST',
      name: 'S. Tanaka',
      email: 'stanaka@external-audit.co',
      role: 'Viewer',
      roleBadge: 'bg-[#434655]/10 text-[#434655]',
      permissions: 'Emissions & Historical Read-Only',
      status: 'Active',
    },
  ]);

  // Tab 5: General
  const [generalConfig, setGeneralConfig] = useState({
    language: 'English (US)',
    timezone: 'Asia/Bangkok (UTC+07:00)',
    retention: '90 days',
    alarmTone: 'Industrial Siren Pulse',
    volume: 80,
  });

  function handleThresholdChange(sensor, field, val) {
    setThresholds((prev) => ({
      ...prev,
      [sensor]: { ...prev[sensor], [field]: Number(val) },
    }));
    setHasChanges(true);
  }

  function handleSave() {
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 2200);
  }

  function handleDiscard() {
    setHasChanges(false);
  }

  function handleSendTestLine() {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-8 pb-28">
      {/* ── Header & Tabs Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase text-[#004ac6] tracking-widest block mb-1">
            Configuration
          </span>
          <h1 className="text-[28px] md:text-[34px] font-bold text-[#131b2e] tracking-tight">
            Settings
          </h1>
        </div>

        {/* 5 Tabs Navigation Pills */}
        <nav aria-label="Settings Tabs" className="inline-flex p-1.5 rounded-full bg-[#f2f3ff] shadow-inner overflow-x-auto max-w-full">
          {[
            { id: 'thresholds', label: 'Thresholds' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'sla', label: 'SLA' },
            { id: 'users', label: 'Users' },
            { id: 'general', label: 'General' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#004ac6] shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab 1: Thresholds ── */}
      {activeTab === 'thresholds' && (
        <div className="relative bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-[#eaedff] overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#004ac6]/5 via-[#dbe1ff]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eaedff]">
              <div>
                <h2 className="text-[17px] font-bold text-[#131b2e]">
                  Sensor Detection &amp; Escalation Thresholds
                </h2>
                <p className="text-[13px] text-[#505f76]">
                  Configure warning, critical limits, persistence duration, and deadband hysteresis.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#505f76] whitespace-nowrap">Device:</span>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="h-9 px-3 bg-[#f2f3ff] rounded-xl border border-[#eaedff] text-[13px] font-semibold text-[#131b2e] outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                >
                  <option>ESP32 Node 01</option>
                  <option>ESP32 Node 02</option>
                  <option>Gateway Hub</option>
                </select>
              </div>
            </div>

            {/* Sensor Threshold Rows */}
            <div className="flex flex-col gap-4">
              {[
                { key: 'mq3', label: 'MQ-3', sub: 'Alcohol / Thinner', unit: 'ppb' },
                { key: 'mq2', label: 'MQ-2', sub: 'Combustibles / LPG', unit: 'ppb' },
                { key: 'mq135', label: 'MQ-135', sub: 'Air Quality / Benzene', unit: 'ppb' },
                { key: 'mq8', label: 'MQ-8', sub: 'Hydrogen / Flammable', unit: 'ppb' },
                { key: 'mics', label: 'MiCS-6814', sub: 'Toxic Gas (CO/NO2)', unit: 'mV' },
                { key: 'ccs811', label: 'CCS811', sub: 'TVOC Gas Sensor', unit: 'ppb' },
                { key: 'pm25', label: 'PMS5003', sub: 'Particulate PM2.5', unit: 'µg/m³' },
              ].map((s) => (
                <div
                  key={s.key}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#faf8ff] border border-[#eaedff] hover:bg-[#f2f3ff]/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <div className="w-10 h-10 rounded-2xl bg-[#eaedff] flex items-center justify-center text-[#004ac6] shrink-0 font-bold">
                      <Activity size={18} />
                    </div>
                    <div>
                      <span className="text-[15px] font-bold text-[#131b2e] block leading-tight">{s.label}</span>
                      <span className="text-[11px] font-semibold text-[#505f76] uppercase tracking-wider">{s.sub}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#505f76]">Warning</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={thresholds[s.key].warn}
                          onChange={(e) => handleThresholdChange(s.key, 'warn', e.target.value)}
                          className="w-full h-10 px-3 pr-8 rounded-xl bg-white text-[#131b2e] font-semibold text-[13px] border border-[#e2e8f0] text-right outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                        />
                        <span className="absolute right-2.5 text-[11px] text-[#737686] pointer-events-none">{s.unit}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#505f76]">Critical</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={thresholds[s.key].crit}
                          onChange={(e) => handleThresholdChange(s.key, 'crit', e.target.value)}
                          className="w-full h-10 px-3 pr-8 rounded-xl bg-white text-[#ba1a1a] font-semibold text-[13px] border border-[#e2e8f0] text-right outline-none focus:ring-2 focus:ring-[#ba1a1a]/20"
                        />
                        <span className="absolute right-2.5 text-[11px] text-[#737686] pointer-events-none">{s.unit}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#505f76]">Duration</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={thresholds[s.key].duration}
                          onChange={(e) => handleThresholdChange(s.key, 'duration', e.target.value)}
                          className="w-full h-10 px-3 pr-7 rounded-xl bg-white text-[#131b2e] font-semibold text-[13px] border border-[#e2e8f0] text-right outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                        />
                        <span className="absolute right-2.5 text-[11px] text-[#737686] pointer-events-none">s</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#505f76]">Hysteresis</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={thresholds[s.key].hyst}
                          onChange={(e) => handleThresholdChange(s.key, 'hyst', e.target.value)}
                          className="w-full h-10 px-3 pr-7 rounded-xl bg-white text-[#131b2e] font-semibold text-[13px] border border-[#e2e8f0] text-right outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                        />
                        <span className="absolute right-2.5 text-[11px] text-[#737686] pointer-events-none">{s.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Notifications ── */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-[#eaedff] flex flex-col gap-8">
          {/* LINE Messaging API */}
          <div className="flex flex-col gap-4 pb-6 border-b border-[#eaedff]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#06C755]/15 text-[#06C755] flex items-center justify-center font-bold text-[18px]">
                  LINE
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#131b2e]">LINE Messaging API</h3>
                  <p className="text-[13px] text-[#505f76]">Configure webhook and bot alerts to your LINE incident group channel</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#06C755]/10 text-[#06C755] text-[11px] font-bold uppercase tracking-wider">
                Connected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#505f76]">Channel access token</label>
                <div className="relative flex items-center">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={lineConfig.token}
                    onChange={(e) => {
                      setLineConfig({ ...lineConfig, token: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full h-10 px-3 pr-10 rounded-xl bg-[#faf8ff] text-[#131b2e] font-mono text-[12px] border border-[#eaedff] outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 text-[#505f76] hover:text-[#131b2e] cursor-pointer"
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#505f76]">Channel secret</label>
                <div className="relative flex items-center">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={lineConfig.secret}
                    onChange={(e) => {
                      setLineConfig({ ...lineConfig, secret: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full h-10 px-3 pr-10 rounded-xl bg-[#faf8ff] text-[#131b2e] font-mono text-[12px] border border-[#eaedff] outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 text-[#505f76] hover:text-[#131b2e] cursor-pointer"
                  >
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-[#505f76]">Target Group ID / User ID</label>
                  <button
                    type="button"
                    onClick={handleSendTestLine}
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#004ac6] font-bold hover:underline cursor-pointer"
                  >
                    <Send size={13} />
                    <span>{testSent ? 'Test Message Dispatched ✓' : 'Send test alert'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={lineConfig.groupId}
                  onChange={(e) => {
                    setLineConfig({ ...lineConfig, groupId: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#faf8ff] text-[#131b2e] font-mono text-[12px] border border-[#eaedff] outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>
            </div>
          </div>

          {/* Telegram Bot */}
          <div className="flex flex-col gap-4 pb-6 border-b border-[#eaedff]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0088cc]/15 text-[#0088cc] flex items-center justify-center font-bold text-[18px]">
                  TG
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#131b2e]">Telegram Bot</h3>
                  <p className="text-[13px] text-[#505f76]">Send automated incident broadcasts to security telegram channel</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-[11px] font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>

          {/* Email Digest */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[#131b2e]">Email Digest &amp; Escalation</h3>
              <p className="text-[13px] text-[#505f76]">Daily compliance digest sent to EHS managers at 07:00 ICT</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#ecfdf5] text-[#059669] text-[11px] font-bold uppercase tracking-wider">
              Enabled
            </span>
          </div>
        </div>
      )}

      {/* ── Tab 3: SLA ── */}
      {activeTab === 'sla' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-[#eaedff] flex flex-col gap-6">
          <div className="pb-4 border-b border-[#eaedff]">
            <h3 className="text-[18px] font-bold text-[#131b2e]">Response Service Level Agreement (SLA)</h3>
            <p className="text-[13px] text-[#505f76] mt-1">
              Specify response SLA target times before alarms escalate to plant supervisory management and emergency ventilation triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#faf8ff] border border-[#eaedff] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#131b2e]">Warning SLA Target</h4>
                  <span className="text-[11px] text-[#505f76]">Acknowledge window for Amber alerts</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  value={sla.warningMinutes}
                  onChange={(e) => {
                    setSla({ ...sla, warningMinutes: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-24 h-10 px-3 rounded-xl bg-white text-[#131b2e] font-bold text-[14px] border border-[#e2e8f0] text-center outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
                <span className="text-[13px] font-semibold text-[#505f76]">Minutes</span>
              </div>
              <p className="text-[12px] text-[#505f76] mt-1 leading-snug">
                If unresolved after {sla.warningMinutes} minutes, system dispatches reminder to floor supervisors.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#faf8ff] border border-[#eaedff] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#fee2e2] text-[#ba1a1a] flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#ba1a1a]">Critical SLA Target</h4>
                  <span className="text-[11px] text-[#505f76]">Mandatory response deadline</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  value={sla.criticalMinutes}
                  onChange={(e) => {
                    setSla({ ...sla, criticalMinutes: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-24 h-10 px-3 rounded-xl bg-white text-[#ba1a1a] font-bold text-[14px] border border-[#e2e8f0] text-center outline-none focus:ring-2 focus:ring-[#ba1a1a]/20"
                />
                <span className="text-[13px] font-semibold text-[#505f76]">Minutes</span>
              </div>
              <p className="text-[12px] text-[#505f76] mt-1 leading-snug">
                Breach immediately triggers LINE Push Escalation &amp; automated booster fan boost (100%).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Users ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-[#eaedff] flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eaedff]">
            <div>
              <h3 className="text-[18px] font-bold text-[#131b2e]">Authorized System Personnel</h3>
              <p className="text-[13px] text-[#505f76] mt-0.5">Manage team access rights, operator roles, and alert subscriptions.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#004ac6] text-white font-semibold text-[13px] shadow-sm hover:bg-[#003ea8] transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Invite user</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#eaedff] text-[11px] uppercase tracking-wider text-[#505f76] font-semibold">
                  <th className="py-3 px-3">Name &amp; Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Permissions</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-[#faf8ff] transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#eaedff] text-[#004ac6] font-bold text-[12px] flex items-center justify-center">
                          {u.initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#131b2e]">{u.name}</span>
                          <span className="text-[11px] text-[#505f76]">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${u.roleBadge}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#505f76] font-medium">{u.permissions}</td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[12px] text-[#059669] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button type="button" className="p-1 rounded-lg text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] cursor-pointer">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 5: General ── */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-[#eaedff] flex flex-col gap-6">
          <div className="pb-4 border-b border-[#eaedff]">
            <h3 className="text-[18px] font-bold text-[#131b2e]">General System Configuration</h3>
            <p className="text-[13px] text-[#505f76] mt-0.5">Regional settings, telemetry archive retention, and hardware alarm acoustics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#505f76]">Language</label>
              <select
                value={generalConfig.language}
                onChange={(e) => {
                  setGeneralConfig({ ...generalConfig, language: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#faf8ff] text-[#131b2e] font-semibold text-[13px] border border-[#eaedff] outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
              >
                <option>English (US)</option>
                <option>ภาษาไทย (Thai)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#505f76]">Timezone</label>
              <select
                value={generalConfig.timezone}
                onChange={(e) => {
                  setGeneralConfig({ ...generalConfig, timezone: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#faf8ff] text-[#131b2e] font-semibold text-[13px] border border-[#eaedff] outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
              >
                <option>Asia/Bangkok (UTC+07:00)</option>
                <option>Asia/Singapore (UTC+08:00)</option>
                <option>Europe/London (UTC+00:00)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#505f76]">Data retention</label>
              <select
                value={generalConfig.retention}
                onChange={(e) => {
                  setGeneralConfig({ ...generalConfig, retention: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#faf8ff] text-[#131b2e] font-semibold text-[13px] border border-[#eaedff] outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
              >
                <option>30 days</option>
                <option>90 days</option>
                <option>180 days</option>
                <option>365 days (1 Year)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#505f76]">Alarm tone</label>
              <select
                value={generalConfig.alarmTone}
                onChange={(e) => {
                  setGeneralConfig({ ...generalConfig, alarmTone: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#faf8ff] text-[#131b2e] font-semibold text-[13px] border border-[#eaedff] outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
              >
                <option>Industrial Siren Pulse</option>
                <option>Beep Standard</option>
                <option>Chime Alert</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[#505f76]">Hardware Alarm Acoustic Volume</label>
                <span className="text-[12px] font-bold text-[#004ac6]">{generalConfig.volume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX size={18} className="text-[#737686]" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={generalConfig.volume}
                  onChange={(e) => {
                    setGeneralConfig({ ...generalConfig, volume: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full h-2 bg-[#eaedff] rounded-lg appearance-none cursor-pointer accent-[#004ac6]"
                />
                <Volume2 size={18} className="text-[#004ac6]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Bottom Bar for Unsaved Changes ── */}
      <div className="fixed bottom-6 left-4 right-4 sm:left-64 sm:right-8 max-w-3xl mx-auto z-40 bg-white/95 backdrop-blur-xl border border-[#eaedff] rounded-full px-6 py-3 shadow-xl flex items-center justify-between transition-all">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full ${hasChanges ? 'bg-[#f97316] animate-ping opacity-75' : 'bg-[#004ac6]'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${hasChanges ? 'bg-[#f97316]' : 'bg-[#004ac6]'}`} />
          </span>
          <span className="text-[13px] font-medium text-[#131b2e]">
            {hasChanges ? 'Unsaved changes pending' : 'All configurations synchronized'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-1.5 rounded-full border border-[#eaedff] hover:bg-[#f2f3ff] text-[#505f76] text-[13px] font-medium transition-colors cursor-pointer"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-6 py-1.5 rounded-full bg-[#004ac6] hover:bg-[#003ea8] text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer"
          >
            <Check size={16} />
            <span>{saved ? 'Saved ✓' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
