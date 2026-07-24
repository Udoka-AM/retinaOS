import { Crosshair, BrainCircuit, ShieldCheck, ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const products = [
  {
    name: "Retina Terminal",
    tagline: "See what matters.",
    accent: "lime",
    icon: Crosshair,
    desc: "The market intelligence dashboard. Real-time token discovery, deep token and wallet pages, and an AI analyst you can just talk to.",
    features: [
      "Live discovery feed — no login",
      "Token pages with AI summaries",
      "Wallet profiling & PnL",
      "⌘K AI Market Analyst",
    ],
  },
  {
    name: "Cortex",
    tagline: "Intelligence scored.",
    accent: "cortex",
    icon: BrainCircuit,
    desc: "The reputation engine, embedded everywhere. Behavioral classification and 0–100 trust scores for every wallet and token, inline.",
    features: [
      "Wallet reputation 0–100",
      "Behavioral tags & classification",
      "Token risk scoring",
      "Sybil & wash-trade detection",
    ],
  },
  {
    name: "Retina Wallet",
    tagline: "Trade with confidence.",
    accent: "wallet",
    icon: ShieldCheck,
    desc: "The non-custodial execution layer. Set plain-language policies; every trade is checked against them before it ever broadcasts.",
    features: [
      "WalletConnect, keys stay yours",
      "Cortex-score & budget policies",
      "Pre-trade policy checks",
      "Explicit confirm on every trade",
    ],
  },
] as const;

const accentMap = {
  lime: { text: "text-lime", ring: "ring-lime/25", bg: "bg-lime/10", glow: "from-lime/25", border: "hover:border-lime/40" },
  cortex: { text: "text-cortex", ring: "ring-cortex/25", bg: "bg-cortex/10", glow: "from-cortex/25", border: "hover:border-cortex/40" },
  wallet: { text: "text-wallet", ring: "ring-wallet/25", bg: "bg-wallet/10", glow: "from-wallet/25", border: "hover:border-wallet/40" },
} as const;

export function ProductSuite() {
  return (
    <section id="suite" className="relative bg-ink-2 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">The suite</p>
            <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Three products. One data layer.
            </h2>
            <p className="mt-4 text-lg text-fg-muted">
              The same on-chain events that power the Terminal drive Cortex scores and the
              Wallet&apos;s pre-trade checks. Use one, or run the whole loop.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {products.map((p) => {
            const a = accentMap[p.accent];
            return (
              <article
                key={p.name}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl border border-hairline bg-panel/40 p-7 transition-all duration-500 hover:-translate-y-1.5",
                  a.border
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-60 transition-opacity duration-500 group-hover:opacity-100",
                    a.glow
                  )}
                />
                <div className="flex items-center justify-between">
                  <span className={cn("flex size-12 items-center justify-center rounded-2xl ring-1", a.bg, a.ring, a.text)}>
                    <p.icon size={22} />
                  </span>
                  <ArrowUpRight className="text-fg-dim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                </div>

                <h3 className="mt-6 text-2xl font-bold">{p.name}</h3>
                <p className={cn("mt-1 text-sm font-semibold", a.text)}>{p.tagline}</p>
                <p className="mt-3 leading-relaxed text-fg-muted">{p.desc}</p>

                <ul className="mt-6 space-y-2.5 border-t border-hairline pt-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-fg">
                      <Check size={15} className={a.text} />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
