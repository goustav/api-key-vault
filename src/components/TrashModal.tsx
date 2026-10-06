import { useEffect } from 'react';
import { X, RotateCcw, Trash2, KeyRound } from 'lucide-react';
import type { ProviderWithKeys } from '@/lib/supabase';

type Props = {
  open: boolean;
  providers: ProviderWithKeys[];
  onRestoreProvider: (id: string) => void;
  onDeleteForeverProvider: (id: string) => void;
  onRestoreKey: (providerId: string, keyId: string) => void;
  onDeleteForeverKey: (providerId: string, keyId: string) => void;
  onEmptyTrash: () => void;
  onClose: () => void;
};

export default function TrashModal({
  open,
  providers,
  onRestoreProvider,
  onDeleteForeverProvider,
  onRestoreKey,
  onDeleteForeverKey,
  onEmptyTrash,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const trashedProviders = providers.filter((p) => p.is_deleted);
  const trashedKeys = providers.flatMap((p) =>
    p.api_keys.filter((k) => k.is_deleted).map((k) => ({ provider: p, key: k }))
  );
  const totalItems = trashedProviders.length + trashedKeys.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
              <Trash2 className="h-[18px] w-[18px]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Recycle Bin</h2>
              <p className="text-xs text-zinc-500">{totalItems} item{totalItems !== 1 ? 's' : ''} in trash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/50">
                <Trash2 className="h-7 w-7 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-400">Trash is empty</p>
              <p className="mt-1 text-xs text-zinc-600">Deleted items will appear here for recovery.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Trashed providers */}
              {trashedProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="rounded-xl border border-white/5 bg-zinc-800/40 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500">
                      <KeyRound className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-zinc-300">{provider.name}</h3>
                      <p className="text-xs text-zinc-600">Provider</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => onRestoreProvider(provider.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-zinc-700"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        onClick={() => onDeleteForeverProvider(provider.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-zinc-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Forever
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Trashed keys */}
              {trashedKeys.map(({ provider, key }) => (
                <div
                  key={key.id}
                  className="rounded-xl border border-white/5 bg-zinc-800/40 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-zinc-300">{key.account_label}</h3>
                      <p className="truncate text-xs text-zinc-600">
                        Key in {provider.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => onRestoreKey(provider.id, key.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-zinc-700"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        onClick={() => onDeleteForeverKey(provider.id, key.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-zinc-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Forever
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — single Empty Trash button, confirmation handled by App's ConfirmDialog */}
        {totalItems > 0 && (
          <div className="border-t border-white/10 px-5 py-4">
            <button
              onClick={onEmptyTrash}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Empty Trash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
