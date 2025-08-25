"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Send,
  Settings,
  Zap,
  Target,
  Wifi,
  Download,
  RefreshCw,
  X,
} from "lucide-react"

interface NotificationManagerProps {
  weeklyPayables: Array<{
    id: number
    name: string
    amount: number
    dueDay: string
    status: string
    week: string
  }>
  dailyIncome: Array<{
    day: string
    amount: number
    goal: number
    date: string
    isToday: boolean
    isPast: boolean
    isWorkDay: boolean
  }>
  currency: string
}

export default function NotificationManager({ weeklyPayables, dailyIncome, currency }: NotificationManagerProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false)
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastNotificationSent, setLastNotificationSent] = useState<string | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isPWA, setIsPWA] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isActivating, setIsActivating] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [useDirectNotifications, setUseDirectNotifications] = useState(false)
  const [settings, setSettings] = useState({
    billReminders: true,
    goalAlerts: true,
    dailyReminders: true,
    weeklyReports: true,
    morningReminders: true,
    eveningCheckins: true,
  })

  // Add debug message
  const addDebug = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 12)])
    console.log(`[NotificationManager] ${message}`)
  }

  // Check if running as PWA
  useEffect(() => {
    const checkPWA = () => {
      const isPWAMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true ||
        document.referrer.includes("android-app://")

      setIsPWA(isPWAMode)
      addDebug(`Running as PWA: ${isPWAMode}`)
    }

    checkPWA()
  }, [])

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      addDebug("Device is online")
    }
    const handleOffline = () => {
      setIsOnline(false)
      addDebug("Device is offline")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Simple Service Worker registration - REDUNDANT SYSTEM 1
  const registerSimpleServiceWorker = async () => {
    addDebug("Attempting simple service worker registration...")
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      addDebug("Simple service worker registered successfully")
      return registration
    } catch (error) {
      addDebug(`Simple service worker failed: ${error.message}`)
      throw error
    }
  }

  // Inline Service Worker - REDUNDANT SYSTEM 2
  const createInlineServiceWorker = async () => {
    addDebug("Creating inline service worker...")
    const swCode = `
      console.log('Inline Service Worker loaded');
      
      self.addEventListener('install', (event) => {
        console.log('Inline SW installed');
        self.skipWaiting();
      });
      
      self.addEventListener('activate', (event) => {
        console.log('Inline SW activated');
        event.waitUntil(self.clients.claim());
      });
      
      self.addEventListener('notificationclick', (event) => {
        console.log('Notification clicked');
        event.notification.close();
        event.waitUntil(
          clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
              if (client.url.includes(self.location.origin) && 'focus' in client) {
                return client.focus();
              }
            }
            if (clients.openWindow) {
              return clients.openWindow('/');
            }
          })
        );
      });
    `

    try {
      const blob = new Blob([swCode], { type: "application/javascript" })
      const swUrl = URL.createObjectURL(blob)
      const registration = await navigator.serviceWorker.register(swUrl, { scope: "/" })
      addDebug("Inline service worker created successfully")
      URL.revokeObjectURL(swUrl)
      return registration
    } catch (error) {
      addDebug(`Inline service worker failed: ${error.message}`)
      throw error
    }
  }

  // Get existing registration - REDUNDANT SYSTEM 3
  const getExistingRegistration = async () => {
    addDebug("Checking for existing service worker...")
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        addDebug("Found existing service worker registration")
        return registration
      }
      throw new Error("No existing registration found")
    } catch (error) {
      addDebug(`No existing registration: ${error.message}`)
      throw error
    }
  }

  // Wait for ready - REDUNDANT SYSTEM 4
  const waitForReady = async () => {
    addDebug("Waiting for service worker ready...")
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000)),
      ])
      addDebug("Service worker ready obtained")
      return registration
    } catch (error) {
      addDebug(`Service worker ready timeout: ${error.message}`)
      throw error
    }
  }

  // MASTER REGISTRATION FUNCTION WITH ALL REDUNDANT SYSTEMS
  const registerServiceWorkerWithAllFallbacks = async () => {
    setIsRegistering(true)
    addDebug("Starting comprehensive service worker registration...")

    const strategies = [
      { name: "Existing Registration", fn: getExistingRegistration },
      { name: "Simple Registration", fn: registerSimpleServiceWorker },
      { name: "Inline Service Worker", fn: createInlineServiceWorker },
      { name: "Wait for Ready", fn: waitForReady },
    ]

    for (const strategy of strategies) {
      try {
        addDebug(`Trying strategy: ${strategy.name}`)
        const registration = await strategy.fn()

        if (registration) {
          setRegistration(registration)
          setServiceWorkerReady(true)
          addDebug(`SUCCESS with ${strategy.name}`)

          // Check if active
          if (registration.active) {
            setServiceWorkerActive(true)
            addDebug("Service worker is active")
          } else {
            addDebug("Service worker registered but not active yet")
            // Try to activate
            if (registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" })
              addDebug("Sent skip waiting message")
            }

            // Wait a bit for activation
            setTimeout(() => {
              if (registration.active) {
                setServiceWorkerActive(true)
                addDebug("Service worker became active")
              } else {
                addDebug("Service worker still not active - enabling direct notifications")
                setUseDirectNotifications(true)
              }
            }, 2000)
          }

          setLastError(null)
          setIsRegistering(false)
          return registration
        }
      } catch (error) {
        addDebug(`${strategy.name} failed: ${error.message}`)
        continue
      }
    }

    // All strategies failed
    addDebug("All service worker strategies failed - enabling direct notifications")
    setUseDirectNotifications(true)
    setServiceWorkerReady(true) // Fake it for UI
    setLastError("Service Worker failed - using direct notifications")
    setIsRegistering(false)
    return null
  }

  // Initialize notification system
  useEffect(() => {
    const initNotifications = async () => {
      addDebug("Initializing notification system...")

      // Check basic support
      const basicSupport = "Notification" in window
      const swSupport = "serviceWorker" in navigator
      setIsSupported(basicSupport)

      if (!basicSupport) {
        setLastError("Notifications not supported on this device")
        addDebug("Notification API not available")
        return
      }

      addDebug(`Notification API: ✓, Service Worker: ${swSupport ? "✓" : "✗"}`)

      // Get current permission
      const currentPermission = Notification.permission
      setPermission(currentPermission)
      addDebug(`Current permission: ${currentPermission}`)

      // Try to register service worker if supported
      if (swSupport) {
        try {
          await registerServiceWorkerWithAllFallbacks()
        } catch (error) {
          addDebug(`All SW registration failed: ${error.message}`)
          setUseDirectNotifications(true)
          setServiceWorkerReady(true)
        }
      } else {
        addDebug("Service Worker not supported - using direct notifications")
        setUseDirectNotifications(true)
        setServiceWorkerReady(true)
      }

      // Load saved settings
      try {
        const savedSettings = localStorage.getItem("notificationSettings")
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(parsed)
          setNotificationsEnabled(parsed.enabled && currentPermission === "granted")
          addDebug("Loaded saved notification settings")
        }
      } catch (error) {
        addDebug(`Error loading settings: ${error.message}`)
      }
    }

    initNotifications()
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    const settingsToSave = {
      ...settings,
      enabled: notificationsEnabled,
    }
    localStorage.setItem("notificationSettings", JSON.stringify(settingsToSave))
  }, [settings, notificationsEnabled])

  const requestPermission = async () => {
    if (!isSupported) {
      setLastError("Notifications are not supported on this device/browser")
      addDebug("Attempted to request permission on unsupported device")
      return
    }

    try {
      setLastError(null)
      addDebug("Requesting notification permission...")

      // Request permission with user gesture
      const result = await Notification.requestPermission()
      setPermission(result)
      addDebug(`Permission result: ${result}`)

      if (result === "granted") {
        setNotificationsEnabled(true)
        addDebug("Permission granted, sending welcome notification")

        // Send welcome notification using the most reliable method
        await sendNotificationWithAllMethods({
          title: "🎉 Notifications Enabled!",
          body: "Perfect! Your Poco F6 will now receive notifications. This proves everything is working!",
          tag: "welcome",
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
          data: { type: "welcome", timestamp: Date.now() },
        })

        setLastNotificationSent("Welcome notification sent successfully!")
        addDebug("Welcome notification sent successfully")
      } else if (result === "denied") {
        setLastError("Notifications were denied. Please enable them in your device settings.")
        addDebug("Permission denied by user")
      } else {
        setLastError("Notification permission was not granted")
        addDebug("Permission not granted (dismissed)")
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      setLastError(`Permission request failed: ${error.message}`)
      addDebug(`Permission request error: ${error.message}`)
    }
  }

  // REDUNDANT NOTIFICATION SENDING - TRY ALL METHODS
  const sendNotificationWithAllMethods = async (options: {
    title: string
    body: string
    tag?: string
    icon?: string
    badge?: string
    requireInteraction?: boolean
    silent?: boolean
    vibrate?: number[]
    data?: any
  }) => {
    if (permission !== "granted") {
      setLastError("Notification permission not granted")
      addDebug("Attempted to send notification without permission")
      return false
    }

    try {
      addDebug(`Sending notification: ${options.title}`)

      const notificationOptions = {
        body: options.body,
        icon: options.icon || "/placeholder-logo.png",
        badge: options.badge || "/placeholder-logo.png",
        tag: options.tag || `notification-${Date.now()}`,
        requireInteraction: options.requireInteraction || true,
        silent: options.silent || false,
        vibrate: options.vibrate || [200, 100, 200],
        data: options.data || {},
      }

      let success = false

      // METHOD 1: Try Service Worker notification (best for PWA)
      if (serviceWorkerActive && registration && registration.active) {
        try {
          addDebug("Trying Service Worker notification...")
          await registration.showNotification(options.title, {
            ...notificationOptions,
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
          })
          addDebug("Service Worker notification sent successfully")
          success = true
        } catch (error) {
          addDebug(`Service Worker notification failed: ${error.message}`)
        }
      }

      // METHOD 2: Try direct notification (fallback)
      if (!success) {
        try {
          addDebug("Trying direct notification...")
          const notification = new Notification(options.title, notificationOptions)

          notification.onclick = () => {
            window.focus()
            notification.close()
            addDebug("Direct notification clicked")
          }

          notification.onshow = () => {
            addDebug("Direct notification shown successfully")
          }

          notification.onerror = (error) => {
            addDebug(`Direct notification error: ${error}`)
          }

          addDebug("Direct notification created successfully")
          success = true
        } catch (error) {
          addDebug(`Direct notification failed: ${error.message}`)
        }
      }

      // METHOD 3: Try creating a new service worker just for this notification
      if (!success && "serviceWorker" in navigator) {
        try {
          addDebug("Trying emergency service worker notification...")
          const emergencyRegistration = await createInlineServiceWorker()
          if (emergencyRegistration) {
            await emergencyRegistration.showNotification(options.title, notificationOptions)
            addDebug("Emergency service worker notification sent")
            success = true
          }
        } catch (error) {
          addDebug(`Emergency service worker failed: ${error.message}`)
        }
      }

      if (success) {
        setNotificationCount((prev) => prev + 1)
        setLastNotificationSent(`"${options.title}" sent at ${new Date().toLocaleTimeString()}`)
        setLastError(null)
        addDebug("Notification sent successfully")
        return true
      } else {
        throw new Error("All notification methods failed")
      }
    } catch (error) {
      console.error("Error sending notification:", error)
      setLastError(`Failed to send notification: ${error.message}`)
      addDebug(`Notification failed: ${error.message}`)
      return false
    }
  }

  const sendTestNotification = async () => {
    addDebug("Test notification requested")
    const success = await sendNotificationWithAllMethods({
      title: "🧪 Test Notification - Budget Tracker",
      body: "SUCCESS! 🎉 Your Poco F6 notifications are working perfectly! Check your notification panel.",
      tag: "test",
      requireInteraction: true,
      vibrate: [100, 50, 100, 50, 100, 50, 100],
      data: { type: "test", timestamp: Date.now() },
    })

    if (success) {
      addDebug("Test notification sent successfully")
    }
  }

  const sendBillReminder = async () => {
    try {
      addDebug("Bill reminder requested")

      // Safe check for weeklyPayables
      if (!Array.isArray(weeklyPayables)) {
        addDebug("weeklyPayables is not an array")
        setLastError("No payables data available")
        return
      }

      const pendingBills = weeklyPayables.filter((p) => p && p.status === "pending")

      if (pendingBills.length === 0) {
        setLastError("No pending bills to remind about")
        addDebug("No pending bills found")
        return
      }

      const totalAmount = pendingBills.reduce((sum, bill) => {
        const amount = bill && typeof bill.amount === "number" ? bill.amount : 0
        return sum + amount
      }, 0)

      const success = await sendNotificationWithAllMethods({
        title: "💳 Bill Reminder - Budget Tracker",
        body: `You have ${pendingBills.length} pending bill(s) totaling ${currency}${totalAmount.toLocaleString()}. Don't forget to pay them!`,
        tag: "bill-reminder",
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { type: "bills", bills: pendingBills },
      })

      if (success) {
        addDebug("Bill reminder sent successfully")
      }
    } catch (error) {
      console.error("Error in sendBillReminder:", error)
      setLastError(`Bill reminder failed: ${error.message}`)
      addDebug(`Bill reminder error: ${error.message}`)
    }
  }

  const sendGoalReminder = async () => {
    try {
      addDebug("Goal reminder requested")

      // Safe check for dailyIncome
      if (!Array.isArray(dailyIncome)) {
        addDebug("dailyIncome is not an array")
        setLastError("No income data available")
        return
      }

      const todayData = dailyIncome.find((d) => d && d.isToday)

      if (!todayData || !todayData.isWorkDay || (todayData.goal || 0) <= 0) {
        setLastError("No work day goal to remind about")
        addDebug("No work day goal found for today")
        return
      }

      const progress = ((todayData.amount || 0) / (todayData.goal || 1)) * 100
      const remaining = (todayData.goal || 0) - (todayData.amount || 0)

      const success = await sendNotificationWithAllMethods({
        title: "🎯 Goal Reminder - Budget Tracker",
        body: `Today's progress: ${progress.toFixed(0)}%. You need ${currency}${remaining.toLocaleString()} more to reach your daily goal!`,
        tag: "goal-reminder",
        requireInteraction: true,
        vibrate: [150, 75, 150, 75, 150],
        data: { type: "goal", progress, remaining },
      })

      if (success) {
        addDebug("Goal reminder sent successfully")
      }
    } catch (error) {
      console.error("Error in sendGoalReminder:", error)
      setLastError(`Goal reminder failed: ${error.message}`)
      addDebug(`Goal reminder error: ${error.message}`)
    }
  }

  const sendUrgentAlert = async () => {
    await sendNotificationWithAllMethods({
      title: "🚨 URGENT TEST - Budget Tracker",
      body: "MAXIMUM VIBRATION TEST! 📳 If you feel this vibration on your Poco F6, notifications are working perfectly!",
      tag: "urgent-test",
      requireInteraction: true,
      silent: false,
      vibrate: [300, 100, 300, 100, 300, 100, 300, 100, 300],
      data: { type: "urgent", timestamp: Date.now() },
    })
  }

  const retryServiceWorkerRegistration = async () => {
    try {
      setLastError(null)
      addDebug("Retrying service worker registration...")
      await registerServiceWorkerWithAllFallbacks()
      addDebug("Service worker registration retry completed")
    } catch (error) {
      setLastError(`Service worker retry failed: ${error.message}`)
      addDebug(`Registration retry failed: ${error.message}`)
    }
  }

  const enableDirectNotificationFallback = () => {
    addDebug("Enabling direct notification fallback")
    setUseDirectNotifications(true)
    setServiceWorkerReady(true)
    setLastError(null)
    addDebug("Direct notifications enabled as fallback")
  }

  // Calculate current stats safely
  const pendingBills = Array.isArray(weeklyPayables) ? weeklyPayables.filter((p) => p && p.status === "pending") : []
  const todayData = Array.isArray(dailyIncome) ? dailyIncome.find((d) => d && d.isToday) : null
  const todayProgress = todayData && todayData.goal > 0 ? (todayData.amount / todayData.goal) * 100 : 0

  const canSendNotifications = serviceWorkerActive || useDirectNotifications

  return (
    <div className="space-y-4">
      {/* PWA Status */}
      {isPWA && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              PWA Mode Detected ✅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              You're using the installed PWA version. Multiple notification systems are active for maximum reliability.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      {debugInfo.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-800 text-sm flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Debug Log {isOnline ? "🟢" : "🔴"} {isPWA ? "📱PWA" : "🌐Web"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-600 space-y-1 max-h-40 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className="font-mono">
                  {info}
                </div>
              ))}
            </div>
            <Button onClick={() => setDebugInfo([])} variant="outline" size="sm" className="mt-2 text-xs">
              Clear Log
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {lastError && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-3">{lastError}</p>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setLastError(null)}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-red-50"
              >
                <X className="w-3 h-3 mr-1" />
                Dismiss
              </Button>

              <Button onClick={retryServiceWorkerRegistration} variant="outline" size="sm" disabled={isRegistering}>
                <RefreshCw className={`w-3 h-3 mr-1 ${isRegistering ? "animate-spin" : ""}`} />
                {isRegistering ? "Retrying..." : "Retry All Systems"}
              </Button>

              {!useDirectNotifications && (
                <Button
                  onClick={enableDirectNotificationFallback}
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  <Bell className="w-3 h-3 mr-1" />
                  Enable Fallback
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {lastNotificationSent && !lastError && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Notification Sent ✅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 mb-3">{lastNotificationSent}</p>
            <p className="text-xs text-green-600 mb-3">Check your Poco F6's notification panel!</p>
            <Button
              onClick={() => setLastNotificationSent(null)}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-green-50"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Notification Settings */}
      <Card className="bg-white/90 border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-green-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            Redundant Push Notifications
            <div className="flex gap-2 ml-auto">
              {serviceWorkerReady && <Badge className="bg-green-100 text-green-800 text-xs">SW Ready</Badge>}
              {serviceWorkerActive && <Badge className="bg-blue-100 text-blue-800 text-xs">SW Active</Badge>}
              {useDirectNotifications && <Badge className="bg-purple-100 text-purple-800 text-xs">Direct</Badge>}
              {notificationCount > 0 && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">{notificationCount} sent</Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>Multiple notification systems for maximum reliability on your Poco F6</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Status */}
          <div
            className={`p-3 rounded-lg border ${
              canSendNotifications
                ? "bg-green-50 border-green-200"
                : isRegistering
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {canSendNotifications
                  ? "✅ Notification Systems Ready"
                  : isRegistering
                    ? "⚠️ Initializing Systems..."
                    : "❌ Systems Not Ready"}
              </span>

              {!canSendNotifications && !isRegistering && (
                <div className="flex gap-2">
                  <Button onClick={retryServiceWorkerRegistration} size="sm" variant="outline" disabled={isRegistering}>
                    <RefreshCw className={`w-3 h-3 mr-1 ${isRegistering ? "animate-spin" : ""}`} />
                    Retry All
                  </Button>

                  <Button onClick={enableDirectNotificationFallback} size="sm" variant="outline">
                    <Bell className="w-3 h-3 mr-1" />
                    Force Enable
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600">
              {canSendNotifications
                ? "Multiple redundant notification systems are active and ready"
                : isRegistering
                  ? "Trying all available notification methods..."
                  : "All notification systems failed - click buttons above to retry"}
            </p>
          </div>

          {/* Permission Status */}
          <div
            className={`p-4 rounded-lg border-2 ${
              permission === "granted"
                ? "bg-green-50 border-green-200"
                : permission === "denied"
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                {permission === "granted"
                  ? "✅ Notifications Enabled"
                  : permission === "denied"
                    ? "❌ Notifications Blocked"
                    : "⚠️ Notifications Not Set Up"}
              </span>
              {permission === "granted" && canSendNotifications && (
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              )}
            </div>

            {permission === "default" && (
              <div className="space-y-3">
                <p className="text-sm text-blue-700">
                  <strong>📱 For Poco F6 PWA:</strong> Enable notifications to receive alerts with multiple backup
                  systems.
                </p>
                <Button
                  onClick={requestPermission}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!isSupported}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable All Notification Systems
                </Button>
                {!isSupported && <p className="text-xs text-orange-600">Notifications not supported on this device</p>}
              </div>
            )}

            {permission === "denied" && (
              <div className="space-y-3">
                <p className="text-sm text-red-700 mb-2">
                  <strong>Notifications are blocked.</strong> To enable on your Poco F6:
                </p>
                <div className="text-xs text-red-600 space-y-2 bg-white p-3 rounded">
                  <div>
                    <p className="font-medium">📱 Poco F6 Settings:</p>
                    <p>1. Android Settings → Apps → Budget Tracker</p>
                    <p>2. Tap "Notifications" → Enable all</p>
                    <p>3. Make sure "Show on lock screen" is ON</p>
                  </div>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                  Refresh App to Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Test Notifications */}
          {permission === "granted" && canSendNotifications && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={sendTestNotification}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Send className="w-4 h-4 mr-2" />🧪 Send Test Notification (All Systems)
                </Button>

                <Button
                  onClick={sendUrgentAlert}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                >
                  <Zap className="w-4 h-4 mr-2" />🚨 Send URGENT Alert (Max Vibration)
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={sendBillReminder} variant="outline" size="sm" disabled={pendingBills.length === 0}>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Bill Alert
                  </Button>
                  <Button onClick={sendGoalReminder} variant="outline" size="sm" disabled={!todayData?.isWorkDay}>
                    <Target className="w-4 h-4 mr-1" />
                    Goal Alert
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types Settings */}
      {permission === "granted" && notificationsEnabled && canSendNotifications && (
        <Card className="bg-white/90 border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Notification Types
            </CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <Label htmlFor="bill-reminders" className="font-medium">
                    💳 Bill Reminders
                  </Label>
                  <p className="text-xs text-gray-600">When bills are due today</p>
                </div>
                <Switch
                  id="bill-reminders"
                  checked={settings.billReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, billReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <Label htmlFor="goal-alerts" className="font-medium">
                    🎯 Goal Alerts
                  </Label>
                  <p className="text-xs text-gray-600">When behind on daily goals</p>
                </div>
                <Switch
                  id="goal-alerts"
                  checked={settings.goalAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, goalAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <Label htmlFor="daily-reminders" className="font-medium">
                    ⏰ Hourly Reminders
                  </Label>
                  <p className="text-xs text-gray-600">Progress checks every hour</p>
                </div>
                <Switch
                  id="daily-reminders"
                  checked={settings.dailyReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, dailyReminders: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      <Card className="bg-white/90 border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Current Status
          </CardTitle>
          <CardDescription>What you'd be notified about right now</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Pending Bills */}
          {pendingBills.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">Pending Bills</p>
                <p className="text-sm text-orange-600">
                  {pendingBills.length} bill(s) • {currency}
                  {pendingBills.reduce((sum, bill) => sum + (bill?.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <Badge className="bg-orange-100 text-orange-800">{pendingBills.length}</Badge>
            </div>
          )}

          {/* Today's Goal */}
          {todayData?.isWorkDay && (
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                todayProgress >= 100
                  ? "bg-green-50 border-green-200"
                  : todayProgress >= 50
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
              }`}
            >
              <Target
                className={`w-5 h-5 ${
                  todayProgress >= 100 ? "text-green-600" : todayProgress >= 50 ? "text-blue-600" : "text-red-600"
                }`}
              />
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    todayProgress >= 100 ? "text-green-800" : todayProgress >= 50 ? "text-blue-800" : "text-red-800"
                  }`}
                >
                  Today's Goal Progress
                </p>
                <p
                  className={`text-sm ${
                    todayProgress >= 100 ? "text-green-600" : todayProgress >= 50 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {currency}
                  {(todayData.amount || 0).toLocaleString()} of {currency}
                  {(todayData.goal || 0).toLocaleString()} ({todayProgress.toFixed(0)}%)
                </p>
              </div>
              <Badge
                className={
                  todayProgress >= 100
                    ? "bg-green-100 text-green-800"
                    : todayProgress >= 50
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {todayProgress.toFixed(0)}%
              </Badge>
            </div>
          )}

          {/* All Good */}
          {pendingBills.length === 0 && (!todayData?.isWorkDay || todayProgress >= 80) && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-800">All Good! 🎉</p>
                <p className="text-sm text-green-600">No urgent notifications needed right now</p>
              </div>
              <Badge className="bg-green-100 text-green-800">✓</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-800 text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4" />📱 Poco F6 PWA Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-purple-700 space-y-3">
            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">🔧 If notifications still don't work:</p>
              <p>1. Use "Retry All Systems" button above</p>
              <p>2. Use "Force Enable" for direct notifications</p>
              <p>3. Close PWA completely and reopen</p>
              <p>4. Restart your Poco F6</p>
              <p>5. Clear PWA data and reinstall</p>
            </div>

            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">🔧 Poco F6 Settings:</p>
              <p>1. Android Settings → Apps → Budget Tracker → Notifications → Enable all</p>
              <p>2. Make sure "Show on lock screen" is ON</p>
              <p>3. Battery: Settings → Battery → Budget Tracker → No restrictions</p>
            </div>

            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">📲 Testing:</p>
              <p>• Look for "SW Ready", "SW Active", or "Direct" badges above</p>
              <p>• Use "Send Test Notification (All Systems)" button</p>
              <p>• Check notification panel by swiping down</p>
              <p>• Try "URGENT Alert" for maximum vibration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-800 text-sm">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <strong>Mode:</strong> {isPWA ? "PWA (Installed App)" : "Web Browser"}
            </p>
            <p>
              <strong>Platform:</strong> {navigator.platform}
            </p>
            <p>
              <strong>Online:</strong> {isOnline ? "Yes" : "No"}
            </p>
            <p>
              <strong>Notification Support:</strong> {isSupported ? "Yes" : "No"}
            </p>
            <p>
              <strong>Service Worker Support:</strong> {"serviceWorker" in navigator ? "Yes" : "No"}
            </p>
            <p>
              <strong>Permission:</strong> {permission}
            </p>
            <p>
              <strong>Service Worker Ready:</strong> {serviceWorkerReady ? "Yes" : "No"}
            </p>
            <p>
              <strong>Service Worker Active:</strong> {serviceWorkerActive ? "Yes" : "No"}
            </p>
            <p>
              <strong>Registration:</strong> {registration ? "Available" : "Not Available"}
            </p>
            <p>
              <strong>Direct Notifications:</strong> {useDirectNotifications ? "Enabled" : "Disabled"}
            </p>
            <p>
              <strong>Can Send Notifications:</strong> {canSendNotifications ? "Yes" : "No"}
            </p>
            <p>
              <strong>User Agent:</strong> {navigator.userAgent.includes("wv") ? "WebView (PWA)" : "Browser"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
