import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import type { Toast as ToastType } from '@/hooks/useToast';

type Props = {
  toasts: ToastType[];
  onDismiss: (id: number) => void;
};

export default function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? XCircle : Info;
        const accent =
          toast.type === 'success'
            ? 'text-emerald-400'
            : toast.type === 'error'
            ? 'text-red-400'
            : 'text-sky-400';
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur-md animate-slideIn"
          >
            <Icon className={`h-5 w-5 shrink-0 ${accent}`} />
            <span className="text-sm text-zinc-100">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-2 text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
