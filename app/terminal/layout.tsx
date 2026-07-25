import type { Metadata } from "next";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { AnalystPalette } from "@/components/terminal/AnalystPalette";

export const metadata: Metadata = {
  title: "Retina Terminal — Discovery",
  description:
    "Live token discovery on Robinhood Chain: real-time DEX activity, liquidity, volume, and heuristic risk.",
};

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-fg">
      <TerminalHeader />
      <main>{children}</main>
      <AnalystPalette />
    </div>
  );
}
