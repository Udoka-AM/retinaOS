import Link from "next/link";
import type { WalletTx } from "@/lib/data";
import { fmtNum, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

function ago(ts: number): string {
  if (!ts) return "—";
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const DIR: Record<WalletTx["direction"], { label: string; cls: string }> = {
  in: { label: "IN", cls: "bg-safe/10 text-safe" },
  out: { label: "OUT", cls: "bg-risk/10 text-risk" },
  self: { label: "SELF", cls: "bg-panel text-fg-dim" },
};

export function WalletActivity({ recent }: { recent: WalletTx[] }) {
  return (
    <div className="rounded-2xl border border-hairline bg-panel/30">
      <div className="border-b border-hairline px-4 py-3">
        <h2 className="text-sm font-semibold">Recent transfers</h2>
      </div>
      {recent.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-fg-dim">No recent transfers.</div>
      ) : (
        <div className="max-h-[360px] divide-y divide-hairline/60 overflow-y-auto scroll-slim">
          {recent.map((t, i) => {
            const d = DIR[t.direction];
            return (
              <div
                key={`${t.hash}-${i}`}
                className="grid grid-cols-[48px_1fr_auto] items-center gap-3 px-4 py-2.5 text-sm"
              >
                <span className={cn("rounded px-1.5 py-0.5 text-center text-[10px] font-bold", d.cls)}>
                  {d.label}
                </span>
                <div className="min-w-0">
                  <span className="tabular font-medium text-fg">
                    {t.amount != null ? fmtNum(t.amount) : ""} {t.tokenSymbol ?? ""}
                  </span>
                  <Link
                    href={`/terminal/wallet/${t.counterparty}`}
                    className="tabular ml-2 text-xs text-fg-dim transition-colors hover:text-lime"
                  >
                    {t.direction === "out" ? "→" : "←"} {shortAddr(t.counterparty)}
                  </Link>
                </div>
                <span className="tabular text-xs text-fg-dim">{ago(t.ts)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
