import { NextRequest, NextResponse } from "next/server";
import { provider, type FeedView } from "@/lib/data";

const VIEWS: FeedView[] = ["trending", "new", "top"];

/** Live feed endpoint the client polls to refresh rows without a full reload.
 *  Shares the same cached provider call as the server-rendered page. */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("view");
  const view: FeedView = VIEWS.includes(raw as FeedView) ? (raw as FeedView) : "trending";
  try {
    const feed = await provider.getDiscoveryFeed(view);
    return NextResponse.json(feed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "feed unavailable" },
      { status: 502 }
    );
  }
}
