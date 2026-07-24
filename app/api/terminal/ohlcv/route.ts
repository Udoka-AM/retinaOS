import { NextRequest, NextResponse } from "next/server";
import { provider, type OhlcvTimeframe } from "@/lib/data";

const TFS: OhlcvTimeframe[] = ["m5", "h1", "d1"];

export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  const raw = req.nextUrl.searchParams.get("tf");
  const tf: OhlcvTimeframe = TFS.includes(raw as OhlcvTimeframe) ? (raw as OhlcvTimeframe) : "h1";
  if (!pool) return NextResponse.json({ error: "pool required" }, { status: 400 });
  try {
    const points = await provider.getOhlcv(pool, tf);
    return NextResponse.json({ points, tf });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ohlcv unavailable" },
      { status: 502 }
    );
  }
}
