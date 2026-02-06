"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useServices } from "@/lib/queries/services/useServices"
import { CheckCircle2, Clock, Wrench } from "lucide-react"

export function MyTasksCard() {
  const { user_id } = useCurrentUser()
  const { data: servicesData, isLoading } = useServices()
  const services = servicesData?.results || []

  // Filter services assigned to current user as technician
  const myServices = services.filter((service) =>
    service.technician_assignments?.some(
      (assignment) => assignment.technician === user_id,
    ),
  )

  const pendingServices = myServices.filter(
    (s) => s.status === "pending" || s.status === "in_progress",
  )
  const completedToday = myServices.filter((s) => {
    if (s.status !== "completed") return false
    const completedDate = new Date(s.updated_at)
    const today = new Date()
    return completedDate.toDateString() === today.toDateString()
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="size-5" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="size-5" />
          My Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="size-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {pendingServices.length}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-green-50/50 dark:bg-green-900/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="size-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {completedToday.length}
            </p>
          </div>
        </div>

        {pendingServices.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Recent Tasks
            </p>
            {pendingServices.slice(0, 3).map((service, index) => (
              <div
                key={index}
                className="p-2 rounded border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {service.client.full_name}
                  </p>
                  <Badge
                    variant={
                      service.status === "in_progress" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {service.status === "in_progress"
                      ? "In Progress"
                      : "Pending"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {service.service_type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
