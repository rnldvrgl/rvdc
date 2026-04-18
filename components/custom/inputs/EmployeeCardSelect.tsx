"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils/helpers"
import { Check } from "lucide-react"

export interface EmployeeCardOption {
  id: number
  full_name: string
  profile_image?: string | null
}

interface EmployeeCardSelectProps {
  employees: EmployeeCardOption[]
  selected: number[]
  onChange: (selected: number[]) => void
  disabled?: boolean
}

export function EmployeeCardSelect({
  employees,
  selected,
  onChange,
  disabled = false,
}: EmployeeCardSelectProps) {
  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((employeeId) => employeeId !== id))
      return
    }

    onChange([...selected, id])
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (employees.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">No employees available</p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
      {employees.map((employee) => {
        const isSelected = selected.includes(employee.id)

        return (
          <button
            key={employee.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(employee.id)}
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
              <div className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
                <Check className="size-2.5 text-primary-foreground" />
              </div>
            )}

            <Avatar className="size-10">
              <AvatarImage
                src={employee.profile_image ?? undefined}
                alt={employee.full_name}
              />
              <AvatarFallback className="text-xs">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>

            <span className="line-clamp-2 text-xs font-medium leading-tight">
              {employee.full_name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
