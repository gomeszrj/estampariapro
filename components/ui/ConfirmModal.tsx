import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type ModalVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ModalVariant, {
  icon: React.ReactNode;
  confirmClass: string;
  iconClass: string;
  ringClass: string;
}> = {
  danger: {
    icon: <AlertTriangle className="w-6 h-6" />,
    confirmClass: 'bg-red-600 hover:bg-red-500 border-red-500',
    iconClass: 'text-red-400',
    ringClass: 'ring-red-500/20 bg-red-500/10',
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6" />,
    confirmClass: 'bg-amber-600 hover:bg-amber-500 border-amber-500',
    iconClass: 'text-amber-400',
    ringClass: 'ring-amber-500/20 bg-amber-500/10',
  },
  info: {
    icon: <Info className="w-6 h-6" />,
    confirmClass: 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-white/20',
    iconClass: 'text-white',
    ringClass: 'ring-white/20 bg-white/10',
  },
  success: {
    icon: <CheckCircle className="w-6 h-6" />,
    confirmClass: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500',
    iconClass: 'text-emerald-400',
    ringClass: 'ring-emerald-500/20 bg-emerald-500/10',
  },
};

/**
 * UX-001: Replaces native browser confirm() dialogs.
 * Provides a styled, accessible confirmation modal.
 *
 * Usage:
 *   const [showConfirm, setShowConfirm] = useState(false);
 *   <ConfirmModal
 *     isOpen={showConfirm}
 *     title="Excluir cliente?"
 *     message="Essa ação não pode ser desfeita."
 *     variant="danger"
 *     onConfirm={() => { deleteClient(); setShowConfirm(false); }}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cfg = variantConfig[variant];

  // Focus the confirm button when modal opens
  useEffect(() => {
    if (isOpen) setTimeout(() => confirmRef.current?.focus(), 50);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
      />

      {/* Modal panel */}
      <div className="relative bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2.5 rounded-xl ring-1 flex-shrink-0 ${cfg.ringClass} ${cfg.iconClass}`}>
            {cfg.icon}
          </div>
          <div>
            <h2 id="confirm-modal-title" className="text-lg font-black text-slate-100">
              {title}
            </h2>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-black text-white border rounded-xl transition-all shadow-lg ${cfg.confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
