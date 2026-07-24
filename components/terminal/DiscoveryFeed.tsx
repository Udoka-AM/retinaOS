"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DiscoveryFeedResult, DiscoveryToken, FeedView } from "@/lib/data";
import { cn } from "@/lib/utils";
import { GRID, TokenRow } from "./TokenRow";

const VIEWS: { id: FeedView; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "new", label: "New" },
  { id: "top", label: "Top volume" },
];

type SortKey = "change" | "liquidity" | "volume" | "mcap" | "age" | "risk" | null;

const POLL_MS = 4_000;

export function DiscoveryFeed({
  initial,
  view,
  error,
}: {
  initial: DiscoveryFeedResult;
  view: FeedView;
  error?: string;
}) {
  const [rows, setRows] = useState<DiscoveryToken[]>(initial.tokens);
  const [fetchedAt, setFetchedAt] = useState(initial.fetchedAt);
  const [live, setLive] = useState(true);
  const [pinged, setPinged] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [minLiq, setMinLiq] = useState(0);
  const [minVol, setMinVol] = useState(0);
  const [maxAgeH, setMaxAgeH] = useState(0); // 0 = any
  const [hideCritical, setHideCritical] = useState(false);
  const [sort, setSort] = useState<SortKey>(null);
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  // reset when the server view changes
  useEffect(() => {
    setRows(initial.tokens);
    setFetchedAt(initial.fetchedAt);
  }, [initial]);

  // live polling
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!live) return;
    async function tick() {
      try {
        const res = await fetch(`/api/terminal/feed?view=${view}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: DiscoveryFeedResult = await res.json();
        setRows(data.tokens);
        setFetchedAt(data.fetchedAt);
        setPinged(true);
        setTimeout(() => setPinged(false), 700);
      } catch {
        /* ignore transient poll errors */
      }
    }
    timer.current = setInterval(tick, POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [live, view]);

  const filtered = useMemo(() => {
    let out = rows.filter((t) => {
      if (q) {
        const s = q.toLowerCase();
        if (!t.symbol.toLowerCase().includes(s) && !t.name.toLowerCase().includes(s)) return false;
      }
      if (t.liquidityUsd < minLiq) return false;
      if (t.volume24hUsd < minVol) return false;
      if (maxAgeH > 0 && (t.ageMs == null || t.ageMs > maxAgeH * 3.6e6)) return false;
      if (hideCritical && t.risk.level === "critical") return false;
      return true;
    });
    if (sort) {
      const val = (t: DiscoveryToken) =>
        sort === "change" ? t.priceChange.h24 :
        sort === "liquidity" ? t.liquidityUsd :
        sort === "volume" ? t.volume24hUsd :
        sort === "mcap" ? t.marketCapUsd ?? 0 :
        sort === "age" ? t.ageMs ?? Number.MAX_SAFE_INTEGER :
        t.risk.score;
      out = [...out].sort((a, b) => (dir === "asc" ? val(a) - val(b) : val(b) - val(a)));
    }
    return out;
  }, [rows, q, minLiq, minVol, maxAgeH, hideCritical, sort, dir]);

  function toggleSort(key: Exclude<SortKey, null>) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* title + live status */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discovery</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Live tokens on Robinhood Chain — indexed from on-chain DEX activity.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-fg-dim">
          <span className={cn("size-1.5 rounded-full bg-safe transition-opacity", pinged && "animate-ping")} />
          <span className="tabular">Updated {new Date(fetchedAt).toLocaleTimeString()}</span>
          <button
            onClick={() => setLive((v) => !v)}
            className={cn(
              "rounded-full border px-2.5 py-1 font-semibold uppercase tracking-wide transition-colors",
              live ? "border-safe/30 bg-safe/10 text-safe" : "border-hairline text-fg-dim"
            )}
          >
            {live ? "Live" : "Paused"}
          </button>
        </div>
      </div>

      {/* view tabs */}
      <div className="mt-6 flex gap-1 border-b border-hairline">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`/terminal?view=${v.id}`}
            scroll={false}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              v.id === view
                ? "border-lime text-fg"
                : "border-transparent text-fg-dim hover:text-fg-muted"
            )}
          >
            {v.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* filters */}
        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search symbol or name…"
              className="w-full rounded-xl border border-hairline bg-panel/50 px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-dim focus:border-lime/50"
            />
          </div>
          <Select label="Min liquidity" value={minLiq} onChange={setMinLiq}
            options={[[0, "Any"], [1_000, "$1K"], [10_000, "$10K"], [50_000, "$50K"], [100_000, "$100K"]]} />
          <Select label="Min 24h volume" value={minVol} onChange={setMinVol}
            options={[[0, "Any"], [10_000, "$10K"], [100_000, "$100K"], [1_000_000, "$1M"]]} />
          <Select label="Max age" value={maxAgeH} onChange={setMaxAgeH}
            options={[[0, "Any"], [1, "1h"], [6, "6h"], [24, "24h"], [168, "7d"]]} />
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
            <input type="checkbox" checked={hideCritical} onChange={(e) => setHideCritical(e.target.checked)}
              className="size-4 accent-lime" />
            Hide critical risk
          </label>
          <p className="tabular border-t border-hairline pt-4 text-xs text-fg-dim">
            {filtered.length} of {rows.length} tokens
          </p>
          <p className="text-[11px] leading-relaxed text-fg-dim">
            Risk shown is a heuristic proxy from liquidity, volume, age &amp; flow — Cortex
            reputation scoring replaces it in a later phase.
          </p>
        </aside>

        {/* table */}
        <div className="min-w-0">
          {error && (
            <div className="mb-4 rounded-xl border border-risk/30 bg-risk/10 px-4 py-3 text-sm text-risk">
              Couldn&apos;t reach the feed ({error}). Retrying live…
            </div>
          )}
          <div className="overflow-x-auto rounded-2xl border border-hairline bg-panel/30 scroll-slim">
            <div className="min-w-[960px]">
              {/* header */}
              <div className={cn(GRID, "py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-dim")}>
                <span>#</span>
                <span>Token</span>
                <span className="text-right">Price</span>
                <Th label="24h" active={sort === "change"} dir={dir} onClick={() => toggleSort("change")} />
                <Th label="Liquidity" active={sort === "liquidity"} dir={dir} onClick={() => toggleSort("liquidity")} />
                <Th label="Volume" active={sort === "volume"} dir={dir} onClick={() => toggleSort("volume")} />
                <Th label="Mkt cap" active={sort === "mcap"} dir={dir} onClick={() => toggleSort("mcap")} />
                <span className="text-center">Flow 24h</span>
                <Th label="Age" active={sort === "age"} dir={dir} onClick={() => toggleSort("age")} />
                <Th label="Risk" active={sort === "risk"} dir={dir} onClick={() => toggleSort("risk")} align="right" />
              </div>

              {filtered.length === 0 ? (
                <div className="border-t border-hairline px-4 py-16 text-center text-sm text-fg-dim">
                  No tokens match these filters.
                </div>
              ) : (
                filtered.map((t, i) => <TokenRow key={t.id} token={t} rank={i + 1} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({
  label,
  active,
  dir,
  onClick,
  align = "right",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "right";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:text-fg-muted",
        align === "right" && "justify-end",
        active ? "text-lime" : "text-fg-dim"
      )}
    >
      {label}
      <span className={cn("text-[8px]", !active && "opacity-0")}>{dir === "asc" ? "▲" : "▼"}</span>
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: [number, string][];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-fg-dim">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              value === v
                ? "border-lime/40 bg-lime/10 text-lime"
                : "border-hairline text-fg-dim hover:text-fg-muted"
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
