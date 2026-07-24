/** Domain models for the Retina Terminal. Provider-agnostic: adapters map
 *  raw upstream payloads (GeckoTerminal, Blockscout, …) into these shapes so
 *  the UI never touches a vendor response directly. */

export type FeedView = "trending" | "new" | "top";

export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Heuristic risk assessment — a lightweight stand-in until Cortex scoring
 *  (T4) computes real reputation/risk. `heuristic: true` flags it as such. */
export interface RiskAssessment {
  score: number; // 0–100, higher = riskier
  level: RiskLevel;
  flags: string[];
  heuristic: true;
}

export interface DiscoveryToken {
  id: string;
  symbol: string;
  name: string;
  address: string; // base token contract
  poolAddress: string;
  dex: string;
  logoUrl: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null; // market cap, falling back to FDV
  fdvUsd: number | null;
  volume24hUsd: number;
  liquidityUsd: number;
  priceChange: { h1: number; h6: number; h24: number };
  txns24h: { buys: number; sells: number; buyers: number; sellers: number };
  createdAt: string | null; // ISO
  ageMs: number | null;
  quoteSymbol: string;
  risk: RiskAssessment;
}

export interface DiscoveryFeedResult {
  tokens: DiscoveryToken[];
  view: FeedView;
  fetchedAt: string; // ISO
  network: string;
  source: "geckoterminal";
}

/* ---------- token detail ---------- */

export type OhlcvTimeframe = "m5" | "h1" | "d1";

export interface OhlcvPoint {
  t: number; // unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Holder {
  address: string;
  balance: number;
  pct: number | null; // % of total supply
  isContract: boolean;
  label: string | null; // Blockscout entity tag, e.g. "PoolManager"
}

export interface Trade {
  ts: number; // unix seconds
  kind: "buy" | "sell";
  amountUsd: number;
  priceUsd: number | null;
  wallet: string;
  txHash: string;
}

export interface TokenOnchain {
  holders: number | null;
  transfers: number | null;
  totalSupply: number | null;
  decimals: number;
  topHolders: Holder[];
  concentrationTop10: number | null; // % of supply held by top 10
  reputation: string | null;
}

export interface TokenDetail {
  address: string;
  poolAddress: string;
  symbol: string;
  name: string;
  dex: string;
  logoUrl: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number;
  liquidityUsd: number;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  txns24h: { buys: number; sells: number; buyers: number; sellers: number };
  createdAt: string | null;
  ageMs: number | null;
  quoteSymbol: string;
  risk: RiskAssessment;
  onchain: TokenOnchain;
  chart: OhlcvPoint[];
  trades: Trade[];
  summary: string;
  explorerUrl: string;
  fetchedAt: string;
}
