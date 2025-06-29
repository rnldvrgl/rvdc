import {
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Computer, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

const DropdownModeToggle = () => {
  const { theme, setTheme } = useTheme()
  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value)}
          >
            <DropdownMenuRadioItem value="light">
              <Sun className="mr-2 size-4" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="mr-2 size-4" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Computer className="mr-2 size-4" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  )
}

export default DropdownModeToggle
