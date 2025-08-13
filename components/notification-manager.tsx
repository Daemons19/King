"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, Clock, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface NotificationManagerProps {
  weeklyPayables: any[]
  dailyIncome: any[]
  currency: string
}

export function NotificationManager({ weeklyPayables, dailyIncome, currency }: NotificationManagerProps) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported("Notification" in window && "serviceWorker" in navigator)

    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (notificationPermission === "granted") {
      scheduleNotifications()
      checkDueBills()
    }
  }, [notificationPermission, weeklyPayables])

  const requestNotificationPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Notifications are not supported in this browser",
        variant: "destructive",
      })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === "granted") {
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You'll get daily reminders and bill due alerts",
        })

        // Show test notification
        showNotification("Welcome! 🎉", "Budget notifications are now active!")

        // Schedule daily notifications
        scheduleNotifications()
      } else {
        toast({
          title: "Notifications Disabled",
          description: "You can enable them later in browser settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    }
  }

  const showNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (notificationPermission === "granted") {
      new Notification(title, {
        body,
        icon: "/placeholder-logo.png",
        badge: "/placeholder-logo.png",
        vibrate: [100, 50, 100],
        ...options,
      })
    }
  }

  const scheduleNotifications = () => {
    // Schedule morning notification (8 AM Manila time)
    const now = new Date()
    const morningTime = new Date()
    morningTime.setHours(8, 0, 0, 0)

    if (morningTime <= now) {
      morningTime.setDate(morningTime.getDate() + 1)
    }

    const morningTimeout = morningTime.getTime() - now.getTime()

    setTimeout(() => {
      const todayIncome = dailyIncome.find((d) => d.isToday)
      const todayGoal = todayIncome?.goal || 800
      const currentEarnings = todayIncome?.amount || 0

      showNotification(
        "Good Morning! 🌅",
        `Daily goal: ${currency}${todayGoal.toLocaleString()}. Current: ${currency}${currentEarnings.toLocaleString()}. Let's earn today!`,
        { tag: "morning-reminder" },
      )

      // Schedule next morning notification
      scheduleNotifications()
    }, morningTimeout)

    // Schedule evening notification (6 PM Manila time)
    const eveningTime = new Date()
    eveningTime.setHours(18, 0, 0, 0)

    if (eveningTime <= now) {
      eveningTime.setDate(eveningTime.getDate() + 1)
    }

    const eveningTimeout = eveningTime.getTime() - now.getTime()

    setTimeout(() => {
      const todayIncome = dailyIncome.find((d) => d.isToday)
      const todayGoal = todayIncome?.goal || 800
      const currentEarnings = todayIncome?.amount || 0
      const progress = ((currentEarnings / todayGoal) * 100).toFixed(0)

      showNotification(
        "Evening Check-in! 🌆",
        `Today's progress: ${progress}% (${currency}${currentEarnings.toLocaleString()}/${currency}${todayGoal.toLocaleString()}). Update your expenses!`,
        { tag: "evening-reminder" },
      )
    }, eveningTimeout)
  }

  const checkDueBills = () => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" })
    const dueBills = weeklyPayables.filter((bill) => bill.dueDay === today && bill.status === "pending")

    if (dueBills.length > 0) {
      const totalDue = dueBills.reduce((sum, bill) => sum + bill.amount, 0)
      const billNames = dueBills.map((bill) => bill.name).join(", ")

      showNotification(
        "Bills Due Today! 💳",
        `${dueBills.length} bill(s) due: ${billNames}. Total: ${currency}${totalDue.toLocaleString()}`,
        {
          tag: "bills-due",
          requireInteraction: true,
        },
      )
    }

    // Check for overdue bills
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const todayIndex = dayOrder.indexOf(today)

    const overdueBills = weeklyPayables.filter((bill) => {
      const billIndex = dayOrder.indexOf(bill.dueDay)
      return billIndex < todayIndex && bill.status === "pending"
    })

    if (overdueBills.length > 0) {
      const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0)

      showNotification(
        "Overdue Bills! ⚠️",
        `${overdueBills.length} overdue bill(s). Total: ${currency}${totalOverdue.toLocaleString()}`,
        {
          tag: "bills-overdue",
          requireInteraction: true,
        },
      )
    }
  }

  const testNotification = () => {
    const todayIncome = dailyIncome.find((d) => d.isToday)
    const currentEarnings = todayIncome?.amount || 0
    const todayGoal = todayIncome?.goal || 800

    showNotification(
      "Test Notification 🧪",
      `Current earnings: ${currency}${currentEarnings.toLocaleString()} / Goal: ${currency}${todayGoal.toLocaleString()}`,
    )
  }

  if (!isSupported) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <BellOff className="w-5 h-5 text-gray-400" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>Your browser doesn't support notifications</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Bell className={`w-5 h-5 ${notificationPermission === "granted" ? "text-green-600" : "text-gray-400"}`} />
          Smart Notifications
        </CardTitle>
        <CardDescription>Get daily reminders and bill due alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationPermission === "default" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Enable Notifications</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Get daily budget reminders and bill due alerts to stay on track with your finances.
                </p>
                <Button onClick={requestNotificationPermission} className="bg-blue-600 hover:bg-blue-700">
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </Button>
              </div>
            </div>
          </div>
        )}

        {notificationPermission === "granted" && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Notifications Active</span>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Morning reminder at 8:00 AM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Evening check-in at 6:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  <span>Bill due date alerts</span>
                </div>
              </div>
            </div>

            <Button onClick={testNotification} variant="outline" className="w-full bg-transparent">
              <Bell className="w-4 h-4 mr-2" />
              Test Notification
            </Button>
          </div>
        )}

        {notificationPermission === "denied" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <BellOff className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Notifications Blocked</h4>
                <p className="text-sm text-red-700">
                  To enable notifications, go to your browser settings and allow notifications for this site.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
