import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileJson, FileSpreadsheet } from 'lucide-react';
import type { ImportedData } from '@/lib/exportImport';
import { parseCSV, parseJSON } from '@/lib/exportImport';

type Props = {
  open: boolean;
  onImport: (data: ImportedData) => Promise<void>;
  onClose: () => void;
};

export default function ImportModal({ open, onImport, onClose }: Props) {
  const [parsedData, setParsedData] = useState<ImportedData | null>(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setParsedData(null);
      setFileName('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    try {
      const text = await file.text();
      let data: ImportedData;
      if (file.name.endsWith('.json')) {
        data = parseJSON(text);
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else {
        setError('Please upload a .csv or .json file.');
        return;
      }

      if (!data.providers || data.providers.length === 0) {
        setError('No providers found in the file.');
        return;
      }
      setParsedData(data);
    } catch {
      setError('Failed to parse file. Please check the format.');
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setImporting(true);
    try {
      await onImport(parsedData);
      onClose();
    } catch {
      setError('Failed to import. Please try again.');
    }
    setImporting(false);
  };

  const totalKeys = parsedData?.providers.reduce((sum, p) => sum + (p.api_keys?.length ?? 0), 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Import Backup</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 py-10 transition-colors hover:border-sky-500/30"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
            <Upload className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-300">
            {fileName || 'Click to select a file'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Supports .csv and .json files</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-zinc-600">
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
            </span>
            <span className="flex items-center gap-1">
              <FileJson className="h-3.5 w-3.5" /> JSON
            </span>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFile}
          className="hidden"
        />

        {parsedData && (
          <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
            <p className="text-sm text-zinc-200">
              Ready to import: <span className="font-semibold text-sky-400">{parsedData.providers.length}</span> providers,{' '}
              <span className="font-semibold text-sky-400">{totalKeys}</span> keys
            </p>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!parsedData || importing}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
