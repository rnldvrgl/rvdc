import {
    DropdownMenuLabel,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { APP_THEME_OPTIONS, AppThemeId, DEFAULT_APP_THEME } from "@/lib/constants/theme"
import useSettingsStore from "@/lib/store/useSettingsStore"
import useUserProfileStore from "@/lib/store/useUserProfileStore"
import { ChevronRight, Moon, Palette, Sun } from "lucide-react"
import { useTheme } from "next-themes"

type DropdownModeToggleProps = {
    userId?: number | null
}

const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
] as const

const DropdownModeToggle = ({ userId }: DropdownModeToggleProps) => {
    const { theme, setTheme } = useTheme()
    const resolvedUserId = useUserProfileStore((state) => userId ?? state.userProfile?.id ?? null)
    const selectedTheme = useSettingsStore((state) =>
        resolvedUserId ? state.byUser[resolvedUserId]?.theme ?? DEFAULT_APP_THEME : DEFAULT_APP_THEME,
    )
    const setAppTheme = useSettingsStore((state) => state.setTheme)

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    const current = themeOptions.find((t) => t.value === theme) ?? themeOptions[0]
    const CurrentIcon = current.icon
    const currentAppTheme =
        APP_THEME_OPTIONS.find((themeOption) => themeOption.id === selectedTheme) ?? APP_THEME_OPTIONS[0]

    const handleAppThemeChange = (themeId: string) => {
        if (!resolvedUserId) return
        setAppTheme(resolvedUserId, themeId as AppThemeId)
    }

    return (
        <>
            <DropdownMenuGroup>
                <DropdownMenuItem
                    onClick={toggleTheme}
                    className="cursor-pointer"
                >
                    <CurrentIcon className="mr-2 size-4" />
                    Theme mode
                    <span className="ml-auto text-xs text-muted-foreground capitalize">
                        {current.label}
                    </span>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
                    <Palette className="mr-2 size-4 text-muted-foreground" />
                    App theme
                    <span className="ml-auto text-xs text-muted-foreground capitalize">
                        {currentAppTheme.label}
                    </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-72">
                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Choose app theme
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                        value={selectedTheme}
                        onValueChange={handleAppThemeChange}
                    >
                        {APP_THEME_OPTIONS.map((themeOption) => (
                            <DropdownMenuRadioItem
                                key={themeOption.id}
                                value={themeOption.id}
                                className="items-start gap-3 pl-8"
                            >
                                <span
                                    className={`mt-0.5 size-3.5 rounded-full border border-border shrink-0 ${themeOption.previewClassName}`}
                                    aria-hidden="true"
                                />
                                <span className="flex min-w-0 flex-col">
                                    <span className="text-xs font-semibold leading-4">{themeOption.label}</span>
                                    <span className="text-[11px] leading-4 text-muted-foreground">
                                        {themeOption.description}
                                    </span>
                                </span>
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
            </DropdownMenuSub>
        </>
    )
}

export default DropdownModeToggle
