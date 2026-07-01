import { ThemeProvider } from "@/lib/providers/theme-provider"
import { AppThemeApplier } from "@/lib/providers/app-theme-applier"

import { ResponsiveToaster } from "@/components/layout/responsive-toaster"
import { SHOP_INFO } from "@/lib/constants/meta"
import { APP_THEME, APP_THEMES, DEFAULT_APP_THEME } from "@/lib/constants/theme"
import { QueryClientContextProvider } from "@/lib/providers/client-query-provider"
import NextTopLoader from "nextjs-toploader"
import Script from "next/script"
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css"

const fontSans = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const fontMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
});

const appThemeBootstrap = JSON.stringify(
    Object.fromEntries(
        Object.entries(APP_THEMES).map(([themeId, theme]) => [themeId, {
            light: theme.light,
            dark: theme.dark,
        }]),
    ),
).replace(/</g, "\\u003c")

export const metadata = {
    title: SHOP_INFO.name,
    description: SHOP_INFO.description,
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent" as const,
        title: "RVDC",
    },
    icons: {
        apple: "/rvdc_logo.png",
    },
}

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover" as const,
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
        >
            <body
                className={`${fontSans.variable} ${fontMono.variable} antialiased`}
            >
                <NextTopLoader
                    color={APP_THEME.loaderColor}
                    height={2.5}
                    showSpinner={false}
                    easing="ease"
                    speed={400}
                    shadow={APP_THEME.loaderShadow}
                    crawlSpeed={300}
                    initialPosition={0.08}
                />
                <Script
                    id="app-theme-bootstrap"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `(() => {
                            try {
                                const themes = ${appThemeBootstrap};
                                const defaultTheme = ${JSON.stringify(DEFAULT_APP_THEME)};
                                const root = document.documentElement;

                                const readStore = (key) => {
                                    try {
                                        const raw = localStorage.getItem(key);
                                        if (!raw) return null;
                                        const parsed = JSON.parse(raw);
                                        return parsed?.state ?? parsed;
                                    } catch {
                                        return null;
                                    }
                                };

                                const userProfileStore = readStore("user-profile-storage");
                                const settingsStore = readStore("user-settings-storage");
                                const userId = userProfileStore?.userProfile?.id;
                                const themeId = userId ? settingsStore?.byUser?.[userId]?.theme ?? defaultTheme : defaultTheme;
                                const theme = themes[themeId] ?? themes[defaultTheme];
                                const mode = localStorage.getItem("theme") === "dark" ||
                                    (localStorage.getItem("theme") !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
                                    ? "dark"
                                    : "light";
                                const variables = theme[mode];

                                root.dataset.appTheme = themeId;
                                root.dataset.appThemeMode = mode;

                                for (const [variableName, variableValue] of Object.entries(variables)) {
                                    root.style.setProperty(variableName, variableValue);
                                }
                            } catch {
                                // Fallback to the client applier after hydration.
                            }
                        })();`,
                    }}
                />
                <QueryClientContextProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        disableTransitionOnChange
                    >
                        <AppThemeApplier />
                        {children}
                        <ResponsiveToaster desktopPosition="bottom-right" closeButton />
                    </ThemeProvider>
                </QueryClientContextProvider>
            </body>
        </html>
    )
}
