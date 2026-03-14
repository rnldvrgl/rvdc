import { motion } from "framer-motion"
import { BarChart3 } from "lucide-react"
import { ReactNode } from "react"

interface ChartWrapperProps {
  children: ReactNode
  isEmpty?: boolean
  emptyMessage?: string
  height?: number
}

export function ChartWrapper({
  children,
  isEmpty,
  emptyMessage = "No data to display",
  height = 300,
}: ChartWrapperProps) {
  return (
    <div className="w-full min-h-[350px]">
      {isEmpty ? (
        <motion.div
          className="h-[300px] flex flex-col items-center justify-center gap-3 text-center border border-dashed border-border/60 rounded-xl bg-muted/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-center size-12 rounded-xl bg-muted/60 text-muted-foreground">
            <BarChart3 className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {emptyMessage}
            </p>
            <p className="text-xs text-muted-foreground">
              Data will appear once records are available
            </p>
          </div>
        </motion.div>
      ) : (
        <div style={{ width: "100%", height }}>{children}</div>
      )}
    </div>
  )
}
