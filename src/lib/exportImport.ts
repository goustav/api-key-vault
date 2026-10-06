import type { ProviderWithKeys } from '@/lib/supabase';
import { maskKey, safeHttpUrl } from '@/lib/utils';

export type ExportFormat = 'md' | 'txt' | 'csv' | 'pdf';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportVault(providers: ProviderWithKeys[], format: ExportFormat) {
  const activeProviders = providers.filter((p) => !p.is_deleted);
  const timestamp = new Date().toISOString().split('T')[0];

  switch (format) {
    case 'md':
      downloadFile(exportMarkdown(activeProviders), `api-vault-${timestamp}.md`, 'text/markdown');
      break;
    case 'txt':
      downloadFile(exportText(activeProviders), `api-vault-${timestamp}.txt`, 'text/plain');
      break;
    case 'csv':
      downloadFile(exportCSV(activeProviders), `api-vault-${timestamp}.csv`, 'text/csv');
      break;
    case 'pdf':
      exportPDF(activeProviders, timestamp);
      break;
  }
}

function exportMarkdown(providers: ProviderWithKeys[]): string {
  let md = `# API Key Vault Export\n\n`;
  md += `Exported: ${new Date().toLocaleString()}\n\n`;
  md += `**Total Providers:** ${providers.length}\n\n`;
  md += `---\n\n`;

  for (const p of providers) {
    const pinIcon = p.is_pinned ? ' [PINNED]' : '';
    md += `## ${p.name}${pinIcon}\n\n`;
    if (p.dashboard_url) md += `**Dashboard:** [${p.dashboard_url}](${p.dashboard_url})\n\n`;
    if (p.api_keys.length === 0) {
      md += `*No keys stored.*\n\n`;
    } else {
      md += `| Account | Note | Key |\n`;
      md += `|---------|------|-----|\n`;
      for (const k of p.api_keys) {
        if (k.is_deleted) continue;
        md += `| ${k.account_label} | ${k.note ?? ''} | \`${k.key_value}\` |\n`;
      }
      md += `\n`;
    }
    md += `---\n\n`;
  }
  return md;
}

function exportText(providers: ProviderWithKeys[]): string {
  let txt = `API KEY VAULT EXPORT\n`;
  txt += `Exported: ${new Date().toLocaleString()}\n`;
  txt += `${'='.repeat(50)}\n\n`;

  for (const p of providers) {
    txt += `PROVIDER: ${p.name}${p.is_pinned ? ' [PINNED]' : ''}\n`;
    if (p.dashboard_url) txt += `Dashboard: ${p.dashboard_url}\n`;
    txt += `${'-'.repeat(40)}\n`;
    if (p.api_keys.length === 0) {
      txt += `  No keys stored.\n\n`;
    } else {
      for (const k of p.api_keys) {
        if (k.is_deleted) continue;
        txt += `  Account: ${k.account_label}\n`;
        if (k.note) txt += `  Note:    ${k.note}\n`;
        txt += `  Key:     ${k.key_value}\n`;
        txt += `\n`;
      }
    }
  }
  return txt;
}

function escapeCSVCell(value: string): string {
  let escaped = value;
  if (/^[=+\-@\t\r]/.test(escaped)) {
    escaped = `'${escaped}`;
  }
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped.replace(/"/g, '""')}"`;
  }
  return escaped;
}

function exportCSV(providers: ProviderWithKeys[]): string {
  let csv = `Provider,Account Label,Note,API Key,Dashboard URL,Pinned,Created At\n`;
  for (const p of providers) {
    for (const k of p.api_keys) {
      if (k.is_deleted) continue;
      csv += [
        escapeCSVCell(p.name),
        escapeCSVCell(k.account_label),
        escapeCSVCell(k.note ?? ''),
        escapeCSVCell(k.key_value),
        escapeCSVCell(p.dashboard_url ?? ''),
        p.is_pinned ? 'Yes' : 'No',
        k.created_at,
      ].join(',') + '\n';
    }
    if (p.api_keys.filter((k) => !k.is_deleted).length === 0) {
      csv += [
        escapeCSVCell(p.name),
        '',
        '',
        '',
        escapeCSVCell(p.dashboard_url ?? ''),
        p.is_pinned ? 'Yes' : 'No',
        p.created_at,
      ].join(',') + '\n';
    }
  }
  return csv;
}

async function exportPDF(providers: ProviderWithKeys[], timestamp: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('API Key Vault Export', margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
  y += 5;
  doc.text(`Total Providers: ${providers.length}`, margin, y);
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  for (const p of providers) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    const title = p.is_pinned ? `[PINNED] ${p.name}` : p.name;
    const titleLines = doc.splitTextToSize(title, contentWidth);
    doc.text(titleLines, margin, y);
    y += 6 * titleLines.length;

    if (p.dashboard_url) {
      doc.setFontSize(9);
      doc.setTextColor(14, 165, 233);
      const dashLines = doc.splitTextToSize(`Dashboard: ${p.dashboard_url}`, contentWidth);
      doc.text(dashLines, margin, y);
      y += 5 * dashLines.length;
    }

    if (p.api_keys.filter((k) => !k.is_deleted).length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('No keys stored.', margin, y);
      y += 8;
    } else {
      for (const k of p.api_keys) {
        if (k.is_deleted) continue;
        if (y > 275) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        const acctLines = doc.splitTextToSize(`Account: ${k.account_label}`, contentWidth - 5);
        doc.text(acctLines, margin + 5, y);
        y += 5 * acctLines.length;

        if (k.note) {
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          const noteLines = doc.splitTextToSize(`Note: ${k.note}`, contentWidth - 5);
          doc.text(noteLines, margin + 5, y);
          y += 4 * noteLines.length;
        }

        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const keyDisplay = maskKey(k.key_value);
        const keyLines = doc.splitTextToSize(`Key: ${keyDisplay}`, contentWidth - 5);
        doc.text(keyLines, margin + 5, y);
        y += 7;
      }
    }

    y += 3;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  }

  doc.save(`api-vault-${timestamp}.pdf`);
}

export type ImportedData = {
  providers: Array<{
    name: string;
    dashboard_url?: string;
    api_keys?: Array<{
      account_label: string;
      note?: string;
      key_value: string;
    }>;
  }>;
};

export function validateImportedData(data: unknown): data is ImportedData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.providers)) return false;
  for (const p of d.providers) {
    if (typeof p !== 'object' || p === null) return false;
    const prov = p as Record<string, unknown>;
    if (typeof prov.name !== 'string' || !prov.name.trim()) return false;
    if (prov.dashboard_url !== undefined && typeof prov.dashboard_url !== 'string') return false;
    if (prov.api_keys !== undefined && !Array.isArray(prov.api_keys)) return false;
    if (Array.isArray(prov.api_keys)) {
      for (const k of prov.api_keys) {
        if (typeof k !== 'object' || k === null) return false;
        const key = k as Record<string, unknown>;
        if (typeof key.account_label !== 'string' || !key.account_label.trim()) return false;
        if (typeof key.key_value !== 'string' || !key.key_value.trim()) return false;
        if (key.note !== undefined && typeof key.note !== 'string') return false;
      }
    }
  }
  return true;
}

export function sanitizeImportedData(data: ImportedData): ImportedData {
  const seenKeys = new Set<string>();
  const providers: ImportedData['providers'] = [];

  for (const p of data.providers) {
    const name = p.name.trim();
    if (!name) continue;

    const dashboardUrl = p.dashboard_url?.trim() || undefined;
    const safeUrl = dashboardUrl ? safeHttpUrl(dashboardUrl) : undefined;

    const uniqueKeys: NonNullable<typeof p.api_keys> = [];
    if (p.api_keys) {
      for (const k of p.api_keys) {
        const keyValue = k.key_value.trim();
        const label = k.account_label.trim();
        if (!keyValue || !label) continue;
        const dedupeKey = `${name}:${keyValue}`;
        if (seenKeys.has(dedupeKey)) continue;
        seenKeys.add(dedupeKey);
        uniqueKeys.push({
          account_label: label,
          note: k.note?.trim() || undefined,
          key_value: keyValue,
        });
      }
    }

    providers.push({
      name,
      dashboard_url: safeUrl ?? undefined,
      api_keys: uniqueKeys.length > 0 ? uniqueKeys : undefined,
    });
  }

  return { providers };
}

export function parseCSV(text: string): ImportedData {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return { providers: [] };

  const providers: ImportedData['providers'] = [];
  const providerMap = new Map<string, number>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 1) continue;

    const name = cols[0]?.trim() || 'Imported Provider';
    const accountLabel = cols[1]?.trim() || '';
    const note = cols[2]?.trim() || '';
    const keyValue = cols[3]?.trim() || '';
    const dashboardUrl = cols[4]?.trim() || '';

    if (!providerMap.has(name)) {
      providerMap.set(name, providers.length);
      providers.push({
        name,
        dashboard_url: dashboardUrl || undefined,
        api_keys: [],
      });
    }

    if (keyValue && accountLabel) {
      providers[providerMap.get(name)!].api_keys!.push({
        account_label: accountLabel,
        note: note || undefined,
        key_value: keyValue,
      });
    }
  }

  return { providers };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseJSON(text: string): ImportedData {
  const data = JSON.parse(text);
  if (!validateImportedData(data)) {
    throw new Error('Invalid JSON schema: expected { providers: [...] } or an array of providers');
  }
  if (data.providers && Array.isArray(data.providers)) {
    return sanitizeImportedData(data);
  }
  if (Array.isArray(data)) {
    return sanitizeImportedData({ providers: data });
  }
  return { providers: [] };
}
