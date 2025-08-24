"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, AlertTriangle, CheckCircle, Smartphone, Send, Settings, Zap, Target } from "lucide-react"

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
  const [settings, setSettings] = useState({
    billReminders: true,
    goalAlerts: true,
    dailyReminders: true,
    weeklyReports: true,
    morningReminders: true,
    eveningCheckins: true,
  })

  // Initialize notification system
  useEffect(() => {
    const initNotifications = async () => {
      // Check if notifications are supported
      const supported = "Notification" in window && "serviceWorker" in navigator
      setIsSupported(supported)

      if (!supported) {
        setLastError("Notifications not supported on this device/browser")
        return
      }

      // Get current permission
      setPermission(Notification.permission)

      // Register service worker
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("Service Worker registered:", registration)
        setServiceWorkerReady(true)

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "NOTIFICATION_ERROR") {
            setLastError(event.data.error)
          }
        })
      } catch (error) {
        console.error("Service Worker registration failed:", error)
        setLastError("Service Worker registration failed")
      }

      // Load saved settings
      const savedSettings = localStorage.getItem("notificationSettings")
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings(parsed)
          setNotificationsEnabled(parsed.enabled && Notification.permission === "granted")
        } catch (error) {
          console.error("Error loading notification settings:", error)
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

  // Auto-send notifications based on data changes
  useEffect(() => {
    if (!notificationsEnabled || permission !== "granted") return

    const sendAutoNotifications = async () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentDay = now.toLocaleDateString("en-US", { weekday: "short" })

      // Morning reminders (9 AM)
      if (currentHour === 9 && settings.morningReminders) {
        const todayData = dailyIncome.find((d) => d.day === currentDay)
        if (todayData?.isWorkDay && todayData.goal > 0) {
          await sendNotification({
            title: "🌅 Good Morning!",
            body: `Today's goal: ${currency}${todayData.goal.toLocaleString()}. Let's make it happen!`,
            tag: "morning-reminder",
            data: { type: "goal", day: currentDay },
          })
        }
      }

      // Evening check-ins (6 PM)
      if (currentHour === 18 && settings.eveningCheckins) {
        const todayData = dailyIncome.find((d) => d.day === currentDay)
        if (todayData?.isWorkDay && todayData.goal > 0) {
          const progress = (todayData.amount / todayData.goal) * 100
          if (progress < 80) {
            await sendNotification({
              title: "⏰ Evening Check-in",
              body: `You're at ${progress.toFixed(0)}% of today's goal. ${currency}${(todayData.goal - todayData.amount).toLocaleString()} to go!`,
              tag: "evening-checkin",
              data: { type: "goal", progress },
            })
          }
        }
      }

      // Bill reminders
      if (settings.billReminders) {
        const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
        const billsDueToday = pendingBills.filter((p) => p.dueDay === currentDay)

        if (billsDueToday.length > 0) {
          const totalAmount = billsDueToday.reduce((sum, bill) => sum + bill.amount, 0)
          await sendNotification({
            title: "💳 Bills Due Today!",
            body: `${billsDueToday.length} bill(s) due today: ${currency}${totalAmount.toLocaleString()}`,
            tag: "bills-due-today",
            requireInteraction: true,
            data: { type: "bills", bills: billsDueToday },
          })
        }
      }
    }

    // Check every minute for notification triggers
    const interval = setInterval(sendAutoNotifications, 60000)
    return () => clearInterval(interval)
  }, [notificationsEnabled, permission, settings, weeklyPayables, dailyIncome, currency])

  const requestPermission = async () => {
    if (!isSupported) {
      setLastError("Notifications are not supported on this device/browser")
      return
    }

    try {
      setLastError(null)

      // Request permission
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        setNotificationsEnabled(true)

        // Send welcome notification
        await sendNotification({
          title: "🎉 Notifications Enabled!",
          body: "You'll now receive reminders for bills and goals. Tap to open the app.",
          tag: "welcome",
          requireInteraction: true,
          data: { type: "welcome" },
        })

        setLastNotificationSent("Welcome notification sent successfully!")
      } else if (result === "denied") {
        setLastError("Notifications were denied. Please enable them in your browser settings.")
      } else {
        setLastError("Notification permission was not granted")
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      setLastError(`Permission request failed: ${error.message}`)
    }
  }

  const sendNotification = async (options: {
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
      return false
    }

    try {
      const notificationOptions = {
        body: options.body,
        icon: options.icon || "/placeholder-logo.png",
        badge: options.badge || "/placeholder-logo.png",
        tag: options.tag || `notification-${Date.now()}`,
        requireInteraction: options.requireInteraction || false,
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

      // Try service worker notification first (better for mobile)
      if (serviceWorkerReady) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(options.title, notificationOptions)
        console.log("Service worker notification sent:", options.title)
      } else {
        // Fallback to regular notification
        const notification = new Notification(options.title, notificationOptions)

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        console.log("Regular notification sent:", options.title)
      }

      setNotificationCount((prev) => prev + 1)
      setLastNotificationSent(`"${options.title}" sent at ${new Date().toLocaleTimeString()}`)
      setLastError(null)
      return true
    } catch (error) {
      console.error("Error sending notification:", error)
      setLastError(`Failed to send notification: ${error.message}`)
      return false
    }
  }

  const sendTestNotification = async () => {
    const success = await sendNotification({
      title: "🧪 Test Notification",
      body: "This is a test from your Budget Tracker! If you see this, notifications are working perfectly.",
      tag: "test",
      requireInteraction: true,
      vibrate: [100, 50, 100, 50, 100],
      data: { type: "test", timestamp: Date.now() },
    })

    if (success) {
      setLastNotificationSent("Test notification sent successfully!")
    }
  }

  const sendBillReminder = async () => {
    const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
    if (pendingBills.length === 0) {
      setLastError("No pending bills to remind about")
      return
    }

    const totalAmount = pendingBills.reduce((sum, bill) => sum + bill.amount, 0)
    await sendNotification({
      title: "💳 Bill Reminder",
      body: `You have ${pendingBills.length} pending bill(s) totaling ${currency}${totalAmount.toLocaleString()}`,
      tag: "bill-reminder",
      requireInteraction: true,
      data: { type: "bills", bills: pendingBills },
    })
  }

  const sendGoalReminder = async () => {
    const todayData = dailyIncome.find((d) => d.isToday)
    if (!todayData?.isWorkDay || todayData.goal <= 0) {
      setLastError("No work day goal to remind about")
      return
    }

    const progress = (todayData.amount / todayData.goal) * 100
    const remaining = todayData.goal - todayData.amount

    await sendNotification({
      title: "🎯 Goal Reminder",
      body: `Today's progress: ${progress.toFixed(0)}%. ${currency}${remaining.toLocaleString()} remaining to reach your goal!`,
      tag: "goal-reminder",
      requireInteraction: true,
      data: { type: "goal", progress, remaining },
    })
  }

  // Calculate current stats
  const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
  const todayData = dailyIncome.find((d) => d.isToday)
  const todayProgress = todayData && todayData.goal > 0 ? (todayData.amount / todayData.goal) * 100 : 0

  if (!isSupported) {
    return (
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Notifications Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 mb-4">
            Your device or browser doesn't support push notifications. This feature requires:
          </p>
          <ul className="text-sm text-orange-700 space-y-1 ml-4">
            <li>• A modern browser (Chrome, Firefox, Safari, Edge)</li>
            <li>• HTTPS connection (secure site)</li>
            <li>• Service Worker support</li>
          </ul>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {lastError && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Notification Error
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
              Notification Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 mb-3">{lastNotificationSent}</p>
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
              {serviceWorkerReady && <Badge className="bg-green-100 text-green-800 text-xs">SW Ready</Badge>}
              {notificationCount > 0 && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">{notificationCount} sent</Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>Get real-time alerts on your phone for bills, goals, and reminders</CardDescription>
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
                  Enable notifications to receive reminders on your phone even when the app is closed.
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
                  <strong>Notifications are blocked.</strong> To enable them:
                </p>
                <div className="text-xs text-red-600 space-y-2 bg-white p-3 rounded">
                  <div>
                    <p className="font-medium">📱 On Mobile Chrome/Edge:</p>
                    <p>• Tap the 🔒 lock icon in address bar</p>
                    <p>• Tap "Site settings" → "Notifications" → "Allow"</p>
                  </div>
                  <div>
                    <p className="font-medium">📱 On iPhone Safari:</p>
                    <p>• Settings → Safari → Website Settings → Notifications → Allow</p>
                  </div>
                  <div>
                    <p className="font-medium">💻 On Desktop:</p>
                    <p>• Click the 🔒 icon → Site settings → Notifications → Allow</p>
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
                <Button onClick={sendTestNotification} variant="outline" className="w-full bg-transparent">
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Notification
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={sendBillReminder} variant="outline" size="sm" disabled={pendingBills.length === 0}>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Bill Reminder
                  </Button>
                  <Button onClick={sendGoalReminder} variant="outline" size="sm" disabled={!todayData?.isWorkDay}>
                    <Target className="w-4 h-4 mr-1" />
                    Goal Reminder
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
                  <p className="text-xs text-gray-600">When behind on daily goals (6 PM)</p>
                </div>
                <Switch
                  id="goal-alerts"
                  checked={settings.goalAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, goalAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <Label htmlFor="morning-reminders" className="font-medium">
                    🌅 Morning Reminders
                  </Label>
                  <p className="text-xs text-gray-600">Daily motivation at 9 AM</p>
                </div>
                <Switch
                  id="morning-reminders"
                  checked={settings.morningReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, morningReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <Label htmlFor="evening-checkins" className="font-medium">
                    ⏰ Evening Check-ins
                  </Label>
                  <p className="text-xs text-gray-600">Progress updates at 6 PM</p>
                </div>
                <Switch
                  id="evening-checkins"
                  checked={settings.eveningCheckins}
                  onCheckedChange={(checked) => setSettings({ ...settings, eveningCheckins: checked })}
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

      {/* Mobile Tips */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-800 text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4" />📱 Mobile Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-purple-700 space-y-2">
            <p>
              • <strong>Add to Home Screen:</strong> Install this app for reliable notifications
            </p>
            <p>
              • <strong>Keep App Open:</strong> Leave a browser tab open in background
            </p>
            <p>
              • <strong>Check Battery Settings:</strong> Allow notifications even in battery saver mode
            </p>
            <p>
              • <strong>Sound On:</strong> Make sure your device isn't on silent mode
            </p>
            <p>
              • <strong>Test First:</strong> Use the "Send Test" button to verify it works
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
