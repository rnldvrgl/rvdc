"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { ServerMaintenanceCard } from "@/components/forms/ServerMaintenanceCard"
import { Server } from "lucide-react"

export default function ServerMaintenancePage() {
    return (
        <Wrapper>
            <PageHeader
                icon={Server}
                title="Server Maintenance"
                description="Monitor disk usage and clean up Docker resources"
                isAdminOnly
                breadcrumbs={["Settings", "Server Maintenance"]}
            />

            <div className="space-y-6">
                <ServerMaintenanceCard />
            </div>
        </Wrapper>
    )
}
