"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings,
  Trash2,
  Plus,
  Edit,
  Save,
  X,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  Database,
  Smartphone,
  Download,
  Upload,
  AlertTriangle,
  TrendingUp,
  Zap,
} from "lucide-react"
import { AppUpdateManager } from "./app-update-manager"

// Safe number formatting functions
const safeToFixed = (value: any, decimals = 2): string => {
  const num = Number(value)
  return isNaN(num) ? "0.00" : num.toFixed(decimals)
}

const safeNumber = (value: any): number => {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

const safeToLocaleString = (value: any): string => {
  const num = Number(value)
  return isNaN(num) ? "0" : num.toLocaleString()
}

// Helper function to get current Manila time
const getManilaTime = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Helper function to get week start date in Manila
const getWeekStartManila = () => {
  const now = new Date()
  const manilaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }))
  const dayOfWeek = manilaDate.getDay()
  const diff = manilaDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday as start
  const weekStart = new Date(manilaDate.setDate(diff))
  return weekStart.toISOString().split("T")[0]
}

// Helper function to calculate week summary with safe defaults
const calculateWeekSummary = (dailyIncome: any[], transactions: any[], weeklyPayables: any[]) => {
  // Safe array access with defaults
  const safeDailyIncome = Array.isArray(dailyIncome) ? dailyIncome : []
  const safeTransactions = Array.isArray(transactions) ? transactions : []
  const safeWeeklyPayables = Array.isArray(weeklyPayables) ? weeklyPayables : []

  // Work days calculations with null checks
  const workDays = safeDailyIncome.filter((day) => day && day.isWorkDay && safeNumber(day.goal) > 0)
  const weeklyEarned = workDays.reduce((sum, day) => sum + safeNumber(day?.amount), 0)
  const weeklyGoal = workDays.reduce((sum, day) => sum + safeNumber(day?.goal), 0)
  const goalAchievement = weeklyGoal > 0 ? (weeklyEarned / weeklyGoal) * 100 : 0

  // Expense calculations with null checks
  const weekStart = getWeekStartManila()
  const currentWeekExpenses = safeTransactions
    .filter((t) => t && t.type === "expense" && new Date(t.date || "") >= new Date(weekStart))
    .reduce((sum, t) => sum + Math.abs(safeNumber(t?.amount)), 0)

  // Payables calculations with null checks
  const totalWeeklyPayables = safeWeeklyPayables.reduce((sum, payable) => sum + safeNumber(payable?.amount), 0)
  const pendingPayables = safeWeeklyPayables.filter((p) => p && p.status === "pending")
  const totalPendingPayables = pendingPayables.reduce((sum, payable) => sum + safeNumber(payable?.amount), 0)

  return {
    workDays: workDays.length,
    weeklyEarned,
    weeklyGoal,
    goalAchievement,
    currentWeekExpenses,
    totalWeeklyPayables,
    totalPendingPayables,
    pendingCount: pendingPayables.length,
  }
}

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

// Helper function to check if a date falls within current week
const isDateInCurrentWeek = (dateString: string) => {
  const date = new Date(dateString)
  const weekStart = new Date(getWeekStartManila())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // Sunday
  return date >= weekStart && date <= weekEnd
}

// Helper function to get current month info
const getCurrentMonthInfo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthName = now.toLocaleString("default", { month: "long" })
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return { year, month, monthName, daysInMonth }
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
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [editingPayable, setEditingPayable] = useState<number | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "", budgeted: 0 })
  const [newPayable, setNewPayable] = useState({
    name: "",
    amount: 0,
    dueDay: "Saturday",
    frequency: "weekly",
    status: "pending",
  })
  const [newExpenseCategory, setNewExpenseCategory] = useState("")
  const [exportData, setExportData] = useState("")
  const [importData, setImportData] = useState("")
  const [lastBackup, setLastBackup] = useState<string | null>(null)

  // Monthly payables state
  const [monthlyPayables, setMonthlyPayables] = useState<any[]>([])
  const [newMonthlyPayable, setNewMonthlyPayable] = useState({
    name: "",
    amount: 0,
    dayOfMonth: 15, // Fixed day of month (1-31)
    status: "pending",
  })
  const [editingMonthlyPayable, setEditingMonthlyPayable] = useState<number | null>(null)

  // Safe dashboard data with defaults
  const safeDashboardData = dashboardData || {
    totalBalance: 0,
    dailyIncomeGoal: 1100,
    weeklyExpenses: 0,
    weeklyPayables: 0,
    currency: "₱",
  }

  // Safe arrays with defaults
  const safeBudgetCategories = Array.isArray(budgetCategories) ? budgetCategories : []
  const safeWeeklyPayables = Array.isArray(weeklyPayables) ? weeklyPayables : []
  const safeTransactions = Array.isArray(transactions) ? transactions : []
  const safeDailyIncome = Array.isArray(dailyIncome) ? dailyIncome : []
  const safeExpenseCategories = Array.isArray(expenseCategories) ? expenseCategories : []

  // Calculate week summary with safe data
  const weekSummary = calculateWeekSummary(safeDailyIncome, safeTransactions, safeWeeklyPayables)

  // Load monthly payables from localStorage
  useEffect(() => {
    const saved = safeLocalStorage.getItem("monthlyPayables")
    if (saved) {
      try {
        setMonthlyPayables(JSON.parse(saved))
      } catch {
        setMonthlyPayables([])
      }
    }
  }, [])

  // Save monthly payables to localStorage
  useEffect(() => {
    safeLocalStorage.setItem("monthlyPayables", JSON.stringify(monthlyPayables))
  }, [monthlyPayables])

  // Load last backup time
  useEffect(() => {
    const saved = localStorage.getItem("lastBackupTime")
    if (saved) {
      setLastBackup(saved)
    }
  }, [])

  // Update budget categories with real-time expense data
  const updatedBudgetCategories = safeBudgetCategories.map((category) => {
    const categoryExpenses = safeTransactions
      .filter((t) => t && t.type === "expense" && t.category === category?.name)
      .reduce((sum, t) => sum + Math.abs(safeNumber(t?.amount)), 0)

    const weeklyProgress = (category?.budgeted || 0) > 0 ? (categoryExpenses / (category?.budgeted || 1)) * 100 : 0

    return {
      ...category,
      spent: categoryExpenses,
      weeklyProgress,
    }
  })

  const addBudgetCategory = () => {
    if (newCategory.name && newCategory.budgeted > 0) {
      const newCat = {
        id: Date.now(),
        name: newCategory.name,
        budgeted: newCategory.budgeted,
        spent: 0,
        color: `from-${["emerald", "blue", "purple", "orange", "yellow"][Math.floor(Math.random() * 5)]}-500 to-${["teal", "indigo", "pink", "red", "orange"][Math.floor(Math.random() * 5)]}-500`,
      }
      setBudgetCategories([...safeBudgetCategories, newCat])
      setNewCategory({ name: "", budgeted: 0 })
    }
  }

  const updateBudgetCategory = (id: number, updates: any) => {
    setBudgetCategories(safeBudgetCategories.map((cat) => (cat && cat.id === id ? { ...cat, ...updates } : cat)))
    setEditingCategory(null)
  }

  const deleteBudgetCategory = (id: number) => {
    setBudgetCategories(safeBudgetCategories.filter((cat) => cat && cat.id !== id))
  }

  const addWeeklyPayable = () => {
    if (newPayable.name && newPayable.amount > 0) {
      const payable = {
        id: Date.now(),
        ...newPayable,
        week: "This Week",
      }
      setWeeklyPayables([...safeWeeklyPayables, payable])
      setNewPayable({
        name: "",
        amount: 0,
        dueDay: "Saturday",
        frequency: "weekly",
        status: "pending",
      })
    }
  }

  const updateWeeklyPayable = (id: number, updates: any) => {
    setWeeklyPayables(
      safeWeeklyPayables.map((payable) => (payable && payable.id === id ? { ...payable, ...updates } : payable)),
    )
    setEditingPayable(null)
  }

  const deleteWeeklyPayable = (id: number) => {
    setWeeklyPayables(safeWeeklyPayables.filter((payable) => payable && payable.id !== id))
  }

  // Monthly payables functions
  const addMonthlyPayable = () => {
    if (newMonthlyPayable.name && newMonthlyPayable.amount > 0) {
      const payable = {
        id: Date.now(),
        ...newMonthlyPayable,
      }
      setMonthlyPayables([...monthlyPayables, payable])
      setNewMonthlyPayable({
        name: "",
        amount: 0,
        dayOfMonth: 15,
        status: "pending",
      })
    }
  }

  const updateMonthlyPayable = (id: number, updates: any) => {
    setMonthlyPayables(monthlyPayables.map((payable) => (payable.id === id ? { ...payable, ...updates } : payable)))
    setEditingMonthlyPayable(null)
  }

  const deleteMonthlyPayable = (id: number) => {
    setMonthlyPayables(monthlyPayables.filter((payable) => payable.id !== id))
  }

  // Get monthly payables that fall in current week
  const getMonthlyPayablesForCurrentWeek = () => {
    const currentMonthInfo = getCurrentMonthInfo()

    return monthlyPayables
      .filter((payable) => {
        // Create date for this month's due date
        const dueDate = new Date(currentMonthInfo.year, currentMonthInfo.month, payable.dayOfMonth)
        const dueDateString = dueDate.toISOString().split("T")[0]

        // Check if due date falls in current week
        return isDateInCurrentWeek(dueDateString)
      })
      .map((payable) => ({
        ...payable,
        week: "This Week",
        source: "monthly",
        dueDay: new Date(currentMonthInfo.year, currentMonthInfo.month, payable.dayOfMonth).toLocaleDateString(
          "en-US",
          { weekday: "long" },
        ),
        date: new Date(currentMonthInfo.year, currentMonthInfo.month, payable.dayOfMonth).toISOString().split("T")[0],
      }))
  }

  const addExpenseCategory = () => {
    if (newExpenseCategory && !safeExpenseCategories.includes(newExpenseCategory)) {
      setExpenseCategories([...safeExpenseCategories, newExpenseCategory])
      setNewExpenseCategory("")
    }
  }

  const deleteExpenseCategory = (category: string) => {
    setExpenseCategories(safeExpenseCategories.filter((cat) => cat !== category))
  }

  const updateDailyGoal = (day: string, isWorkDay: boolean, goal?: number) => {
    const updated = safeDailyIncome.map((dayData) => {
      if (dayData && dayData.day === day) {
        return {
          ...dayData,
          isWorkDay,
          goal: isWorkDay ? goal || dayData.goal || 1100 : 0,
        }
      }
      return dayData
    })
    setDailyIncome(updated)
  }

  const exportAllData = () => {
    const dataToExport = {
      version: "v81",
      timestamp: getManilaTime(),
      dashboardData: safeDashboardData,
      budgetCategories: safeBudgetCategories,
      weeklyPayables: safeWeeklyPayables,
      transactions: safeTransactions,
      dailyIncome: safeDailyIncome,
      expenseCategories: safeExpenseCategories,
      monthlyPayables: monthlyPayables,
    }

    const jsonString = JSON.stringify(dataToExport, null, 2)
    setExportData(jsonString)

    // Save backup timestamp
    const backupTime = getManilaTime()
    localStorage.setItem("lastBackupTime", backupTime)
    setLastBackup(backupTime)

    // Download file
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `budget-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importAllData = () => {
    try {
      const parsed = JSON.parse(importData)

      if (parsed.dashboardData) setDashboardData(parsed.dashboardData)
      if (parsed.budgetCategories) setBudgetCategories(parsed.budgetCategories)
      if (parsed.weeklyPayables) setWeeklyPayables(parsed.weeklyPayables)
      if (parsed.transactions) setTransactions(parsed.transactions)
      if (parsed.dailyIncome) setDailyIncome(parsed.dailyIncome)
      if (parsed.expenseCategories) setExpenseCategories(parsed.expenseCategories)
      if (parsed.monthlyPayables) setMonthlyPayables(parsed.monthlyPayables)

      setImportData("")
      alert("Data imported successfully!")
    } catch (error) {
      alert("Error importing data. Please check the format.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings & Management
          </DialogTitle>
          <DialogDescription>Manage your budget categories, payables, and app settings</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="payables">Bills</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="app">App</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            <TabsContent value="overview" className="space-y-4 mt-0">
              {/* Week Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    This Week's Summary
                  </CardTitle>
                  <CardDescription>Current week performance and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Work Days</span>
                        <span className="font-medium">{weekSummary.workDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Weekly Goal</span>
                        <span className="font-medium">
                          {currency}
                          {safeToLocaleString(weekSummary.weeklyGoal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Earned</span>
                        <span className="font-medium text-green-600">
                          {currency}
                          {safeToLocaleString(weekSummary.weeklyEarned)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expenses</span>
                        <span className="font-medium text-red-600">
                          {currency}
                          {safeToLocaleString(weekSummary.currentWeekExpenses)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending Bills</span>
                        <span className="font-medium text-orange-600">
                          {currency}
                          {safeToLocaleString(weekSummary.totalPendingPayables)} ({weekSummary.pendingCount})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Goal Achievement</span>
                        <span
                          className={`font-medium ${
                            weekSummary.goalAchievement >= 100
                              ? "text-green-600"
                              : weekSummary.goalAchievement >= 80
                                ? "text-blue-600"
                                : "text-red-600"
                          }`}
                        >
                          {safeToFixed(weekSummary.goalAchievement, 1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weekly Progress</span>
                      <span>{safeToFixed(weekSummary.goalAchievement, 1)}%</span>
                    </div>
                    <Progress value={Math.min(weekSummary.goalAchievement, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Current Balance</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {currency}
                      {safeToLocaleString(safeDashboardData.totalBalance)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Daily Goal</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {currency}
                      {safeToLocaleString(safeDashboardData.dailyIncomeGoal)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    Data Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Transactions</span>
                        <Badge>{safeTransactions.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Budget Categories</span>
                        <Badge>{safeBudgetCategories.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Payables</span>
                        <Badge>{safeWeeklyPayables.length}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Monthly Payables</span>
                        <Badge>{monthlyPayables.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Work Days This Week</span>
                        <Badge>{weekSummary.workDays}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>App Version</span>
                        <Badge variant="outline">v81</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="space-y-4 mt-0">
              {/* Add New Budget Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-600" />
                    Add Budget Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category-name">Category Name</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="e.g., Food, Transport"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-budget">Weekly Budget</Label>
                      <Input
                        id="category-budget"
                        type="number"
                        value={newCategory.budgeted || ""}
                        onChange={(e) => setNewCategory({ ...newCategory, budgeted: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <Button onClick={addBudgetCategory} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Budget Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Categories ({safeBudgetCategories.length})</CardTitle>
                  <CardDescription>Manage your spending categories and budgets</CardDescription>
                </CardHeader>
                <CardContent>
                  {updatedBudgetCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No budget categories yet.</p>
                      <p className="text-sm">Add categories above to track your spending.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {updatedBudgetCategories.map((category) => (
                        <div key={category?.id} className="border rounded-lg p-4">
                          {editingCategory === category?.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  value={category?.name || ""}
                                  onChange={(e) =>
                                    setBudgetCategories(
                                      safeBudgetCategories.map((cat) =>
                                        cat && cat.id === category?.id ? { ...cat, name: e.target.value } : cat,
                                      ),
                                    )
                                  }
                                />
                                <Input
                                  type="number"
                                  value={category?.budgeted || ""}
                                  onChange={(e) =>
                                    setBudgetCategories(
                                      safeBudgetCategories.map((cat) =>
                                        cat && cat.id === category?.id
                                          ? { ...cat, budgeted: Number(e.target.value) }
                                          : cat,
                                      ),
                                    )
                                  }
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => setEditingCategory(null)}>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{category?.name}</span>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingCategory(category?.id)}>
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteBudgetCategory(category?.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>
                                    {currency}
                                    {safeToLocaleString(category?.spent)} / {currency}
                                    {safeToLocaleString(category?.budgeted)}
                                  </span>
                                  <span className="font-medium">{safeToFixed(category?.weeklyProgress, 2)}%</span>
                                </div>
                                <Progress value={Math.min(safeNumber(category?.weeklyProgress), 100)} className="h-2" />
                                {safeNumber(category?.spent) > safeNumber(category?.budgeted) && (
                                  <p className="text-xs text-red-600">
                                    Over by {currency}
                                    {safeToLocaleString(safeNumber(category?.spent) - safeNumber(category?.budgeted))}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payables" className="space-y-4 mt-0">
              {/* Monthly Payables Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Monthly Bills (Fixed Day)
                  </CardTitle>
                  <CardDescription>Bills that repeat every month on a specific day</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add New Monthly Payable */}
                  <div className="bg-purple-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="monthly-name">Bill Name</Label>
                        <Input
                          id="monthly-name"
                          value={newMonthlyPayable.name}
                          onChange={(e) => setNewMonthlyPayable({ ...newMonthlyPayable, name: e.target.value })}
                          placeholder="e.g., Rent, Utilities"
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthly-amount">Amount</Label>
                        <Input
                          id="monthly-amount"
                          type="number"
                          value={newMonthlyPayable.amount || ""}
                          onChange={(e) =>
                            setNewMonthlyPayable({ ...newMonthlyPayable, amount: Number(e.target.value) })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="monthly-day">Day of Month (1-31)</Label>
                      <Select
                        value={newMonthlyPayable.dayOfMonth.toString()}
                        onValueChange={(value) =>
                          setNewMonthlyPayable({ ...newMonthlyPayable, dayOfMonth: Number(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}
                              {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of every month
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addMonthlyPayable} className="w-full bg-purple-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Monthly Bill
                    </Button>
                  </div>

                  {/* Existing Monthly Payables */}
                  {monthlyPayables.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No monthly bills set up yet.</p>
                      <p className="text-sm">Add monthly bills above to track recurring payments.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {monthlyPayables.map((payable) => (
                        <div key={payable.id} className="border rounded-lg p-4">
                          {editingMonthlyPayable === payable.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  value={payable.name || ""}
                                  onChange={(e) =>
                                    setMonthlyPayables(
                                      monthlyPayables.map((p) =>
                                        p.id === payable.id ? { ...p, name: e.target.value } : p,
                                      ),
                                    )
                                  }
                                />
                                <Input
                                  type="number"
                                  value={payable.amount || ""}
                                  onChange={(e) =>
                                    setMonthlyPayables(
                                      monthlyPayables.map((p) =>
                                        p.id === payable.id ? { ...p, amount: Number(e.target.value) } : p,
                                      ),
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Select
                                  value={payable.dayOfMonth.toString()}
                                  onValueChange={(value) =>
                                    setMonthlyPayables(
                                      monthlyPayables.map((p) =>
                                        p.id === payable.id ? { ...p, dayOfMonth: Number(value) } : p,
                                      ),
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                      <SelectItem key={day} value={day.toString()}>
                                        {day}
                                        {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => setEditingMonthlyPayable(null)}>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingMonthlyPayable(null)}>
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <span className="font-medium">{payable.name}</span>
                                  <div className="text-sm text-gray-600">
                                    {currency}
                                    {safeToLocaleString(payable.amount)} • Every {payable.dayOfMonth}
                                    {payable.dayOfMonth === 1
                                      ? "st"
                                      : payable.dayOfMonth === 2
                                        ? "nd"
                                        : payable.dayOfMonth === 3
                                          ? "rd"
                                          : "th"}
                                  </div>
                                  {/* Show if due this week */}
                                  {getMonthlyPayablesForCurrentWeek().some((p) => p.id === payable.id) && (
                                    <Badge className="bg-orange-100 text-orange-800 text-xs mt-1">Due This Week</Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingMonthlyPayable(payable.id)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteMonthlyPayable(payable.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add New Weekly Payable */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Add Weekly Bill
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payable-name">Bill Name</Label>
                      <Input
                        id="payable-name"
                        value={newPayable.name}
                        onChange={(e) => setNewPayable({ ...newPayable, name: e.target.value })}
                        placeholder="e.g., Groceries, Gas"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payable-amount">Amount</Label>
                      <Input
                        id="payable-amount"
                        type="number"
                        value={newPayable.amount || ""}
                        onChange={(e) => setNewPayable({ ...newPayable, amount: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="twice-monthly">Twice Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={addWeeklyPayable} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bill
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Weekly Payables */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Bills ({safeWeeklyPayables.length})</CardTitle>
                  <CardDescription>Manage your recurring weekly bills</CardDescription>
                </CardHeader>
                <CardContent>
                  {safeWeeklyPayables.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No weekly bills set up yet.</p>
                      <p className="text-sm">Add bills above to track your payments.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeWeeklyPayables.map((payable) => (
                        <div key={payable?.id} className="border rounded-lg p-4">
                          {editingPayable === payable?.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  value={payable?.name || ""}
                                  onChange={(e) =>
                                    setWeeklyPayables(
                                      safeWeeklyPayables.map((p) =>
                                        p && p.id === payable?.id ? { ...p, name: e.target.value } : p,
                                      ),
                                    )
                                  }
                                />
                                <Input
                                  type="number"
                                  value={payable?.amount || ""}
                                  onChange={(e) =>
                                    setWeeklyPayables(
                                      safeWeeklyPayables.map((p) =>
                                        p && p.id === payable?.id ? { ...p, amount: Number(e.target.value) } : p,
                                      ),
                                    )
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <Select
                                  value={payable?.dueDay || "Saturday"}
                                  onValueChange={(value) =>
                                    setWeeklyPayables(
                                      safeWeeklyPayables.map((p) =>
                                        p && p.id === payable?.id ? { ...p, dueDay: value } : p,
                                      ),
                                    )
                                  }
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
                                <Select
                                  value={payable?.frequency || "weekly"}
                                  onValueChange={(value) =>
                                    setWeeklyPayables(
                                      safeWeeklyPayables.map((p) =>
                                        p && p.id === payable?.id ? { ...p, frequency: value } : p,
                                      ),
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="twice-monthly">Twice Monthly</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => setEditingPayable(null)}>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingPayable(null)}>
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <span className="font-medium">{payable?.name}</span>
                                  <div className="text-sm text-gray-600">
                                    {currency}
                                    {safeToLocaleString(payable?.amount)} • {payable?.dueDay} • {payable?.frequency}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Badge
                                    className={
                                      payable?.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : payable?.status === "paid"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-orange-100 text-orange-800"
                                    }
                                  >
                                    {payable?.status}
                                  </Badge>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingPayable(payable?.id)}>
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteWeeklyPayable(payable?.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4 mt-0">
              {/* Daily Goals Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Daily Income Goals
                  </CardTitle>
                  <CardDescription>Set work days and income goals for each day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Default Daily Goal */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <Label htmlFor="default-goal">Default Daily Goal (Work Days)</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="default-goal"
                          type="number"
                          value={safeDashboardData.dailyIncomeGoal || ""}
                          onChange={(e) =>
                            setDashboardData({
                              ...safeDashboardData,
                              dailyIncomeGoal: Number(e.target.value),
                            })
                          }
                          placeholder="1100"
                        />
                        <Button
                          onClick={() => {
                            const newGoal = safeDashboardData.dailyIncomeGoal
                            const updated = safeDailyIncome.map((day) => ({
                              ...day,
                              goal: day && day.isWorkDay ? newGoal : 0,
                            }))
                            setDailyIncome(updated)
                          }}
                        >
                          Apply to All Work Days
                        </Button>
                      </div>
                    </div>

                    {/* Individual Day Settings */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Individual Day Settings</h4>
                      {safeDailyIncome.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium w-12">{day?.day}</span>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={Boolean(day?.isWorkDay)}
                                onCheckedChange={(checked) => updateDailyGoal(day?.day, checked)}
                              />
                              <Label className="text-sm">Work Day</Label>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {day?.isWorkDay ? (
                              <Input
                                type="number"
                                value={safeNumber(day?.goal) || ""}
                                onChange={(e) => updateDailyGoal(day?.day, true, Number(e.target.value))}
                                className="w-24"
                                placeholder="1100"
                              />
                            ) : (
                              <span className="text-sm text-gray-500 w-24 text-center">Rest Day</span>
                            )}
                            <span className="text-xs text-gray-500 w-16">
                              {currency}
                              {safeToLocaleString(day?.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goal Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Goal Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Work Days This Week</span>
                        <span className="font-medium">{weekSummary.workDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Weekly Goal</span>
                        <span className="font-medium">
                          {currency}
                          {safeToLocaleString(weekSummary.weeklyGoal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Earned So Far</span>
                        <span className="font-medium text-green-600">
                          {currency}
                          {safeToLocaleString(weekSummary.weeklyEarned)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Achievement</span>
                        <span
                          className={`font-medium ${
                            weekSummary.goalAchievement >= 100
                              ? "text-green-600"
                              : weekSummary.goalAchievement >= 80
                                ? "text-blue-600"
                                : "text-red-600"
                          }`}
                        >
                          {safeToFixed(weekSummary.goalAchievement, 1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Remaining</span>
                        <span className="font-medium">
                          {currency}
                          {safeToLocaleString(Math.max(0, weekSummary.weeklyGoal - weekSummary.weeklyEarned))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average/Day</span>
                        <span className="font-medium">
                          {currency}
                          {weekSummary.workDays > 0
                            ? safeToLocaleString(weekSummary.weeklyEarned / weekSummary.workDays)
                            : "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4 mt-0">
              {/* Expense Categories Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-purple-600" />
                    Expense Categories
                  </CardTitle>
                  <CardDescription>Manage categories for expense tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value)}
                      placeholder="New category name"
                      className="flex-1"
                    />
                    <Button onClick={addExpenseCategory}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {safeExpenseCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span>{category}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteExpenseCategory(category)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data Export/Import */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-600" />
                    Data Backup & Restore
                  </CardTitle>
                  <CardDescription>
                    Export your data for backup or import from another device
                    {lastBackup && <div className="text-xs text-gray-500 mt-1">Last backup: {lastBackup}</div>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button onClick={exportAllData} variant="outline" className="w-full bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                    <Button
                      onClick={importAllData}
                      variant="outline"
                      className="w-full bg-transparent"
                      disabled={!importData.trim()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                  </div>

                  {exportData && (
                    <div className="space-y-2">
                      <Label>Exported Data (Copy this to save)</Label>
                      <textarea
                        className="w-full h-32 p-2 border rounded text-xs"
                        value={exportData}
                        readOnly
                        onClick={(e) => e.currentTarget.select()}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Import Data (Paste backup data here)</Label>
                    <textarea
                      className="w-full h-32 p-2 border rounded text-xs"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Paste your backup data here..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>Dangerous actions - use with caution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all your budget data, transactions,
                          categories, and settings.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearAllData} className="bg-red-600 hover:bg-red-700">
                          Yes, delete everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="app" className="space-y-4 mt-0">
              {/* App Update Manager */}
              <AppUpdateManager />

              {/* App Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    App Settings
                  </CardTitle>
                  <CardDescription>Configure app behavior and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Currency Symbol</Label>
                        <p className="text-xs text-gray-600">Display currency for all amounts</p>
                      </div>
                      <Input
                        value={safeDashboardData.currency || "₱"}
                        onChange={(e) =>
                          setDashboardData({
                            ...safeDashboardData,
                            currency: e.target.value,
                          })
                        }
                        className="w-20"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Starting Balance</Label>
                        <p className="text-xs text-gray-600">Your initial account balance</p>
                      </div>
                      <Input
                        type="number"
                        value={safeNumber(safeDashboardData.totalBalance) || ""}
                        onChange={(e) =>
                          setDashboardData({
                            ...safeDashboardData,
                            totalBalance: Number(e.target.value),
                          })
                        }
                        className="w-32"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* App Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    App Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Version</span>
                      <Badge variant="outline">v81</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated</span>
                      <span className="text-gray-600">Monthly Payables Only</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Storage</span>
                      <span className="text-gray-600">Local Browser Storage</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Offline Support</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>PWA Ready</span>
                      <Badge className="bg-blue-100 text-blue-800">Yes</Badge>
                    </div>
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
