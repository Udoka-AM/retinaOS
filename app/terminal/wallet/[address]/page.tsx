import Link from "next/link";
import { provider } from "@/lib/data";
import { fmtNum, fmtUsd, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconArrowUpRight, IconSpark, IconAperture } from "@/components/brand/Icons";
import { HoldingsTable } from "@/components/terminal/wallet/HoldingsTable";
import { WalletActivity } from "@/components/terminal/wallet/WalletActivity";
import { CortexWalletPanel } from "@/components/terminal/CortexPanels";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const w = await provider.getWalletProfile(address);

  if (!w) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Couldn&apos;t load this wallet</h1>
        <p className="mt-2 text-fg-muted">
          The explorer may be momentarily unavailable, or this address has no activity on
          Robinhood Chain.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <a href={`/terminal/wallet/${address}`} className="font-semibold text-lime hover:underline">
            Retry
          </a>
          <Link href="/terminal" className="text-fg-dim hover:text-fg">
            ← Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <Link
        href="/terminal"
        className="inline-flex items-center gap-1 text-sm text-fg-dim transition-colors hover:text-fg"
      >
        ← Discovery
      </Link>

      {/* header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-wallet/10 text-wallet ring-1 ring-wallet/20">
            <IconAperture size={26} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="tabular text-2xl font-bold tracking-tight">{shortAddr(w.address)}</h1>
              {w.label && (
                <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fg-muted">
                  {w.label}
                </span>
              )}
              {w.isContract && (
                <span className="rounded bg-cortex/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-cortex">
                  Contract
                </span>
              )}
            </div>
            <a
              href={w.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="tabular mt-1 inline-flex items-center gap-1 text-xs text-fg-dim transition-colors hover:text-lime"
            >
              {w.address} <IconArrowUpRight size={11} />
            </a>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wide text-fg-dim">Portfolio value</div>
          <div className="tabular text-3xl font-bold tracking-tight">{fmtUsd(w.portfolioValueUsd)}</div>
        </div>
      </div>

      {/* grounded summary */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-hairline bg-panel/30 p-4">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-cortex/10 text-cortex">
          <IconSpark size={16} />
        </span>
        <div>
          <p className="text-sm leading-relaxed text-fg">{w.summary}</p>
          <p className="mt-1 text-[11px] text-fg-dim">
            Automated profile · grounded in on-chain data. Cortex reputation &amp; behavioral
            classification (Early Mover, Sniper/Bot, LP…) arrive in a later phase.
          </p>
        </div>
      </div>

      {/* stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label={`${w.nativeSymbol} balance`}
          value={fmtNum(w.nativeBalance)}
          sub={w.nativeValueUsd != null ? fmtUsd(w.nativeValueUsd) : undefined}
        />
        <Stat label="Holdings" value={`${w.holdings.length}`} />
        <Stat
          label="Transactions"
          value={w.txCount != null ? w.txCount.toLocaleString() : "—"}
        />
        <Stat
          label="Token transfers"
          value={w.transferCount != null ? w.transferCount.toLocaleString() : "—"}
        />
      </div>

      {/* main grid */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <HoldingsTable holdings={w.holdings} portfolioValueUsd={w.portfolioValueUsd} />
        <div className="space-y-4">
          <CortexWalletPanel cortex={w.cortex} />
          <WalletActivity recent={w.recent} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={cn("rounded-xl border border-hairline bg-panel/30 px-3.5 py-3")}>
      <div className="text-[11px] uppercase tracking-wide text-fg-dim">{label}</div>
      <div className="tabular mt-1 text-lg font-bold text-fg">{value}</div>
      {sub && <div className="tabular mt-0.5 text-[11px] text-fg-dim">{sub}</div>}
    </div>
  );
}
