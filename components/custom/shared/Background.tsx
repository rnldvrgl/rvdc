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
          backgroundImage: `radial-gradient(circle at 50% 100%, rgba(70, 85, 110, 0.5) 0%, transparent 60%),
          radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.4) 0%, transparent 70%),
          radial-gradient(circle at 50% 100%, rgba(181, 184, 208, 0.3) 0%, transparent 80%)`,
          backgroundColor: '#000000',
        }
      : {
          backgroundImage: `repeating-linear-gradient(22.5deg, transparent, transparent 2px, rgba(75, 85, 99, 0.06) 2px, rgba(75, 85, 99, 0.06) 3px, transparent 3px, transparent 8px),
        repeating-linear-gradient(67.5deg, transparent, transparent 2px, rgba(107, 114, 128, 0.05) 2px, rgba(107, 114, 128, 0.05) 3px, transparent 3px, transparent 8px),
        repeating-linear-gradient(112.5deg, transparent, transparent 2px, rgba(55, 65, 81, 0.04) 2px, rgba(55, 65, 81, 0.04) 3px, transparent 3px, transparent 8px),
        repeating-linear-gradient(157.5deg, transparent, transparent 2px, rgba(31, 41, 55, 0.03) 2px, rgba(31, 41, 55, 0.03) 3px, transparent 3px, transparent 8px)`,
        }

  return (
    <div
      className="fixed inset-0 -z-50"
      style={style}
    />
  )
}
