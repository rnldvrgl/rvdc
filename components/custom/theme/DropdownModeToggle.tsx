import {
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const

const DropdownModeToggle = () => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const current = themeOptions.find((t) => t.value === theme) ?? themeOptions[0]
  const CurrentIcon = current.icon

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem
        onClick={toggleTheme}
        className="cursor-pointer"
      >
        <CurrentIcon className="mr-2 size-4" />
        Theme
        <span className="ml-auto text-xs text-muted-foreground capitalize">
          {current.label}
        </span>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  )
}

export default DropdownModeToggle
