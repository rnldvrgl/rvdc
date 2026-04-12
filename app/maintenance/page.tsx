import { SHOP_INFO } from "@/lib/constants/meta"
import { Wrench } from "lucide-react"

export const metadata = {
  title: `Under Maintenance — ${SHOP_INFO.name}`,
  robots: { index: false },
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full flex flex-col items-center text-center gap-5">
        {/* Icon */}
        <div className="size-18 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center">
          <Wrench className="size-8 text-primary" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Under Maintenance
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We&rsquo;re making improvements to the system. We&rsquo;ll be back
            up shortly. Thank you for your patience.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-border/40" />

        {/* Shop name */}
        <p className="text-xs text-muted-foreground/50">{SHOP_INFO.name}</p>
      </div>
    </div>
  )
}
