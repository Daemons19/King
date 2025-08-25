const CACHE_NAME = "budget-tracker-v85"
const APP_VERSION = "v85"
const urlsToCache = ["/", "/offline.html", "/manifest.json", "/placeholder-logo.png", "/favicon.ico"]

console.log(`Service Worker ${APP_VERSION} loading...`)

// Install event - cache resources and skip waiting immediately
self.addEventListener("install", (event) => {
  console.log(`Service Worker ${APP_VERSION} installing...`)

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache successfully")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("All resources cached successfully")
        console.log("Service Worker installed, skipping waiting immediately...")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Service Worker installation failed:", error)
        // Still skip waiting even if caching fails
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches and claim clients immediately
self.addEventListener("activate", (event) => {
  console.log(`Service Worker ${APP_VERSION} activating...`)

  event.waitUntil(
    Promise.all([
      // Clean up old caches
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
        }),
      // Claim clients immediately
      self.clients.claim(),
    ])
      .then(() => {
        console.log("Service Worker activated and claimed clients")
        // Notify all clients that service worker is ready
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SERVICE_WORKER_READY",
              version: APP_VERSION,
            })
          })
          console.log(`Notified ${clients.length} clients that SW is ready`)
        })
      })
      .catch((error) => {
        console.error("Service Worker activation failed:", error)
        // Still try to claim clients
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener("fetch", (event) => {
  // Only handle GET requests for HTTP(S) URLs
  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) {
    return
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response
        }

        // Fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response
            }

            // Clone the response for caching
            const responseToCache = response.clone()

            // Cache the response
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })

            return response
          })
          .catch(() => {
            // If network fails and it's a navigation request, serve offline page
            if (event.request.mode === "navigate") {
              return caches.match("/offline.html")
            }
            // For other requests, just fail
            return new Response("Network error", { status: 408 })
          })
      })
      .catch((error) => {
        console.error("Fetch event error:", error)
        return new Response("Cache error", { status: 500 })
      }),
  )
})

// Enhanced notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag)

  // Close the notification
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
        console.log(`Found ${clientList.length} client windows`)

        // Handle dismiss action
        if (action === "dismiss") {
          console.log("Notification dismissed by user")
          return Promise.resolve()
        }

        // Try to focus existing window first
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            console.log("Focusing existing window")
            return client.focus()
          }
        }

        // No existing window found, open new one
        if (clients.openWindow) {
          let url = "/"

          // Navigate to specific sections based on notification type
          if (notificationData.type === "bills") {
            url = "/?tab=payables"
          } else if (notificationData.type === "goal") {
            url = "/?tab=income"
          }

          console.log("Opening new window:", url)
          return clients.openWindow(url)
        }

        console.log("Cannot open window - clients.openWindow not available")
        return Promise.resolve()
      })
      .catch((error) => {
        console.error("Error handling notification click:", error)
      }),
  )
})

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag)

  const notificationData = event.notification.data || {}
  if (notificationData.type) {
    console.log(`Notification type '${notificationData.type}' was dismissed`)
  }
})

// Enhanced message handler
self.addEventListener("message", (event) => {
  const { type, data } = event.data || {}
  console.log("Service Worker received message:", type)

  switch (type) {
    case "SKIP_WAITING":
      console.log("Skip waiting requested")
      self
        .skipWaiting()
        .then(() => {
          console.log("Skip waiting completed")
          return self.clients.claim()
        })
        .then(() => {
          console.log("Clients claimed after skip waiting")
          // Notify clients that service worker is now active
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "SERVICE_WORKER_ACTIVATED",
                version: APP_VERSION,
              })
            })
          })
        })
        .catch((error) => {
          console.error("Error during skip waiting:", error)
        })
      break

    case "CHECK_FOR_UPDATES":
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          hasUpdate: !!self.registration.waiting,
          currentVersion: APP_VERSION,
        })
      }
      break

    case "GET_VERSION":
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          version: APP_VERSION,
          cacheName: CACHE_NAME,
        })
      }
      break

    case "SHOW_NOTIFICATION":
      // Handle notification requests from the app
      if (data && data.title && data.options) {
        console.log("Showing notification:", data.title)

        const notificationOptions = {
          body: data.options.body || "",
          icon: data.options.icon || "/placeholder-logo.png",
          badge: data.options.badge || "/placeholder-logo.png",
          tag: data.options.tag || "pwa-notification",
          vibrate: data.options.vibrate || [200, 100, 200],
          requireInteraction: data.options.requireInteraction || true,
          silent: data.options.silent || false,
          data: data.options.data || {},
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
            console.log("Notification shown successfully:", data.title)
            // Send success message back to app
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
            console.error("Error showing notification:", error)
            // Send error back to app
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: "NOTIFICATION_ERROR",
                  error: error.message,
                })
              })
            })
          })
      } else {
        console.error("Invalid notification data received")
      }
      break

    case "PING":
      // Health check
      console.log("Service Worker ping received")
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: "PONG",
          version: APP_VERSION,
          active: true,
          timestamp: Date.now(),
        })
      }
      break

    case "FORCE_ACTIVATE":
      console.log("Force activation requested")
      self.clients
        .claim()
        .then(() => {
          console.log("Force claimed clients")
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "SERVICE_WORKER_ACTIVATED",
                version: APP_VERSION,
              })
            })
          })
        })
        .catch((error) => {
          console.error("Error during force activation:", error)
        })
      break

    default:
      console.log("Unknown message type:", type)
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
      console.log("Push data parsed:", notificationData)
    } catch (error) {
      console.error("Error parsing push data:", error)
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
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
    self.registration
      .showNotification(notificationData.title, options)
      .then(() => {
        console.log("Push notification shown successfully")
      })
      .catch((error) => {
        console.error("Error showing push notification:", error)
      }),
  )
})

// Handle app installation
self.addEventListener("appinstalled", (event) => {
  console.log("PWA was installed successfully")

  // Show welcome notification
  self.registration
    .showNotification("Budget Tracker Installed! 🎉", {
      body: "Your budget tracker is now installed! You'll receive notifications even when the app is closed.",
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
    .then(() => {
      console.log("Installation notification shown")
    })
    .catch((error) => {
      console.error("Error showing installation notification:", error)
    })
})

// Background sync
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag)
  if (event.tag === "background-sync") {
    // Handle background sync for notifications when back online
    console.log("Handling background sync for notifications")
  }
})

// Periodic background sync
self.addEventListener("periodicsync", (event) => {
  console.log("Periodic sync triggered:", event.tag)
  if (event.tag === "daily-reminders") {
    // Handle periodic notifications
    console.log("Handling periodic sync for daily reminders")
  }
})

// Error handling
self.addEventListener("error", (event) => {
  console.error("Service Worker error:", event.error)
})

self.addEventListener("unhandledrejection", (event) => {
  console.error("Service Worker unhandled promise rejection:", event.reason)
})

// Log when service worker is fully loaded
console.log(`Service Worker ${APP_VERSION} loaded successfully with enhanced notification support`)

// Send ready signal to all clients immediately
self.clients
  .matchAll()
  .then((clients) => {
    console.log(`Sending ready signal to ${clients.length} clients`)
    clients.forEach((client) => {
      client.postMessage({
        type: "SERVICE_WORKER_READY",
        version: APP_VERSION,
        timestamp: Date.now(),
      })
    })
  })
  .catch((error) => {
    console.error("Error sending ready signal:", error)
  })

// Immediately claim clients if this is a new service worker
if (self.registration && !self.registration.active) {
  console.log("New service worker detected, claiming clients immediately")
  self.clients
    .claim()
    .then(() => {
      console.log("New service worker claimed clients successfully")
    })
    .catch((error) => {
      console.error("Error claiming clients:", error)
    })
}
