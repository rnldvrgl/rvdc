import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock } from "lucide-react"

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
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit mx-auto">
              <Clock className="size-4 text-slate-600 dark:text-slate-400" />
            </div>
            <CardTitle className="text-base md:text-lg font-semibold">
              Filter by Employee
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile: Dropdown */}
        <div className="block md:hidden">
          <Select
            value={String(selectedEmployee?.employee_id) || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                onEmployeeChange(undefined)
              } else {
                const employee = employees.find((e) => String(e.id) === value)
                if (employee) {
                  onEmployeeChange({
                    employee_name: `${employee.first_name} ${employee.last_name}`,
                    employee_id: employee.id,
                  })
                }
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select employee">
                {selectedEmployee
                  ? selectedEmployee.employee_name
                  : "All Employees"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((employee) => (
                <SelectItem
                  key={employee.id}
                  value={String(employee.id)}
                >
                  {employee.first_name} {employee.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Chips */}
        <div className="hidden md:block">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedEmployee === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => onEmployeeChange(undefined)}
              className="transition-all duration-200 hover:scale-105"
            >
              All Employees
            </Button>
            {employees.map((employee) => (
              <Button
                key={employee.id}
                variant={
                  selectedEmployee?.employee_id === employee.id
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() =>
                  onEmployeeChange({
                    employee_name: `${employee.first_name} ${employee.last_name}`,
                    employee_id: employee.id,
                  })
                }
                className="transition-all duration-200 hover:scale-105"
              >
                {employee.first_name} {employee.last_name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
