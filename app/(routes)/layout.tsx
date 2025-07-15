'use client'
import { Sidebar } from '@/components/custom/navigation/sidebar'
import { useMounted } from '@/lib/hooks/useMounted'
import { useTheme } from 'next-themes'
import React from 'react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return null
  }

  const backgroundStyle =
    resolvedTheme === 'dark'
      ? {
          backgroundImage: `radial-gradient(circle 600px at 50% 50%, rgba(59,130,246,0.3), transparent)`,
          backgroundColor: '#000000',
        }
      : {
          background: '#ffffff',
          backgroundImage: `radial-gradient(circle at top right, rgba(70, 130, 180, 0.5), transparent 70%)`,
          filter: 'blur(80px)',
          backgroundRepeat: 'no-repeat',
        }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative">
      <div
        className="absolute inset-0 -z-50"
        style={backgroundStyle}
      />

      <Sidebar />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
