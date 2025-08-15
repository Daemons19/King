const CACHE_NAME = "budget-tracker-v34"
const urlsToCache = ["/", "/manifest.json", "/placeholder-logo.png", "/offline.html"]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event
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
  // Ensure the service worker takes control immediately
  self.clients.claim()
})

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          // If both cache and network fail, return offline page for navigation requests
          if (event.request.destination === "document") {
            return caches.match("/offline.html")
          }
        })
      )
    }),
  )
})

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Enhanced notification system for bill reminders
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  // Handle notification clicks
  if (event.action === "pay_bill") {
    // Open app to bills section
    event.waitUntil(clients.openWindow("/?tab=payables"))
  } else {
    // Default action - open app
    event.waitUntil(clients.openWindow("/"))
  }
})

// Schedule weekly payables notifications
const schedulePayableNotifications = () => {
  // This would integrate with the Notification API
  // For now, we'll handle this in the main app
  console.log("Payable notifications scheduled for Saturday")
}

// Background sync for offline bill payments
self.addEventListener("sync", (event) => {
  if (event.tag === "bill-payment-sync") {
    event.waitUntil(syncBillPayments())
  }
})

const syncBillPayments = async () => {
  // Handle offline bill payment sync
  try {
    const pendingPayments = await getStoredPayments()
    // Process pending payments when back online
    console.log("Syncing bill payments:", pendingPayments)
  } catch (error) {
    console.error("Bill payment sync failed:", error)
  }
}

const getStoredPayments = async () => {
  // Get pending payments from IndexedDB or localStorage
  return []
}
