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
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastNotificationSent, setLastNotificationSent] = useState<string | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isPWA, setIsPWA] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
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
    setDebugInfo((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
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

      if (isPWAMode) {
        addDebug("PWA mode detected - notifications MUST use Service Worker")
      }
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

  // Initialize notification system with proper service worker
  useEffect(() => {
    const initNotifications = async () => {
      addDebug("Initializing notification system...")

      // Check basic support
      const basicSupport = "Notification" in window && "serviceWorker" in navigator
      setIsSupported(basicSupport)

      if (!basicSupport) {
        setLastError("Notifications or Service Workers not supported on this device")
        addDebug("Notification API or Service Worker not available")
        return
      }

      addDebug("Notification API and Service Worker available")

      // Get current permission
      const currentPermission = Notification.permission
      setPermission(currentPermission)
      addDebug(`Current permission: ${currentPermission}`)

      // Register service worker - CRITICAL for PWA notifications
      try {
        addDebug("Registering service worker...")

        // Check if service worker is already registered
        const existingRegistration = await navigator.serviceWorker.getRegistration()

        if (existingRegistration) {
          addDebug("Using existing service worker registration")
          setRegistration(existingRegistration)
          setServiceWorkerReady(true)
        } else {
          addDebug("No existing service worker found - this might be the issue")
          setLastError("Service Worker not found. Please refresh the app or reinstall the PWA.")
          return
        }

        // Wait for service worker to be ready
        const readyRegistration = await navigator.serviceWorker.ready
        setRegistration(readyRegistration)
        setServiceWorkerReady(true)
        addDebug("Service worker is ready for notifications")

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "NOTIFICATION_ERROR") {
            setLastError(event.data.error)
            addDebug(`SW Error: ${event.data.error}`)
          } else if (event.data?.type === "NOTIFICATION_SUCCESS") {
            addDebug(`SW Success: ${event.data.title}`)
          }
        })
      } catch (error) {
        console.error("Service Worker initialization failed:", error)
        setLastError(`Service Worker failed: ${error.message}`)
        addDebug(`SW Error: ${error.message}`)
        return
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

    if (!serviceWorkerReady) {
      setLastError("Service Worker not ready. Please refresh the app.")
      addDebug("Attempted to request permission without service worker")
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
        addDebug("Permission granted, sending welcome notification via Service Worker")

        // Send welcome notification using Service Worker (REQUIRED for PWA)
        await sendServiceWorkerNotification({
          title: "🎉 PWA Notifications Enabled!",
          body: "Perfect! Your Poco F6 will now receive notifications even when the app is closed. This proves it's working!",
          tag: "welcome",
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
          data: { type: "welcome", timestamp: Date.now() },
        })

        setLastNotificationSent("Welcome notification sent via Service Worker!")
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

  const sendServiceWorkerNotification = async (options: {
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

    if (!serviceWorkerReady || !registration) {
      setLastError("Service Worker not ready. Please refresh the app.")
      addDebug("Attempted to send notification without service worker")
      return false
    }

    try {
      addDebug(`Sending SW notification: ${options.title}`)

      const notificationOptions = {
        body: options.body,
        icon: options.icon || "/placeholder-logo.png",
        badge: options.badge || "/placeholder-logo.png",
        tag: options.tag || `notification-${Date.now()}`,
        requireInteraction: options.requireInteraction || true,
        silent: options.silent || false,
        vibrate: options.vibrate || [200, 100, 200],
        data: options.data || {},
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

      // Use Service Worker registration to show notification (REQUIRED for PWA)
      await registration.showNotification(options.title, notificationOptions)

      setNotificationCount((prev) => prev + 1)
      setLastNotificationSent(`"${options.title}" sent at ${new Date().toLocaleTimeString()}`)
      setLastError(null)
      addDebug("Service Worker notification sent successfully")
      return true
    } catch (error) {
      console.error("Error sending Service Worker notification:", error)
      setLastError(`Failed to send notification: ${error.message}`)
      addDebug(`SW Notification failed: ${error.message}`)
      return false
    }
  }

  const sendTestNotification = async () => {
    addDebug("Test notification requested")
    const success = await sendServiceWorkerNotification({
      title: "🧪 PWA Test - Budget Tracker",
      body: "SUCCESS! 🎉 Your Poco F6 PWA notifications are working perfectly! Check your notification panel.",
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
    const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
    if (pendingBills.length === 0) {
      setLastError("No pending bills to remind about")
      addDebug("No pending bills found")
      return
    }

    const totalAmount = pendingBills.reduce((sum, bill) => sum + bill.amount, 0)
    await sendServiceWorkerNotification({
      title: "💳 Bill Reminder - Budget Tracker",
      body: `You have ${pendingBills.length} pending bill(s) totaling ${currency}${totalAmount.toLocaleString()}. Don't forget to pay them!`,
      tag: "bill-reminder",
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: { type: "bills", bills: pendingBills },
    })
  }

  const sendGoalReminder = async () => {
    const todayData = dailyIncome.find((d) => d.isToday)
    if (!todayData?.isWorkDay || todayData.goal <= 0) {
      setLastError("No work day goal to remind about")
      addDebug("No work day goal found for today")
      return
    }

    const progress = (todayData.amount / todayData.goal) * 100
    const remaining = todayData.goal - todayData.amount

    await sendServiceWorkerNotification({
      title: "🎯 Goal Reminder - Budget Tracker",
      body: `Today's progress: ${progress.toFixed(0)}%. You need ${currency}${remaining.toLocaleString()} more to reach your daily goal!`,
      tag: "goal-reminder",
      requireInteraction: true,
      vibrate: [150, 75, 150, 75, 150],
      data: { type: "goal", progress, remaining },
    })
  }

  const sendUrgentAlert = async () => {
    await sendServiceWorkerNotification({
      title: "🚨 URGENT PWA TEST - Budget Tracker",
      body: "MAXIMUM VIBRATION TEST! 📳 If you feel this vibration on your Poco F6, PWA notifications are working perfectly!",
      tag: "urgent-test",
      requireInteraction: true,
      silent: false,
      vibrate: [300, 100, 300, 100, 300, 100, 300, 100, 300],
      data: { type: "urgent", timestamp: Date.now() },
    })
  }

  // Auto-send notifications based on data changes
  useEffect(() => {
    if (!notificationsEnabled || permission !== "granted" || !serviceWorkerReady) return

    const checkAndSendNotifications = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentDay = now.toLocaleDateString("en-US", { weekday: "short" })

      // Send notifications at specific times
      if (currentMinute === 0 && settings.dailyReminders) {
        const todayData = dailyIncome.find((d) => d.day === currentDay)
        if (todayData?.isWorkDay && todayData.goal > 0) {
          const progress = (todayData.amount / todayData.goal) * 100

          if (progress < 50 && currentHour >= 12) {
            sendServiceWorkerNotification({
              title: "⚡ Daily Goal Alert",
              body: `You're at ${progress.toFixed(0)}% of today's goal. Time to hustle! ${currency}${(todayData.goal - todayData.amount).toLocaleString()} to go.`,
              tag: "daily-alert",
              requireInteraction: true,
              vibrate: [200, 100, 200],
            })
          }
        }
      }
    }

    // Check every minute
    const interval = setInterval(checkAndSendNotifications, 60000)
    return () => clearInterval(interval)
  }, [notificationsEnabled, permission, serviceWorkerReady, settings, weeklyPayables, dailyIncome, currency])

  // Calculate current stats
  const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
  const todayData = dailyIncome.find((d) => d.isToday)
  const todayProgress = todayData && todayData.goal > 0 ? (todayData.amount / todayData.goal) * 100 : 0

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
              Great! You're using the installed PWA version. Notifications will work even when the app is closed.
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
            <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
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
            {lastError.includes("Service Worker") && (
              <div className="text-xs text-red-600 bg-white p-2 rounded mb-3">
                <p className="font-medium">Try these fixes:</p>
                <p>1. Close and reopen the PWA app</p>
                <p>2. Restart your phone</p>
                <p>3. Uninstall and reinstall the PWA</p>
              </div>
            )}
            <Button onClick={() => setLastError(null)} variant="outline" size="sm" className="bg-white hover:bg-red-50">
              Dismiss
            </Button>
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
            PWA Push Notifications
            <div className="flex gap-2 ml-auto">
              {serviceWorkerReady && <Badge className="bg-green-100 text-green-800 text-xs">SW Ready</Badge>}
              {notificationCount > 0 && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">{notificationCount} sent</Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>Get real-time alerts on your Poco F6 PWA for bills, goals, and reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Worker Status */}
          <div
            className={`p-3 rounded-lg border ${
              serviceWorkerReady ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                {serviceWorkerReady ? "✅ Service Worker Ready" : "⚠️ Service Worker Not Ready"}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {serviceWorkerReady
                ? "PWA notifications are ready to work"
                : "Service Worker is required for PWA notifications"}
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
              {permission === "granted" && serviceWorkerReady && (
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              )}
            </div>

            {permission === "default" && (
              <div className="space-y-3">
                <p className="text-sm text-blue-700">
                  <strong>📱 For Poco F6 PWA:</strong> Enable notifications to receive alerts even when the app is
                  closed.
                </p>
                <Button
                  onClick={requestPermission}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!serviceWorkerReady}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable PWA Push Notifications
                </Button>
                {!serviceWorkerReady && (
                  <p className="text-xs text-orange-600">Please wait for Service Worker to be ready...</p>
                )}
              </div>
            )}

            {permission === "denied" && (
              <div className="space-y-3">
                <p className="text-sm text-red-700 mb-2">
                  <strong>Notifications are blocked.</strong> To enable on your Poco F6 PWA:
                </p>
                <div className="text-xs text-red-600 space-y-2 bg-white p-3 rounded">
                  <div>
                    <p className="font-medium">📱 Poco F6 PWA Settings:</p>
                    <p>1. Go to Android Settings → Apps</p>
                    <p>2. Find "Budget Tracker" (the PWA app)</p>
                    <p>3. Tap "Notifications" → Enable all</p>
                    <p>4. Make sure "Show on lock screen" is ON</p>
                  </div>
                  <div>
                    <p className="font-medium">🔄 Alternative:</p>
                    <p>1. Uninstall the PWA from your home screen</p>
                    <p>2. Open in Chrome browser</p>
                    <p>3. Allow notifications when prompted</p>
                    <p>4. Reinstall as PWA</p>
                  </div>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                  Refresh App to Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Test Notifications */}
          {permission === "granted" && serviceWorkerReady && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={sendTestNotification}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Send className="w-4 h-4 mr-2" />🧪 Send PWA Test Notification
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
      {permission === "granted" && notificationsEnabled && serviceWorkerReady && (
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
                  {pendingBills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()}
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
                  {todayData.amount.toLocaleString()} of {currency}
                  {todayData.goal.toLocaleString()} ({todayProgress.toFixed(0)}%)
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

      {/* PWA Troubleshooting */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-800 text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4" />📱 Poco F6 PWA Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-purple-700 space-y-3">
            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">🔧 If notifications don't work:</p>
              <p>1. Android Settings → Apps → Budget Tracker → Notifications → Enable all</p>
              <p>2. Make sure "Show on lock screen" is ON</p>
              <p>3. Battery optimization: Settings → Battery → App battery usage → Budget Tracker → No restrictions</p>
            </div>

            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">🔄 Reset PWA:</p>
              <p>1. Long press the app icon → App info → Storage → Clear data</p>
              <p>2. Or uninstall PWA and reinstall from Chrome</p>
              <p>3. Make sure to allow notifications when prompted</p>
            </div>

            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">📲 Testing:</p>
              <p>• Use "Send PWA Test Notification" button above</p>
              <p>• Check notification panel by swiping down</p>
              <p>• Try "URGENT Alert" for maximum vibration</p>
              <p>• Notifications should work even when app is closed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-800 text-sm">PWA Information</CardTitle>
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
              <strong>Permission:</strong> {permission}
            </p>
            <p>
              <strong>Service Worker:</strong> {serviceWorkerReady ? "Ready" : "Not Ready"}
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
