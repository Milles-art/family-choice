export function formatTzs(amount: number): string {
  return `TSh ${amount.toLocaleString('en-TZ', { maximumFractionDigits: 2 })}`;
}
