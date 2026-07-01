import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
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
        <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold">Company</h3>
            </div>
            <div className="space-y-0.5 text-xs sm:text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{SHOP_INFO.name}</p>
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
        <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold">Employee</h3>
            </div>
            <div className="space-y-0.5 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-right truncate">{name}</span>
                </div>
                <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Position:</span>
                    <span className="text-right capitalize truncate">{role}</span>
                </div>
                <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Daily:</span>
                    <AnimatedNumber
                        value={dailyRate}
                        className="font-medium"
                        format={{
                            style: "currency",
                            currency: "PHP",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }}
                    />
                </div>
                <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Hourly:</span>
                    <AnimatedNumber
                        value={hourlyRate}
                        className="font-medium"
                        format={{
                            style: "currency",
                            currency: "PHP",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
