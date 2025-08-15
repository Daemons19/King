"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Bell, BellOff, Calendar, CheckCircle, Clock, CreditCard, DollarSign } from "lucide-react"

interface WeeklyPayablesCardProps {
  weeklyPayables: any[]
  setWeeklyPayables: (payables: any[]) => void
  currency: string
}

export function WeeklyPayablesCard({ weeklyPayables, setWeeklyPayables, currency }: WeeklyPayablesCardProps) {
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

  const markAsPaid = (id: number) => {
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

  const pendingPayables = weeklyPayables.filter((p) => p.status === "pending")
  const totalPending = pendingPayables.reduce((sum, p) => sum + p.amount, 0)
  const totalPayables = weeklyPayables.reduce((sum, p) => sum + p.amount, 0)
  const completionRate = totalPayables > 0 ? ((totalPayables - totalPending) / totalPayables) * 100 : 0

  // Group payables by day for Saturday focus
  const saturdayPayables = weeklyPayables.filter((p) => p.dueDay === "Saturday")
  const otherPayables = weeklyPayables.filter((p) => p.dueDay !== "Saturday")

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
            {saturdayPayables.length > 0 && (
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
        {weeklyPayables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No weekly bills set up yet.</p>
            <p className="text-sm">Add bills in Settings to track your payments.</p>
          </div>
        )}

        {/* Notification Status */}
        {weeklyPayables.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <span>{notificationsEnabled ? "Notifications enabled" : "Notifications disabled"}</span>
            <span>Saturday is default day</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
