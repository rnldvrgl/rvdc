import { ThemeProvider } from "@/lib/providers/theme-provider"

import { ResponsiveToaster } from "@/components/layout/responsive-toaster"
import { SHOP_INFO } from "@/lib/constants/meta"
import { QueryClientContextProvider } from "@/lib/providers/client-query-provider"
import { Poppins, Roboto_Mono } from "next/font/google"
import NextTopLoader from "nextjs-toploader"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
})

const roboto = Roboto_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-roboto",
})

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
        className={`${poppins.variable} ${roboto.variable} antialiased p-0 font-poppins`}
      >
        <NextTopLoader
          color="#7f22fe"
          height={2.5}
          showSpinner={false}
          easing="ease"
          speed={400}
          shadow="0 0 10px #7f22fe,0 0 5px #7f22fe"
          crawlSpeed={300}
          initialPosition={0.08}
        />
        <QueryClientContextProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            {children}
            <ResponsiveToaster closeButton />
          </ThemeProvider>
        </QueryClientContextProvider>
      </body>
    </html>
  )
}
