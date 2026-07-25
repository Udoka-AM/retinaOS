import Link from "next/link";
import type { Holding } from "@/lib/data";
import { fmtNum, fmtPrice, fmtUsd } from "@/lib/format";

function Logo({ h }: { h: Holding }) {
  const initials = h.symbol.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
  return (
    <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-panel-2 text-[9px] font-bold text-lime ring-1 ring-hairline">
      {h.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={h.logoUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

export function HoldingsTable({
  holdings,
  portfolioValueUsd,
}: {
  holdings: Holding[];
  portfolioValueUsd: number | null;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-panel/30">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h2 className="text-sm font-semibold">Holdings</h2>
        <span className="text-xs text-fg-dim">{holdings.length} tokens</span>
      </div>

      {holdings.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-fg-dim">No token holdings found.</div>
      ) : (
        <div className="divide-y divide-hairline/60">
          {holdings.map((h) => {
            const pct =
              h.valueUsd != null && portfolioValueUsd && portfolioValueUsd > 0
                ? (h.valueUsd / portfolioValueUsd) * 100
                : null;
            const inner = (
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-panel/50">
                <div className="flex min-w-0 items-center gap-3">
                  <Logo h={h} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-fg">{h.symbol}</div>
                    <div className="tabular truncate text-xs text-fg-dim">
                      {fmtNum(h.balance)} · {fmtPrice(h.priceUsd)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="tabular text-sm font-semibold text-fg">{fmtUsd(h.valueUsd)}</div>
                  {pct != null && (
                    <div className="tabular text-xs text-fg-dim">{pct.toFixed(1)}%</div>
                  )}
                </div>
              </div>
            );
            return h.address ? (
              <Link key={h.address} href={`/terminal/token/${h.address}`} className="block">
                {inner}
              </Link>
            ) : (
              <div key={h.symbol}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
