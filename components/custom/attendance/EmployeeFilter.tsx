"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils/helpers"
import { Check, ChevronsUpDown, Users, X } from "lucide-react"
import { useState } from "react"

interface Employee {
  id: number
  first_name: string
  last_name: string
}

interface SelectedEmployee {
  employee_id: number | string
  employee_name: string
}

interface EmployeeFilterProps {
  employees: Employee[]
  selectedEmployee: SelectedEmployee | undefined
  onEmployeeChange: (employee: SelectedEmployee | undefined) => void
}

export const EmployeeFilter = ({
  employees,
  selectedEmployee,
  onEmployeeChange,
}: EmployeeFilterProps) => {
  const [open, setOpen] = useState(false)

  const selectedName = selectedEmployee?.employee_name

  return (
    <Card className="border-dashed">
      <CardContent className="px-3 md:px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3">
          {/* Label */}
          <div className="flex items-center gap-2 shrink-0">
            <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            <span className="text-xs md:text-sm font-medium text-muted-foreground">
              Filter by:
            </span>
          </div>

          <Separator
            orientation="vertical"
            className="hidden sm:block h-6"
          />

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 ">
            {/* Combobox for many employees (>8) */}
            {employees.length > 8 ? (
              <>
                <Popover
                  open={open}
                  onOpenChange={setOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        "justify-between gap-2 min-w-40 md:min-w-[180px] h-8 md:h-9 text-xs md:text-sm",
                        !selectedEmployee && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate">
                        {selectedName || "All Employees"}
                      </span>
                      <ChevronsUpDown className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-60 p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search employees..." />
                      <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all-employees"
                            onSelect={() => {
                              onEmployeeChange(undefined)
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !selectedEmployee ? "opacity-100" : "opacity-0",
                              )}
                            />
                            All Employees
                          </CommandItem>
                          {employees.map((employee) => {
                            const fullName = `${employee.first_name} ${employee.last_name}`
                            const isSelected =
                              selectedEmployee?.employee_id === employee.id

                            return (
                              <CommandItem
                                key={employee.id}
                                value={fullName}
                                onSelect={() => {
                                  onEmployeeChange({
                                    employee_name: fullName,
                                    employee_id: employee.id,
                                  })
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {fullName}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedEmployee && (
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => onEmployeeChange(undefined)}
                  >
                    <X className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  </Button>
                )}
              </>
            ) : (
              /* Button chips for few employees (<=8) */
              <>
                <Button
                  variant={
                    selectedEmployee === undefined ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => onEmployeeChange(undefined)}
                  className="transition-all duration-200 h-8 text-xs md:text-sm"
                >
                  All
                </Button>
                {employees.map((employee) => {
                  const fullName = `${employee.first_name} ${employee.last_name}`
                  const isSelected =
                    selectedEmployee?.employee_id === employee.id

                  return (
                    <Button
                      key={employee.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        onEmployeeChange({
                          employee_name: fullName,
                          employee_id: employee.id,
                        })
                      }
                      className="transition-all duration-200 h-8 text-xs md:text-sm"
                    >
                      {employee.first_name}
                    </Button>
                  )
                })}
              </>
            )}
          </div>

          {/* Selected indicator (mobile) */}
          {selectedEmployee && employees.length > 8 && (
            <Badge
              variant="secondary"
              className="sm:hidden"
            >
              {selectedName}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
