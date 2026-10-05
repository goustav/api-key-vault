import { jsPDF } from 'jspdf';
import type { ProviderWithKeys } from '@/lib/supabase';
import { maskKey } from '@/lib/utils';

export type ExportFormat = 'md' | 'txt' | 'csv' | 'pdf';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportCSV(providers: ProviderWithKeys[]): string {
  let csv = `Provider,Account Label,Note,API Key,Dashboard URL,Pinned,Created At\n`;
  for (const p of providers) {
    for (const k of p.api_keys) {
      if (k.is_deleted) continue;
      csv += [
        escapeCSV(p.name),
        escapeCSV(k.account_label),
        escapeCSV(k.note ?? ''),
        escapeCSV(k.key_value),
        escapeCSV(p.dashboard_url ?? ''),
        p.is_pinned ? 'Yes' : 'No',
        k.created_at,
      ].join(',') + '\n';
    }
    if (p.api_keys.filter((k) => !k.is_deleted).length === 0) {
      csv += [
        escapeCSV(p.name),
        '',
        '',
        '',
        escapeCSV(p.dashboard_url ?? ''),
        p.is_pinned ? 'Yes' : 'No',
        p.created_at,
      ].join(',') + '\n';
    }
  }
  return csv;
}

function exportPDF(providers: ProviderWithKeys[], timestamp: string) {
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
    doc.text(title, margin, y);
    y += 6;

    if (p.dashboard_url) {
      doc.setFontSize(9);
      doc.setTextColor(14, 165, 233);
      doc.text(`Dashboard: ${p.dashboard_url}`, margin, y);
      y += 5;
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
        doc.text(`Account: ${k.account_label}`, margin + 5, y);
        y += 5;

        if (k.note) {
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Note: ${k.note}`, margin + 5, y);
          y += 4;
        }

        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const keyDisplay = maskKey(k.key_value);
        doc.text(`Key: ${keyDisplay}`, margin + 5, y);
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
  if (data.providers && Array.isArray(data.providers)) {
    return { providers: data.providers };
  }
  if (Array.isArray(data)) {
    return { providers: data };
  }
  return { providers: [] };
}
