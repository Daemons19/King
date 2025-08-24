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
import { BiweeklyScheduler } from "./biweekly-scheduler"
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

// Safe number formatting function
// const safeToFixed = (value: any, decimals = 2): string => {
//   const num = Number(value)
//   return isNaN(num) ? "0.00" : num.toFixed(decimals)
// }

// Safe number conversion
// const safeNumber = (value: any): number => {
//   const num = Number(value)
//   return isNaN(num) ? 0 : num
// }

// Helper functions
// const getManilaTime = () => {
//   return new Date().toLocaleString("en-US", {
//     timeZone: "Asia/Manila",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   })
// }

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
// const calculateWeekSummary = (
//   weekRange: string,
//   transactions: any[],
//   dailyIncome: any[],
//   weeklyPayables: any[],
//   budgetCategories: any[],
// ) => {
//   // Get week start and end dates
//   const [startStr, endStr] = weekRange.split(" - ")
//   const weekStart = new Date(startStr)
//   const weekEnd = new Date(endStr)

//   // Filter transactions for this week
//   const weekTransactions = Array.isArray(transactions)
//     ? transactions.filter((t) => {
//         if (!t || !t.date) return false
//         const transactionDate = new Date(t.date)
//         return transactionDate >= weekStart && transactionDate <= weekEnd
//       })
//     : []

//   // Calculate totals with safe number handling
//   const totalIncome = weekTransactions
//     .filter((t) => t && t.type === "income")
//     .reduce((sum, t) => sum + safeNumber(t.amount), 0)

//   const totalExpenses = weekTransactions
//     .filter((t) => t && t.type === "expense")
//     .reduce((sum, t) => sum + Math.abs(safeNumber(t.amount)), 0)

//   // Calculate category spending for this week with safe handling
//   const categorySpending = Array.isArray(budgetCategories)
//     ? budgetCategories.map((category) => {
//         if (!category) return { weeklySpent: 0, weeklyProgress: 0 }

//         const spent = weekTransactions
//           .filter((t) => t && t.type === "expense" && t.category === category.name)
//           .reduce((sum, t) => sum + Math.abs(safeNumber(t.amount)), 0)

//         const budgeted = safeNumber(category.budgeted)
//         const weeklyProgress = budgeted > 0 ? (spent / budgeted) * 100 : 0

//         return {
//           ...category,
//           weeklySpent: spent,
//           weeklyProgress: safeNumber(weeklyProgress),
//         }
//       })
//     : []

//   // Calculate payables for this week (if available in history)
//   const weeklyPayablesHistory = JSON.parse(safeLocalStorage.getItem("weeklyPayablesHistory") || "[]")
//   const weekHistory = Array.isArray(weeklyPayablesHistory)
//     ? weeklyPayablesHistory.find((w: any) => w && w.weekRange === weekRange)
//     : null

//   let totalPayables = 0
//   let paidPayables = 0
//   let unpaidPayables = 0

//   if (weekHistory && Array.isArray(weekHistory.payables)) {
//     totalPayables = weekHistory.payables.reduce((sum: number, p: any) => sum + safeNumber(p?.amount), 0)
//     paidPayables = weekHistory.payables
//       .filter((p: any) => p && p.status === "paid")
//       .reduce((sum: number, p: any) => sum + safeNumber(p?.amount), 0)
//     unpaidPayables = totalPayables - paidPayables
//   }

//   // Calculate daily income goals vs actual for this week
//   const weekDays = []
//   for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
//     const dayStr = d.toLocaleDateString("en-US", { weekday: "short" })
//     const dayIncome = weekTransactions
//       .filter((t) => t && t.type === "income" && new Date(t.date || "").toDateString() === d.toDateString())
//       .reduce((sum, t) => sum + safeNumber(t.amount), 0)

//     weekDays.push({
//       day: dayStr,
//       date: d.toLocaleDateString(),
//       income: dayIncome,
//       goal: dayStr === "Sun" ? 600 : 800, // Default goals
//     })
//   }

//   const totalGoal = weekDays.reduce((sum, day) => sum + safeNumber(day.goal), 0)
//   const goalAchievement = totalGoal > 0 ? (totalIncome / totalGoal) * 100 : 0

//   return {
//     weekRange,
//     totalIncome: safeNumber(totalIncome),
//     totalExpenses: safeNumber(totalExpenses),
//     totalPayables: safeNumber(totalPayables),
//     paidPayables: safeNumber(paidPayables),
//     unpaidPayables: safeNumber(unpaidPayables),
//     netSavings: safeNumber(totalIncome - totalExpenses - paidPayables),
//     categorySpending,
//     weekDays,
//     totalGoal: safeNumber(totalGoal),
//     goalAchievement: safeNumber(goalAchievement),
//     transactionCount: weekTransactions.length,
//   }
// }

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
      monthlyPayables: JSON.parse(localStorage.getItem("monthlyPayables") || "{}"),
      biweeklyPayables: JSON.parse(localStorage.getItem("biweeklyPayables") || "{}"),
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

      // Import additional data to localStorage
      if (parsed.monthlyPayables) {
        localStorage.setItem("monthlyPayables", JSON.stringify(parsed.monthlyPayables))
      }
      if (parsed.biweeklyPayables) {
        localStorage.setItem("biweeklyPayables", JSON.stringify(parsed.biweeklyPayables))
      }

      setImportData("")
      alert("Data imported successfully!")
    } catch (error) {
      alert("Error importing data. Please check the format.")
    }
  }

  // const [activeTab, setActiveTab] = useState("general")
  // const [newCategoryName, setNewCategoryName] = useState("")
  // const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null)
  // const [editingCategoryValue, setEditingCategoryValue] = useState("")

  // // Handle adding new expense category
  // const handleAddExpenseCategory = () => {
  //   if (newCategoryName.trim() && !expenseCategories.includes(newCategoryName.trim())) {
  //     setExpenseCategories([...expenseCategories, newCategoryName.trim()])
  //     setNewCategoryName("")
  //   }
  // }

  // // Handle editing expense category
  // const handleEditExpenseCategory = (oldName: string) => {
  //   setEditingCategoryName(oldName)
  //   setEditingCategoryValue(oldName)
  // }

  // // Handle saving edited category
  // const handleSaveExpenseCategory = () => {
  //   if (editingCategoryName && editingCategoryValue.trim() && editingCategoryValue !== editingCategoryName) {
  //     const updatedCategories = expenseCategories.map((cat) =>
  //       cat === editingCategoryName ? editingCategoryValue.trim() : cat,
  //     )
  //     setExpenseCategories(updatedCategories)
  //   }
  //   setEditingCategoryName(null)
  //   setEditingCategoryValue("")
  // }

  // // Handle deleting expense category
  // const handleDeleteExpenseCategory = (categoryName: string) => {
  //   if (window.confirm(`Delete category "${categoryName}"?`)) {
  //     setExpenseCategories(expenseCategories.filter((cat) => cat !== categoryName))
  //   }
  // }

  // // Handle workday toggle
  // const handleWorkdayToggle = (dayIndex: number) => {
  //   if (!Array.isArray(dailyIncome) || !dailyIncome[dayIndex]) return

  //   const updatedIncome = [...dailyIncome]
  //   const day = updatedIncome[dayIndex]
  //   day.isWorkDay = !day.isWorkDay
  //   day.goal = day.isWorkDay ? 1100 : 0 // Set goal based on workday status
  //   setDailyIncome(updatedIncome)
  // }

  // // Handle goal change
  // const handleGoalChange = (dayIndex: number, newGoal: number) => {
  //   if (!Array.isArray(dailyIncome) || !dailyIncome[dayIndex]) return

  //   const updatedIncome = [...dailyIncome]
  //   updatedIncome[dayIndex].goal = safeNumber(newGoal)
  //   setDailyIncome(updatedIncome)
  // }

  // const [newPayable, setNewPayable] = useState({
  //   name: "",
  //   amount: "",
  //   dueDay: "Saturday", // Changed default to Saturday
  //   status: "pending",
  //   week: "This Week",
  //   frequency: "weekly",
  //   paidCount: 0,
  // })

  // const [editingPayable, setEditingPayable] = useState<number | null>(null)
  // const [editPayableData, setEditPayableData] = useState<any>({})

  // const [monthlyPayables, setMonthlyPayables] = useState<any>({})
  // const [previousWeeks, setPreviousWeeks] = useState<any[]>([])
  // const [selectedWeekSummary, setSelectedWeekSummary] = useState<any>(null)

  // // Category management state
  // const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null)
  // const [editCategoryValue, setEditCategoryValue] = useState("")

  // const [newCategory, setNewCategory] = useState({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  // const [editingBudgetCategory, setEditingBudgetCategory] = useState<any>(null)

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     const saved = safeLocalStorage.getItem("monthlyPayables")
  //     if (saved) {
  //       try {
  //         const parsed = JSON.parse(saved)
  //         if (Array.isArray(parsed)) {
  //           // Convert old array format to new object format
  //           const currentMonthInfo = getCurrentMonthInfo()
  //           const currentMonthKey = `${currentMonthInfo.year}-${currentMonthInfo.month}`
  //           setMonthlyPayables({ [currentMonthKey]: parsed })
  //         } else {
  //           setMonthlyPayables(parsed || {})
  //         }
  //       } catch {
  //         setMonthlyPayables({})
  //       }
  //     }
  //   }
  // }, [])

  // // Load previous weeks data
  // useEffect(() => {
  //   const weeks = getPreviousWeeks(8)
  //   setPreviousWeeks(weeks)
  // }, [])

  // const handleDateChange = (date: string) => {
  //   if (date) {
  //     const currentMonthInfo = getCurrentMonthInfo()
  //     const detectedWeek = getWeekForDate(date, currentMonthInfo.year, currentMonthInfo.month)
  //     const detectedDay = getDayNameFromDate(date)

  //     setNewPayable({
  //       ...newPayable,
  //       date: date,
  //       week: detectedWeek,
  //       dueDay: detectedDay,
  //     })
  //   } else {
  //     setNewPayable({
  //       ...newPayable,
  //       date: "",
  //       week: "Week 1",
  //       dueDay: "Saturday", // Changed default to Saturday
  //     })
  //   }
  // }

  // const currentMonthInfo = getCurrentMonthInfo()
  // const currentMonthKey = `${currentMonthInfo.year}-${currentMonthInfo.month}`
  // const currentMonthPayables = monthlyPayables[currentMonthKey] || []

  // const updateDashboardData = (field: string, value: any) => {
  //   setDashboardData({ ...dashboardData, [field]: value })
  // }

  // const updateDailyIncome = (index: number, field: string, value: number | boolean) => {
  //   if (!Array.isArray(dailyIncome) || !dailyIncome[index]) return

  //   const updated = [...dailyIncome]
  //   if (field === "isWorkDay") {
  //     // When workday status changes, update the goal accordingly
  //     updated[index] = {
  //       ...updated[index],
  //       [field]: value,
  //       goal: value ? 1100 : 0, // Set goal to 1100 for workdays, 0 for non-workdays
  //     }
  //   } else {
  //     updated[index] = { ...updated[index], [field]: value }
  //   }
  //   setDailyIncome(updated)
  // }

  // const updateAllDailyGoals = (newGoal: number) => {
  //   if (!Array.isArray(dailyIncome)) return

  //   const updated = dailyIncome.map((day) => ({
  //     ...day,
  //     goal: day?.isWorkDay ? safeNumber(newGoal) : 0, // Only set goal for workdays
  //   }))
  //   setDailyIncome(updated)
  // }

  // // Category management functions
  // const startEditingCategory = (index: number) => {
  //   if (!Array.isArray(expenseCategories) || !expenseCategories[index]) return

  //   setEditingCategoryIndex(index)
  //   setEditCategoryValue(expenseCategories[index])
  // }

  // const saveEditCategory = () => {
  //   if (editCategoryValue.trim() && editingCategoryIndex !== null && Array.isArray(expenseCategories)) {
  //     const updated = [...expenseCategories]
  //     updated[editingCategoryIndex] = editCategoryValue.trim()
  //     setExpenseCategories(updated)
  //     safeLocalStorage.setItem("expenseCategories", JSON.stringify(updated))
  //     setEditingCategoryIndex(null)
  //     setEditCategoryValue("")
  //   }
  // }

  // const cancelEditCategory = () => {
  //   setEditingCategoryIndex(null)
  //   setEditCategoryValue("")
  // }

  // const removeExpenseCategory = (index: number) => {
  //   if (!Array.isArray(expenseCategories)) return

  //   const updated = expenseCategories.filter((_, i) => i !== index)
  //   setExpenseCategories(updated)
  //   safeLocalStorage.setItem("expenseCategories", JSON.stringify(updated))
  // }

  // // Weekly payables functions
  // const addPayable = () => {
  //   if (newPayable.name && newPayable.amount) {
  //     const newId = Date.now()
  //     const autoColor = getAutoColor(Array.isArray(weeklyPayables) ? weeklyPayables.length : 0)

  //     setWeeklyPayables([
  //       ...(Array.isArray(weeklyPayables) ? weeklyPayables : []),
  //       {
  //         ...newPayable,
  //         amount: safeNumber(newPayable.amount),
  //         id: newId,
  //         paidCount: 0,
  //         color: autoColor,
  //       },
  //     ])
  //     setNewPayable({
  //       name: "",
  //       amount: "",
  //       dueDay: "Saturday", // Changed default to Saturday
  //       status: "pending",
  //       week: "This Week",
  //       frequency: "weekly",
  //       paidCount: 0,
  //     })
  //   }
  // }

  // const startEditingPayable = (payable: any) => {
  //   if (!payable) return
  //   setEditingPayable(payable.id)
  //   setEditPayableData({ ...payable })
  // }

  // const saveEditPayable = () => {
  //   if (!Array.isArray(weeklyPayables)) return

  //   const updated = weeklyPayables.map((p) =>
  //     p && p.id === editingPayable ? { ...editPayableData, amount: safeNumber(editPayableData.amount) } : p,
  //   )
  //   setWeeklyPayables(updated)
  //   setEditingPayable(null)
  //   setEditPayableData({})
  // }

  // const cancelEditPayable = () => {
  //   setEditingPayable(null)
  //   setEditPayableData({})
  // }

  // const removePayable = (id: number) => {
  //   if (!Array.isArray(weeklyPayables)) return
  //   setWeeklyPayables(weeklyPayables.filter((p) => p && p.id !== id))
  // }

  // const markPayableAsPaid = (id: number) => {
  //   if (!Array.isArray(weeklyPayables)) return

  //   const updated = weeklyPayables.map((payable) => {
  //     if (payable && payable.id === id) {
  //       const newPaidCount = safeNumber(payable.paidCount) + 1
  //       let newStatus = "paid"

  //       // Smart completion logic with bi-weekly scheduling
  //       if (payable.frequency === "twice-monthly") {
  //         const currentWeek = 1 // This would need to be calculated based on current date
  //         const schedule = getBiWeeklySchedule(currentWeek, currentMonthInfo.weeks.length)

  //         if (newPaidCount >= 2) {
  //           newStatus = "completed"
  //         }
  //       } else if (payable.frequency === "monthly" && newPaidCount >= 1) {
  //         newStatus = "completed"
  //       }

  //       return {
  //         ...payable,
  //         status: newStatus,
  //         paidCount: newPaidCount,
  //       }
  //     }
  //     return payable
  //   })
  //   setWeeklyPayables(updated)
  // }

  // const colorOptions = [
  //   { value: "from-red-500 to-pink-500", label: "Red to Pink" },
  //   { value: "from-blue-500 to-indigo-500", label: "Blue to Indigo" },
  //   { value: "from-green-500 to-emerald-500", label: "Green to Emerald" },
  //   { value: "from-purple-500 to-violet-500", label: "Purple to Violet" },
  //   { value: "from-yellow-500 to-orange-500", label: "Yellow to Orange" },
  //   { value: "from-teal-500 to-cyan-500", label: "Teal to Cyan" },
  // ]

  // // Generate week summary when selected
  // const handleWeekSelect = (weekRange: string) => {
  //   const summary = calculateWeekSummary(
  //     weekRange,
  //     transactions || [],
  //     dailyIncome || [],
  //     weeklyPayables || [],
  //     budgetCategories || [],
  //   )
  //   setSelectedWeekSummary(summary)
  // }

  // // Budget Categories
  // const handleAddBudgetCategory = () => {
  //   if (!newCategory.name || !newCategory.budgeted) return

  //   const category = {
  //     id: Date.now(),
  //     name: newCategory.name,
  //     budgeted: safeNumber(newCategory.budgeted),
  //     spent: 0,
  //     color: newCategory.color,
  //   }

  //   setBudgetCategories([...(Array.isArray(budgetCategories) ? budgetCategories : []), category])
  //   setNewCategory({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  // }

  // const handleEditBudgetCategory = (category: any) => {
  //   if (!category) return
  //   setEditingBudgetCategory(category)
  //   setNewCategory({
  //     name: category.name || "",
  //     budgeted: (category.budgeted || 0).toString(),
  //     color: category.color || "from-blue-500 to-indigo-500",
  //   })
  // }

  // const handleUpdateBudgetCategory = () => {
  //   if (!newCategory.name || !newCategory.budgeted || !editingBudgetCategory) return
  //   if (!Array.isArray(budgetCategories)) return

  //   const updatedCategories = budgetCategories.map((cat) =>
  //     cat && cat.id === editingBudgetCategory.id
  //       ? {
  //           ...cat,
  //           name: newCategory.name,
  //           budgeted: safeNumber(newCategory.budgeted),
  //           color: newCategory.color,
  //         }
  //       : cat,
  //   )

  //   setBudgetCategories(updatedCategories)
  //   setEditingBudgetCategory(null)
  //   setNewCategory({ name: "", budgeted: "", color: "from-blue-500 to-indigo-500" })
  // }

  // const handleDeleteBudgetCategory = (categoryId: number) => {
  //   if (typeof window !== "undefined" && window.confirm("Delete this category?")) {
  //     if (!Array.isArray(budgetCategories)) return
  //     setBudgetCategories(budgetCategories.filter((cat) => cat && cat.id !== categoryId))
  //   }
  // }

  // // Safe data access with defaults
  // const safeDashboardData = dashboardData || {}
  // const safeBudgetCategories = Array.isArray(budgetCategories) ? budgetCategories : []
  // const safeWeeklyPayables = Array.isArray(weeklyPayables) ? weeklyPayables : []
  // const safeTransactions = Array.isArray(transactions) ? transactions : []
  // const safeDailyIncome = Array.isArray(dailyIncome) ? dailyIncome : []
  // const safeExpenseCategories = Array.isArray(expenseCategories) ? expenseCategories : []

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
                        <span>Expense Categories</span>
                        <Badge>{safeExpenseCategories.length}</Badge>
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
                        onChange={(value) => setNewPayable({ ...newPayable, dueDay: value })}
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
                        onChange={(value) => setNewPayable({ ...newPayable, frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="twice-monthly">Twice Monthly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
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
                                  onChange={(value) =>
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
                                  onChange={(value) =>
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
                                    <SelectItem value="monthly">Monthly</SelectItem>
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

              {/* Biweekly Scheduler */}
              <BiweeklyScheduler />
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
                                onChange={(checked) => updateDailyGoal(day?.day, checked)}
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
                      <span className="text-gray-600">Enhanced Notifications</span>
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
