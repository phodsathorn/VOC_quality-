import React from 'react';
import { Radio, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SensorBoxTelemetryDrawer({
  isOpen,
  onClose,
  probeRows = [],
}) {
  const { isThai } = useLanguage();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] z-50 transition-opacity"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-16 px-6 border-b border-[#eaedff] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#d0e1fb] flex items-center justify-center text-[#004ac6]">
              <Radio size={18} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#131b2e] leading-tight">
                {isThai ? 'โทรมาตรเซนเซอร์เรียลไทม์' : 'Live sensor telemetry'}
              </h2>
              <span className="text-[11px] text-[#505f76]">
                {isThai ? 'กล่องรวมสัญญาณ BOX-001 • 5 แชนแนลหลัก' : 'Sensor Enclosure BOX-001 • 5 Core Channels'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-semibold">
              {isThai ? 'ค่าตรวจวัดหัววัดเรียลไทม์' : 'Real-time probe readings'}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#00AA55] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00CC66] animate-pulse" />
              {isThai ? 'ทุกระบบทำงานปกติ' : 'All systems nominal'}
            </div>
          </div>

          {/* Probe Table matching Stitch exactly */}
          <div className="border border-[#eaedff] rounded-2xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#f2f3ff] border-b border-[#eaedff] text-[#505f76] font-medium text-xs">
                  <th className="py-2.5 px-4">{isThai ? 'รหัสเซนเซอร์' : 'Sensor ID'}</th>
                  <th className="py-2.5 px-4">{isThai ? 'สารเป้าหมายที่ตรวจวัด' : 'Target Gas / Analyte'}</th>
                  <th className="py-2.5 px-4 text-right">{isThai ? 'ค่าที่อ่านได้' : 'Value'}</th>
                  <th className="py-2.5 px-4 text-right">{isThai ? 'เกณฑ์กำหนด' : 'Threshold'}</th>
                  <th className="py-2.5 px-4 text-center">{isThai ? 'สถานะ' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                {probeRows.map((p) => (
                  <tr key={p.id} className="hover:bg-[#eaedff]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#131b2e]">{p.id}</td>
                    <td className="py-3 px-4 text-[#131b2e] font-medium text-xs">{p.target}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#131b2e]">{p.val}</td>
                    <td className="py-3 px-4 text-right text-[#505f76] text-xs">{p.thresh}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#00CC66]/10 text-[#009944]">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sampling Rate Banner */}
          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#131b2e]">{isThai ? 'อัตราการสุ่มตัวอย่าง' : 'Sampling Rate'}</span>
              <span className="text-xs text-[#505f76] font-medium">{isThai ? '2.5 Hz (ต่อเนื่อง)' : '2.5 Hz (Continuous)'}</span>
            </div>
            <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#004ac6] h-full rounded-full w-full" />
            </div>
            <p className="text-[11px] text-[#505f76] mt-2">
              {isThai ? 'ซิงโครไนซ์ล่าสุดเมื่อ 3 วินาทีที่แล้วผ่านเกตเวย์ Modbus TCP' : 'Latest synchronization occurred 3 seconds ago via Modbus TCP gateway.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#eaedff] bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-[#505f76]">
            {isThai ? 'รหัสแผงอุปกรณ์: ' : 'Array ID: '}<strong className="font-mono text-[#131b2e]">BOX-001</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[#eaedff] text-[#131b2e] text-xs font-semibold hover:bg-[#dbe1ff] transition-colors cursor-pointer"
          >
            {isThai ? 'ปิดหน้าต่าง' : 'Dismiss'}
          </button>
        </div>
      </aside>
    </>
  );
}

