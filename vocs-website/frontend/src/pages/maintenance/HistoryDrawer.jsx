import React from 'react';
import { X, History, Download } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function HistoryDrawer({
  isOpen,
  onClose,
  handleDownloadCertificate,
}) {
  const { t, lang } = useLanguage();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] z-50 transition-opacity"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] transition-transform duration-300 ease-out overflow-hidden">
        <div className="p-6 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-[#131b2e] leading-tight">
                {t('calibrationHistory', 'Calibration History')}
              </h2>
              <span className="text-[12px] text-[#505f76]">
                {t('auditTrailSubtitle', 'Powder Coating Booth 1 • Sensor Audit Trail')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#eaedff] flex items-center justify-center text-[#505f76] hover:text-[#131b2e] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#131b2e]">Oct 12, 2025 • 09:30 AM</span>
              <span className="text-[#004ac6] text-[11px] font-semibold bg-white px-2.5 py-0.5 rounded-full shadow-2xs">Drift +2.4%</span>
            </div>
            <span className="text-[12px] text-[#505f76]">{lang === 'TH' ? 'ผู้สอบเทียบ: วิศวกรสอบเทียบเครื่องมือ (Process Engineer)' : 'Technician: Process & Calibration Engineer'}</span>
            <span className="text-[11px] text-[#505f76] font-mono">Baseline resistance: 42.1 kΩ • Zero-air certified</span>
            <button
              type="button"
              onClick={() => handleDownloadCertificate('MQ-3 (Oct 12)')}
              className="mt-1 text-[12px] font-medium text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer text-left"
            >
              <Download size={14} />
              <span>{t('downloadPdfCert', 'Download Certificate PDF')}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#131b2e]">Sep 12, 2025 • 11:15 AM</span>
              <span className="text-[#004ac6] text-[11px] font-semibold bg-white px-2.5 py-0.5 rounded-full shadow-2xs">Drift +1.1%</span>
            </div>
            <span className="text-[12px] text-[#505f76]">{lang === 'TH' ? 'ผู้สอบเทียบ: วิศวกรสอบเทียบเครื่องมือ' : 'Technician: Process & Calibration Engineer'}</span>
            <span className="text-[11px] text-[#505f76] font-mono">Baseline resistance: 41.8 kΩ</span>
            <button
              type="button"
              onClick={() => handleDownloadCertificate('MQ-3 (Sep 12)')}
              className="mt-1 text-[12px] font-medium text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer text-left"
            >
              <Download size={14} />
              <span>{t('downloadPdfCert', 'Download Certificate PDF')}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#131b2e]">Aug 10, 2025 • 02:40 PM</span>
              <span className="text-[#004ac6] text-[11px] font-semibold bg-white px-2.5 py-0.5 rounded-full shadow-2xs">Drift -0.6%</span>
            </div>
            <span className="text-[12px] text-[#505f76]">{lang === 'TH' ? 'ผู้สอบเทียบ: ผู้ดูแลระบบ (System Admin)' : 'Technician: System Administrator'}</span>
            <span className="text-[11px] text-[#505f76] font-mono">Baseline resistance: 42.5 kΩ</span>
            <button
              type="button"
              onClick={() => handleDownloadCertificate('MQ-2 (Aug 10)')}
              className="mt-1 text-[12px] font-medium text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer text-left"
            >
              <Download size={14} />
              <span>{t('downloadPdfCert', 'Download Certificate PDF')}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#131b2e]">Jul 11, 2025 • 10:05 AM</span>
              <span className="text-[#004ac6] text-[11px] font-semibold bg-white px-2.5 py-0.5 rounded-full shadow-2xs">{lang === 'TH' ? 'ค่าอ้างอิงเริ่มต้นจากโรงงาน' : 'Initial Reference'}</span>
            </div>
            <span className="text-[12px] text-[#505f76]">{lang === 'TH' ? 'ผู้สอบเทียบ: ทดสอบและตรวจรับจากโรงงาน' : 'Technician: Factory Commissioning'}</span>
            <span className="text-[11px] text-[#505f76] font-mono">Baseline resistance: 42.8 kΩ</span>
            <button
              type="button"
              onClick={() => handleDownloadCertificate('Initial Factory Commissioning')}
              className="mt-1 text-[12px] font-medium text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer text-left"
            >
              <Download size={14} />
              <span>{t('downloadPdfCert', 'Download Certificate PDF')}</span>
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-[#eaedff]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-[#eaedff] text-[#131b2e] font-medium text-[14px] hover:bg-[#dbe1ff] transition-colors cursor-pointer text-center"
          >
            {t('close', 'Close')}
          </button>
        </div>
      </aside>
    </>
  );
}

