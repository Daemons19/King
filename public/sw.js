const CACHE_NAME = "budget-tracker-v35"
const APP_VERSION = "v35"
const urlsToCache = ["/", "/offline.html", "/manifest.json", "/placeholder-logo.png", "/favicon.ico"]

// Install event - cache resources and notify about updates
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
        // Force the waiting service worker to become the active service worker
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
        // Take control of all clients immediately
        return self.clients.claim()
      })
      .then(() => {
        // Notify all clients about the update
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
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If both cache and network fail, show offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html")
          }
        })
    }),
  )
})

// Enhanced message handler for update management
self.addEventListener("message", (event) => {
  const { type, data } = event.data || {}

  switch (type) {
    case "SKIP_WAITING":
      // User confirmed they want to update
      console.log("User confirmed update, activating new version")
      self.skipWaiting()
      break

    case "CHECK_FOR_UPDATES":
      // Check if there's a waiting service worker
      event.ports[0].postMessage({
        hasUpdate: !!self.registration.waiting,
        currentVersion: APP_VERSION,
      })
      break

    case "GET_VERSION":
      // Return current version
      event.ports[0].postMessage({
        version: APP_VERSION,
        cacheName: CACHE_NAME,
      })
      break

    case "FORCE_UPDATE_CHECK":
      // Force check for updates by updating registration
      self.registration.update().then(() => {
        event.ports[0].postMessage({
          updateCheckComplete: true,
          hasUpdate: !!self.registration.waiting,
        })
      })
      break

    case "CHECK_UPDATE":
      // Check for updates by comparing versions
      event.ports[0].postMessage({
        type: "UPDATE_STATUS",
        hasUpdate: false, // This would be determined by actual update logic
        currentVersion: APP_VERSION,
      })
      break
  }
})

// Background sync for update checking
self.addEventListener("sync", (event) => {
  if (event.tag === "check-for-updates") {
    console.log("Background sync triggered")
    // Handle background sync logic here
  }

  if (event.tag === "background-sync") {
    console.log("Background sync triggered")
    // Handle background sync logic here
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Push message received")

  const options = {
    body: event.data ? event.data.text() : "New update available!",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Open App",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Budget Tracker Update", options))
})

// Handle notification clicks for update prompts
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.notification.tag === "app-update") {
    if (event.action === "update-now") {
      // User wants to update
      self.skipWaiting()
      event.waitUntil(self.clients.openWindow("/"))
    } else if (event.action === "later") {
      // User dismissed update
      return
    } else {
      // Default action - open app
      event.waitUntil(self.clients.openWindow("/"))
    }
  }

  console.log("Notification click received.")

  if (event.action === "explore") {
    // Open the app
    event.waitUntil(self.clients.openWindow("/"))
  } else if (event.action === "close") {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(self.clients.openWindow("/"))
  }
})

// Periodic background sync to check for updates (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-check") {
    console.log("Periodic sync: checking for updates")
    event.waitUntil(checkForUpdates())
  }
})

// Function to check for updates
async function checkForUpdates() {
  try {
    // This would typically check a server endpoint for new versions
    // For now, we'll simulate an update check
    const response = await fetch("/api/version", { cache: "no-cache" })
    if (response.ok) {
      const data = await response.json()
      if (data.version !== APP_VERSION) {
        // Notify clients about available update
        const clients = await self.clients.matchAll()
        clients.forEach((client) => {
          client.postMessage({
            type: "UPDATE_AVAILABLE",
            newVersion: data.version,
            currentVersion: APP_VERSION,
          })
        })
      }
    }
  } catch (error) {
    console.log("Update check failed:", error)
  }
}

// Handle app update notifications
self.addEventListener("appinstalled", (event) => {
  console.log("PWA was installed")

  // Show welcome notification
  self.registration.showNotification("Budget Tracker Installed!", {
    body: "Your budget tracker is now installed and ready to use offline.",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
  })
})

console.log(`Service Worker ${APP_VERSION} loaded successfully`)
