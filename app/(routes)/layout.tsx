'use client'
import { Sidebar } from '@/components/custom/navigation/sidebar'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme } = useTheme()

  const backgroundStyle = useMemo(() => {
    const sharedStyles = {
      position: 'absolute' as const,
      inset: 0,
      zIndex: -50,
      backgroundRepeat: 'no-repeat',
    }

    if (theme === 'dark') {
      return {
        ...sharedStyles,
        backgroundImage:
          'radial-gradient(circle 600px at 50% 50%, rgba(59,130,246,0.3), transparent)',
        backgroundColor: '#000000',
      }
    }

    return {
      ...sharedStyles,
      background: '#ffffff',
      backgroundImage:
        'radial-gradient(circle at top right, rgba(70, 130, 180, 0.5), transparent 70%)',
      filter: 'blur(80px)',
    }
  }, [theme])
  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative">
      {/* Background */}
      <div style={backgroundStyle} />

      {/* Sidebar */}
      <Sidebar />

      {/* Mobile sidebar could be a drawer; omit here for brevity */}

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
