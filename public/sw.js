// Service Worker for Web Push Notifications
// This file MUST live in /public so the browser can register it at the root scope.

self.addEventListener("push", (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: "New notification", body: event.data.text() }
  }

  const { title = "RVDC", body = "", url = "/", tag = "" } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/rvdc_logo.png",
      badge: "/rvdc_logo.png",
      tag: tag || undefined,
      data: { url },
      vibrate: [200, 100, 200],
    }),
  )
})

// Open the app when the user clicks the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus an existing tab if one is open
        for (const client of clients) {
          if (new URL(client.url).pathname === url && "focus" in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(url)
      }),
  )
})
