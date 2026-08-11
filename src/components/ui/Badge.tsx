import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/** Variantes visuales de la insignia ("badge"). */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        muted: 'border-border bg-muted/60 text-muted-foreground',
        success: 'border-transparent bg-success/15 text-success',
        danger: 'border-transparent bg-danger/15 text-danger',
        accent: 'border-transparent bg-accent/15 text-accent',
        outline: 'border-border text-foreground/80',
        warning: 'border-transparent bg-amber-500/15 text-amber-400',
        violet: 'border-transparent bg-indigo-500/15 text-indigo-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }