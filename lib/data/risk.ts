import type { RiskAssessment } from "./types";

/** Heuristic risk proxy computed from feed-level DEX metrics. This is NOT
 *  Cortex — it exists so the Discovery Feed's risk column is meaningful on
 *  live data before the real reputation/risk engine (T4) lands. Tuned so the
 *  classic rug/wash pattern (huge volume on tiny liquidity) scores critical. */
export function assessRisk(input: {
  liquidityUsd: number;
  volume24hUsd: number;
  priceChange24h: number;
  ageMs: number | null;
  buys: number;
  sells: number;
}): RiskAssessment {
  const { liquidityUsd, volume24hUsd, priceChange24h, ageMs, buys, sells } = input;
  let score = 8;
  const flags: string[] = [];

  // Liquidity depth
  if (liquidityUsd < 1_000) {
    score += 46;
    flags.push("Negligible liquidity");
  } else if (liquidityUsd < 10_000) {
    score += 28;
    flags.push("Very low liquidity");
  } else if (liquidityUsd < 50_000) {
    score += 14;
    flags.push("Low liquidity");
  }

  // Volume ≫ liquidity → wash / churn signal
  const vlr = liquidityUsd > 0 ? volume24hUsd / liquidityUsd : Infinity;
  if (vlr > 500) {
    score += 34;
    flags.push("Volume ≫ liquidity (possible wash)");
  } else if (vlr > 100) {
    score += 18;
    flags.push("High volume/liquidity ratio");
  }

  // Freshness
  if (ageMs != null) {
    const hours = ageMs / 3.6e6;
    if (hours < 6) {
      score += 18;
      flags.push("Launched < 6h ago");
    } else if (hours < 24) {
      score += 8;
      flags.push("Launched < 24h ago");
    }
  }

  // Price collapse
  if (priceChange24h <= -80) {
    score += 22;
    flags.push("Price down ≥ 80% (24h)");
  } else if (priceChange24h <= -40) {
    score += 10;
  }

  // Sell pressure
  const total = buys + sells;
  if (total > 30 && sells > buys * 2) {
    score += 10;
    flags.push("Heavy sell pressure");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const level: RiskAssessment["level"] =
    score >= 75 ? "critical" : score >= 50 ? "high" : score >= 28 ? "medium" : "low";

  return { score, level, flags, heuristic: true };
}
