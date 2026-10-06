import { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { generateSnippet, type SnippetLanguage } from '@/lib/codeSnippets';

type Props = {
  open: boolean;
  apiKey: string;
  providerName: string;
  onClose: () => void;
};

const LANGUAGES: { key: SnippetLanguage; label: string }[] = [
  { key: 'python', label: 'Python' },
  { key: 'javascript', label: 'Node.js' },
  { key: 'curl', label: 'cURL' },
];

export default function CodeSnippetModal({ open, apiKey, providerName, onClose }: Props) {
  const [lang, setLang] = useState<SnippetLanguage>('python');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const code = generateSnippet(lang, apiKey, providerName);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Code Snippet</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-white/5 px-4 py-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.key}
              onClick={() => setLang(l.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                lang === l.key
                  ? 'bg-sky-500/15 text-sky-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {l.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="max-h-[400px] overflow-auto bg-zinc-950/50 p-5">
          <pre className="text-sm leading-relaxed text-zinc-200">
            <code className="font-mono">{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
