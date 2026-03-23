"use client"

import api from "@/lib/utils/api"
import { useCallback, useEffect, useRef } from "react"

/**
 * Registers the service worker, requests Notification permission,
 * subscribes to Web Push, and sends the subscription to the backend.
 *
 * Handles VAPID key rotation: if the server key changes, the old
 * subscription is unsubscribed and a fresh one is created.
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

      // 2. Request permission (no-op if already granted/denied)
      const permission = await Notification.requestPermission()
      console.log("[Push] Permission:", permission)
      if (permission !== "granted") return

      // 3. Fetch VAPID public key from backend
      const { data } = await api.get("/notifications/push/vapid-key/")
      const vapidPublicKey: string = data.public_key
      if (!vapidPublicKey) {
        console.warn("[Push] No VAPID public key returned from backend")
        return
      }

      const newKeyBytes = urlBase64ToUint8Array(vapidPublicKey)

      // 4. Check existing subscription — if the VAPID key changed, unsubscribe first
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

      // 5. Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: newKeyBytes,
      })
      console.log("[Push] PushManager subscribed:", subscription.endpoint)

      // 6. Send subscription to backend
      const sub = subscription.toJSON()
      await api.post("/notifications/push/subscribe/", {
        endpoint: sub.endpoint,
        keys: sub.keys,
      })

      console.log("[Push] Subscription sent to backend ✓")
      subscribedRef.current = true
    } catch (err) {
      console.error("[Push] Failed to set up push notifications:", err)
    }
  }, [])

  useEffect(() => {
    subscribe()
  }, [subscribe])
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
