import { ReactNode } from 'react'

interface ChartWrapperProps {
  children: ReactNode
  isEmpty?: boolean
  emptyMessage?: string
  height?: number
}

export function ChartWrapper({
  children,
  isEmpty,
  emptyMessage = 'No data to display',
  height = 300,
}: ChartWrapperProps) {
  return (
    <div className="w-full min-h-[350px]">
      {isEmpty ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground border rounded-md">
          {emptyMessage}
        </div>
      ) : (
        <div style={{ width: '100%', height }}>{children}</div>
      )}
    </div>
  )
}
