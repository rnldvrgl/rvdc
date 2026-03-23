"use client"

import { cn } from "@/lib/utils/helpers"
import { type LucideIcon } from "lucide-react"

export interface CardSelectOption {
  label: string
  value: string
  icon?: LucideIcon
  description?: string
}

interface CardSelectProps {
  options: CardSelectOption[]
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
  columns?: 2 | 3
}

export function CardSelect({
  options,
  value,
  onChange,
  disabled = false,
  columns = 3,
}: CardSelectProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value
        const Icon = option.icon

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground/70",
                )}
              />
            )}
            <span className="text-xs font-medium leading-tight">
              {option.label}
            </span>
            {option.description && (
              <span className="text-[10px] leading-tight text-muted-foreground">
                {option.description}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
