import { ThemeProvider } from '@/lib/providers/theme-provider'

import { Poppins } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

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
      <body className={`${poppins.className} antialiased p-0`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <Toaster position="bottom-right" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
