import { useState } from 'react';
import {
  Wifi, RotateCcw, Box, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { Drawer } from '../components/ui';

export default function Devices() {
  const [rebootingNode, setRebootingNode] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const devices = [
    {
      id: 'ESP32 Node 01',
      status: 'Online',
      isOnline: true,
      rssi: '-58 dBm',
      firmware: 'Firmware v2.4.1',
      ip: '192.168.1.101',
      voltage: '3.31 V',
      sensors: 'MQ-3, MQ-2, MQ-135, MICS-5524',
      uptime: '14d 6h 22m',
    },
    {
      id: 'ESP32 Node 02',
      status: 'Online',
      isOnline: true,
      rssi: '-64 dBm',
      firmware: 'Firmware v2.4.1',
      ip: '192.168.1.102',
      voltage: '3.29 V',
      sensors: 'MQ-8, Laser PM2.5, SHT31 Temp/RH',
      uptime: '12d 18h 05m',
    },
    {
      id: 'Gateway Hub',
      status: 'Offline',
      isOnline: false,
      rssi: '-58 dBm',
      firmware: 'Firmware v2.4.1',
      ip: '192.168.1.100',
      voltage: '5.02 V',
      sensors: 'Modbus RS-485 to MQTT Bridge',
      uptime: 'Standby / Secondary Failover',
    },
  ];

  function handleReboot(id) {
    setRebootingNode(id);
    setTimeout(() => {
      setRebootingNode(null);
    }, 1800);
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-6 rounded-full bg-[#004ac6] inline-block" />
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#131b2e] tracking-tight">
            Devices
          </h1>
        </div>
        <p className="text-[14px] text-[#434655] pl-4">
          Telemetry hardware &amp; connection status
        </p>
      </div>

      {/* ── 3 Device Cards (h-[300px]) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {devices.map((d) => (
          <div
            key={d.id}
            onClick={() => setSelectedDevice(d)}
            className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[300px] cursor-pointer"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-bold text-[#131b2e]">
                  {d.id}
                </span>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${
                    d.isOnline
                      ? 'bg-[#eaedff] text-[#004ac6]'
                      : 'bg-[#f1f5f9] text-[#64748b]'
                  }`}
                >
                  {d.isOnline && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004ac6]" />
                    </span>
                  )}
                  {!d.isOnline && <span className="inline-flex rounded-full h-2 w-2 bg-[#64748b]" />}
                  <span>{d.status}</span>
                </div>
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
                className="px-4 py-1.5 rounded-full bg-[#eaedff] text-[#131b2e] hover:bg-[#dbe1ff] transition-colors text-[13px] font-bold flex items-center gap-1.5"
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

      {/* ── Sub-State Device Specs Drawer ── */}
      {selectedDevice && (
        <Drawer
          isOpen={Boolean(selectedDevice)}
          onClose={() => setSelectedDevice(null)}
          title={selectedDevice.id}
          subtitle={`Hardware Diagnostics • ${selectedDevice.status}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#64748b]">IP Address:</span>
                <span className="font-bold text-[#131b2e] font-mono">{selectedDevice.ip}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#64748b]">Operating Voltage:</span>
                <span className="font-bold text-[#131b2e] font-mono">{selectedDevice.voltage}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#64748b]">Signal RSSI:</span>
                <span className="font-bold text-[#004ac6] font-mono">{selectedDevice.rssi}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#64748b]">System Uptime:</span>
                <span className="font-bold text-[#131b2e]">{selectedDevice.uptime}</span>
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-bold text-[#434655] uppercase tracking-wider mb-1">
                Connected Sensors
              </span>
              <p className="text-[14px] text-[#131b2e] p-3 rounded-xl bg-[#f2f3ff]">
                {selectedDevice.sensors}
              </p>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
