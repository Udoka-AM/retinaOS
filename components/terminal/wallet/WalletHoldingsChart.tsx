"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Holding, OhlcvPoint } from "@/lib/data";
import { PriceChart } from "@/components/terminal/token/PriceChart";
import { fmtPct, fmtPrice, fmtUsd } from "@/lib/format";
import { IconArrowUpRight } from "@/components/brand/Icons";
import { cn } from "@/lib/utils";

type ChartData = {
  pool: string;
  symbol: string;
  name: string;
  priceUsd: number | null;
  change24h: number;
  liquidityUsd: number;
  volume24hUsd: number;
  points: OhlcvPoint[];
};

/** Full token-chart functionality on the wallet page: pick any holding and get
 *  the same candlestick/line chart used on token pages. */
export function WalletHoldingsChart({ holdings }: { holdings: Holding[] }) {
  const tradable = holdings.filter((h) => h.address);
  const [selected, setSelected] = useState<string | null>(tradable[0]?.address ?? null);
  const [data, setData] = useState<ChartData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  const load = useCallback(async (address: string) => {
    setState("loading");
    setData(null);
    try {
      const res = await fetch(`/api/terminal/token-chart?address=${address}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        const raw = String(json?.error ?? "");
        // never surface raw upstream strings to users
        setMsg(
          /429|rate/i.test(raw)
            ? "rate-limited"
            : /no pool/i.test(raw)
            ? "no-pool"
            : "unavailable"
        );
        setState("error");
        return;
      }
      setData(json);
      setState("idle");
    } catch {
      setMsg("unavailable");
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (selected) load(selected);
  }, [selected, load]);

  if (tradable.length === 0) return null;

  const up = (data?.change24h ?? 0) >= 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-panel/30">
      {/* holding selector */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-hairline px-3 py-2 scroll-slim">
        <span className="shrink-0 text-[11px] uppercase tracking-wide text-fg-dim">Holdings</span>
        {tradable.slice(0, 14).map((h) => (
          <button
            key={h.address}
            onClick={() => setSelected(h.address)}
            className={cn(
              "shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors",
              selected === h.address
                ? "border-lime/40 bg-lime/10 text-lime"
                : "border-hairline text-fg-dim hover:text-fg-muted"
            )}
          >
            {h.symbol}
          </button>
        ))}
      </div>

      {/* selected token summary */}
      {data && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-hairline px-4 py-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-fg">{data.symbol}</span>
            <span className="truncate text-xs text-fg-dim">{data.name}</span>
          </div>
          <span className="tabular text-sm font-semibold text-fg">{fmtPrice(data.priceUsd)}</span>
          <span className={cn("tabular text-xs font-bold", up ? "text-safe" : "text-risk")}>
            {fmtPct(data.change24h)}
          </span>
          <span className="tabular text-xs text-fg-dim">
            LQ <span className="text-fg-muted">{fmtUsd(data.liquidityUsd)}</span>
          </span>
          <span className="tabular text-xs text-fg-dim">
            VOL <span className="text-fg-muted">{fmtUsd(data.volume24hUsd)}</span>
          </span>
          <Link
            href={`/terminal/token/${selected}`}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-lime hover:underline"
          >
            Full analysis <IconArrowUpRight size={11} />
          </Link>
        </div>
      )}

      {/* chart — same component as token pages (candles/line + timeframes) */}
      {state === "loading" ? (
        <div className="flex h-[356px] items-center justify-center text-sm text-fg-dim">
          Loading chart…
        </div>
      ) : state === "error" ? (
        <div className="flex h-[356px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-fg-dim">
          <span className="text-fg-muted">
            {msg === "rate-limited"
              ? "Chart data is rate-limited right now."
              : msg === "no-pool"
              ? "No liquid pool for this token on Robinhood Chain."
              : "Couldn't load this chart."}
          </span>
          <span className="text-xs">
            {msg === "rate-limited"
              ? "The free data tier is busy — try again in a moment."
              : "Pick another holding, or open the full token page."}
          </span>
          {selected && (
            <button
              onClick={() => load(selected)}
              className="mt-1 rounded-lg bg-lime/10 px-3 py-1 text-xs font-semibold text-lime ring-1 ring-lime/20 transition-colors hover:bg-lime hover:text-ink-2"
            >
              Retry
            </button>
          )}
        </div>
      ) : data ? (
        <PriceChart key={data.pool} pool={data.pool} initial={data.points} symbol={data.symbol} bare />
      ) : null}
    </div>
  );
}
