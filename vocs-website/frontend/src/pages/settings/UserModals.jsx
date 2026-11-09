import React from 'react';
import { X, UserPlus, ShieldAlert, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function UserModals({
  isAddUserModalOpen,
  setIsAddUserModalOpen,
  newUserForm,
  setNewUserForm,
  handleCreateUser,
  isEditRoleModalOpen,
  setIsEditRoleModalOpen,
  selectedUserForAction,
  newRoleSelection,
  setNewRoleSelection,
  handleUpdateRole,
  isResetPwdModalOpen,
  setIsResetPwdModalOpen,
  newPasswordInput,
  setNewPasswordInput,
  handleResetPassword,
  userActionLoading,
  userActionError,
}) {
  const { t, lang } = useLanguage();

  return (
    <>
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
    </>
  );
}

