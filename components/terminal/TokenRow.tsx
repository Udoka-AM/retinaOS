import Link from "next/link";
import type { DiscoveryToken } from "@/lib/data";
import { fmtAge, fmtPct, fmtPrice, fmtUsd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RiskBadge } from "./RiskBadge";

export const GRID =
  "grid items-center gap-3 px-4 [grid-template-columns:32px_minmax(180px,1.6fr)_92px_84px_100px_100px_100px_96px_56px_116px]";

function Flow({ buys, sells }: { buys: number; sells: number }) {
  const total = buys + sells;
  const buyPct = total > 0 ? (buys / total) * 100 : 50;
  return (
    <div className="min-w-0">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-hairline">
        <div className="bg-safe" style={{ width: `${buyPct}%` }} />
        <div className="bg-risk" style={{ width: `${100 - buyPct}%` }} />
      </div>
      <div className="tabular mt-1 flex justify-between text-[10px] text-fg-dim">
        <span className="text-safe/80">{buys}</span>
        <span className="text-risk/80">{sells}</span>
      </div>
    </div>
  );
}

function Logo({ token }: { token: DiscoveryToken }) {
  const initials = token.symbol.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
  return (
    <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-panel-2 text-[10px] font-bold text-lime ring-1 ring-hairline">
      {token.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={token.logoUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
      {!token.logoUrl && initials}
    </span>
  );
}

export function TokenRow({ token, rank }: { token: DiscoveryToken; rank: number }) {
  const up = token.priceChange.h24 >= 0;
  const href = `/terminal/token/${token.address || token.poolAddress}`;
  return (
    <Link
      href={href}
      className={cn(
        GRID,
        "group border-t border-hairline/70 py-3 text-sm transition-colors hover:bg-panel/50"
      )}
    >
      <span className="tabular text-xs text-fg-dim">{rank}</span>

      <div className="flex min-w-0 items-center gap-3">
        <Logo token={token} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-fg">{token.symbol}</span>
            <span className="truncate text-xs text-fg-dim">/ {token.quoteSymbol || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-fg-dim">
            <span className="truncate">{token.name}</span>
            <span className="rounded bg-panel px-1 py-0.5 text-[9px] uppercase tracking-wide text-fg-muted">
              {token.dex}
            </span>
          </div>
        </div>
      </div>

      <span className="tabular text-right font-medium text-fg">{fmtPrice(token.priceUsd)}</span>
      <span className={cn("tabular text-right font-semibold", up ? "text-safe" : "text-risk")}>
        {fmtPct(token.priceChange.h24)}
      </span>
      <span className="tabular text-right text-fg-muted">{fmtUsd(token.liquidityUsd)}</span>
      <span className="tabular text-right text-fg-muted">{fmtUsd(token.volume24hUsd)}</span>
      <span className="tabular text-right text-fg-muted">{fmtUsd(token.marketCapUsd)}</span>
      <Flow buys={token.txns24h.buys} sells={token.txns24h.sells} />
      <span className="tabular text-right text-fg-dim">{fmtAge(token.ageMs)}</span>
      <div className="flex justify-end">
        <RiskBadge risk={token.risk} />
      </div>
    </Link>
  );
}
