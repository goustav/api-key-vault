import { useState, useEffect } from 'react';
import { X, User, Sparkles } from 'lucide-react';

type Props = {
  open: boolean;
  googleName: string | null;
  onSave: (username: string) => Promise<void>;
};

export default function WelcomeModal({ open, googleName, onSave }: Props) {
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setUsername(googleName ?? '');
      setError('');
    }
  }, [open, googleName]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }
    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(username.trim());
    } catch {
      setError('Failed to save username. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl animate-[scaleIn_0.25s_ease-out] sm:p-7"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 ring-1 ring-white/10">
            <Sparkles className="h-8 w-8 text-sky-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Welcome to your Vault!</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Let's personalize your experience. Choose a username to display across your vault.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Username / Display Name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="e.g. Alex Chen"
              autoFocus
              maxLength={30}
              className="w-full rounded-xl border border-white/10 bg-zinc-800 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-sky-400 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Get Started'}
        </button>
      </form>
    </div>
  );
}
