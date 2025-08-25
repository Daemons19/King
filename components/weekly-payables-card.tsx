"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Check, Clock, Calendar, DollarSign, AlertTriangle } from "lucide-react"

// Safe number formatting
const safeToLocaleString = (value: any): string => {
  const num = Number(value)
  return isNaN(num) ? "0" : num.toLocaleString()
}

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

interface WeeklyPayablesCardProps {
  weeklyPayables: any[]
  setWeeklyPayables: (payables: any[]) => void
  currency: string
  onPayment: (payableId: number, amount: number) => void
}

export function WeeklyPayablesCard({
  weeklyPayables,
  setWeeklyPayables,
  currency,
  onPayment,
}: WeeklyPayablesCardProps) {
  const [payingBills, setPayingBills] = useState<Set<number>>(new Set())

  // Get monthly payables from localStorage
  const getMonthlyPayablesForCurrentWeek = () => {
    const monthlyPayables = JSON.parse(localStorage.getItem("monthlyPayables") || "[]")
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
        isMonthly: true, // Flag to identify monthly bills
      }))
  }

  // Combine weekly and monthly payables
  const monthlyPayablesThisWeek = getMonthlyPayablesForCurrentWeek()
  const allPayables = [...weeklyPayables, ...monthlyPayablesThisWeek]

  // Filter payables for current week
  const currentWeekPayables = allPayables.filter((payable) => payable.week === "This Week")

  // Calculate totals
  const totalPayables = currentWeekPayables.reduce((sum, payable) => sum + (payable.amount || 0), 0)
  const pendingPayables = currentWeekPayables.filter((p) => p.status === "pending")
  const totalPending = pendingPayables.reduce((sum, payable) => sum + (payable.amount || 0), 0)
  const paidPayables = currentWeekPayables.filter((p) => p.status === "paid")
  const totalPaid = paidPayables.reduce((sum, payable) => sum + (payable.amount || 0), 0)

  const paymentProgress = totalPayables > 0 ? (totalPaid / totalPayables) * 100 : 0

  const handlePayBill = async (payable: any) => {
    if (payingBills.has(payable.id)) return

    setPayingBills((prev) => new Set([...prev, payable.id]))

    try {
      if (payable.isMonthly) {
        // Handle monthly payable payment
        const monthlyPayables = JSON.parse(localStorage.getItem("monthlyPayables") || "[]")
        const updatedMonthlyPayables = monthlyPayables.map((p: any) =>
          p.id === payable.id ? { ...p, status: "paid" } : p,
        )
        localStorage.setItem("monthlyPayables", JSON.stringify(updatedMonthlyPayables))
      } else {
        // Handle weekly payable payment
        const updatedPayables = weeklyPayables.map((p) => {
          if (p.id === payable.id) {
            const newPaidCount = (p.paidCount || 0) + 1
            let newStatus = "paid"

            // Smart completion logic
            if (p.frequency === "twice-monthly" && newPaidCount >= 2) {
              newStatus = "completed"
            } else if (p.frequency === "monthly" && newPaidCount >= 1) {
              newStatus = "completed"
            }

            return {
              ...p,
              status: newStatus,
              paidCount: newPaidCount,
            }
          }
          return p
        })
        setWeeklyPayables(updatedPayables)
      }

      // Call the payment handler to deduct from balance
      onPayment(payable.id, payable.amount)
    } catch (error) {
      console.error("Error paying bill:", error)
    } finally {
      setPayingBills((prev) => {
        const newSet = new Set(prev)
        newSet.delete(payable.id)
        return newSet
      })
    }
  }

  const getDayColor = (dueDay: string) => {
    const dayColors: { [key: string]: string } = {
      Monday: "bg-blue-100 text-blue-800",
      Tuesday: "bg-green-100 text-green-800",
      Wednesday: "bg-yellow-100 text-yellow-800",
      Thursday: "bg-purple-100 text-purple-800",
      Friday: "bg-pink-100 text-pink-800",
      Saturday: "bg-indigo-100 text-indigo-800",
      Sunday: "bg-red-100 text-red-800",
    }
    return dayColors[dueDay] || "bg-gray-100 text-gray-800"
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <CreditCard className="w-5 h-5 text-blue-600" />
          This Week's Bills
        </CardTitle>
        <CardDescription>Weekly and monthly bills due this week • Week starting {getWeekStartManila()}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {currency}
              {safeToLocaleString(totalPayables)}
            </div>
            <div className="text-xs text-gray-600">Total Bills</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {currency}
              {safeToLocaleString(totalPending)}
            </div>
            <div className="text-xs text-gray-600">Pending ({pendingPayables.length})</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {currency}
              {safeToLocaleString(totalPaid)}
            </div>
            <div className="text-xs text-gray-600">Paid ({paidPayables.length})</div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span>Payment Progress</span>
            <span className="font-medium">{paymentProgress.toFixed(0)}%</span>
          </div>
          <Progress value={paymentProgress} className="h-2" />
        </div>

        {/* Bills List */}
        {currentWeekPayables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No bills due this week</p>
            <p className="text-sm">All caught up! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentWeekPayables.map((payable) => (
              <div
                key={`${payable.source || "weekly"}-${payable.id}`}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  payable.status === "paid"
                    ? "bg-green-50 border-green-200"
                    : payable.status === "completed"
                      ? "bg-blue-50 border-blue-200"
                      : payable.isMonthly
                        ? "bg-purple-50 border-purple-200"
                        : "bg-white border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{payable.name}</span>
                      {payable.isMonthly && <Badge className="bg-purple-100 text-purple-800 text-xs">Monthly</Badge>}
                      {payable.status === "completed" && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Completed</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-3 h-3" />
                      <span>
                        {currency}
                        {safeToLocaleString(payable.amount)}
                      </span>
                      <span>•</span>
                      <Badge className={`text-xs ${getDayColor(payable.dueDay)}`}>{payable.dueDay}</Badge>
                      {payable.isMonthly && (
                        <>
                          <span>•</span>
                          <span className="text-xs">Day {payable.dayOfMonth}</span>
                        </>
                      )}
                    </div>
                    {payable.frequency && !payable.isMonthly && (
                      <div className="text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {payable.frequency}
                        {payable.paidCount > 0 && <span> • Paid {payable.paidCount} time(s)</span>}
                      </div>
                    )}
                    {payable.date && <div className="text-xs text-gray-500 mt-1">Due: {payable.date}</div>}
                  </div>

                  <div className="flex items-center gap-2">
                    {payable.status === "pending" ? (
                      <Button
                        size="sm"
                        onClick={() => handlePayBill(payable)}
                        disabled={payingBills.has(payable.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {payingBills.has(payable.id) ? (
                          <Clock className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-1" />
                        )}
                        {payingBills.has(payable.id) ? "Paying..." : "Pay"}
                      </Button>
                    ) : (
                      <Badge
                        className={
                          payable.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                        }
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {payable.status === "completed" ? "Completed" : "Paid"}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Additional info for overdue bills */}
                {payable.status === "pending" && payable.date && new Date(payable.date) < new Date() && (
                  <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Overdue - Pay as soon as possible</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats Footer */}
        {currentWeekPayables.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {pendingPayables.length > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-orange-500" />
                    {pendingPayables.length} bill{pendingPayables.length !== 1 ? "s" : ""} pending
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 inline mr-1 text-green-500" />
                    All bills paid this week!
                  </>
                )}
              </span>
              <span>
                {monthlyPayablesThisWeek.length > 0 && (
                  <span className="text-purple-600">
                    {monthlyPayablesThisWeek.length} monthly bill{monthlyPayablesThisWeek.length !== 1 ? "s" : ""}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
