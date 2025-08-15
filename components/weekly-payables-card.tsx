"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, DollarSign, CheckCircle, Bell, BellOff } from "lucide-react"

interface WeeklyPayable {
  id: number
  name: string
  amount: number
  dueDay: string
  status: "pending" | "paid" | "completed"
  frequency: "weekly" | "monthly" | "twice-monthly"
  paidCount: number
  color: string
}

interface WeeklyPayablesCardProps {
  weeklyPayables: WeeklyPayable[]
  setWeeklyPayables: (payables: WeeklyPayable[]) => void
  currency: string
}

export function WeeklyPayablesCard({ weeklyPayables, setWeeklyPayables, currency }: WeeklyPayablesCardProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    // Check if notifications are enabled
    const checkNotificationPermission = async () => {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission()
        setNotificationsEnabled(permission === "granted")
      }
    }
    checkNotificationPermission()
  }, [])

  const markPayableAsPaid = (id: number) => {
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
          status: newStatus as "pending" | "paid" | "completed",
          paidCount: newPaidCount,
        }
      }
      return payable
    })
    setWeeklyPayables(updated)
  }

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setNotificationsEnabled(true)
        schedulePayableNotifications()
      }
    } else {
      setNotificationsEnabled(false)
    }
  }

  const schedulePayableNotifications = () => {
    if ("serviceWorker" in navigator && notificationsEnabled) {
      navigator.serviceWorker.ready.then((registration) => {
        const notifications = weeklyPayables
          .filter((p) => p.status === "pending")
          .map((payable) => ({
            id: `payable-${payable.id}`,
            payableId: payable.id,
            type: "saturday-reminder",
            message: `Don't forget: ${payable.name} (${currency}${payable.amount.toLocaleString()}) is due on ${payable.dueDay}!`,
            scheduledTime: getNextSaturday().toISOString(),
          }))

        registration.active?.postMessage({
          type: "SCHEDULE_WEEKLY_NOTIFICATIONS",
          payload: { weeklyPayables, currency, notifications },
        })
      })
    }
  }

  const getNextSaturday = () => {
    const today = new Date()
    const daysUntilSaturday = (6 - today.getDay()) % 7
    const nextSaturday = new Date(today)
    nextSaturday.setDate(today.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday))
    nextSaturday.setHours(9, 0, 0, 0) // 9 AM reminder
    return nextSaturday
  }

  const totalPayables = weeklyPayables.reduce((sum, p) => sum + p.amount, 0)
  const paidPayables = weeklyPayables
    .filter((p) => p.status === "paid" || p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingPayables = weeklyPayables.filter((p) => p.status === "pending")
  const completionRate = totalPayables > 0 ? (paidPayables / totalPayables) * 100 : 0

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            Weekly Bills
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleNotifications}
            className={`h-8 w-8 p-0 ${notificationsEnabled ? "text-green-600" : "text-gray-400"}`}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-white/80 p-2 rounded-lg text-center">
            <div className="text-xs text-gray-600">Total</div>
            <div className="font-semibold text-sm text-gray-800">
              {currency}
              {totalPayables.toLocaleString()}
            </div>
          </div>
          <div className="bg-white/80 p-2 rounded-lg text-center">
            <div className="text-xs text-gray-600">Paid</div>
            <div className="font-semibold text-sm text-green-600">
              {currency}
              {paidPayables.toLocaleString()}
            </div>
          </div>
          <div className="bg-white/80 p-2 rounded-lg text-center">
            <div className="text-xs text-gray-600">Pending</div>
            <div className="font-semibold text-sm text-orange-600">{pendingPayables.length}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Completion Rate</span>
            <span className="text-xs font-medium text-gray-800">{completionRate.toFixed(0)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {weeklyPayables.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No weekly bills set up</p>
            <p className="text-xs">Add bills in Settings → Payables</p>
          </div>
        ) : (
          weeklyPayables.map((payable) => (
            <div
              key={payable.id}
              className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${payable.color} bg-opacity-10 border`}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-800">{payable.name}</div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  {currency}
                  {payable.amount.toLocaleString()}
                  <Clock className="w-3 h-3 ml-1" />
                  {payable.dueDay}
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
                    onClick={() => markPayableAsPaid(payable.id)}
                    className="bg-green-600 hover:bg-green-700 h-8 px-3"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Pay
                  </Button>
                ) : (
                  <Badge
                    className={`${
                      payable.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {payable.status === "completed" ? "Done" : "Paid"}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}

        {/* Notification Status */}
        {weeklyPayables.length > 0 && (
          <div className="mt-4 p-2 bg-white/60 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {notificationsEnabled ? (
                <>
                  <Bell className="w-3 h-3 text-green-600" />
                  <span>Saturday reminders enabled</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3 h-3 text-gray-400" />
                  <span>Tap bell icon to enable reminders</span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
