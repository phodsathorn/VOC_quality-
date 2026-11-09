import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders, Bell, Users, Clock, Settings as SettingsIcon, Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Tabs } from '../components/ui';
import apiClient from '../services/apiClient';

import ThresholdsTab from './settings/ThresholdsTab';
import NotificationsTab from './settings/NotificationsTab';
import SlaTab from './settings/SlaTab';
import UsersTab from './settings/UsersTab';
import GeneralTab from './settings/GeneralTab';
import UserModals from './settings/UserModals';

export default function Settings() {
  const { t, lang, setLang } = useLanguage();
  const { token, user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('thresholds');
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('ESP32 Node 01');
  const [openUserMenuId, setOpenUserMenuId] = useState(null);

  // Tab 1: Thresholds
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

  // Tab 4: Users Management
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
    site: 'Main Plant',
  });
  const [newRoleSelection, setNewRoleSelection] = useState('operator');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userActionSuccess, setUserActionSuccess] = useState('');

  // Tab 5: General System Config
  const [generalConfig, setGeneralConfig] = useState({
    timezone: 'Asia/Bangkok (UTC+07:00)',
    retention: '90 days',
    alarmTone: 'Industrial Siren Pulse',
    volume: 75,
  });

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await apiClient.get('/api/users');
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
      }
    } catch {
      // Fallback fallback if API fails
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSave = () => {
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDiscard = () => {
    setHasChanges(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserActionLoading(true);
    setUserActionError('');
    try {
      await apiClient.post('/api/users', newUserForm);
      setIsAddUserModalOpen(false);
      setNewUserForm({ username: '', password: '', full_name: '', role: 'operator', site: 'Main Plant' });
      setUserActionSuccess(lang === 'TH' ? 'สร้างบัญชีผู้ใช้เรียบร้อยแล้ว' : 'User account created successfully');
      setTimeout(() => setUserActionSuccess(''), 3500);
      fetchUsers();
    } catch (err) {
      setUserActionError(err.message || 'Failed to create user');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUserForAction) return;
    setUserActionLoading(true);
    setUserActionError('');
    try {
      await apiClient.patch(`/api/users/${selectedUserForAction.id}`, { role: newRoleSelection });
      setIsEditRoleModalOpen(false);
      setUserActionSuccess(lang === 'TH' ? 'อัปเดตสิทธิ์เรียบร้อย' : 'Role updated successfully');
      setTimeout(() => setUserActionSuccess(''), 3500);
      fetchUsers();
    } catch (err) {
      setUserActionError(err.message || 'Failed to update role');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserForAction || !newPasswordInput) return;
    setUserActionLoading(true);
    setUserActionError('');
    try {
      await apiClient.patch(`/api/users/${selectedUserForAction.id}`, { password: newPasswordInput });
      setIsResetPwdModalOpen(false);
      setNewPasswordInput('');
      setUserActionSuccess(lang === 'TH' ? 'รีเซ็ตรหัสผ่านสำเร็จ' : 'Password reset successfully');
      setTimeout(() => setUserActionSuccess(''), 3500);
      fetchUsers();
    } catch (err) {
      setUserActionError(err.message || 'Failed to reset password');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleDeactivateUser = async (u) => {
    if (!window.confirm(lang === 'TH' ? `ยืนยันระงับบัญชี ${u.name}?` : `Suspend user ${u.name}?`)) return;
    try {
      await apiClient.delete(`/api/users/${u.id}`);
      setUserActionSuccess(lang === 'TH' ? 'ระงับบัญชีผู้ใช้แล้ว' : 'User suspended');
      setTimeout(() => setUserActionSuccess(''), 3500);
      fetchUsers();
    } catch {
      // ignore
    }
  };

  const tabOptions = [
    { id: 'thresholds', label: t('thresholds', 'Thresholds'), icon: Sliders },
    { id: 'notifications', label: t('notifications', 'Notifications'), icon: Bell },
    { id: 'sla', label: t('responseSla', 'Response SLA'), icon: Clock },
    { id: 'users', label: t('users', 'Users'), icon: Users },
    { id: 'general', label: t('general', 'General'), icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#131b2e] tracking-tight">
            {t('settingsTitle', 'System Configuration')}
          </h1>
          <p className="text-[14px] text-[#505f76] mt-1">
            {t('settingsSubtitle', 'Manage sensors, threshold parameters, escalation rules, and hardware alerting.')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      {activeTab === 'thresholds' && (
        <ThresholdsTab
          thresholds={thresholds}
          setThresholds={setThresholds}
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
          setHasChanges={setHasChanges}
        />
      )}

      {activeTab === 'notifications' && (
        <NotificationsTab
          lineConfig={lineConfig}
          setLineConfig={setLineConfig}
          telegramConfig={telegramConfig}
          setTelegramConfig={setTelegramConfig}
          emailConfig={emailConfig}
          setEmailConfig={setEmailConfig}
          setHasChanges={setHasChanges}
        />
      )}

      {activeTab === 'sla' && (
        <SlaTab sla={sla} setSla={setSla} setHasChanges={setHasChanges} />
      )}

      {activeTab === 'users' && (
        <UsersTab
          usersList={usersList}
          loadingUsers={loadingUsers}
          openUserMenuId={openUserMenuId}
          setOpenUserMenuId={setOpenUserMenuId}
          setIsAddUserModalOpen={setIsAddUserModalOpen}
          setUserActionError={setUserActionError}
          setSelectedUserForAction={setSelectedUserForAction}
          setNewRoleSelection={setNewRoleSelection}
          setIsEditRoleModalOpen={setIsEditRoleModalOpen}
          setNewPasswordInput={setNewPasswordInput}
          setIsResetPwdModalOpen={setIsResetPwdModalOpen}
          handleDeactivateUser={handleDeactivateUser}
        />
      )}

      {activeTab === 'general' && (
        <GeneralTab
          generalConfig={generalConfig}
          setGeneralConfig={setGeneralConfig}
          setHasChanges={setHasChanges}
        />
      )}

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-xl border border-[#c3c6d7] rounded-full px-6 py-3 shadow-xl flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#004ac6]" />
            </span>
            <span className="text-[13px] font-medium text-[#131b2e] whitespace-nowrap">
              {t('unsavedChanges', 'Unsaved changes pending')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-1.5 rounded-full border border-[#c3c6d7] hover:bg-[#eaedff] text-[#131b2e] text-[13px] font-medium transition-colors cursor-pointer"
            >
              {t('discard', 'Discard')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-[#004ac6] hover:bg-[#003ea8] text-white font-medium text-[13px] shadow-sm transition-all cursor-pointer"
            >
              <Check size={16} />
              <span>{saved ? t('saved', 'Saved') : t('save', 'Save')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {userActionSuccess && (
        <div className="fixed top-20 right-8 z-50 bg-[#004ac6] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check size={18} />
          <span className="text-[13px] font-medium">{userActionSuccess}</span>
        </div>
      )}

      {/* User Modals */}
      <UserModals
        isAddUserModalOpen={isAddUserModalOpen}
        setIsAddUserModalOpen={setIsAddUserModalOpen}
        newUserForm={newUserForm}
        setNewUserForm={setNewUserForm}
        handleCreateUser={handleCreateUser}
        isEditRoleModalOpen={isEditRoleModalOpen}
        setIsEditRoleModalOpen={setIsEditRoleModalOpen}
        selectedUserForAction={selectedUserForAction}
        newRoleSelection={newRoleSelection}
        setNewRoleSelection={setNewRoleSelection}
        handleUpdateRole={handleUpdateRole}
        isResetPwdModalOpen={isResetPwdModalOpen}
        setIsResetPwdModalOpen={setIsResetPwdModalOpen}
        newPasswordInput={newPasswordInput}
        setNewPasswordInput={setNewPasswordInput}
        handleResetPassword={handleResetPassword}
        userActionLoading={userActionLoading}
        userActionError={userActionError}
      />
    </div>
  );
}
