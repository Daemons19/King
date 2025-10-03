"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, CheckCircle2 } from "lucide-react"

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

const getWeekStartManila = () => {
  const now = new Date()
  const manilaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }))
  const dayOfWeek = manilaDate.getDay()
  const diff = manilaDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(manilaDate.setDate(diff))
  return weekStart.toISOString().split("T")[0]
}

const isDateInCurrentWeek = (dateString: string) => {
  const date = new Date(dateString)
  const weekStart = new Date(getWeekStartManila())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return date >= weekStart && date <= weekEnd
}

const getCurrentMonthInfo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthName = now.toLocaleString("default", { month: "long" })
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return { year, month, monthName, daysInMonth }
}

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

interface Payable {
  id: string
  name: string
  amount: number
  frequency: "weekly" | "monthly"
  dueDay: string
  isPaid: boolean
}

interface WeeklyPayablesCardProps {
  payables: Payable[]
  onPayBill: (id: string) => void
  currency: string
}

export function WeeklyPayablesCard({ payables, onPayBill, currency }: WeeklyPayablesCardProps) {
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

  const getMonthlyPayablesForCurrentWeek = () => {
    const monthlyPayables = JSON.parse(safeLocalStorage.getItem("monthlyPayables") || "[]")
    const currentMonthInfo = getCurrentMonthInfo()

    return monthlyPayables
      .filter((payable: any) => {
        const dueDate = new Date(currentMonthInfo.year, currentMonthInfo.month, payable.dayOfMonth)
        const dueDateString = dueDate.toISOString().split("T")[0]
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

  const allCurrentWeekPayables = [...payables, ...getMonthlyPayablesForCurrentWeek()]

  const unpaidPayables = allCurrentWeekPayables.filter((p) => !p.isPaid)
  const totalUnpaid = unpaidPayables.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg text-gray-800">Weekly Bills</CardTitle>
            <CardDescription>
              {unpaidPayables.length} pending • {currency}
              {totalUnpaid.toLocaleString()} due
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
        {unpaidPayables.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>All bills paid!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unpaidPayables.map((payable) => (
              <div
                key={payable.id}
                className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg"
              >
                <div>
                  <p className="font-medium">{payable.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {payable.dueDay} • {payable.frequency}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {currency}
                    {payable.amount.toLocaleString()}
                  </p>
                  <Button size="sm" onClick={() => onPayBill(payable.id)}>
                    Pay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

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
