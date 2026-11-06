import { useState } from 'react';
import {
  CloudOff, WifiOff, PowerOff, RefreshCw,
  Clock, History, Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function SystemStates() {
  const { t, isThai } = useLanguage();
  const [toastMsg, setToastMsg] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      showToast(isThai ? 'ส่งคำขอเชื่อมต่อเกตเวย์ใหม่แล้ว ✓' : 'Sent reconnect signal to Gateway ✓');
    }, 1200);
  };

  const handleForcePoll = () => {
    setIsPolling(true);
    setTimeout(() => {
      setIsPolling(false);
      showToast(isThai ? 'ดึงเฟรมโทรมาตรสำเร็จ (TVOC: 64 ppb) ✓' : 'Fetched fresh telemetry frame (TVOC: 64 ppb) ✓');
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-16">
      {/* ── Header matching Stitch 1:1 ── */}
      <div className="flex flex-col mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#505f76]">
            {t('opRefTag')}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#131b2e]">
          {t('systemStatesTitle')}
        </h1>
        <p className="text-[14px] text-[#434655] mt-1">
          {t('systemStatesSubtitle')}
        </p>
      </div>

      {/* ── 2x2 Grid of Card States ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        {/* State 1: Loading */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] mb-1.5 px-1">
            {t('stateLoading')}
          </div>
          <div
            className="bg-white rounded-3xl p-8 shadow-sm border border-[#eaedff] flex flex-col justify-between h-[230px] relative overflow-hidden transition-all duration-200"
            style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-[#e2e7ff] rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-[#eaedff] rounded-full animate-pulse" />
            </div>
            <div className="my-auto flex flex-col gap-2.5">
              <div className="h-10 w-36 bg-[#e2e7ff] rounded-lg animate-pulse" />
              <div className="h-3 w-20 bg-[#eaedff] rounded-full animate-pulse" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="h-4 w-40 bg-[#eaedff] rounded-full animate-pulse" />
              <div className="h-3 w-20 bg-[#e2e7ff] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* State 2: Empty */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] mb-1.5 px-1">
            {t('stateEmpty')}
          </div>
          <div
            className="bg-white rounded-3xl p-8 shadow-sm border border-[#eaedff] flex flex-col justify-between h-[230px] relative overflow-hidden transition-all duration-200"
            style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
                {t('mq2Combustibles')}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#eaedff] text-[11px] font-medium text-[#505f76]">
                {t('inactiveStatus')}
              </span>
            </div>
            <div className="my-auto flex flex-col items-center justify-center text-center px-4">
              <div className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#505f76] mb-3">
                <CloudOff size={20} />
              </div>
              <p className="text-[13px] text-[#434655]">
                {t('noTelemetryMsg')}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#505f76]">
              <span>{t('channel04')}</span>
              <button
                type="button"
                onClick={() => showToast(isThai ? 'ตรวจสอบสายสัญญาณแชนแนล 04: วงจรปกติ' : 'Inspecting line Channel 04: Circuit Normal')}
                className="text-[#004ac6] font-medium cursor-pointer hover:underline"
              >
                {t('inspectLine')}
              </button>
            </div>
          </div>
        </div>

        {/* State 3: Error */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] mb-1.5 px-1">
            {t('stateError')}
          </div>
          <div
            className="bg-white rounded-3xl p-8 shadow-sm border border-[#ffdad6] flex flex-col justify-between h-[230px] relative overflow-hidden transition-all duration-200"
            style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
                {t('mq135Fumes')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ffdad6]/60 text-[11px] font-medium text-[#ba1a1a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                {t('stateError')}
              </span>
            </div>
            <div className="my-auto flex flex-col items-start gap-3">
              <div className="flex items-start gap-2.5">
                <WifiOff size={18} className="text-[#ba1a1a] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#434655] leading-snug">
                  {t('failedSensorStream')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#505f76] font-mono">ERR_GW_TIMEOUT</span>
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#e2e7ff] text-[#004ac6] hover:bg-[#004ac6] hover:text-white text-[12px] font-medium transition-colors cursor-pointer"
              >
                <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                <span>{isRetrying ? (isThai ? 'กำลังเชื่อมต่อ...' : 'Connecting...') : t('retryBtn')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* State 4: Offline */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] mb-1.5 px-1">
            {t('stateOffline')}
          </div>
          <div
            className="bg-white rounded-3xl p-8 shadow-sm border border-[#eaedff] flex flex-col justify-between h-[230px] relative overflow-hidden transition-all duration-200"
            style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
                {t('mq3Alcohol')}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#505f76] text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#737686]" />
                {t('stateOffline')}
              </span>
            </div>
            <div className="my-auto flex flex-col gap-1.5">
              <div className="text-[34px] font-semibold tracking-tight text-[#737686]/50 tabular-nums">
                --.--
              </div>
              <p className="text-[12px] text-[#434655] flex items-center gap-1.5">
                <PowerOff size={15} className="text-[#505f76]" />
                <span>{t('lastSeen42m')}</span>
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#505f76]">
              <span>{t('hwRackA02')}</span>
              <button
                type="button"
                onClick={() => showToast(isThai ? 'เปิดหน้าตรวจวินิจฉัย ESP32 Node 02' : 'Opening diagnostics for ESP32 Node 02')}
                className="text-[#004ac6] font-medium cursor-pointer hover:underline"
              >
                {t('diagnosticsLink')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── State 5: Stale (Wide Card matching Stitch) ── */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] mb-1.5 px-1">
          {t('stateStale')}
        </div>
        <div
          className="w-full bg-white rounded-3xl p-8 shadow-sm border border-[#eaedff] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-all duration-200"
          style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
                TVOC
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdbcd] text-[#943700] text-[11px] font-semibold">
                <Clock size={13} />
                <span>{t('staleDataBadge')}</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-[44px] font-semibold tracking-tight text-[#505f76]/70 tabular-nums leading-none">
                142
              </span>
              <span className="text-[14px] font-medium text-[#505f76]">ppb</span>
            </div>
          </div>

          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex flex-col items-start md:items-end gap-1">
              <div className="flex items-center gap-1.5 text-[12px] text-[#434655] font-medium">
                <History size={16} className="text-[#943700]" />
                <span>{t('updated5mAgo')}</span>
              </div>
              <span className="text-[11px] text-[#505f76]">{t('awaitingNextFrame')}</span>
            </div>

            <button
              type="button"
              onClick={handleForcePoll}
              disabled={isPolling}
              className="h-10 px-4 rounded-xl bg-[#eaedff] hover:bg-[#dbe1ff] text-[#131b2e] font-medium text-[13px] inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw size={16} className={isPolling ? 'animate-spin text-[#004ac6]' : 'text-[#505f76]'} />
              <span>{isPolling ? (isThai ? 'กำลังดึงข้อมูล...' : 'Polling...') : t('forcePollBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[14px] z-50 animate-fade-in">
          <Check size={18} className="text-[#00CC66]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
