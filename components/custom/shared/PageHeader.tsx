"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils/helpers"
import { ChevronRight, LucideIcon, RefreshCw } from "lucide-react"
import Link from "next/link"
import React from "react"
import { toast } from "sonner"

type BreadcrumbItem = string | { label: string; href?: string }

// Auto-resolve breadcrumb labels to routes (used when breadcrumbs are plain strings)
const breadcrumbRouteMap: Record<string, string> = {
  Dashboard: "/dashboard",
  Sales: "/sales",
  Services: "/services",
  Receivables: "/receivables/remittances",
  Finance: "/expenses/manage",
  Expenses: "/expenses/manage",
  Clients: "/clients",
  Reports: "/reports",
  Staff: "/employees",
  Employees: "/employees",
  Payroll: "/payroll/weekly",
  Attendance: "/attendance/overview",
  Inventory: "/inventory/items",
  Stocks: "/inventory/stocks/stockroom",
  Aircons: "/aircons/units",
  Messaging: "/messaging",
  Settings: "/settings/profile",
}

interface PageHeaderProps {
  icon?: LucideIcon
  title?: string
  description?: string
  isAdminOnly?: boolean
  breadcrumbs?: BreadcrumbItem[]
  variant?: "default" | "compact" | "hero"
  theme?: "default" | "primary" | "secondary" | "accent"
  className?: string
  onRefresh?: () => void
  isLoading?: boolean
  actionButton?: React.ReactNode
}

const PageHeader = ({
  icon: Icon,
  title,
  description,
  isAdminOnly,
  breadcrumbs,
  variant = "default",
  theme = "default",
  className,
  actionButton,
  onRefresh,
  isLoading,
}: PageHeaderProps) => {
  const themeStyles = {
    default: {
      container: "bg-card border-border",
      accent: "bg-primary/8 text-primary border-primary/15",
      text: "text-foreground",
      description: "text-muted-foreground",
    },
    primary: {
      container:
        "bg-linear-to-br from-primary/90 to-primary border-primary/20 text-primary-foreground",
      accent:
        "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30",
      text: "text-primary-foreground",
      description: "text-primary-foreground/80",
    },
    secondary: {
      container:
        "bg-linear-to-br from-secondary/90 to-secondary/70 border-secondary/20",
      accent:
        "bg-secondary-foreground/20 text-secondary-foreground border-secondary-foreground/30",
      text: "text-secondary-foreground",
      description: "text-secondary-foreground/80",
    },
    accent: {
      container: "bg-linear-to-br from-accent/90 to-accent/70 border-accent/20",
      accent:
        "bg-accent-foreground/20 text-accent-foreground border-accent-foreground/30",
      text: "text-accent-foreground",
      description: "text-accent-foreground/80",
    },
  }

  const variantStyles = {
    compact: {
      padding: "p-4 sm:p-6",
      titleSize: "text-xl sm:text-2xl",
      iconSize: "size-6 sm:size-7",
      iconPadding: "p-2.5",
      gap: "gap-4",
    },
    default: {
      padding: "p-6 sm:p-8",
      titleSize: "text-2xl sm:text-3xl lg:text-4xl",
      iconSize: "size-7 sm:size-8 lg:size-9",
      iconPadding: "p-3 sm:p-3.5",
      gap: "gap-6",
    },
    hero: {
      padding: "p-8 sm:p-12 lg:p-16",
      titleSize: "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl",
      iconSize: "size-8 sm:size-10 lg:size-12",
      iconPadding: "p-4 sm:p-5",
      gap: "gap-8",
    },
  }

  const currentTheme = themeStyles[theme]
  const currentVariant = variantStyles[variant]

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ease-out hover:shadow-md mb-6",
        currentTheme.container,
        currentVariant.padding,
        className,
      )}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-15 dark:opacity-40">
        <div className="absolute inset-0 bg-linear-to-br from-transparent dark:via-white/5 dark:to-white/10 via-primary/2 to-primary/4" />
        <div
          className="absolute inset-0 opacity-15 dark:opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <CardContent className="relative z-10 px-0">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && variant !== "compact" && (
          <nav
            className="mb-4 sm:mb-6 hidden sm:block"
            aria-label="Breadcrumb"
          >
            <ol className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                const label = typeof crumb === "string" ? crumb : crumb.label
                const href =
                  typeof crumb === "string"
                    ? breadcrumbRouteMap[crumb]
                    : crumb.href

                return (
                  <li
                    key={index}
                    className="flex items-center gap-2"
                  >
                    {index > 0 && (
                      <ChevronRight className="size-3 opacity-60" />
                    )}
                    {!isLast && href ? (
                      <Link
                        href={href}
                        className={cn(
                          "transition-colors duration-200 font-medium hover:underline underline-offset-4",
                          currentTheme.description,
                        )}
                      >
                        {label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          "transition-colors duration-200",
                          isLast
                            ? cn("font-semibold", currentTheme.text)
                            : cn("font-medium", currentTheme.description),
                        )}
                      >
                        {label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <div className={cn("flex flex-col", currentVariant.gap)}>
          {/* Main content */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            {/* Title and icon section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 min-w-0 flex-1">
              <div className="flex flex-col items-center justify-center space-y-3">
                {/* Icon */}
                {Icon && (
                  <div className="shrink-0 group w-full">
                    <div
                      className={cn(
                        "rounded-xl transition-all duration-300 ease-out group-hover:scale-105 w-full",
                        currentTheme.accent,
                        currentVariant.iconPadding,
                      )}
                    >
                      <Icon
                        className={cn(
                          "transition-transform duration-300 ease-out group-hover:scale-110 mx-auto",
                          currentVariant.iconSize,
                        )}
                      />
                    </div>
                  </div>
                )}
                {/* Admin badge */}
                {isAdminOnly && (
                  <Badge
                    variant="destructive"
                    className="shadow-sm w-full xl:w-auto"
                  >
                    Admin Only
                  </Badge>
                )}
              </div>

              {/* Text content */}
              <div className="min-w-0 flex-1 space-y-2 text-center md:text-start">
                {title && (
                  <h1
                    className={cn(
                      "font-bold tracking-tight leading-tight",
                      currentVariant.titleSize,
                      currentTheme.text,
                    )}
                  >
                    {title}
                  </h1>
                )}
                {description && (
                  <p
                    className={cn(
                      "text-sm sm:text-base leading-relaxed max-w-3xl",
                      currentTheme.description,
                    )}
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions and badges */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 shrink-0">
              <div className="grid gap-2 w-full">
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        onRefresh()
                        toast.success("Data refreshed successfully.")
                      } catch {
                        toast.error("Failed to refresh")
                      }
                    }}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                )}
                {/* Custom actions */}
                {actionButton && actionButton}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PageHeader
