"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Bell, BellOff, Calendar, CheckCircle, Clock, CreditCard, DollarSign } from "lucide-react"

// Helper function to get current Manila time
const getManilaTime = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Helper function to get week start date in Manila
const getWeekStartManila = () => {
  const now = new Date()
  const manilaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }))
  const dayOfWeek = manilaDate.getDay()
  const diff = manilaDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday as start
  const weekStart = new Date(manilaDate.setDate(diff))
  return weekStart.toISOString().split("T")[0]
}

// Helper function to check if date is in current week
const isDateInCurrentWeek = (dateString: string) => {
  const date = new Date(dateString)
  const weekStart = new Date(getWeekStartManila())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // Sunday
  return date >= weekStart && date <= weekEnd
}

// Helper function to get current month info
const getCurrentMonthInfo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthName = now.toLocaleString("default", { month: "long" })
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return { year, month, monthName, daysInMonth }
}

// Safe localStorage access
const safeLocalStorage = {
  getItem: (key: string) => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value)
    }
  },
}

interface WeeklyPayablesCardProps {
  weeklyPayables: any[]
  setWeeklyPayables: (payables: any[]) => void
  currency: string
  onPayment?: (payableId: number, amount: number) => void
}

export function WeeklyPayablesCard({
  weeklyPayables,
  setWeeklyPayables,
  currency,
  onPayment,
}: WeeklyPayablesCardProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("payableNotificationsEnabled")
      return saved ? JSON.parse(saved) : true
    }
    return true
  })

  const toggleNotifications = () => {
    const newState = !notificationsEnabled
    setNotificationsEnabled(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("payableNotificationsEnabled", JSON.stringify(newState))
    }
  }

  // Get monthly payables that fall within current week
  const getMonthlyPayablesForCurrentWeek = () => {
    const monthlyPayables = JSON.parse(safeLocalStorage.getItem("monthlyPayables") || "[]")
    const currentMonthInfo = getCurrentMonthInfo()

    return monthlyPayables
      .filter((payable: any) => {
        // Create date for this month's due date
        const dueDate = new Date(currentMonthInfo.year, currentMonthInfo.month, payable.dayOfMonth)
        const dueDateString = dueDate.toISOString().split("T")[0]

        // Check if due date falls in current week
        return isDateInCurrentWeek(dueDateString)
      })
      .map((payable: any) => ({
        ...payable,
        week: "This Week",
        source: "monthly",
        dueDay: new Date(currentMonthInfo.year, currentMonthInfo.month, payable.dayOfMonth).toLocaleDateString(
          "en-US",
          { weekday: "long" },
        ),
        date: new Date(currentMonthInfo.year, currentMonthInfo.month, payable.dayOfMonth).toISOString().split("T")[0],
      }))
  }

  // Combine weekly payables with monthly payables that fall in current week
  const allCurrentWeekPayables = [...weeklyPayables, ...getMonthlyPayablesForCurrentWeek()]

  const markAsPaid = (id: number) => {
    const payable = allCurrentWeekPayables.find((p) => p.id === id)
    if (!payable) return

    // Call the payment handler if provided (for balance deduction)
    if (onPayment) {
      onPayment(id, payable.amount)
    } else {
      // Fallback to old behavior if no payment handler
      const updated = weeklyPayables.map((payable) => {
        if (payable.id === id) {
          const newPaidCount = (payable.paidCount || 0) + 1
          let newStatus = "paid"

          // Smart completion logic
          if (payable.frequency === "twice-monthly" && newPaidCount >= 2) {
            newStatus = "completed"
          } else if (payable.frequency === "monthly" && newPaidCount >= 1) {
            newStatus = "completed"
          }

          return {
            ...payable,
            status: newStatus,
            paidCount: newPaidCount,
          }
        }
        return payable
      })
      setWeeklyPayables(updated)
    }
  }

  const pendingPayables = allCurrentWeekPayables.filter((p) => p.status === "pending")
  const totalPending = pendingPayables.reduce((sum, p) => sum + p.amount, 0)
  const totalPayables = allCurrentWeekPayables.reduce((sum, p) => sum + p.amount, 0)
  const completionRate = totalPayables > 0 ? ((totalPayables - totalPending) / totalPayables) * 100 : 0

  // Group payables by source and day
  const saturdayPayables = allCurrentWeekPayables.filter((p) => p.dueDay === "Saturday" && p.source !== "monthly")
  const monthlyPayables = allCurrentWeekPayables.filter((p) => p.source === "monthly")
  const otherPayables = allCurrentWeekPayables.filter((p) => p.dueDay !== "Saturday" && p.source !== "monthly")

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg text-gray-800">Weekly Bills</CardTitle>
            <CardDescription>
              {pendingPayables.length} pending • {currency}
              {totalPending.toLocaleString()} due
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleNotifications}
            className={`${notificationsEnabled ? "text-blue-600" : "text-gray-400"}`}
          >
            {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Weekly Progress</span>
            <span className="font-medium">{completionRate.toFixed(0)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Monthly Bills Section (Highlighted) */}
        {monthlyPayables.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
              <Calendar className="w-4 h-4" />
              Monthly Bills (Due This Week)
            </div>
            {monthlyPayables.map((payable) => (
              <div
                key={payable.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{payable.name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    {currency}
                    {payable.amount.toLocaleString()}
                    <span className="text-purple-600">• {payable.dueDay}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                      Monthly (Day {payable.dayOfMonth})
                    </Badge>
                    {payable.date && (
                      <span className="text-xs text-gray-500">Due: {new Date(payable.date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {payable.status === "pending" ? (
                    <Button
                      size="sm"
                      onClick={() => markAsPaid(payable.id)}
                      className="bg-purple-600 hover:bg-purple-700 h-8 px-3"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Pay
                    </Button>
                  ) : (
                    <Badge
                      className={`${
                        payable.status === "completed" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {payable.status === "completed" ? "Done" : "Paid"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saturday Bills Section (Highlighted) */}
        {saturdayPayables.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <Calendar className="w-4 h-4" />
              Saturday Bills (Default Day)
            </div>
            {saturdayPayables.map((payable) => (
              <div
                key={payable.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{payable.name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    {currency}
                    {payable.amount.toLocaleString()}
                    <span className="text-blue-600">• Saturday</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                      {payable.frequency === "twice-monthly" ? "Bi-Weekly" : payable.frequency}
                    </Badge>
                    {payable.frequency === "twice-monthly" && (
                      <span className="text-xs text-gray-500">{payable.paidCount || 0}/2</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {payable.status === "pending" ? (
                    <Button
                      size="sm"
                      onClick={() => markAsPaid(payable.id)}
                      className="bg-blue-600 hover:bg-blue-700 h-8 px-3"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Pay
                    </Button>
                  ) : (
                    <Badge
                      className={`${
                        payable.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {payable.status === "completed" ? "Done" : "Paid"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Other Bills Section */}
        {otherPayables.length > 0 && (
          <div className="space-y-3">
            {(saturdayPayables.length > 0 || monthlyPayables.length > 0) && (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Clock className="w-4 h-4" />
                Other Days
              </div>
            )}
            {otherPayables.map((payable) => (
              <div
                key={payable.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{payable.name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    {currency}
                    {payable.amount.toLocaleString()}
                    <span>• {payable.dueDay}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {payable.frequency === "twice-monthly" ? "Bi-Weekly" : payable.frequency}
                    </Badge>
                    {payable.frequency === "twice-monthly" && (
                      <span className="text-xs text-gray-500">{payable.paidCount || 0}/2</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {payable.status === "pending" ? (
                    <Button
                      size="sm"
                      onClick={() => markAsPaid(payable.id)}
                      className="bg-green-600 hover:bg-green-700 h-8 px-3"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Pay
                    </Button>
                  ) : (
                    <Badge
                      className={`${
                        payable.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {payable.status === "completed" ? "Done" : "Paid"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {allCurrentWeekPayables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No bills due this week.</p>
            <p className="text-sm">Add bills in Settings to track your payments.</p>
          </div>
        )}

        {/* Notification Status */}
        {allCurrentWeekPayables.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <span>{notificationsEnabled ? "Notifications enabled" : "Notifications disabled"}</span>
            <span>Auto-includes monthly bills due this week</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
