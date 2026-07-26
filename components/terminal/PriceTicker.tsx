"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Quote = { symbol: string; priceUsd: number; changeH24: number | null; address?: string };
type Dir = "up" | "down" | null;

const POLL_MS = 20_000;

function fmt(p: number) {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toPrecision(3)}`;
}

export function PriceTicker() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dirs, setDirs] = useState<Record<string, Dir>>({});
  const prev = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch("/api/terminal/ticker", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data.quotes)) return;

        const nextDirs: Record<string, Dir> = {};
        for (const q of data.quotes as Quote[]) {
          const before = prev.current[q.symbol];
          if (before != null && q.priceUsd !== before) {
            nextDirs[q.symbol] = q.priceUsd > before ? "up" : "down";
          }
          prev.current[q.symbol] = q.priceUsd;
        }
        setQuotes(data.quotes);
        if (Object.keys(nextDirs).length) {
          setDirs((d) => ({ ...d, ...nextDirs }));
          // clear the flash after the animation
          setTimeout(() => {
            if (cancelled) return;
            setDirs((d) => {
              const copy = { ...d };
              for (const k of Object.keys(nextDirs)) copy[k] = null;
              return copy;
            });
          }, 1100);
        }
      } catch {
        /* transient */
      }
    }
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (quotes.length === 0) return null;

  return (
    <div className="hidden items-center gap-1 md:flex">
      {quotes.map((q) => {
        const dir = dirs[q.symbol];
        return (
          <div
            key={q.symbol}
            title={`${q.symbol} — live from Robinhood Chain pools`}
            className={cn(
              "tabular flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-500",
              dir === "up"
                ? "border-safe bg-safe/10 text-safe animate-tick-up"
                : dir === "down"
                ? "border-risk bg-risk/10 text-risk animate-tick-down"
                : "border-hairline bg-panel/60 text-fg-muted"
            )}
          >
            <span className="text-fg-dim">{q.symbol}</span>
            <span className={cn(dir ? "" : "text-fg")}>{fmt(q.priceUsd)}</span>
            {dir && <span className="text-[9px]">{dir === "up" ? "▲" : "▼"}</span>}
          </div>
        );
      })}
    </div>
  );
}
