"use client"

import api from "@/lib/utils/api"
import { useCallback, useEffect, useRef, useState } from "react"

export function usePushNotifications() {
  const subscribedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  )
  const [subscribed, setSubscribed] = useState(false)

  const subscribe = useCallback(async (promptForPermission = false) => {
    if (subscribedRef.current) return
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    if (!("PushManager" in window)) return

    try {
      const currentPermission = Notification.permission
      setPermission(currentPermission)

      if (currentPermission === "denied") return

      const nextPermission =
        currentPermission === "default" && promptForPermission
          ? await Notification.requestPermission()
          : currentPermission

      setPermission(nextPermission)
      if (nextPermission !== "granted") return

      // 1. Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js")
      console.log("[Push] Service worker registered")

      // Wait for the service worker to be active (important for first install)
      if (!registration.active) {
        await new Promise<void>((resolve) => {
          const sw = registration.installing || registration.waiting
          if (!sw) {
            resolve()
            return
          }
          sw.addEventListener("statechange", () => {
            if (sw.state === "activated") resolve()
          })
        })
        console.log("[Push] Service worker activated")
      }

      // 2. Fetch VAPID public key from backend
      const { data } = await api.get("/notifications/push/vapid-key/")
      const vapidPublicKey: string = data.public_key
      if (!vapidPublicKey) {
        console.warn("[Push] No VAPID public key returned from backend")
        return
      }

      const newKeyBytes = urlBase64ToUint8Array(vapidPublicKey)

      // 3. Check existing subscription — if the VAPID key changed, unsubscribe first
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        const existingKey = existing.options?.applicationServerKey
        if (existingKey && !keysMatch(existingKey, newKeyBytes)) {
          console.log(
            "[Push] VAPID key changed — unsubscribing old subscription",
          )
          await existing.unsubscribe()
        }
      }

      // 4. Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: newKeyBytes,
      })
      console.log("[Push] PushManager subscribed:", subscription.endpoint)

      // 5. Send subscription to backend
      const sub = subscription.toJSON()
      await api.post("/notifications/push/subscribe/", {
        endpoint: sub.endpoint,
        keys: sub.keys,
      })

      console.log("[Push] Subscription sent to backend ✓")
      subscribedRef.current = true
      setSubscribed(true)
    } catch (err) {
      console.error("[Push] Failed to set up push notifications:", err)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported")
      setReady(true)
      return
    }

    setPermission(Notification.permission)
    if (Notification.permission === "granted") {
      void subscribe(false)
    }
    setReady(true)
  }, [subscribe])

  const enablePushNotifications = useCallback(async () => {
    await subscribe(true)
  }, [subscribe])

  return {
    enablePushNotifications,
    permission,
    subscribed,
    ready,
  }
}

/** Compare two ArrayBuffer-like keys for equality. */
function keysMatch(a: ArrayBuffer | ArrayBufferLike, b: Uint8Array): boolean {
  const viewA = new Uint8Array(a)
  if (viewA.length !== b.length) return false
  for (let i = 0; i < viewA.length; i++) {
    if (viewA[i] !== b[i]) return false
  }
  return true
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
