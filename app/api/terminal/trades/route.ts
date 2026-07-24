import { NextRequest, NextResponse } from "next/server";
import { provider } from "@/lib/data";

export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  if (!pool) return NextResponse.json({ error: "pool required" }, { status: 400 });
  try {
    const trades = await provider.getTrades(pool, 30);
    return NextResponse.json({ trades });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "trades unavailable" },
      { status: 502 }
    );
  }
}
