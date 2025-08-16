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
  const [settings, setSettings] = useState({
    billReminders: true,
    goalAlerts: true,
    dailyReminders: true,
    weeklyReports: true,
  })

  useEffect(() => {
    // Check if notifications are supported
    const supported = "Notification" in window && "serviceWorker" in navigator
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)

      // Check if service worker is ready
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then(() => {
          setServiceWorkerReady(true)
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
      alert("Notifications are not supported on this device/browser")
      return
    }

    try {
      // For mobile devices, we need to request permission in response to user interaction
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        setNotificationsEnabled(true)

        // Test notification to confirm it works
        if (serviceWorkerReady && "serviceWorker" in navigator) {
          // Use service worker for better mobile support
          const registration = await navigator.serviceWorker.ready
          await registration.showNotification("Budget Tracker", {
            body: "Notifications are now enabled! You'll receive reminders for bills and goals.",
            icon: "/placeholder-logo.png",
            badge: "/placeholder-logo.png",
            tag: "welcome",
            requireInteraction: false,
            silent: false,
            vibrate: [200, 100, 200],
            data: {
              type: "welcome",
              timestamp: Date.now(),
            },
          })
        } else {
          // Fallback to regular notification
          new Notification("Budget Tracker", {
            body: "Notifications are now enabled!",
            icon: "/placeholder-logo.png",
            tag: "welcome",
          })
        }
      } else if (result === "denied") {
        alert("Notifications were denied. Please enable them in your browser settings.")
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      alert("Error requesting notification permission. Please try again.")
    }
  }

  const sendTestNotification = async () => {
    if (permission !== "granted") {
      alert("Please enable notifications first")
      return
    }

    try {
      if (serviceWorkerReady && "serviceWorker" in navigator) {
        // Use service worker for better mobile support
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification("Test Notification", {
          body: "This is a test notification from your Budget Tracker! 🎯",
          icon: "/placeholder-logo.png",
          badge: "/placeholder-logo.png",
          tag: "test",
          requireInteraction: false,
          silent: false,
          vibrate: [100, 50, 100, 50, 100],
          data: {
            type: "test",
            timestamp: Date.now(),
          },
          actions: [
            {
              action: "view",
              title: "View App",
              icon: "/placeholder-logo.png",
            },
          ],
        })
      } else {
        // Fallback to regular notification
        new Notification("Test Notification", {
          body: "This is a test notification from your Budget Tracker! 🎯",
          icon: "/placeholder-logo.png",
          tag: "test",
        })
      }
    } catch (error) {
      console.error("Error sending test notification:", error)
      alert("Error sending notification. Please check your settings.")
    }
  }

  // Schedule notifications based on settings
  useEffect(() => {
    if (!notificationsEnabled || permission !== "granted") return

    const scheduleNotifications = async () => {
      try {
        // Calculate notification data
        const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
        const todayData = dailyIncome.find((d) => d.isToday)
        const todayProgress = todayData ? (todayData.amount / todayData.goal) * 100 : 0

        // Bill reminders (check every hour)
        if (settings.billReminders && pendingBills.length > 0) {
          const now = new Date()
          const hour = now.getHours()

          // Send bill reminder at 9 AM and 6 PM
          if (hour === 9 || hour === 18) {
            const totalAmount = pendingBills.reduce((sum, bill) => sum + bill.amount, 0)

            if (serviceWorkerReady && "serviceWorker" in navigator) {
              const registration = await navigator.serviceWorker.ready
              await registration.showNotification("Bill Reminder", {
                body: `You have ${pendingBills.length} pending bills (${currency}${totalAmount.toLocaleString()})`,
                icon: "/placeholder-logo.png",
                badge: "/placeholder-logo.png",
                tag: "bills",
                vibrate: [200, 100, 200],
                data: {
                  type: "bills",
                  count: pendingBills.length,
                  amount: totalAmount,
                },
              })
            }
          }
        }

        // Goal alerts (check at 6 PM if behind on daily goal)
        if (settings.goalAlerts && todayData && todayData.isWorkDay) {
          const now = new Date()
          const hour = now.getHours()

          if (hour === 18 && todayProgress < 80) {
            const remaining = todayData.goal - todayData.amount

            if (serviceWorkerReady && "serviceWorker" in navigator) {
              const registration = await navigator.serviceWorker.ready
              await registration.showNotification("Daily Goal Alert", {
                body: `You need ${currency}${remaining.toLocaleString()} more to reach today's goal!`,
                icon: "/placeholder-logo.png",
                badge: "/placeholder-logo.png",
                tag: "goal",
                vibrate: [100, 50, 100],
                data: {
                  type: "goal",
                  remaining: remaining,
                  progress: todayProgress,
                },
              })
            }
          }
        }
      } catch (error) {
        console.error("Error scheduling notifications:", error)
      }
    }

    // Schedule notifications every 30 minutes
    const interval = setInterval(scheduleNotifications, 30 * 60 * 1000)

    // Run once immediately
    scheduleNotifications()

    return () => clearInterval(interval)
  }, [notificationsEnabled, permission, settings, weeklyPayables, dailyIncome, currency, serviceWorkerReady])

  // Calculate notification insights
  const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
  const todayData = dailyIncome.find((d) => d.isToday)
  const todayProgress = todayData ? (todayData.amount / todayData.goal) * 100 : 0
  const workDaysThisWeek = dailyIncome.filter((d) => d.isWorkDay)
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
            {serviceWorkerReady && <Badge className="bg-green-100 text-green-800 text-xs">PWA Ready</Badge>}
          </CardTitle>
          <CardDescription>
            {permission === "granted"
              ? "Notifications are enabled and working"
              : permission === "denied"
                ? "Notifications are blocked - please enable in browser settings"
                : "Notifications not set up yet"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === "default" && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>For mobile devices:</strong> Make sure to:
                </p>
                <ul className="text-xs text-blue-600 space-y-1 ml-4">
                  <li>• Allow notifications when prompted</li>
                  <li>• Add this app to your home screen</li>
                  <li>• Keep the app open in background</li>
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

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  ✅ Notifications are working! You'll receive reminders for bills and goals.
                </p>
              </div>
            </div>
          )}

          {permission === "denied" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-red-600">
                <strong>Notifications are blocked.</strong> To enable them:
              </p>
              <div className="text-xs text-red-600 space-y-1">
                <p>
                  <strong>On Android Chrome:</strong>
                </p>
                <p>• Tap the 🔒 icon in address bar → Notifications → Allow</p>
                <p>
                  <strong>On iPhone Safari:</strong>
                </p>
                <p>• Settings → Safari → Website Settings → Notifications → Allow</p>
                <p>
                  <strong>Or refresh the page and allow when prompted</strong>
                </p>
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

      {/* Mobile-specific tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Mobile Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>For best notification experience:</strong>
            </p>
            <ul className="space-y-1 ml-4">
              <li>• Add this app to your home screen</li>
              <li>• Keep the app in your recent apps</li>
              <li>• Don't force-close the app</li>
              <li>• Check your phone's notification settings</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
