"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Trade } from "@/lib/data";
import { fmtUsd, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

const POLL_MS = 12_000;

function ago(ts: number): string {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function TradesFeed({ pool, initial }: { pool: string; initial: Trade[] }) {
  const [trades, setTrades] = useState<Trade[]>(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/terminal/trades?pool=${pool}`, { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data.trades)) setTrades(data.trades);
      } catch {
        /* ignore */
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [pool]);

  return (
    <div className="rounded-2xl border border-hairline bg-panel/30">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h2 className="text-sm font-semibold">Recent trades</h2>
        <span className="flex items-center gap-1.5 text-[11px] text-fg-dim">
          <span className="size-1.5 rounded-full bg-safe animate-live" /> live
        </span>
      </div>
      <div className="max-h-[360px] overflow-y-auto scroll-slim">
        {trades.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-fg-dim">No recent trades.</div>
        ) : (
          trades.map((t, i) => (
            <div
              key={`${t.txHash}-${i}`}
              className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-hairline/60 px-4 py-2.5 text-sm last:border-0"
            >
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-center text-[11px] font-bold uppercase",
                  t.kind === "buy" ? "bg-safe/10 text-safe" : "bg-risk/10 text-risk"
                )}
              >
                {t.kind}
              </span>
              <Link
                href={`/terminal/wallet/${t.wallet}`}
                className="tabular truncate text-fg-muted transition-colors hover:text-lime"
              >
                {shortAddr(t.wallet)}
              </Link>
              <div className="text-right">
                <span className="tabular font-semibold text-fg">{fmtUsd(t.amountUsd)}</span>
                <span className="tabular ml-2 text-xs text-fg-dim">{ago(t.ts)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
