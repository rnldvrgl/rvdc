const DEVICE_ID_STORAGE_KEY = "device_id"

function buildFallbackId() {
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return ""

  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) return existing

  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : buildFallbackId()

  localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated)
  return generated
}
