"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { BirthdayGreetingSettingsForm } from "@/components/forms/BirthdayGreetingSettingsForm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSystemSettings } from "@/lib/queries/useSystemSettings"
import { Cake } from "lucide-react"

export default function SystemSettingsPage() {
  const { data: settings, isLoading } = useSystemSettings()

  return (
    <Wrapper>
      <PageHeader
        title="Birthday Greeting Settings"
        description="Manage birthday greeting modal behavior and message"
        breadcrumbs={["Settings", "Birthday Greeting Settings"]}
      />

      <div className="space-y-6">
        {/* Birthday Greeting Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-pink-500" />
              <CardTitle>Birthday Greeting Settings</CardTitle>
            </div>
            <CardDescription>
              Configure birthday greeting modal behavior and message
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : settings ? (
              <BirthdayGreetingSettingsForm settings={settings} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Failed to load system settings
              </div>
            )}
          </CardContent>
        </Card>

        {/* Future Settings Cards */}
        {/* Add more setting cards here as needed */}
      </div>
    </Wrapper>
  )
}
