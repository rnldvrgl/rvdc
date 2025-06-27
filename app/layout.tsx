import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'RVDC Ref and Aircon Repair Shop',
  description:
    'Professional refrigerator and air conditioning repair services with on-site, pick-up, and in-shop options. Trusted by households and businesses alike.',
  keywords: [
    'refrigerator repair',
    'aircon repair',
    'RVDC',
    'technician',
    'home service',
    'appliance repair',
  ],
  authors: [{ name: 'RVDC Services', url: 'https://rvdc.ph' }],
  creator: 'RVDC Services',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'RVDC Ref and Aircon Repair Shop',
    description:
      'Trusted appliance repair shop for refrigerators and air conditioners.',
    url: 'https://rvdc.ph',
    siteName: 'RVDC Services',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RVDC Repair Shop',
      },
    ],
    locale: 'en_PH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RVDC Ref and Aircon Repair Shop',
    description: 'Top-notch appliance repair services in the Philippines.',
    images: ['/og-image.png'],
    creator: '@rvdc_services',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
    >
      <body
        className={`${poppins.variable} font-sans antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  )
}
