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
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Items Review
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4 text-orange-500" />
          Items Pending Review
          <Badge
            variant="destructive"
            className="ml-auto text-xs"
          >
            {data.total_pending_items ?? data.total_unchecked_appliances}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {data.total_pending_services} service
          {data.total_pending_services > 1 ? "s" : ""} with{" "}
          {data.total_pending_items ?? data.total_unchecked_appliances} pending{" "}
          review
          {(data.total_pending_items ?? data.total_unchecked_appliances) > 1
            ? "s"
            : ""}
        </p>

        <div className="space-y-2">
          {data.services.slice(0, 5).map((svc) => (
            <button
              key={svc.service_id}
              type="button"
              onClick={() => router.push(`/services?view=${svc.service_id}`)}
              className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm hover:bg-muted/50 transition-colors w-full text-left"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {svc.client_name || "Unknown Client"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {svc.service_type}
                  {svc.unchecked_appliances > 0 && (
                    <>
                      {" "}
                      · {svc.unchecked_appliances} of {svc.total_appliances}{" "}
                      unchecked
                    </>
                  )}
                  {svc.has_service_level_pending && (
                    <> · service parts pending</>
                  )}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>

        {data.total_pending_services > 5 && (
          <Link
            href="/services"
            className="flex items-center justify-center gap-1 text-xs text-primary hover:underline pt-1"
          >
            View all {data.total_pending_services} services
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
