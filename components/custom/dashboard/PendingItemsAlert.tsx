"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePendingItemsStats } from "@/lib/queries/services/usePendingItemsStats"
import { ArrowRight, CheckCircle, Package } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function PendingItemsAlert() {
  const router = useRouter()
  const { data } = usePendingItemsStats()

  if (!data || data.total_pending_services === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950 shrink-0">
              <CheckCircle className="size-4 text-success" />
            </div>
            <span className="truncate">Items Review</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All service items have been confirmed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950 shrink-0">
            <Package className="size-4 text-orange-600 dark:text-orange-400" />
          </div>
          <span className="truncate">Items Pending Review</span>
          <Badge
            variant="destructive"
            className="ml-auto text-xs shrink-0"
          >
            {data.total_pending_items ?? data.total_unchecked_appliances}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-2">
          {data.services.slice(0, 5).map((svc) => (
            <button
              key={svc.service_id}
              type="button"
              onClick={() => router.push(`/services?view=${svc.service_id}`)}
              className="group flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-all w-full text-left cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate capitalize">
                  {svc.client_name || "Unknown Client"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {svc.service_type}
                  {svc.unchecked_appliances > 0 && (
                    <>
                      {" "}
                      · {svc.unchecked_appliances} of {svc.total_appliances}{" "}
                      Unchecked
                    </>
                  )}
                  {svc.has_service_level_pending && <> · Parts Pending</>}
                </p>
              </div>
              {(svc.unchecked_appliances > 0 ||
                svc.has_service_level_pending) && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400"
                >
                  {svc.unchecked_appliances > 0
                    ? svc.unchecked_appliances
                    : "!"}
                </Badge>
              )}
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>

        {data.total_pending_services > 5 && (
          <Link
            href="/services"
            className="group flex items-center justify-center gap-1 text-xs text-primary hover:underline pt-1"
          >
            View All {data.total_pending_services} Services
            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
