"use client"

import NavList from "@/components/custom/navigation/NavList"
import NotificationArea from "@/components/custom/navigation/NotificationArea"
import { DeveloperCredit } from "@/components/custom/shared/DeveloperCredit"
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
  Sun,
  UserIcon,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
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
    <div className="flex-1 flex flex-col space-y-3">
      {sections.length > 0 &&
        sections.map((section, i) =>
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

  return (
    <TooltipProvider delayDuration={0}>
      {/* Large screens - Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 108 : 288 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
        className="hidden lg:flex lg:inset-y-0 lg:z-50 lg:flex-col h-full relative"
      >
        <div
          className={cn(
            "flex flex-col h-[calc(100%-24px)] my-4 bg-sidebar border border-sidebar-border/60 shadow-sm overflow-hidden transition-[padding,border-radius] duration-200 rounded-2xl",
            collapsed ? "mx-4 px-4 py-4" : "ml-4 mr-0 px-4 py-4",
          )}
        >
          {/* Company / Brand */}
          <div
            className={cn(
              "flex items-center shrink-0 mb-3",
              collapsed ? "justify-center" : "gap-2.5 px-1",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center shrink-0 rounded-xl overflow-hidden",
                collapsed ? "size-10" : "size-9",
              )}
            >
              <Image
                src="/rvdc_logo.png"
                alt="RVDC"
                width={40}
                height={40}
                className="size-full object-cover bg-white"
              />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.25, delay: 0.08, ease: "easeOut" }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-bold text-foreground truncate leading-tight">
                  RVDC
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-medium truncate leading-tight">
                  {SHOP_INFO.name.replace("RVDC ", "")}
                </p>
              </motion.div>
            )}
          </div>

          <div className={cn("mb-2", collapsed ? "mx-auto w-8" : "mx-1")}>
            <div className="h-px bg-sidebar-border/40" />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin pr-1">
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              {collapsed ? (
                <motion.div
                  key="collapsed-nav"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col items-center gap-1"
                >
                  {sections
                    .flatMap((s) => s.items)
                    .map((item) => {
                      const isActive = item.href
                        ? activePath.startsWith(item.href)
                        : item.children
                          ? item.children.some(
                              (c) => c.href && activePath.startsWith(c.href),
                            )
                          : false

                      return (
                        <Tooltip key={item.name}>
                          <TooltipTrigger asChild>
                            {item.href ? (
                              <a
                                href={item.href}
                                title={item.name}
                                className={cn(
                                  "flex items-center justify-center size-10 rounded-xl transition-all duration-200",
                                  isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                              >
                                <item.icon className="size-[18px]" />
                              </a>
                            ) : item.action ? (
                              <button
                                onClick={() => onAction?.(item.action!)}
                                title={item.name}
                                className="flex items-center justify-center size-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                              >
                                <item.icon className="size-[18px]" />
                              </button>
                            ) : item.children ? (
                              <button
                                onClick={() => setCollapsed(false)}
                                title={item.name}
                                className={cn(
                                  "flex items-center justify-center size-10 rounded-xl transition-all duration-200 cursor-pointer",
                                  isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                              >
                                <item.icon className="size-[18px]" />
                              </button>
                            ) : (
                              <div className="flex items-center justify-center size-10 rounded-xl text-muted-foreground">
                                <item.icon className="size-[18px]" />
                              </div>
                            )}
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            sideOffset={8}
                          >
                            <p>{item.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                </motion.div>
              ) : (
                <motion.div
                  key="expanded-nav"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {renderNav()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom: Credit */}
          {!collapsed && (
            <div className="shrink-0 pt-2">
              <DeveloperCredit
                variant="subtle"
                size="sm"
              />
            </div>
          )}
        </div>
      </motion.aside>

      {/* Small screens - Mobile top bar */}
      <div className="lg:hidden flex h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center justify-between bg-sidebar border-b border-sidebar-border/50 px-4">
        <div className="flex items-center gap-3">
          <Image
            src={getDisplayImage(user?.profile_image)}
            alt={user ? `${user.first_name} ${user.last_name}` : "User"}
            width={32}
            height={32}
            className="size-8 rounded-full object-cover ring-2 ring-primary/10"
          />
          <AnimatePresence>
            {user ? (
              <motion.span
                key="userMobileName"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="font-semibold text-sm truncate"
              >
                {user.first_name} {user.last_name}
              </motion.span>
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <NotificationArea align="end" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center justify-center size-9 rounded-xl text-white bg-primary/90 dark:bg-primary/20 hover:bg-primary dark:hover:bg-primary/40 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="size-[18px]" />
          </button>
        </div>
      </div>

      {/* Full Screen Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-sidebar flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-sidebar-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg overflow-hidden">
                  <Image
                    src="/rvdc_logo.png"
                    alt="RVDC"
                    width={36}
                    height={36}
                    className="size-full object-cover bg-white"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    RVDC
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-medium truncate">
                    {SHOP_INFO.name.replace("RVDC ", "")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center size-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="size-[18px]" />
              </button>
            </div>

            {/* Scrollable Navigation */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="py-4 px-3">
                {sections.length > 0 &&
                  sections.map((section, i) =>
                    section.items.length > 0 ? (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.12 + i * 0.04,
                          duration: 0.25,
                          ease: "easeOut",
                        }}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="shrink-0 border-t border-sidebar-border/40"
            >
              <div className="px-3 py-2 space-y-0.5">
                <button
                  type="button"
                  onClick={cycleTheme}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {theme === "dark" ? (
                    <Moon className="size-4 shrink-0" />
                  ) : theme === "light" ? (
                    <Sun className="size-4 shrink-0" />
                  ) : (
                    <Computer className="size-4 shrink-0" />
                  )}
                  Theme
                  <span className="ml-auto text-xs capitalize">{theme}</span>
                </button>
                <a
                  href="/settings/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <UserIcon className="size-4 shrink-0" />
                  Profile
                </a>
                <button
                  type="button"
                  onClick={() => logout.mutateAsync(refresh)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <LogOutIcon className="size-4 shrink-0" />
                  Sign out
                </button>
              </div>
              <div className="px-4 py-2">
                <DeveloperCredit
                  variant="subtle"
                  size="sm"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}
