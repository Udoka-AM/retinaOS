import { RetinaWordmark } from "@/components/brand/RetinaMark";

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
    <footer className="border-t border-hairline bg-ink-2">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <RetinaWordmark />
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              On-chain intelligence for Robinhood Chain. See what matters. Intelligence scored.
              Trade with confidence.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-fg">{c.title}</h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-fg-muted transition-colors hover:text-lime">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-hairline pt-8 text-sm text-fg-dim sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} RetinaOS. All data derived from public Robinhood Chain activity.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-fg">Privacy</a>
            <a href="#" className="hover:text-fg">Terms</a>
            <a href="#" className="hover:text-fg">Disclosures</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
