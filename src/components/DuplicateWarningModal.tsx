import { AlertTriangle } from 'lucide-react';

type Props = {
  open: boolean;
  existingProvider: string | null;
  onForceSave: () => void;
  onCancel: () => void;
};

export default function DuplicateWarningModal({
  open,
  existingProvider,
  onForceSave,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-amber-500/20 bg-zinc-900 p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Duplicate Key Detected</h2>
            <p className="mt-1 text-sm text-zinc-400">
              This API key already exists in your vault
              {existingProvider ? (
                <> under <span className="font-medium text-amber-400">{existingProvider}</span></>
              ) : null}. Are you sure you want to save it again?
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={onForceSave}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-400"
          >
            Save Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
