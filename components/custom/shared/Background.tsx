'use client'
import { useMounted } from '@/lib/hooks/useMounted'
import { useTheme } from 'next-themes'

export function Background() {
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return null
  }

  const style =
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
    <div
      className="absolute inset-0 -z-50"
      style={style}
    />
  )
}
