import { cn, safeCell } from '@/lib/utils/helpers'
import React from 'react'

export const Detail = ({
  label,
  value,
  icon,
  horizontal = false,
  className,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  horizontal?: boolean
  className?: string
}) => {
  return horizontal ? (
    <div className="flex items-center gap-3">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-base font-medium', className)}>
          {safeCell(value)}
        </p>
      </div>
    </div>
  ) : (
    <div className="flex items-start gap-3">
      {icon && <div className="text-muted-foreground pt-1">{icon}</div>}
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn('font-semibold', className)}>{safeCell(value)}</div>
      </div>
    </div>
  )
}
