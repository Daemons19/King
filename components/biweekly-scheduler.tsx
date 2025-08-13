"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Plus, Trash2, Clock, AlertCircle, Check } from "lucide-react"
import { WeekCalculator, formatWeekDisplay, getCurrentBiweeklySchedule } from "./week-calculator"

interface BiweeklyPayable {
  id: number
  name: string
  amount: number
  frequency: "biweekly" | "monthly"
  dueDate?: string // For monthly payables
  period?: "first" | "second" // For biweekly payables
  assignedWeek: number
  status: "pending" | "paid" | "overdue"
  paidCount: number
  maxPayments: number // 2 for biweekly, 1 for monthly
}

interface BiweeklySchedulerProps {
  currency: string
}

export function BiweeklyScheduler({ currency }: BiweeklySchedulerProps) {
  const [payables, setPayables] = useState<BiweeklyPayable[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPayable, setEditingPayable] = useState<BiweeklyPayable | null>(null)

  const [newPayable, setNewPayable] = useState({
    name: "",
    amount: "",
    frequency: "biweekly" as "biweekly" | "monthly",
    dueDate: "",
    period: "first" as "first" | "second",
  })

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const monthName = currentDate.toLocaleString("default", { month: "long" })

  const weeks = WeekCalculator.getMonthWeeks(currentYear, currentMonth)
  const biweeklyPeriods = getCurrentBiweeklySchedule()
  const currentWeek = WeekCalculator.getCurrentWeekInfo()

  // Load payables from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("biweeklyPayables")
    if (saved) {
      try {
        setPayables(JSON.parse(saved))
      } catch {
        setPayables([])
      }
    }
  }, [])

  // Save payables to localStorage
  useEffect(() => {
    localStorage.setItem("biweeklyPayables", JSON.stringify(payables))
  }, [payables])

  // Auto-assign week based on frequency and rules
  const assignWeek = (frequency: "biweekly" | "monthly", period?: "first" | "second", dueDate?: string): number => {
    if (frequency === "monthly" && dueDate) {
      return WeekCalculator.assignWeekForMonthlyPayable(dueDate, currentYear, currentMonth)
    }

    if (frequency === "biweekly" && period) {
      const periodInfo = biweeklyPeriods.find((p) => p.period === period)
      return periodInfo?.dueWeek || 1
    }

    return 1
  }

  // Add new payable
  const handleAddPayable = () => {
    if (!newPayable.name || !newPayable.amount) return

    const assignedWeek = assignWeek(newPayable.frequency, newPayable.period, newPayable.dueDate)

    const payable: BiweeklyPayable = {
      id: Date.now(),
      name: newPayable.name,
      amount: Number.parseFloat(newPayable.amount),
      frequency: newPayable.frequency,
      dueDate: newPayable.frequency === "monthly" ? newPayable.dueDate : undefined,
      period: newPayable.frequency === "biweekly" ? newPayable.period : undefined,
      assignedWeek,
      status: "pending",
      paidCount: 0,
      maxPayments: newPayable.frequency === "biweekly" ? 2 : 1,
    }

    setPayables([...payables, payable])
    setNewPayable({
      name: "",
      amount: "",
      frequency: "biweekly",
      dueDate: "",
      period: "first",
    })
    setShowAddDialog(false)
  }

  // Mark payable as paid
  const markAsPaid = (id: number) => {
    setPayables(
      payables.map((payable) => {
        if (payable.id === id) {
          const newPaidCount = payable.paidCount + 1
          let newStatus: "pending" | "paid" | "overdue" = "paid"
          let newAssignedWeek = payable.assignedWeek

          // For biweekly payments, move to next period after first payment
          if (payable.frequency === "biweekly" && newPaidCount === 1) {
            const nextPeriod = payable.period === "first" ? "second" : "first"
            const nextPeriodInfo = biweeklyPeriods.find((p) => p.period === nextPeriod)
            newAssignedWeek = nextPeriodInfo?.dueWeek || payable.assignedWeek
            newStatus = "pending" // Still has one more payment
          }

          // Check if all payments completed
          if (newPaidCount >= payable.maxPayments) {
            newStatus = "paid"
          }

          return {
            ...payable,
            paidCount: newPaidCount,
            status: newStatus,
            assignedWeek: newAssignedWeek,
          }
        }
        return payable
      }),
    )
  }

  // Move unpaid bills to fallback week
  const moveToFallbackWeek = (id: number) => {
    setPayables(
      payables.map((payable) => {
        if (payable.id === id) {
          const currentPeriod =
            payable.frequency === "biweekly"
              ? biweeklyPeriods.find((p) => p.period === payable.period)
              : biweeklyPeriods.find((p) => p.weekNumbers.includes(payable.assignedWeek))

          const fallbackWeek = currentPeriod?.fallbackWeek || payable.assignedWeek + 1

          return {
            ...payable,
            assignedWeek: fallbackWeek,
            status: "overdue" as const,
          }
        }
        return payable
      }),
    )
  }

  // Delete payable
  const deletePayable = (id: number) => {
    setPayables(payables.filter((p) => p.id !== id))
  }

  // Get payables for a specific week
  const getPayablesForWeek = (weekNumber: number) => {
    return payables.filter((p) => p.assignedWeek === weekNumber)
  }

  // Get status badge
  const getStatusBadge = (payable: BiweeklyPayable) => {
    const progress = `${payable.paidCount}/${payable.maxPayments}`

    if (payable.status === "paid" && payable.paidCount >= payable.maxPayments) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      )
    }

    if (payable.status === "paid" && payable.paidCount < payable.maxPayments) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          Partial ({progress})
        </Badge>
      )
    }

    if (payable.status === "overdue") {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue ({progress})
        </Badge>
      )
    }

    return (
      <Badge className="bg-orange-100 text-orange-800">
        <Clock className="w-3 h-3 mr-1" />
        Due ({progress})
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-white/90 border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Biweekly Schedule - {monthName} {currentYear}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">King Ops Week System: Monday-Saturday (Sunday excluded)</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Biweekly/Monthly Bill</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Bill Name</Label>
                    <Input
                      value={newPayable.name}
                      onChange={(e) => setNewPayable({ ...newPayable, name: e.target.value })}
                      placeholder="e.g., Rent, Utilities"
                    />
                  </div>
                  <div>
                    <Label>Amount ({currency})</Label>
                    <Input
                      type="number"
                      value={newPayable.amount}
                      onChange={(e) => setNewPayable({ ...newPayable, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={newPayable.frequency}
                      onValueChange={(value: "biweekly" | "monthly") =>
                        setNewPayable({ ...newPayable, frequency: value, dueDate: "", period: "first" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="biweekly">Biweekly (2 payments/month)</SelectItem>
                        <SelectItem value="monthly">Monthly (1 payment/month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newPayable.frequency === "biweekly" && (
                    <div>
                      <Label>Payment Period</Label>
                      <Select
                        value={newPayable.period}
                        onValueChange={(value: "first" | "second") => setNewPayable({ ...newPayable, period: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first">First Half (Days 1-15)</SelectItem>
                          <SelectItem value="second">Second Half (Days 16-End)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newPayable.frequency === "monthly" && (
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newPayable.dueDate}
                        onChange={(e) => setNewPayable({ ...newPayable, dueDate: e.target.value })}
                        min={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`}
                        max={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-31`}
                      />
                    </div>
                  )}

                  <Button onClick={handleAddPayable} className="w-full bg-purple-600">
                    Add Bill
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Biweekly Periods Overview */}
      <div className="grid grid-cols-2 gap-3">
        {biweeklyPeriods.map((period) => (
          <Card key={period.period} className="bg-white/90 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-800">
                {period.period === "first" ? "First Half" : "Second Half"}
              </CardTitle>
              <p className="text-xs text-gray-600">Days {period.dateRange}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Primary: Week {period.dueWeek}</p>
                {period.fallbackWeek && <p className="text-xs text-gray-500">Fallback: Week {period.fallbackWeek}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Breakdown */}
      <div className="space-y-3">
        {weeks.map((week) => {
          const weekPayables = getPayablesForWeek(week.weekNumber)
          const totalAmount = weekPayables.reduce((sum, p) => sum + p.amount, 0)

          return (
            <Card
              key={week.weekNumber}
              className={`border-0 ${
                week.isCurrentWeek
                  ? "bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300"
                  : "bg-white/90"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-sm text-gray-800">
                      {formatWeekDisplay(week)}
                      {week.isCurrentWeek && <span className="text-purple-600 ml-2">(Current)</span>}
                    </CardTitle>
                    <p className="text-xs text-gray-600">
                      {week.startDate.toLocaleDateString()} - {week.endDate.toLocaleDateString()}
                    </p>
                  </div>
                  {totalAmount > 0 && (
                    <Badge variant="outline">
                      {currency}
                      {totalAmount.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {weekPayables.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {weekPayables.map((payable) => (
                      <div key={payable.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{payable.name}</span>
                            {getStatusBadge(payable)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {currency}
                            {payable.amount.toLocaleString()} • {payable.frequency}
                            {payable.dueDate && ` • Due: ${new Date(payable.dueDate).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {payable.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => markAsPaid(payable.id)}
                                className="bg-green-600 hover:bg-green-700 h-8 px-3"
                              >
                                Pay
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveToFallbackWeek(payable.id)}
                                className="h-8 px-3"
                              >
                                Move
                              </Button>
                            </>
                          )}
                          {payable.status === "overdue" && (
                            <Button
                              size="sm"
                              onClick={() => markAsPaid(payable.id)}
                              className="bg-red-600 hover:bg-red-700 h-8 px-3"
                            >
                              Pay Now
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePayable(payable.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {weekPayables.length === 0 && (
                <CardContent>
                  <p className="text-center text-gray-500 text-sm py-2">No bills scheduled</p>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
