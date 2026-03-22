"use client"

import api from "@/lib/utils/api"
import { useCallback, useEffect, useRef } from "react"

/**
 * Registers the service worker, requests Notification permission,
 * subscribes to Web Push, and sends the subscription to the backend.
 *
 * Call this hook once in the authenticated layout.
 */
export function usePushNotifications() {
  const subscribedRef = useRef(false)

  const subscribe = useCallback(async () => {
    if (subscribedRef.current) return
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    if (!("PushManager" in window)) return

    try {
      // 1. Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js")

      // 2. Request permission (no-op if already granted/denied)
      const permission = await Notification.requestPermission()
      if (permission !== "granted") return

      // 3. Fetch VAPID public key from backend
      const { data } = await api.get("/notifications/push/vapid-key/")
      const vapidPublicKey: string = data.public_key
      if (!vapidPublicKey) return

      // 4. Subscribe to push (idempotent if already subscribed)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // 5. Send subscription to backend
      const sub = subscription.toJSON()
      await api.post("/notifications/push/subscribe/", {
        endpoint: sub.endpoint,
        keys: sub.keys,
      })

      subscribedRef.current = true
    } catch {
      // Silently fail — push is best-effort
    }
  }, [])

  useEffect(() => {
    subscribe()
  }, [subscribe])
}

/** Convert a base64url-encoded string to a Uint8Array (for applicationServerKey). */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
