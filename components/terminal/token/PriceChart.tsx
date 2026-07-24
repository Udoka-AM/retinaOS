"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OhlcvPoint, OhlcvTimeframe } from "@/lib/data";
import { fmtPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const TFS: { id: OhlcvTimeframe; label: string }[] = [
  { id: "m5", label: "5m" },
  { id: "h1", label: "1H" },
  { id: "d1", label: "1D" },
];

const H = 280;
const PAD_Y = 18;

export function PriceChart({
  pool,
  initial,
  symbol,
}: {
  pool: string;
  initial: OhlcvPoint[];
  symbol: string;
}) {
  const [tf, setTf] = useState<OhlcvTimeframe>("h1");
  const [points, setPoints] = useState<OhlcvPoint[]>(initial);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(320, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function loadTf(next: OhlcvTimeframe) {
    setTf(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/terminal/ohlcv?pool=${pool}&tf=${next}`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.points)) setPoints(data.points);
    } catch {
      /* keep prior points */
    } finally {
      setLoading(false);
    }
  }

  const { line, area, min, max, up } = useMemo(() => {
    const n = points.length;
    if (n === 0) return { line: "", area: "", min: 0, max: 0, up: true };
    const closes = points.map((p) => p.c);
    const lo = Math.min(...closes);
    const hi = Math.max(...closes);
    const x = (i: number) => (n <= 1 ? width / 2 : (i / (n - 1)) * width);
    const y = (c: number) => (hi === lo ? H / 2 : PAD_Y + (1 - (c - lo) / (hi - lo)) * (H - 2 * PAD_Y));
    const l = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.c).toFixed(1)}`).join(" ");
    const a = `${l} L ${x(n - 1).toFixed(1)} ${H} L ${x(0).toFixed(1)} ${H} Z`;
    return { line: l, area: a, min: lo, max: hi, up: closes[n - 1] >= closes[0] };
  }, [points, width]);

  const color = up ? "var(--color-lime)" : "var(--color-risk)";
  const n = points.length;
  const hoverPt = hover != null ? points[hover] : null;
  const hx = hover != null && n > 1 ? (hover / (n - 1)) * width : 0;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (n < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const idx = Math.round((mx / rect.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  }

  return (
    <div className="rounded-2xl border border-hairline bg-panel/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-fg">{symbol} price</h2>
          {hoverPt ? (
            <span className="tabular text-xs text-fg-dim">
              {fmtPrice(hoverPt.c)} · {new Date(hoverPt.t * 1000).toLocaleString()}
            </span>
          ) : (
            <span className="tabular text-xs text-fg-dim">
              range {fmtPrice(min)}–{fmtPrice(max)}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {TFS.map((t) => (
            <button
              key={t.id}
              onClick={() => loadTf(t.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                tf === t.id ? "bg-lime/15 text-lime" : "text-fg-dim hover:text-fg-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrapRef} className="relative" style={{ height: H }}>
        {n === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-fg-dim">
            No chart data for this timeframe.
          </div>
        ) : (
          <svg
            width={width}
            height={H}
            className={cn("block transition-opacity", loading && "opacity-50")}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#chartFill)" />
            <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
            {hover != null && hoverPt && (
              <>
                <line x1={hx} y1={0} x2={hx} y2={H} stroke="var(--color-hairline)" strokeWidth={1} />
                <circle
                  cx={hx}
                  cy={max === min ? H / 2 : PAD_Y + (1 - (hoverPt.c - min) / (max - min)) * (H - 2 * PAD_Y)}
                  r={4}
                  fill={color}
                  stroke="var(--color-ink)"
                  strokeWidth={2}
                />
              </>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
