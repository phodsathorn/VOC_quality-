import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Stitch AI Standard Centered Modal Dialog Component
 * Used for Radar charts, OTA update progress, Kiosk emergency confirms
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg', // max-w-md, max-w-lg, max-w-2xl
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#131b2e]/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Window */}
        <div
          className={`relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full ${maxWidth} border border-[#e2e8f0]`}
        >
          {/* Header */}
          {(title || subtitle) && (
            <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between">
              <div>
                {title && (
                  <h3 className="text-[18px] font-semibold text-[#131b2e] leading-snug">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-[13px] text-[#64748b] mt-0.5 font-normal">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-[#64748b] hover:text-[#131b2e] hover:bg-[#f1f5f9] transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-6">
            {children}
          </div>

          {/* Footer (Optional) */}
          {footer && (
            <div className="px-6 py-4 bg-[#faf8ff] border-t border-[#e2e8f0] flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

