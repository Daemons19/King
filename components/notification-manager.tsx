"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, Clock, AlertTriangle, CheckCircle, Calendar, Smartphone } from "lucide-react"

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
  const [settings, setSettings] = useState({
    billReminders: true,
    goalAlerts: true,
    dailyReminders: true,
    weeklyReports: true,
  })

  useEffect(() => {
    // Check if notifications are supported
    const supported = "Notification" in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)

      // Register and check service worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered successfully:", registration)
            setServiceWorkerReady(true)

            // Check for updates
            registration.addEventListener("updatefound", () => {
              console.log("New service worker found")
            })
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error)
            setLastError("Service Worker registration failed")
          })

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "NOTIFICATION_ERROR") {
            setLastError(event.data.error)
          }
        })
      }
    }

    // Load settings from localStorage
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
      return
    }

    try {
      setLastError(null)

      // Request permission
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        setNotificationsEnabled(true)

        // Send a simple test notification first
        try {
          new Notification("Budget Tracker", {
            body: "Notifications enabled successfully! 🎉",
            icon: "/placeholder-logo.png",
            tag: "permission-granted",
            silent: false,
          })
        } catch (error) {
          console.error("Error sending welcome notification:", error)
          setLastError("Failed to send welcome notification")
        }
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

  const sendTestNotification = async () => {
    if (permission !== "granted") {
      setLastError("Please enable notifications first")
      return
    }

    try {
      setLastError(null)

      // Try simple notification first
      const notification = new Notification("Test Notification", {
        body: "This is a test from your Budget Tracker! 🎯",
        icon: "/placeholder-logo.png",
        tag: "test-notification",
        silent: false,
        requireInteraction: false,
      })

      // Handle notification events
      notification.onclick = () => {
        console.log("Test notification clicked")
        notification.close()
        window.focus()
      }

      notification.onerror = (error) => {
        console.error("Notification error:", error)
        setLastError("Notification display failed")
      }

      notification.onshow = () => {
        console.log("Test notification shown successfully")
      }

      // If service worker is available, also try service worker notification
      if (serviceWorkerReady && "serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          await registration.showNotification("Service Worker Test", {
            body: "This test uses the service worker! 🚀",
            icon: "/placeholder-logo.png",
            badge: "/placeholder-logo.png",
            tag: "sw-test",
            silent: false,
            requireInteraction: false,
            vibrate: [100, 50, 100],
            data: {
              type: "test",
              timestamp: Date.now(),
            },
          })
        } catch (swError) {
          console.error("Service worker notification error:", swError)
          // Don't set error here as the regular notification might have worked
        }
      }
    } catch (error) {
      console.error("Error sending test notification:", error)
      setLastError(`Test notification failed: ${error.message}`)
    }
  }

  // Calculate notification insights
  const pendingBills = weeklyPayables?.filter((p) => p.status === "pending") || []
  const todayData = dailyIncome?.find((d) => d.isToday)
  const todayProgress = todayData ? (todayData.amount / todayData.goal) * 100 : 0
  const workDaysThisWeek = dailyIncome?.filter((d) => d.isWorkDay) || []
  const weeklyProgress =
    workDaysThisWeek.length > 0
      ? workDaysThisWeek.reduce((sum, d) => sum + d.amount, 0) / workDaysThisWeek.reduce((sum, d) => sum + d.goal, 0)
      : 0

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
          <p className="text-sm text-orange-700">
            Your device or browser doesn't support notifications. This feature requires a modern browser with
            notification support.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
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

      {/* Permission Status */}
      <Card className="bg-white/90 border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-green-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            Notification Status
            {serviceWorkerReady && <Badge className="bg-green-100 text-green-800 text-xs">SW Ready</Badge>}
          </CardTitle>
          <CardDescription>
            {permission === "granted"
              ? "Notifications are enabled"
              : permission === "denied"
                ? "Notifications are blocked"
                : "Notifications not set up"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === "default" && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>To enable notifications:</strong>
                </p>
                <ul className="text-xs text-blue-600 space-y-1 ml-4">
                  <li>• Click "Enable Notifications" below</li>
                  <li>• Allow when your browser asks</li>
                  <li>• Make sure your device sound is on</li>
                </ul>
              </div>
              <Button onClick={requestPermission} className="w-full bg-blue-600 hover:bg-blue-700">
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
            </div>
          )}

          {permission === "granted" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-toggle">Enable Notifications</Label>
                <Switch
                  id="notifications-toggle"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              <Button onClick={sendTestNotification} variant="outline" className="w-full bg-transparent">
                <Bell className="w-4 h-4 mr-2" />
                Send Test Notification
              </Button>

              {!lastError && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✅ Notifications are working! You'll receive reminders for bills and goals.
                  </p>
                </div>
              )}
            </div>
          )}

          {permission === "denied" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-red-600">
                <strong>Notifications are blocked.</strong> To enable them:
              </p>
              <div className="text-xs text-red-600 space-y-2">
                <div>
                  <p className="font-medium">On Android Chrome:</p>
                  <p>• Tap the 🔒 icon in address bar → Site settings → Notifications → Allow</p>
                </div>
                <div>
                  <p className="font-medium">On iPhone Safari:</p>
                  <p>• Settings → Safari → Website Settings → Notifications → Allow</p>
                </div>
                <div>
                  <p className="font-medium">Alternative:</p>
                  <p>• Refresh the page and allow when prompted</p>
                </div>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full bg-transparent">
                Refresh Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {permission === "granted" && (
        <Card className="bg-white/90 border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-800">Notification Types</CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="bill-reminders">Bill Reminders</Label>
                  <p className="text-xs text-gray-600">Daily at 9 AM and 6 PM</p>
                </div>
                <Switch
                  id="bill-reminders"
                  checked={settings.billReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, billReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="goal-alerts">Goal Alerts</Label>
                  <p className="text-xs text-gray-600">At 6 PM if behind on daily goals</p>
                </div>
                <Switch
                  id="goal-alerts"
                  checked={settings.goalAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, goalAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="daily-reminders">Daily Reminders</Label>
                  <p className="text-xs text-gray-600">Morning motivation and evening check-ins</p>
                </div>
                <Switch
                  id="daily-reminders"
                  checked={settings.dailyReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, dailyReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-reports">Weekly Reports</Label>
                  <p className="text-xs text-gray-600">Sunday evening summary</p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Alerts */}
      <Card className="bg-white/90 border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-800">Current Alerts</CardTitle>
          <CardDescription>Things that need your attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Pending Bills Alert */}
          {pendingBills.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">Pending Bills</p>
                <p className="text-sm text-orange-600">
                  {pendingBills.length} bills pending • {currency}
                  {pendingBills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()} total
                </p>
              </div>
              <Badge className="bg-orange-100 text-orange-800">{pendingBills.length}</Badge>
            </div>
          )}

          {/* Today's Goal Alert */}
          {todayData && todayData.isWorkDay && todayProgress < 50 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Behind on Today's Goal</p>
                <p className="text-sm text-red-600">
                  {currency}
                  {todayData.amount.toLocaleString()} of {currency}
                  {todayData.goal.toLocaleString()} ({todayProgress.toFixed(0)}%)
                </p>
              </div>
              <Badge className="bg-red-100 text-red-800">{todayProgress.toFixed(0)}%</Badge>
            </div>
          )}

          {/* Weekly Progress Alert */}
          {weeklyProgress < 0.7 && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">Weekly Goal Behind</p>
                <p className="text-sm text-yellow-600">
                  You're at {(weeklyProgress * 100).toFixed(0)}% of your weekly goal
                </p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">{(weeklyProgress * 100).toFixed(0)}%</Badge>
            </div>
          )}

          {/* All Good */}
          {pendingBills.length === 0 &&
            (!todayData || !todayData.isWorkDay || todayProgress >= 50) &&
            weeklyProgress >= 0.7 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">All Good!</p>
                  <p className="text-sm text-green-600">No urgent alerts at the moment</p>
                </div>
                <Badge className="bg-green-100 text-green-800">✓</Badge>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Permission: {permission}</p>
            <p>Supported: {isSupported ? "Yes" : "No"}</p>
            <p>Service Worker: {serviceWorkerReady ? "Ready" : "Not Ready"}</p>
            <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
