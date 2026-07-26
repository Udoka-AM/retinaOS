"use client";

import { useEffect, useState } from "react";
import type { DiscoveryFeedResult } from "@/lib/data";
import { DiscoveryColumn } from "./DiscoveryColumn";

export function DiscoveryBoard({
  neu,
  trending,
  top,
  error,
}: {
  neu: DiscoveryFeedResult;
  trending: DiscoveryFeedResult;
  top: DiscoveryFeedResult;
  error?: string;
}) {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const set = () => setNow(new Date().toLocaleTimeString());
    set();
    const id = setInterval(set, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full px-3 pb-3 pt-3">
      {/* slim title bar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight">Discovery</h1>
        <span className="hidden text-xs text-fg-dim sm:inline">
          Live tokens on Robinhood Chain — indexed from on-chain DEX activity.
        </span>
        <span className="tabular ml-auto flex items-center gap-1.5 text-[11px] text-fg-dim">
          <span className="size-1.5 rounded-full bg-safe animate-live" />
          Updated {now}
        </span>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-risk/30 bg-risk/10 px-3 py-2 text-xs text-risk">
          Couldn&apos;t reach the feed ({error}). Retrying live…
        </div>
      )}

      {/* 3-column board — each column scrolls independently */}
      <div className="grid h-[calc(100vh-168px)] grid-cols-1 gap-3 lg:grid-cols-3">
        <DiscoveryColumn view="new" title="New" initial={neu} />
        <DiscoveryColumn view="trending" title="Trending" initial={trending} />
        <DiscoveryColumn view="top" title="Top Volume" initial={top} />
      </div>
    </div>
  );
}
