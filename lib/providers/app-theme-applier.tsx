"use client"

import { useLayoutEffect } from "react"
import { useTheme } from "next-themes"

import { APP_THEMES, DEFAULT_APP_THEME, AppThemeId, AppThemeMode } from "@/lib/constants/theme"
import useSettingsStore from "@/lib/store/useSettingsStore"
import useUserProfileStore from "@/lib/store/useUserProfileStore"

export function AppThemeApplier() {
    const userId = useUserProfileStore((state) => state.userProfile?.id)
    const { resolvedTheme } = useTheme()

    const themeId: AppThemeId = useSettingsStore((state) =>
        userId ? state.byUser[userId]?.theme ?? DEFAULT_APP_THEME : DEFAULT_APP_THEME,
    )
    const themeMode: AppThemeMode = resolvedTheme === "dark" ? "dark" : "light"

    useLayoutEffect(() => {
        const root = document.documentElement
        const theme = APP_THEMES[themeId] ?? APP_THEMES[DEFAULT_APP_THEME]
        const nextVariables = theme[themeMode]

        root.dataset.appTheme = themeId
        root.dataset.appThemeMode = themeMode

        for (const [variableName, variableValue] of Object.entries(nextVariables)) {
            root.style.setProperty(variableName, variableValue)
        }
    }, [themeId, themeMode])

    return null
}
