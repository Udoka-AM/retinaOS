import { provider, type DiscoveryFeedResult, type FeedView } from "@/lib/data";
import { DiscoveryFeed } from "@/components/terminal/DiscoveryFeed";

const VIEWS: FeedView[] = ["trending", "new", "top"];

export default async function TerminalPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const sp = await searchParams;
  const view: FeedView = VIEWS.includes(sp.view as FeedView) ? (sp.view as FeedView) : "trending";

  let initial: DiscoveryFeedResult;
  let error: string | undefined;
  try {
    initial = await provider.getDiscoveryFeed(view);
  } catch (err) {
    error = err instanceof Error ? err.message : "feed unavailable";
    initial = {
      tokens: [],
      view,
      fetchedAt: new Date().toISOString(),
      network: "robinhood",
      source: "geckoterminal",
    };
  }

  return <DiscoveryFeed initial={initial} view={view} error={error} />;
}
