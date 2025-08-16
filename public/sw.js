const CACHE_NAME = "budget-tracker-v38"
const APP_VERSION = "v38"
const urlsToCache = ["/", "/offline.html", "/manifest.json", "/placeholder-logo.png", "/favicon.ico"]

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log(`Service Worker ${APP_VERSION} installing...`)

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log(`Service Worker ${APP_VERSION} activating...`)

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        return self.clients.claim()
      })
      .then(() => {
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "APP_UPDATED",
              version: APP_VERSION,
            })
          })
        })
      }),
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return
  }

  if (!event.request.url.startsWith("http")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html")
          }
        })
    }),
  )
})

// Enhanced notification handling with better error handling
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag)

  event.notification.close()

  const notificationData = event.notification.data || {}

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus()
          }
        }

        // Otherwise open new window
        if (clients.openWindow) {
          let url = "/"

          // Navigate to specific sections based on notification type
          if (notificationData.type === "bills") {
            url = "/?tab=payables"
          } else if (notificationData.type === "goal") {
            url = "/?tab=income"
          }

          return clients.openWindow(url)
        }
      })
      .catch((error) => {
        console.error("Error handling notification click:", error)
      }),
  )
})

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag)
})

// Message handler for communication with main app
self.addEventListener("message", (event) => {
  const { type, data } = event.data || {}

  switch (type) {
    case "SKIP_WAITING":
      console.log("User confirmed update, activating new version")
      self.skipWaiting()
      break

    case "CHECK_FOR_UPDATES":
      event.ports[0].postMessage({
        hasUpdate: !!self.registration.waiting,
        currentVersion: APP_VERSION,
      })
      break

    case "GET_VERSION":
      event.ports[0].postMessage({
        version: APP_VERSION,
        cacheName: CACHE_NAME,
      })
      break

    case "SEND_NOTIFICATION":
      // Handle notification requests from main app with error handling
      if (data && data.title && data.body) {
        self.registration
          .showNotification(data.title, {
            body: data.body,
            icon: data.icon || "/placeholder-logo.png",
            badge: data.badge || "/placeholder-logo.png",
            tag: data.tag || "app-notification",
            vibrate: data.vibrate || [200, 100, 200],
            requireInteraction: data.requireInteraction || false,
            silent: data.silent || false,
            data: data.data || {},
          })
          .then(() => {
            console.log("Notification sent successfully")
          })
          .catch((error) => {
            console.error("Error sending notification:", error)
            // Send error back to main app
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: "NOTIFICATION_ERROR",
                  error: error.message,
                })
              })
            })
          })
      }
      break
  }
})

// Push notification handler
self.addEventListener("push", (event) => {
  console.log("Push message received")

  let notificationData = {
    title: "Budget Tracker",
    body: "You have a new update!",
    icon: "/placeholder-logo.png",
    badge: "/placeholder-logo.png",
    tag: "push-notification",
  }

  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (error) {
      console.error("Error parsing push data:", error)
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    data: notificationData.data || {},
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options).catch((error) => {
      console.error("Error showing push notification:", error)
    }),
  )
})

// Handle app installation
self.addEventListener("appinstalled", (event) => {
  console.log("PWA was installed")

  // Show welcome notification with error handling
  self.registration
    .showNotification("Budget Tracker Installed! 🎉", {
      body: "Your budget tracker is now installed and ready to use offline!",
      icon: "/placeholder-logo.png",
      badge: "/placeholder-logo.png",
      tag: "app-installed",
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
    })
    .catch((error) => {
      console.error("Error showing installation notification:", error)
    })
})

console.log(`Service Worker ${APP_VERSION} loaded successfully`)
