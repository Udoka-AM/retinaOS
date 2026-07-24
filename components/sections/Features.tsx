import {
  IconSpark,
  IconGauge,
  IconCluster,
  IconShieldAlert,
  IconRadar,
  IconTiming,
} from "@/components/brand/Icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Features() {
  return (
    <section className="bg-ink-2 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">Capabilities</p>
          <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Everything on-chain, made legible
          </h2>
        </div>

        <div className="mt-16 grid auto-rows-[minmax(0,1fr)] gap-5 md:grid-cols-6">
          {/* AI analyst — wide */}
          <Card accent="cortex" className="md:col-span-4 md:row-span-2">
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3">
                <IconBox tone="cortex"><IconSpark size={20} /></IconBox>
                <Badge variant="cortex">⌘K</Badge>
              </div>
              <h3 className="mt-6 text-2xl font-bold">AI Market Analyst</h3>
              <p className="mt-2 max-w-lg leading-relaxed text-fg-muted">
                Ask in plain language — &ldquo;which reputable wallets bought NOVA in the last hour?&rdquo;
                Every answer comes with wallet addresses, timestamps, and links to verify. Grounded
                only in indexed on-chain data. No forecasts, no hype.
              </p>

              <div className="mt-auto space-y-2.5 pt-8">
                <ChatBubble who="you">Which Early-Mover wallets are accumulating sub-$2M tokens?</ChatBubble>
                <ChatBubble who="ai">
                  3 wallets with Cortex ≥ 72 are accumulating NOVA and AXON. Top: 0x9f…c2 (score 84,
                  Early Mover) added $41K over 2h.
                </ChatBubble>
              </div>
            </div>
          </Card>

          <Card accent="lime" className="md:col-span-2">
            <IconBox tone="lime"><IconGauge size={20} /></IconBox>
            <h3 className="mt-5 text-lg font-bold">Token risk 0–100</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Composite scores on concentration, liquidity, and wash-trade signals.
            </p>
          </Card>

          <Card accent="lime" className="md:col-span-2">
            <IconBox tone="lime"><IconCluster size={20} /></IconBox>
            <h3 className="mt-5 text-lg font-bold">Holder analysis</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Top-holder concentration with sybil clusters merged into single entities.
            </p>
          </Card>

          <Card accent="lime" className="md:col-span-2">
            <IconBox tone="risk"><IconShieldAlert size={20} /></IconBox>
            <h3 className="mt-5 text-lg font-bold">Five risk flags</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Wash trading, concentration, liquidity pulled, smart money exiting, sybil clusters.
            </p>
          </Card>

          <Card accent="wallet" className="md:col-span-2">
            <IconBox tone="wallet"><IconRadar size={20} /></IconBox>
            <h3 className="mt-5 text-lg font-bold">Filter-based alerts</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Turn any filter into an alert. Email + push, with an AI summary of every match.
            </p>
          </Card>

          <Card accent="lime" className="md:col-span-2">
            <IconBox tone="lime"><IconTiming size={20} /></IconBox>
            <h3 className="mt-5 text-lg font-bold">Entry-timing signals</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              See whether a wallet consistently buys before or after major moves.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

const tileAccent = {
  lime: "tile-lime",
  cortex: "tile-cortex",
  wallet: "tile-wallet",
} as const;

function Card({
  accent = "lime",
  className,
  children,
}: {
  accent?: keyof typeof tileAccent;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("tile group overflow-hidden rounded-3xl p-7", tileAccent[accent], className)}>
      {children}
    </div>
  );
}

const toneMap = {
  lime: "bg-lime/10 text-lime ring-lime/20",
  cortex: "bg-cortex/10 text-cortex ring-cortex/20",
  wallet: "bg-wallet/10 text-wallet ring-wallet/20",
  risk: "bg-risk/10 text-risk ring-risk/20",
} as const;

function IconBox({ tone, children }: { tone: keyof typeof toneMap; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-11 items-center justify-center rounded-2xl ring-1 transition-transform duration-500 group-hover:scale-110",
        toneMap[tone]
      )}
    >
      {children}
    </span>
  );
}

function ChatBubble({ who, children }: { who: "you" | "ai"; children: React.ReactNode }) {
  const isAi = who === "ai";
  return (
    <div className={cn("flex", isAi ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isAi ? "bg-cortex/10 text-fg" : "bg-panel-2 text-fg-muted"
        )}
      >
        {children}
      </div>
    </div>
  );
}
