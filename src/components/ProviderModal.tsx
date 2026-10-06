import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Provider } from '@/lib/supabase';

type Props = {
  open: boolean;
  provider: Provider | null;
  onSave: (name: string, dashboardUrl: string) => Promise<void>;
  onClose: () => void;
};

export default function ProviderModal({ open, provider, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(provider?.name ?? '');
      setDashboardUrl(provider?.dashboard_url ?? '');
    }
  }, [open, provider]);

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
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), dashboardUrl.trim());
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
          <h2 className="text-lg font-semibold text-white">
            {provider ? 'Edit Provider' : 'Add Provider'}
          </h2>
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
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Provider Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OpenAI, Stripe, AWS"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Dashboard URL <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              type="url"
              value={dashboardUrl}
              onChange={(e) => setDashboardUrl(e.target.value)}
              placeholder="https://platform.openai.com"
              className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
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
            disabled={saving || !name.trim()}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
          >
            {saving ? 'Saving...' : provider ? 'Save Changes' : 'Add Provider'}
          </button>
        </div>
      </form>
    </div>
  );
}
