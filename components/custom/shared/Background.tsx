"use client"

import { useMounted } from "@/lib/hooks/useMounted"

export function Background() {
  const mounted = useMounted()
  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-background" />

      {/* Subtle accent gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/[0.02] via-transparent to-primary/[0.03] dark:from-primary/[0.04] dark:via-transparent dark:to-primary/[0.02]" />
    </div>
  )
}
