"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, AlertCircle, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WeeklyPayable {
  id: number
  name: string
  amount: number
  dueDay: string
  status: "pending" | "paid" | "overdue"
  week: string
}

interface WeeklyPayablesCardProps {
  weeklyPayables: WeeklyPayable[]
  setWeeklyPayables: (payables: WeeklyPayable[]) => void
  currency: string
}

export function WeeklyPayablesCard({ weeklyPayables, setWeeklyPayables, currency }: WeeklyPayablesCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newPayable, setNewPayable] = useState({
    name: "",
    amount: "",
    dueDay: "",
    week: "This Week",
  })

  // Get current day to determine status
  const getCurrentDay = () => {
    return new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Manila",
      weekday: "long",
    })
  }

  const currentDay = getCurrentDay()
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const currentDayIndex = dayOrder.indexOf(currentDay)

  // Update payable status based on current day
  const getPayableStatus = (payable: WeeklyPayable) => {
    if (payable.status === "paid") return "paid"

    const dueDayIndex = dayOrder.indexOf(payable.dueDay)
    if (payable.week === "This Week") {
      if (dueDayIndex < currentDayIndex) return "overdue"
      if (dueDayIndex === currentDayIndex) return "pending" // Due today
      return "pending"
    }
    return "pending"
  }

  // Calculate totals
  const thisWeekPayables = weeklyPayables.filter((p) => p.week === "This Week")
  const nextWeekPayables = weeklyPayables.filter((p) => p.week === "Next Week")

  const totalThisWeek = thisWeekPayables.reduce((sum, p) => sum + p.amount, 0)
  const paidThisWeek = thisWeekPayables.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
  const pendingThisWeek = thisWeekPayables.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const overdueThisWeek = thisWeekPayables
    .filter((p) => getPayableStatus(p) === "overdue")
    .reduce((sum, p) => sum + p.amount, 0)

  const progressPercentage = totalThisWeek > 0 ? (paidThisWeek / totalThisWeek) * 100 : 0

  const handleAddPayable = () => {
    if (newPayable.name && newPayable.amount && newPayable.dueDay) {
      const payable: WeeklyPayable = {
        id: Date.now(),
        name: newPayable.name,
        amount: Number.parseFloat(newPayable.amount),
        dueDay: newPayable.dueDay,
        status: "pending",
        week: newPayable.week,
      }
      setWeeklyPayables([...weeklyPayables, payable])
      setNewPayable({ name: "", amount: "", dueDay: "", week: "This Week" })
      setShowAddDialog(false)
    }
  }

  const togglePayableStatus = (id: number) => {
    setWeeklyPayables(
      weeklyPayables.map((payable) =>
        payable.id === id ? { ...payable, status: payable.status === "paid" ? "pending" : "paid" } : payable,
      ),
    )
  }

  const deletePayable = (id: number) => {
    setWeeklyPayables(weeklyPayables.filter((p) => p.id !== id))
  }

  const getStatusIcon = (payable: WeeklyPayable) => {
    const status = getPayableStatus(payable)
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (payable: WeeklyPayable) => {
    const status = getPayableStatus(payable)
    const colors = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={colors[status]}>
        {status === "overdue" ? "Overdue" : status === "paid" ? "Paid" : "Pending"}
      </Badge>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-gray-800">Weekly Payables</CardTitle>
            <CardDescription>
              {currency}
              {paidThisWeek.toLocaleString()} of {currency}
              {totalThisWeek.toLocaleString()} paid this week
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Payable</DialogTitle>
                <DialogDescription>Add a new bill or expense to track</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newPayable.name}
                    onChange={(e) => setNewPayable({ ...newPayable, name: e.target.value })}
                    placeholder="e.g., Electricity Bill"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newPayable.amount}
                    onChange={(e) => setNewPayable({ ...newPayable, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDay">Due Day</Label>
                  <Select
                    value={newPayable.dueDay}
                    onValueChange={(value) => setNewPayable({ ...newPayable, dueDay: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOrder.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="week">Week</Label>
                  <Select
                    value={newPayable.week}
                    onValueChange={(value) => setNewPayable({ ...newPayable, week: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="This Week">This Week</SelectItem>
                      <SelectItem value="Next Week">Next Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddPayable} className="w-full">
                  Add Payable
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>This Week Progress</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Paid</p>
            <p className="text-sm font-bold text-green-700">
              {currency}
              {paidThisWeek.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-600 font-medium">Pending</p>
            <p className="text-sm font-bold text-yellow-700">
              {currency}
              {pendingThisWeek.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 font-medium">Overdue</p>
            <p className="text-sm font-bold text-red-700">
              {currency}
              {overdueThisWeek.toLocaleString()}
            </p>
          </div>
        </div>

        {/* This Week Payables */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">This Week ({currentDay})</h4>
          {thisWeekPayables.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No payables for this week</p>
          ) : (
            <div className="space-y-2">
              {thisWeekPayables.map((payable) => (
                <div key={payable.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payable)}
                    <div>
                      <p className="font-medium text-gray-800">{payable.name}</p>
                      <p className="text-xs text-gray-600">Due {payable.dueDay}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">
                      {currency}
                      {payable.amount.toLocaleString()}
                    </span>
                    {getStatusBadge(payable)}
                    <Button
                      size="sm"
                      variant={payable.status === "paid" ? "outline" : "default"}
                      onClick={() => togglePayableStatus(payable.id)}
                      className="ml-2"
                    >
                      {payable.status === "paid" ? "Unpay" : "Pay"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next Week Preview */}
          {nextWeekPayables.length > 0 && (
            <>
              <h4 className="font-medium text-gray-800 mt-6">Next Week</h4>
              <div className="space-y-2">
                {nextWeekPayables.map((payable) => (
                  <div
                    key={payable.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-800">{payable.name}</p>
                        <p className="text-xs text-gray-600">Due {payable.dueDay}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">
                        {currency}
                        {payable.amount.toLocaleString()}
                      </span>
                      <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
