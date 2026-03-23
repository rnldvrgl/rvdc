"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { ServerMaintenanceCard } from "@/components/forms/ServerMaintenanceCard"

export default function ServerMaintenancePage() {
  return (
    <Wrapper>
      <PageHeader
        title="Server Maintenance"
        description="Monitor disk usage and clean up Docker resources"
        breadcrumbs={["Settings", "Server Maintenance"]}
      />

      <div className="space-y-6">
        <ServerMaintenanceCard />
      </div>
    </Wrapper>
  )
}
