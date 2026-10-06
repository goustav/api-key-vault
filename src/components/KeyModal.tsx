import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import type { ApiKey } from '@/lib/supabase';

type Props = {
  open: boolean;
  keyData: ApiKey | null;
  providerName: string;
  onSave: (accountLabel: string, note: string, keyValue: string) => Promise<void>;
  onClose: () => void;
};

export default function KeyModal({ open, keyData, providerName, onSave, onClose }: Props) {
  const [accountLabel, setAccountLabel] = useState('');
  const [note, setNote] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [revealKey, setRevealKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAccountLabel(keyData?.account_label ?? '');
      setNote(keyData?.note ?? '');
      setKeyValue(keyData?.key_value ?? '');
    }
  }, [open, keyData]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountLabel.trim() || !keyValue.trim()) return;
    setSaving(true);
    await onSave(accountLabel.trim(), note.trim(), keyValue.trim());
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl animate-scaleIn"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {keyData ? 'Edit Key' : 'Add Key'}
            </h2>
            <p className="text-xs text-zinc-500">{providerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Account Label</label>
            <input
              type="text"
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              placeholder="e.g. Work account, Personal"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Quota / Balance Note <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. free tier, $50 credit, expires Dec 2026"
              className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">API Key</label>
            <div className="relative">
              <input
                type={revealKey ? 'text' : 'password'}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="off"
                className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 pr-11 font-mono text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="button"
                onClick={() => setRevealKey(!revealKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                title={revealKey ? 'Hide' : 'Reveal'}
              >
                {revealKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !accountLabel.trim() || !keyValue.trim()}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
          >
            {saving ? 'Saving...' : keyData ? 'Save Changes' : 'Add Key'}
          </button>
        </div>
      </form>
    </div>
  );
}
