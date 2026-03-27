"use client"

import { AdminSessionsTable } from "@/components/custom/admin/AdminSessionsTable"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useQueryClient } from "@tanstack/react-query"
import { Lock } from "lucide-react"
import { useState } from "react"

export default function AdminSessionsPage() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({
      queryKey: ["admin-sessions"],
    })
    setIsRefreshing(false)
  }

  return (
    <Wrapper>
      <PageHeader
        icon={Lock}
        title="Active Sessions"
        description="Monitor and manage all user sessions across devices"
        breadcrumbs={["Settings", "Active Sessions"]}
      />

      <div className="space-y-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              View and revoke active sessions for all users. Revoking a session will
              automatically log out the user from that device.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Active Sessions</CardTitle>
            <CardDescription>
              List of all currently active user sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminSessionsTable />
          </CardContent>
        </Card>
      </div>
    </Wrapper>
  )
}
