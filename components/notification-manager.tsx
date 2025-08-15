"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Clock, AlertTriangle, Target, CheckCircle } from "lucide-react"

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
  const [preferences, setPreferences] = useState({
    dailyGoalReminders: true,
    billReminders: true,
    weeklyReports: true,
    achievementAlerts: true,
  })

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === "granted")

      if (permission === "granted") {
        new Notification("Budget Tracker", {
          body: "Notifications enabled! You'll receive reminders and updates.",
          icon: "/icon-192x192.png",
        })
      }
    }
  }

  const sendTestNotification = () => {
    if (notificationsEnabled) {
      new Notification("Test Notification", {
        body: "Your notifications are working perfectly!",
        icon: "/icon-192x192.png",
      })
    }
  }

  // Calculate notification insights
  const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
  const todayData = dailyIncome.find((d) => d.isToday)
  const todayProgress = todayData ? (todayData.amount / todayData.goal) * 100 : 0
  const workDaysCompleted = dailyIncome.filter((d) => d.isPast && d.isWorkDay && d.amount > 0).length
  const totalWorkDays = dailyIncome.filter((d) => d.isWorkDay).length

  return (
    <div className="space-y-4">
      {/* Notification Status */}
      <Card className="bg-white/90 border-0">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-green-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            Notification Status
          </CardTitle>
          <CardDescription>
            {notificationsEnabled
              ? "Notifications are enabled and working"
              : "Enable notifications to get reminders and updates"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!notificationsEnabled ? (
            <Button
              onClick={requestNotificationPermission}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          ) : (
            <div className="space-y-3">
              <Button onClick={sendTestNotification} variant="outline" className="w-full bg-white">
                <Bell className="w-4 h-4 mr-2" />
                Send Test Notification
              </Button>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Notifications Active</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  You'll receive reminders and updates based on your preferences below.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-white/90 border-0">
        <CardHeader>
          <CardTitle className="text-gray-800">Notification Preferences</CardTitle>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Daily Goal Reminders</Label>
                <p className="text-xs text-gray-500">Get reminded about your daily income goals</p>
              </div>
              <Switch
                checked={preferences.dailyGoalReminders}
                onCheckedChange={(checked) => setPreferences({ ...preferences, dailyGoalReminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Bill Reminders</Label>
                <p className="text-xs text-gray-500">Get notified about upcoming bill payments</p>
              </div>
              <Switch
                checked={preferences.billReminders}
                onCheckedChange={(checked) => setPreferences({ ...preferences, billReminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Weekly Reports</Label>
                <p className="text-xs text-gray-500">Receive weekly budget summaries</p>
              </div>
              <Switch
                checked={preferences.weeklyReports}
                onCheckedChange={(checked) => setPreferences({ ...preferences, weeklyReports: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Achievement Alerts</Label>
                <p className="text-xs text-gray-500">Celebrate when you reach your goals</p>
              </div>
              <Switch
                checked={preferences.achievementAlerts}
                onCheckedChange={(checked) => setPreferences({ ...preferences, achievementAlerts: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Alerts */}
      <Card className="bg-white/90 border-0">
        <CardHeader>
          <CardTitle className="text-gray-800">Current Alerts</CardTitle>
          <CardDescription>Important notifications based on your current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Today's Goal Alert */}
            {todayData && todayData.isWorkDay && (
              <div
                className={`p-3 rounded-lg border ${
                  todayProgress >= 100
                    ? "bg-green-50 border-green-200"
                    : todayProgress >= 50
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target className={`w-4 h-4 ${todayProgress >= 100 ? "text-green-600" : "text-orange-600"}`} />
                  <span className="text-sm font-medium">Today's Goal Progress</span>
                  <Badge variant="outline" className="text-xs">
                    {todayProgress.toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  {todayProgress >= 100
                    ? "🎉 Congratulations! You've reached today's goal!"
                    : `You need ${currency}${(todayData.goal - todayData.amount).toLocaleString()} more to reach today's goal.`}
                </p>
              </div>
            )}

            {/* Pending Bills Alert */}
            {pendingBills.length > 0 && (
              <div className="p-3 rounded-lg border bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Pending Bills</span>
                  <Badge variant="outline" className="text-xs">
                    {pendingBills.length}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  You have {pendingBills.length} unpaid bill{pendingBills.length > 1 ? "s" : ""} totaling {currency}
                  {pendingBills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()}.
                </p>
              </div>
            )}

            {/* Weekly Progress Alert */}
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Weekly Progress</span>
                <Badge variant="outline" className="text-xs">
                  {workDaysCompleted}/{totalWorkDays} days
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                You've completed {workDaysCompleted} out of {totalWorkDays} work days this week.
                {workDaysCompleted === totalWorkDays && " Great job finishing the week strong! 🎯"}
              </p>
            </div>

            {/* No alerts state */}
            {pendingBills.length === 0 && todayProgress >= 100 && workDaysCompleted === totalWorkDays && (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p className="text-sm">All caught up!</p>
                <p className="text-xs">No urgent notifications at the moment.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
