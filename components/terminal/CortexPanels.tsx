import type { CortexSub, CortexTokenScore, CortexWalletScore, RiskLevel } from "@/lib/data";
import { IconCortex } from "@/components/brand/Icons";
import { cn } from "@/lib/utils";

/* ---------- shared bits ---------- */

const NOTE =
  "Cortex model, scored live from on-chain signals. Win-rate PnL, entry-timing & sybil-graph clustering arrive with the historical indexer.";

type Tone = { text: string; bg: string; ring: string; bar: string };
const SAFE: Tone = { text: "text-safe", bg: "bg-safe/10", ring: "ring-safe/30", bar: "bg-safe" };
const WARN: Tone = { text: "text-wallet", bg: "bg-wallet/10", ring: "ring-wallet/30", bar: "bg-wallet" };
const BAD: Tone = { text: "text-risk", bg: "bg-risk/10", ring: "ring-risk/30", bar: "bg-risk" };

const tokenTone = (l: RiskLevel): Tone => (l === "low" ? SAFE : l === "medium" ? WARN : BAD);
const walletTone = (s: number): Tone => (s >= 65 ? SAFE : s >= 40 ? WARN : BAD);
// per-subscore fill: risk polarity = higher is worse; good polarity = higher is better
const subTone = (v: number, polarity: "risk" | "good"): Tone => {
  const bad = polarity === "risk" ? v >= 60 : v < 35;
  const mid = polarity === "risk" ? v >= 32 : v < 60;
  return bad ? BAD : mid ? WARN : SAFE;
};

function GradeBadge({ score, grade, tone }: { score: number; grade: string; tone: Tone }) {
  return (
    <div
      className={cn(
        "flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl ring-1",
        tone.bg,
        tone.ring
      )}
    >
      <span className={cn("tabular text-2xl font-bold leading-none", tone.text)}>{score}</span>
      <span className={cn("text-[10px] font-bold uppercase tracking-wide", tone.text)}>
        Grade {grade}
      </span>
    </div>
  );
}

function SubBars({ subs, polarity }: { subs: CortexSub[]; polarity: "risk" | "good" }) {
  return (
    <div className="mt-4 space-y-3 border-t border-hairline pt-4">
      {subs.map((s) => {
        const tone = subTone(s.score, polarity);
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-fg-muted">{s.label}</span>
              <span className={cn("tabular font-semibold", tone.text)}>{s.score}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
              <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.max(4, s.score)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 items-center justify-center rounded-lg bg-cortex/10 text-cortex">
        <IconCortex size={14} />
      </span>
      <h2 className="text-sm font-semibold">
        Cortex <span className="text-fg-dim">· {title}</span>
      </h2>
    </div>
  );
}

/* ---------- token risk ---------- */

export function CortexTokenPanel({ cortex }: { cortex: CortexTokenScore }) {
  const tone = tokenTone(cortex.level);
  return (
    <div className="rounded-2xl border border-hairline bg-panel/30 p-4">
      <Header title="Token risk" />
      <div className="mt-3 flex items-center gap-4">
        <GradeBadge score={cortex.score} grade={cortex.grade} tone={tone} />
        <div>
          <div className={cn("text-sm font-bold capitalize", tone.text)}>{cortex.level} risk</div>
          <p className="mt-0.5 text-xs text-fg-dim">Composite of {cortex.subs.length} signals</p>
        </div>
      </div>

      <SubBars subs={cortex.subs} polarity="risk" />

      {cortex.flags.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
          {cortex.flags.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-fg-muted">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-risk" />
              {f}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-fg-dim">{NOTE}</p>
    </div>
  );
}

/* ---------- wallet reputation ---------- */

export function CortexWalletPanel({ cortex }: { cortex: CortexWalletScore }) {
  const tone = walletTone(cortex.score);
  return (
    <div className="rounded-2xl border border-hairline bg-panel/30 p-4">
      <Header title="Reputation" />
      <div className="mt-3 flex items-center gap-4">
        <GradeBadge score={cortex.score} grade={cortex.grade} tone={tone} />
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {cortex.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-cortex/10 px-1.5 py-0.5 text-[10px] font-semibold text-cortex"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-fg-dim">Behavioral classification</p>
        </div>
      </div>

      <SubBars subs={cortex.subs} polarity="good" />

      {cortex.flags.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
          {cortex.flags.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-fg-muted">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-risk" />
              {f}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-fg-dim">{NOTE}</p>
    </div>
  );
}
