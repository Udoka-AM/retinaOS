"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiscoveryFeedResult, DiscoveryToken, FeedView } from "@/lib/data";
import { TokenCard } from "./TokenCard";
import { cn } from "@/lib/utils";

const POLL_MS = 20_000;

type Chip = { id: string; label: string; title: string };
const CHIPS: Chip[] = [
  { id: "safe", label: "Safe", title: "Exclude high & critical risk" },
  { id: "liq10", label: "$10K+", title: "Liquidity ≥ $10K" },
  { id: "liq100", label: "$100K+", title: "Liquidity ≥ $100K" },
  { id: "fresh", label: "<24h", title: "Launched in the last 24h" },
  { id: "gain", label: "Gainers", title: "Positive 24h change" },
];

const ACCENT: Record<FeedView, string> = {
  new: "text-lime",
  trending: "text-cortex",
  top: "text-wallet",
};

export function DiscoveryColumn({
  view,
  title,
  initial,
}: {
  view: FeedView;
  title: string;
  initial: DiscoveryFeedResult;
}) {
  const [tokens, setTokens] = useState<DiscoveryToken[]>(initial.tokens);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Set<string>>(new Set());
  const [pinged, setPinged] = useState(false);

  useEffect(() => setTokens(initial.tokens), [initial]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/terminal/feed?view=${view}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: DiscoveryFeedResult = await res.json();
        setTokens(data.tokens);
        setPinged(true);
        setTimeout(() => setPinged(false), 600);
      } catch {
        /* transient */
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [view]);

  function toggle(id: string) {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    return tokens.filter((t) => {
      if (q) {
        const s = q.toLowerCase();
        if (!t.symbol.toLowerCase().includes(s) && !t.name.toLowerCase().includes(s)) return false;
      }
      if (active.has("safe") && (t.risk.level === "high" || t.risk.level === "critical")) return false;
      if (active.has("liq10") && t.liquidityUsd < 10_000) return false;
      if (active.has("liq100") && t.liquidityUsd < 100_000) return false;
      if (active.has("fresh") && (t.ageMs == null || t.ageMs > 24 * 3.6e6)) return false;
      if (active.has("gain") && t.priceChange.h24 <= 0) return false;
      return true;
    });
  }, [tokens, q, active]);

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-hairline bg-panel/25">
      {/* mini header */}
      <header className="shrink-0 border-b border-hairline bg-panel/50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className={cn("text-sm font-bold", ACCENT[view])}>{title}</h2>
          <span
            className={cn(
              "size-1.5 rounded-full bg-safe transition-opacity",
              pinged ? "animate-ping" : "opacity-60"
            )}
            title="Live"
          />
          <span className="tabular ml-auto text-[10px] text-fg-dim">{filtered.length}</span>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-fg-dim"
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg border border-hairline bg-ink/60 py-1 pl-7 pr-2 text-[11px] text-fg outline-none placeholder:text-fg-dim focus:border-lime/40"
            />
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              title={c.title}
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                active.has(c.id)
                  ? "border-lime/40 bg-lime/10 text-lime"
                  : "border-hairline text-fg-dim hover:text-fg-muted"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      {/* scrollable list */}
      <div className="min-h-0 flex-1 overflow-y-auto scroll-slim">
        {filtered.length === 0 ? (
          <div className="px-3 py-12 text-center text-xs text-fg-dim">No tokens match.</div>
        ) : (
          filtered.map((t) => <TokenCard key={t.id} token={t} />)
        )}
      </div>
    </section>
  );
}
