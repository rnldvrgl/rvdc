'use client'

import { Button } from '@/components/ui/button'
import { useMounted } from '@/lib/hooks/useMounted'
import { cn } from '@/lib/utils/helpers'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) return null

  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <Button
      className={cn(className)}
      variant="outline"
      size="icon"
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="size-[1.2rem] transition-all" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
