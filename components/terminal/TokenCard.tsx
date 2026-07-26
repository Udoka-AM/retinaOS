"use client";

import { useState } from "react";
import Link from "next/link";
import type { DiscoveryToken } from "@/lib/data";
import { fmtAge, fmtPct, fmtPrice, fmtUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const RISK_TONE: Record<string, string> = {
  low: "text-safe",
  medium: "text-wallet",
  high: "text-risk",
  critical: "text-risk",
};

function Logo({ token }: { token: DiscoveryToken }) {
  const [failed, setFailed] = useState(false);
  const initials = token.symbol.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase() || "?";
  const show = token.logoUrl && !failed;
  return (
    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-panel-2 text-[10px] font-bold text-lime ring-1 ring-hairline">
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={token.logoUrl!}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

/** Compact buy/sell pressure bar from 24h flow. */
function Flow({ buys, sells }: { buys: number; sells: number }) {
  const total = buys + sells;
  const buyPct = total > 0 ? (buys / total) * 100 : 50;
  return (
    <div className="flex items-center gap-1.5" title={`${buys} buys / ${sells} sells (24h)`}>
      <span className="tabular text-[10px] font-medium text-safe/80">{buys}</span>
      <div className="flex h-1 w-14 overflow-hidden rounded-full bg-hairline">
        <div className="bg-safe" style={{ width: `${buyPct}%` }} />
        <div className="bg-risk" style={{ width: `${100 - buyPct}%` }} />
      </div>
      <span className="tabular text-[10px] font-medium text-risk/80">{sells}</span>
    </div>
  );
}

export function TokenCard({ token }: { token: DiscoveryToken }) {
  const [copied, setCopied] = useState(false);
  const up = token.priceChange.h24 >= 0;
  const addr = token.address || token.poolAddress;
  const poolUrl = `https://www.geckoterminal.com/robinhood/pools/${token.poolAddress}`;

  function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(token.address || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Link
      href={`/terminal/token/${addr}`}
      className="group block border-b border-hairline/60 px-3 py-2.5 transition-colors hover:bg-panel/60"
    >
      {/* row 1 — identity + size */}
      <div className="flex items-center gap-2.5">
        <Logo token={token} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-bold text-fg">{token.symbol}</span>
            <span className="truncate text-[11px] text-fg-dim">{token.name}</span>
            <button
              onClick={copy}
              title="Copy contract address"
              className="shrink-0 rounded p-0.5 text-fg-dim opacity-0 transition-all hover:text-lime group-hover:opacity-100"
            >
              {copied ? (
                <span className="text-[9px] font-bold text-lime">✓</span>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
              )}
            </button>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="tabular text-[10px] font-medium text-fg-dim">{fmtAge(token.ageMs)}</span>
            <span className="rounded bg-panel px-1 py-px text-[9px] uppercase tracking-wide text-fg-dim">
              {token.dex}
            </span>
            <span className={cn("tabular text-[10px] font-bold", RISK_TONE[token.risk.level])}>
              R{token.risk.score}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="tabular text-[11px] text-fg-dim">
            V <span className="font-semibold text-fg-muted">{fmtUsd(token.volume24hUsd)}</span>
          </div>
          <div className="tabular text-[11px] text-fg-dim">
            MC <span className="font-semibold text-fg-muted">{fmtUsd(token.marketCapUsd)}</span>
          </div>
        </div>
      </div>

      {/* row 2 — price, change, liquidity, flow, action */}
      <div className="mt-2 flex items-center gap-2">
        <span className="tabular text-[12px] font-semibold text-fg">{fmtPrice(token.priceUsd)}</span>
        <span className={cn("tabular text-[12px] font-bold", up ? "text-safe" : "text-risk")}>
          {fmtPct(token.priceChange.h24)}
        </span>
        <span className="tabular text-[11px] text-fg-dim">
          LQ <span className="text-fg-muted">{fmtUsd(token.liquidityUsd)}</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Flow buys={token.txns24h.buys} sells={token.txns24h.sells} />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(poolUrl, "_blank", "noopener,noreferrer");
            }}
            className="flex items-center gap-1 rounded-lg bg-lime/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-lime ring-1 ring-lime/20 transition-colors hover:bg-lime hover:text-ink-2"
          >
            Trade
          </button>
        </div>
      </div>
    </Link>
  );
}
