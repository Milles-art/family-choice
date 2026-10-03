export function formatTzs(amount: number): string {
  return `TSh ${Math.round(amount).toLocaleString('en-TZ')}`;
}
