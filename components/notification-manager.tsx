"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, Clock, AlertTriangle, CheckCircle, Calendar, DollarSign } from "lucide-react"

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
  const [settings, setSettings] = useState({
    billReminders: true,
    goalAlerts: true,
    dailyReminders: true,
    weeklyReports: true,
  })

  useEffect(() => {
    // Check notification permission
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("notificationSettings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        setNotificationsEnabled(parsed.enabled || false)
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
    if ("Notification" in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === "granted") {
        setNotificationsEnabled(true)
        // Show welcome notification
        new Notification("Budget Tracker Notifications", {
          body: "Notifications are now enabled! You'll receive reminders for bills and goals.",
          icon: "/icon-192x192.png",
        })
      }
    }
  }

  const sendTestNotification = () => {
    if (permission === "granted") {
      new Notification("Test Notification", {
        body: "This is a test notification from your Budget Tracker!",
        icon: "/icon-192x192.png",
      })
    }
  }

  // Calculate notification insights
  const pendingBills = weeklyPayables.filter((p) => p.status === "pending")
  const todayData = dailyIncome.find((d) => d.isToday)
  const todayProgress = todayData ? (todayData.amount / todayData.goal) * 100 : 0
  const workDaysThisWeek = dailyIncome.filter((d) => d.isWorkDay)
  const weeklyProgress =
    workDaysThisWeek.reduce((sum, d) => sum + d.amount, 0) / workDaysThisWeek.reduce((sum, d) => sum + d.goal, 0)

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
            <Button onClick={requestPermission} className="w-full bg-blue-600 hover:bg-blue-700">
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
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
                Send Test Notification
              </Button>
            </div>
          )}

          {permission === "denied" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">
                Notifications are blocked. Please enable them in your browser settings to receive reminders.
              </p>
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
                  <p className="text-xs text-gray-600">Get notified about upcoming bills</p>
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
                  <p className="text-xs text-gray-600">Alerts when you're behind on daily goals</p>
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
                  <p className="text-xs text-gray-600">Daily check-ins and progress updates</p>
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
                  <p className="text-xs text-gray-600">Weekly summary of your budget performance</p>
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
          {pendingBills.length === 0 && todayProgress >= 50 && weeklyProgress >= 0.7 && (
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

      {/* Notification History */}
      <Card className="bg-white/90 border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-800">Recent Notifications</CardTitle>
          <CardDescription>Your notification history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 text-sm">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">Daily goal reminder sent</span>
              <span className="text-xs text-gray-400 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center gap-3 p-2 text-sm">
              <Bell className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">Bill payment reminder</span>
              <span className="text-xs text-gray-400 ml-auto">Yesterday</span>
            </div>
            <div className="flex items-center gap-3 p-2 text-sm">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-gray-600">Weekly report generated</span>
              <span className="text-xs text-gray-400 ml-auto">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
