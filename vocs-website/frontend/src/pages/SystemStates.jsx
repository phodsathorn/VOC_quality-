import { RefreshCw, AlertCircle, WifiOff, Loader2, ArrowRight } from 'lucide-react';

export default function SystemStates() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Header matching Stitch */}
      <div className="flex flex-col mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#505f76]">Operational Reference</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#131b2e]">System states</h1>
        <p className="text-[14px] text-[#434655] mt-1">UI component states and fallback patterns for sensor telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* State 1: Loading */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] mb-2 px-1">Loading State</div>
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between h-[230px] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-[#e2e7ff] rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-[#eaedff] rounded-full animate-pulse" />
            </div>
            <div className="my-auto flex flex-col gap-2.5">
              <div className="h-10 w-36 bg-[#e2e7ff] rounded-2xl animate-pulse" />
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
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] mb-2 px-1">Empty State</div>
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between h-[230px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#505f76]">MQ-2 Combustibles</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f2f3ff] text-[#737686]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c3c6d7]" />
                No Data
              </span>
            </div>
            <div className="my-auto flex flex-col items-center justify-center text-center">
              <span className="text-sm font-semibold text-[#131b2e]">No telemetry samples recorded</span>
              <span className="text-xs text-[#505f76] mt-1">Acquisition has not started or line buffer empty</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#eaedff]">
              <span className="text-xs text-[#505f76]">Polling frequency 2.5 Hz</span>
              <button type="button" className="text-xs font-semibold text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer">
                <span>Start polling</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* State 3: Error */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#ba1a1a] mb-2 px-1">Error State</div>
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-[#ffdad6] flex flex-col justify-between h-[230px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#ba1a1a]">Modbus TCP Gateway</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ffdad6] text-[#ba1a1a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                Timeout
              </span>
            </div>
            <div className="my-auto flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#ba1a1a]">
                <AlertCircle size={20} />
                <span className="text-sm font-bold">504 Gateway Timeout</span>
              </div>
              <span className="text-xs text-[#505f76]">Sensor response frame dropped after 3 retry cycles (Port 502)</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#eaedff]">
              <span className="text-xs text-[#505f76]">Last seen 12:01:04</span>
              <button type="button" className="text-xs font-semibold text-[#ba1a1a] hover:underline inline-flex items-center gap-1 cursor-pointer">
                <RefreshCw size={12} />
                <span>Reconnect Modbus</span>
              </button>
            </div>
          </div>
        </div>

        {/* State 4: Disconnected */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76] mb-2 px-1">Disconnected State</div>
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between h-[230px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#505f76]">ESP32 Node 01</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f2f3ff] text-[#737686]">
                <WifiOff size={12} />
                Offline
              </span>
            </div>
            <div className="my-auto flex flex-col gap-1">
              <span className="text-sm font-bold text-[#131b2e]">Heartbeat Lost</span>
              <span className="text-xs text-[#505f76]">Node disconnected from WiFi AP (SSID: Factory_Net_Industrial)</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#eaedff]">
              <span className="text-xs text-[#505f76]">Firmware v2.4.1</span>
              <button type="button" className="text-xs font-semibold text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer">
                <span>Troubleshoot Node</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

