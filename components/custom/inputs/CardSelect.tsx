"use client"

import { cn } from "@/lib/utils/helpers"
import { Check, type LucideIcon } from "lucide-react"

export interface CardSelectOption {
  label: string
  value: string
  icon?: LucideIcon
  description?: string
}

interface CardSelectSingleProps {
  options: CardSelectOption[]
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
  columns?: 2 | 3 | 4
  multi?: false
}

interface CardSelectMultiProps {
  options: CardSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  columns?: 2 | 3 | 4
  multi: true
}

type CardSelectProps = CardSelectSingleProps | CardSelectMultiProps

export function CardSelect(props: CardSelectProps) {
  const { options, disabled = false, columns = 3, multi } = props

  const handleClick = (optionValue: string) => {
    if (multi) {
      const current = props.value as string[]
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue]
      ;(props.onChange as (v: string[]) => void)(next)
    } else {
      ;(props.onChange as (v: string) => void)(optionValue)
    }
  }

  const isSelected = (optionValue: string) => {
    if (multi) {
      return (props.value as string[]).includes(optionValue)
    }
    return props.value === optionValue
  }

  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : columns === 4
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
      )}
    >
      {options.map((option) => {
        const selected = isSelected(option.value)
        const Icon = option.icon

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(option.value)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selected
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {multi && selected && (
              <div className="absolute top-1.5 right-1.5">
                <Check className="size-3.5 text-primary" />
              </div>
            )}
            {Icon && (
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  selected ? "text-primary" : "text-muted-foreground/70",
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
