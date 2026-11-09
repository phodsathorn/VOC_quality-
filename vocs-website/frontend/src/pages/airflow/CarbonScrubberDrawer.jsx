import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function CarbonScrubberDrawer({
  isOpen,
  onClose,
  mediaPercent = 42,
}) {
  const { isThai } = useLanguage();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] z-50 transition-opacity"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] animate-in slide-in-from-right duration-300 overflow-y-auto">
        {/* Header */}
        <div className="p-8 border-b border-[#eaedff] flex items-start justify-between bg-[#faf8ff]/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#004ac6] mt-0.5">
              <span className="material-symbols-outlined text-[22px]">filter_alt</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-[20px] font-bold text-[#131b2e] leading-tight">
                {isThai ? 'โทรมาตรสครับเบอร์ถ่านกัมมันต์' : 'Carbon Scrubber Telemetry'}
              </h2>
              <span className="text-[12px] text-[#434655] mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#004ac6] inline-block" />
                {isThai ? 'ชุดถ่านกัมมันต์สายที่ 01 • เรียลไทม์' : 'Adsorption Bed Line 01 • Real-time'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#eaedff] flex items-center justify-center text-[#434655] hover:text-[#131b2e] transition-colors cursor-pointer text-[20px] font-light"
          >
            ✕
          </button>
        </div>

        {/* 3 BIG NUMBERS ONLY with ample whitespace */}
        <div className="p-8 flex-1 flex flex-col justify-around gap-8 my-4">
          {/* Number 1: Differential Pressure 312 Pa */}
          <div className="flex flex-col p-6 rounded-2xl bg-[#f2f3ff]/60 hover:bg-[#f2f3ff] transition-colors border border-[#eaedff]">
            <span className="text-[12px] font-semibold text-[#434655] uppercase tracking-widest mb-1">
              {isThai ? 'แรงดันตกคร่อม' : 'Differential pressure'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[54px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                312
              </span>
              <span className="text-[22px] font-medium text-[#434655]">Pa</span>
            </div>
            <span className="text-[12px] text-[#004ac6] font-medium mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] inline-block" />
              {isThai ? 'แรงต้านการไหลปกติ' : 'Nominal resistance'}
            </span>
          </div>

          {/* Number 2: Efficiency 94.2% */}
          <div className="flex flex-col p-6 rounded-2xl bg-[#f2f3ff]/60 hover:bg-[#f2f3ff] transition-colors border border-[#eaedff]">
            <span className="text-[12px] font-semibold text-[#434655] uppercase tracking-widest mb-1">
              {isThai ? 'ประสิทธิภาพการดูดซับ' : 'Efficiency'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[54px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                94.2
              </span>
              <span className="text-[28px] font-semibold text-[#434655]">%</span>
            </div>
            <span className="text-[12px] text-[#004ac6] font-medium mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] inline-block" />
              {isThai ? 'อัตราดูดซับสารไฮโดรคาร์บอน' : 'Hydrocarbon adsorption yield'}
            </span>
          </div>

          {/* Number 3: Filter life */}
          <div className="flex flex-col p-6 rounded-2xl bg-[#f2f3ff]/60 hover:bg-[#f2f3ff] transition-colors border border-[#eaedff]">
            <span className="text-[12px] font-semibold text-[#434655] uppercase tracking-widest mb-1">
              {isThai ? 'อายุการใช้งานชั้นถ่าน' : 'Filter life'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[54px] font-bold text-[#131b2e] tracking-tight leading-none tabular-nums">
                {mediaPercent}
              </span>
              <span className="text-[28px] font-semibold text-[#434655]">%</span>
            </div>
            <span className="text-[12px] text-[#434655] font-medium mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#505f76] inline-block" />
              {isThai ? 'เหลืออายุการทำงาน 1,280 ชั่วโมง' : '1,280 operating hours remaining'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-[#eaedff] bg-[#faf8ff]/30 flex items-center justify-between">
          <span className="text-[12px] text-[#434655]">
            {isThai ? 'อัปเดต 3 วินาทีที่แล้ว' : 'Updated 3s ago'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#e2e7ff] hover:bg-[#d0e1fb] text-[#131b2e] font-semibold text-[13px] transition-colors cursor-pointer"
          >
            {isThai ? 'ปิดหน้าต่าง' : 'Dismiss'}
          </button>
        </div>
      </aside>
    </>
  );
}

