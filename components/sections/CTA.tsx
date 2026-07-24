import { Button } from "@/components/ui/button";
import { RetinaMark } from "@/components/brand/RetinaMark";
import { IconArrowUpRight } from "@/components/brand/Icons";

export function CTA() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal relative overflow-hidden rounded-[2.5rem] border border-hairline bg-aurora px-8 py-16 text-center sm:px-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
          <div className="aurora-blob animate-drift-a left-1/3 top-0 h-72 w-[520px] bg-lime/15" />
          <div className="aurora-blob animate-drift-b bottom-0 right-10 h-64 w-[420px] bg-cortex/12" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <RetinaMark className="mx-auto size-14 text-lime" animated />
            <h2 className="mt-8 text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              See what matters on <span className="text-gradient-lime">Robinhood Chain</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-fg-muted">
              Open the Terminal and start scanning the market in seconds. No login to browse.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="group">
                Launch Terminal
                <IconArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
              <Button size="lg" variant="outline" className="border-fg/25 bg-ink-2/40 text-fg hover:border-lime/50">
                Read the docs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
