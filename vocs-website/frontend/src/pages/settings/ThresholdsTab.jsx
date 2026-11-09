import React from 'react';
import { Activity } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ThresholdsTab({
  thresholds,
  setThresholds,
  selectedDevice,
  setSelectedDevice,
  setHasChanges,
}) {
  const { t } = useLanguage();

  const handleThresholdChange = (key, field, value) => {
    setThresholds((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: Number(value) },
    }));
    setHasChanges(true);
  };

  return (
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
  );
}

