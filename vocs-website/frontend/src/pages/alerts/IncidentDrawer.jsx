import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function IncidentDrawer({
  selectedIncident,
  resetDrawer,
  actionSelection,
  setActionSelection,
  ownerSelection,
  setOwnerSelection,
  mitigationNote,
  setMitigationNote,
  handleAcknowledge,
  handleResolve,
}) {
  const { isThai } = useLanguage();

  return (
    <div
      className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between transition-all duration-300"
      id="incident-drawer"
    >
      <div>
        {/* Header + Close button */}
        <div className="flex items-start justify-between pb-4">
          <div className="flex flex-col">
            <h3 className="text-[18px] font-semibold text-[#131b2e] leading-snug">
              {selectedIncident
                ? (isThai ? `เหตุการณ์ #${selectedIncident.id}: ${selectedIncident.condition}` : selectedIncident.title)
                : (isThai ? 'การแจ้งเตือนสายพ่นสีฝุ่น' : 'Powder Coating Line Alerts')}
            </h3>
            <span className="text-[14px] text-[#434655] mt-1 font-normal">
              {selectedIncident
                ? (isThai
                    ? `${String(selectedIncident.time || '').replace('Today', 'วันนี้').replace('Yesterday', 'เมื่อวาน')} • ระดับ: ${selectedIncident.level === 'Warning' ? 'เฝ้าระวัง' : selectedIncident.level === 'Critical' ? 'วิกฤต' : 'ปกติ'}`
                    : selectedIncident.meta)
                : (isThai ? 'เลือกเหตุการณ์จากตารางเพื่อดูรายละเอียด' : 'Select an incident from the log')}
            </span>
          </div>
          <button
            type="button"
            onClick={resetDrawer}
            className="p-1 rounded-full text-[#434655] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors cursor-pointer"
            aria-label="Dismiss panel"
          >
            <X size={20} />
          </button>
        </div>

        {selectedIncident && (
          <div className="flex flex-col gap-4 mt-3">
            {/* Sub-State SLA Card */}
            <div className="bg-[#f2f3ff] p-3.5 rounded-2xl flex flex-col gap-1.5 border border-[#eaedff]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#434655]">
                  {isThai ? 'การตอบสนองตาม SLA' : 'SLA Response'}
                </span>
                <span className="text-[#059669] font-semibold">
                  {isThai
                    ? `เป้าหมาย ${selectedIncident.slaMinutes} นาที / ${selectedIncident.slaTarget} นาที`
                    : `${selectedIncident.slaMinutes}m / ${selectedIncident.slaTarget}m target`}
                </span>
              </div>
              <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#059669] h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (selectedIncident.slaMinutes / selectedIncident.slaTarget) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#505f76]">
                <span>
                  {isThai
                    ? `ตอบสนองภายใน ${selectedIncident.slaMinutes} นาที • เป็นไปตามเกณฑ์`
                    : `Responded in ${selectedIncident.slaMinutes} min • Compliant`}
                </span>
                <span>
                  {isThai ? 'ยกระดับไปยัง: หัวหน้างาน, กลุ่ม LINE' : 'Escalates to: Supervisor, LINE group'}
                </span>
              </div>
            </div>

            {/* 30 Minutes Around the Event Sparkline Chart */}
            <div className="bg-[#f2f3ff] p-3.5 rounded-2xl flex flex-col gap-2 border border-[#eaedff]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#131b2e]">
                  {isThai ? 'ช่วงเวลา 30 นาทีก่อนและหลังเกิดเหตุ' : '30 minutes around the event'}
                </span>
                <span className="text-[10px] text-[#ba1a1a] font-medium">
                  {isThai ? `สูงสุด: ${selectedIncident.peakPpb || 218} ppb` : `Peak: ${selectedIncident.peakPpb || 218} ppb`}
                </span>
              </div>
              <div className="relative w-full h-20">
                <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                  <line x1="0" y1="28" x2="300" y2="28" stroke="#ba1a1a" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.75" />
                  <path d="M0,66 C35,66 50,65 80,63 C110,60 125,58 140,24 C148,10 156,12 165,34 C175,54 200,60 230,62 C260,64 280,64 300,65" fill="none" stroke="#004ac6" strokeWidth="2.5" />
                  <path d="M0,66 C35,66 50,65 80,63 C110,60 125,58 140,24 C148,10 156,12 165,34 C175,54 200,60 230,62 C260,64 280,64 300,65 L300,80 L0,80 Z" fill="#004ac6" fillOpacity="0.08" />
                  <circle cx="152" cy="18" r="4.5" fill="#ba1a1a" stroke="#ffffff" strokeWidth="2" />
                  <text x="156" y="16" fill="#ba1a1a" fontSize="9" fontWeight="bold">14:20</text>
                  <text x="4" y="24" fill="#ba1a1a" fontSize="8" fontWeight="500" opacity="0.9">
                    {isThai ? `เกณฑ์ ${selectedIncident.limitPpb || 200} ppb` : `Limit ${selectedIncident.limitPpb || 200} ppb`}
                  </text>
                </svg>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#505f76] font-mono">
                <span>14:05</span>
                <span>14:20</span>
                <span>14:35</span>
              </div>
            </div>

            {/* Incident Timeline */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold">
                {isThai ? 'ลำดับเหตุการณ์' : 'Incident Timeline'}
              </span>
              <div className="relative pl-5 flex flex-col gap-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#eaedff]">
                <div className="relative flex items-start gap-2">
                  <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-white" />
                  <div className="flex flex-col text-xs">
                    <span className="font-medium text-[#131b2e]">
                      {isThai ? 'ตรวจพบเหตุการณ์' : 'Created'} <span className="text-[11px] text-[#505f76] font-normal">• 14:20</span>
                    </span>
                    <span className="text-[11px] text-[#505f76]">
                      {isThai ? 'ระบบตรวจพบอัตโนมัติ (TVOC > 200 ppb)' : 'System trigger (TVOC > 200 ppb)'}
                    </span>
                  </div>
                </div>
                <div className="relative flex items-start gap-2">
                  <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-white" />
                  <div className="flex flex-col text-xs">
                    <span className="font-medium text-[#131b2e]">
                      {isThai ? 'รับทราบเหตุการณ์' : 'Acknowledged'} <span className="text-[11px] text-[#505f76] font-normal">• 14:23</span>
                    </span>
                    <span className="text-[11px] text-[#505f76]">{selectedIncident.owner}</span>
                  </div>
                </div>
                <div className="relative flex items-start gap-2">
                  <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#004ac6] animate-pulse ring-2 ring-white" />
                  <div className="flex flex-col text-xs">
                    <span className="font-medium text-[#004ac6]">
                      {isThai ? 'กำลังแก้ไข' : 'In progress'} <span className="text-[11px] text-[#505f76] font-normal">• 14:26</span>
                    </span>
                    <span className="text-[11px] text-[#505f76]">
                      {selectedIncident.owner} {isThai ? '(เร่งพัดลมดูดอากาศ 100%)' : '(Exhaust fan boosted)'}
                    </span>
                  </div>
                </div>
                <div className="relative flex items-start gap-2">
                  <span className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${selectedIncident.status === 'Resolved' || selectedIncident.status === 'แก้ไขแล้ว' ? 'bg-[#10b981]' : 'border-2 border-[#c3c6d7] bg-white'}`} />
                  <div className="flex flex-col text-xs">
                    <span className={`font-medium ${selectedIncident.status === 'Resolved' || selectedIncident.status === 'แก้ไขแล้ว' ? 'text-[#10b981]' : 'text-[#505f76]'}`}>
                      {isThai ? 'แก้ไขเสร็จสิ้น' : 'Resolved'}
                    </span>
                    <span className="text-[11px] text-[#505f76]/70">
                      {selectedIncident.status === 'Resolved' || selectedIncident.status === 'แก้ไขแล้ว'
                        ? (isThai ? 'ตรวจสอบยืนยันเรียบร้อยแล้ว ✓' : 'Completed & verified ✓')
                        : (isThai ? 'รอดำเนินการให้เสร็จสิ้น' : 'Pending completion • Unassigned')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Taken Select */}
        <div className="mt-5 flex flex-col gap-1.5">
          <label
            className="text-[12px] uppercase tracking-wider text-[#434655] font-medium"
            htmlFor="incident-action"
          >
            {isThai ? 'การดำเนินการแก้ไข' : 'Action taken'}
          </label>
          <div className="relative">
            <select
              id="incident-action"
              value={actionSelection}
              onChange={(e) => setActionSelection(e.target.value)}
              className="w-full appearance-none bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 pr-10 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
            >
              <option value="fan-boost">
                {isThai ? 'เร่งพัดลมดูดอากาศ 100% (ฉุกเฉิน)' : 'Exhaust fan boosted to 100%'}
              </option>
              <option value="inspection">
                {isThai ? 'ตรวจสอบห้องพ่นสีด้วยตนเอง' : 'Manual booth inspection'}
              </option>
              <option value="filter-log">
                {isThai ? 'บันทึกการเปลี่ยนแผ่นกรอง' : 'Filter replacement logged'}
              </option>
              <option value="dismiss">
                {isThai ? 'ยกเลิกการเตือน (สัญญาณรบกวน)' : 'False positive dismissed'}
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#434655]">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {/* Owner Select */}
        <div className="mt-4 flex flex-col gap-1.5">
          <label
            className="text-[12px] uppercase tracking-wider text-[#434655] font-medium"
            htmlFor="incident-owner"
          >
            {isThai ? 'ผู้รับผิดชอบ' : 'Owner'}
          </label>
          <div className="relative">
            <select
              id="incident-owner"
              value={ownerSelection}
              onChange={(e) => setOwnerSelection(e.target.value)}
              className="w-full appearance-none bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 pr-10 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
            >
              <option value="admin">System Administrator ({isThai ? 'ผู้ดูแลระบบส่วนกลาง' : 'System Admin'})</option>
              <option value="engineer">Process & Calibration Engineer ({isThai ? 'วิศวกรสอบเทียบ' : 'Process Eng.'})</option>
              <option value="operator">Line Operator ({isThai ? 'พนักงานประจำตู้พ่นสี' : 'Booth Operator'})</option>
              <option value="viewer">Safety & Compliance Auditor ({isThai ? 'เจ้าหน้าที่ความปลอดภัย (จป.)' : 'H&S Auditor'})</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#434655]">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {/* Mitigation Note */}
        <div className="mt-4 flex flex-col gap-1.5">
          <label
            className="text-[12px] uppercase tracking-wider text-[#434655] font-medium"
            htmlFor="incident-note"
          >
            {isThai ? 'บันทึกผลการแก้ไข' : 'Mitigation note'}
          </label>
          <textarea
            id="incident-note"
            rows={3}
            value={mitigationNote}
            onChange={(e) => setMitigationNote(e.target.value)}
            placeholder={isThai ? 'บันทึกการแก้ไขหรือหลักฐานเพิ่มเติม...' : 'Add mitigation note or root-cause details...'}
            className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl p-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 resize-none"
          />
        </div>
      </div>

      {/* Action Buttons: Acknowledge & Mark Resolved */}
      <div className="pt-6 flex items-center gap-3">
        <button
          type="button"
          id="btn-ack"
          onClick={handleAcknowledge}
          disabled={selectedIncident?.status === 'Acknowledged' || selectedIncident?.status === 'รับทราบแล้ว' || selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'}
          className={`flex-1 py-3 px-4 rounded-2xl font-medium text-[14px] transition-colors text-center cursor-pointer ${
            selectedIncident?.status === 'Acknowledged' || selectedIncident?.status === 'รับทราบแล้ว' || selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'
              ? 'bg-[#eaedff] text-[#54647a] opacity-60 cursor-not-allowed'
              : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dbe1ff]'
          }`}
        >
          {selectedIncident?.status === 'Acknowledged' || selectedIncident?.status === 'รับทราบแล้ว'
            ? (isThai ? 'รับทราบแล้ว ✓' : 'Acknowledged ✓')
            : (isThai ? 'รับทราบเหตุการณ์' : 'Acknowledge')}
        </button>
        <button
          type="button"
          id="btn-resolve"
          onClick={handleResolve}
          disabled={selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'}
          className={`flex-1 py-3 px-4 rounded-2xl font-medium text-[14px] shadow-xs transition-all text-center cursor-pointer ${
            selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'
              ? 'bg-[#059669] text-white opacity-90 cursor-default'
              : 'bg-[#004ac6] text-white hover:bg-[#003ea8]'
          }`}
        >
          {selectedIncident?.status === 'Resolved' || selectedIncident?.status === 'แก้ไขแล้ว'
            ? (isThai ? 'แก้ไขแล้ว ✓' : 'Resolved ✓')
            : (isThai ? 'บันทึกว่าแก้ไขเสร็จสิ้น' : 'Mark resolved')}
        </button>
      </div>
    </div>
  );
}

