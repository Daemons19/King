const CACHE_NAME = "budget-tracker-v81"
const APP_VERSION = "v81"
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

// Enhanced notification handling with better error handling and mobile support
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag)

  event.notification.close()

  const notificationData = event.notification.data || {}
  const action = event.action

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Handle different actions
        if (action === "dismiss") {
          return Promise.resolve()
        }

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

  // Track notification dismissals
  const notificationData = event.notification.data || {}
  if (notificationData.type) {
    console.log(`Notification dismissed: ${notificationData.type}`)
  }
})

// Enhanced message handler for communication with main app
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
      // Handle notification requests from main app with enhanced error handling
      if (data && data.title && data.body) {
        const notificationOptions = {
          body: data.body,
          icon: data.icon || "/placeholder-logo.png",
          badge: data.badge || "/placeholder-logo.png",
          tag: data.tag || "app-notification",
          vibrate: data.vibrate || [200, 100, 200],
          requireInteraction: data.requireInteraction || false,
          silent: data.silent || false,
          data: data.data || {},
          actions: [
            {
              action: "open",
              title: "Open App",
              icon: "/placeholder-logo.png",
            },
            {
              action: "dismiss",
              title: "Dismiss",
              icon: "/placeholder-logo.png",
            },
          ],
        }

        self.registration
          .showNotification(data.title, notificationOptions)
          .then(() => {
            console.log("Notification sent successfully:", data.title)
            // Send success message back to main app
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: "NOTIFICATION_SUCCESS",
                  title: data.title,
                })
              })
            })
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

    case "SCHEDULE_NOTIFICATION":
      // Handle scheduled notifications (for future implementation)
      console.log("Scheduled notification request received:", data)
      break
  }
})

// Enhanced push notification handler with better mobile support
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
    requireInteraction: true, // Better for mobile
    data: notificationData.data || {},
    actions: [
      {
        action: "open",
        title: "Open App",
        icon: "/placeholder-logo.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
        icon: "/placeholder-logo.png",
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options).catch((error) => {
      console.error("Error showing push notification:", error)
    }),
  )
})

// Handle app installation with enhanced notification
self.addEventListener("appinstalled", (event) => {
  console.log("PWA was installed")

  // Show enhanced welcome notification
  self.registration
    .showNotification("Budget Tracker Installed! 🎉", {
      body: "Your budget tracker is now installed and ready to use offline! You'll receive notifications even when the app is closed.",
      icon: "/placeholder-logo.png",
      badge: "/placeholder-logo.png",
      tag: "app-installed",
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: {
        type: "installation",
        timestamp: Date.now(),
      },
      actions: [
        {
          action: "open",
          title: "Open App",
          icon: "/placeholder-logo.png",
        },
      ],
    })
    .catch((error) => {
      console.error("Error showing installation notification:", error)
    })
})

// Background sync for offline notifications (future enhancement)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("Background sync triggered")
    // Handle background sync for notifications when back online
  }
})

// Periodic background sync for scheduled notifications (future enhancement)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "daily-reminders") {
    console.log("Periodic sync triggered for daily reminders")
    // Handle periodic notifications
  }
})

console.log(`Service Worker ${APP_VERSION} loaded successfully with enhanced notification support`)
