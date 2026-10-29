export const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export const stockNumber = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
export const quantityLabel = (amount: number, unit: string) => `${stockNumber(amount)} ${unit}`;
export function localTime(date: string) { return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(date)); }
export function shortDate(date: string) { return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(date)); }
export function relativeTime(date: string) {
  const delta = Math.max(0, Date.now() - new Date(date).getTime());
  if (delta < 60_000) return 'Just now';
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  return shortDate(date);
}
export function isToday(date: string) { const d = new Date(date); const now = new Date(); return d.toDateString() === now.toDateString(); }
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function safeError(error: unknown): string { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
