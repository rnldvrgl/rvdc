import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ReactNode } from 'react'

export function withTooltipHeader(label: string, tooltip: string | ReactNode) {
  return function TooltipHeader() {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help font-medium">{label}</span>
          </TooltipTrigger>
          <TooltipContent side="top">{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
}
