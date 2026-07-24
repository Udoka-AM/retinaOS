import { assessRisk } from "./risk";
import type {
  DiscoveryFeedResult,
  DiscoveryToken,
  FeedView,
  OhlcvPoint,
  OhlcvTimeframe,
  Trade,
} from "./types";

/** GeckoTerminal adapter — free, keyless public API (~30 req/min).
 *  Upstream calls are gated by Next's Data Cache (`revalidate`), so the number
 *  of viewers or client poll frequency never changes how often we hit upstream.
 *  Budget: PAGES fetches per REVALIDATE window → keep PAGES * (60/REVALIDATE)
 *  comfortably under 30/min. */

const BASE = "https://api.geckoterminal.com/api/v2";
const NETWORK = "robinhood"; // Robinhood Chain (chain id 4663)
const REVALIDATE = 5; // seconds between upstream refreshes per page
const PAGES = 2; // pools pages to merge (20 each) → ~40 tokens
// 2 pages / 5s = 24 upstream req/min — inside the free-tier ceiling.

interface GTPool {
  id: string;
  attributes: Record<string, any>;
  relationships?: Record<string, any>;
}
interface GTIncluded {
  id: string;
  type: string;
  attributes: Record<string, any>;
}

const VIEW_PATH: Record<FeedView, (page: number) => string> = {
  trending: (p) =>
    `/networks/${NETWORK}/trending_pools?include=base_token,quote_token&page=${p}`,
  new: (p) => `/networks/${NETWORK}/new_pools?include=base_token,quote_token&page=${p}`,
  top: (p) =>
    `/networks/${NETWORK}/pools?include=base_token,quote_token&page=${p}&sort=h24_volume_usd_desc`,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch with short backoff on 429 — the free tier is a per-minute budget the
 *  live feed can momentarily saturate; a brief wait lets it drain. */
async function gtFetch(path: string): Promise<any> {
  const url = `${BASE}${path}`;
  const backoff = [1200, 2500];
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE },
    });
    if (res.ok) return res.json();
    if (res.status === 429 && attempt < backoff.length) {
      await sleep(backoff[attempt]);
      continue;
    }
    throw new Error(`GeckoTerminal ${res.status} on ${path}`);
  }
}

const num = (v: unknown): number => (v == null || v === "" ? 0 : Number(v));
const numOrNull = (v: unknown): number | null =>
  v == null || v === "" ? null : Number(v);
const stripNet = (id: string): string => id.replace(/^robinhood_/, "");

function mapPool(pool: GTPool, tokens: Map<string, GTIncluded>): DiscoveryToken {
  const a = pool.attributes;
  const baseId: string = pool.relationships?.base_token?.data?.id ?? "";
  const baseTok = tokens.get(baseId);
  const [baseName = "", quoteName = ""] = String(a.name ?? "").split(" / ");

  const createdAt: string | null = a.pool_created_at ?? null;
  const ageMs = createdAt ? Date.now() - new Date(createdAt).getTime() : null;
  const pc = a.price_change_percentage ?? {};
  const tx = a.transactions?.h24 ?? { buys: 0, sells: 0, buyers: 0, sellers: 0 };

  const liquidityUsd = num(a.reserve_in_usd);
  const volume24hUsd = num(a.volume_usd?.h24);
  const priceChange24h = num(pc.h24);

  const rawLogo: string | undefined = baseTok?.attributes?.image_url;
  const logoUrl =
    rawLogo && rawLogo !== "missing.png" && rawLogo.startsWith("http") ? rawLogo : null;

  return {
    id: pool.id,
    symbol: (baseTok?.attributes?.symbol ?? baseName ?? "—").trim() || "—",
    name: (baseTok?.attributes?.name ?? baseName ?? "—").trim() || "—",
    address: stripNet(baseId),
    poolAddress: a.address,
    dex: (pool.relationships?.dex?.data?.id ?? "—").replace(/-robinhood$/, ""),
    logoUrl,
    priceUsd: numOrNull(a.base_token_price_usd),
    marketCapUsd: numOrNull(a.market_cap_usd) ?? numOrNull(a.fdv_usd),
    fdvUsd: numOrNull(a.fdv_usd),
    volume24hUsd,
    liquidityUsd,
    priceChange: { h1: num(pc.h1), h6: num(pc.h6), h24: priceChange24h },
    txns24h: {
      buys: num(tx.buys),
      sells: num(tx.sells),
      buyers: num(tx.buyers),
      sellers: num(tx.sellers),
    },
    createdAt,
    ageMs,
    quoteSymbol: quoteName.trim(),
    risk: assessRisk({
      liquidityUsd,
      volume24hUsd,
      priceChange24h,
      ageMs,
      buys: num(tx.buys),
      sells: num(tx.sells),
    }),
  };
}

/** Keep the deepest-liquidity pool per token so a token with several pools
 *  shows up once — better indexing, and frees rows for distinct tokens.
 *  Preserves the rank position of each token's first appearance. */
function dedupeByToken(tokens: DiscoveryToken[]): DiscoveryToken[] {
  const best = new Map<string, DiscoveryToken>();
  const order: string[] = [];
  for (const t of tokens) {
    const k = t.address || t.id;
    const existing = best.get(k);
    if (!existing) {
      best.set(k, t);
      order.push(k);
    } else if (t.liquidityUsd > existing.liquidityUsd) {
      best.set(k, t); // richer pool wins, but keep the original rank slot
    }
  }
  return order.map((k) => best.get(k)!);
}

export async function getDiscoveryFeed(
  view: FeedView = "trending"
): Promise<DiscoveryFeedResult> {
  const pages = await Promise.allSettled(
    Array.from({ length: PAGES }, (_, i) => gtFetch(VIEW_PATH[view](i + 1)))
  );

  const included = new Map<string, GTIncluded>();
  const pools: GTPool[] = [];
  for (const p of pages) {
    if (p.status !== "fulfilled") continue;
    for (const inc of (p.value.included ?? []) as GTIncluded[]) {
      if (inc.type === "token") included.set(inc.id, inc);
    }
    for (const pool of (p.value.data ?? []) as GTPool[]) pools.push(pool);
  }

  // If every page failed, surface the error to the caller.
  if (pools.length === 0 && pages.every((p) => p.status === "rejected")) {
    const reason = (pages[0] as PromiseRejectedResult)?.reason;
    throw reason instanceof Error ? reason : new Error("GeckoTerminal unavailable");
  }

  const tokens = dedupeByToken(pools.map((p) => mapPool(p, included)));

  return {
    tokens,
    view,
    fetchedAt: new Date().toISOString(),
    network: NETWORK,
    source: "geckoterminal",
  };
}

/* ---------- token detail sources ---------- */

export interface TokenMarket {
  address: string;
  poolAddress: string;
  symbol: string;
  name: string;
  dex: string;
  logoUrl: string | null;
  quoteSymbol: string;
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number;
  liquidityUsd: number;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  txns24h: { buys: number; sells: number; buyers: number; sellers: number };
  createdAt: string | null;
  ageMs: number | null;
}

/** Resolve a token address → its market snapshot + deepest pool (for charts). */
export async function getTokenMarket(address: string): Promise<TokenMarket | null> {
  const json = await gtFetch(
    `/networks/${NETWORK}/tokens/${address}?include=top_pools`
  );
  const data = json?.data;
  if (!data) return null;

  const ta = data.attributes ?? {};
  const topPoolId = data.relationships?.top_pools?.data?.[0]?.id;
  const pools = (json.included ?? []).filter((x: any) => x.type === "pool");
  const pool = pools.find((x: any) => x.id === topPoolId) ?? pools[0];
  const pa = pool?.attributes ?? {};
  const rel = pool?.relationships ?? {};
  const [, quoteName = ""] = String(pa.name ?? "").split(" / ");

  const createdAt: string | null = pa.pool_created_at ?? null;
  const ageMs = createdAt ? Date.now() - new Date(createdAt).getTime() : null;
  const pc = pa.price_change_percentage ?? {};
  const tx = pa.transactions?.h24 ?? { buys: 0, sells: 0, buyers: 0, sellers: 0 };
  const rawLogo: string | undefined = ta.image_url;

  return {
    address: stripNet(String(data.id)),
    poolAddress: pa.address ?? "",
    symbol: (ta.symbol ?? "—").trim() || "—",
    name: (ta.name ?? "—").trim() || "—",
    dex: (rel.dex?.data?.id ?? "—").replace(/-robinhood$/, ""),
    logoUrl:
      rawLogo && rawLogo !== "missing.png" && String(rawLogo).startsWith("http")
        ? rawLogo
        : null,
    quoteSymbol: quoteName.trim(),
    priceUsd: numOrNull(ta.price_usd) ?? numOrNull(pa.base_token_price_usd),
    marketCapUsd: numOrNull(ta.market_cap_usd) ?? numOrNull(ta.fdv_usd),
    fdvUsd: numOrNull(ta.fdv_usd),
    volume24hUsd: num(pa.volume_usd?.h24),
    liquidityUsd: num(pa.reserve_in_usd ?? ta.total_reserve_in_usd),
    priceChange: { m5: num(pc.m5), h1: num(pc.h1), h6: num(pc.h6), h24: num(pc.h24) },
    txns24h: {
      buys: num(tx.buys),
      sells: num(tx.sells),
      buyers: num(tx.buyers),
      sellers: num(tx.sellers),
    },
    createdAt,
    ageMs,
  };
}

const OHLCV_PATH: Record<OhlcvTimeframe, (pool: string) => string> = {
  m5: (p) => `/networks/${NETWORK}/pools/${p}/ohlcv/minute?aggregate=5&limit=288&currency=usd`,
  h1: (p) => `/networks/${NETWORK}/pools/${p}/ohlcv/hour?aggregate=1&limit=168&currency=usd`,
  d1: (p) => `/networks/${NETWORK}/pools/${p}/ohlcv/day?aggregate=1&limit=90&currency=usd`,
};

export async function getOhlcv(
  pool: string,
  tf: OhlcvTimeframe = "h1"
): Promise<OhlcvPoint[]> {
  const json = await gtFetch(OHLCV_PATH[tf](pool));
  const list: any[] = json?.data?.attributes?.ohlcv_list ?? [];
  return list
    .map((r) => ({
      t: num(r[0]),
      o: num(r[1]),
      h: num(r[2]),
      l: num(r[3]),
      c: num(r[4]),
      v: num(r[5]),
    }))
    .sort((a, b) => a.t - b.t);
}

export async function getTrades(pool: string, limit = 30): Promise<Trade[]> {
  const json = await gtFetch(`/networks/${NETWORK}/pools/${pool}/trades`);
  const data: any[] = json?.data ?? [];
  return data.slice(0, limit).map((t) => {
    const a = t.attributes ?? {};
    const kind = a.kind === "buy" ? "buy" : "sell";
    return {
      ts: a.block_timestamp
        ? Math.floor(new Date(a.block_timestamp).getTime() / 1000)
        : 0,
      kind,
      amountUsd: num(a.volume_in_usd),
      priceUsd: numOrNull(a.price_to_in_usd) ?? numOrNull(a.price_from_in_usd),
      wallet: a.tx_from_address ?? "",
      txHash: a.tx_hash ?? "",
    } as Trade;
  });
}
