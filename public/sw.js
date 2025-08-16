const CACHE_NAME = "budget-tracker-v37"
const APP_VERSION = "v37"
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

// Enhanced notification handling for mobile devices
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag)

  event.notification.close()

  // Handle different notification types
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
      }),
  )
})

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag)

  // Track notification dismissals if needed
  const notificationData = event.notification.data || {}

  // Could send analytics or update user preferences here
})

// Background sync for notifications (if supported)
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag)

  if (event.tag === "background-notification-check") {
    event.waitUntil(checkAndSendNotifications())
  }
})

// Function to check and send notifications
async function checkAndSendNotifications() {
  try {
    // This would typically check stored data or make API calls
    // For now, we'll just log that sync happened
    console.log("Background notification check completed")

    // Example: Check if it's time for daily reminders
    const now = new Date()
    const hour = now.getHours()

    // Send morning motivation at 8 AM
    if (hour === 8) {
      await self.registration.showNotification("Good Morning! 🌅", {
        body: "Ready to crush your daily income goal today?",
        icon: "/placeholder-logo.png",
        badge: "/placeholder-logo.png",
        tag: "morning-motivation",
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: {
          type: "motivation",
          time: "morning",
        },
      })
    }

    // Send evening check-in at 8 PM
    if (hour === 20) {
      await self.registration.showNotification("Evening Check-in 🌙", {
        body: "How did your day go? Don't forget to log your earnings!",
        icon: "/placeholder-logo.png",
        badge: "/placeholder-logo.png",
        tag: "evening-checkin",
        requireInteraction: false,
        vibrate: [100, 50, 100],
        data: {
          type: "checkin",
          time: "evening",
        },
      })
    }
  } catch (error) {
    console.error("Error in background notification check:", error)
  }
}

// Push notification handler (for future server-sent notifications)
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
    actions: [
      {
        action: "view",
        title: "View App",
        icon: "/placeholder-logo.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
        icon: "/placeholder-logo.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, options))
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

    case "SCHEDULE_NOTIFICATION":
      // Handle notification scheduling from main app
      if (data && data.title && data.body) {
        self.registration.showNotification(data.title, {
          body: data.body,
          icon: "/placeholder-logo.png",
          badge: "/placeholder-logo.png",
          tag: data.tag || "scheduled",
          vibrate: [200, 100, 200],
          data: data.data || {},
        })
      }
      break

    case "REGISTER_BACKGROUND_SYNC":
      // Register background sync for notifications
      if ("sync" in self.registration) {
        self.registration.sync.register("background-notification-check")
      }
      break
  }
})

// Handle app installation
self.addEventListener("appinstalled", (event) => {
  console.log("PWA was installed")

  // Show welcome notification
  self.registration.showNotification("Budget Tracker Installed! 🎉", {
    body: "Your budget tracker is now installed and ready to use offline. Notifications are enabled!",
    icon: "/placeholder-logo.png",
    badge: "/placeholder-logo.png",
    tag: "app-installed",
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
  })
})

console.log(`Service Worker ${APP_VERSION} loaded successfully`)
