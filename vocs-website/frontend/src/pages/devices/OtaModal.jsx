import React from 'react';
import { Upload, X, FileCode, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function OtaModal({
  isOpen,
  onClose,
  selectedDevice,
  handleUploadFirmware,
  otaFile,
  setOtaFile,
  setOtaError,
  setOtaUploadSuccess,
  otaVersionInput,
  setOtaVersionInput,
  otaError,
  otaUploadSuccess,
  isUploadingOta,
  otaProgress,
  otaHistory,
  handleRollback,
}) {
  const { t, lang } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-5 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-[18px] text-[#131b2e] font-semibold">
                {lang === 'TH' ? 'อัปโหลดเฟิร์มแวร์ใหม่ (Cloud OTA)' : 'Upload Firmware (.bin)'}
              </h2>
              <p className="text-[12px] text-[#505f76]">
                {lang === 'TH'
                  ? `เป้าหมาย: ${selectedDevice?.id || 'BOX-001'} (เวอร์ชันปัจจุบัน ${selectedDevice?.firmware || '1.0.2'})`
                  : `Target: ${selectedDevice?.id || 'BOX-001'} (Current ${selectedDevice?.firmware || '1.0.2'})`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUploadFirmware} className="flex flex-col gap-4">
          {/* File Dropzone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
              {lang === 'TH' ? 'ไฟล์เฟิร์มแวร์คอมไพล์ (.bin)' : 'Firmware Binary File (.bin)'}
            </label>
            <label
              htmlFor="ota-bin-file-input"
              className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                otaFile
                  ? 'border-[#004ac6] bg-[#f2f3ff]'
                  : 'border-[#c3c6d7] hover:border-[#004ac6] hover:bg-[#f8f9ff]'
              }`}
            >
              <input
                id="ota-bin-file-input"
                type="file"
                accept=".bin"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setOtaFile(e.target.files[0]);
                    setOtaError(null);
                    setOtaUploadSuccess(false);
                  }
                }}
              />
              {otaFile ? (
                <div className="flex items-center gap-2.5 text-[#004ac6]">
                  <FileCode size={24} />
                  <div className="flex flex-col text-left">
                    <span className="text-[13px] font-semibold">{otaFile.name}</span>
                    <span className="text-[11px] text-[#505f76]">
                      {(otaFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-[#505f76]" />
                  <span className="text-[13px] font-medium text-[#131b2e]">
                    {lang === 'TH' ? 'คลิกเพื่อเลือกไฟล์ .bin ที่ Export มา' : 'Click to select .bin file'}
                  </span>
                  <span className="text-[11px] text-[#505f76] text-center">
                    {lang === 'TH'
                      ? 'สร้างไฟล์ได้จาก Arduino IDE (Sketch ➔ Export Compiled Binary)'
                      : 'Exported from Arduino IDE (Sketch ➔ Export Compiled Binary)'}
                  </span>
                </>
              )}
            </label>
          </div>

          {/* Version Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
              {lang === 'TH' ? 'รหัสเวอร์ชันใหม่ (Version)' : 'Firmware Version'}
            </label>
            <input
              type="text"
              value={otaVersionInput}
              onChange={(e) => setOtaVersionInput(e.target.value)}
              placeholder="1.0.3"
              className="w-full px-3 py-2.5 rounded-2xl bg-[#f2f3ff] border border-[#c3c6d7] text-[14px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono"
            />
          </div>

          {/* Error Alert */}
          {otaError && (
            <div className="p-3 rounded-2xl bg-[#ffdad6]/50 border border-[#ba1a1a]/30 flex items-center gap-2 text-[#ba1a1a] text-[12px]">
              <AlertCircle size={16} className="shrink-0" />
              <span>{otaError}</span>
            </div>
          )}

          {/* Success Alert */}
          {otaUploadSuccess && (
            <div className="p-3.5 rounded-2xl bg-[#e0f3e6] border border-[#2e7d32]/30 flex flex-col gap-1 text-[#1b5e20]">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <CheckCircle2 size={16} className="text-[#2e7d32]" />
                <span>
                  {lang === 'TH'
                    ? `อัปโหลดเวอร์ชัน ${otaVersionInput} ขึ้นคลาวด์สำเร็จ!`
                    : `Firmware version ${otaVersionInput} published!`}
                </span>
              </div>
              <span className="text-[11px] text-[#2e7d32]/90 leading-relaxed">
                {lang === 'TH'
                  ? 'เซิร์ฟเวอร์ลงนาม SHA256 เรียบร้อย บอร์ด ESP32 จะดึงเฟิร์มแวร์นี้ไปแฟลชตัวเองและรีบูตอัตโนมัติ'
                  : 'Firmware signed with SHA256. ESP32 node will automatically fetch and flash it.'}
              </span>
            </div>
          )}

          {/* Progress bar */}
          {isUploadingOta && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#131b2e]">
                  {lang === 'TH' ? 'กำลังอัปโหลดและสร้างลายเซ็นดิจิทัล...' : 'Uploading and generating SHA256 signature...'}
                </span>
                <span className="font-mono font-bold text-[#004ac6]">{otaProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#eaedff] overflow-hidden">
                <div
                  className="h-full bg-[#004ac6] rounded-full transition-all duration-300"
                  style={{ width: `${otaProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Local Web OTA tip */}
          <div className="p-2.5 rounded-2xl bg-[#f2f3ff] text-[11px] text-[#505f76] flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5 text-[#004ac6]" />
            <span>
              {lang === 'TH'
                ? 'หรือสามารถทดสอบอัปเดตผ่านวง LAN โดยตรงได้ที่ http://<IP_ESP32>/update (Username: admin)'
                : 'Or update locally via LAN at http://<ESP32_IP>/update (Username: admin)'}
            </span>
          </div>

          {/* Firmware History & 1-Click Rollback */}
          {otaHistory.length > 0 && (
            <div className="flex flex-col gap-2 pt-3 border-t border-[#eaedff]">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
                {lang === 'TH' ? 'ประวัติเฟิร์มแวร์ & ถอยกลับ (Rollback)' : 'Firmware History & Rollback'}
              </span>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {otaHistory.map((item) => {
                  const isCurrent = item.status === 'ACTIVE';
                  return (
                    <div
                      key={item.id || item.version}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#f2f3ff] text-xs"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-semibold text-[#131b2e]">
                          <span className="font-mono">v{item.version}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px]">
                              {lang === 'TH' ? 'ใช้งานอยู่' : 'ACTIVE'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#505f76]">
                          {item.released_at || item.created_at || '—'}
                        </span>
                      </div>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRollback(item.version)}
                          disabled={isUploadingOta}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#c3c6d7] text-[#004ac6] hover:bg-[#eaedff] font-medium transition-colors text-[11px] cursor-pointer"
                        >
                          {lang === 'TH' ? 'ถอยกลับ' : 'Rollback'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-full border border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff] text-[13px] font-medium cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isUploadingOta || !otaFile}
              className={`py-2.5 px-6 rounded-full text-white shadow-xs text-[13px] font-medium flex items-center gap-1.5 cursor-pointer ${
                isUploadingOta || !otaFile
                  ? 'bg-[#c3c6d7] cursor-not-allowed'
                  : 'bg-[#004ac6] hover:bg-[#003ea8]'
              }`}
            >
              <Upload size={16} />
              <span>
                {isUploadingOta
                  ? (lang === 'TH' ? 'กำลังส่งข้อมูล...' : 'Uploading...')
                  : (lang === 'TH' ? 'อัปโหลดเฟิร์มแวร์' : 'Upload Firmware')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

