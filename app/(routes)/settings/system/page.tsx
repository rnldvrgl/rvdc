"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { BirthdayGreetingSettingsForm } from "@/components/forms/BirthdayGreetingSettingsForm"
import { BusinessOperationsSettingsForm } from "@/components/forms/BusinessOperationsSettingsForm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSystemSettings } from "@/lib/queries/useSystemSettings"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { Cake, Settings2, Sparkles } from "lucide-react"

export default function SystemSettingsPage() {
  const { data: settings, isLoading } = useSystemSettings()
  const { isSuperAdmin, isAdmin } = useCurrentUser()

  return (
    <Wrapper>
      <PageHeader
        title="System Settings"
        description="Control operations, alerts, and greeting behavior from one place"
        breadcrumbs={["Settings", "System Settings"]}
      />

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Tabs defaultValue={(isSuperAdmin || isAdmin) ? "operations" : "birthday"} className="space-y-4">
          <TabsList className="grid h-auto w-full gap-1 grid-cols-1 sm:grid-cols-2">
            {(isSuperAdmin || isAdmin) && <TabsTrigger value="operations" className="w-full">Business Operations</TabsTrigger>}
            <TabsTrigger value="birthday" className="w-full">Birthday Settings</TabsTrigger>
          </TabsList>

          {(isSuperAdmin || isAdmin) && (
            <TabsContent value="operations" className="space-y-4">
              <Card className="border-primary/20 bg-linear-to-b from-primary/5 to-background">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    <CardTitle>Business Operations</CardTitle>
                  </div>
                  <CardDescription>
                    Critical runtime controls and notification behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-28 w-full" />
                    </div>
                  ) : settings ? (
                    <BusinessOperationsSettingsForm settings={settings} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Failed to load system settings
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="birthday" className="space-y-4">
            <Card className="border-pink-200/60">
              <CardHeader className="pb-3">
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
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
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
          </TabsContent>
        </Tabs>

        <Card className="h-fit xl:sticky xl:top-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Admin Notes</CardTitle>
            </div>
            <CardDescription>
              Quick reminders to keep system settings safe and consistent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>Use maintenance mode only during planned updates.</p>
            <p>Keep notification sounds short for faster push playback.</p>
            <p>Review birthday greeting copy monthly for relevance.</p>
            <p>After major backend updates, reinstall cron jobs from maintenance.</p>
          </CardContent>
        </Card>
      </div>
    </Wrapper>
  )
}
