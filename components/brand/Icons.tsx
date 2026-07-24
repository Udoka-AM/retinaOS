import { cn } from "@/lib/utils";

/* ============================================================
   RetinaOS custom icon set
   Brand motifs: eye · reticle · aperture · neural-node · scan
   All icons are 24×24, currentColor, crisp on any accent.
   ============================================================ */

type IconProps = {
  className?: string;
  size?: number;
  strokeWidth?: number;
};

function Svg({
  className,
  size = 24,
  strokeWidth = 1.5,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* ---------- Sight / eye-aperture ---------- */
export function IconSight(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M12 2.5v1.6M12 19.9v1.6M4.2 6.3l1 1M18.8 6.3l-1 1" opacity="0.55" />
    </Svg>
  );
}

/* ---------- Intelligence / neural node map ---------- */
export function IconNeural(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 11.8 6 7M12 11.8 18 7.4M12 11.8 7.6 17M12 11.8 15.4 17.4M6 7l1.6 10M18 7.4 15.4 17.4M6 7l12 .4" opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="6" cy="7" r="1.5" />
      <circle cx="18" cy="7.4" r="1.5" />
      <circle cx="7.6" cy="17" r="1.5" />
      <circle cx="15.4" cy="17.4" r="1.5" />
    </Svg>
  );
}

/* ---------- Speed / bolt inside reticle ---------- */
export function IconSpeed(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" opacity="0.5" strokeDasharray="2 3" />
      <path d="M13 4.5 7.5 12.8h4l-1 6.7L17 11.2h-4l1-6.7Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/* ---------- Retina Terminal / scanning reticle ---------- */
export function IconReticle(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" />
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/* ---------- Cortex / bracketed brain-scan ---------- */
export function IconCortex(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 7.5V5.5A1.5 1.5 0 0 1 5.5 4h2M16.5 4h2A1.5 1.5 0 0 1 20 5.5v2M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-2M7.5 20h-2A1.5 1.5 0 0 1 4 18.5v-2" opacity="0.6" />
      <path d="M12 7.4c-1.8 0-2.7 1.1-2.7 2.2-.9.2-1.5 1-1.5 1.9 0 .8.5 1.5 1.2 1.8-.1 1.2.8 2.3 2.2 2.3M12 7.4c1.8 0 2.7 1.1 2.7 2.2.9.2 1.5 1 1.5 1.9 0 .8-.5 1.5-1.2 1.8.1 1.2-.8 2.3-2.2 2.3M12 7.4v8.2" />
    </Svg>
  );
}

/* ---------- Retina Wallet / aperture shield ---------- */
export function IconAperture(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.5 4.5 5.5v5.4c0 4.3 3 7.4 7.5 9.1 4.5-1.7 7.5-4.8 7.5-9.1V5.5L12 2.5Z" />
      <circle cx="12" cy="11" r="3.4" />
      <path d="M12 7.6v6.8M8.6 11h6.8M9.6 8.6l4.8 4.8M14.4 8.6 9.6 13.4" opacity="0.55" />
    </Svg>
  );
}

/* ---------- Discover / scan sweep ---------- */
export function IconScan(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4.5 12h15" className="text-current" />
      <circle cx="12" cy="12" r="3" opacity="0.5" />
    </Svg>
  );
}

/* ---------- Analyze / layered scan lines ---------- */
export function IconAnalyze(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 10.5h4l1.5-3 2 6 1.2-3H18" />
      <circle cx="12" cy="12" r="0.7" fill="currentColor" stroke="none" opacity="0" />
    </Svg>
  );
}

/* ---------- Execute / shutter blades ---------- */
export function IconShutter(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5 8.3 12h7.4L12 3.5ZM20.5 12l-4.2-3.6-3.7 6.6 5.7.9M8.3 12l-4.8.5 4.2 5.6 3.7-6.6M12 20.5l3.7-6.6H8.3L12 20.5Z" opacity="0.7" />
    </Svg>
  );
}

/* ---------- Gauge / risk score ---------- */
export function IconGauge(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16 15.5 10" />
      <circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <path d="M5.5 15.2 6.8 14.7M18.5 15.2 17.2 14.7M8 9.6l.9 1M16 9.6l-.9 1M12 6.5V8" opacity="0.55" />
    </Svg>
  );
}

/* ---------- Cluster / holders + sybil ---------- */
export function IconCluster(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="5" cy="6.5" r="1.6" />
      <circle cx="19" cy="7" r="1.6" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="18.5" cy="17.5" r="1.6" />
      <path d="M10.2 10.6 6.3 7.6M13.9 10.7 17.5 8M10 13.6 7.1 16.6M14 13.7l3.2 2.6" opacity="0.5" />
    </Svg>
  );
}

/* ---------- Shield alert / risk flags ---------- */
export function IconShieldAlert(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.5 4.5 5.5v5.4c0 4.3 3 7.4 7.5 9.1 4.5-1.7 7.5-4.8 7.5-9.1V5.5L12 2.5Z" />
      <path d="M12 7.5v4.2" />
      <circle cx="12" cy="15" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/* ---------- Radar ping / alerts ---------- */
export function IconRadar(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4a8 8 0 1 1-5.6 2.3" />
      <path d="M12 8a4 4 0 1 1-2.8 1.2" opacity="0.7" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 12 18 6" />
    </Svg>
  );
}

/* ---------- Timing / entry signal ---------- */
export function IconTiming(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 15.5 8 11l3 2.5L14 8l2.5 3 4-5.5" />
      <circle cx="14" cy="8" r="1.6" fill="currentColor" stroke="none" />
      <path d="M3.5 19.5h17" opacity="0.4" />
    </Svg>
  );
}

/* ---------- Spark / AI ---------- */
export function IconSpark(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.5c.4 3.6 1.9 5.1 5.5 5.5-3.6.4-5.1 1.9-5.5 5.5-.4-3.6-1.9-5.1-5.5-5.5 3.6-.4 5.1-1.9 5.5-5.5Z" fill="currentColor" stroke="none" />
      <path d="M18.5 14.5c.2 1.7.9 2.4 2.6 2.6-1.7.2-2.4.9-2.6 2.6-.2-1.7-.9-2.4-2.6-2.6 1.7-.2 2.4-.9 2.6-2.6Z" fill="currentColor" stroke="none" opacity="0.7" />
    </Svg>
  );
}

/* ---------- Small utility marks (hero trust row) ---------- */
export function IconTrend(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 16 9 10.5l3 3 6.5-7" />
      <path d="M15 6.5h4v4" />
    </Svg>
  );
}

export function IconLock(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconArrowUpRight(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 17 17 7M8.5 7H17v8.5" />
    </Svg>
  );
}
