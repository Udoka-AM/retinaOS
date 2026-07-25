import { NextRequest, NextResponse } from "next/server";
import { provider } from "@/lib/data";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "valid address required" }, { status: 400 });
  }
  try {
    const activity = await provider.getWalletActivity(address);
    if (!activity) return NextResponse.json({ error: "unavailable" }, { status: 502 });
    return NextResponse.json(activity);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 502 }
    );
  }
}
