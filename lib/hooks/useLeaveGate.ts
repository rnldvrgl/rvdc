"use client"

import { useMemo } from "react"

export type LeaveShiftPeriod = "FULL" | "AM" | "PM"

export type NormalizedLeave =
  | {
      typeLabel: string
      shiftPeriod: LeaveShiftPeriod
    }
  | null
  | undefined

type ShiftSettings = {
  shift_start?: string | null
  shift_end?: string | null
}

function parseHour(timeStr: string) {
  const [hours] = timeStr.split(":")
  return parseInt(hours, 10)
}

function formatCutoffTime(hour: number) {
  return hour === 12
    ? "12:00 PM"
    : `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`
}

export function useLeaveGate(
  leave: NormalizedLeave,
  settings: ShiftSettings | undefined,
  currentHour: number,
) {
  return useMemo(() => {
    const cutoffHour = (() => {
      if (!settings?.shift_start || !settings?.shift_end) return 13 // default 1 PM
      const startHour = parseHour(settings.shift_start)
      const endHour = parseHour(settings.shift_end)
      return Math.floor((startHour + endHour) / 2)
    })()

    if (!leave) {
      return { isDisabled: false, message: null as string | null, cutoffHour }
    }

    const typeLabel = leave.typeLabel.toLowerCase()

    if (leave.shiftPeriod === "FULL") {
      return {
        isDisabled: true,
        cutoffHour,
        message: `You are on ${typeLabel} today (Full Day). Clock in/out is not available.`,
      }
    }

    const shiftEndTime = settings?.shift_end ? settings.shift_end.slice(0, 5) : "6:00 PM"
    const shiftStartTime = settings?.shift_start ? settings.shift_start.slice(0, 5) : "8:00 AM"
    const cutoffTime = formatCutoffTime(cutoffHour)

    if (leave.shiftPeriod === "AM") {
      // On leave in the morning — works the afternoon shift, so disabled
      // until the cutoff.
      const isDisabled = currentHour < cutoffHour
      return {
        isDisabled,
        cutoffHour,
        message: isDisabled
          ? `You are on ${typeLabel} (Half Day - Morning). Your afternoon shift starts at ${cutoffTime}.`
          : `You are on ${typeLabel} (Half Day - Morning). You can clock in/out for your afternoon shift (${cutoffTime} - ${shiftEndTime}).`,
      }
    }

    // PM — on leave in the afternoon, works the morning shift, so
    // disabled after the cutoff.
    const isDisabled = currentHour >= cutoffHour
    return {
      isDisabled,
      cutoffHour,
      message: isDisabled
        ? `You are on ${typeLabel} (Half Day - Afternoon). Your morning shift has ended at ${cutoffTime}.`
        : `You are on ${typeLabel} (Half Day - Afternoon). You can clock in/out for your morning shift (${shiftStartTime} - ${cutoffTime}).`,
    }
  }, [leave, settings, currentHour])
}
