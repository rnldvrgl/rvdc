import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DailyAttendance } from "@/lib/constants/types"
import { Clock } from "lucide-react"
import { AttendanceRecordItem } from "./AttendanceRecordItem"
import { EmptyState } from "@/components/custom/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"

interface RecentActivitySectionProps {
    records: DailyAttendance[]
    isLoading: boolean
    showEmployeeCount?: boolean
}

const DOT_OFFSET = "14px"

const TimelineSkeletonRow = ({ isFirst = false, isLast = false }: { isFirst?: boolean; isLast?: boolean }) => (
    <div className="flex gap-2.5 px-3 md:gap-3 md:px-5">
        <div className="relative flex w-2.5 shrink-0 justify-center">
            {!isFirst && <span className="absolute top-0 w-px bg-border" style={{ height: DOT_OFFSET }} />}
            {!isLast && <span className="absolute bottom-0 w-px bg-border" style={{ top: DOT_OFFSET }} />}
            <Skeleton
                className="absolute size-2.5 rounded-full"
                style={{ top: `calc(${DOT_OFFSET} - 5px)` }}
            />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 py-2 md:py-2.5">
            <div className="flex items-baseline justify-between gap-3">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-36" />
        </div>
    </div>
)

export const RecentActivitySection = ({
    records,
    isLoading,
    showEmployeeCount = true,
}: RecentActivitySectionProps) => {
    const hasRecords = !isLoading && records && records.length > 0
    const visibleRecords = records?.slice(0, 10) ?? []

    return (
        <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4 md:py-6">
                <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
                    <div className="flex flex-col items-center gap-2 sm:flex-row">
                        <div className="w-fit rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800">
                            <Clock className="size-3.5 text-slate-600 dark:text-slate-400 md:size-4" />
                        </div>
                        <CardTitle className="text-sm font-semibold md:text-base lg:text-lg">
                            Recent Activity
                        </CardTitle>
                    </div>
                    {showEmployeeCount && hasRecords && (
                        <span className="text-[10px] text-muted-foreground md:text-xs">
                            Showing {visibleRecords.length} of last 10
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {isLoading ? (
                    <div className="py-1.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <TimelineSkeletonRow key={i} isFirst={i === 0} isLast={i === 5} />
                        ))}
                    </div>
                ) : hasRecords ? (
                    <div className="py-1.5">
                        {visibleRecords.map((record, i) => (
                            <AttendanceRecordItem
                                key={record.id}
                                record={record}
                                index={i}
                                isFirst={i === 0}
                                isLast={i === visibleRecords.length - 1}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No recent activity"
                        description="You have no recent attendance records."
                        icon={Clock}
                    />
                )}
            </CardContent>
        </Card>
    )
}
