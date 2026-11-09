import React from 'react';
import { UserPlus, MoreVertical, UserCheck, KeyRound, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function UsersTab({
  usersList,
  loadingUsers,
  openUserMenuId,
  setOpenUserMenuId,
  setIsAddUserModalOpen,
  setUserActionError,
  setSelectedUserForAction,
  setNewRoleSelection,
  setIsEditRoleModalOpen,
  setNewPasswordInput,
  setIsResetPwdModalOpen,
  handleDeactivateUser,
}) {
  const { t, lang } = useLanguage();

  return (
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
            {loadingUsers ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-[#505f76]">
                  {t('loading', 'Loading users...')}
                </td>
              </tr>
            ) : usersList.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-[#505f76]">
                  {t('noData', 'No users found')}
                </td>
              </tr>
            ) : (
              usersList.map((u) => (
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
                    <span
                      className={`inline-flex items-center gap-1.5 font-medium text-[12px] ${
                        u.isActive ? 'text-[#00CC66]' : 'text-[#ef4444]'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          u.isActive ? 'bg-[#00CC66]' : 'bg-[#ef4444]'
                        }`}
                      />
                      {u.isActive ? t('active', 'Active') : t('inactive', 'Inactive')}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

