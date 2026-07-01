
"use client"

import { NavItem, NavListItem } from "@/lib/constants/types"
import { cn } from "@/lib/utils/helpers"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function NavList({
    items,
    activePath,
    close,
    onAction,
    title,
    level = 0,
}: NavListItem) {
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const newOpenMenus: Record<string, boolean> = {}

        const checkActive = (items: NavItem[]) => {
            for (const item of items) {
                if (item.children?.some((child) => activePath.startsWith(child.href ?? ""))) {
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
            (child) => (child.href && activePath.startsWith(child.href)) || isChildActive(child),
        )
    }

    // Shared row classes
    const rowBase = "flex items-center w-full gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    const rowInactive = "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    const rowActive = "bg-primary text-primary-foreground"
    const rowChildActive = "text-foreground bg-accent"

    return (
        <div className={cn(level === 0 ? "space-y-0.5" : "")}>
            {title && level === 0 && (
                <p className="my-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {title}
                </p>
            )}
            <ul
                className="space-y-0.5"
                style={level > 0 ? { paddingLeft: `${level * 1}rem` } : undefined}
            >
                {items.map((item) => {
                    const isOpen = openMenus[item.name]
                    const isParent = !!item.children
                    const isActive = !!(item.href && activePath.startsWith(item.href))
                    const hasActiveChild = isChildActive(item)

                    let content: React.ReactNode

                    if (item.href) {
                        content = (
                            <Link
                                href={item.href}
                                onClick={close}
                                className={cn(
                                    rowBase,
                                    isActive ? rowActive : rowInactive,
                                )}
                            >
                                <item.icon className="size-4 shrink-0" />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        )
                    } else if (item.action) {
                        content = (
                            <button
                                type="button"
                                onClick={() => {
                                    onAction?.(item.action!)
                                    close?.()
                                }}
                                className={cn(rowBase, rowInactive)}
                            >
                                <item.icon className="size-4 shrink-0" />
                                <span className="truncate">{item.name}</span>
                            </button>
                        )
                    } else {
                        // Parent with children
                        content = (
                            <button
                                type="button"
                                onClick={() => toggleMenu(item.name)}
                                className={cn(
                                    rowBase,
                                    hasActiveChild ? rowChildActive : rowInactive,
                                    "justify-between",
                                )}
                            >
                                <span className="flex items-center gap-2.5 min-w-0">
                                    <item.icon className="size-4 shrink-0" />
                                    <span className="truncate">{item.name}</span>
                                </span>
                                <motion.span
                                    animate={{ rotate: isOpen ? 90 : 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="shrink-0 text-muted-foreground"
                                >
                                    <ChevronRight className="size-3.5" />
                                </motion.span>
                            </button>
                        )
                    }

                    return (
                        <li key={item.name} className="space-y-0.5">
                            {content}

                            {isParent && (
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
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
        </div>
    )
}
