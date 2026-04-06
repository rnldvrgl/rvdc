"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useOperationsSettingsMutations } from "@/lib/mutations/useOperationsSettingsMutations"
import { SystemSettings } from "@/lib/queries/useSystemSettings"
import { PackageCheck, Wrench } from "lucide-react"

interface Props {
  settings: SystemSettings
}

export function BusinessOperationsSettingsForm({ settings }: Props) {
  const { updateOperationsSettings } = useOperationsSettingsMutations()

  return (
    <div className="space-y-5">
      {/* Maintenance Mode */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Wrench className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Maintenance Mode</Label>
            <p className="text-xs text-muted-foreground">
              When enabled, non-admin users will see a maintenance screen
              instead of the app. Admins can still access all pages normally.
            </p>
          </div>
        </div>
        <Switch
          checked={settings.maintenance_mode}
          disabled={updateOperationsSettings.isPending}
          onCheckedChange={(checked) =>
            updateOperationsSettings.mutate({ maintenance_mode: checked })
          }
        />
      </div>

      <div className="border-t border-border/40" />

      {/* Check Stock on Sale */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <PackageCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Check Stock on Sale</Label>
            <p className="text-xs text-muted-foreground">
              When enabled, stock availability is validated and deducted when
              creating or editing a sales transaction. Disable to allow sales
              without stock restriction.
            </p>
          </div>
        </div>
        <Switch
          checked={settings.check_stock_on_sale}
          disabled={updateOperationsSettings.isPending}
          onCheckedChange={(checked) =>
            updateOperationsSettings.mutate({ check_stock_on_sale: checked })
          }
        />
      </div>
    </div>
  )
}
