"use client"

import MyOffenses from "@/components/custom/attendance/MyOffenses"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { useMyOffenses } from "@/lib/queries/useAttendance"
import { AlertTriangle } from "lucide-react"

export default function MyOffensesPage() {
    const { refetch } = useMyOffenses()

    return (
        <Wrapper>
            <PageHeader
                variant="compact"
                icon={AlertTriangle}
                title="My Offenses"
                description="View your policy violation records and maintain compliance"
                onRefresh={refetch}
            />
            <MyOffenses />
        </Wrapper>
    )
}
