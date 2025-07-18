import { useTheme } from 'next-themes'

export function useChartColors() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const chartColors = isDark
    ? [
        '#22c55e', // green-500
        '#f97316', // orange-500
        '#3b82f6', // blue-500
        '#eab308', // yellow-500
        '#ec4899', // pink-500
      ]
    : [
        '#10b981', // emerald-500
        '#f59e0b', // amber-500
        '#3b82f6', // blue-500
        '#6366f1', // indigo-500
        '#ef4444', // red-500
      ]

  return {
    axisColor: isDark ? '#cbd5e1' : '#475569', // slate-300 / slate-600
    gridColor: isDark ? '#334155' : '#e2e8f0', // slate-700 / slate-200
    tooltipStyle: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff', // slate-800 / white
      color: isDark ? '#f8fafc' : '#0f172a', // slate-50 / slate-900
      border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, // slate-700 / slate-300
      fontSize: '13px',
    },
    chartColors,
  }
}
