import { NextResponse } from "next/server";
import { provider, type DiscoveryToken } from "@/lib/data";

/** Header price ticker. Derived entirely from feed data the Terminal already
 *  caches — this route adds ZERO upstream requests. */

type Quote = { symbol: string; priceUsd: number; changeH24: number | null; address?: string };

function pickHood(tokens: DiscoveryToken[]): Quote | null {
  // Strictly the Robinhood Markets tokenized equity. Deliberately NOT a fuzzy
  // name match — "Robinhood Dog" and friends are memecoins, and showing one
  // beside ETH would read as the Robinhood price.
  const t = tokens.find((x) => x.symbol.toUpperCase() === "HOOD");
  if (!t || t.priceUsd == null) return null;
  return {
    symbol: t.symbol.toUpperCase(),
    priceUsd: t.priceUsd,
    changeH24: t.priceChange.h24,
    address: t.address,
  };
}

export async function GET() {
  try {
    const [top, trending] = await Promise.all([
      provider.getDiscoveryFeed("top").catch(() => null),
      provider.getDiscoveryFeed("trending").catch(() => null),
    ]);
    const tokens = [...(top?.tokens ?? []), ...(trending?.tokens ?? [])];
    if (tokens.length === 0) {
      return NextResponse.json({ quotes: [] satisfies Quote[] });
    }

    const quotes: Quote[] = [];

    // ETH — the quote-token price carried on every WETH-paired pool.
    const wethPool = tokens.find(
      (t) => /^W?ETH$/i.test(t.quoteSymbol.split(" ")[0] ?? "") && t.quotePriceUsd
    );
    if (wethPool?.quotePriceUsd) {
      quotes.push({ symbol: "ETH", priceUsd: wethPool.quotePriceUsd, changeH24: null });
    }

    const hood = pickHood(tokens);
    if (hood) quotes.push(hood);

    return NextResponse.json({ quotes, at: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { quotes: [], error: err instanceof Error ? err.message : "ticker unavailable" },
      { status: 200 }
    );
  }
}
