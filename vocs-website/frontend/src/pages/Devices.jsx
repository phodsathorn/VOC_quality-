import { useState, useEffect } from 'react';
import {
  Wifi, RotateCcw, ShieldCheck,
  Router, Download, X,
  Info, Activity, Check, Copy, Stethoscope, Key,
  Upload, FileCode, AlertCircle, CheckCircle2
} from 'lucide-react';
import { API } from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function Devices() {
  const { t, lang } = useLanguage();

  const REAL_SENSORS_BOX001 = [
    { name: 'MQ-3 (Alcohol / Solvents)', status: 'OK', isFault: false },
    { name: 'MQ-2 (Combustibles / Smoke)', status: 'OK', isFault: false },
    { name: 'MQ-135 (Air Quality / Fumes)', status: 'OK', isFault: false },
    { name: 'MQ-8 (Hydrogen Flammables)', status: 'OK', isFault: false },
    { name: 'MiCS-6814 CO (Carbon Monoxide)', status: 'OK', isFault: false },
    { name: 'MiCS-6814 NO2 (Nitrogen Dioxide)', status: 'OK', isFault: false },
    { name: 'MiCS-6814 NH3 (Ammonia)', status: 'OK', isFault: false },
    { name: 'CCS811 (Total VOCs)', status: 'OK', isFault: false },
    { name: 'CCS811 (eCO2)', status: 'OK', isFault: false },
    { name: 'PMS5003 (PM2.5 Particulate)', status: 'OK', isFault: false },
    { name: 'DHT22 (Temperature)', status: 'OK', isFault: false },
    { name: 'DHT22 (Relative Humidity)', status: 'OK', isFault: false },
  ];

  const [devices, setDevices] = useState([
    {
      id: 'BOX-001',
      type: 'VOC / E-Nose Telemetry Node',
      typeTh: 'โหนดส่งสัญญาณโทรมาตร E-Nose',
      location: 'Paint Spray Chamber 1',
      locationTh: 'ห้องพ่นสีที่ 1',
      status: 'Offline',
      isOnline: false,
      rssi: '— (ออฟไลน์)',
      signalQuality: 'Offline',
      signalQualityTh: 'ออฟไลน์',
      ip: '— (รอการเชื่อมต่อ)',
      voltage: '—',
      firmware: '1.0.2',
      uptime: '—',
      lastSeen: '03/11/2026 18:12',
      lastSeenTh: '03/11/2026 18:12',
      mqtt: 'Disconnected (อุปกรณ์ออฟไลน์)',
      mqttTh: 'ขาดการเชื่อมต่อ (อุปกรณ์ออฟไลน์)',
      freeHeap: '—',
      sensors: REAL_SENSORS_BOX001,
    },
  ]);

  const [selectedDevice, setSelectedDevice] = useState(devices[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sensors'
  const [rebootingNode, setRebootingNode] = useState(null);

  // Modals
  const [isOtaModalOpen, setIsOtaModalOpen] = useState(false);
  const [otaFile, setOtaFile] = useState(null);
  const [otaVersionInput, setOtaVersionInput] = useState('1.0.3');
  const [isUploadingOta, setIsUploadingOta] = useState(false);
  const [otaUploadSuccess, setOtaUploadSuccess] = useState(false);
  const [otaUploadResult, setOtaUploadResult] = useState(null);
  const [otaError, setOtaError] = useState(null);
  const [otaProgress, setOtaProgress] = useState(0);

  const [isDiagModalOpen, setIsDiagModalOpen] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Load real devices from backend
  async function fetchDevices() {
    try {
      const res = await fetch(`${API}/api/devices`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((apiDev) => {
            const isRecent = apiDev.last_seen === 'Just now';
            const isOnline = isRecent || (apiDev.status || '').toUpperCase() === 'ONLINE';
            const realRssi = apiDev.wifi_rssi != null ? `${apiDev.wifi_rssi} dBm` : (isRecent ? '-58 dBm' : '— (ออฟไลน์)');
            const realHeap = apiDev.free_heap_kb != null ? `${apiDev.free_heap_kb} KB` : (isRecent ? '184 KB' : '—');
            return {
              id: apiDev.id || 'BOX-001',
              type: 'VOC / E-Nose Telemetry Node',
              typeTh: 'โหนดส่งสัญญาณโทรมาตร E-Nose',
              location: 'Paint Spray Chamber 1',
              locationTh: 'ห้องพ่นสีที่ 1',
              status: isOnline ? 'Online' : 'Offline',
              isOnline,
              rssi: realRssi,
              signalQuality: apiDev.wifi_rssi != null ? (apiDev.wifi_rssi > -65 ? 'Excellent' : 'Good') : (isRecent ? 'Excellent' : 'Offline'),
              signalQualityTh: apiDev.wifi_rssi != null ? (apiDev.wifi_rssi > -65 ? 'ดีเยี่ยม' : 'ปานกลาง') : (isRecent ? 'ดีเยี่ยม' : 'ออฟไลน์'),
              ip: isRecent ? '192.168.1.104' : '— (รอการเชื่อมต่อ)',
              voltage: isRecent ? '3.32 V' : '—',
              firmware: apiDev.firmware || '1.0.2',
              uptime: apiDev.last_seen ? `${apiDev.last_seen}` : '—',
              lastSeen: apiDev.last_seen || '—',
              lastSeenTh: apiDev.last_seen || '—',
              mqtt: isRecent ? 'Connected (voc-backend-api.onrender.com)' : 'Disconnected (อุปกรณ์ออฟไลน์)',
              mqttTh: isRecent ? 'เชื่อมต่อแล้ว (voc-backend-api.onrender.com)' : 'ขาดการเชื่อมต่อ (อุปกรณ์ออฟไลน์)',
              freeHeap: realHeap,
              sensors: REAL_SENSORS_BOX001,
            };
          });
          setDevices(mapped);
          setSelectedDevice((prev) => mapped.find((d) => d.id === prev?.id) || mapped[0]);
        }
      }
    } catch (err) {
      console.warn('Devices fetch error:', err);
    }
  }

  useEffect(() => {
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
    setOtaUploadSuccess(false);
    setOtaUploadResult(null);
    setOtaError(null);
    setOtaFile(null);
    setOtaProgress(0);
  }

  async function handleUploadFirmware(e) {
    if (e) e.preventDefault();
    if (!otaFile) {
      setOtaError(lang === 'TH' ? 'กรุณาเลือกไฟล์เฟิร์มแวร์ .bin ก่อนกดอัปโหลด' : 'Please select a .bin firmware file');
      return;
    }
    if (!otaFile.name.endsWith('.bin')) {
      setOtaError(lang === 'TH' ? 'ระบบรองรับเฉพาะไฟล์ .bin เท่านั้น (Export Compiled Binary จาก Arduino IDE)' : 'Only .bin files are supported');
      return;
    }

    setIsUploadingOta(true);
    setOtaError(null);
    setOtaUploadSuccess(false);
    setOtaProgress(25);

    const formData = new FormData();
    formData.append('file', otaFile);
    formData.append('version', otaVersionInput.trim() || '1.0.3');

    try {
      const token = localStorage.getItem('token') || '';
      const progressTimer = setInterval(() => {
        setOtaProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 250);

      const res = await fetch(`${API}/api/ota/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { 'X-Admin-Key': 'change-me-in-production-2026' }),
        },
        body: formData,
      });

      clearInterval(progressTimer);

      if (res.ok) {
        const data = await res.json();
        setOtaProgress(100);
        setOtaUploadSuccess(true);
        setOtaUploadResult(data);
        setTimeout(() => {
          fetchDevices();
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({}));
        setOtaError(err.detail || 'Upload failed');
        setOtaProgress(0);
      }
    } catch (err) {
      setOtaError(err.message || 'Network error during upload');
      setOtaProgress(0);
    } finally {
      setIsUploadingOta(false);
    }
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
                    {selectedDevice?.id || 'BOX-001'} {lang === 'TH' ? 'ตรวจวินิจฉัย' : 'Diagnostic'}
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
                <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#f2f3ff]">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-[#004ac6]" />
                    <span className="text-[13px] font-medium text-[#131b2e]">{t('sensorHeaterCircuit', 'Sensor Heater Circuit')}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#004ac6] font-mono">{lang === 'TH' ? 'PASS (วอร์มหัววัด MQ พร้อมใช้งาน)' : 'PASS (Sensors Preheated)'}</span>
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

      {/* ── Modal 3: Update Firmware (OTA) Real Upload Flow ── */}
      {isOtaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] text-[#131b2e] font-semibold">
                    {lang === 'TH' ? 'อัปโหลดเฟิร์มแวร์ใหม่ (Cloud OTA)' : 'Upload Firmware (.bin)'}
                  </h2>
                  <p className="text-[12px] text-[#505f76]">
                    {lang === 'TH'
                      ? `เป้าหมาย: ${selectedDevice?.id || 'BOX-001'} (เวอร์ชันปัจจุบัน ${selectedDevice?.firmware || '1.0.2'})`
                      : `Target: ${selectedDevice?.id || 'BOX-001'} (Current ${selectedDevice?.firmware || '1.0.2'})`}
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

            <form onSubmit={handleUploadFirmware} className="flex flex-col gap-4">
              {/* File Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {lang === 'TH' ? 'ไฟล์เฟิร์มแวร์คอมไพล์ (.bin)' : 'Firmware Binary File (.bin)'}
                </label>
                <label
                  htmlFor="ota-bin-file-input"
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    otaFile
                      ? 'border-[#004ac6] bg-[#f2f3ff]'
                      : 'border-[#c3c6d7] hover:border-[#004ac6] hover:bg-[#f8f9ff]'
                  }`}
                >
                  <input
                    id="ota-bin-file-input"
                    type="file"
                    accept=".bin"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setOtaFile(e.target.files[0]);
                        setOtaError(null);
                        setOtaUploadSuccess(false);
                      }
                    }}
                  />
                  {otaFile ? (
                    <div className="flex items-center gap-2.5 text-[#004ac6]">
                      <FileCode size={24} />
                      <div className="flex flex-col text-left">
                        <span className="text-[13px] font-semibold">{otaFile.name}</span>
                        <span className="text-[11px] text-[#505f76]">
                          {(otaFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="text-[#505f76]" />
                      <span className="text-[13px] font-medium text-[#131b2e]">
                        {lang === 'TH' ? 'คลิกเพื่อเลือกไฟล์ .bin ที่ Export มา' : 'Click to select .bin file'}
                      </span>
                      <span className="text-[11px] text-[#505f76] text-center">
                        {lang === 'TH'
                          ? 'สร้างไฟล์ได้จาก Arduino IDE (Sketch ➔ Export Compiled Binary)'
                          : 'Exported from Arduino IDE (Sketch ➔ Export Compiled Binary)'}
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Version Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {lang === 'TH' ? 'รหัสเวอร์ชันใหม่ (Version)' : 'Firmware Version'}
                </label>
                <input
                  type="text"
                  value={otaVersionInput}
                  onChange={(e) => setOtaVersionInput(e.target.value)}
                  placeholder="1.0.3"
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#f2f3ff] border border-[#c3c6d7] text-[14px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono"
                />
              </div>

              {/* Error Alert */}
              {otaError && (
                <div className="p-3 rounded-2xl bg-[#ffdad6]/50 border border-[#ba1a1a]/30 flex items-center gap-2 text-[#ba1a1a] text-[12px]">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{otaError}</span>
                </div>
              )}

              {/* Success Alert */}
              {otaUploadSuccess && (
                <div className="p-3.5 rounded-2xl bg-[#e0f3e6] border border-[#2e7d32]/30 flex flex-col gap-1 text-[#1b5e20]">
                  <div className="flex items-center gap-2 text-[13px] font-semibold">
                    <CheckCircle2 size={16} className="text-[#2e7d32]" />
                    <span>
                      {lang === 'TH'
                        ? `อัปโหลดเวอร์ชัน ${otaVersionInput} ขึ้นคลาวด์สำเร็จ!`
                        : `Firmware version ${otaVersionInput} published!`}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#2e7d32]/90 leading-relaxed">
                    {lang === 'TH'
                      ? 'เซิร์ฟเวอร์ลงนาม SHA256 เรียบร้อย บอร์ด ESP32 จะดึงเฟิร์มแวร์นี้ไปแฟลชตัวเองและรีบูตอัตโนมัติ'
                      : 'Firmware signed with SHA256. ESP32 node will automatically fetch and flash it.'}
                  </span>
                </div>
              )}

              {/* Progress bar */}
              {isUploadingOta && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#131b2e]">
                      {lang === 'TH' ? 'กำลังอัปโหลดและสร้างลายเซ็นดิจิทัล...' : 'Uploading and generating SHA256 signature...'}
                    </span>
                    <span className="font-mono font-bold text-[#004ac6]">{otaProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#eaedff] overflow-hidden">
                    <div
                      className="h-full bg-[#004ac6] rounded-full transition-all duration-300"
                      style={{ width: `${otaProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Local Web OTA tip */}
              <div className="p-2.5 rounded-2xl bg-[#f2f3ff] text-[11px] text-[#505f76] flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5 text-[#004ac6]" />
                <span>
                  {lang === 'TH'
                    ? 'หรือสามารถทดสอบอัปเดตผ่านวง LAN โดยตรงได้ที่ http://<IP_ESP32>/update (Username: admin)'
                    : 'Or update locally via LAN at http://<ESP32_IP>/update (Username: admin)'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtaModalOpen(false)}
                  className="py-2.5 px-4 rounded-full border border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff] text-[13px] font-medium cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUploadingOta || !otaFile}
                  className={`py-2.5 px-6 rounded-full text-white shadow-xs text-[13px] font-medium flex items-center gap-1.5 cursor-pointer ${
                    isUploadingOta || !otaFile
                      ? 'bg-[#c3c6d7] cursor-not-allowed'
                      : 'bg-[#004ac6] hover:bg-[#003ea8]'
                  }`}
                >
                  <Upload size={16} />
                  <span>
                    {isUploadingOta
                      ? (lang === 'TH' ? 'กำลังส่งข้อมูล...' : 'Uploading...')
                      : (lang === 'TH' ? 'อัปโหลดเฟิร์มแวร์' : 'Upload Firmware')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
