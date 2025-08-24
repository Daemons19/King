"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bell, AlertTriangle, CheckCircle, Clock, TrendingUp, Target, Calendar, DollarSign, Zap } from "lucide-react"

// Safe number formatting function
const safeToFixed = (value: any, decimals = 2): string => {
  const num = Number(value)
  return isNaN(num) ? "0.00" : num.toFixed(decimals)
}

// Safe number conversion
const safeNumber = (value: any): number => {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

// Helper function to get current day
const getCurrentDay = () => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return days[new Date().getDay()]
}

// Helper function to get current time in Manila
const getCurrentManilaTime = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

interface NotificationManagerProps {
  weeklyPayables: any[]
  dailyIncome: any[]
  currency: string
}

export default function NotificationManager({ weeklyPayables, dailyIncome, currency }: NotificationManagerProps) {
  const [currentTime, setCurrentTime] = useState("")
  const [notifications, setNotifications] = useState<any[]>([])

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentManilaTime())
    }

    updateTime()
    const timer = setInterval(updateTime, 60000)
    return () => clearInterval(timer)
  }, [])

  // Generate notifications based on current data
  useEffect(() => {
    const newNotifications = []
    const currentDay = getCurrentDay()

    // Safe data access with defaults
    const safeWeeklyPayables = Array.isArray(weeklyPayables) ? weeklyPayables : []
    const safeDailyIncome = Array.isArray(dailyIncome) ? dailyIncome : []

    // Today's income data
    const todayData = safeDailyIncome.find((day) => day && day.day === currentDay)
    const todayIncome = safeNumber(todayData?.amount)
    const todayGoal = safeNumber(todayData?.goal)
    const isWorkDay = Boolean(todayData?.isWorkDay)

    // 1. Today's Goal Progress Notification
    if (isWorkDay && todayGoal > 0) {
      const progress = (todayIncome / todayGoal) * 100

      if (progress >= 100) {
        newNotifications.push({
          id: "goal-achieved",
          type: "success",
          icon: CheckCircle,
          title: "🎉 Daily Goal Achieved!",
          message: `You've earned ${currency}${todayIncome.toLocaleString()} today (${safeToFixed(progress, 1)}% of goal)`,
          priority: "high",
          timestamp: new Date().toISOString(),
        })
      } else if (progress >= 80) {
        newNotifications.push({
          id: "goal-almost",
          type: "info",
          icon: Target,
          title: "🔥 Almost There!",
          message: `${safeToFixed(progress, 1)}% of daily goal completed. ${currency}${(todayGoal - todayIncome).toLocaleString()} to go!`,
          priority: "medium",
          timestamp: new Date().toISOString(),
        })
      } else if (progress < 50) {
        const currentHour = new Date().getHours()
        if (currentHour >= 12) {
          // After noon
          newNotifications.push({
            id: "goal-behind",
            type: "warning",
            icon: AlertTriangle,
            title: "⚡ Behind on Daily Goal",
            message: `Only ${safeToFixed(progress, 1)}% completed. Need ${currency}${(todayGoal - todayIncome).toLocaleString()} more today.`,
            priority: "high",
            timestamp: new Date().toISOString(),
          })
        }
      }
    }

    // 2. Pending Bills Notifications
    const pendingBills = safeWeeklyPayables.filter((bill) => bill && bill.status === "pending")
    const totalPendingAmount = pendingBills.reduce((sum, bill) => sum + safeNumber(bill?.amount), 0)

    if (pendingBills.length > 0) {
      // Bills due today
      const billsDueToday = pendingBills.filter((bill) => bill && bill.dueDay === currentDay)

      if (billsDueToday.length > 0) {
        const todayBillsAmount = billsDueToday.reduce((sum, bill) => sum + safeNumber(bill?.amount), 0)
        newNotifications.push({
          id: "bills-due-today",
          type: "urgent",
          icon: AlertTriangle,
          title: "🚨 Bills Due Today!",
          message: `${billsDueToday.length} bill(s) due today totaling ${currency}${todayBillsAmount.toLocaleString()}`,
          priority: "urgent",
          timestamp: new Date().toISOString(),
          bills: billsDueToday,
        })
      }

      // All pending bills summary
      if (totalPendingAmount > 0) {
        newNotifications.push({
          id: "pending-bills",
          type: "info",
          icon: Clock,
          title: "📋 Pending Bills",
          message: `${pendingBills.length} pending bill(s) totaling ${currency}${totalPendingAmount.toLocaleString()}`,
          priority: "medium",
          timestamp: new Date().toISOString(),
        })
      }
    }

    // 3. Weekly Progress Notification
    const workDays = safeDailyIncome.filter((day) => day && day.isWorkDay && safeNumber(day.goal) > 0)
    const weeklyEarned = workDays.reduce((sum, day) => sum + safeNumber(day?.amount), 0)
    const weeklyGoal = workDays.reduce((sum, day) => sum + safeNumber(day?.goal), 0)
    const weeklyProgress = (weeklyEarned / weeklyGoal) * 100 // Declare weeklyProgress here

    if (weeklyGoal > 0) {
      if (weeklyProgress >= 100) {
        newNotifications.push({
          id: "weekly-goal-achieved",
          type: "success",
          icon: TrendingUp,
          title: "🏆 Weekly Goal Achieved!",
          message: `Amazing! You've earned ${currency}${weeklyEarned.toLocaleString()} this week (${safeToFixed(weeklyProgress, 1)}%)`,
          priority: "high",
          timestamp: new Date().toISOString(),
        })
      } else if (weeklyProgress >= 75) {
        newNotifications.push({
          id: "weekly-progress-good",
          type: "info",
          icon: TrendingUp,
          title: "📈 Great Weekly Progress",
          message: `${safeToFixed(weeklyProgress, 1)}% of weekly goal completed. Keep it up!`,
          priority: "low",
          timestamp: new Date().toISOString(),
        })
      }
    }

    // 4. Rest Day Notification
    if (!isWorkDay) {
      newNotifications.push({
        id: "rest-day",
        type: "info",
        icon: Calendar,
        title: "😌 Rest Day",
        message: `Today is marked as a rest day. Take time to recharge!`,
        priority: "low",
        timestamp: new Date().toISOString(),
      })
    }

    // 5. Savings Potential Notification
    const remainingWorkDays = workDays.filter((day) => day && !day.isPast && !day.isToday)
    const potentialRemainingEarnings = remainingWorkDays.reduce((sum, day) => sum + safeNumber(day?.goal), 0)

    if (potentialRemainingEarnings > 0 && weeklyProgress >= 50) {
      const projectedWeeklyTotal = weeklyEarned + potentialRemainingEarnings
      const projectedSavings = projectedWeeklyTotal - totalPendingAmount

      if (projectedSavings > 0) {
        newNotifications.push({
          id: "savings-potential",
          type: "success",
          icon: DollarSign,
          title: "💰 Savings Potential",
          message: `If you meet remaining goals, you could save ${currency}${projectedSavings.toLocaleString()} this week!`,
          priority: "medium",
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Sort notifications by priority and timestamp
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    newNotifications.sort((a, b) => {
      const priorityDiff =
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    setNotifications(newNotifications)
  }, [weeklyPayables, dailyIncome, currency])

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "border-red-500 bg-red-50"
      case "warning":
        return "border-orange-500 bg-orange-50"
      case "success":
        return "border-green-500 bg-green-50"
      case "info":
      default:
        return "border-blue-500 bg-blue-50"
    }
  }

  const getNotificationBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-600 text-white"
      case "high":
        return "bg-orange-600 text-white"
      case "medium":
        return "bg-blue-600 text-white"
      case "low":
      default:
        return "bg-gray-600 text-white"
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Smart Notifications</h2>
        </div>
        <div className="text-sm text-gray-500">{currentTime} Manila Time</div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No notifications at the moment</p>
              <p className="text-sm text-gray-400 mt-1">
                We'll notify you about goals, bills, and savings opportunities
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const IconComponent = notification.icon
            return (
              <Card key={notification.id} className={`border-l-4 ${getNotificationColor(notification.type)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-800 text-sm">{notification.title}</h3>
                        <Badge className={`text-xs ${getNotificationBadgeColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

                      {/* Special content for bills due today */}
                      {notification.bills && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-700">Bills due today:</p>
                          {notification.bills.map((bill: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="text-sm font-medium">{bill?.name || "Unnamed Bill"}</span>
                              <span className="text-sm text-gray-600">
                                {currency}
                                {safeNumber(bill?.amount).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(notification.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Quick Stats Summary */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Active Alerts</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {notifications.filter((n) => n.priority === "urgent" || n.priority === "high").length}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Good News</span>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {notifications.filter((n) => n.type === "success").length}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
