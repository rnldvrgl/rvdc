"use client"

import NavList from "@/components/custom/navigation/NavList"
import NotificationArea from "@/components/custom/navigation/NotificationArea"
import {
    ChangelogDialog,
    ChangelogUnseenBadge,
} from "@/components/custom/changelog/ChangelogBanner"
import { DeveloperCredit } from "@/components/custom/shared/DeveloperCredit"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { User } from "@/lib/constants/interface"
import { SHOP_INFO } from "@/lib/constants/meta"
import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import { useAuthentications } from "@/lib/mutations/useAuthentication"
import { cn, getDisplayImage } from "@/lib/utils/helpers"
import { getToken } from "@/lib/utils/tokens"
import { RemixiconComponentType } from "@remixicon/react"
import { AnimatePresence, motion } from "framer-motion"
import {
    Computer,
    LogOutIcon,
    LucideIcon,
    Menu,
    Moon,
    Sparkles,
    Sun,
    UserIcon,
    X,
} from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

type SidebarItem = {
    name: string
    href?: string
    icon: LucideIcon | RemixiconComponentType
    action?: string
    children?: SidebarItem[]
}

type SidebarSection = {
    title?: string
    items: SidebarItem[]
}

export default function SidebarNav({
    sections,
    activePath,
    onAction,
    user,
}: {
    sections: SidebarSection[]
    activePath: string
    onAction?: (action: string) => void
    user: User | null
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [changelogOpen, setChangelogOpen] = useState(false)

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [mobileMenuOpen])

    const { collapsed, setCollapsed } = useSidebarCollapse()
    const { theme, setTheme } = useTheme()
    const refresh = getToken("refresh")
    const { useLogout } = useAuthentications()
    const logout = useLogout()

    const cycleTheme = () => {
        const themes = ["light", "dark", "system"] as const
        const idx = themes.indexOf(theme as (typeof themes)[number])
        setTheme(themes[(idx + 1) % themes.length])
    }

    const renderNav = (close?: () => void) => (
        <div className="flex flex-col gap-1">
            {sections.map((section, i) =>
                section.items.length > 0 ? (
                    <NavList
                        key={i}
                        title={section.title}
                        items={section.items}
                        activePath={activePath}
                        close={close}
                        onAction={onAction}
                    />
                ) : null,
            )}
        </div>
    )

    const CollapsedNavItem = ({ item }: { item: SidebarItem }) => {
        const isActive = item.href
            ? activePath.startsWith(item.href)
            : item.children?.some((c) => c.href && activePath.startsWith(c.href)) ?? false

        const iconEl = <item.icon className="size-[18px]" />
        const variant = isActive ? "default" : "ghost"

        let trigger: React.ReactNode

        if (item.href) {
            trigger = (
                <Button variant={variant} size="icon-lg" asChild>
                    <Link href={item.href} aria-label={item.name}>
                        {iconEl}
                    </Link>
                </Button>
            )
        } else if (item.action) {
            trigger = (
                <Button
                    variant={variant}
                    size="icon-lg"
                    aria-label={item.name}
                    onClick={() => onAction?.(item.action!)}
                >
                    {iconEl}
                </Button>
            )
        } else if (item.children) {
            trigger = (
                <Button
                    variant={variant}
                    size="icon-lg"
                    aria-label={item.name}
                    onClick={() => setCollapsed(false)}
                >
                    {iconEl}
                </Button>
            )
        } else {
            trigger = (
                <span className="flex items-center justify-center size-10 rounded-xl text-muted-foreground/40">
                    {iconEl}
                </span>
            )
        }

        return (
            <Tooltip>
                <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                    {item.name}
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
        <TooltipProvider delayDuration={0}>
            {/* ── Desktop sidebar ── */}
            <motion.aside
                animate={{ width: collapsed ? 76 : 264 }}
                transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.7 }}
                className="hidden lg:flex lg:inset-y-0 lg:z-50 lg:flex-col h-full relative shrink-0"
            >
                <div className="flex flex-col h-full bg-sidebar/50 backdrop-blur-md supports-backdrop-blur:bg-sidebar/20 border-r  border-sidebar-border dark:border-sidebar-border/10  overflow-hidden">

                    {/* Brand */}
                    <div
                        className={cn(
                            "flex items-center shrink-0 h-16 border-b border-sidebar-border dark:border-sidebar-border/20",
                            collapsed ? "justify-center px-3" : "gap-3 px-4",
                        )}
                    >
                        <div className="flex items-center justify-center size-9 rounded-xl overflow-hidden shrink-0 ring-1 ring-border">
                            <Image
                                src="/rvdc_logo.png"
                                alt="RVDC"
                                width={36}
                                height={36}
                                className="size-full object-cover bg-white"
                            />
                        </div>
                        <AnimatePresence initial={false}>
                            {!collapsed && (
                                <motion.div
                                    key="brand-text"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                    className="min-w-0 overflow-hidden"
                                >
                                    <p className="text-sm font-bold text-foreground truncate leading-tight">
                                        RVDC
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60 font-medium truncate leading-tight">
                                        {SHOP_INFO.name.replace("RVDC ", "")}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Nav — isolated scroll, scrollbar can't overlap icons */}
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 scrollbar-none">
                        <AnimatePresence mode="wait" initial={false}>
                            {collapsed ? (
                                <motion.div
                                    key="collapsed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-col items-center gap-1 px-2"
                                >
                                    {sections.flatMap((s) => s.items).map((item) => (
                                        <CollapsedNavItem key={item.name} item={item} />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="expanded"
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                    className="px-3"
                                >
                                    {renderNav()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom strip — always outside scroll area */}
                    <div className="shrink-0 border-t border-sidebar-border dark:border-sidebar-border/20">
                        {collapsed ? (
                            <div className="flex flex-col items-center gap-1 py-3 px-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon-lg"
                                            aria-label="What's New"
                                            onClick={() => setChangelogOpen(true)}
                                            className="relative"
                                        >
                                            <Sparkles className="size-[18px]" />
                                            <ChangelogUnseenBadge className="absolute -top-0.5 -right-0.5 min-w-3.5! h-3.5! text-[8px]!" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={10}>
                                        What&apos;s New
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="px-3 py-3 space-y-0.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setChangelogOpen(true)}
                                    className="w-full"
                                >
                                    <Sparkles className="size-3.5 shrink-0" />
                                    What&apos;s New
                                    <ChangelogUnseenBadge className="ml-auto" />
                                </Button>
                                <DeveloperCredit variant="subtle" size="sm" />
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* ── Mobile top bar ── */}
            <div className="lg:hidden flex h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center justify-between bg-sidebar/50 backdrop-blur-md supports-backdrop-blur:bg-sidebar/20  border-sidebar-border dark:border-sidebar-border/10 border-b px-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Avatar className="size-8 ring-1 ring-border shrink-0">
                        <AvatarImage
                            src={getDisplayImage(user?.profile_image)}
                            alt={user ? `${user.first_name} ${user.last_name}` : "User"}
                        />
                        <AvatarFallback className="text-xs">
                            {user?.first_name?.[0]}
                            {user?.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <AnimatePresence mode="wait">
                        {user ? (
                            <motion.span
                                key="name"
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.25 }}
                                className="font-semibold text-sm text-foreground truncate min-w-0 max-w-[150px] sm:max-w-none"
                            >
                                <span className="sm:hidden truncate">{user.first_name} {user.last_name?.[0]}.</span>
                                <span className="hidden sm:inline">{user.first_name} {user.last_name}</span>
                            </motion.span>
                        ) : (
                            <Skeleton className="h-4 w-24 shrink-0" />
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationArea align="end" />
                    <Button
                        size="icon-sm"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="size-[18px]" />
                    </Button>
                </div>
            </div>

            {/* ── Full-screen mobile menu ── */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        key="mobile-panel"
                        initial={{ opacity: 0, x: "-100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "-100%" }}
                        transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.7 }}
                        className="lg:hidden fixed inset-0 z-50 bg-sidebar/50 backdrop-blur-md supports-backdrop-blur:bg-sidebar/20 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b  border-sidebar-border dark:border-sidebar-border/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-9 rounded-xl overflow-hidden ring-1 ring-border">
                                    <Image
                                        src="/rvdc_logo.png"
                                        alt="RVDC"
                                        width={36}
                                        height={36}
                                        className="size-full object-cover bg-white"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">RVDC</p>
                                    <p className="text-[10px] text-muted-foreground/60 font-medium truncate">
                                        {SHOP_INFO.name.replace("RVDC ", "")}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setMobileMenuOpen(false)}
                                aria-label="Close menu"
                            >
                                <X className="size-[18px]" />
                            </Button>
                        </div>

                        {/* Scrollable nav */}
                        <div className="flex-1 overflow-y-auto scrollbar-none">
                            <div className="py-4 px-3">
                                {sections.map((section, i) =>
                                    section.items.length > 0 ? (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.06 + i * 0.04, duration: 0.2, ease: "easeOut" }}
                                        >
                                            <NavList
                                                title={section.title}
                                                items={section.items}
                                                activePath={activePath}
                                                close={() => setMobileMenuOpen(false)}
                                                onAction={(action) => {
                                                    onAction?.(action)
                                                    setMobileMenuOpen(false)
                                                }}
                                            />
                                        </motion.div>
                                    ) : null,
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.18, duration: 0.2 }}
                            className="shrink-0 border-t  border-sidebar-border dark:border-sidebar-border/10 px-3 py-3 space-y-0.5"
                        >
                            <button
                                type="button"
                                onClick={cycleTheme}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                {theme === "dark" ? (
                                    <Moon className="size-4 shrink-0" />
                                ) : theme === "light" ? (
                                    <Sun className="size-4 shrink-0" />
                                ) : (
                                    <Computer className="size-4 shrink-0" />
                                )}
                                Theme
                                <span className="ml-auto text-xs capitalize text-muted-foreground">{theme}</span>
                            </button>
                            <a
                                href="/settings/profile"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <UserIcon className="size-4 shrink-0" />
                                Profile
                            </a>
                            <button
                                type="button"
                                onClick={() => { setChangelogOpen(true); setMobileMenuOpen(false) }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <Sparkles className="size-4 shrink-0" />
                                What&apos;s New
                                <ChangelogUnseenBadge className="ml-auto" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { if (refresh) logout.mutateAsync(refresh) }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <LogOutIcon className="size-4 shrink-0" />
                                Sign out
                            </button>
                            <div className="px-1 pt-1">
                                <DeveloperCredit variant="subtle" size="sm" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
        </TooltipProvider>
    )
}
