import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function GeneralTab({
  generalConfig,
  setGeneralConfig,
  setHasChanges,
}) {
  const { t, lang, setLang } = useLanguage();

  return (
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
  );
}

