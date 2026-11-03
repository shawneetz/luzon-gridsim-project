/*
 * format.ts
 * Small helpers that turn numbers into readable text for the tables
 * and summary boxes.
 */

// Number with commas and up to 4 decimals, e.g. 1,234.5
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

// Money with the peso sign and exactly 2 decimals, e.g. ₱1,149,843,800.00
export function formatPeso(n: number): string {
  return "₱" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
