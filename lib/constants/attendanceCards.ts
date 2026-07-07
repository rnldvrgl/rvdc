import type { StatTone } from "@/components/custom/attendance/GradientStatCard"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"

export const GRADIENT_CARD_CONFIGS: {
  key: string
  title: string
  subtitle: string
  icon: typeof CheckCircle
  tone: StatTone
}[] = [
  {
    key: "present",
    title: "Present",
    subtitle: "On-time arrivals",
    icon: CheckCircle,
    tone: "success",
  },
  {
    key: "absent",
    title: "Absent",
    subtitle: "Absences",
    icon: AlertTriangle,
    tone: "destructive",
  },
  {
    key: "late",
    title: "Late",
    subtitle: "Late arrivals",
    icon: Clock,
    tone: "warning",
  },
] as const
