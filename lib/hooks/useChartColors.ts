import { CHART_PALETTE } from "@/lib/constants/theme"

export function useChartColors() {
  return {
    axisColor: "var(--muted-foreground)",
    gridColor: "var(--border)",
    tooltipStyle: {
      backgroundColor: "var(--card)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
      fontSize: "13px",
    },
    chartColors: CHART_PALETTE,
  }
}
