import { NextRequest, NextResponse } from "next/server";
import { getTokenMarket, getOhlcv } from "@/lib/data/geckoterminal";
import type { OhlcvTimeframe } from "@/lib/data";

const TFS: OhlcvTimeframe[] = ["m1", "m5", "m15", "h1", "h4", "d1"];

/** Resolve a token address → its deepest pool → OHLCV, so any holding can be
 *  charted with the same component used on token pages. */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const raw = req.nextUrl.searchParams.get("tf");
  const tf: OhlcvTimeframe = TFS.includes(raw as OhlcvTimeframe) ? (raw as OhlcvTimeframe) : "h1";

  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "valid token address required" }, { status: 400 });
  }

  try {
    const market = await getTokenMarket(address);
    if (!market?.poolAddress) {
      return NextResponse.json({ error: "no pool found for this token" }, { status: 404 });
    }
    const points = await getOhlcv(market.poolAddress, tf).catch(() => []);
    return NextResponse.json({
      pool: market.poolAddress,
      symbol: market.symbol,
      name: market.name,
      priceUsd: market.priceUsd,
      change24h: market.priceChange.h24,
      liquidityUsd: market.liquidityUsd,
      volume24hUsd: market.volume24hUsd,
      points,
      tf,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "chart unavailable" },
      { status: 502 }
    );
  }
}
