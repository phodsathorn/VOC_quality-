import React from 'react';
import { Key, X, Copy, Info, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function DeviceTokenModal({
  isOpen,
  onClose,
  handleCopyToken,
  copiedToken,
}) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[440px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-5 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
              <Key size={18} />
            </div>
            <h2 className="text-[18px] text-[#131b2e] font-semibold">
              {t('generateTokenTitle', 'Generate Device Token')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-[#505f76] text-[13px] leading-relaxed">
          {t('deviceAuthTokenDesc', 'Device authentication token for direct TLS telemetry ingestion.')}
        </p>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#eaedff] font-mono text-[12px] text-[#131b2e] border border-[#c3c6d7]">
            <span className="truncate select-all">tok_esp32_9f82a17c4b0e883d8a7199c2</span>
            <button
              type="button"
              onClick={handleCopyToken}
              className="text-[#737686] hover:text-[#004ac6] cursor-pointer ml-2 p-1"
            >
              <Copy size={16} />
            </button>
          </div>
          <span className="text-[11px] text-[#943700] font-medium flex items-center gap-1 mt-1">
            <Info size={14} />
            {t('shownOnceNote', 'Shown only once. Store securely before closing.')}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-full border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a]/10 text-[13px] font-medium cursor-pointer"
          >
            {t('revoke', 'Revoke')}
          </button>
          <button
            type="button"
            onClick={handleCopyToken}
            className="py-2 px-5 rounded-full bg-[#004ac6] text-white hover:bg-[#003ea8] shadow-xs text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={16} />
            <span>{copiedToken ? t('copied', 'Copied ✓') : t('copy', 'Copy')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

