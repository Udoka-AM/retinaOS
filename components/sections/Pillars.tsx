import { IconSight, IconNeural, IconSpeed } from "@/components/brand/Icons";

const pillars = [
  {
    Icon: IconSight,
    name: "Sight",
    tagline: "Clarity over noise.",
    body: "Complexity collapses into the single most relevant signal at each moment. You see what matters, not everything at once.",
  },
  {
    Icon: IconNeural,
    name: "Intelligence",
    tagline: "Synthesized understanding.",
    body: "The system reveals what data means — not just raw figures. Reputation, risk, and behavior scored in context.",
  },
  {
    Icon: IconSpeed,
    name: "Speed",
    tagline: "Reflexive execution.",
    body: "Fast action follows from established clarity and judgment. Decisive, policy-governed, never impulsive.",
  },
];

export function Pillars() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="reveal mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">The lens</p>
        <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Three principles behind every pixel
        </h2>
        <p className="mt-4 text-lg text-fg-muted">
          RetinaOS is built like the eye it&apos;s named for — focused, perceptive, and quick to react.
        </p>
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {pillars.map((p, i) => (
          <div key={p.name} className="reveal tile tile-lime group overflow-hidden rounded-3xl p-8">
            <span className="relative flex size-12 items-center justify-center rounded-2xl bg-lime/10 text-lime ring-1 ring-lime/20 transition-transform duration-500 group-hover:scale-110">
              <p.Icon size={24} />
            </span>
            <h3 className="mt-6 text-2xl font-bold">{p.name}</h3>
            <p className="mt-1 text-sm font-medium text-lime">{p.tagline}</p>
            <p className="mt-3 leading-relaxed text-fg-muted">{p.body}</p>
            <span className="tabular mt-6 block text-xs text-fg-dim">0{i + 1} / 03</span>
          </div>
        ))}
      </div>
    </section>
  );
}
