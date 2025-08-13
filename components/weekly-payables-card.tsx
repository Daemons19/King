"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Check, Clock, AlertCircle } from "lucide-react"

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
    dueDay: "Monday",
    week: "This Week",
  })

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const weeks = ["This Week", "Next Week"]

  // Calculate totals
  const totalPayables = weeklyPayables.reduce((sum, payable) => sum + payable.amount, 0)
  const pendingPayables = weeklyPayables.filter((p) => p.status === "pending")
  const totalPending = pendingPayables.reduce((sum, payable) => sum + payable.amount, 0)
  const paidPayables = weeklyPayables.filter((p) => p.status === "paid")
  const totalPaid = paidPayables.reduce((sum, payable) => sum + payable.amount, 0)

  // Add new payable
  const handleAddPayable = () => {
    if (!newPayable.name || !newPayable.amount) return

    const payable: WeeklyPayable = {
      id: Date.now(),
      name: newPayable.name,
      amount: Number.parseFloat(newPayable.amount),
      dueDay: newPayable.dueDay,
      status: "pending",
      week: newPayable.week,
    }

    setWeeklyPayables([...weeklyPayables, payable])
    setNewPayable({
      name: "",
      amount: "",
      dueDay: "Monday",
      week: "This Week",
    })
    setShowAddDialog(false)
  }

  // Mark payable as paid
  const markAsPaid = (id: number) => {
    setWeeklyPayables(weeklyPayables.map((payable) => (payable.id === id ? { ...payable, status: "paid" } : payable)))
  }

  // Mark payable as overdue
  const markAsOverdue = (id: number) => {
    setWeeklyPayables(
      weeklyPayables.map((payable) => (payable.id === id ? { ...payable, status: "overdue" } : payable)),
    )
  }

  // Delete payable
  const deletePayable = (id: number) => {
    setWeeklyPayables(weeklyPayables.filter((p) => p.id !== id))
  }

  // Get status badge
  const getStatusBadge = (status: WeeklyPayable["status"]) => {
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
      default:
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  // Group payables by week
  const groupedPayables = weeklyPayables.reduce(
    (groups, payable) => {
      if (!groups[payable.week]) {
        groups[payable.week] = []
      }
      groups[payable.week].push(payable)
      return groups
    },
    {} as Record<string, WeeklyPayable[]>,
  )

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-gray-800">Weekly Bills & Payables</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Weekly Bill</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Bill Name</Label>
                    <Input
                      value={newPayable.name}
                      onChange={(e) => setNewPayable({ ...newPayable, name: e.target.value })}
                      placeholder="e.g., Groceries, Gas"
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
                    <Label>Due Day</Label>
                    <Select
                      value={newPayable.dueDay}
                      onValueChange={(value) => setNewPayable({ ...newPayable, dueDay: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Week</Label>
                    <Select
                      value={newPayable.week}
                      onValueChange={(value) => setNewPayable({ ...newPayable, week: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weeks.map((week) => (
                          <SelectItem key={week} value={week}>
                            {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddPayable} className="w-full bg-purple-600">
                    Add Bill
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {currency}
                {totalPayables.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Bills</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {currency}
                {totalPending.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {currency}
                {totalPaid.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills by Week */}
      {Object.keys(groupedPayables).length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0">
          <CardContent className="text-center py-8 text-gray-500">
            <p>No bills scheduled yet.</p>
            <p className="text-sm">Add your weekly bills to track payments.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedPayables).map(([week, payables]) => (
          <Card key={week} className="bg-white/80 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">{week}</CardTitle>
              <div className="text-sm text-gray-600">
                {payables.length} bills • {currency}
                {payables.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} total
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payables.map((payable) => (
                  <div key={payable.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{payable.name}</span>
                        {getStatusBadge(payable.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {currency}
                        {payable.amount.toLocaleString()} • Due {payable.dueDay}
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
                            onClick={() => markAsOverdue(payable.id)}
                            className="h-8 px-3"
                          >
                            Overdue
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
          </Card>
        ))
      )}
    </div>
  )
}
