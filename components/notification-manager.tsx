"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Clock, AlertCircle, CheckCircle, Calendar } from "lucide-react"

interface NotificationManagerProps {
  weeklyPayables: any[]
  dailyIncome: any[]
  currency: string
}

export function NotificationManager({ weeklyPayables, dailyIncome, currency }: NotificationManagerProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [lastNotificationTime, setLastNotificationTime] = useState<string>("")
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([])

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)

      // Check if notifications were previously enabled
      const enabled = localStorage.getItem("notificationsEnabled") === "true"
      setNotificationsEnabled(enabled && Notification.permission === "granted")

      // Get last notification time
      const lastTime = localStorage.getItem("lastNotificationTime")
      if (lastTime) {
        setLastNotificationTime(lastTime)
      }

      // Load scheduled notifications
      const scheduled = localStorage.getItem("scheduledNotifications")
      if (scheduled) {
        try {
          setScheduledNotifications(JSON.parse(scheduled))
        } catch {
          setScheduledNotifications([])
        }
      }
    }
  }, [])

  // Request notification permission
  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        setNotificationsEnabled(true)
        localStorage.setItem("notificationsEnabled", "true")
        scheduleWeeklyPayableNotifications()

        // Show welcome notification
        showNotification("Notifications Enabled! 🎉", {
          body: "You'll now receive daily budget reminders and bill alerts.",
          icon: "/placeholder-logo.png",
        })
      }
    }
  }

  // Show notification
  const showNotification = (title: string, options: NotificationOptions = {}) => {
    if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        icon: "/placeholder-logo.png",
        badge: "/placeholder-logo.png",
        ...options,
      })

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      // Update last notification time
      const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
      setLastNotificationTime(now)
      localStorage.setItem("lastNotificationTime", now)
    }
  }

  // Schedule weekly payable notifications (Saturday 8 PM, Sunday 8 PM)
  const scheduleWeeklyPayableNotifications = () => {
    if (!notificationsEnabled) return

    const unpaidPayables = weeklyPayables.filter((p) => p.status === "pending")
    const newScheduledNotifications: any[] = []

    unpaidPayables.forEach((payable) => {
      const now = new Date()
      const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday

      // Schedule Saturday 8 PM notification
      const saturday8PM = new Date()
      if (currentDay <= 6) {
        // If it's not past Saturday
        saturday8PM.setDate(now.getDate() + (6 - currentDay)) // Next Saturday
      } else {
        saturday8PM.setDate(now.getDate() + 7) // Next week Saturday
      }
      saturday8PM.setHours(20, 0, 0, 0) // 8 PM

      // Schedule Sunday 8 PM notification
      const sunday8PM = new Date(saturday8PM)
      sunday8PM.setDate(saturday8PM.getDate() + 1) // Next day (Sunday)

      // Create notification entries
      const saturdayNotification = {
        id: `sat-${payable.id}`,
        payableId: payable.id,
        payableName: payable.name,
        amount: payable.amount,
        scheduledTime: saturday8PM.toISOString(),
        type: "saturday-reminder",
        message: `Bill Reminder: ${payable.name} - ${currency}${payable.amount.toLocaleString()} is due today (Saturday)`,
      }

      const sundayNotification = {
        id: `sun-${payable.id}`,
        payableId: payable.id,
        payableName: payable.name,
        amount: payable.amount,
        scheduledTime: sunday8PM.toISOString(),
        type: "sunday-reminder",
        message: `Final Reminder: ${payable.name} - ${currency}${payable.amount.toLocaleString()} is still unpaid. Due yesterday.`,
      }

      newScheduledNotifications.push(saturdayNotification, sundayNotification)

      // Set actual timeouts for notifications
      const saturdayTimeout = saturday8PM.getTime() - now.getTime()
      const sundayTimeout = sunday8PM.getTime() - now.getTime()

      if (saturdayTimeout > 0) {
        setTimeout(() => {
          // Check if payable is still unpaid
          const currentPayables = JSON.parse(localStorage.getItem("dailyBudgetAppData") || "{}")
          const currentWeeklyPayables = currentPayables.weeklyPayables || []
          const currentPayable = currentWeeklyPayables.find((p: any) => p.id === payable.id)

          if (currentPayable && currentPayable.status === "pending") {
            showNotification("Bill Reminder 📅", {
              body: saturdayNotification.message,
              tag: saturdayNotification.id,
            })
          }
        }, saturdayTimeout)
      }

      if (sundayTimeout > 0) {
        setTimeout(() => {
          // Check if payable is still unpaid
          const currentPayables = JSON.parse(localStorage.getItem("dailyBudgetAppData") || "{}")
          const currentWeeklyPayables = currentPayables.weeklyPayables || []
          const currentPayable = currentWeeklyPayables.find((p: any) => p.id === payable.id)

          if (currentPayable && currentPayable.status === "pending") {
            showNotification("Final Reminder ⚠️", {
              body: sundayNotification.message,
              tag: sundayNotification.id,
            })
          }
        }, sundayTimeout)
      }
    })

    setScheduledNotifications(newScheduledNotifications)
    localStorage.setItem("scheduledNotifications", JSON.stringify(newScheduledNotifications))

    // Register service worker for background notifications
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: "SCHEDULE_WEEKLY_NOTIFICATIONS",
          payload: {
            weeklyPayables: unpaidPayables,
            currency,
            notifications: newScheduledNotifications,
          },
        })
      })
    }
  }

  // Toggle notifications
  const toggleNotifications = async () => {
    if (!notificationsEnabled && permission !== "granted") {
      await requestPermission()
    } else {
      const newState = !notificationsEnabled
      setNotificationsEnabled(newState)
      localStorage.setItem("notificationsEnabled", newState.toString())

      if (newState) {
        scheduleWeeklyPayableNotifications()
      } else {
        // Clear scheduled notifications
        setScheduledNotifications([])
        localStorage.removeItem("scheduledNotifications")
      }
    }
  }

  // Test notification
  const testNotification = () => {
    const todayData = dailyIncome.find((day) => day.isToday)
    const todayIncome = todayData?.amount || 0
    const todayGoal = todayData?.goal || 800
    const progress = Math.round((todayIncome / todayGoal) * 100)

    showNotification("Test Notification 📊", {
      body: `Today's progress: ${progress}% (${currency}${todayIncome.toLocaleString()}/${currency}${todayGoal.toLocaleString()}). Keep it up!`,
      tag: "test-notification",
    })
  }

  // Get due bills today
  const getDueBillsToday = () => {
    const today = new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Manila",
      weekday: "long",
    })

    return weeklyPayables.filter((bill) => bill.dueDay === today && bill.status === "pending")
  }

  // Get overdue bills
  const getOverdueBills = () => {
    return weeklyPayables.filter((bill) => bill.status === "overdue")
  }

  // Send bill reminder
  const sendBillReminder = () => {
    const dueBills = getDueBillsToday()
    const overdueBills = getOverdueBills()

    if (dueBills.length > 0) {
      const totalDue = dueBills.reduce((sum, bill) => sum + bill.amount, 0)
      const billNames = dueBills.map((bill) => bill.name).join(", ")

      showNotification("Bills Due Today! 💳", {
        body: `${dueBills.length} bill(s) due: ${billNames}. Total: ${currency}${totalDue.toLocaleString()}`,
        tag: "bills-due",
      })
    }

    if (overdueBills.length > 0) {
      const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0)

      showNotification("Overdue Bills! ⚠️", {
        body: `${overdueBills.length} overdue bill(s). Total: ${currency}${totalOverdue.toLocaleString()}`,
        tag: "bills-overdue",
      })
    }

    if (dueBills.length === 0 && overdueBills.length === 0) {
      showNotification("All Bills Up to Date! ✅", {
        body: "Great job! No bills due or overdue today.",
        tag: "bills-clear",
      })
    }
  }

  // Send daily progress reminder
  const sendProgressReminder = () => {
    const todayData = dailyIncome.find((day) => day.isToday)
    const todayIncome = todayData?.amount || 0
    const todayGoal = todayData?.goal || 800
    const progress = Math.round((todayIncome / todayGoal) * 100)

    let message = ""
    let emoji = ""

    if (progress >= 100) {
      message = `Excellent! You've exceeded your daily goal!`
      emoji = "🎉"
    } else if (progress >= 75) {
      message = `Great progress! You're almost there!`
      emoji = "🚀"
    } else if (progress >= 50) {
      message = `Good work! Keep pushing towards your goal!`
      emoji = "💪"
    } else if (progress >= 25) {
      message = `You're making progress! Don't give up!`
      emoji = "📈"
    } else {
      message = `Time to get started on your daily goal!`
      emoji = "⏰"
    }

    showNotification(`Daily Progress: ${progress}% ${emoji}`, {
      body: `${currency}${todayIncome.toLocaleString()}/${currency}${todayGoal.toLocaleString()}. ${message}`,
      tag: "daily-progress",
    })
  }

  const dueBillsToday = getDueBillsToday()
  const overdueBills = getOverdueBills()
  const todayData = dailyIncome.find((day) => day.isToday)
  const todayProgress = todayData ? Math.round((todayData.amount / todayData.goal) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Notification Settings */}
      <Card className="bg-white/90 border-0">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            Enhanced Notification System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications-toggle" className="text-sm font-medium">
                Enable Notifications
              </Label>
              <p className="text-xs text-gray-600">Get daily reminders and automated bill alerts</p>
            </div>
            <Switch id="notifications-toggle" checked={notificationsEnabled} onCheckedChange={toggleNotifications} />
          </div>

          {permission === "denied" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          )}

          {notificationsEnabled && (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✅ Enhanced notifications enabled with automatic bill reminders
                </p>
                <p className="text-xs text-green-600 mt-1">• Saturday 8:00 PM: First reminder for unpaid bills</p>
                <p className="text-xs text-green-600">• Sunday 8:00 PM: Final reminder for unpaid bills</p>
              </div>

              <Button onClick={testNotification} variant="outline" className="w-full bg-transparent">
                <Bell className="w-4 h-4 mr-2" />
                Test Notification
              </Button>

              {lastNotificationTime && (
                <p className="text-xs text-gray-500 text-center">Last notification: {lastNotificationTime}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Notifications */}
      {scheduledNotifications.length > 0 && (
        <Card className="bg-white/90 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Scheduled Notifications ({scheduledNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {scheduledNotifications.map((notification, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-800">{notification.payableName}</p>
                    <p className="text-xs text-blue-600">
                      {notification.type === "saturday-reminder" ? "Saturday 8 PM" : "Sunday 8 PM"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {currency}
                      {notification.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(notification.scheduledTime).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Alerts */}
      <Card className="bg-white/90 border-0">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Today's Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Bills Due Today */}
          {dueBillsToday.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-orange-800">Bills Due Today</h4>
                <Badge className="bg-orange-100 text-orange-800">{dueBillsToday.length}</Badge>
              </div>
              <div className="space-y-1">
                {dueBillsToday.map((bill) => (
                  <div key={bill.id} className="flex justify-between text-sm">
                    <span>{bill.name}</span>
                    <span className="font-medium">
                      {currency}
                      {bill.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <Button onClick={sendBillReminder} size="sm" className="w-full mt-2 bg-orange-600">
                Send Reminder Now
              </Button>
            </div>
          )}

          {/* Overdue Bills */}
          {overdueBills.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-red-800">Overdue Bills</h4>
                <Badge className="bg-red-100 text-red-800">{overdueBills.length}</Badge>
              </div>
              <div className="space-y-1">
                {overdueBills.map((bill) => (
                  <div key={bill.id} className="flex justify-between text-sm">
                    <span>{bill.name}</span>
                    <span className="font-medium">
                      {currency}
                      {bill.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Progress */}
          <div
            className={`border rounded-lg p-3 ${
              todayProgress >= 100
                ? "bg-green-50 border-green-200"
                : todayProgress >= 75
                  ? "bg-blue-50 border-blue-200"
                  : todayProgress >= 50
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4
                className={`font-medium ${
                  todayProgress >= 100
                    ? "text-green-800"
                    : todayProgress >= 75
                      ? "text-blue-800"
                      : todayProgress >= 50
                        ? "text-yellow-800"
                        : "text-gray-800"
                }`}
              >
                Today's Progress
              </h4>
              <Badge variant="outline">{todayProgress}%</Badge>
            </div>
            <div className="text-sm text-gray-600">
              {currency}
              {todayData?.amount.toLocaleString() || 0} / {currency}
              {todayData?.goal.toLocaleString() || 800}
            </div>
            <Button onClick={sendProgressReminder} size="sm" variant="outline" className="w-full mt-2 bg-transparent">
              Send Progress Update
            </Button>
          </div>

          {/* No Alerts */}
          {dueBillsToday.length === 0 && overdueBills.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">All good! No urgent alerts today.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Schedule */}
      <Card className="bg-white/90 border-0">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Automated Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-800">Morning Reminder</p>
                <p className="text-xs text-blue-600">8:00 AM Manila Time</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Daily</Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium text-purple-800">Evening Check-in</p>
                <p className="text-xs text-purple-600">6:00 PM Manila Time</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">Daily</Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
              <div>
                <p className="font-medium text-orange-800">Saturday Bill Reminder</p>
                <p className="text-xs text-orange-600">8:00 PM Manila Time</p>
              </div>
              <Badge className="bg-orange-100 text-orange-800">Weekly</Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-800">Sunday Final Reminder</p>
                <p className="text-xs text-red-600">8:00 PM Manila Time</p>
              </div>
              <Badge className="bg-red-100 text-red-800">Weekly</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
