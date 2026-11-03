import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Stitch AI Standard 480px Right Slide-out Drawer Component
 * Used for Telemetry details, Incident SLA panels, Device details, Airflow diagnostics
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 480,
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
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          style={{ width: `${width}px`, maxWidth: '100vw' }}
          className="relative flex flex-col justify-between bg-white shadow-2xl border-l border-[#e2e8f0] transform transition-transform duration-300 ease-out translate-x-0"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex flex-col">
              <h3 className="text-[17px] font-semibold text-[#131b2e] leading-snug">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[12px] text-[#64748b] mt-0.5 font-normal">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-[#64748b] hover:text-[#131b2e] hover:bg-[#f1f5f9] transition-colors"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {children}
          </div>

          {/* Footer (Optional) */}
          {footer && (
            <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#faf8ff] flex items-center justify-end gap-3 sticky bottom-0">
              {footer}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

