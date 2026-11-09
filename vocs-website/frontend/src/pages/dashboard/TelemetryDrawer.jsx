import React from 'react';
import { Radio, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function TelemetryDrawer({
  isOpen,
  onClose,
  hasWarning,
  allProbes,
  reading,
  boxId,
}) {
  const { t, isThai } = useLanguage();

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#283044]/20 backdrop-blur-[2px] z-50 transition-opacity"
      />
      <aside
        aria-label="Live sensor telemetry"
        className="fixed top-0 right-0 h-full w-full sm:w-[520px] max-w-[100vw] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] transition-transform duration-300 translate-x-0"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Drawer Header */}
          <div className="h-16 px-5 sm:px-6 border-b border-[#eaedff] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#004ac6]/10 flex items-center justify-center text-[#004ac6]">
                <Radio size={18} />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold leading-tight text-[#131b2e]">
                  {t('liveTelemetryTitle')}
                </h2>
                <span className="text-[11px] text-[#505f76]">
                  {isThai ? 'กล่องรวมสัญญาณ BOX-001 (ห้องพ่นสีที่ 1) · 12 แชนแนลตรวจวัด' : 'Sensor Enclosure BOX-001 (Booth 1) · 12 Channels'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors flex items-center justify-center cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body / Table Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-medium">
                {t('realtimeProbeReadings')}
              </span>
              {hasWarning ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[#943700] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
                  {t('warningExceeded')}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-[#00AA55] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#00CC66] animate-pulse" />
                  {t('allSystemsNominal')}
                </div>
              )}
            </div>

            <div className="border border-[#eaedff] rounded-2xl overflow-x-auto bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-[13px] min-w-[440px]">
                <thead>
                  <tr className="bg-[#f2f3ff] border-b border-[#eaedff] text-[#505f76] font-medium text-[12px]">
                    <th className="py-2.5 px-3 whitespace-nowrap">{t('sensorIdCol')}</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">{t('targetGasCol')}</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">{t('valueCol')}</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">{t('thresholdCol')}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">{t('statusCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                  {allProbes.map((probe) => (
                    <tr key={probe.id} className="hover:bg-[#eaedff]/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#004ac6] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{probe.id}</span>
                          <span className="text-[10px] text-[#505f76] font-normal">{probe.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[#131b2e] whitespace-nowrap text-xs font-medium">{probe.target}</td>
                      <td className="py-2.5 px-3 text-right font-medium tabular-nums whitespace-nowrap">{probe.val}</td>
                      <td className="py-2.5 px-3 text-right text-[#505f76] tabular-nums whitespace-nowrap">{probe.thresh}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                            probe.status === 'Warning' || probe.status === 'เฝ้าระวัง'
                              ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          }`}
                        >
                          {probe.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Summary Card inside Drawer */}
            <div className="mt-5 p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-[#131b2e]">{t('samplingRateLabel')}</span>
                <span className="text-[12px] text-[#505f76]">{t('samplingRateContinuous')}</span>
              </div>
              <div className="w-full bg-[#e2e7ff] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#004ac6] h-full rounded-full w-full" />
              </div>
              <p className="text-[11px] text-[#505f76] mt-2">
                {t('latestSyncNotice')}: {reading?.recorded_at ? new Date(reading.recorded_at).toLocaleTimeString() : (isThai ? '3 วินาทีที่แล้ว' : '3 seconds ago')} {isThai ? 'ผ่านเกตเวย์ Modbus TCP' : 'via Modbus TCP gateway'}.
              </p>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-[#eaedff] bg-white shrink-0 flex items-center justify-between">
            <span className="text-[12px] text-[#505f76]">
              {isThai ? 'รหัสกล่องตรวจวัด' : 'Enclosure ID'}: <span className="font-mono text-[#131b2e] font-semibold">{boxId || 'BOX-001'}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#eaedff] text-[#131b2e] text-[13px] font-medium hover:bg-[#dae2fd] transition-colors cursor-pointer"
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

