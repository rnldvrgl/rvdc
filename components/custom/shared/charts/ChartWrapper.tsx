import { EmptyState } from "@/components/custom/EmptyState"
import { BarChart3 } from "lucide-react"
import { ReactNode } from "react"

interface ChartWrapperProps {
    children: ReactNode
    isEmpty?: boolean
    emptyMessage?: string
    height?: number
}

export function ChartWrapper({
    children,
    isEmpty,
    emptyMessage = "No data to display",
    height = 300,
}: ChartWrapperProps) {
    return (
        <div className="w-full min-h-[350px] flex items-center justify-center">
            {isEmpty ? (
                <EmptyState
                    icon={BarChart3}
                    title="No data"
                    description={emptyMessage}
                />
            ) : (
                <div style={{ width: "100%", height }}>{children}</div>
            )}
        </div>
    )
}
