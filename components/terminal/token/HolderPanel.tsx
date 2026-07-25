import Link from "next/link";
import type { TokenOnchain } from "@/lib/data";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function HolderPanel({ onchain, symbol }: { onchain: TokenOnchain; symbol: string }) {
  const conc = onchain.concentrationTop10;
  const concLevel = conc == null ? null : conc >= 60 ? "high" : conc >= 35 ? "med" : "low";

  return (
    <div className="rounded-2xl border border-hairline bg-panel/30 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Holders</h2>
        {onchain.holders != null && (
          <span className="tabular text-sm font-bold text-fg">
            {onchain.holders.toLocaleString()}
          </span>
        )}
      </div>

      {conc != null && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-fg-dim">Top 10 concentration</span>
            <span
              className={cn(
                "tabular font-semibold",
                concLevel === "high" ? "text-risk" : concLevel === "med" ? "text-wallet" : "text-safe"
              )}
            >
              {conc.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
            <div
              className={cn(
                "h-full rounded-full",
                concLevel === "high" ? "bg-risk" : concLevel === "med" ? "bg-wallet" : "bg-safe"
              )}
              style={{ width: `${Math.min(100, conc)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 space-y-1.5 border-t border-hairline pt-4">
        {onchain.topHolders.length === 0 ? (
          <p className="text-xs text-fg-dim">Holder data unavailable.</p>
        ) : (
          onchain.topHolders.slice(0, 8).map((h, i) => (
            <div key={h.address || i} className="flex items-center gap-2.5 text-xs">
              <span className="tabular w-4 text-fg-dim">{i + 1}</span>
              <Link
                href={`/terminal/wallet/${h.address}`}
                className="tabular w-24 shrink-0 truncate text-fg-muted transition-colors hover:text-lime"
              >
                {shortAddr(h.address)}
              </Link>
              {h.label && (
                <span className="shrink-0 rounded bg-panel px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-fg-dim">
                  {h.label}
                </span>
              )}
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-hairline">
                <div className="h-full rounded-full bg-lime/60" style={{ width: `${Math.min(100, h.pct ?? 0)}%` }} />
              </div>
              <span className="tabular w-12 shrink-0 text-right font-medium text-fg">
                {h.pct != null ? `${h.pct.toFixed(1)}%` : "—"}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-fg-dim">
        {symbol} balances from Robinhood Chain (Blockscout). Contracts &amp; pools may appear among
        top holders.
      </p>
    </div>
  );
}
