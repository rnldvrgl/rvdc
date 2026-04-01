const STORAGE_KEY = "rvdc_pinned_clients"

export function getPinnedClientIds(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function togglePinnedClient(id: number): boolean {
  const pinned = getPinnedClientIds()
  const index = pinned.indexOf(id)
  if (index >= 0) {
    pinned.splice(index, 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned))
    return false
  } else {
    pinned.unshift(id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned))
    return true
  }
}

export function isClientPinned(id: number): boolean {
  return getPinnedClientIds().includes(id)
}
