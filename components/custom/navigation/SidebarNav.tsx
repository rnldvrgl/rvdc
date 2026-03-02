"use client"

import NavList from "@/components/custom/navigation/NavList"
import NotificationArea from "@/components/custom/navigation/NotificationArea"
import { UserProfile } from "@/components/custom/navigation/UserProfile"
import { DeveloperCredit } from "@/components/custom/shared/DeveloperCredit"
import { ModeToggle } from "@/components/custom/theme/ModeToggle"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { User } from "@/lib/constants/interface"
import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import { useAuthentications } from "@/lib/mutations/useAuthentication"
import { cn, getDisplayImage } from "@/lib/utils/helpers"
import { getToken } from "@/lib/utils/tokens"
import { RemixiconComponentType } from "@remixicon/react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, LogOutIcon, LucideIcon, Menu, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

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
  const refresh = getToken("refresh")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { useLogout } = useAuthentications()
  const logout = useLogout()
  const displayImage = getDisplayImage(user?.profile_image)
  const hasCustomImage =
    user?.profile_image && !user.profile_image.includes("default_image")
  const { collapsed, setCollapsed, toggle } = useSidebarCollapse()

  const renderUserHeader = () => (
    <div
      className={cn(
        "flex items-center shrink-0",
        collapsed ? "justify-center" : "justify-between px-2",
      )}
    >
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div
            key="userLoaded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "flex items-center",
              collapsed ? "justify-center" : "gap-3",
            )}
          >
            {hasCustomImage ? (
              <Image
                src={displayImage}
                alt={`${user?.first_name} ${user?.last_name}`}
                width={collapsed ? 32 : 34}
                height={collapsed ? 32 : 34}
                className={cn(
                  "rounded-full object-cover ring-2 ring-primary/10 shrink-0",
                  collapsed ? "h-8 w-8" : "h-[34px] w-[34px]",
                )}
              />
            ) : (
              <div
                className={cn(
                  "flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0",
                  collapsed ? "h-8 w-8 text-xs" : "h-[34px] w-[34px] text-sm",
                )}
              >
                {user?.first_name?.[0]?.toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.03 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[10px] text-muted-foreground/60 font-medium leading-tight">
                  Welcome back
                </p>
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {user?.first_name}
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div
            className={cn(
              "flex items-center",
              collapsed ? "justify-center" : "gap-3",
            )}
          >
            <Skeleton
              className={cn(
                "rounded-full shrink-0",
                collapsed ? "h-8 w-8" : "h-[34px] w-[34px]",
              )}
            />
            {!collapsed && (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-2 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {!collapsed && (
        <div className="flex items-center gap-0.5 shrink-0">
          <NotificationArea align="start" />
          <ModeToggle />
        </div>
      )}
    </div>
  )

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
      {/* Large screens */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 288 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:flex lg:inset-y-0 lg:z-50 lg:flex-col bg-sidebar border-r border-sidebar-border/50 h-full relative"
      >
        {/* Edge toggle button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="absolute -right-3 top-7 z-10 flex size-6 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground/80 hover:text-foreground hover:bg-muted shadow-sm transition-colors"
            >
              <motion.div
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <ChevronLeft className="size-3" />
              </motion.div>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={10}
          >
            <p>{collapsed ? "Expand" : "Collapse"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Content */}
        <div
          className={cn(
            "flex flex-col h-full overflow-hidden transition-[padding] duration-200",
            collapsed ? "px-2 py-4" : "px-3 py-4",
          )}
        >
          {/* User */}
          {renderUserHeader()}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden mt-4 min-h-0">
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              {collapsed ? (
                <motion.div
                  key="collapsed-nav"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  {sections
                    .flatMap((s) => s.items)
                    .map((item) => (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          {item.href ? (
                            <a
                              href={item.href}
                              title={item.name}
                              className={cn(
                                "flex items-center justify-center size-9 rounded-lg transition-all duration-150",
                                activePath.startsWith(item.href)
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              <item.icon className="size-[18px]" />
                            </a>
                          ) : item.action ? (
                            <button
                              onClick={() => onAction?.(item.action!)}
                              title={item.name}
                              className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
                            >
                              <item.icon className="size-[18px]" />
                            </button>
                          ) : item.children ? (
                            <button
                              onClick={() => setCollapsed(false)}
                              title={item.name}
                              className={cn(
                                "flex items-center justify-center size-9 rounded-lg transition-all duration-150 cursor-pointer",
                                item.children.some(
                                  (c) =>
                                    c.href && activePath.startsWith(c.href),
                                )
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              <item.icon className="size-[18px]" />
                            </button>
                          ) : (
                            <div className="flex items-center justify-center size-9 rounded-lg text-muted-foreground">
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
                    ))}
                </motion.div>
              ) : (
                <motion.div
                  key="expanded-nav"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {renderNav()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom actions */}
          <div className="shrink-0 pt-2">
            {collapsed ? (
              <div className="flex flex-col items-center gap-0.5">
                <ModeToggle />
                <NotificationArea align="start" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => logout.mutateAsync(refresh)}
                      title="Sign out"
                      className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
                    >
                      <LogOutIcon className="size-[18px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                  >
                    <p>Sign out</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
                  onClick={() => logout.mutateAsync(refresh)}
                >
                  <LogOutIcon className="size-3.5" />
                  <span className="ml-2 text-xs">Sign out</span>
                </Button>
                <DeveloperCredit
                  variant="subtle"
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Small screens - Full screen mobile menu */}
      <div className="lg:hidden flex h-16 items-center justify-between bg-sidebar border-b border-sidebar-border px-6">
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {user ? (
              <motion.div
                key="userMobileLoaded"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3"
              >
                {hasCustomImage ? (
                  <Image
                    src={displayImage}
                    alt={`${user?.first_name} ${user?.last_name}`}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/30 text-primary font-semibold text-sm">
                    {user?.first_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-sm">
                  {user?.first_name} {user?.last_name}
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <NotificationArea align="end" />
          <Button
            size="icon"
            className="rounded-lg"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Full Screen Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border shrink-0 bg-sidebar">
              <div className="flex items-center gap-3">
                {user &&
                  (hasCustomImage ? (
                    <Image
                      src={displayImage}
                      alt={`${user?.first_name} ${user?.last_name}`}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/30 text-primary font-semibold text-lg">
                      {user?.first_name?.[0]?.toUpperCase()}
                    </div>
                  ))}
                <div>
                  <p className="text-sm font-semibold">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role || "User"}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* Scrollable Navigation */}
            <div className="flex-1 overflow-y-auto">
              <div className="py-6 px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="space-y-6"
                >
                  {sections.length > 0 &&
                    sections.map((section, i) =>
                      section.items.length > 0 ? (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
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
                </motion.div>
              </div>
            </div>
            {/* Footer */}
            <div className="shrink-0 py-2 px-4 border-t border-border space-y-3 mb-2">
              <UserProfile user={user} />
              <DeveloperCredit
                variant="subtle"
                size="sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}
