import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Lock,
  LogOut,
  KeyRound,
  Trash2,
  Download,
  Upload,
  ChevronDown,
  FileText,
  FileType,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import type { ExportFormat } from '@/lib/exportImport';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onAddProvider: () => void;
  onLock: () => void;
  onSignOut: () => void;
  onOpenTrash: () => void;
  onExport: (format: ExportFormat) => void;
  onImport: () => void;
  trashCount: number;
  username: string;
  avatarUrl: string | null;
};

export default function Header({
  search,
  onSearchChange,
  onAddProvider,
  onLock,
  onSignOut,
  onOpenTrash,
  onExport,
  onImport,
  trashCount,
  username,
  avatarUrl,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportFormats: { format: ExportFormat; label: string; icon: typeof FileText }[] = [
    { format: 'md', label: 'Markdown (.md)', icon: FileText },
    { format: 'txt', label: 'Text (.txt)', icon: FileType },
    { format: 'csv', label: 'CSV (.csv)', icon: FileSpreadsheet },
    { format: 'pdf', label: 'PDF (.pdf)', icon: File },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 ring-1 ring-white/10">
            <KeyRound className="h-5 w-5 text-sky-400" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold leading-tight text-white">API Key Vault</h1>
            <p className="text-xs text-zinc-500">{username}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search providers..."
            className="w-full rounded-xl border border-white/10 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        {/* Export dropdown — works on both desktop and mobile */}
        <div ref={exportRef} className="relative shrink-0">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-400 transition-all duration-150 hover:border-white/20 hover:text-zinc-200 active:scale-95"
            title="Export / Import"
            aria-label="Export / Import"
          >
            <Download className="h-[18px] w-[18px]" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-white/10 bg-zinc-900 py-2 shadow-2xl">
              <p className="px-3 pb-1.5 pt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Export Format
              </p>
              {exportFormats.map(({ format, label, icon: Icon }) => (
                <button
                  key={format}
                  onClick={() => {
                    onExport(format);
                    setExportOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-zinc-500" />
                  {label}
                </button>
              ))}
              <div className="my-1 border-t border-white/5" />
              <button
                onClick={() => {
                  onImport();
                  setExportOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <Upload className="h-4 w-4 text-zinc-500" />
                Import Backup
              </button>
            </div>
          )}
        </div>

        {/* Add provider */}
        <button
          onClick={onAddProvider}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white transition-all duration-150 hover:bg-sky-400 active:scale-95"
          title="Add Provider"
          aria-label="Add Provider"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Trash */}
        <button
          onClick={onOpenTrash}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-400 transition-all duration-150 hover:border-white/20 hover:text-zinc-200 active:scale-95"
          title="Trash"
          aria-label="Trash"
        >
          <Trash2 className="h-[18px] w-[18px]" />
          {trashCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {trashCount > 99 ? '99+' : trashCount}
            </span>
          )}
        </button>

        {/* User avatar + menu */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 p-1 pr-1.5 transition-all duration-150 hover:border-white/20 active:scale-95"
            aria-label="User menu"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="h-8 w-8 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 text-xs font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <ChevronDown className="hidden h-4 w-4 text-zinc-500 sm:block" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 rounded-xl border border-white/10 bg-zinc-900 py-2 shadow-2xl">
              <div className="border-b border-white/5 px-3 py-2">
                <p className="truncate text-sm font-medium text-white">{username}</p>
                <p className="truncate text-xs text-zinc-500">Signed in with Google</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLock();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <Lock className="h-4 w-4 text-zinc-500" />
                Lock Vault
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-red-400"
              >
                <LogOut className="h-4 w-4 text-zinc-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
