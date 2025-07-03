'use client'

import { Button } from '@/components/ui/button'
import { getLinkClasses } from '@/lib/utils/helpers'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type NavItem = {
  name: string
  href?: string
  icon: any
  action?: string
  children?: NavItem[]
}

export default function NavList({
  items,
  activePath,
  close,
  onAction,
  title,
  level = 0,
}: {
  items: NavItem[]
  activePath: string
  close?: () => void
  onAction?: (action: string) => void
  title?: string
  level?: number
}) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const newOpenMenus: Record<string, boolean> = {}

    const checkActive = (items: NavItem[]) => {
      for (const item of items) {
        if (
          item.children?.some((child) =>
            activePath.startsWith(child.href ?? ''),
          )
        ) {
          newOpenMenus[item.name] = true
        }
        if (item.children) checkActive(item.children)
      }
    }

    checkActive(items)
    setOpenMenus(newOpenMenus)
  }, [items, activePath])

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const isChildActive = (item: NavItem): boolean => {
    if (!item.children) return false
    return item.children.some(
      (child) =>
        (child.href && activePath.startsWith(child.href)) ||
        isChildActive(child),
    )
  }

  return (
    <>
      {title && level === 0 && (
        <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
          {title}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item) => {
          const isOpen = openMenus[item.name]
          const isParent = !!item.children
          const isActive =
            (item.href && activePath.startsWith(item.href)) ||
            isChildActive(item)
          const paddingLeft = `${level * 1.5 + 1}rem`

          let content

          if (item.href) {
            content = (
              <Link
                href={item.href}
                onClick={close}
                style={{ paddingLeft }}
                className={`${getLinkClasses(
                  isActive,
                )} flex items-center w-full focus:outline-none focus:ring-0`}
              >
                <item.icon className="size-4" />
                <span className="ml-2">{item.name}</span>
              </Link>
            )
          } else if (item.action) {
            content = (
              <Button
                onClick={() => {
                  onAction?.(item.action!)
                  close?.()
                }}
                variant="ghost"
                style={{ paddingLeft }}
                className="w-full justify-start hover:bg-muted hover:text-primary text-muted-foreground focus:outline-none focus:ring-0"
              >
                <item.icon className="size-4" />
                <span className="ml-2">{item.name}</span>
              </Button>
            )
          } else {
            content = (
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleMenu(item.name)}
                style={{ paddingLeft }}
                className={`flex items-center w-full justify-between group
                  text-sm font-medium transition-colors
                  text-muted-foreground hover:bg-muted hover:text-primary
                  ${isActive ? 'text-primary bg-muted' : ''}
                  focus:outline-none focus:ring-0
                `}
              >
                <div className="flex items-center gap-x-3">
                  <item.icon
                    className={`size-4 transition-colors 
                      ${isActive ? 'text-primary' : 'text-muted-foreground'}
                      group-hover:text-primary`}
                  />
                  <span className="ml-2">{item.name}</span>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <ChevronRight className="size-4" />
                </motion.div>
              </Button>
            )
          }

          return (
            <li key={item.name}>
              {content}

              {isParent && (
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <NavList
                        items={item.children ?? []}
                        activePath={activePath}
                        close={close}
                        onAction={onAction}
                        level={level + 1}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
