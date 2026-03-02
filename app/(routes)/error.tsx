"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Route error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-lg w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="size-7 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. This has been logged and we&apos;ll
            look into it.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <pre className="text-xs text-left bg-muted rounded-md p-3 overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button onClick={reset} variant="default">
              <RefreshCw className="size-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Home className="size-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
