export function safeHttpUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

export function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}${'•'.repeat(Math.min(24, Math.max(8, key.length - 8)))}${key.slice(-4)}`;
}

export function timeAgo(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Copied ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Copied ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Copied ${days}d ago`;
  const months = Math.floor(days / 30);
  return `Copied ${months}mo ago`;
}
