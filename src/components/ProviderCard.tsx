import { useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Pin,
  PinOff,
  Zap,
  Code,
  Clock,
} from 'lucide-react';
import type { ProviderWithKeys, ApiKey } from '@/lib/supabase';
import type { PingResult } from '@/lib/ping';
import { maskKey, timeAgo, safeHttpUrl } from '@/lib/utils';

type Props = {
  provider: ProviderWithKeys;
  onEditProvider: () => void;
  onSoftDeleteProvider: () => void;
  onTogglePin: () => void;
  onAddKey: () => void;
  onEditKey: (keyId: string) => void;
  onSoftDeleteKey: (keyId: string) => void;
  onCopyKey: (keyId: string, keyValue: string) => void;
  onPingKey: (key: ApiKey) => void;
  onShowCode: (key: ApiKey) => void;
  pingResults: Record<string, PingResult | 'loading'>;
};

export default function ProviderCard({
  provider,
  onEditProvider,
  onSoftDeleteProvider,
  onTogglePin,
  onAddKey,
  onEditKey,
  onSoftDeleteKey,
  onCopyKey,
  onPingKey,
  onShowCode,
  pingResults,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const toggleReveal = (keyId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  };

  const rawUrl = provider.dashboard_url?.trim() ?? '';
  const safeUrl = rawUrl ? safeHttpUrl(rawUrl) : null;
  const hasUrl = safeUrl !== null;
  const activeKeys = provider.api_keys.filter((k) => !k.is_deleted);

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-zinc-900/50 transition-colors hover:border-white/15 ${
        provider.is_pinned ? 'border-sky-500/30 ring-1 ring-sky-500/10' : 'border-white/10'
      }`}
    >
      {/* Collapsed header */}
      <div className="flex items-center gap-2 px-3 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left sm:gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-emerald-500/10 ring-1 ring-white/10">
            <KeyRound className="h-5 w-5 text-sky-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-white">{provider.name}</h3>
              {provider.is_pinned && (
                <Pin className="h-3.5 w-3.5 shrink-0 fill-sky-400 text-sky-400" />
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {activeKeys.length} key{activeKeys.length !== 1 ? 's' : ''}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            onClick={onTogglePin}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors active:scale-95 ${
              provider.is_pinned
                ? 'text-sky-400 hover:bg-sky-500/10'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-sky-400'
            }`}
            title={provider.is_pinned ? 'Unpin' : 'Pin to top'}
            aria-label={provider.is_pinned ? 'Unpin' : 'Pin to top'}
          >
            {provider.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </button>
          {hasUrl && (
            <a
              href={safeUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-sky-400"
              title="Open dashboard"
              aria-label="Open dashboard"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={onEditProvider}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-sky-400"
            title="Edit provider"
            aria-label="Edit provider"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onSoftDeleteProvider}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
            title="Move to trash"
            aria-label="Move to trash"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title={expanded ? 'Collapse' : 'Expand'}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded content — CSS grid smooth expansion */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/5 px-3 pb-4 pt-3 sm:px-5">
            {hasUrl && (
              <div className="mb-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Dashboard Link
                </p>
                <a
                  href={safeUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-sm text-sky-400 transition-colors hover:text-sky-300"
                >
                  <span className="truncate">{safeUrl}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            )}

            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              API Keys
            </p>

            {activeKeys.length === 0 ? (
              <p className="py-3 text-sm text-zinc-600">No keys stored yet.</p>
            ) : (
              <div className="space-y-2">
                {activeKeys.map((apiKey) => {
                  const revealed = revealedKeys.has(apiKey.id);
                  const pingState = pingResults[apiKey.id];
                  return (
                    <div
                      key={apiKey.id}
                      className="rounded-xl border border-white/5 bg-zinc-800/50 p-3 sm:p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-zinc-100">
                              {apiKey.account_label}
                            </span>
                            {apiKey.note && (
                              <span className="rounded-md bg-zinc-700/60 px-2 py-0.5 text-[11px] text-zinc-400">
                                {apiKey.note}
                              </span>
                            )}
                            {pingState && pingState !== 'loading' && (
                              <PingBadge result={pingState} />
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <code className="block truncate font-mono text-xs text-zinc-400">
                              {revealed ? apiKey.key_value : maskKey(apiKey.key_value)}
                            </code>
                            <button
                              onClick={() => toggleReveal(apiKey.id)}
                              className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
                              title={revealed ? 'Hide' : 'Reveal'}
                            >
                              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {apiKey.last_used_at && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-600">
                              <Clock className="h-3 w-3" />
                              {timeAgo(apiKey.last_used_at)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => onCopyKey(apiKey.id, apiKey.key_value)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white active:scale-95"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </button>
                        <button
                          onClick={() => onPingKey(apiKey)}
                          disabled={pingState === 'loading'}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-emerald-400 active:scale-95 disabled:opacity-50"
                        >
                          <Zap className={`h-3.5 w-3.5 ${pingState === 'loading' ? 'animate-pulse' : ''}`} />
                          {pingState === 'loading' ? 'Pinging...' : 'Ping'}
                        </button>
                        <button
                          onClick={() => onShowCode(apiKey)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-sky-400 active:scale-95"
                        >
                          <Code className="h-3.5 w-3.5" />
                          Code
                        </button>
                        <button
                          onClick={() => onEditKey(apiKey.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-sky-400 active:scale-95"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => onSoftDeleteKey(apiKey.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-red-400 active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={onAddKey}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-sky-500/30 hover:text-sky-400 active:scale-[0.98] sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PingBadge({ result }: { result: PingResult }) {
  const config = {
    ok: { color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
    invalid: { color: 'bg-red-500/15 text-red-400', dot: 'bg-red-400' },
    network: { color: 'bg-amber-500/15 text-amber-400', dot: 'bg-amber-400' },
    'rate-limited': { color: 'bg-amber-500/15 text-amber-400', dot: 'bg-amber-400' },
  };
  const c = config[result.status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${c.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {result.statusCode ? `${result.statusCode}` : ''} {result.message}
    </span>
  );
}
