import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  iconBgColor: string
  iconColor: string
  valueColor: string
  isLoading?: boolean
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
  valueColor,
  isLoading = false,
}: StatCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`h-3 w-3 md:h-4 md:w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl md:text-3xl font-bold ${valueColor}`}>
          {isLoading ? <span className="animate-pulse">...</span> : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 hidden md:block">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
