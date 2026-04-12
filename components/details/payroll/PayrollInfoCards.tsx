import { SHOP_INFO } from "@/lib/constants/meta"
import { formatCurrency } from "@/lib/utils/currency"
import { Building, Mail, MapPin, User } from "lucide-react"

interface EmployeeInfoProps {
  name: string
  role: string
  dailyRate: number
  hourlyRate: number
}

export function CompanyInfoCard() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Building className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Employer
          </p>
          <p className="text-sm font-bold text-foreground leading-tight">
            {SHOP_INFO.name}
          </p>
        </div>
      </div>
      <div className="space-y-1 pl-11">
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{SHOP_INFO.address}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3 w-3 shrink-0" />
          <span>{SHOP_INFO.contactEmail}</span>
        </div>
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
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Employee
          </p>
          <p className="text-sm font-bold text-foreground leading-tight truncate max-w-[180px]">
            {name}
          </p>
        </div>
      </div>
      <div className="pl-11 grid grid-cols-2 gap-x-4 gap-y-1">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Position
          </p>
          <p className="text-xs font-medium capitalize">{role}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Daily Rate
          </p>
          <p className="text-xs font-semibold">{formatCurrency(dailyRate)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Hourly Rate
          </p>
          <p className="text-xs font-semibold">{formatCurrency(hourlyRate)}</p>
        </div>
      </div>
    </div>
  )
}
