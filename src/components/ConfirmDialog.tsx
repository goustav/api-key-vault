import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = true,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              destructive ? 'bg-red-500/15 text-red-400' : 'bg-sky-500/15 text-sky-400'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
              destructive ? 'bg-red-500 hover:bg-red-400' : 'bg-sky-500 hover:bg-sky-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
