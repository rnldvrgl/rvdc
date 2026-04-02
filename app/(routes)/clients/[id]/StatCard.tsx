import React from "react"

const accentStyles = {
  default: { card: "", icon: "bg-primary/10 text-primary" },
  blue:    { card: "border-blue-500/20   bg-blue-500/5",   icon: "bg-blue-500/15   text-blue-500" },
  purple:  { card: "border-purple-500/20 bg-purple-500/5", icon: "bg-purple-500/15 text-purple-500" },
  green:   { card: "border-green-500/20  bg-green-500/5",  icon: "bg-green-500/15  text-green-500" },
  red:     { card: "border-red-500/20    bg-red-500/5",    icon: "bg-red-500/15    text-destructive" },
  muted:   { card: "bg-muted/30",                          icon: "bg-muted-foreground/10 text-muted-foreground" },
}

export function StatCard({
  icon,
  label,
  value,
  accent = "default",
  valueClass,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accent?: keyof typeof accentStyles
  valueClass?: string
}) {
  const Icon = icon
  const styles = accentStyles[accent]
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md ${styles.card}`}>
      <div className={`inline-flex items-center justify-center size-9 rounded-lg mb-3 ${styles.icon}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${valueClass ?? ""}`}>{value}</p>
    </div>
  )
}
