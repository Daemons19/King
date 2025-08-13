const CACHE_NAME = "budget-tracker-v2"
const urlsToCache = ["/", "/manifest.json", "/placeholder-logo.png", "/offline.html"]

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          // If both cache and network fail, show offline page for navigation requests
          if (event.request.destination === "document") {
            return caches.match("/offline.html")
          }
        })
      )
    }),
  )
})

// Background sync for when connection is restored
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(syncData())
  }
})

// Push notification event
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Budget reminder!",
    icon: "/placeholder-logo.png",
    badge: "/placeholder-logo.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Open App",
        icon: "/placeholder-logo.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/placeholder-logo.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Budget Tracker", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})

// Daily notification scheduler
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SCHEDULE_NOTIFICATIONS") {
    scheduleNotifications(event.data.payload)
  }
})

function scheduleNotifications(data) {
  // Schedule morning notification (8 AM Manila time)
  const morningTime = new Date()
  morningTime.setHours(8, 0, 0, 0)
  if (morningTime < new Date()) {
    morningTime.setDate(morningTime.getDate() + 1)
  }

  // Schedule evening notification (6 PM Manila time)
  const eveningTime = new Date()
  eveningTime.setHours(18, 0, 0, 0)
  if (eveningTime < new Date()) {
    eveningTime.setDate(eveningTime.getDate() + 1)
  }

  // Set timeouts for notifications
  setTimeout(() => {
    self.registration.showNotification("Good Morning! 🌅", {
      body: "Time to update your daily earnings and check your budget goals!",
      icon: "/placeholder-logo.png",
      badge: "/placeholder-logo.png",
      tag: "morning-reminder",
    })
  }, morningTime.getTime() - Date.now())

  setTimeout(() => {
    self.registration.showNotification("Evening Check-in! 🌆", {
      body: "How did your spending go today? Update your expenses!",
      icon: "/placeholder-logo.png",
      badge: "/placeholder-logo.png",
      tag: "evening-reminder",
    })
  }, eveningTime.getTime() - Date.now())
}

async function syncData() {
  // Sync any pending data when connection is restored
  console.log("Background sync triggered")
}
