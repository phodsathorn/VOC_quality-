import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * Standard Confirmation Dialog for Actions (Delete, Reboot, Rollback, Acknowledge)
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  intent = 'danger', // danger, warning, primary
  loading = false,
  children,
}) {
  let Icon = AlertTriangle;
  let iconBg = 'bg-rose-50 text-rose-600 border border-rose-200';
  let buttonVariant = 'danger';

  if (intent === 'warning') {
    Icon = AlertCircle;
    iconBg = 'bg-amber-50 text-amber-600 border border-amber-200';
    buttonVariant = 'secondary';
  } else if (intent === 'primary') {
    Icon = Info;
    iconBg = 'bg-blue-50 text-[#004ac6] border border-blue-200';
    buttonVariant = 'primary';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-2xl shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-[14px] text-[#505f76] leading-relaxed pt-0.5">
            {description}
          </div>
        </div>

        {children}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e1e3ed] mt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

