import { cn } from "@/lib/utils";

/** The RetinaOS eye/aperture mark, rebuilt as crisp SVG from the logo. */
export function RetinaMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} fill="none" aria-hidden>
      {/* eye outline */}
      <path
        d="M4 32C4 32 15 16 32 16C49 16 60 32 60 32C60 32 49 48 32 48C15 48 4 32 4 32Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* iris */}
      <circle cx="32" cy="32" r="11" fill="currentColor" />
      {/* pupil highlight */}
      <circle cx="36.5" cy="27.5" r="3.4" fill="var(--color-ink)" />
      {animated && (
        <circle
          cx="32"
          cy="32"
          r="20"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 6"
          opacity="0.5"
          className="animate-sweep"
          style={{ transformOrigin: "32px 32px" }}
        />
      )}
    </svg>
  );
}

export function RetinaWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <RetinaMark className="size-7 text-lime" />
      <span className="text-lg font-bold tracking-tight">
        Retina<span className="text-lime">OS</span>
      </span>
    </span>
  );
}
