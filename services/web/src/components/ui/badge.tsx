import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors border",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary border-primary/25 hover:bg-primary/25",
        secondary:
          "bg-secondary text-secondary-foreground border-border/50",
        success:
          "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25",
        warning:
          "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25",
        danger:
          "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25",
        info:
          "bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/25",
        purple:
          "bg-purple-500/15 text-purple-400 border-purple-500/25 hover:bg-purple-500/25",
        outline:
          "border-border/70 text-muted-foreground bg-transparent",
        present:
          "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        late:
          "bg-amber-500/15 text-amber-400 border-amber-500/25",
        absent:
          "bg-red-500/15 text-red-400 border-red-500/25",
        leave:
          "bg-blue-500/15 text-blue-400 border-blue-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
