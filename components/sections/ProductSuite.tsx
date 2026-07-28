import { IconReticle, IconCortex, IconAperture, IconArrowUpRight } from "@/components/brand/Icons";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TERMINAL_URL } from "@/lib/urls";

const DOCS = "https://retinaos.mintlify.app";

const products = [
  {
    name: "Retina Terminal",
    tagline: "See what matters.",
    accent: "lime",
    Icon: IconReticle,
    href: TERMINAL_URL,
    external: false,
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
    Icon: IconCortex,
    href: `${DOCS}/cortex/overview`,
    external: true,
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
    Icon: IconAperture,
    href: "#wallet",
    external: false,
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
  lime: { text: "text-lime", ring: "ring-lime/25", bg: "bg-lime/10", tile: "tile-lime" },
  cortex: { text: "text-cortex", ring: "ring-cortex/25", bg: "bg-cortex/10", tile: "tile-cortex" },
  wallet: { text: "text-wallet", ring: "ring-wallet/25", bg: "bg-wallet/10", tile: "tile-wallet" },
} as const;

export function ProductSuite() {
  return (
    <section id="suite" className="relative bg-ink-2 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
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
              <a
                key={p.name}
                href={p.href}
                {...(p.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className={cn("reveal tile group flex flex-col overflow-hidden rounded-3xl p-7", a.tile)}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl ring-1 transition-transform duration-500 group-hover:scale-110",
                      a.bg,
                      a.ring,
                      a.text
                    )}
                  >
                    <p.Icon size={24} />
                  </span>
                  <IconArrowUpRight
                    size={20}
                    className="text-fg-dim transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg"
                  />
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
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
