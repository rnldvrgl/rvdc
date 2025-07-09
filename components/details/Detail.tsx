import { safeCell } from '@/lib/utils/helpers'
import React from 'react'

export const Detail = ({
  label,
  value,
  icon,
  horizontal = false,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  horizontal?: boolean
}) => {
  return horizontal ? (
    <div className="flex items-center gap-3">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-medium">{safeCell(value)}</p>
      </div>
    </div>
  ) : (
    <div className="flex items-start gap-3">
      {icon && <div className="text-muted-foreground pt-1">{icon}</div>}
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="font-semibold">{safeCell(value)}</div>
      </div>
    </div>
  )
}
