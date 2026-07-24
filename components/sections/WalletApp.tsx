import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RetinaMark } from "@/components/brand/RetinaMark";
import { IconAperture, IconArrowUpRight, IconLock } from "@/components/brand/Icons";

const FRAME =
  "linear-gradient(135deg,#eef0f2 0%,#b9bdc4 16%,#868b93 34%,#dcdfe4 52%,#7c818a 70%,#c8cbd1 86%,#9aa0a8 100%)";
const RAIL =
  "linear-gradient(180deg,#d7dadf 0%,#9aa0a8 18%,#797e87 48%,#aeb3ba 78%,#cbced4 100%)";

const points = [
  "Plain-language trade policies",
  "Cortex risk & reputation, inline",
  "Your keys never leave your device",
];

export function WalletApp() {
  return (
    <section className="relative flex items-center overflow-hidden py-24 lg:min-h-screen lg:py-0">
      {/* ---------- background ---------- */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.3] [mask-image:radial-gradient(ellipse_70%_60%_at_65%_50%,#000,transparent_75%)]" />
      <div className="aurora-blob animate-drift-a right-[22%] top-[14%] h-[440px] w-[480px] bg-lime/12" />
      <div className="aurora-blob animate-drift-b bottom-[8%] right-[6%] h-[420px] w-[460px] bg-wallet/10" />
      <div className="pointer-events-none absolute right-[26%] top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-lime)_12%,transparent),transparent_62%)] blur-2xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
        {/* ---------- copy (left) ---------- */}
        <div className="reveal">
          <Badge variant="wallet" className="mb-6">
            <IconAperture size={13} /> Retina Wallet · Mobile
          </Badge>
          <h2 className="text-balance text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            <span className="text-gradient-soft">Trade with </span>
            <span className="text-gradient-lime">confidence</span>
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-fg-muted">
            Discovery, Cortex scoring, and policy-governed execution — in a non-custodial
            wallet that checks every trade before you sign.
          </p>

          <ul className="mt-8 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-fg">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-wallet/10 text-wallet ring-1 ring-wallet/20">
                  <Check size={14} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="group bg-wallet text-ink-2 hover:bg-wallet hover:shadow-[0_10px_40px_-10px_var(--color-wallet)]"
            >
              Join the waitlist
              <IconArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
            <span className="flex items-center gap-2 text-sm text-fg-dim">
              <IconLock size={15} className="text-lime" /> iOS &amp; Android
            </span>
          </div>
        </div>

        {/* ---------- paired phones (right) ---------- */}
        <div className="reveal flex justify-center lg:justify-end">
          <div className="relative h-[540px] w-[460px] max-w-full origin-center scale-[0.62] sm:scale-75 md:scale-90 lg:scale-100">
            {/* onboarding phone — back / upper-right */}
            <Phone3D
              railSide="right"
              tilt="rotateY(30deg) rotateX(6deg) rotateZ(7deg)"
              className="absolute right-0 top-0 z-10"
              delay="0.9s"
            >
              <OnboardingScreen />
            </Phone3D>

            {/* wallet phone — front / lower-left */}
            <Phone3D
              railSide="left"
              tilt="rotateY(-28deg) rotateX(6deg) rotateZ(-7deg)"
              className="absolute bottom-0 left-0 z-20"
              delay="0s"
            >
              <WalletScreen />
            </Phone3D>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 3D phone shell ---------------- */
function Phone3D({
  railSide,
  tilt,
  className,
  delay,
  children,
}: {
  railSide: "left" | "right";
  tilt: string;
  className?: string;
  delay: string;
  children: React.ReactNode;
}) {
  const btn = "absolute w-[3px] rounded bg-[#6f747c]";
  return (
    <div className={className} style={{ perspective: "760px" }}>
      <div
        className="animate-float relative"
        style={{ transform: tilt, transformStyle: "preserve-3d", animationDelay: delay }}
      >
        {/* thickness / side rail */}
        <div
          className="absolute inset-0 rounded-[2.9rem]"
          style={{ transform: "translateZ(-24px)", background: RAIL }}
        >
          {railSide === "left" ? (
            <>
              <span className={`${btn} left-0 top-[20%] h-[6%]`} />
              <span className={`${btn} left-0 top-[30%] h-[9%]`} />
              <span className={`${btn} left-0 top-[42%] h-[9%]`} />
            </>
          ) : (
            <span className={`${btn} right-0 top-[34%] h-[15%]`} />
          )}
        </div>

        {/* frame + screen */}
        <div
          className="relative w-[240px] rounded-[2.9rem] p-[3px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.95)] ring-1 ring-black/50"
          style={{ background: FRAME }}
        >
          <div className="rounded-[2.75rem] bg-black p-[8px]">
            <div className="relative h-[470px] overflow-hidden rounded-[2.3rem] bg-ink">
              {/* dynamic island */}
              <div className="absolute left-1/2 top-2.5 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
              {children}
              {/* glare */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.06] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- onboarding screen ---------------- */
function OnboardingScreen() {
  return (
    <div className="relative flex h-full flex-col px-4 pb-6 pt-10">
      <div className="absolute inset-0 bg-[radial-gradient(90%_50%_at_50%_0%,color-mix(in_srgb,var(--color-wallet)_12%,transparent),transparent_60%)]" />

      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <span className="animate-ring absolute -inset-4 rounded-full border border-dashed border-wallet/30" />
          <span className="flex size-16 items-center justify-center rounded-2xl bg-wallet/12 text-wallet ring-1 ring-wallet/25">
            <IconAperture size={30} />
          </span>
        </div>
        <RetinaMark className="hidden" />
        <div className="text-sm font-bold tracking-tight">
          Retina<span className="text-wallet">Wallet</span>
        </div>
        <h3 className="mt-5 text-[26px] font-bold leading-tight tracking-tight">
          Your keys.
          <br />
          Your market.
        </h3>
        <p className="mt-2 text-[12px] text-fg-muted">
          Non-custodial by design. Set up in under a minute.
        </p>
      </div>

      <div className="relative space-y-2.5">
        <button className="w-full rounded-2xl bg-wallet py-3 text-sm font-bold text-ink-2">
          Create wallet
        </button>
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-hairline bg-panel/60 py-3 text-sm font-semibold text-fg">
          <IconLock size={14} className="text-lime" /> Connect via WalletConnect
        </button>
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <span className="h-1.5 w-4 rounded-full bg-wallet" />
          <span className="size-1.5 rounded-full bg-hairline" />
          <span className="size-1.5 rounded-full bg-hairline" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- wallet screen (animated) ---------------- */
const checks = [
  { label: "Risk score ≤ 25", value: "18", delay: "0s" },
  { label: "Position ≤ $1,000", value: "$500", delay: "0.35s" },
  { label: "Liquidity ≥ $50K", value: "$212K", delay: "0.7s" },
];

function WalletScreen() {
  return (
    <div className="relative flex h-full flex-col gap-3 px-3.5 pb-5 pt-10">
      <div className="absolute inset-0 bg-[radial-gradient(90%_45%_at_50%_0%,color-mix(in_srgb,var(--color-lime)_10%,transparent),transparent_60%)]" />

      {/* header */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-wallet/15 text-wallet">
            <IconAperture size={14} />
          </span>
          <span className="text-[13px] font-bold">Retina Wallet</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-panel px-2 py-1 text-[9px] font-medium text-fg-muted">
          <span className="size-1.5 rounded-full bg-safe" /> 0x9f…c2
        </span>
      </div>

      {/* balance */}
      <div className="relative rounded-2xl border border-hairline bg-panel/60 p-3.5">
        <div className="text-[10px] text-fg-dim">Portfolio value</div>
        <div className="mt-1 flex items-end justify-between">
          <span className="tabular text-xl font-bold tracking-tight">$12,480.55</span>
          <span className="tabular rounded-md bg-safe/10 px-1.5 py-0.5 text-[10px] font-semibold text-safe">
            +6.2%
          </span>
        </div>
      </div>

      {/* trade review */}
      <div className="border-gradient relative overflow-hidden rounded-2xl bg-panel/70 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-dim">
            Trade review
          </span>
          <span className="tabular rounded-full bg-cortex/10 px-2 py-0.5 text-[9px] font-bold text-cortex">
            Cortex 84
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-panel-2 to-panel text-[11px] font-bold text-lime">
            NO
          </span>
          <div className="flex-1">
            <div className="text-[13px] font-bold">Buy NOVA</div>
            <div className="text-[10px] text-fg-dim">Nova Protocol</div>
          </div>
          <div className="text-right">
            <div className="tabular text-[13px] font-bold">$500.00</div>
            <div className="tabular text-[10px] text-fg-dim">≈ 41.2K</div>
          </div>
        </div>
        <div className="mt-2.5 space-y-1.5 border-t border-hairline pt-2.5">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-2 text-fg-muted">
                <span
                  className="animate-tick flex size-3.5 items-center justify-center rounded-full bg-safe/15 text-safe"
                  style={{ animationDelay: c.delay }}
                >
                  <Check size={9} strokeWidth={3} />
                </span>
                {c.label}
              </span>
              <span className="tabular font-semibold text-fg">{c.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* confirm */}
      <div className="relative mt-auto">
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-hairline">
          <div className="animate-bar h-full rounded-full bg-wallet" />
        </div>
        <button className="relative w-full overflow-hidden rounded-2xl bg-wallet py-2.5 text-center text-[13px] font-bold text-ink-2">
          <span className="relative z-10">Confirm in wallet</span>
          <span className="animate-sheen absolute inset-y-0 left-0 z-0 w-1/3 bg-white/40 blur-md" />
        </button>
        <p className="mt-1.5 text-center text-[9px] text-fg-dim">
          Nothing broadcasts without your tap.
        </p>
      </div>
    </div>
  );
}
