import Link from "next/link";
import { provider } from "@/lib/data";
import { fmtAge, fmtPct, fmtPrice, fmtUsd, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconArrowUpRight, IconSpark } from "@/components/brand/Icons";
import { PriceChart } from "@/components/terminal/token/PriceChart";
import { TradesFeed } from "@/components/terminal/token/TradesFeed";
import { HolderPanel } from "@/components/terminal/token/HolderPanel";
import { CortexTokenPanel } from "@/components/terminal/CortexPanels";

export default async function TokenPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const d = await provider.getTokenDetail(address);

  if (!d) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Couldn&apos;t load this token</h1>
        <p className="mt-2 text-fg-muted">
          The data source may be momentarily rate-limited, or no Robinhood Chain pool was found
          for this address.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {/* full reload retries the server fetch */}
          <a href={`/terminal/token/${address}`} className="font-semibold text-lime hover:underline">
            Retry
          </a>
          <Link href="/terminal" className="text-fg-dim hover:text-fg">
            ← Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  const up = d.priceChange.h24 >= 0;
  const initials = d.symbol.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();

  return (
    <div className="w-full px-3 py-3">
      <Link
        href="/terminal"
        className="inline-flex items-center gap-1 text-sm text-fg-dim transition-colors hover:text-fg"
      >
        ← Discovery
      </Link>

      {/* header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-panel-2 text-sm font-bold text-lime ring-1 ring-hairline">
            {d.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.logoUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{d.symbol}</h1>
              <span className="text-sm text-fg-dim">/ {d.quoteSymbol || "—"}</span>
              <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fg-muted">
                {d.dex}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-fg-muted">
              <span>{d.name}</span>
              {d.ageMs != null && <span className="text-fg-dim">· {fmtAge(d.ageMs)} old</span>}
            </div>
            <a
              href={d.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="tabular mt-1 inline-flex items-center gap-1 text-xs text-fg-dim transition-colors hover:text-lime"
            >
              {shortAddr(d.address)} <IconArrowUpRight size={11} />
            </a>
          </div>
        </div>

        <div className="text-right">
          <div className="tabular text-3xl font-bold tracking-tight">{fmtPrice(d.priceUsd)}</div>
          <div className={cn("tabular text-sm font-semibold", up ? "text-safe" : "text-risk")}>
            {fmtPct(d.priceChange.h24)} · 24h
          </div>
        </div>
      </div>

      {/* grounded summary */}
      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-hairline bg-panel/30 p-4">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-cortex/10 text-cortex">
          <IconSpark size={16} />
        </span>
        <div>
          <p className="text-sm leading-relaxed text-fg">{d.summary}</p>
          <p className="mt-1 text-[11px] text-fg-dim">
            Automated summary · grounded in on-chain data. Conversational AI Analyst arrives in a later phase.
          </p>
        </div>
      </div>

      {/* stats */}
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat label="Market cap" value={fmtUsd(d.marketCapUsd)} />
        <Stat label="Liquidity" value={fmtUsd(d.liquidityUsd)} />
        <Stat label="24h volume" value={fmtUsd(d.volume24hUsd)} />
        <Stat label="Holders" value={d.onchain.holders != null ? d.onchain.holders.toLocaleString() : "—"} />
        <Stat
          label="24h trades"
          value={`${d.txns24h.buys + d.txns24h.sells}`}
          sub={`${d.txns24h.buys} buys · ${d.txns24h.sells} sells`}
        />
      </div>

      {/* main grid */}
      <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-2">
          <PriceChart pool={d.poolAddress} initial={d.chart} symbol={d.symbol} />
          <TradesFeed pool={d.poolAddress} initial={d.trades} />
        </div>
        <div className="space-y-2">
          <CortexTokenPanel cortex={d.cortex} />
          <HolderPanel onchain={d.onchain} symbol={d.symbol} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-panel/30 px-3.5 py-3">
      <div className="text-[11px] uppercase tracking-wide text-fg-dim">{label}</div>
      <div className="tabular mt-1 text-lg font-bold text-fg">{value}</div>
      {sub && <div className="tabular mt-0.5 text-[11px] text-fg-dim">{sub}</div>}
    </div>
  );
}
