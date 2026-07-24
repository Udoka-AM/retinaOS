import { getOhlcv, getTokenMarket, getTrades } from "./geckoterminal";
import { explorerTokenUrl, getTokenOnchain } from "./blockscout";
import { assessRisk } from "./risk";
import { fmtAge, fmtPct, fmtUsd } from "../format";
import type { TokenDetail, TokenOnchain } from "./types";

const EMPTY_ONCHAIN: TokenOnchain = {
  holders: null,
  transfers: null,
  totalSupply: null,
  decimals: 18,
  topHolders: [],
  concentrationTop10: null,
  reputation: null,
};

/** Deterministic, on-chain-grounded summary. This is the "summary above the
 *  fold" the docs describe; the conversational AI Analyst (which calls Claude)
 *  arrives in a later phase and will replace this string. */
function buildSummary(d: TokenDetail): string {
  const flow = d.txns24h.buys >= d.txns24h.sells ? "buy-led" : "sell-led";
  const conc =
    d.onchain.concentrationTop10 != null
      ? `, and the top 10 wallets hold ${d.onchain.concentrationTop10.toFixed(0)}% of supply`
      : "";
  const holders = d.onchain.holders != null ? ` across ${d.onchain.holders.toLocaleString()} holders` : "";
  const riskLine = d.risk.flags.length
    ? `Heuristic risk is ${d.risk.level} — ${d.risk.flags.slice(0, 2).join(", ").toLowerCase()}.`
    : `Heuristic risk is ${d.risk.level}.`;

  return (
    `${d.symbol} trades on ${d.dex} with ${fmtUsd(d.liquidityUsd)} liquidity and ` +
    `${fmtUsd(d.volume24hUsd)} of 24h volume (${fmtPct(d.priceChange.h24)} today)` +
    `${d.ageMs != null ? `, ${fmtAge(d.ageMs)} since launch` : ""}. ` +
    `Order flow is ${flow} (${d.txns24h.buys} buys / ${d.txns24h.sells} sells)${holders}${conc}. ` +
    riskLine
  );
}

export async function getTokenDetail(address: string): Promise<TokenDetail | null> {
  let market;
  try {
    market = await getTokenMarket(address);
  } catch {
    // transient upstream failure (e.g. rate limit) — degrade instead of crash
    return null;
  }
  if (!market || !market.poolAddress) return null;

  const [chart, trades, onchain] = await Promise.all([
    getOhlcv(market.poolAddress, "h1").catch(() => []),
    getTrades(market.poolAddress, 30).catch(() => []),
    getTokenOnchain(address).catch(() => EMPTY_ONCHAIN),
  ]);

  const risk = assessRisk({
    liquidityUsd: market.liquidityUsd,
    volume24hUsd: market.volume24hUsd,
    priceChange24h: market.priceChange.h24,
    ageMs: market.ageMs,
    buys: market.txns24h.buys,
    sells: market.txns24h.sells,
  });

  const detail: TokenDetail = {
    ...market,
    risk,
    onchain,
    chart,
    trades,
    explorerUrl: explorerTokenUrl(address),
    fetchedAt: new Date().toISOString(),
    summary: "",
  };
  detail.summary = buildSummary(detail);
  return detail;
}
