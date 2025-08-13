"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, AlertCircle, CheckCircle, Clock, Target } from "lucide-react"

interface NotificationManagerProps {
  weeklyPayables: any[]
  dailyIncome: any[]
  currency: string
}

export function NotificationManager({ weeklyPayables, dailyIncome, currency }: NotificationManagerProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    // Check current notification permission
    if ("Notification" in window) {
      setPermission(Notification.permission)
      setNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission()
        setPermission(permission)
        setNotificationsEnabled(permission === "granted")

        if (permission === "granted") {
          // Send a test notification
          new Notification("Budget Tracker", {
            body: "Notifications are now enabled! You'll receive reminders about bills and income goals.",
            icon: "/placeholder-logo.png",
          })

          // Register service worker for background notifications
          if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready
            registration.showNotification("Budget Tracker Setup Complete", {
              body: "You'll now receive daily reminders and bill alerts.",
              icon: "/placeholder-logo.png",
              badge: "/placeholder-logo.png",
              tag: "setup-complete",
            })
          }
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error)
      }
    }
  }

  const disableNotifications = () => {
    setNotificationsEnabled(false)
    // Note: We can't revoke permission programmatically, but we can stop sending notifications
  }

  // Get current alerts
  const getCurrentAlerts = () => {
    const alerts = []

    // Check for overdue bills
    const currentDay = new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Manila",
      weekday: "long",
    })
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const currentDayIndex = dayOrder.indexOf(currentDay)

    const overdueBills = weeklyPayables.filter((bill) => {
      if (bill.status === "paid") return false
      const billDayIndex = dayOrder.indexOf(bill.dueDay)
      return bill.week === "This Week" && billDayIndex < currentDayIndex
    })

    const dueTodayBills = weeklyPayables.filter((bill) => {
      if (bill.status === "paid") return false
      const billDayIndex = dayOrder.indexOf(bill.dueDay)
      return bill.week === "This Week" && billDayIndex === currentDayIndex
    })

    // Check today's income goal
    const today = dailyIncome.find((day) => day.isToday)
    const todayGoalMet = today && today.amount >= today.goal

    // Add alerts
    if (overdueBills.length > 0) {
      alerts.push({
        type: "error",
        title: "Overdue Bills",
        message: `${overdueBills.length} bill(s) are overdue`,
        count: overdueBills.length,
        icon: AlertCircle,
      })
    }

    if (dueTodayBills.length > 0) {
      alerts.push({
        type: "warning",
        title: "Bills Due Today",
        message: `${dueTodayBills.length} bill(s) due today`,
        count: dueTodayBills.length,
        icon: Clock,
      })
    }

    if (today && today.isWorkDay && !todayGoalMet) {
      const remaining = today.goal - today.amount
      alerts.push({
        type: "info",
        title: "Daily Goal",
        message: `${currency}${remaining.toLocaleString()} remaining to reach today's goal`,
        icon: Target,
      })
    }

    if (today && today.isWorkDay && todayGoalMet) {
      alerts.push({
        type: "success",
        title: "Goal Achieved!",
        message: "You've reached today's income goal",
        icon: CheckCircle,
      })
    }

    return alerts
  }

  const alerts = getCurrentAlerts()

  const getAlertColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      case "warning":
        return "bg-orange-50 border-orange-200 text-orange-800"
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      default:
        return "bg-blue-50 border-blue-200 text-blue-800"
    }
  }

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-orange-100 text-orange-800"
      case "success":
        return "bg-green-100 text-green-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="space-y-4">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-green-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-sm text-gray-600">Get reminders for bills and income goals</p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  requestNotificationPermission()
                } else {
                  disableNotifications()
                }
              }}
            />
          </div>

          {permission === "denied" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Notifications are blocked. Please enable them in your browser settings to receive alerts.
              </p>
            </div>
          )}

          {notificationsEnabled && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Notifications enabled. You'll receive daily reminders at 8 AM and 6 PM Manila time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Current Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p>All good! No alerts at the moment.</p>
              <p className="text-sm">Keep up the great work with your budget!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <alert.icon className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm opacity-80">{alert.message}</p>
                      </div>
                    </div>
                    {alert.count && <Badge className={getAlertBadgeColor(alert.type)}>{alert.count}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Morning Reminder (8:00 AM)</span>
              <Badge variant="outline">Daily</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Evening Check-in (6:00 PM)</span>
              <Badge variant="outline">Daily</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Bill Due Reminders</span>
              <Badge variant="outline">As needed</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Goal Achievement Alerts</span>
              <Badge variant="outline">Real-time</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Notification */}
      {notificationsEnabled && (
        <Button
          variant="outline"
          onClick={() => {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Test Notification", {
                body: "This is a test notification from Budget Tracker!",
                icon: "/placeholder-logo.png",
              })
            }
          }}
          className="w-full"
        >
          Send Test Notification
        </Button>
      )}
    </div>
  )
}
