"use client"

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ComboBoxProps } from "@/lib/constants/interface"
import { cn } from "@/lib/utils/helpers"

export function ComboBox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  className,
  disabled,
  autoOpen,
}: ComboBoxProps & { autoOpen?: boolean }) {
  const [open, setOpen] = React.useState(false)

  // Auto-open the popover once on mount when autoOpen is true
  const autoOpenedRef = React.useRef(false)
  React.useEffect(() => {
    if (autoOpen && !autoOpenedRef.current && !disabled) {
      autoOpenedRef.current = true
      // Small delay to let the DOM settle
      const timer = setTimeout(() => setOpen(true), 50)
      return () => clearTimeout(timer)
    }
  }, [autoOpen, disabled])
  const [triggerWidth, setTriggerWidth] = React.useState<number>()
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open, options.length])

  function handleScrollWheel(e: React.WheelEvent) {
    if (listRef.current) {
      const viewport = listRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      )
      if (viewport) {
        viewport.scrollTop += e.deltaY
      } else {
        // Fallback for direct scroll
        listRef.current.scrollTop += e.deltaY
      }
    }
  }

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between w-full overflow-hidden", className)}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        style={{ width: triggerWidth }}
        className="p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="border-b"
          />
          <CommandList ref={listRef}>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup onWheel={handleScrollWheel}>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value === value ? null : option.value)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
