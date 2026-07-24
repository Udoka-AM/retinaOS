import type { RiskAssessment } from "@/lib/data";
import { cn } from "@/lib/utils";

const UI: Record<RiskAssessment["level"], { text: string; bar: string; label: string }> = {
  low: { text: "text-safe", bar: "bg-safe", label: "Low" },
  medium: { text: "text-wallet", bar: "bg-wallet", label: "Med" },
  high: { text: "text-risk", bar: "bg-risk", label: "High" },
  critical: { text: "text-risk", bar: "bg-risk", label: "Crit" },
};

export function RiskBadge({ risk }: { risk: RiskAssessment }) {
  const ui = UI[risk.level];
  const title = risk.flags.length
    ? `Heuristic risk ${risk.score}/100 — ${risk.flags.join("; ")}`
    : `Heuristic risk ${risk.score}/100`;

  return (
    <div className="flex items-center gap-2" title={title}>
      <div className="h-1.5 w-9 overflow-hidden rounded-full bg-hairline">
        <div
          className={cn("h-full rounded-full", ui.bar)}
          style={{ width: `${Math.max(6, risk.score)}%` }}
        />
      </div>
      <span className={cn("tabular w-6 text-right text-xs font-semibold", ui.text)}>
        {risk.score}
      </span>
      <span
        className={cn(
          "hidden rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline-block",
          ui.text,
          risk.level === "critical" ? "bg-risk/15" : "bg-panel"
        )}
      >
        {ui.label}
      </span>
    </div>
  );
}
