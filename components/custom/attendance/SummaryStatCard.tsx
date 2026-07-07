import { AnimatedNumber } from "@/components/custom/shared/charts/MotionWrappers"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils/helpers"
import type { LucideIcon } from "lucide-react"
import type { StatTone } from "./GradientStatCard"
import { Format } from "@number-flow/react"

const toneClasses: Record<StatTone, string> = {
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
    primary: "bg-primary/15 text-primary",
}

export function SummaryStatCard({
    icon: Icon,
    tone,
    title,
    value,
    description,
    format,
}: {
    icon: LucideIcon
    tone: StatTone
    title: string
    value: number
    description: string
    format?: Format
}) {
    return (
        <Card>
            <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", toneClasses[tone])}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                </div>
                <AnimatedNumber
                    className="text-4xl md:text-5xl font-semibold tabular-nums"
                    value={value}
                    format={format}
                />
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}
