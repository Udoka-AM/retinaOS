import type { DiscoveryToken, FeedView } from "@/lib/data";
import { fmtUsd } from "@/lib/format";

/** Client-side alerts (v1). Rules live in localStorage and are evaluated in the
 *  browser while the Terminal is open. Always-on server-side delivery (email +
 *  push when the tab is closed) and cross-device persistence arrive with the
 *  indexer/backend phase — see docs/INDEXER.md. */

export type AlertKind = "token" | "wallet";

export interface TokenFilter {
  view: FeedView;
  minLiquidityUsd?: number;
  minVolume24hUsd?: number;
  minMarketCapUsd?: number;
  maxAgeHours?: number;
  minChange24hPct?: number;
  excludeHighRisk?: boolean;
}

export interface AlertRule {
  id: string;
  kind: AlertKind;
  label: string;
  createdAt: number;
  enabled: boolean;
  filter?: TokenFilter; // token
  walletAddress?: string; // wallet
  seen: string[]; // token: base addresses already notified; wallet: unused
  baseline?: number | null; // wallet: last known transfer count
}

export interface TriggeredAlert {
  id: string;
  ruleId: string;
  at: number;
  kind: AlertKind;
  title: string;
  detail: string;
  href: string;
}

const RULES_KEY = "retina.alerts.rules";
const LOG_KEY = "retina.alerts.log";
export const FREE_TIER_LIMIT = 3;
export const ALERTS_CHANGED = "retina:alerts-changed";

/* ---------- storage ---------- */

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(ALERTS_CHANGED));
}

export const getRules = (): AlertRule[] => read<AlertRule[]>(RULES_KEY, []);
export const saveRules = (rules: AlertRule[]) => write(RULES_KEY, rules);
export const getLog = (): TriggeredAlert[] => read<TriggeredAlert[]>(LOG_KEY, []);

export function addRule(rule: AlertRule) {
  saveRules([rule, ...getRules()]);
}
export function removeRule(id: string) {
  saveRules(getRules().filter((r) => r.id !== id));
}
export function toggleRule(id: string) {
  saveRules(getRules().map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
}
export function pushTriggered(t: TriggeredAlert) {
  const log = [t, ...getLog()].slice(0, 60);
  write(LOG_KEY, log);
}

/* ---------- matching ---------- */

export function tokenMatches(t: DiscoveryToken, f: TokenFilter): boolean {
  if (f.minLiquidityUsd && t.liquidityUsd < f.minLiquidityUsd) return false;
  if (f.minVolume24hUsd && t.volume24hUsd < f.minVolume24hUsd) return false;
  if (f.minMarketCapUsd && (t.marketCapUsd == null || t.marketCapUsd < f.minMarketCapUsd)) return false;
  if (f.maxAgeHours && (t.ageMs == null || t.ageMs > f.maxAgeHours * 3.6e6)) return false;
  if (f.minChange24hPct != null && t.priceChange.h24 < f.minChange24hPct) return false;
  if (f.excludeHighRisk && (t.risk.level === "high" || t.risk.level === "critical")) return false;
  return true;
}

const VIEW_LABEL: Record<FeedView, string> = { trending: "trending", new: "new", top: "top-volume" };

export function describeFilter(f: TokenFilter): string {
  const parts: string[] = [VIEW_LABEL[f.view]];
  if (f.maxAgeHours) parts.push(`< ${f.maxAgeHours}h old`);
  if (f.minLiquidityUsd) parts.push(`liq ≥ ${fmtUsd(f.minLiquidityUsd)}`);
  if (f.minVolume24hUsd) parts.push(`vol ≥ ${fmtUsd(f.minVolume24hUsd)}`);
  if (f.minMarketCapUsd) parts.push(`mcap ≥ ${fmtUsd(f.minMarketCapUsd)}`);
  if (f.minChange24hPct != null) parts.push(`24h ≥ +${f.minChange24hPct}%`);
  if (f.excludeHighRisk) parts.push("low risk only");
  return parts.join(" · ");
}

export const shortWallet = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
