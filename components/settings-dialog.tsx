"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Edit, Save, X } from "lucide-react"

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
  setDailyIncome: (income: any[]) => void
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
  transactions,
  setTransactions,
  dailyIncome,
  setDailyIncome,
  currency,
  clearAllData,
}: SettingsDialogProps) {
  const [newCategory, setNewCategory] = useState({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [editingGoal, setEditingGoal] = useState<string>("")

  const colorOptions = [
    { name: "Blue", value: "from-blue-500 to-indigo-500" },
    { name: "Green", value: "from-emerald-500 to-teal-500" },
    { name: "Purple", value: "from-purple-500 to-pink-500" },
    { name: "Orange", value: "from-orange-500 to-red-500" },
    { name: "Yellow", value: "from-yellow-500 to-orange-500" },
    { name: "Cyan", value: "from-cyan-500 to-blue-500" },
    { name: "Pink", value: "from-pink-500 to-rose-500" },
    { name: "Lime", value: "from-lime-500 to-green-500" },
  ]

  const handleAddCategory = () => {
    if (newCategory.name && newCategory.budgeted) {
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
  }

  const handleDeleteCategory = (id: number) => {
    setBudgetCategories(budgetCategories.filter((cat) => cat.id !== id))
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category.id)
  }

  const handleSaveCategory = (id: number, updatedData: any) => {
    setBudgetCategories(budgetCategories.map((cat) => (cat.id === id ? { ...cat, ...updatedData } : cat)))
    setEditingCategory(null)
  }

  const handleUpdateDailyGoal = (dayIndex: number, newGoal: number) => {
    const updated = [...dailyIncome]
    updated[dayIndex] = { ...updated[dayIndex], goal: newGoal }
    setDailyIncome(updated)
  }

  const handleToggleWorkDay = (dayIndex: number) => {
    const updated = [...dailyIncome]
    updated[dayIndex] = { ...updated[dayIndex], isWorkDay: !updated[dayIndex].isWorkDay }
    setDailyIncome(updated)
  }

  const handleCurrencyChange = (newCurrency: string) => {
    setDashboardData({ ...dashboardData, currency: newCurrency })
  }

  const handleDefaultGoalChange = (newGoal: string) => {
    const goalValue = Number.parseFloat(newGoal) || 800
    setDashboardData({ ...dashboardData, dailyIncomeGoal: goalValue })
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings & Configuration</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="income">Income Goals</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Currency</Label>
                  <Select value={dashboardData.currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="₱">Philippine Peso (₱)</SelectItem>
                      <SelectItem value="$">US Dollar ($)</SelectItem>
                      <SelectItem value="€">Euro (€)</SelectItem>
                      <SelectItem value="£">British Pound (£)</SelectItem>
                      <SelectItem value="¥">Japanese Yen (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Default Daily Income Goal</Label>
                  <Input
                    type="number"
                    value={dashboardData.dailyIncomeGoal}
                    onChange={(e) => handleDefaultGoalChange(e.target.value)}
                    placeholder="800"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be the default goal for new work days</p>
                </div>

                <div>
                  <Label>Starting Balance</Label>
                  <Input
                    type="number"
                    value={dashboardData.totalBalance}
                    onChange={(e) =>
                      setDashboardData({
                        ...dashboardData,
                        totalBalance: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your initial balance before transactions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add New Category */}
                <div className="grid grid-cols-4 gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
                  <Input
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Budget amount"
                    value={newCategory.budgeted}
                    onChange={(e) => setNewCategory({ ...newCategory, budgeted: e.target.value })}
                  />
                  <Select
                    value={newCategory.color}
                    onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded bg-gradient-to-r ${color.value}`}></div>
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddCategory} className="bg-green-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Existing Categories */}
                <div className="space-y-2">
                  {budgetCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      {editingCategory === category.id ? (
                        <EditCategoryForm
                          category={category}
                          onSave={(updatedData) => handleSaveCategory(category.id, updatedData)}
                          onCancel={() => setEditingCategory(null)}
                          colorOptions={colorOptions}
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded bg-gradient-to-r ${category.color}`}></div>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-gray-600">
                                Budget: {currency}
                                {category.budgeted.toLocaleString()} • Spent: {currency}
                                {category.spent.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Income Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyIncome.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={day.isWorkDay}
                            onChange={() => handleToggleWorkDay(index)}
                            className="rounded"
                          />
                          <span className="font-medium">{day.day}</span>
                          {!day.isWorkDay && <Badge variant="outline">Rest Day</Badge>}
                        </div>
                        <span className="text-sm text-gray-600">{day.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Goal:</span>
                        <Input
                          type="number"
                          value={day.goal}
                          onChange={(e) => handleUpdateDailyGoal(index, Number.parseFloat(e.target.value) || 0)}
                          className="w-24"
                          disabled={!day.isWorkDay}
                        />
                        <span className="text-sm text-gray-600">
                          Earned: {currency}
                          {day.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800">Total Transactions</p>
                    <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800">Budget Categories</p>
                    <p className="text-2xl font-bold text-green-600">{budgetCategories.length}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Data Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const data = {
                          dashboardData,
                          budgetCategories,
                          weeklyPayables,
                          transactions,
                          dailyIncome,
                        }
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `budget-backup-${new Date().toISOString().split("T")[0]}.json`
                        a.click()
                      }}
                    >
                      Export Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = ".json"
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              try {
                                const data = JSON.parse(e.target?.result as string)
                                if (data.dashboardData) setDashboardData(data.dashboardData)
                                if (data.budgetCategories) setBudgetCategories(data.budgetCategories)
                                if (data.weeklyPayables) setWeeklyPayables(data.weeklyPayables)
                                if (data.transactions) setTransactions(data.transactions)
                                if (data.dailyIncome) setDailyIncome(data.dailyIncome)
                                alert("Data imported successfully!")
                              } catch (error) {
                                alert("Error importing data. Please check the file format.")
                              }
                            }
                            reader.readAsText(file)
                          }
                        }
                        input.click()
                      }}
                    >
                      Import Data
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-red-800 mb-2">Danger Zone</h4>
                  <Button variant="destructive" onClick={clearAllData} className="w-full">
                    Clear All Data
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    This will permanently delete all your data. This action cannot be undone.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function EditCategoryForm({
  category,
  onSave,
  onCancel,
  colorOptions,
}: {
  category: any
  onSave: (data: any) => void
  onCancel: () => void
  colorOptions: any[]
}) {
  const [name, setName] = useState(category.name)
  const [budgeted, setBudgeted] = useState(category.budgeted.toString())
  const [color, setColor] = useState(category.color)

  const handleSave = () => {
    onSave({
      name,
      budgeted: Number.parseFloat(budgeted) || 0,
      color,
    })
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="flex-1" />
      <Input
        type="number"
        value={budgeted}
        onChange={(e) => setBudgeted(e.target.value)}
        placeholder="Budget"
        className="w-24"
      />
      <Select value={color} onValueChange={setColor}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {colorOptions.map((colorOption) => (
            <SelectItem key={colorOption.value} value={colorOption.value}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded bg-gradient-to-r ${colorOption.value}`}></div>
                {colorOption.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleSave} className="bg-green-600">
        <Save className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={onCancel}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
