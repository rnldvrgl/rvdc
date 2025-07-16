import { ThemeProvider } from '@/lib/providers/theme-provider'

import { SHOP_INFO } from '@/lib/constants/meta'
import { QueryClientContextProvider } from '@/lib/providers/client-query-provider'
import { Poppins, Roboto_Mono } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-poppins',
})

const roboto = Roboto_Mono({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-roboto',
})

export const metadata = {
  title: SHOP_INFO.name,
  description: SHOP_INFO.description,
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
        className={`${poppins.variable} ${roboto.variable} antialiased p-0 font-poppins`}
      >
        <NextTopLoader />
        <QueryClientContextProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <Toaster position="bottom-right" />
            {children}
          </ThemeProvider>
        </QueryClientContextProvider>
      </body>
    </html>
  )
}
