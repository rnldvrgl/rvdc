"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils/helpers"
import { Check } from "lucide-react"

export interface TechnicianOption {
  id: number
  full_name: string
  profile_image?: string | null
}

interface TechnicianCardSelectProps {
  technicians: TechnicianOption[]
  selected: number[]
  onChange: (selected: number[]) => void
  disabled?: boolean
}

export function TechnicianCardSelect({
  technicians,
  selected,
  onChange,
  disabled = false,
}: TechnicianCardSelectProps) {
  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (technicians.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No technicians available
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {technicians.map((tech) => {
        const isSelected = selected.includes(tech.id)

        return (
          <button
            key={tech.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(tech.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 flex items-center justify-center size-4 rounded-full bg-primary">
                <Check className="size-2.5 text-primary-foreground" />
              </div>
            )}
            <Avatar className="size-10">
              <AvatarImage
                src={tech.profile_image ?? undefined}
                alt={tech.full_name}
              />
              <AvatarFallback className="text-xs">
                {getInitials(tech.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium leading-tight line-clamp-2">
              {tech.full_name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
