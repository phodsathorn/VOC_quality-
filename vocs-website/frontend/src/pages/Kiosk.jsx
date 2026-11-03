import { useState, useEffect } from 'react';
import {
  CheckCircle2, AlertOctagon, Fan, Wrench, ShieldAlert, Check,
  X, Save, StopCircle, Sliders, AlertTriangle
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

  // Modal States from Stitch Sub-state
  const [activeModal, setActiveModal] = useState(null); // 'state-a' | 'state-b' | 'state-c' | null
  const [countdown, setCountdown] = useState(10);
  const [toastMessage, setToastMessage] = useState(null);

  // Maintenance Checklist state
  const [checklist, setChecklist] = useState([
    { id: 1, text: '1. ตรวจ HEPA filter', sub: 'ความดันตกคร่อมปกติ', checked: true },
    { id: 2, text: '2. ตรวจสอบแผ่นกรองคาร์บอน (Carbon Filter)', sub: 'ไม่พบกลิ่นเล็ดลอด', checked: true },
    { id: 3, text: '3. ตรวจเช็คหลอด UV Lamp และความเข้มแสง', sub: 'อายุใช้งาน 1,420 ชม.', checked: false },
    { id: 4, text: '4. สอบเทียบหัววัดเซนเซอร์ VOC (Sensor Calibration)', sub: 'ความแม่นยำ ±2%', checked: true },
    { id: 5, text: '5. ตรวจสอบท่อระบายอากาศและพัดลมดูด', sub: 'ไม่มีสิ่งอุดตัน', checked: false },
  ]);

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

  // Countdown timer for Emergency Cut-off (State A)
  useEffect(() => {
    let t;
    if (activeModal === 'state-a' && countdown > 0) {
      t = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (countdown === 0 && activeModal === 'state-a') {
      confirmEmergency();
    }
    return () => clearInterval(t);
  }, [activeModal, countdown]);

  function triggerFeedback(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }

  function openStateA() {
    setCountdown(10);
    setActiveModal('state-a');
  }

  function openStateB() {
    setActiveModal('state-b');
  }

  function openStateC() {
    setActiveModal('state-c');
  }

  function closeAllModals() {
    setActiveModal(null);
  }

  async function confirmEmergency() {
    closeAllModals();
    triggerFeedback('⚠️ ตัดระบบและส่งสัญญาณแจ้งเตือนฉุกเฉินแล้ว (LINE OA Triggered)');
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

  function toggleChecklistItem(id) {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  }

  function saveMaintenanceChecklist() {
    closeAllModals();
    triggerFeedback('✓ บันทึกผลการตรวจสอบซ่อมบำรุงประจำวันเรียบร้อยแล้ว');
  }

  const tvocVal = Math.round(data?.environment?.tvoc ?? data?.latest_reading?.tvoc ?? 64);
  const pm25Val = Math.round(data?.environment?.pm25 ?? data?.latest_reading?.pm25 ?? 14);

  // Circumference for r=78 is ~490.08
  const tvocOffset = Math.max(0, 490.08 - (Math.min(tvocVal, 220) / 220) * 490.08);
  const pm25Offset = Math.max(0, 490.08 - (Math.min(pm25Val, 50) / 50) * 490.08);

  const isSafe = tvocVal < 120 && pm25Val < 37.5;

  return (
    <div className="w-full flex items-center justify-center p-4 md:p-6 min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col w-full max-w-7xl mx-auto gap-6 select-none">
        {/* ── Demo State Switcher Bar ── */}
        <div className="w-full flex items-center justify-between bg-white/90 backdrop-blur rounded-2xl p-2.5 shadow-sm border border-[#eaedff]">
          <div className="flex items-center gap-2 px-3">
            <Sliders size={20} className="text-[#004ac6]" />
            <span className="font-bold text-[15px] text-[#131b2e]">สถานะ Kiosk (Demo Mode):</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={closeAllModals}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1.5 cursor-pointer ${
                activeModal === null
                  ? 'bg-[#004ac6] text-white shadow-xs'
                  : 'bg-[#f2f3ff] text-[#505f76] hover:text-[#131b2e]'
              }`}
            >
              หน้าหลัก (ปกติ)
            </button>
            <button
              type="button"
              onClick={openStateA}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1.5 cursor-pointer ${
                activeModal === 'state-a'
                  ? 'bg-[#ba1a1a] text-white shadow-xs'
                  : 'bg-[#f2f3ff] text-[#ba1a1a] hover:bg-[#ffdad6]'
              }`}
            >
              <ShieldAlert size={16} />
              State A: แจ้งเหตุฉุกเฉิน
            </button>
            <button
              type="button"
              onClick={openStateB}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1.5 cursor-pointer ${
                activeModal === 'state-b'
                  ? 'bg-[#004ac6] text-white shadow-xs'
                  : 'bg-[#f2f3ff] text-[#004ac6] hover:bg-[#eaedff]'
              }`}
            >
              <Fan size={16} />
              State B: พัดลม 100%
            </button>
            <button
              type="button"
              onClick={openStateC}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-1.5 cursor-pointer ${
                activeModal === 'state-c'
                  ? 'bg-[#283044] text-white shadow-xs'
                  : 'bg-[#f2f3ff] text-[#283044] hover:bg-[#eaedff]'
              }`}
            >
              <Wrench size={16} />
              State C: ตรวจสอบซ่อมบำรุง
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
            onClick={openStateA}
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
            onClick={openStateB}
            className="group relative min-h-[190px] h-48 rounded-3xl bg-[#004ac6] text-white p-6 flex flex-col items-center justify-center gap-4 shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer text-center hover:bg-[#003ea8]"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <Fan size={42} className="animate-spin-slow" />
            </div>
            <span className="text-[26px] font-bold text-white tracking-normal leading-tight">
              เร่งพัดลม 100%
            </span>
          </button>

          {/* Action 3: Maintenance Log Entry */}
          <button
            type="button"
            onClick={openStateC}
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

        {/* ── Bottom Section: 4 Telemetry Dial Modules ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
          {/* Telemetry Dial 1: TVOC */}
          <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden min-h-[290px] border border-[#eaedff]">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[16px] font-bold text-[#505f76] tracking-wide">
                สารระเหยรวม (TVOC)
              </span>
              <span className="px-3 py-1 rounded-full bg-[#eaedff] text-[#004ac6] text-[13px] font-bold">
                ปกติ
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
            <div className="text-center mt-1">
              <span className="text-[13px] text-[#505f76] font-medium">
                เกณฑ์ปลอดภัย: ต่ำกว่า 220 ppb
              </span>
            </div>
          </div>

          {/* Telemetry Dial 2: PM2.5 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden min-h-[290px] border border-[#eaedff]">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[16px] font-bold text-[#505f76] tracking-wide">
                ฝุ่นละอองละเอียด (PM2.5)
              </span>
              <span className="px-3 py-1 rounded-full bg-[#eaedff] text-[#004ac6] text-[13px] font-bold">
                ปกติ
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
            <div className="text-center mt-1">
              <span className="text-[13px] text-[#505f76] font-medium">
                เกณฑ์ปลอดภัย: ต่ำกว่า 37.5 µg/m³
              </span>
            </div>
          </div>

          {/* Telemetry Dial 3: Temperature & Humidity */}
          <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden min-h-[290px] border border-[#eaedff]">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[16px] font-bold text-[#505f76] tracking-wide">
                อุณหภูมิ / ความชื้น
              </span>
              <span className="px-3 py-1 rounded-full bg-[#eaedff] text-[#004ac6] text-[13px] font-bold">
                ปกติ
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
                  strokeDashoffset="240"
                  strokeLinecap="round"
                  strokeWidth="14"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[34px] leading-[38px] font-bold text-[#131b2e] tracking-tight">
                  28° / 52%
                </span>
                <span className="text-[14px] font-semibold text-[#505f76] mt-0.5">°C / %RH</span>
              </div>
            </div>
            <div className="text-center mt-1">
              <span className="text-[13px] text-[#505f76] font-medium">
                เกณฑ์ปลอดภัย: 20-32° / 40-70%
              </span>
            </div>
          </div>

          {/* Telemetry Dial 4: Airflow Velocity */}
          <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center justify-between relative overflow-hidden min-h-[290px] border border-[#eaedff]">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[16px] font-bold text-[#505f76] tracking-wide">
                ความเร็วลมระบาย (Airflow)
              </span>
              <span className="px-3 py-1 rounded-full bg-[#eaedff] text-[#004ac6] text-[13px] font-bold">
                ปกติ
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
                  className="text-[#00CC66]"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="78"
                  stroke="currentColor"
                  strokeDasharray="490.08"
                  strokeDashoffset="180"
                  strokeLinecap="round"
                  strokeWidth="14"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[44px] leading-[46px] font-bold text-[#131b2e] tracking-tight">
                  0.45
                </span>
                <span className="text-[16px] font-semibold text-[#505f76] mt-0.5">m/s</span>
              </div>
            </div>
            <div className="text-center mt-1">
              <span className="text-[13px] text-[#505f76] font-medium">
                เกณฑ์ห้องพ่น: 0.40 - 0.60 m/s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATE A: Emergency Cut-off Confirmation Modal ── */}
      {activeModal === 'state-a' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center border-4 border-[#ba1a1a]">
            <div className="w-24 h-24 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-6 animate-bounce">
              <ShieldAlert size={64} />
            </div>
            <h2 className="text-[34px] leading-tight font-bold text-[#131b2e] mb-2">
              ยืนยันการแจ้งเหตุฉุกเฉินสารเคมีรั่วไหล?
            </h2>
            <p className="text-[18px] text-[#505f76] max-w-lg mb-6">
              ระบบจะทำการเปิดม่านลมฉุกเฉิน, เร่งพัดลมดูด 100%, และส่งสัญญาณเตือนไปยังเจ้าหน้าที่ความปลอดภัย (Safety Officer) ทันที
            </p>
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#ffdad6]/60 border border-[#ffdad6] text-[#ba1a1a] text-[20px] font-bold mb-8">
              <span>จะดำเนินการตัดระบบอัตโนมัติใน:</span>
              <span className="text-[32px] font-black underline">{countdown}s</span>
            </div>
            <div className="grid grid-cols-2 gap-5 w-full">
              <button
                type="button"
                onClick={closeAllModals}
                className="min-h-[72px] rounded-2xl bg-[#eaedff] text-[#131b2e] text-[24px] font-bold flex items-center justify-center active:scale-[0.98] cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmEmergency}
                className="min-h-[72px] rounded-2xl bg-[#ba1a1a] text-white text-[24px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer hover:bg-[#a01414]"
              >
                ยืนยันตัดระบบ (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE B: Max Exhaust Booster Modal ── */}
      {activeModal === 'state-b' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center border-4 border-[#004ac6]">
            <div className="w-24 h-24 rounded-full bg-[#d0e1fb] text-[#004ac6] flex items-center justify-center mb-6">
              <Fan size={64} className="animate-spin" />
            </div>
            <h2 className="text-[36px] font-bold text-[#131b2e] mb-2 leading-tight">
              สั่งการพัดลมดูดอากาศ 100%
            </h2>
            <p className="text-[20px] text-[#505f76] mb-6">
              Exhaust Fan กำลังทำงานที่กำลังสูงสุดเพื่อเจือจางสารระเหย
            </p>
            <div className="w-full bg-[#f2f3ff] rounded-2xl p-6 mb-8 flex flex-col gap-3">
              <div className="flex justify-between text-[18px] font-bold text-[#131b2e]">
                <span>ความเร็วรอบพัดลม (RPM):</span>
                <span className="text-[#004ac6] tabular-nums">2,400 RPM (MAX)</span>
              </div>
              <div className="w-full bg-[#e2e7ff] h-4 rounded-full overflow-hidden">
                <div className="bg-[#004ac6] h-full rounded-full w-full animate-pulse" />
              </div>
              <div className="flex justify-between text-[14px] text-[#505f76] font-medium">
                <span>อัตราการไหลเวียนอากาศ: 12,500 m³/h</span>
                <span>สถานะ: ทำงานเต็มกำลัง</span>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAllModals}
              className="w-full min-h-[72px] rounded-2xl bg-[#283044] text-white text-[24px] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] cursor-pointer"
            >
              <StopCircle size={32} />
              <span>หยุด (Stop)</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STATE C: Maintenance Checklist Modal ── */}
      {activeModal === 'state-c' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#eaedff] mb-5">
              <div>
                <h2 className="text-[28px] font-bold text-[#131b2e] leading-tight">
                  บันทึกงานซ่อมบำรุงประจำวัน
                </h2>
                <p className="text-[16px] text-[#505f76] mt-0.5">
                  แตะเลือกเพื่อเช็ครายการตรวจสอบ (Touch Checklist)
                </p>
              </div>
              <button
                type="button"
                onClick={closeAllModals}
                className="w-12 h-12 rounded-full bg-[#f2f3ff] text-[#505f76] flex items-center justify-center hover:text-[#131b2e] cursor-pointer"
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
                  className={`flex items-center gap-5 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] ${
                    item.checked
                      ? 'border-[#004ac6] bg-[#f2f3ff]'
                      : 'border-[#eaedff] bg-white hover:bg-[#faf8ff]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {}}
                    className="w-8 h-8 rounded text-[#004ac6] focus:ring-[#004ac6] accent-[#004ac6] cursor-pointer"
                  />
                  <span className="text-[20px] font-bold text-[#131b2e] flex-grow">
                    {item.text}
                  </span>
                  <span className="text-[14px] text-[#505f76] font-medium">{item.sub}</span>
                </label>
              ))}
            </div>

            {/* Bottom Action Buttons */}
            <div className="grid grid-cols-2 gap-5 pt-5 border-t border-[#eaedff] mt-3">
              <button
                type="button"
                onClick={closeAllModals}
                className="min-h-[64px] rounded-2xl bg-[#eaedff] text-[#131b2e] text-[22px] font-bold flex items-center justify-center active:scale-[0.98] cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={saveMaintenanceChecklist}
                className="min-h-[64px] rounded-2xl bg-[#004ac6] text-white text-[22px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] cursor-pointer hover:bg-[#003ea8]"
              >
                <Save size={26} />
                <span>บันทึก (Save)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Touch Feedback Toast ── */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full bg-[#131b2e] text-white text-[16px] font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={20} className="text-[#00CC66]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
