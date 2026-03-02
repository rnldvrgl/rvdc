import { Clock, Users } from "lucide-react"

export const LoadingState = () => {
  return (
    <div className="text-center py-12 md:py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center size-14 rounded-xl bg-muted/60 text-muted-foreground animate-pulse">
          <Clock className="size-7" />
        </div>
        <p className="text-sm text-muted-foreground">Loading records...</p>
      </div>
    </div>
  )
}

export const EmptyState = () => {
  return (
    <div className="text-center py-12 md:py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center size-14 rounded-xl bg-muted/60 text-muted-foreground">
          <Users className="size-7" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">
            No attendance records found
          </p>
          <p className="text-sm text-muted-foreground">
            Records will appear here once created
          </p>
        </div>
      </div>
    </div>
  )
}
