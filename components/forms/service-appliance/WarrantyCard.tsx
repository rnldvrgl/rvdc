import type { ServiceAppliance } from "@/lib/constants/interface"
import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"

export function WarrantyCard({ appliance }: { appliance: ServiceAppliance }) {
  return (
    <div className="rounded-lg border border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/10 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Shield className="h-3 w-3 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
          Warranty
        </span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {appliance.labor_warranty_months != null &&
          appliance.labor_warranty_months > 0 && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Labor</p>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">
                  {appliance.labor_warranty_months} months
                </span>
                {appliance.is_labor_warranty_active && (
                  <Badge
                    variant="success"
                    className="text-[10px] px-1 py-0"
                  >
                    Active
                  </Badge>
                )}
              </div>
              {appliance.labor_warranty_end_date && (
                <p className="text-[10px] text-muted-foreground">
                  Until{" "}
                  {new Date(
                    appliance.labor_warranty_end_date,
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

        {appliance.unit_warranty_months != null &&
          appliance.unit_warranty_months > 0 && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Unit</p>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">
                  {appliance.unit_warranty_months} months
                </span>
                {appliance.is_unit_warranty_active && (
                  <Badge
                    variant="success"
                    className="text-[10px] px-1 py-0"
                  >
                    Active
                  </Badge>
                )}
              </div>
              {appliance.unit_warranty_end_date && (
                <p className="text-[10px] text-muted-foreground">
                  Until{" "}
                  {new Date(
                    appliance.unit_warranty_end_date,
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
      </div>

      {appliance.warranty_notes && (
        <p className="text-xs text-muted-foreground pt-1 border-t border-blue-200/50 dark:border-blue-800/50">
          {appliance.warranty_notes}
        </p>
      )}

      {appliance.warranty_start_date && (
        <p className="text-[10px] text-muted-foreground">
          Started:{" "}
          {new Date(appliance.warranty_start_date).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
