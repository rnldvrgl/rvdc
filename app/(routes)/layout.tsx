"use client"
import { Sidebar } from "@/components/custom/navigation/Sidebar"
import { Background } from "@/components/custom/shared/Background"
import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import { cn } from "@/lib/utils/helpers"
import React from "react"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { collapsed } = useSidebarCollapse()

  return (
    <div className="min-h-screen">
      <Background />

      <div className="fixed top-0 left-0 lg:h-full z-40  w-full lg:w-auto bg-background xl:bg-background/60">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main
        className="flex-1 flex flex-col p-4 sm:p-6 mt-16 lg:mt-0 transition-all duration-300"
        style={{ paddingLeft: undefined }}
      >
        <div
          className={cn(
            "transition-all duration-300",
            collapsed ? "lg:ml-[72px]" : "lg:ml-80",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
