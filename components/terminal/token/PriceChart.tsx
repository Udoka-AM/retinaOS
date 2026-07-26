"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OhlcvPoint, OhlcvTimeframe } from "@/lib/data";
import { fmtPrice, fmtUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const TFS: { id: OhlcvTimeframe; label: string }[] = [
  { id: "m1", label: "1m" },
  { id: "m5", label: "5m" },
  { id: "m15", label: "15m" },
  { id: "h1", label: "1H" },
  { id: "h4", label: "4H" },
  { id: "d1", label: "1D" },
];

type Mode = "candles" | "line";

const H = 300; // price pane
const VH = 54; // volume pane
const TIME_H = 18; // bottom time axis
const AXIS_W = 62; // right price axis
const PAD = 14;

/** Compact axis label — keeps tiny sub-cent prices readable. */
function axisLabel(v: number): string {
  if (v >= 1000) return v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : `${(v / 1e3).toFixed(2)}K`;
  if (v >= 1) return v.toFixed(2);
  if (v >= 0.01) return v.toFixed(4);
  return v.toExponential(1);
}

function timeLabel(ts: number, tf: OhlcvTimeframe): string {
  const d = new Date(ts * 1000);
  if (tf === "d1") return d.toLocaleDateString([], { month: "short", day: "numeric" });
  if (tf === "h4" || tf === "h1")
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit" });
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function PriceChart({
  pool,
  initial,
  symbol,
  bare = false,
}: {
  pool: string;
  initial: OhlcvPoint[];
  symbol: string;
  /** Drop the outer card chrome when embedded inside another panel. */
  bare?: boolean;
}) {
  const [tf, setTf] = useState<OhlcvTimeframe>("h1");
  const [mode, setMode] = useState<Mode>("candles");
  const [log, setLog] = useState(false);
  const [points, setPoints] = useState<OhlcvPoint[]>(initial);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(360, e.contentRect.width)));
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
      /* keep prior */
    } finally {
      setLoading(false);
    }
  }

  const plotW = Math.max(120, width - AXIS_W);

  const g = useMemo(() => {
    const n = points.length;
    if (n === 0) return null;
    let lo = Math.min(...points.map((p) => p.l || p.c));
    let hi = Math.max(...points.map((p) => p.h || p.c));
    if (log) {
      lo = Math.max(lo, 1e-18);
      hi = Math.max(hi, lo * 1.0001);
    }
    const vMax = Math.max(...points.map((p) => p.v), 1);
    const tf_ = log ? (v: number) => Math.log10(Math.max(v, 1e-18)) : (v: number) => v;
    const lo_ = tf_(lo);
    const hi_ = tf_(hi);
    const span = hi_ - lo_ || Math.abs(hi_) || 1;
    const x = (i: number) => (n <= 1 ? plotW / 2 : (i / (n - 1)) * (plotW - 8) + 4);
    const y = (v: number) => PAD + (1 - (tf_(v) - lo_) / span) * (H - 2 * PAD);
    const vy = (v: number) => VH - (v / vMax) * (VH - 4);
    const step = n > 1 ? (plotW - 8) / (n - 1) : plotW;
    const cw = Math.max(1.5, Math.min(9, step * 0.62));
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.c).toFixed(1)}`).join(" ");
    const area = `${line} L ${x(n - 1).toFixed(1)} ${H} L ${x(0).toFixed(1)} ${H} Z`;
    const up = points[n - 1].c >= points[0].c;
    // 5 evenly spaced price ticks across the visible range
    const ticks = Array.from({ length: 5 }, (_, k) => {
      const frac = k / 4;
      const val = log ? 10 ** (hi_ - frac * span) : hi - frac * (hi - lo);
      return { val, y: PAD + frac * (H - 2 * PAD) };
    });
    return { n, lo, hi, x, y, vy, cw, line, area, up, ticks };
  }, [points, plotW, log]);

  const hoverPt = hover != null ? points[hover] : null;
  const last = points[points.length - 1];
  const shown = hoverPt ?? last;
  const color = g?.up ? "var(--color-safe)" : "var(--color-risk)";
  const lastUp = shown && shown.c >= shown.o;
  const delta = shown ? shown.c - shown.o : 0;
  const deltaPct = shown && shown.o ? (delta / shown.o) * 100 : 0;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!g || g.n < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    if (px > plotW) return;
    const idx = Math.round((px / plotW) * (g.n - 1));
    setHover(Math.max(0, Math.min(g.n - 1, idx)));
  }

  // sparse time-axis ticks
  const timeTicks = useMemo(() => {
    if (!g || g.n < 2) return [];
    const count = Math.max(2, Math.min(6, Math.floor(plotW / 130)));
    return Array.from({ length: count }, (_, k) => {
      const i = Math.round((k / (count - 1)) * (g.n - 1));
      return { i, x: g.x(i), label: timeLabel(points[i].t, tf) };
    });
  }, [g, plotW, points, tf]);

  return (
    <div className={cn(!bare && "overflow-hidden rounded-2xl border border-hairline bg-panel/30")}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-hairline px-3 py-2">
        {/* timeframes */}
        <div className="flex items-center gap-0.5">
          {TFS.map((t) => (
            <button
              key={t.id}
              onClick={() => loadTf(t.id)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors",
                tf === t.id ? "bg-lime/15 text-lime" : "text-fg-dim hover:text-fg-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-3.5 w-px bg-hairline" />

        {/* mode */}
        <div className="flex rounded-md bg-panel-2 p-0.5">
          {(["candles", "line"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              title={m === "candles" ? "Candlestick" : "Line"}
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors",
                mode === m ? "bg-panel text-fg" : "text-fg-dim hover:text-fg-muted"
              )}
            >
              {m === "candles" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 3v4m0 10v4M17 3v6m0 8v4" />
                  <rect x="4" y="7" width="6" height="10" rx="1" />
                  <rect x="14" y="9" width="6" height="8" rx="1" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 16l5-6 4 4 6-8" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setLog((v) => !v)}
          title="Logarithmic price scale"
          className={cn(
            "rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors",
            log ? "bg-cortex/15 text-cortex" : "text-fg-dim hover:text-fg-muted"
          )}
        >
          log
        </button>

        {/* OHLC readout */}
        {shown && (
          <div className="tabular ml-auto flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-semibold text-fg-muted">{symbol}</span>
            {(["o", "h", "l", "c"] as const).map((k) => (
              <span key={k} className="text-fg-dim">
                {k.toUpperCase()}
                <span className={cn("ml-0.5 font-semibold", lastUp ? "text-safe" : "text-risk")}>
                  {fmtPrice(shown[k])}
                </span>
              </span>
            ))}
            <span className={cn("font-semibold", lastUp ? "text-safe" : "text-risk")}>
              {deltaPct >= 0 ? "+" : ""}
              {deltaPct.toFixed(2)}%
            </span>
            <span className="text-fg-dim">
              VOL <span className="font-semibold text-fg-muted">{fmtUsd(shown.v)}</span>
            </span>
          </div>
        )}
      </div>

      {/* chart */}
      <div ref={wrapRef} className="relative">
        {!g ? (
          <div className="flex items-center justify-center text-sm text-fg-dim" style={{ height: H + VH + TIME_H }}>
            No chart data for this timeframe.
          </div>
        ) : (
          <svg
            width={width}
            height={H + VH + TIME_H}
            className={cn("block transition-opacity", loading && "opacity-50")}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={`pcFill-${pool}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* price gridlines + right axis labels */}
            {g.ticks.map((t, i) => (
              <g key={i}>
                <line
                  x1={0}
                  x2={plotW}
                  y1={t.y}
                  y2={t.y}
                  stroke="var(--color-hairline)"
                  strokeOpacity="0.55"
                  strokeDasharray="2 4"
                />
                <text
                  x={plotW + 6}
                  y={t.y + 3}
                  className="tabular"
                  fontSize="10"
                  fill="var(--color-fg-dim)"
                >
                  {axisLabel(t.val)}
                </text>
              </g>
            ))}

            {/* all-time-high marker */}
            <line
              x1={0}
              x2={plotW}
              y1={g.y(g.hi)}
              y2={g.y(g.hi)}
              stroke="var(--color-wallet)"
              strokeOpacity="0.5"
              strokeDasharray="4 4"
            />
            <text x={4} y={g.y(g.hi) - 4} fontSize="9" fill="var(--color-wallet)" opacity="0.85">
              PERIOD HIGH
            </text>

            {/* series */}
            {mode === "line" ? (
              <>
                <path d={g.area} fill={`url(#pcFill-${pool})`} />
                <path d={g.line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
              </>
            ) : (
              points.map((p, i) => {
                const bull = p.c >= p.o;
                const c = bull ? "var(--color-safe)" : "var(--color-risk)";
                const yO = g.y(p.o);
                const yC = g.y(p.c);
                const top = Math.min(yO, yC);
                const hgt = Math.max(1, Math.abs(yC - yO));
                return (
                  <g key={p.t} opacity={hover == null || hover === i ? 1 : 0.72}>
                    <line x1={g.x(i)} x2={g.x(i)} y1={g.y(p.h)} y2={g.y(p.l)} stroke={c} strokeWidth={1} />
                    <rect x={g.x(i) - g.cw / 2} y={top} width={g.cw} height={hgt} fill={c} rx={0.5} />
                  </g>
                );
              })
            )}

            {/* current price line + badge */}
            {last && (
              <>
                <line
                  x1={0}
                  x2={plotW}
                  y1={g.y(last.c)}
                  y2={g.y(last.c)}
                  stroke={lastUp ? "var(--color-safe)" : "var(--color-risk)"}
                  strokeOpacity="0.7"
                  strokeDasharray="3 3"
                />
                <rect
                  x={plotW + 2}
                  y={g.y(last.c) - 8}
                  width={AXIS_W - 4}
                  height={16}
                  rx={3}
                  fill={lastUp ? "var(--color-safe)" : "var(--color-risk)"}
                />
                <text
                  x={plotW + 6}
                  y={g.y(last.c) + 4}
                  className="tabular"
                  fontSize="10"
                  fontWeight="700"
                  fill="var(--color-ink)"
                >
                  {axisLabel(last.c)}
                </text>
              </>
            )}

            {/* volume pane */}
            <g transform={`translate(0, ${H})`}>
              <text x={4} y={10} fontSize="9" fill="var(--color-fg-dim)">
                VOLUME
              </text>
              {points.map((p, i) => (
                <rect
                  key={p.t}
                  x={g.x(i) - g.cw / 2}
                  y={g.vy(p.v)}
                  width={g.cw}
                  height={Math.max(0.5, VH - g.vy(p.v))}
                  fill={p.c >= p.o ? "var(--color-safe)" : "var(--color-risk)"}
                  opacity={0.3}
                />
              ))}
            </g>

            {/* bottom time axis */}
            <g transform={`translate(0, ${H + VH})`}>
              <line x1={0} x2={plotW} y1={0} y2={0} stroke="var(--color-hairline)" />
              {timeTicks.map((t) => (
                <text
                  key={t.i}
                  x={Math.min(Math.max(t.x, 22), plotW - 22)}
                  y={12}
                  textAnchor="middle"
                  className="tabular"
                  fontSize="9"
                  fill="var(--color-fg-dim)"
                >
                  {t.label}
                </text>
              ))}
            </g>

            {/* crosshair */}
            {hover != null && hoverPt && (
              <>
                <line
                  x1={g.x(hover)}
                  x2={g.x(hover)}
                  y1={0}
                  y2={H + VH}
                  stroke="var(--color-fg-dim)"
                  strokeOpacity="0.45"
                  strokeDasharray="3 3"
                />
                <line
                  x1={0}
                  x2={plotW}
                  y1={g.y(hoverPt.c)}
                  y2={g.y(hoverPt.c)}
                  stroke="var(--color-fg-dim)"
                  strokeOpacity="0.3"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={g.x(hover)}
                  cy={g.y(hoverPt.c)}
                  r={3.5}
                  fill={color}
                  stroke="var(--color-ink)"
                  strokeWidth={1.5}
                />
              </>
            )}
          </svg>
        )}

        {hoverPt && (
          <div className="tabular pointer-events-none absolute bottom-5 left-2 rounded bg-panel-2/95 px-2 py-1 text-[10px] text-fg-muted">
            {new Date(hoverPt.t * 1000).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
