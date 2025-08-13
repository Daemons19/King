"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, AlertTriangle, Copy, Calendar, Edit2, Check, X } from "lucide-react"

// Helper functions
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

const getWeeksInMonth = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const weeks = []
  let currentWeek = 1
  const weekStart = new Date(firstDay)

  const dayOfWeek = weekStart.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  weekStart.setDate(weekStart.getDate() - daysToMonday)

  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    if (
      weekStart.getMonth() === month ||
      weekEnd.getMonth() === month ||
      (weekStart.getMonth() < month && weekEnd.getMonth() > month)
    ) {
      weeks.push({
        label: `Week ${currentWeek}`,
        value: `Week ${currentWeek}`,
        start: new Date(weekStart),
        end: new Date(weekEnd),
        dateRange: `${weekStart.getDate()}-${weekEnd.getDate()}`,
      })
      currentWeek++
    }

    weekStart.setDate(weekStart.getDate() + 7)
  }

  return weeks
}

const getWeekForDate = (date: string, year: number, month: number) => {
  const targetDate = new Date(date)
  const weeks = getWeeksInMonth(year, month)

  for (const week of weeks) {
    if (targetDate >= week.start && targetDate <= week.end) {
      return week.value
    }
  }

  return "Week 1"
}

const getDayNameFromDate = (date: string) => {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const targetDate = new Date(date)
  return dayNames[targetDate.getDay()]
}

const getCurrentMonthInfo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthName = now.toLocaleString("default", { month: "long" })
  const weeks = getWeeksInMonth(year, month)

  return { year, month, monthName, weeks }
}

// Auto color assignment for payables
const getAutoColor = (index: number) => {
  const colors = [
    "from-blue-500 to-indigo-500",
    "from-green-500 to-emerald-500",
    "from-purple-500 to-violet-500",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-500",
    "from-teal-500 to-cyan-500",
    "from-yellow-500 to-amber-500",
    "from-indigo-500 to-purple-500",
  ]
  return colors[index % colors.length]
}

// Bi-weekly scheduling logic
const getBiWeeklySchedule = (currentWeek: number, totalWeeks: number) => {
  // First payment: Week 1-2 (1st-15th)
  // Second payment: Week 3-4 (16th-end of month)
  // If 5 weeks, second payment can extend to week 5

  if (currentWeek <= 2) {
    return { period: "first", dueWeeks: [1, 2], label: "1st-15th" }
  } else {
    return { period: "second", dueWeeks: totalWeeks === 5 ? [3, 4, 5] : [3, 4], label: "16th-End" }
  }
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboardData: any
  setDashboardData: (data: any) => void
  budgetCategories: any[]
  setBudgetCategories: (categories: any[]) => void
  weeklyPayables: any[]
  setWeeklyPayables: (payables: any[]) => void
  transactions: any[]
  setTransactions: (transactions: any[]) => void
  dailyIncome: any[]
  setDailyIncome: (data: any[]) => void
  currency: string
  clearAllData: () => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  dashboardData,
  setDashboardData,
  budgetCategories,
  setBudgetCategories,
  weeklyPayables,
  setWeeklyPayables,
  dailyIncome,
  setDailyIncome,
  currency,
  clearAllData,
}: SettingsDialogProps) {
  const [newPayable, setNewPayable] = useState({
    name: "",
    amount: "",
    dueDay: "Monday",
    status: "pending",
    week: "This Week",
    frequency: "weekly",
    paidCount: 0,
  })

  const [editingPayable, setEditingPayable] = useState<number | null>(null)
  const [editPayableData, setEditPayableData] = useState<any>({})

  const [monthlyPayables, setMonthlyPayables] = useState<any>({})

  useEffect(() => {
    const saved = localStorage.getItem("monthlyPayables")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Convert old array format to new object format
          const currentMonthInfo = getCurrentMonthInfo()
          const currentMonthKey = `${currentMonthInfo.year}-${currentMonthInfo.month}`
          setMonthlyPayables({ [currentMonthKey]: parsed })
        } else {
          setMonthlyPayables(parsed)
        }
      } catch {
        setMonthlyPayables({})
      }
    }
  }, [])

  const [newMonthlyPayable, setNewMonthlyPayable] = useState({
    name: "",
    amount: "",
    date: "",
    dueDay: "Monday",
    week: "Week 1",
    frequency: "monthly",
    paidCount: 0,
  })

  const [editingMonthlyPayable, setEditingMonthlyPayable] = useState<number | null>(null)
  const [editMonthlyPayableData, setEditMonthlyPayableData] = useState<any>({})

  const handleDateChange = (date: string) => {
    if (date) {
      const detectedWeek = getWeekForDate(date, currentMonthInfo.year, currentMonthInfo.month)
      const detectedDay = getDayNameFromDate(date)

      setNewMonthlyPayable({
        ...newMonthlyPayable,
        date: date,
        week: detectedWeek,
        dueDay: detectedDay,
      })
    } else {
      setNewMonthlyPayable({
        ...newMonthlyPayable,
        date: "",
        week: "Week 1",
        dueDay: "Monday",
      })
    }
  }

  const currentMonthInfo = getCurrentMonthInfo()
  const currentMonthKey = `${currentMonthInfo.year}-${currentMonthInfo.month}`
  const currentMonthPayables = monthlyPayables[currentMonthKey] || []

  const updateDashboardData = (field: string, value: any) => {
    setDashboardData({ ...dashboardData, [field]: value })
  }

  const updateDailyIncome = (index: number, field: string, value: number | boolean) => {
    const updated = [...dailyIncome]
    updated[index] = { ...updated[index], [field]: value }
    setDailyIncome(updated)
  }

  const updateAllDailyGoals = (newGoal: number) => {
    const updated = dailyIncome.map((day) => ({
      ...day,
      goal: day.day === "Sun" ? newGoal * 0.75 : newGoal,
    }))
    setDailyIncome(updated)
  }

  // Weekly payables functions
  const addPayable = () => {
    if (newPayable.name && newPayable.amount) {
      const newId = Date.now()
      const autoColor = getAutoColor(weeklyPayables.length)

      setWeeklyPayables([
        ...weeklyPayables,
        {
          ...newPayable,
          amount: Number.parseFloat(newPayable.amount) || 0,
          id: newId,
          paidCount: 0,
          color: autoColor,
        },
      ])
      setNewPayable({
        name: "",
        amount: "",
        dueDay: "Monday",
        status: "pending",
        week: "This Week",
        frequency: "weekly",
        paidCount: 0,
      })
    }
  }

  const startEditingPayable = (payable: any) => {
    setEditingPayable(payable.id)
    setEditPayableData({ ...payable })
  }

  const saveEditPayable = () => {
    const updated = weeklyPayables.map((p) =>
      p.id === editingPayable ? { ...editPayableData, amount: Number.parseFloat(editPayableData.amount) || 0 } : p,
    )
    setWeeklyPayables(updated)
    setEditingPayable(null)
    setEditPayableData({})
  }

  const cancelEditPayable = () => {
    setEditingPayable(null)
    setEditPayableData({})
  }

  const removePayable = (id: number) => {
    setWeeklyPayables(weeklyPayables.filter((p) => p.id !== id))
  }

  const markPayableAsPaid = (id: number) => {
    const updated = weeklyPayables.map((payable) => {
      if (payable.id === id) {
        const newPaidCount = (payable.paidCount || 0) + 1
        let newStatus = "paid"

        // Smart completion logic with bi-weekly scheduling
        if (payable.frequency === "twice-monthly") {
          const currentWeek = 1 // This would need to be calculated based on current date
          const schedule = getBiWeeklySchedule(currentWeek, currentMonthInfo.weeks.length)

          if (newPaidCount >= 2) {
            newStatus = "completed"
          }
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

  // Monthly payables functions
  const addMonthlyPayable = () => {
    if (newMonthlyPayable.name && newMonthlyPayable.amount && newMonthlyPayable.date) {
      const updated = { ...monthlyPayables }
      if (!updated[currentMonthKey]) {
        updated[currentMonthKey] = []
      }
      const newId = Date.now()
      const autoColor = getAutoColor(updated[currentMonthKey].length)

      updated[currentMonthKey].push({
        ...newMonthlyPayable,
        amount: Number.parseFloat(newMonthlyPayable.amount) || 0,
        id: newId,
        month: currentMonthInfo.monthName,
        year: currentMonthInfo.year,
        paidCount: 0,
        color: autoColor,
      })
      setMonthlyPayables(updated)
      localStorage.setItem("monthlyPayables", JSON.stringify(updated))
      setNewMonthlyPayable({
        name: "",
        amount: "",
        date: "",
        dueDay: "Monday",
        week: "Week 1",
        frequency: "monthly",
        paidCount: 0,
      })
    }
  }

  const startEditingMonthlyPayable = (payable: any) => {
    setEditingMonthlyPayable(payable.id)
    setEditMonthlyPayableData({ ...payable })
  }

  const saveEditMonthlyPayable = () => {
    const updated = { ...monthlyPayables }
    updated[currentMonthKey] = updated[currentMonthKey].map((p: any) =>
      p.id === editingMonthlyPayable
        ? { ...editMonthlyPayableData, amount: Number.parseFloat(editMonthlyPayableData.amount) || 0 }
        : p,
    )
    setMonthlyPayables(updated)
    localStorage.setItem("monthlyPayables", JSON.stringify(updated))
    setEditingMonthlyPayable(null)
    setEditMonthlyPayableData({})
  }

  const cancelEditMonthlyPayable = () => {
    setEditingMonthlyPayable(null)
    setEditMonthlyPayableData({})
  }

  const removeMonthlyPayable = (id: number) => {
    const updated = { ...monthlyPayables }
    updated[currentMonthKey] = updated[currentMonthKey].filter((p: any) => p.id !== id)
    setMonthlyPayables(updated)
    localStorage.setItem("monthlyPayables", JSON.stringify(updated))
  }

  const copyToNextMonth = () => {
    if (currentMonthPayables.length === 0) {
      alert("No monthly payables to copy!")
      return
    }

    const nextMonth = currentMonthInfo.month === 11 ? 0 : currentMonthInfo.month + 1
    const nextYear = currentMonthInfo.month === 11 ? currentMonthInfo.year + 1 : currentMonthInfo.year
    const nextMonthKey = `${nextYear}-${nextMonth}`
    const nextMonthName = new Date(nextYear, nextMonth).toLocaleString("default", { month: "long" })

    const updated = { ...monthlyPayables }
    updated[nextMonthKey] = currentMonthPayables.map((payable: any, index: number) => ({
      ...payable,
      id: Date.now() + Math.random(),
      month: nextMonthName,
      year: nextYear,
      paidCount: 0,
      color: getAutoColor(index),
    }))

    setMonthlyPayables(updated)
    localStorage.setItem("monthlyPayables", JSON.stringify(updated))
    alert(`Copied ${currentMonthPayables.length} payables to ${nextMonthName} ${nextYear}!`)
  }

  const applyMonthlyPayablesToWeekly = () => {
    if (currentMonthPayables.length === 0) {
      alert("No monthly payables to apply!")
      return
    }

    // Replace existing weekly payables with monthly ones
    const newWeeklyPayables = currentMonthPayables.map((payable: any, index: number) => ({
      id: Date.now() + Math.random(),
      name: payable.name,
      amount: payable.amount,
      dueDay: payable.dueDay,
      status: "pending",
      week: "This Week", // Show all monthly payables as "This Week" so they're visible
      frequency: payable.frequency || "monthly",
      paidCount: 0,
      color: getAutoColor(index),
    }))

    setWeeklyPayables(newWeeklyPayables)
    alert(`Applied ${currentMonthPayables.length} monthly payables to weekly view!`)
  }

  const [newCategory, setNewCategory] = useState({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  const [editingCategory, setEditingCategory] = useState<any>(null)

  // Budget Categories
  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.budgeted) return

    const category = {
      id: Date.now(),
      name: newCategory.name,
      budgeted: Number.parseFloat(newCategory.budgeted),
      spent: 0,
      color: newCategory.color,
    }

    setBudgetCategories([...budgetCategories, category])
    setNewCategory({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setNewCategory({
      name: category.name,
      budgeted: category.budgeted.toString(),
      color: category.color,
    })
  }

  const handleUpdateCategory = () => {
    if (!newCategory.name || !newCategory.budgeted || !editingCategory) return

    const updatedCategories = budgetCategories.map((cat) =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: newCategory.name,
            budgeted: Number.parseFloat(newCategory.budgeted),
            color: newCategory.color,
          }
        : cat,
    )

    setBudgetCategories(updatedCategories)
    setEditingCategory(null)
    setNewCategory({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  }

  const handleDeleteCategory = (categoryId: number) => {
    if (window.confirm("Delete this category?")) {
      setBudgetCategories(budgetCategories.filter((cat) => cat.id !== categoryId))
    }
  }

  const colorOptions = [
    { value: "from-red-500 to-pink-500", label: "Red to Pink" },
    { value: "from-blue-500 to-indigo-500", label: "Blue to Indigo" },
    { value: "from-green-500 to-emerald-500", label: "Green to Emerald" },
    { value: "from-purple-500 to-violet-500", label: "Purple to Violet" },
    { value: "from-yellow-500 to-orange-500", label: "Yellow to Orange" },
    { value: "from-teal-500 to-cyan-500", label: "Teal to Cyan" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[85vh] overflow-y-auto bg-gradient-to-br from-white to-purple-50">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Settings
          </DialogTitle>
          <DialogDescription>Manage your budget settings</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-purple-100 p-1 rounded-lg">
            <TabsTrigger value="general" className="data-[state=active]:bg-white rounded-md text-sm px-3 py-2">
              General
            </TabsTrigger>
            <TabsTrigger value="income" className="data-[state=active]:bg-white rounded-md text-sm px-3 py-2">
              Income
            </TabsTrigger>
            <TabsTrigger value="payables" className="data-[state=active]:bg-white rounded-md text-sm px-3 py-2">
              Payables
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-white rounded-md text-sm px-3 py-2">
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="bg-white/90 border-0">
              <CardHeader>
                <CardTitle className="text-gray-800">Basic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={dashboardData.currency}
                      onValueChange={(value) => updateDashboardData("currency", value)}
                    >
                      <SelectTrigger className="bg-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="₱">₱ Peso</SelectItem>
                        <SelectItem value="$">$ Dollar</SelectItem>
                        <SelectItem value="€">€ Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Daily Goal</Label>
                    <Input
                      type="number"
                      value={dashboardData.dailyIncomeGoal || ""}
                      onChange={(e) => {
                        const newGoal = Number.parseFloat(e.target.value) || 0
                        updateDashboardData("dailyIncomeGoal", newGoal)
                        updateAllDailyGoals(newGoal)
                      }}
                      className="bg-white h-10 placeholder:text-gray-400"
                      placeholder="800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Balance</Label>
                  <Input
                    type="number"
                    value={dashboardData.totalBalance || ""}
                    onChange={(e) => updateDashboardData("totalBalance", Number.parseFloat(e.target.value) || 0)}
                    className="bg-white h-10 placeholder:text-gray-400"
                    placeholder="Enter balance"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Simplified Budget Categories */}
            <Card className="bg-white/90 border-0">
              <CardHeader>
                <CardTitle className="text-gray-800">Budget Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {budgetCategories.map((category, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Input
                      value={category.name}
                      onChange={(e) => {
                        const updated = [...budgetCategories]
                        updated[index] = { ...updated[index], name: e.target.value }
                        setBudgetCategories(updated)
                      }}
                      className="bg-white h-8 text-sm placeholder:text-gray-400 flex-1"
                      placeholder="Category"
                    />
                    <Input
                      type="number"
                      value={category.budgeted || ""}
                      onChange={(e) => {
                        const updated = [...budgetCategories]
                        updated[index] = { ...updated[index], budgeted: Number.parseFloat(e.target.value) || 0 }
                        setBudgetCategories(updated)
                      }}
                      className="bg-white h-8 text-sm placeholder:text-gray-400 w-20"
                      placeholder="Budget"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBudgetCategories(budgetCategories.filter((_, i) => i !== index))}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}

                <Button
                  onClick={() =>
                    setBudgetCategories([
                      ...budgetCategories,
                      {
                        name: "",
                        budgeted: 0,
                        spent: 0,
                        color: getAutoColor(budgetCategories.length),
                        id: Date.now(),
                      },
                    ])
                  }
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            {/* Work Days This Week with Checkmarks */}
            <Card className="bg-white/90 border-0">
              <CardHeader>
                <CardTitle className="text-gray-800">Work Days This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {dailyIncome.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-600 mb-1">{day.day}</div>
                      <Checkbox
                        checked={day.isWorkDay}
                        onCheckedChange={(checked) => updateDailyIncome(index, "isWorkDay", checked)}
                        className="mx-auto"
                      />
                      {day.isToday && <div className="text-xs text-purple-600 mt-1">Today</div>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payables" className="space-y-4">
            {/* Weekly Payables */}
            <Card className="bg-white/90 border-0">
              <CardHeader>
                <CardTitle className="text-gray-800">Weekly Bills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weeklyPayables.map((payable) => (
                  <div key={payable.id}>
                    {editingPayable === payable.id ? (
                      <div className="space-y-2 p-3 bg-yellow-50 rounded-lg border">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={editPayableData.name || ""}
                            onChange={(e) => setEditPayableData({ ...editPayableData, name: e.target.value })}
                            className="bg-white h-9 placeholder:text-gray-400"
                            placeholder="Bill name"
                          />
                          <Input
                            type="number"
                            value={editPayableData.amount || ""}
                            onChange={(e) => setEditPayableData({ ...editPayableData, amount: e.target.value })}
                            className="bg-white h-9 placeholder:text-gray-400"
                            placeholder="Amount"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={editPayableData.dueDay || "Monday"}
                            onValueChange={(value) => setEditPayableData({ ...editPayableData, dueDay: value })}
                          >
                            <SelectTrigger className="bg-white h-9">
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
                          <Select
                            value={editPayableData.frequency || "weekly"}
                            onValueChange={(value) => setEditPayableData({ ...editPayableData, frequency: value })}
                          >
                            <SelectTrigger className="bg-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="twice-monthly">Bi-Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={saveEditPayable} size="sm" className="flex-1 bg-green-600">
                            <Check className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={cancelEditPayable}
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${payable.color || getAutoColor(0)} bg-opacity-10 border`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{payable.name}</div>
                          <div className="text-sm text-gray-600">
                            {currency}
                            {payable.amount.toLocaleString()} • {payable.dueDay}
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
                              Pay
                            </Button>
                          ) : (
                            <Badge
                              className={`${
                                payable.status === "completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {payable.status === "completed" ? "Done" : "Paid"}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingPayable(payable)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePayable(payable.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add new payable */}
                <div className="space-y-2 p-3 border-2 border-dashed border-orange-300 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newPayable.name}
                      onChange={(e) => setNewPayable({ ...newPayable, name: e.target.value })}
                      placeholder="Bill name"
                      className="bg-white h-9 placeholder:text-gray-400"
                    />
                    <Input
                      type="number"
                      value={newPayable.amount}
                      onChange={(e) => setNewPayable({ ...newPayable, amount: e.target.value })}
                      placeholder="Amount"
                      className="bg-white h-9 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newPayable.dueDay}
                      onValueChange={(value) => setNewPayable({ ...newPayable, dueDay: value })}
                    >
                      <SelectTrigger className="bg-white h-9">
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
                    <Select
                      value={newPayable.frequency}
                      onValueChange={(value) => setNewPayable({ ...newPayable, frequency: value })}
                    >
                      <SelectTrigger className="bg-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="twice-monthly">Bi-Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addPayable} className="w-full bg-gradient-to-r from-orange-600 to-red-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bill
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Payables */}
            <Card className="bg-white/90 border-0">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Monthly Setup - {currentMonthInfo.monthName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={copyToNextMonth}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    disabled={currentMonthPayables.length === 0}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Next
                  </Button>
                  <Button
                    onClick={applyMonthlyPayablesToWeekly}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    disabled={currentMonthPayables.length === 0}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Apply Weekly
                  </Button>
                </div>

                {/* Current Monthly Payables */}
                <div className="space-y-2">
                  {currentMonthPayables.map((payable: any) => (
                    <div key={payable.id}>
                      {editingMonthlyPayable === payable.id ? (
                        <div className="space-y-2 p-3 bg-yellow-50 rounded-lg border">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={editMonthlyPayableData.name || ""}
                              onChange={(e) =>
                                setEditMonthlyPayableData({ ...editMonthlyPayableData, name: e.target.value })
                              }
                              className="bg-white h-9 placeholder:text-gray-400"
                              placeholder="Name"
                            />
                            <Input
                              type="number"
                              value={editMonthlyPayableData.amount || ""}
                              onChange={(e) =>
                                setEditMonthlyPayableData({ ...editMonthlyPayableData, amount: e.target.value })
                              }
                              className="bg-white h-9 placeholder:text-gray-400"
                              placeholder="Amount"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="date"
                              value={editMonthlyPayableData.date || ""}
                              onChange={(e) => {
                                const newDate = e.target.value
                                const detectedWeek = getWeekForDate(
                                  newDate,
                                  currentMonthInfo.year,
                                  currentMonthInfo.month,
                                )
                                const detectedDay = getDayNameFromDate(newDate)
                                setEditMonthlyPayableData({
                                  ...editMonthlyPayableData,
                                  date: newDate,
                                  week: detectedWeek,
                                  dueDay: detectedDay,
                                })
                              }}
                              className="bg-white h-9"
                            />
                            <Select
                              value={editMonthlyPayableData.frequency || "monthly"}
                              onValueChange={(value) =>
                                setEditMonthlyPayableData({ ...editMonthlyPayableData, frequency: value })
                              }
                            >
                              <SelectTrigger className="bg-white h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="twice-monthly">Bi-Weekly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={saveEditMonthlyPayable} size="sm" className="flex-1 bg-green-600">
                              <Check className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              onClick={cancelEditMonthlyPayable}
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-transparent"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${payable.color || getAutoColor(0)} bg-opacity-10 border`}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{payable.name}</div>
                            <div className="text-sm text-gray-600">
                              {currency}
                              {payable.amount.toLocaleString()} • {payable.dueDay} • {payable.week}
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {payable.frequency === "twice-monthly" ? "Bi-Weekly" : "Monthly"}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingMonthlyPayable(payable)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMonthlyPayable(payable.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {currentMonthPayables.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No monthly payables set</p>
                    </div>
                  )}
                </div>

                {/* Add New Monthly Payable */}
                <div className="space-y-2 p-3 border-2 border-dashed border-blue-300 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newMonthlyPayable.name}
                      onChange={(e) => setNewMonthlyPayable({ ...newMonthlyPayable, name: e.target.value })}
                      placeholder="Bill name"
                      className="bg-white h-9 placeholder:text-gray-400"
                    />
                    <Input
                      type="number"
                      value={newMonthlyPayable.amount}
                      onChange={(e) => setNewMonthlyPayable({ ...newMonthlyPayable, amount: e.target.value })}
                      placeholder="Amount"
                      className="bg-white h-9 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={newMonthlyPayable.date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="bg-white h-9"
                    />
                    <Select
                      value={newMonthlyPayable.frequency}
                      onValueChange={(value) => setNewMonthlyPayable({ ...newMonthlyPayable, frequency: value })}
                    >
                      <SelectTrigger className="bg-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="twice-monthly">Bi-Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Auto-detects: {newMonthlyPayable.dueDay} • {newMonthlyPayable.week}
                  </div>
                  <Button
                    onClick={addMonthlyPayable}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                    disabled={!newMonthlyPayable.name || !newMonthlyPayable.amount || !newMonthlyPayable.date}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Monthly Bill
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card className="bg-white/90 border-0">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Clear Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600 mb-4">This will permanently delete all your data.</p>
                  <Button onClick={clearAllData} variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
