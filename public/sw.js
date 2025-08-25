const CACHE_NAME = "budget-tracker-v81"
const urlsToCache = ["/", "/offline.html", "/icon-192x192.png", "/icon-512x512.png", "/manifest.json"]

// Enhanced install event with immediate activation
self.addEventListener("install", (event) => {
  console.log("SW: Install event - v81")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("SW: Caching files")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("SW: Skip waiting for immediate activation")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("SW: Install failed:", error)
      }),
  )
})

// Enhanced activate event with immediate claim
self.addEventListener("activate", (event) => {
  console.log("SW: Activate event - v81")
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                console.log("SW: Deleting old cache:", cacheName)
                return caches.delete(cacheName)
              }
            }),
          )
        }),
      // Immediately claim all clients
      self.clients
        .claim()
        .then(() => {
          console.log("SW: Claimed all clients")
        }),
    ]).catch((error) => {
      console.error("SW: Activate failed:", error)
    }),
  )
})

// Enhanced fetch event with better error handling
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return (
          response ||
          fetch(event.request).catch(() => {
            // If both cache and network fail, return offline page for navigation requests
            if (event.request.mode === "navigate") {
              return caches.match("/offline.html")
            }
            throw new Error("Network and cache failed")
          })
        )
      })
      .catch((error) => {
        console.error("SW: Fetch failed:", error)
        // Return a basic response for failed requests
        return new Response("Service unavailable", {
          status: 503,
          statusText: "Service Unavailable",
        })
      }),
  )
})

// Enhanced notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("SW: Notification clicked:", event.notification.tag)

  // Close the notification
  event.notification.close()

  // Handle the click
  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clients) => {
        // If a window is already open, focus it
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            console.log("SW: Focusing existing window")
            return client.focus()
          }
        }

        // Otherwise, open a new window
        if (self.clients.openWindow) {
          console.log("SW: Opening new window")
          return self.clients.openWindow("/")
        }
      })
      .catch((error) => {
        console.error("SW: Notification click handling failed:", error)
      }),
  )
})

// Enhanced push event handling
self.addEventListener("push", (event) => {
  console.log("SW: Push event received")

  let notificationData = {
    title: "Budget Tracker",
    body: "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
  }

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
      console.log("SW: Push data parsed:", data)
    } catch (error) {
      console.error("SW: Failed to parse push data:", error)
    }
  }

  // Show notification
  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log("SW: Push notification shown")
      })
      .catch((error) => {
        console.error("SW: Failed to show push notification:", error)
      }),
  )
})

// Enhanced message handling
self.addEventListener("message", (event) => {
  console.log("SW: Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("SW: Skip waiting requested")
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: "v81" })
  }
})

// Error handling
self.addEventListener("error", (event) => {
  console.error("SW: Global error:", event.error)
})

self.addEventListener("unhandledrejection", (event) => {
  console.error("SW: Unhandled promise rejection:", event.reason)
})

console.log("SW: Service Worker v81 loaded successfully")
