/** Display formatters for the Terminal. All numeric output uses tabular
 *  figures at the component level to keep live-updating columns from shifting. */

function compact(abs: number, prefix: string): string {
  if (abs >= 1e9) return `${prefix}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${prefix}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${prefix}${(abs / 1e3).toFixed(1)}K`;
  return `${prefix}${abs.toFixed(0)}`;
}

export function fmtUsd(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return sign + compact(Math.abs(n), "$");
}

export function fmtPrice(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n === 0) return "$0";
  if (n >= 1) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 0.01) return "$" + n.toFixed(4);
  return "$" + n.toPrecision(3);
}

export function fmtNum(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
  if (abs >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (abs > 0) return n.toPrecision(3);
  return "0";
}

export function fmtPct(n: number): string {
  if (n == null || Number.isNaN(n)) return "—";
  const digits = n <= -100 || n >= 1000 ? 0 : 1;
  return (n > 0 ? "+" : "") + n.toFixed(digits) + "%";
}

export function fmtAge(ms: number | null): string {
  if (ms == null) return "—";
  const s = ms / 1000;
  const m = s / 60;
  const h = m / 60;
  const d = h / 24;
  if (d >= 1) return `${Math.floor(d)}d`;
  if (h >= 1) return `${Math.floor(h)}h`;
  if (m >= 1) return `${Math.floor(m)}m`;
  return `${Math.max(0, Math.floor(s))}s`;
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
