"use client"

import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import { cn } from "@/lib/utils/helpers"

export function Wrapper({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarCollapse()

  return (
    <div
      className={cn(
        "container mx-auto p-2 md:p-4 xl:p-6 space-y-8 transition-all duration-300",
        collapsed ? "max-w-[1800px]" : "max-w-7xl",
      )}
    >
      {children}
    </div>
  )
}
