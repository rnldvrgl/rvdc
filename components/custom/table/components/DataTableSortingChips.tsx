'use client'

import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'

interface Sort {
  id: string
  desc: boolean
}

interface Props {
  sorting: Sort[]
  onChange: (next: Sort[]) => void
}

export default function DataTableSortingChips({ sorting, onChange }: Props) {
  if (!sorting.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <AnimatePresence initial={false}>
        {sorting.map((sort) => (
          <motion.div
            key={sort.id}
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 bg-muted text-sm px-3 py-2 rounded-full border border-border"
          >
            <span className="font-medium">{sort.id}</span>
            <span className="text-muted-foreground">
              {sort.desc ? (
                <ArrowUpIcon className="size-4" />
              ) : (
                <ArrowDownIcon className="size-4" />
              )}
            </span>
            <Button
              onClick={() => {
                const next = sorting.filter((s) => s.id !== sort.id)
                onChange(next)
              }}
              className="p-1 size-6"
              variant="ghost"
            >
              <XIcon className="size-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          onClick={() => onChange([])}
          variant="link"
          className="ml-2"
        >
          Clear sorting
        </Button>
      </motion.div>
    </div>
  )
}
