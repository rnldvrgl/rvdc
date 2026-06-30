import { ThemeProvider } from "@/lib/providers/theme-provider"
import { AppThemeApplier } from "@/lib/providers/app-theme-applier"

import { ResponsiveToaster } from "@/components/layout/responsive-toaster"
import { SHOP_INFO } from "@/lib/constants/meta"
import { APP_THEME } from "@/lib/constants/theme"
import { QueryClientContextProvider } from "@/lib/providers/client-query-provider"
import NextTopLoader from "nextjs-toploader"
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
            <head>
                <meta
                    name="facebook-domain-verification"
                    content="6i8iw9vw884am0u3vkmd9vnjkv3w4a"
                />
            </head>
            <body
                className={`${fontSans.variable} ${fontMono.variable} font-mono antialiased`}
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
                <QueryClientContextProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        disableTransitionOnChange
                    >
                            <AppThemeApplier />
                        {children}
                        <ResponsiveToaster closeButton />
                    </ThemeProvider>
                </QueryClientContextProvider>
            </body>
        </html>
    )
}
