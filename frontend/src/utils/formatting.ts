export function formatCurrency(n: number): string {
  if (!n) return '$0'
  return '$' + n.toLocaleString('en-US')
}

export function formatNumber(n: number): string {
  if (!n) return '0'
  return n.toLocaleString('en-US')
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024)            return `${bytes} B`
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
