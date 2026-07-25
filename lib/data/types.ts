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

/* ---------- Cortex scoring ---------- */

export type CortexGrade = "A" | "B" | "C" | "D" | "F";

export interface CortexSub {
  label: string;
  score: number; // 0–100
  hint: string;
}

/** Token risk — higher = riskier (matches the docs' 0–100 token risk). */
export interface CortexTokenScore {
  score: number;
  grade: CortexGrade;
  level: RiskLevel;
  subs: CortexSub[]; // concentration · liquidity · trading
  flags: string[];
}

/** Wallet reputation — higher = better. */
export interface CortexWalletScore {
  score: number;
  grade: CortexGrade;
  tags: string[]; // behavioral classification
  subs: CortexSub[]; // activity · diversification · standing
  flags: string[];
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

/* ---------- wallet profile ---------- */

export interface Holding {
  address: string;
  symbol: string;
  name: string;
  logoUrl: string | null;
  balance: number;
  priceUsd: number | null;
  valueUsd: number | null;
}

export interface WalletTx {
  hash: string;
  ts: number; // unix seconds
  direction: "in" | "out" | "self";
  counterparty: string;
  tokenSymbol: string | null;
  amount: number | null;
}

export interface WalletProfile {
  address: string;
  isContract: boolean;
  label: string | null;
  nativeBalance: number;
  nativeSymbol: string;
  nativePriceUsd: number | null;
  nativeValueUsd: number | null;
  portfolioValueUsd: number | null;
  txCount: number | null;
  transferCount: number | null;
  holdings: Holding[];
  recent: WalletTx[];
  reputation: string | null;
  cortex: CortexWalletScore;
  explorerUrl: string;
  summary: string;
  fetchedAt: string;
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
  cortex: CortexTokenScore;
  onchain: TokenOnchain;
  chart: OhlcvPoint[];
  trades: Trade[];
  summary: string;
  explorerUrl: string;
  fetchedAt: string;
}
