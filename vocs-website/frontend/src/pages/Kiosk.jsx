import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, AlertOctagon, Fan, Wrench, ShieldAlert, Check,
  X, Save, StopCircle, Sliders, AlertTriangle, Lock, RefreshCw,
  Clock, RotateCcw
} from 'lucide-react';
import { API } from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function Kiosk() {
  const { t, isThai } = useLanguage();
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('voc_cached_dashboard_v2');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Active Multi-State Mode:
  // 'normal' | 'pin' | 'sending' | 'sent' | 'failed' | 'booster' | 'maintenance'
  const [currentMode, setCurrentMode] = useState('normal');
  const [pin, setPin] = useState('');
  const [fanCountdown, setFanCountdown] = useState(272); // 04:32 (272s)
  const [isFanRunning, setIsFanRunning] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  // Maintenance Checklist state
  const [checklist, setChecklist] = useState([
    {
      id: 1,
      textTh: '1. ตรวจสอบแผ่นกรองขั้นต้น (HEPA Filter)',
      textEn: '1. Inspect HEPA pre-filter',
      subTh: 'ความดันตกคร่อมปกติ',
      subEn: 'Nominal differential pressure',
      checked: true,
    },
    {
      id: 2,
      textTh: '2. ตรวจสอบแผ่นกรองคาร์บอนกัมมันต์',
      textEn: '2. Inspect activated carbon scrubber',
      subTh: 'ไม่พบกลิ่นเล็ดลอด',
      subEn: 'No breakthrough odor',
      checked: true,
    },
    {
      id: 3,
      textTh: '3. ตรวจเช็คหลอด UV Lamp และความเข้มแสง',
      textEn: '3. Check PID UV lamp & radiation intensity',
      subTh: 'อายุใช้งาน 1,420 ชม.',
      subEn: 'Runtime: 1,420 hrs',
      checked: false,
    },
    {
      id: 4,
      textTh: '4. สอบเทียบหัววัดเซนเซอร์ VOC',
      textEn: '4. Calibrate VOC electrochemical probes',
      subTh: 'ความแม่นยำ ±2%',
      subEn: 'Accuracy ±2% verified',
      checked: true,
    },
    {
      id: 5,
      textTh: '5. ตรวจสอบท่อระบายอากาศและพัดลมดูด',
      textEn: '5. Inspect exhaust ductwork & blower fan',
      subTh: 'ไม่มีสิ่งอุดตัน',
      subEn: 'No obstructions detected',
      checked: false,
    },
  ]);

  // Fetch real-time sensor readings from backend
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
    const timer = setInterval(fetchKiosk, 3000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer for Fan Booster (State B)
  useEffect(() => {
    let t;
    if (currentMode === 'booster' && isFanRunning && fanCountdown > 0) {
      t = setInterval(() => {
        setFanCountdown((c) => Math.max(0, c - 1));
      }, 1000);
    }
    return () => clearInterval(t);
  }, [currentMode, isFanRunning, fanCountdown]);

  function triggerFeedback(msg) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }

  function handlePinInput(val) {
    if (val === 'C') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    if (val === 'OK') {
      if (pin.length >= 4) {
        submitEmergency();
      } else {
        triggerFeedback(isThai ? 'กรุณากรอกรหัส PIN 4 หลักให้ครบถ้วน' : 'Please enter all 4 digits of the PIN');
      }
      return;
    }
    if (pin.length < 4) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => submitEmergency(), 300);
      }
    }
  }

  async function submitEmergency() {
    setCurrentMode('sending');
    try {
      const res = await fetch(`${API}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          box_id: 'BOX-001',
          level: 'Critical',
          message: isThai
            ? '🚨 แจ้งเหตุฉุกเฉินสารเคมีรั่วไหลจากหน้าจอ Kiosk หน้างาน (ยืนยันรหัส PIN แล้ว)'
            : '🚨 Emergency chemical spill alarm triggered from onsite Kiosk (PIN Verified)',
        }),
      });
      if (res.ok) {
        setTimeout(() => setCurrentMode('sent'), 1200);
      } else {
        setTimeout(() => setCurrentMode('failed'), 1200);
      }
    } catch {
      setTimeout(() => setCurrentMode('failed'), 1200);
    }
  }

  function toggleChecklistItem(id) {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  }

  function saveMaintenanceChecklist() {
    setCurrentMode('normal');
    triggerFeedback(
      isThai
        ? '✓ บันทึกผลการตรวจสอบซ่อมบำรุงประจำวันเรียบร้อยแล้ว'
        : '✓ Daily maintenance verification saved successfully'
    );
  }

  // Values from live readings or standard nominal baseline
  const tvocVal = Math.round(data?.environment?.tvoc ?? data?.latest_reading?.tvoc ?? 64);
  const pm25Val = Math.round(data?.environment?.pm25 ?? data?.latest_reading?.pm25 ?? 14);
  const tempVal = Math.round(data?.environment?.temp ?? data?.latest_reading?.temp ?? 28);
  const rhVal = Math.round(data?.environment?.rh ?? data?.latest_reading?.rh ?? 52);
  const eco2Val = Math.round(data?.environment?.eco2 ?? data?.latest_reading?.eco2 ?? 420);

  // Circumference for r=78 is ~490.08
  const tvocOffset = Math.max(0, 490.08 - (Math.min(tvocVal, 220) / 220) * 490.08);
  const pm25Offset = Math.max(0, 490.08 - (Math.min(pm25Val, 50) / 50) * 490.08);
  const eco2Offset = Math.max(0, 490.08 - (Math.min(eco2Val, 2000) / 2000) * 490.08);

  const isSafe = tvocVal < 120 && pm25Val < 37.5 && eco2Val < 1000;
  const isEco2Normal = eco2Val < 1000;

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <main className="w-full min-h-screen bg-[#faf8ff] flex flex-col justify-start px-4 md:px-6 pt-4 pb-10">
      <div className="flex flex-col w-full max-w-7xl mx-auto select-none gap-6">

        {/* ── Demo / Simulation Mode State Switcher ── */}
        <div className="w-full flex items-center justify-between bg-white/80 backdrop-blur rounded-2xl p-2.5 shadow-sm border border-[#e2e8f0]/60 flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3">
            <Sliders size={20} className="text-[#004ac6]" />
            <span className="font-bold text-[15px] text-[#131b2e]">
              {isThai ? 'จำลองสถานะการทำงาน:' : 'Demo Mode:'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setCurrentMode('normal'); setPin(''); }}
              className={`px-3 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1 cursor-pointer ${
                currentMode === 'normal'
                  ? 'bg-[#004ac6] text-white shadow-sm'
                  : 'bg-[#eaedff] text-[#505f76] hover:text-[#131b2e]'
              }`}
            >
              {isThai ? 'ปกติ' : 'Normal'}
            </button>
            <button
              type="button"
              onClick={() => { setCurrentMode('pin'); setPin(''); }}
              className={`px-3 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1 cursor-pointer ${
                currentMode === 'pin'
                  ? 'bg-[#ba1a1a] text-white shadow-sm'
                  : 'bg-[#eaedff] text-[#ba1a1a] hover:bg-[#ffdad6]'
              }`}
            >
              <Lock size={14} />
              {isThai ? 'ยืนยันรหัส PIN' : 'Verify PIN'}
            </button>
            <button
              type="button"
              onClick={() => setCurrentMode('sending')}
              className={`px-3 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1 cursor-pointer ${
                currentMode === 'sending'
                  ? 'bg-[#004ac6] text-white shadow-sm'
                  : 'bg-[#eaedff] text-[#505f76] hover:text-[#131b2e]'
              }`}
            >
              {isThai ? 'กำลังส่ง...' : 'Sending...'}
            </button>
            <button
              type="button"
              onClick={() => setCurrentMode('sent')}
              className={`px-3 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1 cursor-pointer ${
                currentMode === 'sent'
                  ? 'bg-[#16a34a] text-white shadow-sm'
                  : 'bg-[#eaedff] text-[#16a34a] hover:bg-[#dcfce7]'
              }`}
            >
              {isThai ? 'ส่งสำเร็จ' : 'Sent'}
            </button>
            <button
              type="button"
              onClick={() => setCurrentMode('failed')}
              className={`px-3 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1 cursor-pointer ${
                currentMode === 'failed'
                  ? 'bg-[#ba1a1a] text-white shadow-sm'
                  : 'bg-[#eaedff] text-[#ba1a1a] hover:bg-[#ffdad6]'
              }`}
            >
              {isThai ? 'ล้มเหลว' : 'Failed'}
            </button>
            <button
              type="button"
              onClick={() => { setCurrentMode('booster'); setFanCountdown(272); setIsFanRunning(true); }}
              className={`px-3 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1 cursor-pointer ${
                currentMode === 'booster'
                  ? 'bg-[#004ac6] text-white shadow-sm'
                  : 'bg-[#eaedff] text-[#004ac6] hover:bg-[#d0e1fb]'
              }`}
            >
              <Fan size={14} />
              {isThai ? 'เปิดพัดลมดูดสูงสุด 100%' : 'Booster 100%'}
            </button>
            <button
              type="button"
              onClick={() => setCurrentMode('maintenance')}
              className={`px-3 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1 cursor-pointer ${
                currentMode === 'maintenance'
                  ? 'bg-[#283044] text-white shadow-sm'
                  : 'bg-[#eaedff] text-[#283044] hover:bg-[#e2e7ff]'
              }`}
            >
              <Wrench size={14} />
              {isThai ? 'ซ่อมบำรุง' : 'Maintenance'}
            </button>
          </div>
        </div>

        {/* ── Top Section: Status Banner Card ── */}
        <div className="w-full bg-white rounded-3xl shadow-sm p-6 flex items-center justify-center gap-5 transition-all border border-[#eaedff]">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
              isSafe ? 'bg-[#d0e1fb]/40 text-[#004ac6]' : 'bg-[#ffdad6] text-[#ba1a1a]'
            }`}
          >
            {isSafe ? <CheckCircle2 size={44} className="text-[#004ac6]" /> : <AlertOctagon size={44} />}
          </div>
          <span className="text-[28px] md:text-[32px] font-bold text-[#131b2e] tracking-tight">
            {isSafe
              ? (isThai ? 'บรรยากาศปกติ — ปลอดภัย' : 'Atmosphere Normal — Safe')
              : (isThai ? 'ตรวจพบไอระเหยสะสม — โปรดระมัดระวัง' : 'Vapor Accumulation Detected — Caution')}
          </span>
        </div>

        {/* ── Middle Section: 3 Heavy Touch Action Targets (Glove Ergonomics) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Action 1: Emergency Trigger */}
          <button
            type="button"
            onClick={() => { setCurrentMode('pin'); setPin(''); }}
            className="group relative min-h-[190px] h-48 rounded-3xl bg-[#ba1a1a] text-white p-6 flex flex-col items-center justify-center gap-4 shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer text-center hover:bg-[#a01414]"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <ShieldAlert size={42} />
            </div>
            <span className="text-[26px] font-bold text-white tracking-normal leading-tight">
              {isThai ? 'ส่งสัญญาณเตือนภัยฉุกเฉิน' : 'Trigger Emergency Alarm'}
            </span>
          </button>

          {/* Action 2: Max Exhaust Booster */}
          <button
            type="button"
            onClick={() => { setCurrentMode('booster'); setFanCountdown(272); setIsFanRunning(true); }}
            className="group relative min-h-[190px] h-48 rounded-3xl bg-[#004ac6] text-white p-6 flex flex-col items-center justify-center gap-4 shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer text-center hover:bg-[#003ea8]"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <Fan size={42} className="animate-spin-slow" />
            </div>
            <span className="text-[26px] font-bold text-white tracking-normal leading-tight">
              {isThai ? 'เปิดพัดลมดูดอากาศ 100% (ฉุกเฉิน)' : 'Activate Exhaust Fan 100% (Emergency)'}
            </span>
          </button>

          {/* Action 3: Maintenance Log Entry */}
          <button
            type="button"
            onClick={() => setCurrentMode('maintenance')}
            className="group relative min-h-[190px] h-48 rounded-3xl bg-[#283044] text-[#eef0ff] p-6 flex flex-col items-center justify-center gap-4 shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer text-center hover:bg-[#1e2434]"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <Wrench size={38} />
            </div>
            <span className="text-[26px] font-bold text-[#eef0ff] tracking-normal leading-tight">
              {isThai ? 'บันทึกงานซ่อมบำรุงหน้างาน' : 'Log Onsite Maintenance Task'}
            </span>
          </button>
        </div>

        {/* ── Bottom Section: 4 Large Telemetry Dial Modules (Gauges) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
          {/* Dial 1: TVOC */}
          <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden min-h-[290px] border border-[#eaedff]">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[16px] font-bold text-[#505f76] tracking-wide">
                {isThai ? 'สารระเหยรวม (TVOC)' : 'Total VOC (TVOC)'}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#dcfce7] text-[#16a34a] text-[13px] font-bold">
                {isThai ? 'ปกติ' : 'Normal'}
              </span>
            </div>
            <div className="relative w-44 h-44 flex items-center justify-center my-1">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                <circle
                  className="text-[#eaedff]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="78"
                  stroke="currentColor"
                  strokeWidth="14"
                />
                <circle
                  className="text-[#2563eb]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="78"
                  stroke="currentColor"
                  strokeDasharray="490.08"
                  strokeDashoffset={tvocOffset}
                  strokeLinecap="round"
                  strokeWidth="14"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[48px] leading-[50px] font-bold text-[#131b2e] tracking-tight">
                  {tvocVal}
                </span>
                <span className="text-[16px] font-semibold text-[#505f76] mt-0.5">ppb</span>
              </div>
            </div>
            <div className="text-center mt-1 w-full">
              <span className="text-[13px] text-[#505f76] font-medium">
                {isThai ? 'เกณฑ์ปลอดภัย: ต่ำกว่า 220 ppb' : 'Safe threshold: Under 220 ppb'}
              </span>
            </div>
          </div>

          {/* Dial 2: PM2.5 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden min-h-[290px] border border-[#eaedff]">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[16px] font-bold text-[#505f76] tracking-wide">
                {isThai ? 'ฝุ่นละอองละเอียด (PM2.5)' : 'Fine Particulate (PM2.5)'}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#dcfce7] text-[#16a34a] text-[13px] font-bold">
                {isThai ? 'ปกติ' : 'Normal'}
              </span>
            </div>
            <div className="relative w-44 h-44 flex items-center justify-center my-1">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                <circle
                  className="text-[#eaedff]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="78"
                  stroke="currentColor"
                  strokeWidth="14"
                />
                <circle
                  className="text-[#2563eb]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="78"
                  stroke="currentColor"
                  strokeDasharray="490.08"
                  strokeDashoffset={pm25Offset}
                  strokeLinecap="round"
                  strokeWidth="14"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[48px] leading-[50px] font-bold text-[#131b2e] tracking-tight">
                  {pm25Val}
                </span>
                <span className="text-[16px] font-semibold text-[#505f76] mt-0.5">µg/m³</span>
              </div>
            </div>
            <div className="text-center mt-1 w-full">
              <span className="text-[13px] text-[#505f76] font-medium">
                {isThai ? 'เกณฑ์ปลอดภัย: ต่ำกว่า 37.5 µg/m³' : 'Safe threshold: Under 37.5 µg/m³'}
              </span>
            </div>
          </div>

          {/* Dial 3: Temperature & Humidity (Split Dual Module) */}
          <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden min-h-[290px] border border-[#eaedff]">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[16px] font-bold text-[#505f76] tracking-wide">
                {isThai ? 'อุณหภูมิ / ความชื้น' : 'Temperature / Humidity'}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#dcfce7] text-[#16a34a] text-[13px] font-bold">
                {isThai ? 'ปกติ' : 'Normal'}
              </span>
            </div>
            <div className="w-full h-44 flex items-center justify-around my-1 px-2">
              <div className="flex flex-col items-center justify-center text-center flex-1">
                <span className="text-[14px] font-medium text-[#505f76] mb-1">
                  {isThai ? 'อุณหภูมิ' : 'Temperature'}
                </span>
                <div className="flex items-baseline justify-center">
                  <span className="text-[44px] leading-[46px] font-bold text-[#131b2e] tracking-tight">
                    {tempVal}
                  </span>
                  <span className="text-[20px] font-bold text-[#505f76] ml-1">°C</span>
                </div>
                <span className="text-[12px] font-medium text-[#16a34a] bg-[#dcfce7] px-2.5 py-0.5 rounded-full mt-2">
                  {isThai ? 'ปกติ' : 'Normal'}
                </span>
              </div>
              <div className="h-20 w-[1px] bg-[#c3c6d7]/40" />
              <div className="flex flex-col items-center justify-center text-center flex-1">
                <span className="text-[14px] font-medium text-[#505f76] mb-1">
                  {isThai ? 'ความชื้น' : 'Humidity'}
                </span>
                <div className="flex items-baseline justify-center">
                  <span className="text-[44px] leading-[46px] font-bold text-[#131b2e] tracking-tight">
                    {rhVal}
                  </span>
                  <span className="text-[20px] font-bold text-[#505f76] ml-1">%RH</span>
                </div>
                <span className="text-[12px] font-medium text-[#16a34a] bg-[#dcfce7] px-2.5 py-0.5 rounded-full mt-2">
                  {isThai ? 'ปกติ' : 'Normal'}
                </span>
              </div>
            </div>
            <div className="text-center mt-1 w-full">
              <span className="text-[13px] text-[#505f76] font-medium">
                {isThai ? 'เกณฑ์ปลอดภัย: 20-32° / 40-70%' : 'Safe threshold: 20-32° / 40-70%'}
              </span>
            </div>
          </div>

          {/* Dial 4: Real eCO2 Telemetry (From CCS811 / SCD41) */}
          <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden min-h-[290px] border border-[#eaedff]">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[16px] font-bold text-[#505f76] tracking-wide">
                {isThai ? 'ก๊าซคาร์บอนไดออกไซด์ (eCO₂)' : 'Equivalent CO₂ (eCO₂)'}
              </span>
              <span className={`px-3 py-1 rounded-full text-[13px] font-bold ${
                isEco2Normal ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fef3c7] text-[#b45309]'
              }`}>
                {isEco2Normal ? (isThai ? 'ปกติ' : 'Normal') : (isThai ? 'เฝ้าระวัง' : 'Warning')}
              </span>
            </div>
            <div className="relative w-44 h-44 flex items-center justify-center my-1">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                <circle
                  className="text-[#eaedff]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="78"
                  stroke="currentColor"
                  strokeWidth="14"
                />
                <circle
                  className={isEco2Normal ? "text-[#2563eb]" : "text-[#d97706]"}
                  cx="100"
                  cy="100"
                  fill="none"
                  r="78"
                  stroke="currentColor"
                  strokeDasharray="490.08"
                  strokeDashoffset={eco2Offset}
                  strokeLinecap="round"
                  strokeWidth="14"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[44px] leading-[46px] font-bold text-[#131b2e] tracking-tight">
                  {eco2Val}
                </span>
                <span className="text-[16px] font-semibold text-[#505f76] mt-0.5">ppm</span>
              </div>
            </div>
            <div className="text-center mt-1 w-full">
              <span className="text-[13px] text-[#505f76] font-medium">
                {isThai ? 'เกณฑ์ปลอดภัย: ต่ำกว่า 1,000 ppm' : 'Safe threshold: Under 1,000 ppm'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Substate: Emergency PIN Keypad Modal ── */}
      {currentMode === 'pin' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl border-2 border-[#e2e8f0]">
            <div className="w-16 h-16 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-3">
              <Lock size={36} />
            </div>
            <h2 className="text-[28px] font-bold text-[#131b2e] leading-tight mb-1">
              {isThai ? 'ใส่รหัสพนักงาน' : 'Enter Employee PIN'}
            </h2>
            <p className="text-[15px] text-[#505f76] mb-5">
              {isThai
                ? 'กรอกรหัส PIN 4 หลักเพื่อยืนยันการแจ้งเหตุฉุกเฉิน'
                : 'Enter 4-digit PIN code to confirm emergency alarm'}
            </p>

            {/* PIN Dots Indicator */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pin.length > idx
                      ? 'border-[#004ac6] bg-[#004ac6] scale-110'
                      : 'border-[#c3c6d7] bg-white'
                  }`}
                />
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinInput(String(num))}
                  className="h-14 rounded-2xl bg-[#eaedff] text-[24px] font-bold text-[#131b2e] hover:bg-[#d0e1fb] transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePinInput('C')}
                className="h-14 rounded-2xl bg-[#eaedff] text-[18px] font-bold text-[#505f76] hover:bg-[#d0e1fb] transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handlePinInput('0')}
                className="h-14 rounded-2xl bg-[#eaedff] text-[24px] font-bold text-[#131b2e] hover:bg-[#d0e1fb] transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handlePinInput('OK')}
                className="h-14 rounded-2xl bg-[#004ac6] text-white text-[18px] font-bold hover:bg-[#003ea8] transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
              >
                OK
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setCurrentMode('normal'); setPin(''); }}
              className="min-h-[56px] w-full rounded-2xl bg-[#eaedff] text-[#505f76] text-[18px] font-bold hover:text-[#131b2e] transition-all active:scale-98 cursor-pointer"
            >
              {isThai ? 'ยกเลิก' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* ── Substate 2a: Sending State Card ── */}
      {currentMode === 'sending' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-[#eaedff] text-[#004ac6] flex items-center justify-center mb-6">
              <RefreshCw size={52} className="animate-spin text-[#004ac6]" />
            </div>
            <h2 className="text-[32px] font-bold text-[#131b2e] leading-tight mb-2">
              {isThai ? 'กำลังส่ง...' : 'Sending...'}
            </h2>
            <p className="text-[18px] text-[#505f76] mb-6 leading-relaxed">
              {isThai
                ? 'กำลังเชื่อมต่อระบบ LINE OA และระบบเตือนภัยฉุกเฉินส่วนกลาง'
                : 'Connecting to LINE OA and central emergency alarm system'}
            </p>
            <div className="w-full bg-[#eaedff] rounded-full h-3 overflow-hidden mb-6">
              <div className="bg-[#004ac6] h-full w-2/3 animate-pulse rounded-full" />
            </div>
            <button
              type="button"
              onClick={() => setCurrentMode('normal')}
              className="min-h-[56px] px-8 rounded-2xl bg-[#eaedff] text-[#505f76] font-bold text-[16px] hover:text-[#131b2e] transition-all active:scale-98 cursor-pointer"
            >
              {isThai ? 'ปิดหน้าต่าง' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* ── Substate 2b: Sent Success State Card ── */}
      {currentMode === 'sent' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl border-2 border-[#004ac6]/30">
            <div className="w-20 h-20 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mb-6">
              <CheckCircle2 size={56} className="text-[#16a34a]" />
            </div>
            <h2 className="text-[32px] font-bold text-[#131b2e] leading-tight mb-2 flex items-center gap-2">
              {isThai ? 'ส่งแล้ว ✓' : 'Sent ✓'}
            </h2>
            <p className="text-[18px] text-[#505f76] mb-6 leading-relaxed">
              {isThai
                ? 'ส่งข้อความเตือนภัยไปยัง LINE OA เจ้าหน้าที่ความปลอดภัย 18 นายสำเร็จแล้ว'
                : 'Emergency alert dispatched to 18 safety officers via LINE OA successfully'}
            </p>
            <div className="w-full bg-[#eaedff] p-4 rounded-2xl text-left mb-6 flex items-center gap-3">
              <Clock size={24} className="text-[#004ac6] shrink-0" />
              <span className="text-[15px] font-medium text-[#131b2e]">
                {isThai
                  ? `เวลาที่ส่ง: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น. (กำลังควบคุมตาม SLA)`
                  : `Dispatched at: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (SLA Dispatching Active)`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentMode('normal')}
              className="min-h-[56px] w-full rounded-2xl bg-[#004ac6] text-white text-[20px] font-bold shadow-md hover:bg-[#003ea8] transition-all active:scale-98 cursor-pointer"
            >
              {isThai ? 'ตกลง (กลับหน้าหลัก)' : 'OK (Return to Home)'}
            </button>
          </div>
        </div>
      )}

      {/* ── Substate 2c: Failed Retry State Card ── */}
      {currentMode === 'failed' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl border-2 border-[#ba1a1a]">
            <div className="w-20 h-20 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-6">
              <AlertOctagon size={56} className="text-[#ba1a1a]" />
            </div>
            <h2 className="text-[28px] font-bold text-[#ba1a1a] leading-tight mb-2">
              {isThai ? 'ส่งไม่สำเร็จ — ลองอีกครั้ง' : 'Dispatch Failed — Try Again'}
            </h2>
            <p className="text-[17px] text-[#505f76] mb-6 leading-relaxed">
              {isThai
                ? 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ LINE OA กรุณากดลองอีกครั้ง'
                : 'Connection error to LINE OA server. Please try again.'}
            </p>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                type="button"
                onClick={() => setCurrentMode('normal')}
                className="min-h-[60px] rounded-2xl bg-[#eaedff] text-[#131b2e] text-[18px] font-bold hover:bg-[#d0e1fb] transition-all active:scale-98 cursor-pointer"
              >
                {isThai ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={submitEmergency}
                className="min-h-[60px] rounded-2xl bg-[#ba1a1a] text-white text-[18px] font-bold shadow-md hover:bg-[#a01414] transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={22} />
                {isThai ? 'ลองอีกครั้ง' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE B: Max Fan 100% Booster Overlay ── */}
      {currentMode === 'booster' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl border-2 border-[#004ac6]/30">
            <div className="flex items-center gap-3 text-[#2563eb] mb-4">
              <Fan size={36} className="animate-spin text-[#004ac6]" />
              <span className="text-[24px] font-bold text-[#131b2e]">
                {isThai ? 'เร่งพัดลมระบายอากาศ 100% ทำงาน' : 'Exhaust Fan 100% Booster Running'}
              </span>
            </div>

            {/* Radial Progress & Countdown */}
            <div className="relative w-64 h-64 flex items-center justify-center my-4">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                <circle
                  className="text-[#eaedff]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="82"
                  stroke="currentColor"
                  strokeWidth="14"
                />
                <circle
                  className="text-[#004ac6]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="82"
                  stroke="currentColor"
                  strokeDasharray="515.22"
                  strokeDashoffset={Math.max(0, 515.22 - (fanCountdown / 300) * 515.22)}
                  strokeLinecap="round"
                  strokeWidth="14"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[18px] font-semibold text-[#505f76]">
                  {isThai ? 'เหลือเวลา' : 'Time Remaining'}
                </span>
                <span className="text-[52px] leading-[56px] font-bold text-[#131b2e] tracking-tight mt-1 tabular-nums">
                  {formatTime(fanCountdown)}
                </span>
                <span className="text-[16px] text-[#004ac6] font-bold mt-1">
                  {isThai ? 'กำลังระบายอากาศสูงสุด' : 'Max Exhaust Active'}
                </span>
              </div>
            </div>

            <p className="text-[18px] text-[#505f76] mb-8">
              {isThai
                ? 'รอบพัดลม: 2,850 RPM | อัตราถ่ายเทอากาศ 4,200 CFM'
                : 'Fan RPM: 2,850 RPM | Flow Rate: 4,200 CFM'}
            </p>

            <button
              type="button"
              onClick={() => { setIsFanRunning(false); setCurrentMode('normal'); }}
              className="min-h-[72px] w-full rounded-2xl bg-[#004ac6] text-white text-[26px] font-bold flex items-center justify-center gap-3 shadow-lg hover:bg-[#003ea8] transition-all active:scale-98 cursor-pointer"
            >
              <StopCircle size={32} />
              {isThai ? 'หยุดการทำงาน' : 'Stop'}
            </button>
          </div>
        </div>
      )}

      {/* ── STATE C: Maintenance Checklist Modal ── */}
      {currentMode === 'maintenance' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0] mb-5">
              <div>
                <h2 className="text-[28px] font-bold text-[#131b2e] leading-tight">
                  {isThai ? 'บันทึกงานซ่อมบำรุงประจำวัน' : 'Daily Maintenance Log'}
                </h2>
                <p className="text-[16px] text-[#505f76] mt-0.5">
                  {isThai ? 'แตะเลือกเพื่อตรวจสอบรายการ' : 'Touch items to check off'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentMode('normal')}
                className="w-12 h-12 rounded-full bg-[#eaedff] text-[#505f76] flex items-center justify-center hover:text-[#131b2e] cursor-pointer"
              >
                <X size={28} />
              </button>
            </div>

            {/* 5 Big Touchscreen Checklist Rows */}
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 my-2 flex-grow">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className="flex items-center gap-5 p-4 rounded-2xl border-2 border-[#e2e8f0] bg-white hover:bg-[#f2f3ff] cursor-pointer transition-all active:scale-99"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {}}
                    className="w-8 h-8 rounded text-[#004ac6] focus:ring-[#004ac6] accent-[#004ac6] cursor-pointer"
                  />
                  <span className="text-[20px] font-bold text-[#131b2e] flex-grow">
                    {isThai ? item.textTh : item.textEn}
                  </span>
                  <span className="text-[14px] text-[#505f76] font-medium">
                    {isThai ? item.subTh : item.subEn}
                  </span>
                </label>
              ))}
            </div>

            {/* Bottom Action Buttons */}
            <div className="grid grid-cols-2 gap-5 pt-5 border-t border-[#e2e8f0] mt-3">
              <button
                type="button"
                onClick={() => setCurrentMode('normal')}
                className="min-h-[64px] rounded-2xl bg-[#eaedff] text-[#131b2e] text-[22px] font-bold flex items-center justify-center active:scale-98 cursor-pointer"
              >
                {isThai ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={saveMaintenanceChecklist}
                className="min-h-[64px] rounded-2xl bg-[#004ac6] text-white text-[22px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-[#003ea8] cursor-pointer"
              >
                <Save size={26} />
                {isThai ? 'บันทึกข้อมูล' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Feedback Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#131b2e]/90 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check size={20} className="text-[#00CC66]" />
          <span className="text-[16px] font-bold">{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
