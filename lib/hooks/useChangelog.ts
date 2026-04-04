import {
  CHANGELOG,
  ChangelogEntry,
  ChangelogItem,
  UserRole,
} from "@/lib/constants/changelog"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useCallback, useEffect, useMemo, useState } from "react"

const STORAGE_KEY_PREFIX = "rvdc-changelog-seen-"

function storageKey(userId: number | undefined) {
  return `${STORAGE_KEY_PREFIX}${userId ?? "guest"}`
}

/** Versions the user has already dismissed */
function getSeenVersions(userId: number | undefined): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]")
  } catch {
    return []
  }
}

function saveSeenVersions(userId: number | undefined, versions: string[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(storageKey(userId), JSON.stringify(versions))
}

/** Filter a ChangelogEntry's items by the current user's role */
function filterItems(items: ChangelogItem[], role: UserRole): ChangelogItem[] {
  return items.filter((item) => {
    if (!item.roles) return true
    const roles = item.roles as string[]
    return roles.includes("all") || roles.includes(role)
  })
}

/** Filter top-level entries to those visible for a role */
function filterEntries(
  entries: ChangelogEntry[],
  role: UserRole,
): ChangelogEntry[] {
  return entries
    .map((entry) => ({
      ...entry,
      items: filterItems(entry.items, role),
    }))
    .filter((entry) => {
      const entryRoles = entry.roles as string[] | undefined
      const roleAllowed =
        !entryRoles ||
        entryRoles.includes("all") ||
        entryRoles.includes(role)
      return roleAllowed && entry.items.length > 0
    })
}

export function useChangelog() {
  const { user_id, role } = useCurrentUser()
  const [seenVersions, setSeenVersions] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSeenVersions(getSeenVersions(user_id))
    setMounted(true)
  }, [user_id])

  const visibleEntries = useMemo(
    () => (role ? filterEntries(CHANGELOG, role as UserRole) : []),
    [role],
  )

  const unseenEntries = useMemo(
    () =>
      mounted
        ? visibleEntries.filter((e) => !seenVersions.includes(e.version))
        : [],
    [mounted, visibleEntries, seenVersions],
  )

  const latestUnseen = unseenEntries[0] ?? null

  /** Call this when the user dismisses the banner / visits the changelog page */
  const markAllRead = useCallback(() => {
    const allVersions = visibleEntries.map((e) => e.version)
    setSeenVersions(allVersions)
    saveSeenVersions(user_id, allVersions)
  }, [visibleEntries, user_id])

  const markVersionRead = useCallback(
    (version: string) => {
      const next = seenVersions.includes(version)
        ? seenVersions
        : [...seenVersions, version]
      setSeenVersions(next)
      saveSeenVersions(user_id, next)
    },
    [seenVersions, user_id],
  )

  return {
    /** All changelog entries visible to the current role */
    entries: visibleEntries,
    /** Entries the user has not yet acknowledged */
    unseenEntries,
    /** Count of unseen entries */
    unseenCount: unseenEntries.length,
    /** The most recent unseen entry (for the banner) */
    latestUnseen,
    /** Whether localStorage has been read (avoids SSR flash) */
    mounted,
    markAllRead,
    markVersionRead,
  }
}
