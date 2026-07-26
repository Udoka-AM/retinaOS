import { provider, type DiscoveryFeedResult, type FeedView } from "@/lib/data";
import { DiscoveryBoard } from "@/components/terminal/DiscoveryBoard";

const empty = (view: FeedView): DiscoveryFeedResult => ({
  tokens: [],
  view,
  fetchedAt: new Date().toISOString(),
  network: "robinhood",
  source: "geckoterminal",
});

export default async function TerminalPage() {
  const [neu, trending, top] = await Promise.all([
    provider.getDiscoveryFeed("new").catch(() => null),
    provider.getDiscoveryFeed("trending").catch(() => null),
    provider.getDiscoveryFeed("top").catch(() => null),
  ]);

  const allFailed = !neu && !trending && !top;

  return (
    <DiscoveryBoard
      neu={neu ?? empty("new")}
      trending={trending ?? empty("trending")}
      top={top ?? empty("top")}
      error={allFailed ? "data source unavailable" : undefined}
    />
  );
}
