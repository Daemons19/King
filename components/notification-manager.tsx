"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, AlertTriangle, CheckCircle, Smartphone, Send, Settings, Zap, Target, Wifi } from "lucide-react"

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
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastNotificationSent, setLastNotificationSent] = useState<string | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(true)
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

  // Initialize notification system with fallback approach
  useEffect(() => {
    const initNotifications = async () => {
      addDebug("Initializing notification system...")

      // Check basic support
      const basicSupport = "Notification" in window
      setIsSupported(basicSupport)

      if (!basicSupport) {
        setLastError("Notifications not supported on this browser")
        addDebug("Notification API not available")
        return
      }

      addDebug("Notification API available")

      // Get current permission
      const currentPermission = Notification.permission
      setPermission(currentPermission)
      addDebug(`Current permission: ${currentPermission}`)

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

      // Register inline service worker to avoid MIME type issues
      if ("serviceWorker" in navigator) {
        try {
          // Create service worker as blob to avoid MIME type issues
          const swCode = `
            const CACHE_NAME = "budget-tracker-inline-v1";
            
            self.addEventListener('install', (event) => {
              console.log('Inline SW installed');
              self.skipWaiting();
            });
            
            self.addEventListener('activate', (event) => {
              console.log('Inline SW activated');
              self.clients.claim();
            });
            
            self.addEventListener('notificationclick', (event) => {
              console.log('Notification clicked:', event.notification.tag);
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
            
            self.addEventListener('notificationclose', (event) => {
              console.log('Notification closed:', event.notification.tag);
            });
          `

          const blob = new Blob([swCode], { type: "application/javascript" })
          const swUrl = URL.createObjectURL(blob)

          const registration = await navigator.serviceWorker.register(swUrl)
          addDebug("Inline service worker registered successfully")

          // Clean up blob URL
          URL.revokeObjectURL(swUrl)
        } catch (error) {
          addDebug(`Service worker registration failed: ${error.message}`)
          // Continue without service worker - notifications can still work
        }
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

        // Send immediate welcome notification
        const welcomeNotification = new Notification("🎉 Notifications Enabled!", {
          body: "You'll now receive reminders for bills and goals. This notification proves it's working!",
          icon: "/placeholder-logo.png",
          badge: "/placeholder-logo.png",
          tag: "welcome",
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
          data: { type: "welcome", timestamp: Date.now() },
        })

        welcomeNotification.onclick = () => {
          window.focus()
          welcomeNotification.close()
        }

        setLastNotificationSent("Welcome notification sent!")
        setNotificationCount((prev) => prev + 1)
        addDebug("Welcome notification created successfully")
      } else if (result === "denied") {
        setLastError("Notifications were denied. Please enable them in your browser settings.")
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

  const sendDirectNotification = async (options: {
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

      // Try service worker first, then fallback to direct notification
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready
          await registration.showNotification(options.title, notificationOptions)
          addDebug("Service worker notification sent successfully")
        } else {
          throw new Error("Service worker not available")
        }
      } catch (swError) {
        addDebug(`Service worker failed, using direct notification: ${swError.message}`)

        // Fallback to direct notification
        const notification = new Notification(options.title, notificationOptions)

        notification.onclick = () => {
          window.focus()
          notification.close()
          addDebug("Notification clicked")
        }

        notification.onshow = () => {
          addDebug("Notification shown successfully")
        }

        notification.onerror = (error) => {
          addDebug(`Notification error: ${error}`)
        }
      }

      setNotificationCount((prev) => prev + 1)
      setLastNotificationSent(`"${options.title}" sent at ${new Date().toLocaleTimeString()}`)
      setLastError(null)
      addDebug("Notification sent successfully")
      return true
    } catch (error) {
      console.error("Error sending notification:", error)
      setLastError(`Failed to send notification: ${error.message}`)
      addDebug(`Notification failed: ${error.message}`)
      return false
    }
  }

  const sendTestNotification = async () => {
    addDebug("Test notification requested")
    const success = await sendDirectNotification({
      title: "🧪 Test Notification - Budget Tracker",
      body: "SUCCESS! If you see this notification on your phone, everything is working perfectly! 🎉",
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
    await sendDirectNotification({
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

    await sendDirectNotification({
      title: "🎯 Goal Reminder - Budget Tracker",
      body: `Today's progress: ${progress.toFixed(0)}%. You need ${currency}${remaining.toLocaleString()} more to reach your daily goal!`,
      tag: "goal-reminder",
      requireInteraction: true,
      vibrate: [150, 75, 150, 75, 150],
      data: { type: "goal", progress, remaining },
    })
  }

  const sendUrgentAlert = async () => {
    await sendDirectNotification({
      title: "🚨 URGENT - Budget Tracker",
      body: "This is an urgent test alert with maximum vibration and sound. You should definitely notice this!",
      tag: "urgent-test",
      requireInteraction: true,
      silent: false,
      vibrate: [300, 100, 300, 100, 300, 100, 300],
      data: { type: "urgent", timestamp: Date.now() },
    })
  }

  // Auto-send notifications based on data changes (simplified)
  useEffect(() => {
    if (!notificationsEnabled || permission !== "granted") return

    const checkAndSendNotifications = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentDay = now.toLocaleDateString("en-US", { weekday: "short" })

      // Send notifications at specific times (every hour for testing)
      if (currentMinute === 0 && settings.dailyReminders) {
        const todayData = dailyIncome.find((d) => d.day === currentDay)
        if (todayData?.isWorkDay && todayData.goal > 0) {
          const progress = (todayData.amount / todayData.goal) * 100

          if (progress < 50 && currentHour >= 12) {
            sendDirectNotification({
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
  }, [notificationsEnabled, permission, settings, weeklyPayables, dailyIncome, currency])

  // Calculate current stats
  const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
  const todayData = dailyIncome.find((d) => d.isToday)
  const todayProgress = todayData && todayData.goal > 0 ? (todayData.amount / todayData.goal) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Debug Info */}
      {debugInfo.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-800 text-sm flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Debug Log {isOnline ? "🟢" : "🔴"}
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
            <p className="text-xs text-green-600 mb-3">Check your phone's notification panel!</p>
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
            Push Notifications
            <div className="flex gap-2 ml-auto">
              {isSupported && <Badge className="bg-green-100 text-green-800 text-xs">Supported</Badge>}
              {notificationCount > 0 && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">{notificationCount} sent</Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>Get real-time alerts on your Poco F6 for bills, goals, and reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              {permission === "granted" && (
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              )}
            </div>

            {permission === "default" && (
              <div className="space-y-3">
                <p className="text-sm text-blue-700">
                  <strong>📱 For Poco F6:</strong> Enable notifications to receive alerts even when the app is closed.
                </p>
                <Button onClick={requestPermission} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Push Notifications
                </Button>
              </div>
            )}

            {permission === "denied" && (
              <div className="space-y-3">
                <p className="text-sm text-red-700 mb-2">
                  <strong>Notifications are blocked.</strong> To enable on your Poco F6:
                </p>
                <div className="text-xs text-red-600 space-y-2 bg-white p-3 rounded">
                  <div>
                    <p className="font-medium">📱 Poco F6 Chrome Steps:</p>
                    <p>1. Tap the ⋮ menu (3 dots) in Chrome</p>
                    <p>2. Tap "Site settings" or "Permissions"</p>
                    <p>3. Tap "Notifications" → "Allow"</p>
                    <p>4. Refresh this page</p>
                  </div>
                  <div>
                    <p className="font-medium">📱 Alternative Method:</p>
                    <p>1. Long press on this browser tab</p>
                    <p>2. Tap "Site settings"</p>
                    <p>3. Enable "Notifications"</p>
                  </div>
                  <div>
                    <p className="font-medium">⚙️ MIUI Settings:</p>
                    <p>1. Settings → Apps → Chrome</p>
                    <p>2. Notifications → Allow all</p>
                    <p>3. Make sure "Show on lock screen" is enabled</p>
                  </div>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                  Refresh Page to Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Test Notifications */}
          {permission === "granted" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={sendTestNotification}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Send className="w-4 h-4 mr-2" />🧪 Send Test Notification (Check Your Phone!)
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
      {permission === "granted" && notificationsEnabled && (
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

      {/* Poco F6 Specific Instructions */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-800 text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4" />📱 Poco F6 Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-purple-700 space-y-3">
            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">🔧 MIUI Notification Settings:</p>
              <p>• Settings → Apps → Chrome → Notifications → Allow all</p>
              <p>• Settings → Notifications → Advanced → Show on lock screen ✓</p>
              <p>• Settings → Battery → Chrome → No restrictions</p>
            </div>

            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">🌐 Chrome Settings:</p>
              <p>• Chrome → ⋮ → Settings → Site settings → Notifications → Allow</p>
              <p>• Make sure "Blocked" list doesn't include this site</p>
            </div>

            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">📲 Testing Tips:</p>
              <p>• Use "Send Test Notification" button above</p>
              <p>• Check notification panel by swiping down</p>
              <p>• Try "URGENT Alert" for maximum vibration</p>
              <p>• Keep this browser tab open in background</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-800 text-sm">Device Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <strong>Browser:</strong> {navigator.userAgent.includes("Chrome") ? "Chrome" : "Other"}
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
              <strong>Service Worker:</strong> {"serviceWorker" in navigator ? "Supported" : "Not Supported"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
