"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  DollarSign,
  Target,
  Calendar,
  Database,
  Trash2,
  Plus,
  Edit,
  Save,
  X,
  AlertTriangle,
} from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Safe localStorage access
const safeLocalStorage = {
  getItem: (key: string) => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  },
}

// Safe number formatting function
const safeToFixed = (value: any, decimals = 2): string => {
  const num = Number(value)
  return isNaN(num) ? "0.00" : num.toFixed(decimals)
}

// Safe number conversion
const safeNumber = (value: any): number => {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

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

// Helper function to get previous weeks
const getPreviousWeeks = (weeksBack = 8) => {
  const weeks = []
  const today = new Date()

  for (let i = 1; i <= weeksBack; i++) {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) - i * 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    weeks.push({
      weekNumber: i,
      startDate: weekStart,
      endDate: weekEnd,
      range: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
      key: `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)}`,
    })
  }

  return weeks
}

// Helper function to calculate week summary
const calculateWeekSummary = (
  weekRange: string,
  transactions: any[],
  dailyIncome: any[],
  weeklyPayables: any[],
  budgetCategories: any[],
) => {
  // Get week start and end dates
  const [startStr, endStr] = weekRange.split(" - ")
  const weekStart = new Date(startStr)
  const weekEnd = new Date(endStr)

  // Filter transactions for this week
  const weekTransactions = Array.isArray(transactions)
    ? transactions.filter((t) => {
        if (!t || !t.date) return false
        const transactionDate = new Date(t.date)
        return transactionDate >= weekStart && transactionDate <= weekEnd
      })
    : []

  // Calculate totals with safe number handling
  const totalIncome = weekTransactions
    .filter((t) => t && t.type === "income")
    .reduce((sum, t) => sum + safeNumber(t.amount), 0)

  const totalExpenses = weekTransactions
    .filter((t) => t && t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(safeNumber(t.amount)), 0)

  // Calculate category spending for this week with safe handling
  const categorySpending = Array.isArray(budgetCategories)
    ? budgetCategories.map((category) => {
        if (!category) return { weeklySpent: 0, weeklyProgress: 0 }

        const spent = weekTransactions
          .filter((t) => t && t.type === "expense" && t.category === category.name)
          .reduce((sum, t) => sum + Math.abs(safeNumber(t.amount)), 0)

        const budgeted = safeNumber(category.budgeted)
        const weeklyProgress = budgeted > 0 ? (spent / budgeted) * 100 : 0

        return {
          ...category,
          weeklySpent: spent,
          weeklyProgress: safeNumber(weeklyProgress),
        }
      })
    : []

  // Calculate payables for this week (if available in history)
  const weeklyPayablesHistory = JSON.parse(safeLocalStorage.getItem("weeklyPayablesHistory") || "[]")
  const weekHistory = Array.isArray(weeklyPayablesHistory)
    ? weeklyPayablesHistory.find((w: any) => w && w.weekRange === weekRange)
    : null

  let totalPayables = 0
  let paidPayables = 0
  let unpaidPayables = 0

  if (weekHistory && Array.isArray(weekHistory.payables)) {
    totalPayables = weekHistory.payables.reduce((sum: number, p: any) => sum + safeNumber(p?.amount), 0)
    paidPayables = weekHistory.payables
      .filter((p: any) => p && p.status === "paid")
      .reduce((sum: number, p: any) => sum + safeNumber(p?.amount), 0)
    unpaidPayables = totalPayables - paidPayables
  }

  // Calculate daily income goals vs actual for this week
  const weekDays = []
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    const dayStr = d.toLocaleDateString("en-US", { weekday: "short" })
    const dayIncome = weekTransactions
      .filter((t) => t && t.type === "income" && new Date(t.date || "").toDateString() === d.toDateString())
      .reduce((sum, t) => sum + safeNumber(t.amount), 0)

    weekDays.push({
      day: dayStr,
      date: d.toLocaleDateString(),
      income: dayIncome,
      goal: dayStr === "Sun" ? 600 : 800, // Default goals
    })
  }

  const totalGoal = weekDays.reduce((sum, day) => sum + safeNumber(day.goal), 0)
  const goalAchievement = totalGoal > 0 ? (totalIncome / totalGoal) * 100 : 0

  return {
    weekRange,
    totalIncome: safeNumber(totalIncome),
    totalExpenses: safeNumber(totalExpenses),
    totalPayables: safeNumber(totalPayables),
    paidPayables: safeNumber(paidPayables),
    unpaidPayables: safeNumber(unpaidPayables),
    netSavings: safeNumber(totalIncome - totalExpenses - paidPayables),
    categorySpending,
    weekDays,
    totalGoal: safeNumber(totalGoal),
    goalAchievement: safeNumber(goalAchievement),
    transactionCount: weekTransactions.length,
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
  expenseCategories: string[]
  setExpenseCategories: (categories: string[]) => void
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
  expenseCategories,
  setExpenseCategories,
  currency,
  clearAllData,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null)
  const [editingCategoryValue, setEditingCategoryValue] = useState("")

  // Handle adding new expense category
  const handleAddExpenseCategory = () => {
    if (newCategoryName.trim() && !expenseCategories.includes(newCategoryName.trim())) {
      setExpenseCategories([...expenseCategories, newCategoryName.trim()])
      setNewCategoryName("")
    }
  }

  // Handle editing expense category
  const handleEditExpenseCategory = (oldName: string) => {
    setEditingCategoryName(oldName)
    setEditingCategoryValue(oldName)
  }

  // Handle saving edited category
  const handleSaveExpenseCategory = () => {
    if (editingCategoryName && editingCategoryValue.trim() && editingCategoryValue !== editingCategoryName) {
      const updatedCategories = expenseCategories.map((cat) =>
        cat === editingCategoryName ? editingCategoryValue.trim() : cat,
      )
      setExpenseCategories(updatedCategories)
    }
    setEditingCategoryName(null)
    setEditingCategoryValue("")
  }

  // Handle deleting expense category
  const handleDeleteExpenseCategory = (categoryName: string) => {
    if (window.confirm(`Delete category "${categoryName}"?`)) {
      setExpenseCategories(expenseCategories.filter((cat) => cat !== categoryName))
    }
  }

  // Handle workday toggle
  const handleWorkdayToggle = (dayIndex: number) => {
    if (!Array.isArray(dailyIncome) || !dailyIncome[dayIndex]) return

    const updatedIncome = [...dailyIncome]
    const day = updatedIncome[dayIndex]
    day.isWorkDay = !day.isWorkDay
    day.goal = day.isWorkDay ? 1100 : 0 // Set goal based on workday status
    setDailyIncome(updatedIncome)
  }

  // Handle goal change
  const handleGoalChange = (dayIndex: number, newGoal: number) => {
    if (!Array.isArray(dailyIncome) || !dailyIncome[dayIndex]) return

    const updatedIncome = [...dailyIncome]
    updatedIncome[dayIndex].goal = safeNumber(newGoal)
    setDailyIncome(updatedIncome)
  }

  const [newPayable, setNewPayable] = useState({
    name: "",
    amount: "",
    dueDay: "Saturday", // Changed default to Saturday
    status: "pending",
    week: "This Week",
    frequency: "weekly",
    paidCount: 0,
  })

  const [editingPayable, setEditingPayable] = useState<number | null>(null)
  const [editPayableData, setEditPayableData] = useState<any>({})

  const [monthlyPayables, setMonthlyPayables] = useState<any>({})
  const [previousWeeks, setPreviousWeeks] = useState<any[]>([])
  const [selectedWeekSummary, setSelectedWeekSummary] = useState<any>(null)

  // Category management state
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null)
  const [editCategoryValue, setEditCategoryValue] = useState("")

  const [newCategory, setNewCategory] = useState({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = safeLocalStorage.getItem("monthlyPayables")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            // Convert old array format to new object format
            const currentMonthInfo = getCurrentMonthInfo()
            const currentMonthKey = `${currentMonthInfo.year}-${currentMonthInfo.month}`
            setMonthlyPayables({ [currentMonthKey]: parsed })
          } else {
            setMonthlyPayables(parsed || {})
          }
        } catch {
          setMonthlyPayables({})
        }
      }
    }
  }, [])

  // Load previous weeks data
  useEffect(() => {
    const weeks = getPreviousWeeks(8)
    setPreviousWeeks(weeks)
  }, [])

  const handleDateChange = (date: string) => {
    if (date) {
      const currentMonthInfo = getCurrentMonthInfo()
      const detectedWeek = getWeekForDate(date, currentMonthInfo.year, currentMonthInfo.month)
      const detectedDay = getDayNameFromDate(date)

      setNewPayable({
        ...newPayable,
        date: date,
        week: detectedWeek,
        dueDay: detectedDay,
      })
    } else {
      setNewPayable({
        ...newPayable,
        date: "",
        week: "Week 1",
        dueDay: "Saturday", // Changed default to Saturday
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
    if (!Array.isArray(dailyIncome) || !dailyIncome[index]) return

    const updated = [...dailyIncome]
    if (field === "isWorkDay") {
      // When workday status changes, update the goal accordingly
      updated[index] = {
        ...updated[index],
        [field]: value,
        goal: value ? 1100 : 0, // Set goal to 1100 for workdays, 0 for non-workdays
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setDailyIncome(updated)
  }

  const updateAllDailyGoals = (newGoal: number) => {
    if (!Array.isArray(dailyIncome)) return

    const updated = dailyIncome.map((day) => ({
      ...day,
      goal: day?.isWorkDay ? safeNumber(newGoal) : 0, // Only set goal for workdays
    }))
    setDailyIncome(updated)
  }

  // Category management functions
  const startEditingCategory = (index: number) => {
    if (!Array.isArray(expenseCategories) || !expenseCategories[index]) return

    setEditingCategoryIndex(index)
    setEditCategoryValue(expenseCategories[index])
  }

  const saveEditCategory = () => {
    if (editCategoryValue.trim() && editingCategoryIndex !== null && Array.isArray(expenseCategories)) {
      const updated = [...expenseCategories]
      updated[editingCategoryIndex] = editCategoryValue.trim()
      setExpenseCategories(updated)
      safeLocalStorage.setItem("expenseCategories", JSON.stringify(updated))
      setEditingCategoryIndex(null)
      setEditCategoryValue("")
    }
  }

  const cancelEditCategory = () => {
    setEditingCategoryIndex(null)
    setEditCategoryValue("")
  }

  const removeExpenseCategory = (index: number) => {
    if (!Array.isArray(expenseCategories)) return

    const updated = expenseCategories.filter((_, i) => i !== index)
    setExpenseCategories(updated)
    safeLocalStorage.setItem("expenseCategories", JSON.stringify(updated))
  }

  // Weekly payables functions
  const addPayable = () => {
    if (newPayable.name && newPayable.amount) {
      const newId = Date.now()
      const autoColor = getAutoColor(Array.isArray(weeklyPayables) ? weeklyPayables.length : 0)

      setWeeklyPayables([
        ...(Array.isArray(weeklyPayables) ? weeklyPayables : []),
        {
          ...newPayable,
          amount: safeNumber(newPayable.amount),
          id: newId,
          paidCount: 0,
          color: autoColor,
        },
      ])
      setNewPayable({
        name: "",
        amount: "",
        dueDay: "Saturday", // Changed default to Saturday
        status: "pending",
        week: "This Week",
        frequency: "weekly",
        paidCount: 0,
      })
    }
  }

  const startEditingPayable = (payable: any) => {
    if (!payable) return
    setEditingPayable(payable.id)
    setEditPayableData({ ...payable })
  }

  const saveEditPayable = () => {
    if (!Array.isArray(weeklyPayables)) return

    const updated = weeklyPayables.map((p) =>
      p && p.id === editingPayable ? { ...editPayableData, amount: safeNumber(editPayableData.amount) } : p,
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
    if (!Array.isArray(weeklyPayables)) return
    setWeeklyPayables(weeklyPayables.filter((p) => p && p.id !== id))
  }

  const markPayableAsPaid = (id: number) => {
    if (!Array.isArray(weeklyPayables)) return

    const updated = weeklyPayables.map((payable) => {
      if (payable && payable.id === id) {
        const newPaidCount = safeNumber(payable.paidCount) + 1
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

  const colorOptions = [
    { value: "from-red-500 to-pink-500", label: "Red to Pink" },
    { value: "from-blue-500 to-indigo-500", label: "Blue to Indigo" },
    { value: "from-green-500 to-emerald-500", label: "Green to Emerald" },
    { value: "from-purple-500 to-violet-500", label: "Purple to Violet" },
    { value: "from-yellow-500 to-orange-500", label: "Yellow to Orange" },
    { value: "from-teal-500 to-cyan-500", label: "Teal to Cyan" },
  ]

  // Generate week summary when selected
  const handleWeekSelect = (weekRange: string) => {
    const summary = calculateWeekSummary(
      weekRange,
      transactions || [],
      dailyIncome || [],
      weeklyPayables || [],
      budgetCategories || [],
    )
    setSelectedWeekSummary(summary)
  }

  // Budget Categories
  const handleAddBudgetCategory = () => {
    if (!newCategory.name || !newCategory.budgeted) return

    const category = {
      id: Date.now(),
      name: newCategory.name,
      budgeted: safeNumber(newCategory.budgeted),
      spent: 0,
      color: newCategory.color,
    }

    setBudgetCategories([...(Array.isArray(budgetCategories) ? budgetCategories : []), category])
    setNewCategory({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  }

  const handleEditBudgetCategory = (category: any) => {
    if (!category) return
    setEditingBudgetCategory(category)
    setNewCategory({
      name: category.name || "",
      budgeted: (category.budgeted || 0).toString(),
      color: category.color || "from-blue-500 to-indigo-500",
    })
  }

  const handleUpdateBudgetCategory = () => {
    if (!newCategory.name || !newCategory.budgeted || !editingBudgetCategory) return
    if (!Array.isArray(budgetCategories)) return

    const updatedCategories = budgetCategories.map((cat) =>
      cat && cat.id === editingBudgetCategory.id
        ? {
            ...cat,
            name: newCategory.name,
            budgeted: safeNumber(newCategory.budgeted),
            color: newCategory.color,
          }
        : cat,
    )

    setBudgetCategories(updatedCategories)
    setEditingBudgetCategory(null)
    setNewCategory({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  }

  const handleDeleteBudgetCategory = (categoryId: number) => {
    if (typeof window !== "undefined" && window.confirm("Delete this category?")) {
      if (!Array.isArray(budgetCategories)) return
      setBudgetCategories(budgetCategories.filter((cat) => cat && cat.id !== categoryId))
    }
  }

  // Safe data access with defaults
  const safeDashboardData = dashboardData || {}
  const safeBudgetCategories = Array.isArray(budgetCategories) ? budgetCategories : []
  const safeWeeklyPayables = Array.isArray(weeklyPayables) ? weeklyPayables : []
  const safeTransactions = Array.isArray(transactions) ? transactions : []
  const safeDailyIncome = Array.isArray(dailyIncome) ? dailyIncome : []
  const safeExpenseCategories = Array.isArray(expenseCategories) ? expenseCategories : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="workdays">Workdays</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] mt-4">
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Currency & Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency Symbol</Label>
                    <Input
                      id="currency"
                      value={safeDashboardData.currency || "₱"}
                      onChange={(e) =>
                        setDashboardData({
                          ...safeDashboardData,
                          currency: e.target.value,
                        })
                      }
                      placeholder="₱"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Current Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      value={safeDashboardData.totalBalance || 0}
                      onChange={(e) =>
                        setDashboardData({
                          ...safeDashboardData,
                          totalBalance: safeNumber(e.target.value),
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Daily Income Goals
                  </CardTitle>
                  <CardDescription>Set individual daily goals for each day of the week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {safeDailyIncome.map((day, index) => {
                      if (!day) return null
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium w-12">{day.day || "N/A"}</span>
                            {day.isToday && <Badge variant="secondary">Today</Badge>}
                            {!day.isWorkDay && <Badge variant="outline">Rest Day</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{currency}</span>
                            <Input
                              type="number"
                              value={safeNumber(day.goal)}
                              onChange={(e) => handleGoalChange(index, safeNumber(e.target.value))}
                              className="w-20 h-8"
                              disabled={!day.isWorkDay}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workdays" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Work Days Configuration
                  </CardTitle>
                  <CardDescription>
                    Toggle which days are work days (goals will be set to 0 for non-work days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {safeDailyIncome.map((day, index) => {
                      if (!day) return null
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium w-12">{day.day || "N/A"}</span>
                            {day.isToday && <Badge variant="secondary">Today</Badge>}
                            <span className="text-sm text-gray-600">
                              Goal: {currency}
                              {safeNumber(day.goal).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`workday-${index}`} className="text-sm">
                              Work Day
                            </Label>
                            <Switch
                              id={`workday-${index}`}
                              checked={Boolean(day.isWorkDay)}
                              onCheckedChange={() => handleWorkdayToggle(index)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              {/* Expense Categories Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Expense Categories
                  </CardTitle>
                  <CardDescription>Manage your expense categories for quick transaction entry</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add new category */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddExpenseCategory()}
                    />
                    <Button onClick={handleAddExpenseCategory} size="sm" disabled={!newCategoryName.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Category list */}
                  <div className="space-y-2">
                    {safeExpenseCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        {editingCategoryName === category ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingCategoryValue}
                              onChange={(e) => setEditingCategoryValue(e.target.value)}
                              className="h-8"
                              onKeyPress={(e) => e.key === "Enter" && handleSaveExpenseCategory()}
                            />
                            <Button onClick={handleSaveExpenseCategory} size="sm" variant="outline">
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingCategoryName(null)
                                setEditingCategoryValue("")
                              }}
                              size="sm"
                              variant="outline"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium">{category}</span>
                            <div className="flex gap-1">
                              <Button onClick={() => handleEditExpenseCategory(category)} size="sm" variant="ghost">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteExpenseCategory(category)}
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {safeExpenseCategories.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p>No expense categories yet.</p>
                      <p className="text-sm">Add categories above to organize your expenses.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator />

              {/* Budget Categories Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Budget Categories</CardTitle>
                  <CardDescription>Manage your budget categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add new category */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                    <Input
                      placeholder="Budgeted amount"
                      value={newCategory.budgeted}
                      onChange={(e) => setNewCategory({ ...newCategory, budgeted: e.target.value })}
                    />
                    <Select
                      value={newCategory.color}
                      onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAddBudgetCategory}
                      size="sm"
                      disabled={!newCategory.name || !newCategory.budgeted}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Category list */}
                  <div className="space-y-2">
                    {safeBudgetCategories.map((category, index) => {
                      if (!category) return null
                      return (
                        <div
                          key={category.id || index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          {editingBudgetCategory && editingBudgetCategory.id === category.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                className="h-8"
                              />
                              <Input
                                value={newCategory.budgeted}
                                onChange={(e) => setNewCategory({ ...newCategory, budgeted: e.target.value })}
                                className="h-8"
                              />
                              <Select
                                value={newCategory.color}
                                onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                                <SelectContent>
                                  {colorOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button onClick={handleUpdateBudgetCategory} size="sm" variant="outline">
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingBudgetCategory(null)
                                  setNewCategory({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
                                }}
                                size="sm"
                                variant="outline"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="font-medium">{category.name || "Unnamed"}</span>
                              <span className="text-sm text-gray-600">
                                Budgeted: {currency}
                                {safeNumber(category.budgeted).toLocaleString()}
                              </span>
                              <span className="text-sm text-gray-600">
                                Spent: {currency}
                                {safeNumber(category.spent).toLocaleString()}
                              </span>
                              <div className="flex gap-1">
                                <Button onClick={() => handleEditBudgetCategory(category)} size="sm" variant="ghost">
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteBudgetCategory(category.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {safeBudgetCategories.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p>No budget categories yet.</p>
                      <p className="text-sm">Add categories above to organize your budget.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator />

              {/* Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    Data Management
                  </CardTitle>
                  <CardDescription>Manage your app data (use with caution)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-red-800">Clear All Data</p>
                        <p className="text-sm text-red-600">This will delete everything permanently</p>
                      </div>
                      <Button onClick={clearAllData} variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Current data:</p>
                    <p>• Transactions: {safeTransactions.length}</p>
                    <p>• Budget Categories: {safeBudgetCategories.length}</p>
                    <p>• Weekly Payables: {safeWeeklyPayables.length}</p>
                    <p>• Expense Categories: {safeExpenseCategories.length}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
