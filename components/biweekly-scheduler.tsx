"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, DollarSign } from "lucide-react"
import { formatWeekDisplay, getCurrentBiweeklySchedule } from "./week-calculator"

interface BiweeklySchedulerProps {
  currency: string
}

export function BiweeklyScheduler({ currency }: BiweeklySchedulerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "next">("current")

  // Get current biweekly schedule
  const currentSchedule = getCurrentBiweeklySchedule()
  const nextSchedule = {
    ...currentSchedule,
    weekNumber: currentSchedule.weekNumber + 1,
    display: formatWeekDisplay(currentSchedule.weekNumber + 1, currentSchedule.year),
  }

  // Sample biweekly payables
  const biweeklyPayables = [
    {
      id: 1,
      name: "Rent",
      amount: 8000,
      schedule: "1st & 15th",
      nextDue: "2024-01-15",
      status: "pending",
    },
    {
      id: 2,
      name: "Car Payment",
      amount: 12000,
      schedule: "Every 2 weeks",
      nextDue: "2024-01-20",
      status: "pending",
    },
    {
      id: 3,
      name: "Insurance",
      amount: 2500,
      schedule: "Biweekly",
      nextDue: "2024-01-25",
      status: "paid",
    },
  ]

  const totalBiweeklyAmount = biweeklyPayables.reduce((sum, payable) => sum + payable.amount, 0)
  const pendingAmount = biweeklyPayables
    .filter((p) => p.status === "pending")
    .reduce((sum, payable) => sum + payable.amount, 0)

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Biweekly Payment Schedule
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant={currentSchedule.isEvenWeek ? "default" : "outline"}>{currentSchedule.display}</Badge>
          <Badge variant="outline">{currentSchedule.isEvenWeek ? "Payment Week" : "Off Week"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Period Selector */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={selectedPeriod === "current" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("current")}
          >
            Current Period
          </Button>
          <Button
            variant={selectedPeriod === "next" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("next")}
          >
            Next Period
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-600 font-medium text-sm">Total Biweekly</p>
            <p className="text-xl font-bold text-blue-700">
              {currency}
              {totalBiweeklyAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-orange-600 font-medium text-sm">Pending</p>
            <p className="text-xl font-bold text-orange-700">
              {currency}
              {pendingAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Biweekly Payables */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">
            {selectedPeriod === "current" ? "Current" : "Next"} Biweekly Payments
          </h4>

          {biweeklyPayables.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No biweekly payments scheduled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {biweeklyPayables.map((payable) => (
                <div
                  key={payable.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800">{payable.name}</p>
                      <p className="text-xs text-gray-600">
                        {payable.schedule} • Next: {payable.nextDue}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">
                      {currency}
                      {payable.amount.toLocaleString()}
                    </span>
                    <Badge
                      variant={payable.status === "paid" ? "default" : "outline"}
                      className={
                        payable.status === "paid" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                      }
                    >
                      {payable.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* King Ops Week Info */}
        <div className="mt-6 p-3 bg-purple-50 rounded-lg">
          <h5 className="font-medium text-purple-800 mb-2">King Ops Week System</h5>
          <div className="text-sm text-purple-700 space-y-1">
            <p>• Current Week: {currentSchedule.display}</p>
            <p>• Payment Weeks: Even numbered weeks</p>
            <p>• Off Weeks: Odd numbered weeks</p>
            <p>• Next Payment Week: {nextSchedule.display}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
            Schedule Payment
          </Button>
          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
            View Calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
