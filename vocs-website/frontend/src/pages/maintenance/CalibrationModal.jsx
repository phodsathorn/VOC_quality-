import React from 'react';
import { Wrench, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function CalibrationModal({
  calibModalSensor,
  setCalibModalSensor,
  calibStandard,
  setCalibStandard,
  handleConfirmCalibration,
  selectedFilter,
  setSelectedFilter,
}) {
  const { t, lang } = useLanguage();

  return (
    <>
      {/* ── Modal: Confirm Sensor Calibration matching Stitch ── */}
      {calibModalSensor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#131b2e]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setCalibModalSensor(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl flex flex-col gap-5 z-10 border border-[#eaedff] animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e2e7ff] text-[#004ac6] flex items-center justify-center">
                <Wrench size={20} />
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-[#131b2e]">
                  {t('confirmSensorCalibration', 'Confirm Sensor Calibration')}
                </h3>
                <span className="text-xs text-[#004ac6] font-medium">
                  {calibModalSensor.name} ({calibModalSensor.serial})
                </span>
              </div>
            </div>

            <p className="text-[13px] text-[#505f76] leading-relaxed">
              {lang === 'TH'
                ? `การดำเนินการนี้จะสร้างจุดศูนย์อ้างอิงใหม่สำหรับ ${calibModalSensor.name} โปรดตรวจสอบว่าการไหลของก๊าซมาตรฐานมีความเสถียรก่อนทำการสอบเทียบ`
                : `This action establishes a zero-point baseline for ${calibModalSensor.name}. Please confirm reference gas flow is stable prior to calibration.`}
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#505f76] uppercase tracking-wider">
                {t('calibrationNotesGas', 'Calibration notes / reference gas standard')}
              </label>
              <textarea
                rows={3}
                value={calibStandard}
                onChange={(e) => setCalibStandard(e.target.value)}
                placeholder={lang === 'TH' ? 'เช่น ก๊าซศูนย์มาตรฐาน Zero Air + ถังก๊าซ Span 50 ppm (ชุดผลิต #4902-A)' : 'e.g. Standard Zero Air + 50 ppm Span canister (Batch #4902-A)'}
                className="w-full p-3 rounded-2xl bg-[#f2f3ff] text-[#131b2e] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCalibModalSensor(null)}
                className="px-4 py-2.5 rounded-2xl bg-[#eaedff] text-[#131b2e] text-[14px] font-medium hover:bg-[#dbe1ff] transition-colors cursor-pointer"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCalibration}
                className="px-5 py-2.5 rounded-2xl bg-[#004ac6] text-white text-[14px] font-medium shadow-xs hover:bg-[#003ea8] transition-opacity cursor-pointer"
              >
                {t('confirmCalibration', 'Confirm Calibration')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Filter Detail Modal ── */}
      {selectedFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#131b2e]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedFilter(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 z-10 border border-[#eaedff] animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#004ac6] font-bold">
                  {selectedFilter.stage}
                </span>
                <h3 className="text-[20px] font-semibold text-[#131b2e] mt-0.5">
                  {selectedFilter.name} {lang === 'TH' ? 'ข้อมูลตรวจวิเคราะห์' : 'Diagnostics'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFilter(null)}
                className="p-1 rounded-full text-[#505f76] hover:bg-[#eaedff] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#f2f3ff] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#505f76]">{t('estRemainingLife', 'Estimated Remaining Life')}</span>
                <div className="text-[32px] font-bold text-[#131b2e] tabular-nums">
                  {selectedFilter.percent}%
                </div>
              </div>
              <div className="w-24 bg-[#eaedff] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#004ac6] h-full rounded-full"
                  style={{ width: `${selectedFilter.percent}%` }}
                />
              </div>
            </div>

            <p className="text-[13px] text-[#505f76] leading-relaxed">
              {selectedFilter.desc}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#f2f3ff]">
                <span className="text-[#505f76] block">{t('installedDate', 'Installed Date')}</span>
                <span className="font-semibold text-[#131b2e]">{selectedFilter.installed}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#f2f3ff]">
                <span className="text-[#505f76] block">{t('replacementInterval', 'Replacement Interval')}</span>
                <span className="font-semibold text-[#131b2e]">{selectedFilter.lifespan}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedFilter(null)}
                className="px-5 py-2.5 rounded-2xl bg-[#004ac6] text-white text-[14px] font-medium hover:bg-[#003ea8] transition-colors cursor-pointer"
              >
                {t('close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

