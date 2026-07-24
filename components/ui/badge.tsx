import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-hairline bg-panel/60 text-fg-muted",
        lime: "border-lime/30 bg-lime/10 text-lime",
        cortex: "border-cortex/30 bg-cortex/10 text-cortex",
        wallet: "border-wallet/30 bg-wallet/10 text-wallet",
        risk: "border-risk/30 bg-risk/10 text-risk",
        safe: "border-safe/30 bg-safe/10 text-safe",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
