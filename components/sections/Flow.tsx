import { Search, ScanLine, ShieldCheck } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Search,
    title: "Discover",
    where: "Retina Terminal",
    body: "Browse the live feed of everything launching and moving on Robinhood Chain. Filter by market cap, liquidity, holder growth, age, and risk — no login required.",
  },
  {
    n: "02",
    icon: ScanLine,
    title: "Analyze",
    where: "Cortex",
    body: "Reputation and risk scores surface inline. See which wallets are early movers, which are bots, and whether a token shows wash trading or a fleeing smart-money crowd.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Execute",
    where: "Retina Wallet",
    body: "Set plain-language policies once. Every transaction is checked against your risk floors and limits before it broadcasts — and nothing happens without your confirmation.",
  },
];

export function Flow() {
  return (
    <section id="flow" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">The loop</p>
          <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            From signal to trade, in one path
          </h2>
        </div>

        <div className="relative mt-16 grid gap-6 lg:grid-cols-3">
          {/* connector line */}
          <div className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent lg:block" />

          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="mb-6 flex items-center gap-4">
                <span className="relative z-10 flex size-[72px] items-center justify-center rounded-2xl border border-lime/25 bg-ink-2 text-lime shadow-float">
                  <s.icon size={26} />
                </span>
                <span className="tabular text-5xl font-bold text-panel-2">{s.n}</span>
              </div>
              <div className="rounded-3xl border border-hairline bg-panel/40 p-7">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-2xl font-bold">{s.title}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wider text-fg-dim">
                    {s.where}
                  </span>
                </div>
                <p className="mt-3 leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
