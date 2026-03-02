"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="max-w-md w-full text-center space-y-6 p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="size-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              A critical error occurred. Please try refreshing the page.
            </p>
          </div>
          <Button onClick={reset} size="lg">
            <RefreshCw className="size-4 mr-2" />
            Try Again
          </Button>
        </div>
      </body>
    </html>
  )
}
