import type {
  CortexGrade,
  CortexSub,
  CortexTokenScore,
  CortexWalletScore,
  RiskLevel,
} from "./types";

/** Cortex — RetinaOS's scoring engine. This is the real multi-signal model
 *  that replaces the feed-level heuristic on detail pages. It scores from what
 *  the keyless indexers expose (GeckoTerminal market + Blockscout holders /
 *  activity). Signals that need full historical trade reconstruction — true
 *  win-rate PnL, entry-timing, and sybil-graph clustering — are noted as
 *  pending the dedicated indexer phase rather than faked. */

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function tokenGrade(score: number): CortexGrade {
  // token score = risk, so lower is better
  if (score < 20) return "A";
  if (score < 40) return "B";
  if (score < 60) return "C";
  if (score < 80) return "D";
  return "F";
}
function tokenLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 28) return "medium";
  return "low";
}
function walletGrade(score: number): CortexGrade {
  // wallet score = reputation, higher is better
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

/* ---------------- token risk ---------------- */

export function scoreToken(input: {
  liquidityUsd: number;
  volume24hUsd: number;
  priceChange24h: number;
  ageMs: number | null;
  buys: number;
  sells: number;
  concentrationTop10: number | null;
  holders: number | null;
}): CortexTokenScore {
  const { liquidityUsd, volume24hUsd, priceChange24h, ageMs, buys, sells, concentrationTop10, holders } =
    input;
  const flags: string[] = [];

  // 1) Ownership concentration
  let concentration: number;
  if (concentrationTop10 == null) {
    concentration = 42; // unknown → neutral-cautious
  } else {
    concentration = clamp(concentrationTop10 * 1.35);
    if (concentrationTop10 >= 50) flags.push("Concentrated ownership (top 10 > 50%)");
  }
  if (holders != null && holders < 50) flags.push("Very few holders");

  // 2) Liquidity depth
  let liquidity: number;
  if (liquidityUsd < 1_000) {
    liquidity = 95;
    flags.push("Negligible liquidity");
  } else if (liquidityUsd < 10_000) {
    liquidity = 78;
    flags.push("Very low liquidity");
  } else if (liquidityUsd < 50_000) {
    liquidity = 52;
    flags.push("Low liquidity");
  } else if (liquidityUsd < 250_000) {
    liquidity = 32;
  } else if (liquidityUsd < 1_000_000) {
    liquidity = 20;
  } else {
    liquidity = 10;
  }

  // 3) Trading integrity (wash / churn / dump)
  const vlr = liquidityUsd > 0 ? volume24hUsd / liquidityUsd : Infinity;
  let trading: number;
  if (vlr > 500) {
    trading = 92;
    flags.push("Volume ≫ liquidity — likely wash trading");
  } else if (vlr > 100) {
    trading = 68;
    flags.push("Elevated volume/liquidity ratio");
  } else if (vlr > 30) {
    trading = 44;
  } else if (vlr > 5) {
    trading = 26;
  } else {
    trading = 14;
  }
  const total = buys + sells;
  if (total > 40 && sells > buys * 1.8) {
    trading = clamp(trading + 12);
    flags.push("Smart-money / holders exiting (sell-dominant flow)");
  }
  if (priceChange24h <= -80) {
    trading = clamp(trading + 12);
    flags.push("Price collapse — possible liquidity pull");
  }
  if (ageMs != null && ageMs < 24 * 3.6e6) flags.push("Fresh launch (< 24h)");

  const score = clamp(concentration * 0.34 + liquidity * 0.36 + trading * 0.3);

  const subs: CortexSub[] = [
    { label: "Concentration", score: concentration, hint: "Top-holder ownership" },
    { label: "Liquidity", score: liquidity, hint: "Depth of the pool" },
    { label: "Trading", score: trading, hint: "Wash / dump signals" },
  ];

  return { score, grade: tokenGrade(score), level: tokenLevel(score), subs, flags };
}

/* ---------------- wallet reputation ---------------- */

export function scoreWallet(input: {
  portfolioValueUsd: number | null;
  holdingsCount: number;
  txCount: number | null;
  transferCount: number | null;
  isContract: boolean;
  reputation: string | null;
}): CortexWalletScore {
  const { portfolioValueUsd, holdingsCount, txCount, transferCount, isContract, reputation } = input;
  const flags: string[] = [];
  const tags: string[] = [];

  const scam = reputation != null && /scam|malicious|phish/i.test(reputation);

  // 1) Activity / track record
  const tx = txCount ?? 0;
  let activity: number;
  if (tx >= 2000) activity = 90;
  else if (tx >= 500) activity = 80;
  else if (tx >= 100) activity = 66;
  else if (tx >= 20) activity = 48;
  else if (tx >= 1) activity = 30;
  else activity = 12;

  // 2) Diversification
  let diversification: number;
  if (holdingsCount >= 20) diversification = 88;
  else if (holdingsCount >= 11) diversification = 78;
  else if (holdingsCount >= 4) diversification = 60;
  else if (holdingsCount >= 1) diversification = 38;
  else diversification = 12;

  // 3) Standing (capital at stake)
  const pv = portfolioValueUsd ?? 0;
  let standing: number;
  if (pv >= 1_000_000) standing = 95;
  else if (pv >= 100_000) standing = 84;
  else if (pv >= 10_000) standing = 66;
  else if (pv >= 1_000) standing = 46;
  else if (pv > 0) standing = 26;
  else standing = 14;

  let score = clamp(activity * 0.34 + diversification * 0.3 + standing * 0.36);

  // classification (heuristic — Early Mover / entry-timing tags need the indexer)
  if (isContract) tags.push("Contract");
  if (scam) tags.push("Flagged");
  if (pv >= 100_000) tags.push("Whale");
  const transfers = transferCount ?? 0;
  if (transfers > 10_000 || (tx > 0 && transfers / Math.max(tx, 1) > 40)) tags.push("Bot-like");
  else if (tx >= 500) tags.push("Active trader");
  if (holdingsCount >= 12) tags.push("Diversified");
  if (tx > 0 && tx < 20 && holdingsCount >= 3) tags.push("Long-term holder");
  if (tx < 5 && holdingsCount < 2) tags.push("New / dormant");
  if (tags.length === 0) tags.push("Retail");

  if (scam) {
    score = Math.min(score, 15);
    flags.push("Address flagged by explorer reputation");
  }
  if (tx === 0) flags.push("No transaction history");

  const subs: CortexSub[] = [
    { label: "Activity", score: activity, hint: "Transaction track record" },
    { label: "Diversification", score: diversification, hint: "Breadth of holdings" },
    { label: "Standing", score: standing, hint: "Capital at stake" },
  ];

  return { score, grade: walletGrade(score), tags: tags.slice(0, 4), subs, flags };
}
