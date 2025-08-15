"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Plus, Edit, Check, Clock, AlertCircle, History, Calendar } from "lucide-react"

interface WeeklyPayable {
  id: number
  name: string
  amount: number
  dueDay: string
  status: "pending" | "paid" | "overdue"
  week: string
  frequency: string
  weekRange?: string
  paidDate?: string
  isFromMonthly?: boolean
  originalMonthlyId?: number
}

interface WeeklyPayablesCardProps {
  weeklyPayables: WeeklyPayable[]
  setWeeklyPayables: (payables: WeeklyPayable[]) => void
  currency: string
}

// Helper functions for date calculations
const getCurrentWeekRange = () => {
  const now = new Date()
  const monday = new Date(now)
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
  monday.setDate(diff)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: monday,
    end: sunday,
    range: `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`,
  }
}

const getWeekRangeForDate = (date: Date) => {
  const monday = new Date(date)
  const dayOfWeek = date.getDay()
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: monday,
    end: sunday,
    range: `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`,
  }
}

const isDateInCurrentWeek = (date: Date) => {
  const currentWeek = getCurrentWeekRange()
  return date >= currentWeek.start && date <= currentWeek.end
}

const getManilaTime = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function WeeklyPayablesCard({ weeklyPayables, setWeeklyPayables, currency }: WeeklyPayablesCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPayable, setEditingPayable] = useState<WeeklyPayable | null>(null)
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("current")

  const [newPayable, setNewPayable] = useState({
    name: "",
    amount: "",
    dueDay: "Saturday", // Changed from "Monday" to "Saturday"
    frequency: "weekly",
    weekRange: "",
  })

  // Load weekly history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("weeklyPayablesHistory")
    if (saved) {
      try {
        setWeeklyHistory(JSON.parse(saved))
      } catch {
        setWeeklyHistory([])
      }
    }
  }, [])

  // Save weekly history to localStorage
  useEffect(() => {
    localStorage.setItem("weeklyPayablesHistory", JSON.stringify(weeklyHistory))
  }, [weeklyHistory])

  // Sync monthly payables to weekly payables
  useEffect(() => {
    const syncMonthlyPayables = () => {
      const monthlyPayables = JSON.parse(localStorage.getItem("monthlyPayables") || "{}")
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const currentMonthKey = `${currentYear}-${currentMonth}`
      const currentMonthPayables = monthlyPayables[currentMonthKey] || []

      // Filter monthly payables that fall within current week
      const currentWeek = getCurrentWeekRange()
      const monthlyPayablesForThisWeek = currentMonthPayables.filter((payable: any) => {
        if (!payable.date) return false
        const payableDate = new Date(payable.date)
        return isDateInCurrentWeek(payableDate)
      })

      // Add monthly payables to weekly payables if not already added
      const existingMonthlyIds = weeklyPayables.filter((p) => p.isFromMonthly).map((p) => p.originalMonthlyId)

      const newMonthlyPayables = monthlyPayablesForThisWeek
        .filter((payable: any) => !existingMonthlyIds.includes(payable.id))
        .map((payable: any) => ({
          id: Date.now() + Math.random(),
          name: `${payable.name} (Monthly)`,
          amount: payable.amount,
          dueDay: payable.dueDay,
          status: "pending" as const,
          week: "This Week",
          frequency: "monthly",
          weekRange: currentWeek.range,
          isFromMonthly: true,
          originalMonthlyId: payable.id,
        }))

      if (newMonthlyPayables.length > 0) {
        setWeeklyPayables([...weeklyPayables, ...newMonthlyPayables])
      }
    }

    syncMonthlyPayables()
  }, []) // Run once on mount

  // Get current day for status determination
  const getCurrentDay = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[new Date().getDay()]
  }

  // Determine bill status based on due day
  const getBillStatus = (bill: WeeklyPayable) => {
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
  const getStatusBadge = (bill: WeeklyPayable) => {
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
  const getButtonColor = (bill: WeeklyPayable) => {
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

    const currentWeek = getCurrentWeekRange()
    const weekRange = newPayable.weekRange || currentWeek.range

    const payable: WeeklyPayable = {
      id: Date.now(),
      name: newPayable.name,
      amount: Number.parseFloat(newPayable.amount),
      dueDay: newPayable.dueDay,
      status: "pending",
      week: "This Week",
      frequency: newPayable.frequency,
      weekRange: weekRange,
    }

    setWeeklyPayables([...weeklyPayables, payable])
    setNewPayable({ name: "", amount: "", dueDay: "Saturday", frequency: "weekly", weekRange: "" }) // Updated reset
    setShowAddDialog(false)
  }

  const handleEditPayable = (payable: WeeklyPayable) => {
    setEditingPayable(payable)
    setNewPayable({
      name: payable.name,
      amount: payable.amount.toString(),
      dueDay: payable.dueDay,
      frequency: payable.frequency || "weekly",
      weekRange: payable.weekRange || "",
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
            weekRange: newPayable.weekRange || payable.weekRange,
          }
        : payable,
    )

    setWeeklyPayables(updatedPayables)
    setEditingPayable(null)
    setNewPayable({ name: "", amount: "", dueDay: "Saturday", frequency: "weekly", weekRange: "" }) // Updated reset
    setShowAddDialog(false)
  }

  const handlePayBill = (billId: number) => {
    const paidDate = getManilaTime()
    const updatedPayables = weeklyPayables.map((payable) =>
      payable.id === billId ? { ...payable, status: "paid" as const, paidDate } : payable,
    )
    setWeeklyPayables(updatedPayables)

    // Add to weekly history
    const paidPayable = weeklyPayables.find((p) => p.id === billId)
    if (paidPayable) {
      const currentWeek = getCurrentWeekRange()
      const existingWeekIndex = weeklyHistory.findIndex((w) => w.weekRange === currentWeek.range)

      if (existingWeekIndex >= 0) {
        const updatedHistory = [...weeklyHistory]
        updatedHistory[existingWeekIndex].payables = updatedHistory[existingWeekIndex].payables.map((p: any) =>
          p.id === billId ? { ...p, status: "paid", paidDate } : p,
        )
        setWeeklyHistory(updatedHistory)
      } else {
        // Create new week entry
        const newWeekEntry = {
          weekRange: currentWeek.range,
          startDate: currentWeek.start.toISOString(),
          endDate: currentWeek.end.toISOString(),
          payables: weeklyPayables.map((p) => ({
            ...p,
            status: p.id === billId ? "paid" : p.status,
            paidDate: p.id === billId ? paidDate : p.paidDate,
          })),
          createdAt: new Date().toISOString(),
        }
        setWeeklyHistory([newWeekEntry, ...weeklyHistory])
      }
    }
  }

  // Schedule notifications for unpaid payables
  useEffect(() => {
    const scheduleNotifications = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return

      const unpaidPayables = weeklyPayables.filter((p) => p.status === "pending")

      unpaidPayables.forEach((payable) => {
        const status = getBillStatus(payable)

        if (status === "overdue") {
          // Send immediate notification for overdue bills
          new Notification(`Overdue Bill: ${payable.name}`, {
            body: `${currency}${payable.amount.toLocaleString()} was due on ${payable.dueDay}`,
            icon: "/placeholder-logo.png",
            tag: `overdue-${payable.id}`,
          })
        } else if (status === "due-today") {
          // Schedule Saturday 8 PM and Sunday 8 PM notifications
          const now = new Date()
          const saturday8PM = new Date(now)
          saturday8PM.setHours(20, 0, 0, 0) // 8 PM

          const sunday8PM = new Date(saturday8PM)
          sunday8PM.setDate(saturday8PM.getDate() + 1)

          // Saturday notification
          if (now.getDay() === 6 && now.getHours() >= 20) {
            // Saturday after 8 PM
            setTimeout(() => {
              new Notification(`Bill Reminder: ${payable.name}`, {
                body: `${currency}${payable.amount.toLocaleString()} is due today (Saturday)`,
                icon: "/placeholder-logo.png",
                tag: `reminder-sat-${payable.id}`,
              })
            }, 1000)
          }

          // Sunday notification
          if (now.getDay() === 0 && now.getHours() >= 20) {
            // Sunday after 8 PM
            setTimeout(() => {
              new Notification(`Final Reminder: ${payable.name}`, {
                body: `${currency}${payable.amount.toLocaleString()} is still unpaid. Due yesterday.`,
                icon: "/placeholder-logo.png",
                tag: `reminder-sun-${payable.id}`,
              })
            }, 1000)
          }
        }
      })
    }

    scheduleNotifications()
  }, [weeklyPayables, currency])

  // Real-time calculations
  const totalPending = weeklyPayables
    .filter((payable) => payable.status === "pending")
    .reduce((sum, payable) => sum + (payable.amount || 0), 0)

  const dueTodayCount = weeklyPayables.filter((bill) => getBillStatus(bill) === "due-today").length
  const overdueCount = weeklyPayables.filter((bill) => getBillStatus(bill) === "overdue").length

  const currentWeekRange = getCurrentWeekRange().range

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Weekly Payables System
            </CardTitle>
            <CardDescription>
              Week: {currentWeekRange} • Total pending: {currency}
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
                  <Label htmlFor="payable-day">Due Day (Default: Saturday)</Label>
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
                      <SelectItem value="Saturday">Saturday (Default)</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payable-week">Week Range (Optional)</Label>
                  <Input
                    id="payable-week"
                    value={newPayable.weekRange}
                    onChange={(e) => setNewPayable({ ...newPayable, weekRange: e.target.value })}
                    placeholder={`Default: ${currentWeekRange}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use current week</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Week</TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-1" />
              History ({weeklyHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            {weeklyPayables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No payables yet</p>
                <p className="text-sm">Add your weekly bills to track them</p>
                <p className="text-xs text-blue-600 mt-2">Monthly payables will auto-sync if due this week</p>
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
                          {payable.isFromMonthly && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                              From Monthly
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {currency}
                          {(payable.amount || 0).toLocaleString()} • {payable.dueDay}
                        </p>
                        {payable.weekRange && <p className="text-xs text-gray-500">Week: {payable.weekRange}</p>}
                        {payable.paidDate && <p className="text-xs text-green-600">Paid: {payable.paidDate}</p>}
                        {payable.frequency && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {payable.frequency}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!payable.isFromMonthly && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPayable(payable)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
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
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {weeklyHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No history yet</p>
                <p className="text-sm">Weekly payables history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weeklyHistory.map((week, index) => {
                  const totalPaid = week.payables.filter((p: any) => p.status === "paid").length
                  const totalUnpaid = week.payables.filter((p: any) => p.status !== "paid").length
                  const totalAmount = week.payables.reduce((sum: number, p: any) => sum + p.amount, 0)

                  return (
                    <Card key={index} className="bg-gray-50 border">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm text-gray-800">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            {week.weekRange}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge className="bg-green-100 text-green-800">{totalPaid} Paid</Badge>
                            {totalUnpaid > 0 && <Badge className="bg-red-100 text-red-800">{totalUnpaid} Unpaid</Badge>}
                          </div>
                        </div>
                        <CardDescription className="text-xs">
                          Total: {currency}
                          {totalAmount.toLocaleString()} • Created: {new Date(week.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {week.payables.map((payable: any, pIndex: number) => (
                            <div key={pIndex} className="flex justify-between items-center text-sm">
                              <div>
                                <span className="font-medium">{payable.name}</span>
                                <span className="text-gray-500 ml-2">
                                  {currency}
                                  {payable.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {payable.status === "paid" ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Paid
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 text-xs">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Unpaid
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
