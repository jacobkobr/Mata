import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const progressBarVariants = cva('h-full rounded-full transition-all duration-200', {
  variants: {
    variant: {
      default: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface ProgressBarProps extends VariantProps<typeof progressBarVariants> {
  /** 0-100 */
  value: number
  className?: string
  trackClassName?: string
  label?: string
}

function ProgressBar({ value, variant, className, trackClassName, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-secondary', trackClassName)}
    >
      <div className={cn(progressBarVariants({ variant }), className)} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export { ProgressBar, progressBarVariants }
