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
      <div className="absolute inset-0 bg-linear-to-br from-primary/4 via-transparent to-primary/5 dark:from-primary/6 dark:via-transparent dark:to-primary/4" />
    </div>
  )
}
