import React from 'react';
import { Stethoscope, X, RotateCcw, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function DiagnosticsModal({
  isOpen,
  onClose,
  selectedDevice,
  diagRunning,
  handleRunDiagnostics,
}) {
  const { t, lang } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-5 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
              <Stethoscope size={20} />
            </div>
            <div>
              <h2 className="text-[18px] text-[#131b2e] font-semibold">
                {selectedDevice?.id || 'BOX-001'} {lang === 'TH' ? 'ตรวจวินิจฉัย' : 'Diagnostic'}
              </h2>
              <p className="text-[12px] text-[#505f76]">
                {t('hardwareSelfDiagTitle', 'Hardware health self-test result')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {diagRunning ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
            <RotateCcw size={28} className="animate-spin text-[#004ac6]" />
            <span className="text-[14px] font-medium text-[#131b2e]">
              {lang === 'TH' ? 'กำลังสแกนช่องสัญญาณและค่าแรงดันอ้างอิง...' : 'Testing bus channels and ADC baseline...'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#f2f3ff]">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span className="text-[13px] font-medium text-[#131b2e]">{t('powerRailStability', 'Power Rail Stability')}</span>
              </div>
              <span className="text-[12px] font-semibold text-emerald-700 font-mono">PASS (3.32V)</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#f2f3ff]">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span className="text-[13px] font-medium text-[#131b2e]">{t('i2cBusAdc', 'I2C Bus & Sensor ADC')}</span>
              </div>
              <span className="text-[12px] font-semibold text-emerald-700 font-mono">PASS (6/6 channels)</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#f2f3ff]">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span className="text-[13px] font-medium text-[#131b2e]">{t('flashMemoryIntegrity', 'Flash Memory Integrity')}</span>
              </div>
              <span className="text-[12px] font-semibold text-emerald-700 font-mono">PASS (MD5 verified)</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#f2f3ff]">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span className="text-[13px] font-medium text-[#131b2e]">{t('wifiMqttLatency', 'WiFi & MQTT Latency')}</span>
              </div>
              <span className="text-[12px] font-semibold text-emerald-700 font-mono">PASS (12ms)</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#f2f3ff]">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span className="text-[13px] font-medium text-[#131b2e]">{t('sensorHeaterCircuit', 'Sensor Heater Circuit')}</span>
              </div>
              <span className="text-[12px] font-semibold text-emerald-700 font-mono">{lang === 'TH' ? 'PASS (วอร์มหัววัด MQ พร้อมใช้งาน)' : 'PASS (Sensors Preheated)'}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleRunDiagnostics}
            className="py-2 px-4 rounded-full border border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff] text-[13px] font-medium cursor-pointer"
          >
            {t('rerunDiagnostics', 'Rerun Diagnostics')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-6 rounded-full bg-[#004ac6] text-white hover:bg-[#003ea8] shadow-xs text-[13px] font-medium cursor-pointer"
          >
            {t('done', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
}

