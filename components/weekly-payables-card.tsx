"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Calendar } from "lucide-react"

interface WeeklyPayablesCardProps {
  weeklyPayables: Array<{
    id: number
    name: string
    amount: number
    dueDay: string
    status: string
    week: string
  }>
  setWeeklyPayables: (payables: any[]) => void
  currency: string
}

export function WeeklyPayablesCard({ weeklyPayables, setWeeklyPayables, currency }: WeeklyPayablesCardProps) {
  const markAsPaid = (id: number) => {
    const updated = weeklyPayables.map((payable) => (payable.id === id ? { ...payable, status: "paid" } : payable))
    setWeeklyPayables(updated)
  }

  const thisWeekPayables = weeklyPayables.filter((p) => p.week === "This Week")
  const nextWeekPayables = weeklyPayables.filter((p) => p.week === "Next Week")

  const thisWeekTotal = thisWeekPayables.reduce((sum, p) => sum + (p.status === "pending" ? p.amount : 0), 0)
  const nextWeekTotal = nextWeekPayables.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-orange-200" />
              <span className="text-xs text-orange-200">This Week</span>
            </div>
            <div className="text-xl font-bold">
              {currency}
              {thisWeekTotal.toLocaleString()}
            </div>
            <div className="text-xs text-orange-200">Pending</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-purple-200" />
              <span className="text-xs text-purple-200">Next Week</span>
            </div>
            <div className="text-xl font-bold">
              {currency}
              {nextWeekTotal.toLocaleString()}
            </div>
            <div className="text-xs text-purple-200">Upcoming</div>
          </CardContent>
        </Card>
      </div>

      {/* This Week's Bills */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            This Week's Bills
          </CardTitle>
          <CardDescription>Bills due this week</CardDescription>
        </CardHeader>
        <CardContent>
          {thisWeekPayables.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No bills due this week.</p>
              <p className="text-sm">Add bills in Settings to track your payables.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {thisWeekPayables.map((payable) => (
                <div
                  key={payable.id}
                  className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {payable.status === "paid" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-800">{payable.name}</h3>
                      <p className="text-sm text-gray-600">{payable.dueDay}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      {currency}
                      {payable.amount.toLocaleString()}
                    </p>
                    {payable.status === "pending" ? (
                      <Button
                        size="sm"
                        onClick={() => markAsPaid(payable.id)}
                        className="bg-green-600 hover:bg-green-700 text-xs mt-1"
                      >
                        Pay
                      </Button>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 text-xs">Paid</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Week's Bills */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Next Week's Bills
          </CardTitle>
          <CardDescription>Upcoming bills to prepare for</CardDescription>
        </CardHeader>
        <CardContent>
          {nextWeekPayables.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No bills due next week.</p>
              <p className="text-sm">You're all set for next week!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nextWeekPayables.map((payable) => (
                <div
                  key={payable.id}
                  className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="font-medium text-gray-800">{payable.name}</h3>
                      <p className="text-sm text-gray-600">{payable.dueDay}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      {currency}
                      {payable.amount.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {payable.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
