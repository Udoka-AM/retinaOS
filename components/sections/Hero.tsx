import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RetinaMark } from "@/components/brand/RetinaMark";
import {
  IconArrowUpRight,
  IconSpark,
  IconTrend,
  IconLock,
} from "@/components/brand/Icons";
import { cn } from "@/lib/utils";

const feedRows = [
  { sym: "NOVA", name: "Nova Protocol", mc: "$1.8M", chg: "+142%", risk: 18, tag: "Early Mover", up: true },
  { sym: "AXON", name: "Axon", mc: "$920K", chg: "+68%", risk: 24, tag: "Momentum", up: true },
  { sym: "PULSE", name: "Pulsar", mc: "$4.2M", chg: "+31%", risk: 12, tag: "LP Backed", up: true },
  { sym: "DRIFT", name: "Drift", mc: "$610K", chg: "-9%", risk: 61, tag: "Sniper/Bot", up: false },
];

function riskTone(r: number) {
  if (r < 25) return "text-safe";
  if (r < 50) return "text-warn";
  return "text-risk";
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-aurora pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="aurora-blob animate-drift-a -top-40 left-1/4 h-[440px] w-[640px] bg-lime/12" />
      <div className="aurora-blob animate-drift-b top-20 right-0 h-[420px] w-[520px] bg-cortex/10" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* copy */}
        <div className="animate-rise">
          <Badge variant="lime" className="mb-6">
            <span className="size-1.5 rounded-full bg-lime animate-live" />
            Live on Robinhood Chain
          </Badge>

          <h1 className="text-balance text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-gradient-soft">The intelligence</span>
            <br />
            <span className="text-gradient-soft">layer for </span>
            <span className="text-gradient-lime">Robinhood Chain</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
            Real-time token discovery, wallet reputation scoring, and policy-governed
            execution — in one system. See what matters, know who to trust, act with
            confidence.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="group">
              Launch Terminal
              <IconArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
            <Button size="lg" variant="outline">
              Explore the feed
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-fg-dim">
            <span className="flex items-center gap-2">
              <IconTrend size={16} className="text-lime" /> No login to browse
            </span>
            <span className="flex items-center gap-2">
              <IconLock size={16} className="text-lime" /> Non-custodial
            </span>
            <span className="flex items-center gap-2">
              <IconSpark size={16} className="text-lime" /> AI-grounded on-chain
            </span>
          </div>
        </div>

        {/* floating terminal preview */}
        <div className="relative animate-rise [animation-delay:120ms]">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-lime/20 via-cortex/10 to-transparent blur-2xl" />
          <div className="border-gradient shadow-float rounded-3xl glass p-3">
            {/* window chrome */}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <RetinaMark className="size-5 text-lime" animated />
                <span className="text-sm font-semibold">Retina Terminal</span>
              </div>
              <Badge variant="lime" className="px-2 py-0.5 text-[10px]">
                <span className="size-1.5 rounded-full bg-lime animate-live" /> LIVE
              </Badge>
            </div>

            {/* feed header */}
            <div className="mt-1 grid grid-cols-[1.4fr_0.8fr_0.7fr_0.6fr] gap-2 border-b border-hairline px-3 pb-2 text-[10px] uppercase tracking-wider text-fg-dim">
              <span>Token</span>
              <span className="text-right">Mkt cap</span>
              <span className="text-right">24h</span>
              <span className="text-right">Risk</span>
            </div>

            {/* rows */}
            <div className="divide-y divide-hairline">
              {feedRows.map((r) => (
                <div
                  key={r.sym}
                  className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.6fr] items-center gap-2 px-3 py-3 transition-colors hover:bg-panel/60"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-panel-2 to-panel text-[10px] font-bold text-lime">
                      {r.sym.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{r.sym}</div>
                      <div className="truncate text-[11px] text-fg-dim">{r.tag}</div>
                    </div>
                  </div>
                  <div className="tabular text-right text-sm">{r.mc}</div>
                  <div className={cn("tabular text-right text-sm font-medium", r.up ? "text-safe" : "text-risk")}>
                    {r.chg}
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={cn("tabular text-sm font-semibold", riskTone(r.risk))}>{r.risk}</span>
                    <span className="h-1.5 w-8 overflow-hidden rounded-full bg-hairline">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          r.risk < 25 ? "bg-safe" : r.risk < 50 ? "bg-warn" : "bg-risk"
                        )}
                        style={{ width: `${r.risk}%` }}
                      />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI summary strip */}
            <div className="mt-1 flex items-start gap-2.5 rounded-2xl bg-cortex/10 p-3">
              <IconSpark size={15} className="mt-0.5 shrink-0 text-cortex" />
              <p className="text-[12px] leading-relaxed text-fg-muted">
                <span className="font-semibold text-cortex">Cortex:</span> NOVA momentum
                driven by 3 Early-Mover wallets accumulating; liquidity up 22% in 1h.
                Risk low.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
