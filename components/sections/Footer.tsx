import { RetinaWordmark, RetinaMark } from "@/components/brand/RetinaMark";
import { Button } from "@/components/ui/button";
import { IconArrowUpRight } from "@/components/brand/Icons";

const cols = [
  {
    title: "Products",
    links: ["Retina Terminal", "Cortex", "Retina Wallet", "Public API"],
  },
  {
    title: "Platform",
    links: ["Discovery feed", "AI Market Analyst", "Alerts", "Reputation scoring"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Quickstart", "API reference", "Brand vision"],
  },
  {
    title: "Company",
    links: ["About", "Pricing", "Status", "Contact"],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-hairline bg-aurora">
      {/* top edge glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="aurora-blob animate-drift-b -bottom-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 bg-lime/8" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* CTA band */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-hairline py-14 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <RetinaMark className="size-11 text-lime" animated />
            <div>
              <h3 className="text-2xl font-bold tracking-tight">
                See what matters on Robinhood Chain
              </h3>
              <p className="mt-1 text-sm text-fg-muted">
                On-chain intelligence, scored and ready to act on.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="group">
              Launch Terminal
              <IconArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
            <Button variant="outline">Read the docs</Button>
          </div>
        </div>

        {/* link columns */}
        <div className="grid gap-12 py-16 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <RetinaWordmark />
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              On-chain intelligence for Robinhood Chain. See what matters. Intelligence scored.
              Trade with confidence.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/10 px-3 py-1.5 text-xs font-medium text-lime">
              <span className="size-1.5 rounded-full bg-lime animate-live" />
              All systems operational
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-fg">{c.title}</h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="group inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-lime"
                    >
                      {l}
                      <IconArrowUpRight
                        size={13}
                        className="opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* giant watermark wordmark */}
        <div className="pointer-events-none select-none pb-6">
          <div
            className="bg-gradient-to-b from-panel-2/80 to-transparent bg-clip-text text-center text-[19vw] font-bold leading-none tracking-tighter text-transparent"
            aria-hidden
          >
            RetinaOS
          </div>
        </div>

        {/* bottom bar */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-hairline py-8 text-sm text-fg-dim sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} RetinaOS. All data derived from public Robinhood Chain activity.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-fg">Privacy</a>
            <a href="#" className="transition-colors hover:text-fg">Terms</a>
            <a href="#" className="transition-colors hover:text-fg">Disclosures</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
