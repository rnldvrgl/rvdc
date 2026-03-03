"use client"

import { ListCardSkeleton } from "@/components/custom/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AirconUnits } from "@/lib/constants/interface"
import { useAirconUnits } from "@/lib/queries/useAircons"
import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react"
import Link from "next/link"
import React from "react"

export function WarrantyExpirationAlerts() {
  // Fetch sold/installed units (they're the ones with active warranties)
  const { data, isLoading } = useAirconUnits({
    filter: { is_sold: "true" },
    limit: 100,
  })
  const units = React.useMemo(() => data?.results ?? [], [data])

  // Categorize by warranty urgency
  const { expired, critical, warning } = React.useMemo(() => {
    const expired: AirconUnits[] = []
    const critical: AirconUnits[] = [] // ≤30 days left
    const warning: AirconUnits[] = [] // 31-90 days left

    for (const unit of units) {
      const daysLeft = Math.min(
        unit.warranty_days_left ?? Infinity,
        unit.parts_warranty_days_left ?? Infinity,
        unit.labor_warranty_days_left ?? Infinity,
      )
      if (daysLeft <= 0 && unit.warranty_status !== "No Warranty") {
        expired.push(unit)
      } else if (daysLeft > 0 && daysLeft <= 30) {
        critical.push(unit)
      } else if (daysLeft > 30 && daysLeft <= 90) {
        warning.push(unit)
      }
    }
    return { expired, critical, warning }
  }, [units])

  const totalAlerts = expired.length + critical.length + warning.length

  if (isLoading) {
    return <ListCardSkeleton rows={3} />
  }

  const unitLabel = (unit: AirconUnits) => {
    const serial = unit.serial_number || unit.outdoor_serial_number || "—"
    const model = unit.model?.name || ""
    return `${serial}${model ? ` · ${model}` : ""}`
  }

  const renderGroup = (
    items: AirconUnits[],
    title: string,
    icon: React.ReactNode,
    borderClass: string,
    bgClass: string,
    textClass: string,
    subtextClass: string,
  ) => {
    if (items.length === 0) return null
    const shown = items.slice(0, 3)
    const remaining = items.length - shown.length
    return (
      <Link href="/aircons/units">
        <div
          className={`p-3 rounded-lg border ${borderClass} ${bgClass} hover:opacity-80 transition-colors`}
        >
          <div className="flex items-start gap-2">
            {icon}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${textClass}`}>{title}</p>
              <ul className={`text-xs ${subtextClass} mt-1 space-y-0.5`}>
                {shown.map((u) => (
                  <li
                    key={u.id}
                    className="truncate"
                  >
                    • {unitLabel(u)}
                  </li>
                ))}
              </ul>
              {remaining > 0 && (
                <p
                  className={`text-xs ${subtextClass} mt-1`}
                  suppressHydrationWarning
                >
                  +{remaining} more...
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="size-5" />
          Warranty Alerts
          {totalAlerts > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto"
              suppressHydrationWarning
            >
              {totalAlerts}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalAlerts === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <ShieldCheck className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              All warranties are in good standing
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {renderGroup(
              expired,
              `${expired.length} Expired Warrant${expired.length !== 1 ? "ies" : "y"}`,
              <ShieldX className="size-4 text-red-600 mt-0.5 shrink-0" />,
              "border-red-200",
              "bg-red-50/50 dark:bg-red-900/10",
              "text-red-900 dark:text-red-100",
              "text-red-700 dark:text-red-300",
            )}
            {renderGroup(
              critical,
              `${critical.length} Expiring Within 30 Days`,
              <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />,
              "border-amber-200",
              "bg-amber-50/50 dark:bg-amber-900/10",
              "text-amber-900 dark:text-amber-100",
              "text-amber-700 dark:text-amber-300",
            )}
            {renderGroup(
              warning,
              `${warning.length} Expiring Within 90 Days`,
              <ShieldAlert className="size-4 text-blue-600 mt-0.5 shrink-0" />,
              "border-blue-200",
              "bg-blue-50/50 dark:bg-blue-900/10",
              "text-blue-900 dark:text-blue-100",
              "text-blue-700 dark:text-blue-300",
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
