import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Explore the market with no commitment.",
    features: [
      "100 API requests / day",
      "10 AI analyst queries / day",
      "Up to 3 active alerts",
      "Full public discovery feed",
      "Token & wallet pages",
    ],
    cta: "Start free",
    variant: "outline" as const,
    featured: false,
  },
  {
    name: "Pro",
    price: "$15–30",
    cadence: "/ month",
    blurb: "For active traders who live in the feed.",
    features: [
      "10,000 API requests / day",
      "Unlimited AI queries",
      "Unlimited alerts",
      "Follow wallets & saved filters",
      "Push + email notifications",
      "Priority Cortex refresh",
    ],
    cta: "Go Pro",
    variant: "primary" as const,
    featured: true,
  },
  {
    name: "API",
    price: "Usage",
    cadence: "based",
    blurb: "Build on RetinaOS data directly.",
    features: [
      "Custom rate limits",
      "/tokens, /wallets, /scores",
      "/events & /alerts endpoints",
      "Bearer-token auth",
      "Developer support",
    ],
    cta: "Get API access",
    variant: "outline" as const,
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">Pricing</p>
          <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Start free. Scale when you&apos;re ready.
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            The discovery feed is always public. Upgrade for unlimited intelligence.
          </p>
        </div>

        <div className="mt-16 grid items-start gap-5 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={cn(
                "reveal relative flex flex-col rounded-3xl p-8",
                t.featured
                  ? "border-gradient glow-lime bg-panel/60 shadow-float lg:-translate-y-3"
                  : "tile tile-lime border border-hairline bg-panel/30"
              )}
            >
              {t.featured && (
                <Badge variant="lime" className="absolute -top-3 left-8">
                  Most popular
                </Badge>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="tabular text-4xl font-bold">{t.price}</span>
                <span className="text-sm text-fg-dim">{t.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-fg-muted">{t.blurb}</p>

              <Button variant={t.variant} className="mt-6 w-full">
                {t.cta}
              </Button>

              <ul className="mt-8 space-y-3 border-t border-hairline pt-8">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-fg">
                    <Check size={16} className={cn("mt-0.5 shrink-0", t.featured ? "text-lime" : "text-fg-dim")} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
