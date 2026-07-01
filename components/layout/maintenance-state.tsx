import { BrandLockup } from "@/components/custom/shared/BrandLockup"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SHOP_INFO } from "@/lib/constants/meta"
import { Wrench } from "lucide-react"

export function MaintenanceState() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <BrandLockup
          title={SHOP_INFO.name}
          description="System updates in progress. Service returns shortly."
          icon={Wrench}
          compact
        />
        <Alert className="border-border/60 bg-card/90 text-left shadow-sm">
          <Wrench />
          <AlertTitle>Under maintenance</AlertTitle>
          <AlertDescription>
            We&rsquo;re making improvements to system stability and performance.
          </AlertDescription>
        </Alert>
        <p className="text-xs text-muted-foreground/60">{SHOP_INFO.name}</p>
      </div>
    </div>
  )
}
