import { AnimatedNumber } from "@/components/custom/shared/charts/MotionWrappers"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils/helpers"
import { LucideIcon } from "lucide-react"

export type StatTone = "success" | "destructive" | "warning" | "info" | "primary"

const toneClasses: Record<StatTone, { card: string; icon: string; title: string; value: string }> = {
    success: {
        card: "bg-success/5 border-success/20",
        icon: "bg-success/15 text-success",
        title: "text-success",
        value: "text-success",
    },
    destructive: {
        card: "bg-destructive/5 border-destructive/20",
        icon: "bg-destructive/15 text-destructive",
        title: "text-destructive",
        value: "text-destructive",
    },
    warning: {
        card: "bg-warning/5 border-warning/20",
        icon: "bg-warning/15 text-warning",
        title: "text-warning",
        value: "text-warning",
    },
    info: {
        card: "bg-info/5 border-info/20",
        icon: "bg-info/15 text-info",
        title: "text-info",
        value: "text-info",
    },
    primary: {
        card: "bg-primary/5 border-primary/20",
        icon: "bg-primary/15 text-primary",
        title: "text-primary",
        value: "text-primary",
    },
}

interface GradientStatCardProps {
    title: string
    value: number
    subtitle: string
    icon: LucideIcon
    tone: StatTone
    isLoading?: boolean
}

export const GradientStatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    tone,
    isLoading = false,
}: GradientStatCardProps) => {
    const classes = toneClasses[tone]

    return (
        <Card className={cn("transition-all duration-300 hover:shadow-md", classes.card)}>
            <CardContent>
                <div className="flex items-center gap-2 mb-2">
                    <div className={cn("p-1.5 rounded-md", classes.icon)}>
                        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </div>
                    <p className={cn("text-xs md:text-sm font-medium", classes.title)}>{title}</p>
                </div>
                <p className={cn("text-2xl md:text-3xl font-bold tabular-nums", classes.value)}>
                    {isLoading ? (
                        <span className="text-muted-foreground/50">—</span>
                    ) : (
                        <AnimatedNumber value={value} />
                    )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </CardContent>
        </Card>
    )
}
