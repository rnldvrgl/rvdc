import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/helpers"

/**
 * Skeleton for dashboard stat cards (like SalesSummary's 3 stat blocks)
 */
export function StatCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-lg border space-y-2"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Enhanced skeleton for modern stat cards with shimmer effect
 */
export function ModernStatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="overflow-hidden"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="size-12 rounded-xl" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton for dashboard list cards (like RecentTransactions)
 */
export function ListCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton for detail sheet/panel content (used in EntitySheet)
 */
export function DetailSkeleton({
  sections = 2,
  fieldsPerSection = 4,
}: {
  sections?: number
  fieldsPerSection?: number
}) {
  return (
    <div className="space-y-6">
      {Array.from({ length: sections }).map((_, s) => (
        <Card
          key={s}
          className="overflow-hidden"
        >
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {Array.from({ length: fieldsPerSection }).map((_, f) => (
              <div
                key={f}
                className="flex items-start gap-3 py-2"
              >
                <Skeleton className="size-4 rounded mt-1 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full max-w-60" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton for table rows with shimmer effect
 */
export function TableRowSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr
          key={i}
          className="border-b"
        >
          {Array.from({ length: columns }).map((_, j) => (
            <td
              key={j}
              className="p-4"
            >
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/**
 * Skeleton for chart/graph loading
 */
export function ChartSkeleton({ height = "h-[350px]" }: { height?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "w-full bg-muted/30 rounded-lg flex items-end justify-around p-4 gap-2",
            height,
          )}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-t-md"
              style={{ height: `${40 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton for kanban board columns
 */
export function KanbanSkeleton({
  columns = 4,
  cardsPerColumn = 2,
}: {
  columns?: number
  cardsPerColumn?: number
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columns }).map((_, c) => (
        <div
          key={c}
          className="min-w-[280px] flex-1 space-y-3"
        >
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          {Array.from({ length: cardsPerColumn }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border space-y-2"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Full-page centered loading skeleton (replaces Loader2 spinners)
 */
export function PageLoadingSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Skeleton className="size-12 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Inline card loading skeleton (replaces CSS spinners inside dashboard cards)
 */
export function CardLoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-6", className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative size-10">
          <div className="size-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
