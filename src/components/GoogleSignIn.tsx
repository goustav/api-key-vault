import { KeyRound } from 'lucide-react';

type Props = {
  onSignIn: () => void;
  loading?: boolean;
};

export default function GoogleSignIn({ onSignIn, loading }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 ring-1 ring-white/10">
          <KeyRound className="h-9 w-9 text-sky-400" />
        </div>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white">API Key Vault</h1>
        <p className="mb-10 max-w-xs text-center text-sm text-zinc-500">
          Securely store, manage, and test your API keys. Your data is private and isolated.
        </p>

        <button
          onClick={onSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-zinc-900 py-3.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 hover:border-white/20 active:scale-[0.98] disabled:opacity-50"
        >
          <GoogleIcon />
          {loading ? 'Connecting...' : 'Sign in with Google'}
        </button>

        <p className="mt-8 max-w-xs text-center text-xs text-zinc-600">
          By signing in, your vault is encrypted and only accessible to you.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
