// Service Worker for Web Push Notifications
// This file MUST live in /public so the browser can register it at the root scope.

// Activate immediately so push events are handled right away
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: "New notification", body: event.data.text() }
  }

  const {
    title = "RVDC",
    body = "",
    url = "/",
    tag = "",
    sender_id = null,
    sound,
  } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/rvdc_logo.png",
      badge: "/rvdc_logo.png",
      tag: tag || undefined,
      data: { url, sender_id },
      sound,
      vibrate: [200, 100, 200],
    }),
  )
})

// Open the app when the user clicks the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url || "/"
  const senderId = event.notification.data?.sender_id

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Chat notification: focus existing tab and tell it to open the chat
        if (senderId) {
          for (const client of clients) {
            client.postMessage({ action: "open_chat", senderId })
            return client.focus()
          }
          // No tab open — open home and include sender_id as hash
          return self.clients.openWindow(`/#chat=${senderId}`)
        }

        // Regular notification: navigate to the url
        for (const client of clients) {
          if (new URL(client.url).pathname === url && "focus" in client) {
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      }),
  )
})
