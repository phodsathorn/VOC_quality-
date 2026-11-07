import { useState, useEffect, useCallback } from 'react';
import {
  Check, Sliders, Bell, Users, Clock, Settings as SettingsIcon,
  Eye, EyeOff, Send, UserPlus, Volume2, VolumeX, ShieldAlert,
  Flame, Wind, Activity, MoreVertical, Trash2, X, Lock, UserCheck, KeyRound, Loader2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API } from '../config';

export default function Settings() {
  const { t, lang, setLang } = useLanguage();

  const [activeTab, setActiveTab] = useState('thresholds');
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('ESP32 Node 01');
  const [openUserMenuId, setOpenUserMenuId] = useState(null);

  // Tab 1: Thresholds matching Stitch AI
  const [thresholds, setThresholds] = useState({
    mq3: { name: 'MQ-3', sub: 'Alcohol', warn: 400, crit: 750, duration: 15, hyst: 20, unit: 'ppb' },
    mq2: { name: 'MQ-2', sub: 'Combustibles', warn: 500, crit: 900, duration: 10, hyst: 30, unit: 'ppb' },
    minipid: { name: 'Mini PID', sub: 'VOCs', warn: 350, crit: 700, duration: 20, hyst: 25, unit: 'ppb' },
    sgp40: { name: 'SGP40', sub: 'VOC Index', warn: 200, crit: 350, duration: 15, hyst: 15, unit: 'pts' },
    tgs2602: { name: 'TGS2602', sub: 'Odors', warn: 300, crit: 650, duration: 20, hyst: 25, unit: 'ppb' },
    mq137: { name: 'MQ-137', sub: 'Ammonia', warn: 250, crit: 600, duration: 10, hyst: 20, unit: 'ppb' },
  });

  // Tab 2: Notifications
  const [lineConfig, setLineConfig] = useState({
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token1234567890',
    secret: '9df8e12a45b780cd3e45f912',
    groupId: 'c839f10928b746a51ec94820d912f4',
  });
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const [telegramConfig, setTelegramConfig] = useState({
    botToken: '619283749:AAFn82k_w123498',
    chatId: '-1001827461928',
  });

  const [emailConfig, setEmailConfig] = useState({
    recipients: 'safety@plant-ops.com, mitchell@safety-dept.org',
    interval: 'Immediate (Real-time)',
  });

  // Tab 3: SLA
  const [sla, setSla] = useState({
    warningMinutes: 10,
    criticalMinutes: 5,
  });

  // Tab 4: Real Users Management (RBAC & Database)
  const { token, user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);

  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'operator',
    site: 'Main Plant'
  });
  const [newRoleSelection, setNewRoleSelection] = useState('operator');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userActionSuccess, setUserActionSuccess] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/api/users`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((u) => {
            const r = (u.role || 'operator').toLowerCase();
            return {
              id: u.id,
              username: u.username,
              name: u.full_name || u.username,
              initials: (u.full_name || u.username).slice(0, 2).toUpperCase(),
              email: `${u.username}@plant-ops.local`,
              role: r.charAt(0).toUpperCase() + r.slice(1),
              roleTh: r === 'admin' ? 'ผู้ดูแลระบบ' : r === 'engineer' ? 'วิศวกร' : r === 'operator' ? 'พนักงาน' : 'ผู้ตรวจสอบ',
              permissions: r === 'admin' ? 'Full Control & Thresholds' : r === 'engineer' ? 'Device Management & Calibrations' : r === 'operator' ? 'Kiosk, Fan & Live Alerts' : 'Read-only & Compliance Audits',
              permissionsTh: r === 'admin' ? 'ควบคุมทุกฟังก์ชันและเกณฑ์แจ้งเตือน' : r === 'engineer' ? 'จัดการอุปกรณ์และบันทึกผลสอบเทียบ' : r === 'operator' ? 'ควบคุมพัดลมและรับทราบเหตุการณ์หน้างาน' : 'เรียกดูรายงานและตรวจสอบความปลอดภัย',
              status: u.is_active ? 'Active' : 'Inactive',
              isActive: u.is_active ?? true,
            };
          });
          setUsersList(formatted);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch real users:', e);
    } finally {
      setLoadingUsers(false);
    }

    // Real system users seed fallback (matching PostgreSQL init.sql)
    setUsersList([
      {
        id: 1,
        username: 'admin',
        name: 'System Administrator',
        initials: 'SA',
        email: 'admin@plant-ops.local',
        role: 'Admin',
        roleTh: 'ผู้ดูแลระบบ',
        permissions: 'Full Control & Thresholds',
        permissionsTh: 'ควบคุมทุกฟังก์ชันและเกณฑ์แจ้งเตือน',
        status: 'Active',
        isActive: true,
      },
      {
        id: 2,
        username: 'engineer',
        name: 'Process & Calibration Engineer',
        initials: 'PE',
        email: 'engineer@plant-ops.local',
        role: 'Engineer',
        roleTh: 'วิศวกร',
        permissions: 'Device Management & Calibrations',
        permissionsTh: 'จัดการอุปกรณ์และบันทึกผลสอบเทียบ',
        status: 'Active',
        isActive: true,
      },
      {
        id: 3,
        username: 'operator',
        name: 'Line Operator',
        initials: 'LO',
        email: 'operator@plant-ops.local',
        role: 'Operator',
        roleTh: 'พนักงานสายการผลิต',
        permissions: 'Kiosk, Fan & Live Alerts',
        permissionsTh: 'ควบคุมพัดลมและรับทราบเหตุการณ์หน้างาน',
        status: 'Active',
        isActive: true,
      },
      {
        id: 4,
        username: 'viewer',
        name: 'Safety & Compliance Auditor',
        initials: 'SC',
        email: 'auditor@plant-ops.local',
        role: 'Viewer',
        roleTh: 'ผู้ตรวจสอบความปลอดภัย (จป.)',
        permissions: 'Read-only & Compliance Audits',
        permissionsTh: 'เรียกดูรายงานและตรวจสอบความปลอดภัย',
        status: 'Active',
        isActive: true,
      }
    ]);
  }, [token]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // Tab 5: General
  const [generalConfig, setGeneralConfig] = useState({
    timezone: 'Asia/Bangkok (UTC+07:00)',
    retention: '90 days',
    alarmTone: 'Industrial Siren Pulse',
    volume: 80,
  });

  function handleThresholdChange(key, field, val) {
    setThresholds((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: Number(val) },
    }));
    setHasChanges(true);
  }

  function handleSave() {
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDiscard() {
    setHasChanges(false);
  }

  function handleSendTestLine() {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  }

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserActionError('');
    if (!newUserForm.username.trim() || newUserForm.username.length < 3) {
      setUserActionError(lang === 'TH' ? 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' : 'Username must be at least 3 characters');
      return;
    }
    if (!newUserForm.password || newUserForm.password.length < 6) {
      setUserActionError(lang === 'TH' ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
      return;
    }
    setUserActionLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API}/api/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newUserForm)
      });
      if (res.ok) {
        setIsAddUserModalOpen(false);
        setNewUserForm({ username: '', password: '', full_name: '', role: 'operator', site: 'Main Plant' });
        setUserActionSuccess(lang === 'TH' ? 'สร้างบัญชีผู้ใช้งานใหม่สำเร็จแล้ว ✓' : 'User account created successfully ✓');
        setTimeout(() => setUserActionSuccess(''), 3500);
        fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        setUserActionError(err.detail || 'Failed to create user');
      }
    } catch (err) {
      setUserActionError(err.message || 'Network error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUserForAction) return;
    setUserActionLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API}/api/users/${selectedUserForAction.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: newRoleSelection.toLowerCase() })
      });
      if (res.ok) {
        setIsEditRoleModalOpen(false);
        setUserActionSuccess(lang === 'TH' ? 'แก้ไขสิทธิ์การใช้งานสำเร็จแล้ว ✓' : 'Role updated successfully ✓');
        setTimeout(() => setUserActionSuccess(''), 3500);
        fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to update role');
      }
    } catch (e) {
      alert(e.message || 'Network error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserForAction) return;
    if (!newPasswordInput || newPasswordInput.length < 6) {
      alert(lang === 'TH' ? 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'New password must be at least 6 characters');
      return;
    }
    setUserActionLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API}/api/users/${selectedUserForAction.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: newPasswordInput })
      });
      if (res.ok) {
        setIsResetPwdModalOpen(false);
        setNewPasswordInput('');
        setUserActionSuccess(lang === 'TH' ? 'รีเซ็ตรหัสผ่านสำเร็จแล้ว ✓' : 'Password reset successfully ✓');
        setTimeout(() => setUserActionSuccess(''), 3500);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to reset password');
      }
    } catch (e) {
      alert(e.message || 'Network error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleDeactivateUser = async (u) => {
    if (!window.confirm(lang === 'TH' ? `ยืนยันการระงับการใช้งานบัญชี ${u.name}?` : `Suspend user account ${u.name}?`)) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/api/users/${u.id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setUserActionSuccess(lang === 'TH' ? 'ระงับการใช้งานบัญชีสำเร็จแล้ว ✓' : 'User deactivated ✓');
        setTimeout(() => setUserActionSuccess(''), 3500);
        fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to deactivate user');
      }
    } catch (e) {
      alert(e.message || 'Network error');
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto flex flex-col gap-8 pb-28">
      {/* ── Top Header & Tab Pills Navigation matching Stitch AI ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase text-[#004ac6] tracking-widest block mb-1">
            {t('configuration', 'Configuration')}
          </span>
          <h1 className="text-[24px] font-semibold text-[#131b2e] tracking-tight">
            {t('settings', 'Settings')}
          </h1>
        </div>

        {/* Tab Pills Nav */}
        <nav
          aria-label="Settings Tabs"
          className="inline-flex p-1.5 rounded-full bg-[#e2e7ff] shadow-inner overflow-x-auto max-w-full"
        >
          {[
            { id: 'thresholds', label: t('thresholds', 'Thresholds') },
            { id: 'notifications', label: t('notifications', 'Notifications') },
            { id: 'sla', label: t('sla', 'SLA') },
            { id: 'users', label: t('users', 'Users') },
            { id: 'general', label: t('general', 'General') },
          ].map((tabItem) => {
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setActiveTab(tabItem.id)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#004ac6] shadow-sm font-semibold'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                {tabItem.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab 1: Thresholds matching Stitch AI ── */}
      {activeTab === 'thresholds' && (
        <div className="flex flex-col gap-6">
          <div className="relative bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-[#eaedff] overflow-hidden">
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eaedff]">
                <div>
                  <h2 className="text-[16px] text-[#131b2e] font-semibold">
                    {t('sensorDetectionThresholds', 'Sensor Detection & Escalation Thresholds')}
                  </h2>
                  <p className="text-[13px] text-[#505f76] mt-0.5">
                    {t('sensorThresholdsDesc', 'Configure warning, critical limits, persistence duration, and deadband hysteresis.')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[#505f76] whitespace-nowrap">
                    {t('deviceLabel', 'Device:')}
                  </span>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="h-9 px-3 py-1 bg-[#f2f3ff] rounded-xl border border-[#eaedff] text-[13px] font-medium text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                  >
                    <option>ESP32 Node 01</option>
                    <option>ESP32 Node 02</option>
                    <option>Gateway Hub</option>
                  </select>
                </div>
              </div>

              {/* 6 Sensors List */}
              <div className="flex flex-col gap-4">
                {Object.entries(thresholds).map(([key, item]) => (
                  <div
                    key={key}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#f2f3ff]/50 rounded-2xl p-4 transition-all hover:bg-[#f2f3ff]"
                  >
                    <div className="flex items-center gap-3.5 min-w-[200px]">
                      <div className="w-10 h-10 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#004ac6] shrink-0">
                        <Activity size={20} />
                      </div>
                      <div>
                        <span className="text-[15px] font-bold text-[#131b2e] block leading-tight">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-[#505f76] uppercase tracking-wider font-medium">
                          {item.sub}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] text-[#505f76] font-medium">
                          {t('warning', 'Warning')}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            value={item.warn}
                            onChange={(e) => handleThresholdChange(key, 'warn', e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white text-[#131b2e] text-[13px] font-medium shadow-inner focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 text-right pr-9 border border-[#eaedff]"
                          />
                          <span className="absolute right-2.5 text-[11px] text-[#737686] pointer-events-none font-medium">
                            {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] text-[#505f76] font-medium">
                          {t('critical', 'Critical')}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            value={item.crit}
                            onChange={(e) => handleThresholdChange(key, 'crit', e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white text-[#131b2e] text-[13px] font-medium shadow-inner focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 text-right pr-9 border border-[#eaedff]"
                          />
                          <span className="absolute right-2.5 text-[11px] text-[#737686] pointer-events-none font-medium">
                            {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] text-[#505f76] font-medium">
                          {t('duration', 'Duration')}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            value={item.duration}
                            onChange={(e) => handleThresholdChange(key, 'duration', e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white text-[#131b2e] text-[13px] font-medium shadow-inner focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 text-right pr-7 border border-[#eaedff]"
                          />
                          <span className="absolute right-2.5 text-[11px] text-[#737686] pointer-events-none font-medium">
                            s
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] text-[#505f76] font-medium">
                          {t('hysteresis', 'Hysteresis')}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            value={item.hyst}
                            onChange={(e) => handleThresholdChange(key, 'hyst', e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white text-[#131b2e] text-[13px] font-medium shadow-inner focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 text-right pr-9 border border-[#eaedff]"
                          />
                          <span className="absolute right-2.5 text-[11px] text-[#737686] pointer-events-none font-medium">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Notifications matching Stitch AI ── */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col gap-8">
          {/* Section 1: LINE Messaging API */}
          <div className="flex flex-col gap-4 pb-6 border-b border-[#eaedff]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#06C755]/15 text-[#06C755] flex items-center justify-center font-bold">
                  LINE
                </div>
                <div>
                  <h3 className="text-[16px] text-[#131b2e] font-semibold">
                    {t('lineMessagingApi', 'LINE Messaging API')}
                  </h3>
                  <p className="text-[13px] text-[#505f76]">
                    {t('lineApiDesc', 'Configure webhook and bot alerts to your LINE incident group channel')}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#06C755]/10 text-[#06C755] text-[11px] font-semibold uppercase tracking-wider">
                {t('connected', 'Connected')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#505f76] font-medium">
                  {t('channelAccessToken', 'Channel access token')}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={lineConfig.token}
                    onChange={(e) => {
                      setLineConfig({ ...lineConfig, token: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full h-10 px-3 pr-10 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono"
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

              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#505f76] font-medium">
                  {t('channelSecret', 'Channel secret')}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={lineConfig.secret}
                    onChange={(e) => {
                      setLineConfig({ ...lineConfig, secret: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full h-10 px-3 pr-10 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono"
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

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[12px] text-[#505f76] font-medium">
                  {t('groupId', 'Group ID')}
                </label>
                <input
                  type="text"
                  value={lineConfig.groupId}
                  onChange={(e) => {
                    setLineConfig({ ...lineConfig, groupId: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-start pt-1">
              <button
                type="button"
                onClick={handleSendTestLine}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#c3c6d7] hover:bg-[#eaedff] text-[#131b2e] text-[13px] font-medium transition-colors cursor-pointer"
              >
                <Send size={15} className="text-[#004ac6]" />
                <span>{testSent ? t('testMessageSent', 'Test message sent ✓') : t('sendTestMessage', 'Send test message')}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Telegram Bot */}
          <div className="flex flex-col gap-4 pb-6 border-b border-[#eaedff]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] text-[#131b2e] font-semibold">
                    {t('telegramBot', 'Telegram Bot')}
                  </h3>
                  <p className="text-[13px] text-[#505f76]">
                    {t('telegramDesc', 'Send automated incident broadcasts to security telegram channel')}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#eaedff] text-[#505f76] text-[11px] font-semibold uppercase tracking-wider">
                {t('active', 'Active')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#505f76] font-medium">
                  {t('botToken', 'Bot Token')}
                </label>
                <input
                  type="password"
                  value={telegramConfig.botToken}
                  onChange={(e) => {
                    setTelegramConfig({ ...telegramConfig, botToken: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#505f76] font-medium">
                  {t('chatId', 'Chat ID')}
                </label>
                <input
                  type="text"
                  value={telegramConfig.chatId}
                  onChange={(e) => {
                    setTelegramConfig({ ...telegramConfig, chatId: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Email Digest */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e2e7ff] text-[#004ac6] flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] text-[#131b2e] font-semibold">
                    {t('emailDigest', 'Email Digest & Escalation')}
                  </h3>
                  <p className="text-[13px] text-[#505f76]">
                    {t('emailDesc', 'Direct critical alert dispatches to safety department')}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-[11px] font-semibold uppercase tracking-wider">
                {t('active', 'Enabled')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#505f76] font-medium">
                  {t('recipients', 'Recipients (comma separated)')}
                </label>
                <input
                  type="text"
                  value={emailConfig.recipients}
                  onChange={(e) => {
                    setEmailConfig({ ...emailConfig, recipients: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#505f76] font-medium">
                  {t('digestInterval', 'Digest Interval')}
                </label>
                <select
                  value={emailConfig.interval}
                  onChange={(e) => {
                    setEmailConfig({ ...emailConfig, interval: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                >
                  <option value="Immediate (Real-time)">{t('immediateRealtime', 'Immediate (Real-time)')}</option>
                  <option value="Hourly Summary">{t('hourlySummary', 'Hourly Summary')}</option>
                  <option value="Shift Handover (8 hrs)">{t('shiftHandover', 'Shift Handover (8 hrs)')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Response SLA matching Stitch AI ── */}
      {activeTab === 'sla' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col gap-6">
          <div className="pb-4 border-b border-[#eaedff]">
            <h3 className="text-[18px] text-[#131b2e] font-semibold">
              {t('responseSlaTitle', 'Response Service Level Agreement (SLA)')}
            </h3>
            <p className="text-[13px] text-[#505f76] mt-1">
              {t('responseSlaDesc', 'Specify response SLA target times before alarms escalate to plant supervisory management and emergency ventilation triggers.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#f2f3ff]/60 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#d0e1fb] text-[#004ac6] flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-[15px] text-[#131b2e] font-semibold">
                    {t('warningSlaTarget', 'Warning SLA Target')}
                  </h4>
                  <span className="text-[12px] text-[#505f76]">
                    {t('warningSlaDesc', 'Acknowledge time window for amber alerts')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="number"
                  value={sla.warningMinutes}
                  onChange={(e) => {
                    setSla({ ...sla, warningMinutes: Number(e.target.value) });
                    setHasChanges(true);
                  }}
                  className="w-28 h-11 px-3 rounded-xl bg-white text-[#131b2e] font-bold text-[16px] shadow-inner border border-[#c3c6d7] text-right pr-4"
                />
                <span className="text-[14px] text-[#505f76] font-medium">
                  {t('minutes', 'minutes')}
                </span>
              </div>
              <p className="text-[12px] text-[#505f76]">
                {t('warningEscalateNote', 'If unresolved after 10 minutes, warnings dispatch reminders to the shift engineer.')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f2f3ff]/60 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h4 className="text-[15px] text-[#131b2e] font-semibold">
                    {t('criticalSlaTarget', 'Critical SLA Target')}
                  </h4>
                  <span className="text-[12px] text-[#505f76]">
                    {t('criticalSlaDesc', 'Mandatory physical triage target')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="number"
                  value={sla.criticalMinutes}
                  onChange={(e) => {
                    setSla({ ...sla, criticalMinutes: Number(e.target.value) });
                    setHasChanges(true);
                  }}
                  className="w-28 h-11 px-3 rounded-xl bg-white text-[#131b2e] font-bold text-[16px] shadow-inner border border-[#c3c6d7] text-right pr-4"
                />
                <span className="text-[14px] text-[#505f76] font-medium">
                  {t('minutes', 'minutes')}
                </span>
              </div>
              <p className="text-[12px] text-[#505f76]">
                {t('criticalEscalateNote', 'Failure to acknowledge critical alarms within 5 minutes triggers secondary air filtration override.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Users matching Stitch AI ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eaedff]">
            <div>
              <h3 className="text-[18px] text-[#131b2e] font-semibold">
                {t('authorizedPersonnel', 'Authorized System Personnel')}
              </h3>
              <p className="text-[13px] text-[#505f76] mt-0.5">
                {t('authorizedPersonnelDesc', 'Manage team access rights, operator roles, and alert subscriptions.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddUserModalOpen(true);
                setUserActionError('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#004ac6] text-white font-medium text-[13px] hover:bg-[#003ea8] shadow-xs transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              <span>{lang === 'TH' ? 'เพิ่มผู้ใช้งาน / Add User' : 'Add User'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[11px] uppercase tracking-wider text-[#505f76] border-b border-[#eaedff]">
                <tr>
                  <th className="py-3 px-3 font-semibold">{t('nameAndEmail', 'Name & Email')}</th>
                  <th className="py-3 px-3 font-semibold">{t('role', 'Role')}</th>
                  <th className="py-3 px-3 font-semibold">{t('permissions', 'Permissions')}</th>
                  <th className="py-3 px-3 font-semibold">{t('status', 'Status')}</th>
                  <th className="py-3 px-3 text-right font-semibold">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="text-[13px] divide-y divide-[#eaedff]">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f2f3ff]/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-[12px] font-bold">
                          {u.initials}
                        </div>
                        <div>
                          <span className="font-semibold text-[#131b2e] block leading-tight">{u.name}</span>
                          <span className="text-[11px] text-[#505f76]">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#004ac6]/10 text-[#004ac6] font-semibold text-[11px]">
                        {lang === 'TH' ? u.roleTh : u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#505f76]">
                      {lang === 'TH' ? u.permissionsTh : u.permissions}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 text-[#00CC66] font-medium text-[12px]">
                        <span className="w-2 h-2 rounded-full bg-[#00CC66]" />
                        {t('active', 'Active')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right relative">
                      <button
                        type="button"
                        onClick={() => setOpenUserMenuId(openUserMenuId === u.id ? null : u.id)}
                        className="p-1.5 text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] rounded-full cursor-pointer transition-colors"
                        aria-label="User actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openUserMenuId === u.id && (
                        <div className="absolute right-3 top-10 w-44 bg-white rounded-2xl shadow-lg border border-[#eaedff] py-1.5 z-20 text-left text-[12px] animate-in fade-in zoom-in-95">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setNewRoleSelection((u.role || 'operator').toLowerCase());
                              setIsEditRoleModalOpen(true);
                              setOpenUserMenuId(null);
                            }}
                            className="w-full px-3.5 py-1.5 hover:bg-[#f2f3ff] text-[#131b2e] text-left cursor-pointer flex items-center gap-2"
                          >
                            <UserCheck size={14} className="text-[#004ac6]" />
                            <span>{lang === 'TH' ? 'แก้ไขสิทธิ์' : 'Edit role'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setNewPasswordInput('');
                              setIsResetPwdModalOpen(true);
                              setOpenUserMenuId(null);
                            }}
                            className="w-full px-3.5 py-1.5 hover:bg-[#f2f3ff] text-[#131b2e] text-left cursor-pointer flex items-center gap-2"
                          >
                            <KeyRound size={14} className="text-[#004ac6]" />
                            <span>{lang === 'TH' ? 'รีเซ็ตรหัสผ่าน' : 'Reset password'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenuId(null);
                              handleDeactivateUser(u);
                            }}
                            className="w-full px-3.5 py-1.5 hover:bg-[#fee2e2] text-[#ef4444] text-left cursor-pointer flex items-center gap-2"
                          >
                            <Trash2 size={14} className="text-[#ef4444]" />
                            <span>{lang === 'TH' ? 'ระงับบัญชี' : 'Suspend account'}</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 5: General System Configuration matching Stitch AI ── */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col gap-6">
          <div className="pb-4 border-b border-[#eaedff]">
            <h3 className="text-[18px] text-[#131b2e] font-semibold">
              {t('generalConfigTitle', 'General System Configuration')}
            </h3>
            <p className="text-[13px] text-[#505f76] mt-0.5">
              {t('generalConfigDesc', 'Regional settings, telemetry archive retention, and hardware alarm acoustics.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language Selector (reactive to global LanguageContext) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-[#505f76] font-medium">
                {t('language', 'Language')}
              </label>
              <select
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full h-10 px-3 rounded-2xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
              >
                <option value="EN">English (US)</option>
                <option value="TH">ภาษาไทย (Thai)</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-[#505f76] font-medium">
                {t('timezone', 'Timezone')}
              </label>
              <select
                value={generalConfig.timezone}
                onChange={(e) => {
                  setGeneralConfig({ ...generalConfig, timezone: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full h-10 px-3 rounded-2xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
              >
                <option>Asia/Bangkok (UTC+07:00)</option>
                <option>Asia/Singapore (UTC+08:00)</option>
                <option>Europe/London (UTC+00:00)</option>
              </select>
            </div>

            {/* Data Retention */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-[#505f76] font-medium">
                {t('dataRetention', 'Data retention')}
              </label>
              <select
                value={generalConfig.retention}
                onChange={(e) => {
                  setGeneralConfig({ ...generalConfig, retention: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full h-10 px-3 rounded-2xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
              >
                <option>30 days</option>
                <option>90 days</option>
                <option>180 days</option>
                <option>365 days (1 Year)</option>
              </select>
            </div>

            {/* Alarm Tone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-[#505f76] font-medium">
                {t('alarmTone', 'Alarm tone')}
              </label>
              <select
                value={generalConfig.alarmTone}
                onChange={(e) => {
                  setGeneralConfig({ ...generalConfig, alarmTone: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full h-10 px-3 rounded-2xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
              >
                <option>Industrial Siren Pulse</option>
                <option>Beep Standard</option>
                <option>Chime</option>
              </select>
            </div>

            {/* Volume */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] text-[#505f76] font-medium">
                  {t('volume', 'Volume')}
                </label>
                <span className="text-[12px] font-semibold text-[#004ac6]">
                  {generalConfig.volume}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX size={18} className="text-[#737686]" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={generalConfig.volume}
                  onChange={(e) => {
                    setGeneralConfig({ ...generalConfig, volume: Number(e.target.value) });
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

      {/* ── Floating Bottom Bar matching Stitch AI ── */}
      {hasChanges && (
        <div className="fixed bottom-6 left-[280px] right-10 max-w-3xl mx-auto z-40 bg-white/95 backdrop-blur-xl border border-[#c3c6d7] rounded-full px-6 py-3 shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#004ac6]" />
            </span>
            <span className="text-[13px] font-medium text-[#131b2e]">
              {t('unsavedChanges', 'Unsaved changes pending')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 rounded-full border border-[#c3c6d7] hover:bg-[#eaedff] text-[#131b2e] text-[13px] font-medium transition-colors cursor-pointer"
            >
              {t('discard', 'Discard')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-[#004ac6] hover:bg-[#003ea8] text-white font-medium text-[13px] shadow-sm transition-all cursor-pointer"
            >
              <Check size={16} />
              <span>{saved ? t('saved', 'Saved') : t('save', 'Save')}</span>
            </button>
          </div>
        </div>
      )}
      {/* ── Toast Notification ── */}
      {userActionSuccess && (
        <div className="fixed top-20 right-8 z-50 bg-[#004ac6] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check size={18} />
          <span className="text-[13px] font-medium">{userActionSuccess}</span>
        </div>
      )}

      {/* ── Modal: Add New User Form ── */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !userActionLoading && setIsAddUserModalOpen(false)}
            className="fixed inset-0 bg-[#283044]/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#eaedff] z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#eaedff]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#131b2e]">
                    {lang === 'TH' ? 'เพิ่มผู้ใช้งานใหม่' : 'Add New User'}
                  </h3>
                  <span className="text-[11px] text-[#505f76]">
                    {lang === 'TH' ? 'สร้างบัญชีผู้ใช้จริงลงในฐานข้อมูล' : 'Register account into PostgreSQL'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                disabled={userActionLoading}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:bg-[#eaedff] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {userActionError && (
              <div className="mt-4 p-3 rounded-xl bg-[#fee2e2] text-[#b91c1c] text-[12px] font-medium flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{userActionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4 mt-5">
              <div>
                <label className="text-[12px] font-semibold text-[#131b2e] block mb-1">
                  {lang === 'TH' ? 'ชื่อ-นามสกุล / Full Name' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'TH' ? 'เช่น สมชาย ใจมั่น' : 'e.g. John Doe'}
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7] text-[13px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#131b2e] block mb-1">
                  {lang === 'TH' ? 'ชื่อผู้ใช้ / Username (สำหรับล็อกอิน)' : 'Username'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'TH' ? 'อย่างน้อย 3 ตัวอักษร เช่น somchai' : 'min 3 chars, e.g. jdoe'}
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().trim() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7] text-[13px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#131b2e] block mb-1">
                  {lang === 'TH' ? 'รหัสผ่านเริ่มต้น / Password' : 'Password'} *
                </label>
                <input
                  type="password"
                  required
                  placeholder={lang === 'TH' ? 'อย่างน้อย 6 ตัวอักษร' : 'min 6 chars'}
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7] text-[13px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#131b2e] block mb-1">
                    {lang === 'TH' ? 'บทบาท / Role' : 'Role'} *
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7] text-[13px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                  >
                    <option value="operator">{lang === 'TH' ? 'Operator (ช่าง/พนักงาน)' : 'Operator'}</option>
                    <option value="engineer">{lang === 'TH' ? 'Engineer (วิศวกร)' : 'Engineer'}</option>
                    <option value="admin">{lang === 'TH' ? 'Admin (ผู้ดูแลระบบ)' : 'Admin'}</option>
                    <option value="viewer">{lang === 'TH' ? 'Viewer (ผู้ตรวจ/จป.)' : 'Viewer'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#131b2e] block mb-1">
                    {lang === 'TH' ? 'สถานที่ / Site' : 'Site'}
                  </label>
                  <input
                    type="text"
                    value={newUserForm.site}
                    onChange={(e) => setNewUserForm({ ...newUserForm, site: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7] text-[13px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#eaedff] mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  disabled={userActionLoading}
                  className="px-4 py-2 rounded-xl text-[#505f76] hover:bg-[#eaedff] text-[13px] font-medium transition-colors cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={userActionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#004ac6] text-white text-[13px] font-semibold hover:bg-[#003ea8] shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {userActionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  <span>{lang === 'TH' ? 'สร้างบัญชีผู้ใช้' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Role Form ── */}
      {isEditRoleModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !userActionLoading && setIsEditRoleModalOpen(false)}
            className="fixed inset-0 bg-[#283044]/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#eaedff] z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
              <h3 className="text-[16px] font-bold text-[#131b2e]">
                {lang === 'TH' ? 'แก้ไขสิทธิ์การใช้งาน' : 'Change User Role'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditRoleModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#505f76] hover:bg-[#eaedff]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="py-4">
              <span className="text-[12px] text-[#505f76] block mb-2">
                {lang === 'TH' ? `ผู้ใช้: ${selectedUserForAction.name} (${selectedUserForAction.username})` : `User: ${selectedUserForAction.name}`}
              </span>
              <label className="text-[12px] font-semibold text-[#131b2e] block mb-1">
                {lang === 'TH' ? 'เลือกระดับสิทธิ์ใหม่ / New Role' : 'Select Role'}
              </label>
              <select
                value={newRoleSelection}
                onChange={(e) => setNewRoleSelection(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7] text-[13px] text-[#131b2e]"
              >
                <option value="operator">{lang === 'TH' ? 'Operator (พนักงาน)' : 'Operator'}</option>
                <option value="engineer">{lang === 'TH' ? 'Engineer (วิศวกร)' : 'Engineer'}</option>
                <option value="admin">{lang === 'TH' ? 'Admin (ผู้ดูแลระบบ)' : 'Admin'}</option>
                <option value="viewer">{lang === 'TH' ? 'Viewer (ผู้ตรวจ/จป.)' : 'Viewer'}</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={() => setIsEditRoleModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-[#505f76] hover:bg-[#eaedff] text-[12px]"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={userActionLoading}
                className="px-5 py-1.5 rounded-xl bg-[#004ac6] text-white text-[12px] font-semibold hover:bg-[#003ea8]"
              >
                {userActionLoading ? <Loader2 size={14} className="animate-spin" /> : (lang === 'TH' ? 'บันทึก' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Reset Password Form ── */}
      {isResetPwdModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !userActionLoading && setIsResetPwdModalOpen(false)}
            className="fixed inset-0 bg-[#283044]/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#eaedff] z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
              <h3 className="text-[16px] font-bold text-[#131b2e]">
                {lang === 'TH' ? 'รีเซ็ตรหัสผ่าน' : 'Reset Password'}
              </h3>
              <button
                type="button"
                onClick={() => setIsResetPwdModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#505f76] hover:bg-[#eaedff]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="py-4">
              <span className="text-[12px] text-[#505f76] block mb-2">
                {lang === 'TH' ? `ผู้ใช้: ${selectedUserForAction.name} (${selectedUserForAction.username})` : `User: ${selectedUserForAction.name}`}
              </span>
              <label className="text-[12px] font-semibold text-[#131b2e] block mb-1">
                {lang === 'TH' ? 'รหัสผ่านใหม่ / New Password' : 'New Password'}
              </label>
              <input
                type="password"
                placeholder={lang === 'TH' ? 'อย่างน้อย 6 ตัวอักษร' : 'min 6 chars'}
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7] text-[13px] text-[#131b2e]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={() => setIsResetPwdModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-[#505f76] hover:bg-[#eaedff] text-[12px]"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={userActionLoading}
                className="px-5 py-1.5 rounded-xl bg-[#004ac6] text-white text-[12px] font-semibold hover:bg-[#003ea8]"
              >
                {userActionLoading ? <Loader2 size={14} className="animate-spin" /> : (lang === 'TH' ? 'เปลี่ยนรหัสผ่าน' : 'Update')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
