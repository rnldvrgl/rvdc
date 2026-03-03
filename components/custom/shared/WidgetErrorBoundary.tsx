"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import React from "react"

interface Props {
  children: React.ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
}

/**
 * Lightweight error boundary for individual dashboard widgets / sections.
 * Prevents one broken widget from crashing the entire page.
 */
export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[WidgetErrorBoundary]", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="size-4 text-amber-500" />
              {this.props.fallbackTitle ?? "Something went wrong"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              This widget failed to load.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => this.setState({ hasError: false })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}
