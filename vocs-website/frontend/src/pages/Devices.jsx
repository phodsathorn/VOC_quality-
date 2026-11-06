import { useState, useEffect } from 'react';
import {
  Wifi, RotateCcw, ShieldCheck,
  Router, Download, X,
  Info, Activity, Check, Copy, Stethoscope, Key
} from 'lucide-react';
import { API } from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function Devices() {
  const { t, lang } = useLanguage();

  const [devices, setDevices] = useState([
    {
      id: 'ESP32 Node 01',
      type: 'Telemetry Node',
      typeTh: 'โหนดส่งสัญญาณโทรมาตร',
      location: 'Chamber Inflow',
      locationTh: 'ช่องอากาศเข้าห้องพ่น',
      status: 'Online',
      isOnline: true,
      rssi: '-58 dBm',
      signalQuality: 'Excellent',
      signalQualityTh: 'ดีเยี่ยม',
      ip: '192.168.1.104',
      voltage: '3.32 V',
      firmware: 'v2.4.1',
      uptime: '18d 06h 42m',
      lastSeen: 'Just now (1s ago)',
      lastSeenTh: 'เมื่อสักครู่ (1 วินาทีที่แล้ว)',
      mqtt: 'Connected (broker.local:1883)',
      mqttTh: 'เชื่อมต่อแล้ว (broker.local:1883)',
      freeHeap: '184 KB (57%)',
      sensors: [
        { name: 'MQ-3 (Alcohol)', status: 'OK', isFault: false },
        { name: 'MQ-2 (Combustibles)', status: 'OK', isFault: false },
        { name: 'Mini PID', status: 'OK', isFault: false },
        { name: 'SGP40', status: 'OK', isFault: false },
        { name: 'TGS2602', status: 'OK', isFault: false },
        { name: 'MQ-137', status: 'Fault', isFault: true }
      ]
    },
    {
      id: 'ESP32 Node 02',
      type: 'Telemetry Node',
      typeTh: 'โหนดส่งสัญญาณโทรมาตร',
      location: 'Curing Tunnel Exit',
      locationTh: 'ทางออกอุโมงค์อบแห้ง',
      status: 'Online',
      isOnline: true,
      rssi: '-64 dBm',
      signalQuality: 'Good',
      signalQualityTh: 'ดี',
      ip: '192.168.1.108',
      voltage: '3.30 V',
      firmware: 'v2.4.1',
      uptime: '18d 06h 40m',
      lastSeen: '12s ago',
      lastSeenTh: '12 วินาทีที่แล้ว',
      mqtt: 'Connected (broker.local:1883)',
      mqttTh: 'เชื่อมต่อแล้ว (broker.local:1883)',
      freeHeap: '192 KB (60%)',
      sensors: [
        { name: 'PID-VOC', status: 'OK', isFault: false },
        { name: 'PM2.5 Optical', status: 'OK', isFault: false },
        { name: 'Pitot Airflow', status: 'OK', isFault: false }
      ]
    },
    {
      id: 'Gateway Hub',
      type: 'Industrial Edge Hub',
      typeTh: 'ฮับเครือข่ายอุตสาหกรรม',
      location: 'Control Room Rack A',
      locationTh: 'ห้องควบคุม แร็ค A',
      status: 'Offline',
      isOnline: false,
      rssi: '-58 dBm',
      signalQuality: 'Strong',
      signalQualityTh: 'แรง',
      ip: '192.168.1.1',
      voltage: '12.0 V',
      firmware: 'v2.4.1',
      uptime: '42d 12h 15m',
      lastSeen: '18m ago',
      lastSeenTh: '18 นาทีที่แล้ว',
      mqtt: 'Standby Failover',
      mqttTh: 'โหมดสำรองพร้อมทำงาน',
      freeHeap: '1.2 GB (82%)',
      sensors: [
        { name: 'Modbus TCP Broker', status: 'OK', isFault: false },
        { name: 'LTE Failover Uplink', status: 'OK', isFault: false }
      ]
    },
  ]);

  const [selectedDevice, setSelectedDevice] = useState(devices[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sensors'
  const [rebootingNode, setRebootingNode] = useState(null);

  // Modals
  const [isOtaModalOpen, setIsOtaModalOpen] = useState(false);
  const [otaProgress, setOtaProgress] = useState(68);
  const [isDiagModalOpen, setIsDiagModalOpen] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Load real devices from backend if available
  useEffect(() => {
    let isMounted = true;
    async function fetchDevices() {
      try {
        const res = await fetch(`${API}/api/devices`);
        if (res.ok && isMounted) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setDevices((prev) =>
              prev.map((dev, idx) => {
                const apiDev = list[idx] || list.find((d) => d.id === dev.id);
                if (!apiDev) return dev;
                return {
                  ...dev,
                  id: apiDev.id || dev.id,
                  status: apiDev.status || dev.status,
                  firmware: apiDev.firmware || dev.firmware,
                  uptime: apiDev.last_seen ? `${apiDev.last_seen}` : dev.uptime,
                };
              })
            );
          }
        }
      } catch (err) {
        console.warn('Devices fetch error:', err);
      }
    }
    fetchDevices();
  }, []);

  function handleReboot(nodeId) {
    setRebootingNode(nodeId);
    setTimeout(() => {
      setRebootingNode(null);
    }, 1800);
  }

  function startOta() {
    setIsOtaModalOpen(true);
    setOtaProgress(15);
    const interval = setInterval(() => {
      setOtaProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 12;
      });
    }, 600);
  }

  function handleRunDiagnostics() {
    setDiagRunning(true);
    setTimeout(() => {
      setDiagRunning(false);
    }, 1400);
  }

  function handleCopyToken() {
    navigator.clipboard.writeText('tok_esp32_9f82a17c4b0e883d8a7199c2');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2200);
  }

  return (
    <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
      {/* ── Page Header matching Stitch AI ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-6 rounded-full bg-[#004ac6] inline-block" />
          <h1 className="text-[20px] font-semibold text-[#131b2e] tracking-tight">
            {t('devices', 'Devices')}
          </h1>
        </div>
        <p className="text-[14px] text-[#434655] pl-4">
          {t('telemetryHardwareStatus', 'Telemetry hardware & connection status')}
        </p>
      </div>

      {/* ── 3 Main Device Cards Grid matching Stitch 1:1 ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {devices.map((d) => {
          const isSelected = drawerOpen && selectedDevice?.id === d.id;
          return (
            <div
              key={d.id}
              onClick={() => {
                setSelectedDevice(d);
                setDrawerOpen(true);
              }}
              className={`relative bg-white rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[300px] border border-[#eaedff] cursor-pointer ${
                isSelected ? 'ring-2 ring-[#004ac6] ring-offset-2 ring-offset-[#faf8ff]' : ''
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[#131b2e] font-semibold">
                    {d.id}
                  </span>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                      d.isOnline
                        ? 'bg-[#f2f3ff] text-[#004ac6]'
                        : 'bg-[#eaedff] text-[#505f76]'
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      {d.isOnline && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75" />
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          d.isOnline ? 'bg-[#004ac6]' : 'bg-[#737686]'
                        }`}
                      />
                    </span>
                    <span className="text-[12px] font-semibold">
                      {d.isOnline ? t('online', 'Online') : t('offline', 'Offline')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-[#131b2e]">
                  <Wifi
                    size={22}
                    className={d.isOnline ? 'text-[#004ac6]' : 'text-[#737686]'}
                  />
                  <span className="text-[22px] font-semibold leading-none tracking-tight tabular-nums">
                    {d.rssi}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#f2f3ff]">
                <span className="text-[12px] text-[#505f76] font-medium">
                  {t('firmware', 'Firmware')} {d.firmware}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReboot(d.id);
                  }}
                  disabled={rebootingNode === d.id}
                  className="px-4 py-1.5 rounded-full bg-[#eaedff] text-[#131b2e] hover:bg-[#dbe1ff] transition-colors text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw
                    size={14}
                    className={rebootingNode === d.id ? 'animate-spin text-[#004ac6]' : 'text-[#505f76]'}
                  />
                  <span>
                    {rebootingNode === d.id ? t('rebooting', 'Rebooting...') : t('reboot', 'Reboot')}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right-side Drawer matching stitch_air_quality_minimal_dashboard/devices_esp32_node_01_drawer_diagnostics ── */}
      {drawerOpen && selectedDevice && (
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
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${selectedDevice.isOnline ? 'bg-[#004ac6]' : 'bg-[#737686]'}`} />
                      <span className="text-[12px] text-[#505f76] font-medium">
                        {selectedDevice.isOnline ? t('online', 'Online') : t('offline', 'Offline')} • {lang === 'TH' ? selectedDevice.typeTh : selectedDevice.type}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs Switcher matching Stitch */}
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
                      <span className="w-2 h-2 rounded-full bg-[#004ac6] inline-block" />
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

              {/* Tab 2: Sensors matching Stitch */}
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
                          className={sensor.isFault ? 'text-[#ba1a1a]' : 'text-[#004ac6]'}
                        />
                        <span className="text-[13px] font-semibold text-[#131b2e]">{sensor.name}</span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          sensor.isFault
                            ? 'bg-[#ba1a1a] text-white'
                            : 'bg-[#e2e7ff] text-[#004ac6]'
                        }`}
                      >
                        {sensor.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions matching Stitch */}
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
      )}

      {/* ── Modal 1: Generate Device Token matching Stitch ── */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                  <Key size={18} />
                </div>
                <h2 className="text-[18px] text-[#131b2e] font-semibold">
                  {t('generateTokenTitle', 'Generate Device Token')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-[#505f76] text-[13px] leading-relaxed">
              {t('deviceAuthTokenDesc', 'Device authentication token for direct TLS telemetry ingestion.')}
            </p>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#eaedff] font-mono text-[12px] text-[#131b2e] border border-[#c3c6d7]">
                <span className="truncate select-all">tok_esp32_9f82a17c4b0e883d8a7199c2</span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="text-[#737686] hover:text-[#004ac6] cursor-pointer ml-2 p-1"
                >
                  <Copy size={16} />
                </button>
              </div>
              <span className="text-[11px] text-[#943700] font-medium flex items-center gap-1 mt-1">
                <Info size={14} />
                {t('shownOnceNote', 'Shown only once. Store securely before closing.')}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="py-2 px-4 rounded-full border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a]/10 text-[13px] font-medium cursor-pointer"
              >
                {t('revoke', 'Revoke')}
              </button>
              <button
                type="button"
                onClick={handleCopyToken}
                className="py-2 px-5 rounded-full bg-[#004ac6] text-white hover:bg-[#003ea8] shadow-xs text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={16} />
                <span>{copiedToken ? t('copied', 'Copied ✓') : t('copy', 'Copy')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Hardware Self-Diagnostics matching Stitch ── */}
      {isDiagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] text-[#131b2e] font-semibold">
                    {selectedDevice?.id || 'ESP32 Node 01'} {lang === 'TH' ? 'ตรวจวินิจฉัย' : 'Diagnostic'}
                  </h2>
                  <p className="text-[12px] text-[#505f76]">
                    {t('hardwareSelfDiagTitle', 'Hardware health self-test result')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiagModalOpen(false)}
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
                    <Check size={16} className="text-[#004ac6]" />
                    <span className="text-[13px] font-medium text-[#131b2e]">{t('powerRailStability', 'Power Rail Stability')}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#004ac6] font-mono">PASS (3.32V)</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#f2f3ff]">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-[#004ac6]" />
                    <span className="text-[13px] font-medium text-[#131b2e]">{t('i2cBusAdc', 'I2C Bus & Sensor ADC')}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#004ac6] font-mono">PASS (6/6 channels)</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#f2f3ff]">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-[#004ac6]" />
                    <span className="text-[13px] font-medium text-[#131b2e]">{t('flashMemoryIntegrity', 'Flash Memory Integrity')}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#004ac6] font-mono">PASS (MD5 verified)</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#f2f3ff]">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-[#004ac6]" />
                    <span className="text-[13px] font-medium text-[#131b2e]">{t('wifiMqttLatency', 'WiFi & MQTT Latency')}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#004ac6] font-mono">PASS (12ms)</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#ffdad6]/40 border border-[#ba1a1a]/30">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-[#ba1a1a]" />
                    <span className="text-[13px] font-medium text-[#131b2e]">{t('sensorHeaterCircuit', 'Sensor Heater Circuit')}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#ba1a1a]">{lang === 'TH' ? 'ผิดพลาด (วงจร MQ-137 เปิด)' : 'Fault (MQ-137 loop open)'}</span>
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
                onClick={() => setIsDiagModalOpen(false)}
                className="py-2 px-6 rounded-full bg-[#004ac6] text-white hover:bg-[#003ea8] shadow-xs text-[13px] font-medium cursor-pointer"
              >
                {t('done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Update Firmware (OTA) matching Stitch ── */}
      {isOtaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                  <Download size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] text-[#131b2e] font-semibold">
                    {t('firmwareUpdateOtaTitle', 'Update Firmware (OTA)')}
                  </h2>
                  <p className="text-[12px] text-[#505f76]">
                    {lang === 'TH' ? `เป้าหมาย: ${selectedDevice?.id || 'ESP32 Node 01'} (เวอร์ชันปัจจุบัน v2.4.1)` : `Target: ${selectedDevice?.id || 'ESP32 Node 01'} (Current v2.4.1)`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOtaModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {t('selectVersion', 'Select Version')}
                </label>
                <button type="button" className="text-[12px] text-[#004ac6] hover:underline font-medium cursor-pointer">
                  {t('rollback', 'Rollback')}
                </button>
              </div>
              <select className="w-full px-3 py-2.5 rounded-2xl bg-[#f2f3ff] border border-[#c3c6d7] text-[14px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer">
                <option>v2.5.0 ({lang === 'TH' ? 'ล่าสุด' : 'Latest'})</option>
                <option>v2.4.2</option>
                <option>v2.4.1 ({lang === 'TH' ? 'ปัจจุบัน' : 'Current'})</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#131b2e]">
                  {otaProgress < 100
                    ? (lang === 'TH' ? 'กำลังเขียนข้อมูลพาร์ติชัน...' : 'Flashing partitions...')
                    : t('updateComplete', 'Update Complete!')}
                </span>
                <span className="font-mono font-bold text-[#004ac6]">{otaProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#eaedff] overflow-hidden">
                <div
                  className="h-full bg-[#004ac6] rounded-full transition-all duration-300"
                  style={{ width: `${otaProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-[#505f76]">
                {otaProgress < 100
                  ? (lang === 'TH' ? 'ส่งแล้ว 892 KB จาก 1,312 KB • ประมาณ 4 วินาที' : 'Transferred 892 KB of 1,312 KB • ETA 4s')
                  : (lang === 'TH' ? 'ติดตั้งเฟิร์มแวร์เรียบร้อย กำลังรีบูตระบบ' : 'Firmware verified, rebooting node')}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOtaModalOpen(false)}
                className="py-2 px-4 rounded-full border border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff] text-[13px] font-medium cursor-pointer"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => setIsOtaModalOpen(false)}
                className="py-2 px-6 rounded-full bg-[#004ac6] text-white hover:bg-[#003ea8] shadow-xs text-[13px] font-medium cursor-pointer"
              >
                {t('continueText', 'Continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
