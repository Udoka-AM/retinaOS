import Link from "next/link";
import { RetinaMark } from "@/components/brand/RetinaMark";
import { IconReticle, IconCortex, IconAperture, IconRadar } from "@/components/brand/Icons";

const NAV = [
  { label: "Discovery", href: "/terminal", Icon: IconReticle, active: true },
  { label: "Tokens", Icon: IconCortex, soon: true },
  { label: "Wallets", Icon: IconAperture, soon: true },
  { label: "Alerts", Icon: IconRadar, soon: true },
];

export function TerminalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <RetinaMark className="size-7 text-lime" />
            <span className="text-sm font-bold">
              Retina<span className="text-fg-muted">Terminal</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) =>
              n.soon ? (
                <span
                  key={n.label}
                  className="flex cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-fg-dim/60"
                  title="Coming soon"
                >
                  <n.Icon size={15} /> {n.label}
                  <span className="rounded bg-panel px-1 py-0.5 text-[9px] uppercase text-fg-dim">soon</span>
                </span>
              ) : (
                <Link
                  key={n.label}
                  href={n.href!}
                  className="flex items-center gap-1.5 rounded-lg bg-panel/60 px-3 py-1.5 text-sm font-semibold text-fg"
                >
                  <n.Icon size={15} className="text-lime" /> {n.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-safe/30 bg-safe/10 px-2.5 py-1 text-[11px] font-semibold text-safe sm:flex">
            <span className="size-1.5 rounded-full bg-safe animate-live" /> LIVE · RH Chain
          </span>
          <Link href="/" className="text-xs text-fg-dim transition-colors hover:text-fg">
            ← retinaos
          </Link>
        </div>
      </div>
    </header>
  );
}
