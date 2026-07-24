const items = [
  "Token discovery",
  "Wallet reputation",
  "Cortex risk scores",
  "AI market analyst",
  "Policy-gated execution",
  "Real-time alerts",
  "Holder analysis",
  "Sybil detection",
  "Entry-timing signals",
  "Non-custodial",
];

export function Marquee() {
  return (
    <div className="relative border-y border-hairline bg-ink-2 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-2 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-2 to-transparent" />
      <div className="flex w-max animate-marquee gap-10">
        {[...items, ...items].map((it, i) => (
          <span key={i} className="flex items-center gap-10 text-sm font-medium text-fg-dim">
            {it}
            <span className="size-1 rounded-full bg-lime/60" />
          </span>
        ))}
      </div>
    </div>
  );
}
