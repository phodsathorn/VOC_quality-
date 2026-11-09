import React, { useState } from 'react';
import { Router, X, Wifi, Activity, Key, Stethoscope, RotateCcw, Download } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function DeviceDrawer({
  isOpen,
  onClose,
  selectedDevice,
  rebootingNode,
  handleReboot,
  startOta,
  setIsTokenModalOpen,
  setIsDiagModalOpen,
  handleRunDiagnostics,
}) {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !selectedDevice) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#131b2e]/20 backdrop-blur-[2px] transition-opacity">
      <aside className="w-full max-w-[420px] h-full bg-white shadow-2xl flex flex-col justify-between border-l border-[#eaedff] animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="flex flex-col">
          {/* Sticky Header */}
          <div className="px-6 py-5 border-b border-[#eaedff] flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                <Router size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-[18px] text-[#131b2e] leading-tight font-semibold">
                  {selectedDevice.id}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full inline-block ${selectedDevice.isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className={`text-[12px] font-semibold ${selectedDevice.isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedDevice.isOnline ? t('online', 'Online') : t('offline', 'Offline')}
                  </span>
                  <span className="text-[12px] text-[#505f76] font-medium">
                    • {lang === 'TH' ? selectedDevice.typeTh : selectedDevice.type}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs Switcher */}
          <div className="p-6 pb-0">
            <div className="flex rounded-full bg-[#eaedff] p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-white text-[#004ac6] shadow-xs'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                {t('overview', 'Overview')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sensors')}
                className={`flex-1 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
                  activeTab === 'sensors'
                    ? 'bg-white text-[#004ac6] shadow-xs'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                {t('sensors', 'Sensors')}
              </button>
            </div>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="p-6 flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#505f76] px-1 mb-1">
                {t('deviceDetails', 'Device Details')}
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[13px] text-[#505f76]">{t('ipAddress', 'IP address')}</span>
                <span className="text-[13px] font-semibold text-[#131b2e] font-mono">{selectedDevice.ip}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[13px] text-[#505f76]">{t('wifiRssi', 'WiFi RSSI')}</span>
                <div className="flex items-center gap-1.5">
                  <Wifi size={15} className="text-[#004ac6]" />
                  <span className="text-[13px] font-semibold text-[#131b2e]">
                    {selectedDevice.rssi}{' '}
                    <span className="text-[12px] font-normal text-[#505f76]">
                      ({lang === 'TH' ? selectedDevice.signalQualityTh : selectedDevice.signalQuality})
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[13px] text-[#505f76]">{t('voltage', 'Voltage')}</span>
                <span className="text-[13px] font-semibold text-[#131b2e]">{selectedDevice.voltage}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[13px] text-[#505f76]">{t('firmware', 'Firmware')}</span>
                <span className="text-[13px] font-semibold text-[#131b2e]">{selectedDevice.firmware}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[13px] text-[#505f76]">{t('uptime', 'Uptime')}</span>
                <span className="text-[13px] font-semibold text-[#131b2e] font-mono">{selectedDevice.uptime}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[13px] text-[#505f76]">{t('lastSeen', 'Last seen')}</span>
                <span className="text-[13px] font-semibold text-[#131b2e]">
                  {lang === 'TH' ? selectedDevice.lastSeenTh : selectedDevice.lastSeen}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[13px] text-[#505f76]">{t('mqttBroker', 'MQTT')}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full inline-block ${selectedDevice.isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-[13px] font-semibold text-[#131b2e]">
                    {lang === 'TH' ? selectedDevice.mqttTh : selectedDevice.mqtt}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[#f2f3ff]">
                <span className="text-[13px] text-[#505f76]">{t('freeHeap', 'Free heap')}</span>
                <span className="text-[13px] font-semibold text-[#131b2e] font-mono">{selectedDevice.freeHeap}</span>
              </div>
            </div>
          )}

          {/* Tab 2: Sensors */}
          {activeTab === 'sensors' && (
            <div className="p-6 flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#505f76] px-1 mb-1">
                {t('attachedSensorArray', 'Attached Sensor Array (6)')}
              </div>
              {selectedDevice.sensors.map((sensor, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[#f2f3ff] ${
                    sensor.isFault ? 'border border-[#ba1a1a]/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity
                      size={16}
                      className={sensor.isFault ? 'text-rose-600' : 'text-emerald-600'}
                    />
                    <span className="text-[13px] font-semibold text-[#131b2e]">{sensor.name}</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      sensor.isFault
                        ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                    }`}
                  >
                    {sensor.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-[#eaedff] flex flex-col gap-2.5 bg-white sticky bottom-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTokenModalOpen(true)}
              className="flex-1 py-2 px-3 rounded-full border border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff] transition-colors text-[12px] font-medium flex items-center justify-center gap-1 cursor-pointer"
            >
              <Key size={14} className="text-[#505f76]" />
              <span>{t('generateToken', 'Generate token')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDiagModalOpen(true);
                handleRunDiagnostics();
              }}
              className="flex-1 py-2 px-3 rounded-full border border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff] transition-colors text-[12px] font-medium flex items-center justify-center gap-1 cursor-pointer"
            >
              <Stethoscope size={14} className="text-[#505f76]" />
              <span>{t('selfDiagnostic', 'Self-diagnostic')}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleReboot(selectedDevice.id)}
              disabled={rebootingNode === selectedDevice.id}
              className="flex-1 py-2.5 px-4 rounded-full border border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff] transition-colors text-[13px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw
                size={16}
                className={rebootingNode === selectedDevice.id ? 'animate-spin text-[#004ac6]' : 'text-[#505f76]'}
              />
              <span>
                {rebootingNode === selectedDevice.id ? t('rebooting', 'Rebooting...') : t('reboot', 'Reboot')}
              </span>
            </button>
            <button
              type="button"
              onClick={startOta}
              className="flex-1 py-2.5 px-4 rounded-full bg-[#004ac6] text-white hover:bg-[#003ea8] transition-colors text-[13px] font-medium flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download size={16} />
              <span>{t('updateFirmwareOta', 'Update firmware (OTA)')}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

