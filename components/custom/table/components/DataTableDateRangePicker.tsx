"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { DATE_RANGE_PRESETS } from "@/lib/constants/general"
import { cn } from "@/lib/utils/helpers"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"

const EMPTY_DATE_RANGE: DateRange = { from: undefined, to: undefined }

interface DataTableDateRangePickerProps {
    value?: DateRange
    defaultValue?: DateRange
    onChange?: (range: DateRange) => void
    className?: string
}

export const DataTableDateRangePicker = ({
    value,
    defaultValue = EMPTY_DATE_RANGE,
    onChange,
    className,
}: DataTableDateRangePickerProps) => {
    const [open, setOpen] = useState(false)
    const [internalDate, setInternalDate] = useState<DateRange>(
        value ?? defaultValue,
    )

    useEffect(() => {
        setInternalDate((prev) => {
            const next = value ?? defaultValue
            const prevFromTime = prev.from?.getTime()
            const prevToTime = prev.to?.getTime()
            const nextFromTime = next.from?.getTime()
            const nextToTime = next.to?.getTime()

            if (prevFromTime === nextFromTime && prevToTime === nextToTime) {
                return prev
            }

            return next
        })
    }, [value, defaultValue])

    const date = value ?? internalDate

    const handleSelect = (range: DateRange | undefined) => {
        if (!range?.from) return
        setInternalDate(range)
        onChange?.(range)
    }

    const handlePreset = (range: DateRange) => {
        setInternalDate(range)
        onChange?.(range)
        setOpen(false)
    }

    const handleClear = () => {
        const emptyRange = { from: undefined, to: undefined }
        setInternalDate(emptyRange)
        onChange?.(emptyRange)
        setOpen(false)
    }

    const isClearDisabled = !date.from && !date.to

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "max-w-[350px] justify-start text-left font-mono tabular-nums",
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 size-4" />
                    {date.from && date.to ? (
                        <>
                            {format(date.from, "LLL dd, y")} – {format(date.to, "LLL dd, y")}
                        </>
                    ) : (
                        <span>Pick a date range</span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-auto p-4"
                align="end"
            >
                <div className="flex gap-4">
                    <Calendar
                        className="font-mono"
                        mode="range"
                        numberOfMonths={2}
                        selected={date}
                        onSelect={handleSelect}
                    />

                    <div className="flex w-[150px] flex-col justify-between font-mono">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-muted-foreground">
                                Presets
                            </p>
                            {DATE_RANGE_PRESETS.map((preset, idx) => {
                                const isActive =
                                    date.from?.toDateString() ===
                                    preset.range.from?.toDateString() &&
                                    date.to?.toDateString() === preset.range.to?.toDateString()

                                return (
                                    <Button
                                        key={idx}
                                        variant={isActive ? "default" : "ghost"}
                                        className={cn(
                                            "w-full justify-start text-sm",
                                        )}
                                        onClick={() => handlePreset(preset.range)}
                                    >
                                        {preset.label}
                                    </Button>
                                )
                            })}
                        </div>

                        <Button
                            variant="link"
                            className="mt-4 text-sm"
                            disabled={isClearDisabled}
                            onClick={handleClear}
                        >
                            Clear Filter
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default DataTableDateRangePicker
