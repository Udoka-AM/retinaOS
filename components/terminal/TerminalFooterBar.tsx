"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAperture,
  IconRadar,
  IconCluster,
  IconTrend,
  IconReticle,
  IconGauge,
  IconSpark,
  IconTiming,
} from "@/components/brand/Icons";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  Icon: typeof IconRadar;
  href?: string;
  soon?: boolean;
};

const LEFT: Item[] = [
  { label: "Wallet Tracker", Icon: IconAperture, href: "/terminal/alerts" },
  { label: "Social Tracker", Icon: IconCluster, soon: true },
  { label: "Holding", Icon: IconGauge, soon: true },
  { label: "Watchlist", Icon: IconRadar, href: "/terminal/alerts" },
  { label: "Trade", Icon: IconReticle, href: "/terminal" },
];

const RIGHT: Item[] = [
  { label: "PnL", Icon: IconTrend, soon: true },
  { label: "Signal", Icon: IconTiming, soon: true },
  { label: "Callout", Icon: IconSpark, soon: true },
];

function Entry({ item }: { item: Item }) {
  const body = (
    <>
      <item.Icon size={12} />
      <span className="hidden md:inline">{item.label}</span>
      {item.soon && (
        <span className="hidden rounded bg-panel px-1 text-[8px] uppercase text-fg-dim lg:inline">soon</span>
      )}
    </>
  );
  const cls =
    "flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors";
  if (item.soon || !item.href) {
    return (
      <span className={cn(cls, "cursor-not-allowed text-fg-dim/60")} title="Coming soon">
        {body}
      </span>
    );
  }
  return (
    <Link href={item.href} className={cn(cls, "text-fg-muted hover:bg-panel hover:text-fg")}>
      {body}
    </Link>
  );
}

export function TerminalFooterBar() {
  const [latency, setLatency] = useState<number | null>(null);
  const [ok, setOk] = useState(true);

  // real round-trip measurement against our own cached feed endpoint
  useEffect(() => {
    let cancelled = false;
    async function probe() {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/terminal/feed?view=trending", { cache: "no-store" });
        const ms = Math.round(performance.now() - t0);
        if (cancelled) return;
        setLatency(ms);
        setOk(res.ok);
      } catch {
        if (!cancelled) setOk(false);
      }
    }
    probe();
    const id = setInterval(probe, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const tone =
    !ok ? "text-risk" : latency == null ? "text-fg-dim" : latency < 400 ? "text-safe" : latency < 1200 ? "text-wallet" : "text-risk";
  const word = !ok ? "Degraded" : latency == null ? "Checking" : latency < 400 ? "Stable" : latency < 1200 ? "Slow" : "Laggy";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-ink/90 backdrop-blur-xl">
      <div className="flex h-9 w-full items-center gap-1 px-3">
        <div className="flex items-center gap-0.5">
          {LEFT.map((i) => (
            <Entry key={i.label} item={i} />
          ))}
        </div>

        <div className="mx-2 hidden h-4 w-px bg-hairline sm:block" />

        <div className="hidden items-center gap-0.5 sm:flex">
          {RIGHT.map((i) => (
            <Entry key={i.label} item={i} />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className={cn("tabular flex items-center gap-1.5 text-[11px] font-medium", tone)}>
            <span className={cn("size-1.5 rounded-full", ok ? "bg-safe" : "bg-risk")} />
            {word}
            {latency != null && <span className="text-fg-dim">{latency} MS</span>}
          </span>
          <span className="hidden items-center gap-1.5 text-[11px] text-fg-dim md:flex">
            <span className="size-1.5 rounded-full bg-lime" />
            Robinhood Chain
          </span>
        </div>
      </div>
    </div>
  );
}
