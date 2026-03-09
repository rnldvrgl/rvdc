"use client"
import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import { cn } from "@/lib/utils/helpers"

type WrapperProps = {
  children: React.ReactNode
  maxWidth?: "default" | "wide" | "full" | "narrow" | (string & {})
  className?: string
}

const maxWidthMap = {
  default: "max-w-7xl",
  wide: "max-w-[1800px]",
  full: "max-w-full",
  narrow: "max-w-3xl",
}

export function Wrapper({
  children,
  maxWidth = "default",
  className,
}: WrapperProps) {
  const { collapsed } = useSidebarCollapse()

  const resolvedMaxWidth = maxWidth
    ? (maxWidthMap[maxWidth as keyof typeof maxWidthMap] ?? maxWidth)
    : collapsed
      ? "max-w-[1800px]"
      : "max-w-7xl"

  return (
    <div
      className={cn(
        "container mx-auto p-2 md:p-4 xl:p-6 space-y-8 transition-all duration-300",
        resolvedMaxWidth,
        className,
      )}
    >
      {children}
    </div>
  )
}
