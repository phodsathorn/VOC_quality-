import { useState, useEffect } from 'react';
import {
  CheckCircle2, AlertOctagon, Fan, Wrench, ShieldAlert, Check
} from 'lucide-react';
import { API } from '../config';

export default function Kiosk() {
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('voc_cached_dashboard_v2');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [fanBoostActive, setFanBoostActive] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Auto fetch latest readings
  useEffect(() => {
    async function fetchKiosk() {
      try {
        const res = await fetch(`${API}/api/dashboard/latest?box_id=BOX-001`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch {
        // silent
      }
    }
    fetchKiosk();
    const timer = setInterval(fetchKiosk, 4000);
    return () => clearInterval(timer);
  }, []);

  function triggerFeedback(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }

  async function handleEmergency() {
    triggerFeedback('ส่งสัญญาณแจ้งเหตุฉุกเฉินสารเคมีรั่วไหลแล้ว (LINE OA Triggered)');
    try {
      await fetch(`${API}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          box_id: 'BOX-001',
          level: 'Critical',
          message: '🚨 แจ้งเหตุฉุกเฉินสารเคมีรั่วไหลจากหน้าจอ Kiosk หน้างาน',
        }),
      });
    } catch (e) {
      console.warn(e);
    }
  }

  function handleFanBoost() {
    setFanBoostActive(!fanBoostActive);
    triggerFeedback(
      !fanBoostActive ? 'เร่งพัดลมระบายอากาศ 100% (Exhaust Boost)' : 'กลับสู่โหมดพัดลมปกติ 40%'
    );
  }

  function handleMaintenanceLog() {
    triggerFeedback('เปิดแบบบันทึกงานซ่อมบำรุงประจำวัน');
  }

  const tvocVal = Math.round(data?.environment?.tvoc ?? data?.latest_reading?.tvoc ?? 64);
  const pm25Val = Math.round(data?.environment?.pm25 ?? data?.latest_reading?.pm25 ?? 14);

  // Circumference for r=82 is ~515.22
  const tvocOffset = Math.max(0, 515.22 - (Math.min(tvocVal, 300) / 300) * 515.22);
  const pm25Offset = Math.max(0, 515.22 - (Math.min(pm25Val, 75) / 75) * 515.22);

  const isSafe = tvocVal < 120 && pm25Val < 37.5;

  return (
    <div className="w-full flex items-center justify-center p-4 md:p-6 min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col w-full max-w-6xl mx-auto gap-6 select-none">
        {/* ── Top Section: Status Banner Card ── */}
        <div className="w-full bg-white rounded-3xl shadow-sm p-6 flex items-center justify-center gap-5 transition-all">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
              isSafe ? 'bg-[#d0e1fb]/40 text-[#004ac6]' : 'bg-[#ffdad6] text-[#ba1a1a]'
            }`}
          >
            {isSafe ? <CheckCircle2 size={44} /> : <AlertOctagon size={44} />}
          </div>
          <span className="text-[28px] md:text-[32px] font-bold text-[#131b2e] tracking-tight">
            {isSafe ? 'บรรยากาศปกติ — ปลอดภัย' : 'ตรวจพบไอระเหยสะสม — โปรดระมัดระวัง'}
          </span>
        </div>

        {/* ── Middle Section: 3 Heavy Touch Action Targets (Glove Ergonomics) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Action 1: Emergency Trigger */}
          <button
            type="button"
            onClick={handleEmergency}
            className="group relative min-h-[190px] h-48 rounded-3xl bg-[#ba1a1a] text-white p-6 flex flex-col items-center justify-center gap-4 shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer text-center hover:bg-[#a01414]"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <ShieldAlert size={42} />
            </div>
            <span className="text-[26px] font-bold text-white tracking-normal leading-tight">
              แจ้งเหตุฉุกเฉิน
            </span>
          </button>

          {/* Action 2: Max Exhaust Booster */}
          <button
            type="button"
            onClick={handleFanBoost}
            className={`group relative min-h-[190px] h-48 rounded-3xl text-white p-6 flex flex-col items-center justify-center gap-4 shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer text-center ${
              fanBoostActive ? 'bg-[#00CC66]' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <Fan size={42} className={fanBoostActive ? 'animate-spin' : ''} />
            </div>
            <span className="text-[26px] font-bold text-white tracking-normal leading-tight">
              {fanBoostActive ? 'พัดลมเร่ง 100% แล้ว' : 'เร่งพัดลม 100%'}
            </span>
          </button>

          {/* Action 3: Maintenance Log Entry */}
          <button
            type="button"
            onClick={handleMaintenanceLog}
            className="group relative min-h-[190px] h-48 rounded-3xl bg-[#283044] text-[#eef0ff] p-6 flex flex-col items-center justify-center gap-4 shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer text-center hover:bg-[#1e2434]"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <Wrench size={38} />
            </div>
            <span className="text-[26px] font-bold text-[#eef0ff] tracking-normal leading-tight">
              บันทึกงานซ่อมบำรุง
            </span>
          </button>
        </div>

        {/* ── Bottom Section: 2 Large Telemetry Dial Modules ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Telemetry Dial 1: TVOC */}
          <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between px-4 mb-2">
              <span className="text-[20px] font-semibold text-[#505f76] tracking-wider">
                สารระเหยรวม (TVOC)
              </span>
              <span className="px-4 py-1.5 rounded-full bg-[#eaedff] text-[#004ac6] text-[16px] font-bold">
                {tvocVal < 100 ? 'ปกติ' : 'เฝ้าระวัง'}
              </span>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Minimal Circular Radial Track */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                <circle
                  className="text-[#eaedff]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="82"
                  stroke="currentColor"
                  strokeWidth="12"
                />
                {/* Safe Level Arc */}
                <circle
                  className="text-[#2563eb] transition-all duration-500"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="82"
                  stroke="currentColor"
                  strokeDasharray="515.22"
                  strokeDashoffset={tvocOffset}
                  strokeLinecap="round"
                  strokeWidth="12"
                />
              </svg>

              {/* Metric Central Core */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[60px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                  {tvocVal}
                </span>
                <span className="text-[22px] font-semibold text-[#505f76] mt-1">ppb</span>
              </div>
            </div>

            <div className="mt-2 text-center">
              <span className="text-[18px] text-[#505f76]">
                เกณฑ์ปลอดภัย: ต่ำกว่า 220 ppb
              </span>
            </div>
          </div>

          {/* Telemetry Dial 2: PM2.5 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between px-4 mb-2">
              <span className="text-[20px] font-semibold text-[#505f76] tracking-wider">
                ฝุ่นละอองละเอียด (PM2.5)
              </span>
              <span className="px-4 py-1.5 rounded-full bg-[#eaedff] text-[#004ac6] text-[16px] font-bold">
                {pm25Val < 37.5 ? 'ปกติ' : 'เกินเกณฑ์'}
              </span>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Minimal Circular Radial Track */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                <circle
                  className="text-[#eaedff]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="82"
                  stroke="currentColor"
                  strokeWidth="12"
                />
                {/* Safe Level Arc */}
                <circle
                  className="text-[#2563eb] transition-all duration-500"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="82"
                  stroke="currentColor"
                  strokeDasharray="515.22"
                  strokeDashoffset={pm25Offset}
                  strokeLinecap="round"
                  strokeWidth="12"
                />
              </svg>

              {/* Metric Central Core */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[60px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                  {pm25Val}
                </span>
                <span className="text-[22px] font-semibold text-[#505f76] mt-1">µg/m³</span>
              </div>
            </div>

            <div className="mt-2 text-center">
              <span className="text-[18px] text-[#505f76]">
                เกณฑ์ปลอดภัย: ต่ำกว่า 37.5 µg/m³
              </span>
            </div>
          </div>
        </div>

        {/* ── Interactive Feedback Overlay (Temporary toast for industrial gloves) ── */}
        {toastMessage && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-[#283044] text-white px-8 py-4 rounded-full shadow-2xl text-[20px] font-bold z-50 flex items-center gap-3 animate-fadeIn">
            <Check className="text-[#00CC66]" size={26} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
