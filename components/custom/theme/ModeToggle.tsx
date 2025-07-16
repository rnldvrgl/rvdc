'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMounted } from '@/lib/hooks/useMounted'
import { cn } from '@/lib/utils/helpers'
import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) return null

  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? SunMedium : MoonStar

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={() => setTheme(nextTheme)}
        className={cn(
          'duration-300 hover:scale-110 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:opacity-50 bg-transparent border-none shadow-none p-0 m-0 hover:bg-transparent hover:shadow-none focus-visible:ring-0 focus-visible:border-none size-9',
          className,
        )}
      >
        <Icon className="size-5 transition-transform duration-300 rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Toggle theme</p>
      </TooltipContent>
    </Tooltip>
  )
}
