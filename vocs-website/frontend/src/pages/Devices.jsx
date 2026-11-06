import { useState, useEffect } from 'react';
import {
  Wifi, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2,
  HardDrive, Cpu, Radio, Router, Download, ArrowUpRight, X,
  Info
} from 'lucide-react';
import { API } from '../config';
import { Drawer } from '../components/ui';

export default function Devices() {
  const [devices, setDevices] = useState([
    {
      id: 'ESP32 Node 01',
      type: 'Telemetry Node',
      location: 'Chamber Inflow',
      status: 'Online',
      isOnline: true,
      rssi: '-58 dBm',
      signalQuality: 'Excellent',
      ip: '192.168.1.104',
      voltage: '3.32 V',
      firmware: 'v2.4.1',
      uptime: '18d 06h 42m',
      sensors: 'MQ-135, MQ-2, MQ-3, MQ-8, MiCS-5524',
    },
    {
      id: 'ESP32 Node 02',
      type: 'Telemetry Node',
      location: 'Curing Tunnel Exit',
      status: 'Online',
      isOnline: true,
      rssi: '-64 dBm',
      signalQuality: 'Good',
      ip: '192.168.1.108',
      voltage: '3.30 V',
      firmware: 'v2.4.1',
      uptime: '18d 06h 40m',
      sensors: 'PID-VOC, PM2.5 Optical, Pitot Airflow',
    },
    {
      id: 'Gateway Hub',
      type: 'Industrial Edge Hub',
      location: 'Control Room Rack A',
      status: 'Online',
      isOnline: true,
      rssi: '-42 dBm',
      signalQuality: 'Strong',
      ip: '192.168.1.1',
      voltage: '12.0 V',
      firmware: 'v3.1.0-modbus',
      uptime: '42d 12h 15m',
      sensors: 'Modbus TCP Broker, LTE Failover Uplink',
    },
  ]);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [rebootingNode, setRebootingNode] = useState(null);
  const [isOtaModalOpen, setIsOtaModalOpen] = useState(false);
  const [otaProgress, setOtaProgress] = useState(68);
  const [isDiagModalOpen, setIsDiagModalOpen] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResults, setDiagResults] = useState(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Load real devices from backend
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
                  uptime: apiDev.last_seen ? `Last seen: ${apiDev.last_seen}` : dev.uptime,
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
    setDiagResults(null);
    setTimeout(() => {
      setDiagRunning(false);
      setDiagResults([
        { phase: 'I2C/UART Connectivity', status: 'PASS', detail: 'All 8 sensor bus lines responding normally' },
        { phase: '12-bit ADC Noise Floor', status: 'PASS', detail: 'RMS noise 8.4 mV (well below 15 mV threshold)' },
        { phase: 'Baseline Drift Evaluation', status: 'PASS', detail: 'Zero-air baseline stable across 24h window' },
      ]);
    }, 1600);
  }

  function handleCopyToken() {
    navigator.clipboard.writeText('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.node01-ingest-token-2026');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  }

  return (
    <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#131b2e] tracking-tight">
            Connected Devices
          </h1>
          <p className="text-[14px] text-[#434655] mt-0.5">
            Real-time status of wireless ESP32 edge telemetry nodes and Modbus gateway.
          </p>
        </div>
      </div>

      {/* ── 3 Main Device Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {devices.map((d) => (
          <div
            key={d.id}
            onClick={() => setSelectedDevice(d)}
            className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[280px] border border-[#eaedff] cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-semibold text-[#505f76] uppercase tracking-wider">
                  {d.location}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#d0e1fb] text-[#004ac6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] animate-pulse" />
                  {d.status}
                </span>
              </div>
              <h3 className="text-[20px] font-bold text-[#131b2e] leading-tight group-hover:text-[#004ac6] transition-colors">
                {d.id}
              </h3>
              <span className="text-[12px] text-[#505f76] mt-0.5 block">{d.type}</span>
            </div>

            <div className="py-2">
              <div className="text-[11px] font-semibold text-[#505f76] uppercase tracking-wider">
                Signal Strength (RSSI)
              </div>
              <div className="flex items-center gap-2.5 text-[#131b2e] pt-2">
                <Wifi size={22} className={d.isOnline ? 'text-[#004ac6]' : 'text-[#94a3b8]'} />
                <span className="text-[24px] font-bold tracking-tight leading-none tabular-nums">
                  {d.rssi}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#f1f5f9]">
              <span className="text-[12px] text-[#434655] font-semibold">
                {d.firmware}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReboot(d.id);
                }}
                disabled={rebootingNode === d.id}
                className="px-4 py-1.5 rounded-full bg-[#eaedff] text-[#131b2e] hover:bg-[#dbe1ff] transition-colors text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw
                  size={14}
                  className={rebootingNode === d.id ? 'animate-spin text-[#004ac6]' : 'text-[#434655]'}
                />
                <span>{rebootingNode === d.id ? 'Rebooting...' : 'Reboot'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sub-State Right Drawer: ESP32 Node 01 ── */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#131b2e]/20 backdrop-blur-[2px] transition-opacity">
          <div className="w-full max-w-[420px] h-full bg-white shadow-2xl flex flex-col justify-between border-l border-[#eaedff] animate-in slide-in-from-right duration-300">
            <div className="flex flex-col">
              {/* Sticky Header */}
              <div className="px-6 py-4 border-b border-[#eaedff] flex items-center justify-between sticky top-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
                    <Router size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[18px] text-[#131b2e] leading-tight font-semibold">
                      {selectedDevice.id}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] inline-block" />
                      <span className="text-[11px] text-[#505f76] font-medium">
                        Online • Telemetry Node
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDevice(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Specs List */}
              <div className="p-6 flex flex-col gap-2">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#505f76] px-1 mb-1">
                  Device Details
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#f2f3ff]">
                  <span className="text-[13px] text-[#505f76]">IP address</span>
                  <span className="text-[13px] font-semibold text-[#131b2e] font-mono">
                    {selectedDevice.ip}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#f2f3ff]">
                  <span className="text-[13px] text-[#505f76]">WiFi RSSI</span>
                  <div className="flex items-center gap-1.5">
                    <Wifi size={14} className="text-[#004ac6]" />
                    <span className="text-[13px] font-semibold text-[#131b2e]">
                      {selectedDevice.rssi}{' '}
                      <span className="text-[12px] font-normal text-[#505f76]">
                        ({selectedDevice.signalQuality})
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#f2f3ff]">
                  <span className="text-[13px] text-[#505f76]">Voltage</span>
                  <span className="text-[13px] font-semibold text-[#131b2e]">
                    {selectedDevice.voltage}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#f2f3ff]">
                  <span className="text-[13px] text-[#505f76]">Firmware</span>
                  <span className="text-[13px] font-semibold text-[#131b2e]">
                    {selectedDevice.firmware}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#f2f3ff]">
                  <span className="text-[13px] text-[#505f76]">Uptime</span>
                  <span className="text-[13px] font-semibold text-[#131b2e]">
                    {selectedDevice.uptime}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="block text-[11px] font-semibold text-[#505f76] uppercase tracking-wider mb-1.5 px-1">
                    Connected Sensors
                  </span>
                  <div className="p-3 rounded-xl bg-[#f2f3ff] text-[13px] font-medium text-[#131b2e]">
                    {selectedDevice.sensors}
                  </div>
                </div>

                {/* Additional Diagnostics & Token Quick Actions */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDiagModalOpen(true);
                      handleRunDiagnostics();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#faf8ff] hover:bg-[#eaedff] border border-[#eaedff] text-[#004ac6] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Activity size={15} />
                    <span>Run Diagnostics</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTokenModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-[#faf8ff] hover:bg-[#eaedff] border border-[#eaedff] text-[#505f76] hover:text-[#131b2e] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck size={15} />
                    <span>Ingest Token</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer Buttons */}
            <div className="p-6 border-t border-[#eaedff] flex items-center gap-3 bg-white">
              <button
                type="button"
                onClick={() => handleReboot(selectedDevice.id)}
                className="flex-1 py-2.5 px-4 rounded-full border border-[#eaedff] text-[#131b2e] hover:bg-[#f2f3ff] transition-colors text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={16} className="text-[#505f76]" />
                <span>Reboot</span>
              </button>
              <button
                type="button"
                onClick={startOta}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#004ac6] text-white hover:bg-[#003ea8] transition-colors text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download size={16} />
                <span>Update firmware (OTA)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-State Hardware Diagnostics Modal ── */}
      {isDiagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#eaedff] w-full max-w-[460px] p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#131b2e]">Hardware Self-Diagnostics</h3>
                  <span className="text-[12px] text-[#505f76]">{selectedDevice?.id || 'ESP32 Node 01'} Automated Bus Scan</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiagModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#f2f3ff] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {diagRunning ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                <RotateCcw size={28} className="animate-spin text-[#004ac6]" />
                <span className="text-[14px] font-semibold text-[#131b2e]">Testing bus channels and ADC baseline...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {diagResults?.map((res, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#eaedff] flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#131b2e]">{res.phase}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#059669]">
                        {res.status}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#505f76]">{res.detail}</span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleRunDiagnostics}
                  className="mt-2 w-full py-2.5 rounded-xl bg-[#004ac6] text-white font-bold text-[13px] hover:bg-[#003ea8] transition-all cursor-pointer"
                >
                  Rerun Diagnostics
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sub-State Hardware Ingest Token Modal ── */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#eaedff] w-full max-w-[420px] p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#131b2e]">Ingest API Token</h3>
                  <span className="text-[12px] text-[#505f76]">Bearer authentication for POST /api/ingest</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#f2f3ff] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-[#505f76]">Node Bearer Key</label>
              <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#eaedff] font-mono text-[11px] text-[#131b2e] break-all">
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.node01-ingest-token-2026
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyToken}
              className="w-full py-2.5 rounded-xl bg-[#004ac6] text-white font-bold text-[13px] hover:bg-[#003ea8] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              <span>{copiedToken ? 'Token Copied to Clipboard ✓' : 'Copy Ingest Token'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Sub-State OTA Progress Modal ── */}
      {isOtaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#eaedff] w-full max-w-[420px] p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#d0e1fb] flex items-center justify-center text-[#004ac6]">
                  <Download size={22} className="animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[18px] text-[#131b2e] leading-tight font-semibold">
                    Firmware Update (OTA)
                  </h3>
                  <span className="text-[13px] text-[#004ac6] font-medium mt-0.5">
                    {otaProgress < 100 ? 'Updating to v2.5.0' : 'Update Complete!'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOtaModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#131b2e] font-medium">Firmware Binary</span>
                <span className="text-[#004ac6] font-bold tabular-nums">{otaProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#e2e7ff] overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-[#004ac6] relative transition-all duration-500"
                  style={{ width: `${otaProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f2f3ff] text-[#505f76] text-[12px] leading-relaxed">
              <Info size={18} className="text-[#004ac6] shrink-0" />
              <span>
                {otaProgress < 100
                  ? 'Transferring firmware binary... Do not disconnect power.'
                  : 'Rebooting node with new firmware image.'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
