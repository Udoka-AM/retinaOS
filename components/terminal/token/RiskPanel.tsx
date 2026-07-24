import type { RiskAssessment } from "@/lib/data";
import { cn } from "@/lib/utils";

const UI: Record<RiskAssessment["level"], { text: string; ring: string; bg: string; label: string }> = {
  low: { text: "text-safe", ring: "ring-safe/30", bg: "bg-safe/10", label: "Low risk" },
  medium: { text: "text-wallet", ring: "ring-wallet/30", bg: "bg-wallet/10", label: "Medium risk" },
  high: { text: "text-risk", ring: "ring-risk/30", bg: "bg-risk/10", label: "High risk" },
  critical: { text: "text-risk", ring: "ring-risk/40", bg: "bg-risk/15", label: "Critical risk" },
};

export function RiskPanel({ risk }: { risk: RiskAssessment }) {
  const ui = UI[risk.level];
  return (
    <div className="rounded-2xl border border-hairline bg-panel/30 p-4">
      <h2 className="text-sm font-semibold">Risk</h2>

      <div className="mt-3 flex items-center gap-4">
        <div
          className={cn(
            "flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl ring-1",
            ui.bg,
            ui.ring
          )}
        >
          <span className={cn("tabular text-2xl font-bold leading-none", ui.text)}>{risk.score}</span>
          <span className="text-[9px] uppercase tracking-wide text-fg-dim">/ 100</span>
        </div>
        <div>
          <div className={cn("text-sm font-bold", ui.text)}>{ui.label}</div>
          <p className="mt-0.5 text-xs text-fg-dim">Heuristic score</p>
        </div>
      </div>

      {risk.flags.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
          {risk.flags.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-fg-muted">
              <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", ui.text.replace("text-", "bg-"))} />
              {f}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-fg-dim">
        Heuristic proxy from liquidity, volume, age &amp; flow. Cortex reputation &amp; risk scoring
        replaces this in a later phase.
      </p>
    </div>
  );
}
