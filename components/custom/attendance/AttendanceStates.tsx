import { Clock, Users } from "lucide-react"

export const LoadingState = () => {
  return (
    <div className="text-center py-12 md:py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse">
          <Clock className="h-8 w-8 text-slate-400" />
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
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <div>
          <p className="text-sm md:text-base font-medium text-slate-900 dark:text-slate-100">
            No attendance records found
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Records will appear here once created
          </p>
        </div>
      </div>
    </div>
  )
}
