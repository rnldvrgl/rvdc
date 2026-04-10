import { SHOP_INFO } from "@/lib/constants/meta"
import { formatCurrency } from "@/lib/utils/currency"
import { Building, User } from "lucide-react"

interface EmployeeInfoProps {
  name: string
  role: string
  dailyRate: number
  hourlyRate: number
}

export function CompanyInfoCard() {
  return (
    <div className="rounded-lg border bg-card p-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Building className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</h3>
      </div>
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground text-sm">{SHOP_INFO.name}</p>
        <p>{SHOP_INFO.address}</p>
        <p>{SHOP_INFO.contactEmail}</p>
      </div>
    </div>
  )
}

export function EmployeeInfoCard({
  name,
  role,
  dailyRate,
  hourlyRate,
}: EmployeeInfoProps) {
  return (
    <div className="rounded-lg border bg-card p-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <User className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Employee</h3>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        <div className="flex justify-between gap-1 col-span-2">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium text-sm truncate">{name}</span>
        </div>
        <div className="flex justify-between gap-1 col-span-2">
          <span className="text-muted-foreground">Position</span>
          <span className="capitalize truncate">{role}</span>
        </div>
        <div className="flex justify-between gap-1">
          <span className="text-muted-foreground">Daily</span>
          <span className="font-medium">{formatCurrency(dailyRate)}</span>
        </div>
        <div className="flex justify-between gap-1">
          <span className="text-muted-foreground">Hourly</span>
          <span className="font-medium">{formatCurrency(hourlyRate)}</span>
        </div>
      </div>
    </div>
  )
}
