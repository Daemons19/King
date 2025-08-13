"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Plus, Edit, Check, Clock, AlertCircle } from "lucide-react"

interface WeeklyPayablesCardProps {
  weeklyPayables: any[]
  setWeeklyPayables: (payables: any[]) => void
  currency: string
}

export function WeeklyPayablesCard({ weeklyPayables, setWeeklyPayables, currency }: WeeklyPayablesCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPayable, setEditingPayable] = useState<any>(null)
  const [newPayable, setNewPayable] = useState({
    name: "",
    amount: "",
    dueDay: "Monday",
    frequency: "weekly",
  })

  // Get current day for status determination
  const getCurrentDay = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[new Date().getDay()]
  }

  // Determine bill status based on due day
  const getBillStatus = (bill: any) => {
    if (bill.status === "paid") return "paid"

    const currentDay = getCurrentDay()
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const currentDayIndex = dayOrder.indexOf(currentDay)
    const billDayIndex = dayOrder.indexOf(bill.dueDay)

    if (billDayIndex < currentDayIndex) {
      return "overdue"
    } else if (billDayIndex === currentDayIndex) {
      return "due-today"
    } else {
      return "upcoming"
    }
  }

  // Get status badge
  const getStatusBadge = (bill: any) => {
    const status = getBillStatus(bill)

    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        )
      case "due-today":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Due Today
          </Badge>
        )
      case "upcoming":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Due This Week
          </Badge>
        )
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  // Get button color based on status
  const getButtonColor = (bill: any) => {
    const status = getBillStatus(bill)

    switch (status) {
      case "overdue":
        return "bg-red-600 hover:bg-red-700"
      case "due-today":
        return "bg-orange-600 hover:bg-orange-700"
      case "upcoming":
        return "bg-green-600 hover:bg-green-700"
      default:
        return "bg-blue-600 hover:bg-blue-700"
    }
  }

  const handleAddPayable = () => {
    if (!newPayable.name || !newPayable.amount) return

    const payable = {
      id: Date.now(),
      name: newPayable.name,
      amount: Number.parseFloat(newPayable.amount),
      dueDay: newPayable.dueDay,
      status: "pending",
      week: "This Week",
      frequency: newPayable.frequency,
    }

    setWeeklyPayables([...weeklyPayables, payable])
    setNewPayable({ name: "", amount: "", dueDay: "Monday", frequency: "weekly" })
    setShowAddDialog(false)
  }

  const handleEditPayable = (payable: any) => {
    setEditingPayable(payable)
    setNewPayable({
      name: payable.name,
      amount: payable.amount.toString(),
      dueDay: payable.dueDay,
      frequency: payable.frequency || "weekly",
    })
    setShowAddDialog(true)
  }

  const handleUpdatePayable = () => {
    if (!newPayable.name || !newPayable.amount || !editingPayable) return

    const updatedPayables = weeklyPayables.map((payable) =>
      payable.id === editingPayable.id
        ? {
            ...payable,
            name: newPayable.name,
            amount: Number.parseFloat(newPayable.amount),
            dueDay: newPayable.dueDay,
            frequency: newPayable.frequency,
          }
        : payable,
    )

    setWeeklyPayables(updatedPayables)
    setEditingPayable(null)
    setNewPayable({ name: "", amount: "", dueDay: "Monday", frequency: "weekly" })
    setShowAddDialog(false)
  }

  const handlePayBill = (billId: number) => {
    const updatedPayables = weeklyPayables.map((payable) =>
      payable.id === billId ? { ...payable, status: "paid" } : payable,
    )
    setWeeklyPayables(updatedPayables)
  }

  // Real-time calculations
  const totalPending = weeklyPayables
    .filter((payable) => payable.status === "pending")
    .reduce((sum, payable) => sum + (payable.amount || 0), 0)

  const dueTodayCount = weeklyPayables.filter((bill) => getBillStatus(bill) === "due-today").length
  const overdueCount = weeklyPayables.filter((bill) => getBillStatus(bill) === "overdue").length

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Weekly Payables (Real-time)
            </CardTitle>
            <CardDescription>
              Total pending: {currency}
              {totalPending.toLocaleString()}
              {dueTodayCount > 0 && <span className="text-orange-600 ml-2">• {dueTodayCount} due today</span>}
              {overdueCount > 0 && <span className="text-red-600 ml-2">• {overdueCount} overdue</span>}
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPayable ? "Edit Payable" : "Add New Payable"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payable-name">Name</Label>
                  <Input
                    id="payable-name"
                    value={newPayable.name}
                    onChange={(e) => setNewPayable({ ...newPayable, name: e.target.value })}
                    placeholder="e.g., Internet Bill"
                  />
                </div>
                <div>
                  <Label htmlFor="payable-amount">Amount ({currency})</Label>
                  <Input
                    id="payable-amount"
                    type="number"
                    value={newPayable.amount}
                    onChange={(e) => setNewPayable({ ...newPayable, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="payable-day">Due Day</Label>
                  <Select
                    value={newPayable.dueDay}
                    onValueChange={(value) => setNewPayable({ ...newPayable, dueDay: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payable-frequency">Frequency</Label>
                  <Select
                    value={newPayable.frequency}
                    onValueChange={(value) => setNewPayable({ ...newPayable, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="twice-monthly">Twice Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={editingPayable ? handleUpdatePayable : handleAddPayable}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {editingPayable ? "Update Payable" : "Add Payable"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {weeklyPayables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No payables yet</p>
            <p className="text-sm">Add your weekly bills to track them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weeklyPayables.map((payable) => {
              const status = getBillStatus(payable)
              return (
                <div
                  key={payable.id}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    status === "overdue"
                      ? "bg-red-50 border-red-200"
                      : status === "due-today"
                        ? "bg-orange-50 border-orange-200"
                        : status === "paid"
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-800">{payable.name}</h4>
                      {getStatusBadge(payable)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {currency}
                      {(payable.amount || 0).toLocaleString()} • {payable.dueDay}
                    </p>
                    {payable.frequency && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {payable.frequency}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPayable(payable)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {payable.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handlePayBill(payable.id)}
                        className={`text-white ${getButtonColor(payable)}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Pay
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
