import React, { useState } from 'react';
import { Eye, EyeOff, Send, Bell, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function NotificationsTab({
  lineConfig,
  setLineConfig,
  telegramConfig,
  setTelegramConfig,
  emailConfig,
  setEmailConfig,
  setHasChanges,
}) {
  const { t } = useLanguage();
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleTestNotification = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
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
              {t('defaultTargetGroupId', 'Default target group / user ID')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lineConfig.groupId}
                onChange={(e) => {
                  setLineConfig({ ...lineConfig, groupId: e.target.value });
                  setHasChanges(true);
                }}
                className="flex-1 h-10 px-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] border border-[#eaedff] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono"
              />
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-4 h-10 rounded-xl border border-[#c3c6d7] hover:bg-[#eaedff] text-[#131b2e] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {testSent ? <Check size={16} className="text-emerald-600" /> : <Send size={16} />}
                <span>{testSent ? t('sent', 'Sent!') : t('sendTest', 'Send Test')}</span>
              </button>
            </div>
          </div>
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
  );
}

