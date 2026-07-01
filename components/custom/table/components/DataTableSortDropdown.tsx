"use client"

import { Reorder, motion } from "framer-motion"
import { ArrowDownUp, GripVertical, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { SortOption } from "@/lib/constants/interface"
import { SortState } from "@/lib/constants/types"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { cn } from "@/lib/utils/helpers"

interface DataTableSortDropdownProps {
    options: SortOption[]
    value: SortState[]
    onChange: (next: SortState[]) => void
    className?: string
}

const transitionVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
}

export function DataTableSortDropdown({
    options,
    value,
    onChange,
    className,
}: DataTableSortDropdownProps) {
    const [open, setOpen] = useState(false)
    const [localSort, setLocalSort] = useState<SortState[]>(value)
    const { push } = useNavigation()
    const { limit, search, filter } = useSearchParameters()

    useEffect(() => {
        setLocalSort(value)
    }, [value])

    const handleFieldChange = (index: number, id: string) => {
        setLocalSort((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], id }
            return next
        })
    }

    const handleDirectionChange = (index: number, desc: boolean) => {
        setLocalSort((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], desc }
            return next
        })
    }

    const handleRemove = (index: number) => {
        setLocalSort((prev) => {
            const next = [...prev]
            next.splice(index, 1)
            return next
        })
    }

    const handleAdd = () => {
        const usedIds = new Set(localSort.map((v) => v.id))
        const firstUnused = options.find((opt) => !usedIds.has(opt.value))
        if (!firstUnused) return
        setLocalSort([...localSort, { id: firstUnused.value, desc: false }])
    }

    const handleReset = () => {
        setLocalSort([])
        onChange([])
        push({
            page: 1,
            limit,
            ordering: undefined,
            search,
            filter,
        })
        setOpen(false)
    }

    const handleApply = () => {
        onChange(localSort)
        const ordering = localSort
            .map((s) => (s.desc ? `-${s.id}` : s.id))
            .join(",")
        push({
            page: 1,
            limit,
            ordering: ordering || undefined,
            search,
            filter,
        })
        setOpen(false)
    }

    const isDirty = JSON.stringify(localSort) !== JSON.stringify(value)

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        className,
                    )}
                >
                    <ArrowDownUp className="mr-1.5 h-4 w-4" />
                    Sort
                    {value.length > 0 && (
                        <Badge
                            variant="default"
                            className="ml-2 h-[18px] rounded px-1.5 font-mono text-[10px] "
                        >
                            {value.length}
                        </Badge>
                    )}
                    {isDirty && (
                        <span className="ml-2 size-2 rounded-full bg-yellow-500" />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className={cn("flex flex-col gap-3.5 p-4 sm:min-w-[380px]", className)}
                align="center"
                asChild
            >
                <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={transitionVariants}
                >
                    <div className="flex flex-col gap-1">
                        <h4 className="font-medium leading-none">
                            {localSort.length > 0 ? "Sort by" : "No sorting applied"}
                        </h4>
                        <p
                            className={cn(
                                "text-muted-foreground text-sm",
                                localSort.length > 0 && "sr-only",
                            )}
                        >
                            {localSort.length > 0
                                ? "Modify sorting to organize your rows."
                                : "Add sorting to organize your rows."}
                        </p>
                    </div>

                    <Reorder.Group
                        axis="y"
                        values={localSort}
                        onReorder={setLocalSort}
                        className="flex max-h-[300px] flex-col gap-2 overflow-y-auto"
                    >
                        {localSort.map((sort, index) => (
                            <Reorder.Item
                                key={`${sort.id}-${index}`}
                                value={sort}
                                className="flex items-center gap-1"
                            >
                                <div className="text-muted-foreground cursor-grab">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                <Select
                                    value={sort.id}
                                    onValueChange={(val) => handleFieldChange(index, val)}
                                >
                                    <SelectTrigger className="flex-1 min-w-0 h-8">
                                        <SelectValue placeholder="Field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.map((opt) => {
                                            const isUsedElsewhere =
                                                localSort.findIndex(
                                                    (v, i) => v.id === opt.value && i !== index,
                                                ) !== -1
                                            return (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                    disabled={isUsedElsewhere}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Select
                                                value={sort.desc ? "desc" : "asc"}
                                                onValueChange={(val) =>
                                                    handleDirectionChange(index, val === "desc")
                                                }
                                            >
                                                <SelectTrigger className="w-[85px] h-8">
                                                    <SelectValue placeholder="Dir" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="asc">Asc</SelectItem>
                                                    <SelectItem value="desc">Desc</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TooltipTrigger>
                                        <TooltipContent>Sort Direction</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="plain"
                                                className="size-8 text-destructive"
                                                onClick={() => handleRemove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Remove Sort</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    <div className="flex w-full items-center gap-2 pt-2">
                        <Button
                            size="sm"
                            className="rounded"
                            onClick={handleAdd}
                            disabled={localSort.length >= options.length}
                        >
                            Add Sort
                        </Button>

                        {localSort.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded"
                                            onClick={handleReset}
                                        >
                                            Reset
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Clear all sorting</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto rounded"
                            onClick={handleApply}
                            disabled={!isDirty}
                        >
                            Apply
                        </Button>
                    </div>
                </motion.div>
            </PopoverContent>
        </Popover>
    )
}
