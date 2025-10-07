"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingDown,
  Plus,
  Settings,
  Wallet,
  Home,
  DollarSign,
  CreditCard,
  TrendingUp,
  Bell,
  Receipt,
  Bot,
} from "lucide-react"
import { TransactionList } from "../components/transaction-list"
import { SettingsDialog } from "../components/settings-dialog"
import { DailyIncomeChart } from "../components/daily-income-chart"
import { WeeklyPayablesCard } from "../components/weekly-payables-card"
import { InstallPrompt } from "../components/install-prompt"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import OfflineIndicator from "@/components/offline-indicator"
import OptimizedCard from "@/components/optimized-card"
import NotificationManager from "@/components/notification-manager"
import { AIAssistant } from "@/components/ai-assistant"

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

const getCurrentDayManila = () => {
  return new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
  })
}

const getWeekStartManila = () => {
  const now = new Date()
  const manilaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }))
  const dayOfWeek = manilaDate.getDay()
  const diff = manilaDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(manilaDate.setDate(diff))
  return weekStart.toISOString().split("T")[0]
}

const getWeekEndManila = () => {
  const weekStart = new Date(getWeekStartManila())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return weekEnd.toISOString().split("T")[0]
}

const isDateInCurrentWeek = (dateString: string) => {
  const date = new Date(dateString)
  const weekStart = new Date(getWeekStartManila())
  const weekEnd = new Date(getWeekEndManila())
  return date >= weekStart && date <= weekEnd
}

const getCurrentWeekDays = () => {
  const weekStart = getWeekStartManila()
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const weekDays = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    weekDays.push({
      day: days[i],
      date: date.toISOString().split("T")[0],
      isToday: days[i] === getCurrentDayManila(),
      isPast: date < new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }).split(",")[0]),
    })
  }

  return weekDays
}

const defaultDashboardData = {
  startingBalance: 12450.75,
  totalBalance: 12450.75,
  dailyIncomeGoal: 1100.0,
  weeklyExpenses: 3850.25,
  weeklyPayables: 1450.0,
  currency: "₱",
}

const defaultBudgetCategories = [
  { id: 1, name: "Food", budgeted: 600, spent: 520, color: "from-emerald-500 to-teal-500" },
  { id: 2, name: "Transport", budgeted: 320, spent: 265, color: "from-blue-500 to-indigo-500" },
  { id: 3, name: "Entertainment", budgeted: 240, spent: 180, color: "from-purple-500 to-pink-500" },
  { id: 4, name: "Shopping", budgeted: 400, spent: 350, color: "from-orange-500 to-red-500" },
  { id: 5, name: "Bills", budgeted: 800, spent: 720, color: "from-yellow-500 to-orange-500" },
]

const defaultWeeklyPayables = [
  { id: 1, name: "Groceries", amount: 500, dueDay: "Monday", status: "pending", week: "This Week" },
  { id: 2, name: "Gas/Transport", amount: 200, dueDay: "Wednesday", status: "pending", week: "This Week" },
  { id: 3, name: "Phone Bill", amount: 100, dueDay: "Friday", status: "paid", week: "This Week" },
  { id: 4, name: "Internet", amount: 150, dueDay: "Sunday", status: "pending", week: "This Week" },
  { id: 5, name: "Rent Share", amount: 800, dueDay: "Monday", status: "pending", week: "Next Week" },
]

const defaultTransactions = [
  {
    id: 1,
    description: "Daily Work",
    amount: 1100,
    type: "income",
    category: "Work",
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: 2,
    description: "Lunch",
    amount: -60,
    type: "expense",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
  },
]

const defaultExpenseCategories = ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Other"]

const initializeDailyIncome = () => {
  const weekDays = getCurrentWeekDays()
  return weekDays.map((dayInfo) => ({
    day: dayInfo.day,
    amount: dayInfo.isPast ? Math.random() * 400 + 800 : 0,
    goal: dayInfo.isWorkDay === false ? 0 : 1100,
    date: dayInfo.date,
    isToday: dayInfo.isToday,
    isPast: dayInfo.isPast,
    isWorkDay: dayInfo.day !== "Sun",
  }))
}

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

const getStoredData = (key: string, defaultValue: any) => {
  if (typeof window === "undefined") return defaultValue
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error(`Error loading ${key}:`, error)
  }
  return defaultValue
}

const initializeAppData = () => {
  if (typeof window === "undefined") {
    return {
      dashboardData: defaultDashboardData,
      budgetCategories: defaultBudgetCategories,
      weeklyPayables: defaultWeeklyPayables,
      transactions: defaultTransactions,
      dailyIncome: initializeDailyIncome(),
      expenseCategories: defaultExpenseCategories,
    }
  }

  const saved = getStoredData("dailyBudgetAppData", null)

  if (saved) {
    const loadedDashboard = saved.dashboardData || defaultDashboardData
    if (!loadedDashboard.startingBalance) {
      loadedDashboard.startingBalance = loadedDashboard.totalBalance || defaultDashboardData.startingBalance
    }

    const savedDailyIncome = saved.dailyIncome || []
    const currentWeekDays = getCurrentWeekDays()
    const loadedDailyIncome = currentWeekDays.map((dayInfo) => {
      const savedDay = savedDailyIncome.find((d: any) => d.date === dayInfo.date)
      return {
        day: dayInfo.day,
        amount: savedDay?.amount || 0,
        goal: savedDay?.isWorkDay === false ? 0 : savedDay?.goal || 1100,
        date: dayInfo.date,
        isToday: dayInfo.isToday,
        isPast: dayInfo.isPast,
        isWorkDay: savedDay?.isWorkDay !== undefined ? savedDay.isWorkDay : dayInfo.day !== "Sun",
      }
    })

    return {
      dashboardData: loadedDashboard,
      budgetCategories: saved.budgetCategories || defaultBudgetCategories,
      weeklyPayables: saved.weeklyPayables || defaultWeeklyPayables,
      transactions: saved.transactions || defaultTransactions,
      dailyIncome: loadedDailyIncome,
      expenseCategories: getStoredData("expenseCategories", defaultExpenseCategories),
    }
  }

  return {
    dashboardData: defaultDashboardData,
    budgetCategories: defaultBudgetCategories,
    weeklyPayables: defaultWeeklyPayables,
    transactions: defaultTransactions,
    dailyIncome: initializeDailyIncome(),
    expenseCategories: defaultExpenseCategories,
  }
}

const safeToLocaleString = (value: any): string => {
  const num = Number(value)
  return isNaN(num) ? "0" : num.toLocaleString()
}

export default function BudgetingApp() {
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [currentTime, setCurrentTime] = useState("")
  const [quickActionType, setQuickActionType] = useState<"income" | "expense" | "bills" | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)

  const initialData = initializeAppData()
  const [dashboardData, setDashboardData] = useState(initialData.dashboardData)
  const [budgetCategories, setBudgetCategories] = useState(initialData.budgetCategories)
  const [weeklyPayables, setWeeklyPayables] = useState(initialData.weeklyPayables)
  const [transactions, setTransactions] = useState(initialData.transactions)
  const [dailyIncome, setDailyIncome] = useState(initialData.dailyIncome)
  const [expenseCategories, setExpenseCategories] = useState(initialData.expenseCategories)

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  const refreshData = () => {
    setDataVersion((v) => v + 1)
  }

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(getManilaTime())
  }, [])

  useEffect(() => {
    if (!isClient) return
    const timer = setInterval(() => {
      setCurrentTime(getManilaTime())
    }, 60000)
    return () => clearInterval(timer)
  }, [isClient])

  useEffect(() => {
    if (!isClient) return
    const dataToSave = {
      dashboardData,
      budgetCategories,
      weeklyPayables,
      transactions,
      dailyIncome,
    }
    safeLocalStorage.setItem("dailyBudgetAppData", JSON.stringify(dataToSave))
  }, [dashboardData, budgetCategories, weeklyPayables, transactions, dailyIncome, isClient, dataVersion])

  useEffect(() => {
    if (!isClient) return
    safeLocalStorage.setItem("expenseCategories", JSON.stringify(expenseCategories))
  }, [expenseCategories, isClient])

  const currency = dashboardData?.currency || "₱"
  const workDays = Array.isArray(dailyIncome) ? dailyIncome.filter((day) => day?.isWorkDay && (day?.goal || 0) > 0) : []
  const weeklyEarned = workDays.reduce((sum, day) => sum + (day?.amount || 0), 0)
  const weeklyGoal = workDays.reduce((sum, day) => sum + (day?.goal || 0), 0)
  const goalProgress = weeklyGoal > 0 ? (weeklyEarned / weeklyGoal) * 100 : 0

  const todayData = Array.isArray(dailyIncome) ? dailyIncome.find((day) => day?.isToday) : null
  const todayIncome = todayData?.amount || 0
  const todayGoal = todayData?.isWorkDay ? todayData?.goal || 1100 : 0

  const currentWeekExpenses = Array.isArray(transactions)
    ? transactions
        .filter((t) => t?.type === "expense" && new Date(t?.date || "") >= new Date(getWeekStartManila()))
        .reduce((sum, t) => sum + Math.abs(t?.amount || 0), 0)
    : 0

  const thisWeekExpenseTransactions = Array.isArray(transactions)
    ? transactions
        .filter((t) => t?.type === "expense" && new Date(t?.date || "") >= new Date(getWeekStartManila()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : []

  const updatedBudgetCategories = Array.isArray(budgetCategories)
    ? budgetCategories.map((category) => {
        const categoryExpenses = Array.isArray(transactions)
          ? transactions
              .filter((t) => t?.type === "expense" && t?.category === category?.name)
              .reduce((sum, t) => sum + Math.abs(t?.amount || 0), 0)
          : 0
        return { ...category, spent: categoryExpenses }
      })
    : []

  const getMonthlyPayablesForCurrentWeek = () => {
    const monthlyPayables = JSON.parse(safeLocalStorage.getItem("monthlyPayables") || "{}")
    const currentDate = new Date()
    const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`
    const currentMonthPayables = monthlyPayables[currentMonthKey] || []

    return currentMonthPayables
      .filter((payable: any) => {
        if (payable.date) {
          return isDateInCurrentWeek(payable.date)
        }
        return false
      })
      .map((payable: any) => ({
        ...payable,
        week: "This Week",
        source: "monthly",
      }))
  }

  const allCurrentWeekPayables = [...weeklyPayables, ...getMonthlyPayablesForCurrentWeek()]
  const totalWeeklyPayables = allCurrentWeekPayables.reduce((sum, payable) => sum + (payable?.amount || 0), 0)
  const pendingPayables = allCurrentWeekPayables.filter((p) => p?.status === "pending")
  const totalPendingPayables = pendingPayables.reduce((sum, payable) => sum + (payable?.amount || 0), 0)
  const remainingWorkDays = workDays.filter((day) => !day?.isPast && !day?.isToday)
  const potentialRemainingEarnings = remainingWorkDays.reduce((sum, day) => sum + (day?.goal || 0), 0)
  const thisWeekProjectedSavings = weeklyEarned + potentialRemainingEarnings - totalWeeklyPayables - currentWeekExpenses
  const startingBalance = dashboardData?.startingBalance || 0

  const totalIncome = Array.isArray(transactions)
    ? transactions.filter((t) => t?.type === "income").reduce((sum, t) => sum + (t?.amount || 0), 0)
    : 0
  const totalExpenses = Array.isArray(transactions)
    ? transactions.filter((t) => t?.type === "expense").reduce((sum, t) => sum + Math.abs(t?.amount || 0), 0)
    : 0

  const cashOnHand = startingBalance + totalIncome - totalExpenses

  const handlePayment = (payableId: number, amount: number) => {
    const updatedPayables = weeklyPayables.map((payable) => {
      if (payable.id === payableId) {
        const newPaidCount = (payable.paidCount || 0) + 1
        let newStatus = "paid"

        if (payable.frequency === "twice-monthly" && newPaidCount >= 2) {
          newStatus = "completed"
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

    setWeeklyPayables(updatedPayables)

    const paymentTransaction = {
      id: Date.now(),
      description: `Payment: ${weeklyPayables.find((p) => p.id === payableId)?.name || "Bill"}`,
      amount: -amount,
      type: "expense" as const,
      category: "Bills",
      date: new Date().toISOString().split("T")[0],
    }

    setTransactions((prev) => [paymentTransaction, ...prev])
    refreshData()
  }

  const clearAllData = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Are you sure you want to clear all data? This action cannot be undone.")
    ) {
      safeLocalStorage.removeItem("dailyBudgetAppData")
      safeLocalStorage.removeItem("monthlyPayables")
      safeLocalStorage.removeItem("biweeklyPayables")
      safeLocalStorage.removeItem("weeklyPayablesHistory")
      safeLocalStorage.removeItem("expenseCategories")

      setDashboardData({
        startingBalance: 0,
        totalBalance: 0,
        dailyIncomeGoal: 1100.0,
        weeklyExpenses: 0,
        weeklyPayables: 0,
        currency: "₱",
      })
      setBudgetCategories([])
      setWeeklyPayables([])
      setTransactions([])
      setExpenseCategories(defaultExpenseCategories)

      const resetDailyIncome = initializeDailyIncome().map((day) => ({
        ...day,
        amount: 0,
      }))
      setDailyIncome(resetDailyIncome)
      refreshData()
    }
  }

  const aiActionHandlers = {
    addIncome: (amount: number, description?: string, date?: string) => {
      const targetDate = date || new Date().toISOString().split("T")[0]
      const transaction = {
        id: Date.now() + Math.random(), // Ensure unique ID
        description: description || "work",
        amount: amount,
        type: "income" as const,
        category: "Work",
        date: targetDate,
      }
      setTransactions((prev) => [transaction, ...prev])

      // Update daily income for the target date
      setDailyIncome((prev) => {
        const dayIndex = prev.findIndex((d) => d.date === targetDate)
        if (dayIndex !== -1) {
          const updated = [...prev]
          updated[dayIndex] = {
            ...updated[dayIndex],
            amount: updated[dayIndex].amount + amount,
          }
          return updated
        }
        return prev
      })
      refreshData()
    },

    addExpense: (amount: number, category: string, description?: string, date?: string) => {
      const targetDate = date || new Date().toISOString().split("T")[0]
      const transaction = {
        id: Date.now() + Math.random(),
        description: description || category,
        amount: -Math.abs(amount),
        type: "expense" as const,
        category: category,
        date: targetDate,
      }
      setTransactions((prev) => [transaction, ...prev])
      refreshData()
    },

    deleteTransaction: (index: number) => {
      if (index < 0 || index >= transactions.length) return false
      setTransactions((prev) => prev.filter((_, i) => i !== index))
      refreshData()
      return true
    },

    editTransaction: (index: number, updates: Partial<any>) => {
      if (index < 0 || index >= transactions.length) return false
      setTransactions((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], ...updates }
        return updated
      })
      refreshData()
      return true
    },

    modifyBalance: (newBalance: number) => {
      setDashboardData((prev) => ({ ...prev, startingBalance: newBalance }))
      refreshData()
    },

    updateGoal: (goalType: "daily" | "weekly", newGoal: number) => {
      if (goalType === "daily") {
        setDashboardData((prev) => ({ ...prev, dailyIncomeGoal: newGoal }))
        setDailyIncome((prev) =>
          prev.map((day) => ({
            ...day,
            goal: day.isWorkDay ? newGoal : 0,
          })),
        )
      }
      refreshData()
    },

    setDailyIncome: (date: string, amount: number) => {
      setDailyIncome((prev) => {
        const dayIndex = prev.findIndex((d) => d.date === date)
        if (dayIndex !== -1) {
          const updated = [...prev]
          updated[dayIndex] = {
            ...updated[dayIndex],
            amount: amount,
          }
          return updated
        }
        return prev
      })
      refreshData()
      return true
    },

    setWorkDay: (date: string, isWorkDay: boolean, goal?: number) => {
      setDailyIncome((prev) => {
        const dayIndex = prev.findIndex((d) => d.date === date)
        if (dayIndex !== -1) {
          const updated = [...prev]
          updated[dayIndex] = {
            ...updated[dayIndex],
            isWorkDay: isWorkDay,
            goal: isWorkDay ? goal || 1100 : 0,
          }
          return updated
        }
        return prev
      })
      refreshData()
      return true
    },

    addIncomeMultiple: (entries: Array<{ date: string; amount: number; description?: string }>) => {
      entries.forEach((entry) => {
        aiActionHandlers.addIncome(entry.amount, entry.description || "work", entry.date)
      })
    },

    addPayable: (name: string, amount: number, dueDay: string, frequency?: string) => {
      const newPayable = {
        id: Date.now(),
        name,
        amount,
        dueDay,
        status: "pending" as const,
        week: "This Week",
        frequency: frequency || "once",
        paidCount: 0,
      }
      setWeeklyPayables((prev) => [...prev, newPayable])
      refreshData()
      return true
    },

    addMonthlyPayable: (name: string, amount: number, dayOfMonth: number) => {
      const monthlyPayables = JSON.parse(safeLocalStorage.getItem("monthlyPayables") || "{}")
      const currentDate = new Date()
      const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`

      if (!monthlyPayables[currentMonthKey]) {
        monthlyPayables[currentMonthKey] = []
      }

      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOfMonth)

      monthlyPayables[currentMonthKey].push({
        id: Date.now(),
        name,
        amount,
        date: dueDate.toISOString().split("T")[0],
        status: "pending",
        frequency: "monthly",
      })

      safeLocalStorage.setItem("monthlyPayables", JSON.stringify(monthlyPayables))
      refreshData()
      return true
    },

    markBillAsPaid: (billName: string) => {
      const weeklyBill = weeklyPayables.find((p) => p.name.toLowerCase().includes(billName.toLowerCase()))
      if (weeklyBill) {
        handlePayment(weeklyBill.id, weeklyBill.amount)
        refreshData()
        return true
      }

      const monthlyBills = getMonthlyPayablesForCurrentWeek()
      const monthlyBill = monthlyBills.find((p: any) => p.name.toLowerCase().includes(billName.toLowerCase()))
      if (monthlyBill) {
        handlePayment(monthlyBill.id, monthlyBill.amount)
        refreshData()
        return true
      }

      return false
    },

    deleteBill: (billName: string) => {
      const filtered = weeklyPayables.filter((p) => !p.name.toLowerCase().includes(billName.toLowerCase()))
      if (filtered.length !== weeklyPayables.length) {
        setWeeklyPayables(filtered)
        refreshData()
        return true
      }
      return false
    },

    editPayable: (billName: string, updates: Partial<any>) => {
      setWeeklyPayables((prev) => {
        const index = prev.findIndex((p) => p.name.toLowerCase().includes(billName.toLowerCase()))
        if (index !== -1) {
          const updated = [...prev]
          updated[index] = { ...updated[index], ...updates }
          return updated
        }
        return prev
      })
      refreshData()
      return true
    },

    addExpenseCategory: (category: string) => {
      if (!expenseCategories.includes(category)) {
        setExpenseCategories((prev) => [...prev, category])
        refreshData()
        return true
      }
      return false
    },

    clearAllData: () => {
      clearAllData()
    },

    getAppData: () => ({
      cashOnHand,
      startingBalance,
      weeklyEarned,
      weeklyGoal,
      goalProgress,
      todayIncome,
      todayGoal,
      currentWeekExpenses,
      totalPendingPayables,
      dailyIncome: dailyIncome.map((d) => ({
        day: d.day,
        date: d.date,
        amount: d.amount,
        goal: d.goal,
        isWorkDay: d.isWorkDay,
        isToday: d.isToday,
        isPast: d.isPast,
      })),
      pendingPayables: pendingPayables.map((p) => ({
        name: p.name,
        amount: p.amount,
        dueDay: p.dueDay,
        status: p.status,
      })),
      thisWeekExpenses: thisWeekExpenseTransactions.map((e) => ({
        description: e.description,
        amount: Math.abs(e.amount),
        category: e.category,
        date: e.date,
      })),
      allTransactions: transactions,
      allPayables: weeklyPayables,
      remainingWorkDays: remainingWorkDays.length,
      potentialRemainingEarnings,
      thisWeekProjectedSavings,
      currency,
    }),

    refreshData,
  }

  const handlePlusMouseDown = () => {
    setIsLongPressing(true)
    longPressTimerRef.current = setTimeout(() => {
      setShowAI(true)
      setIsLongPressing(false)
    }, 500)
  }

  const handlePlusMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }

    if (!isLongPressing) {
      return
    }

    setQuickActionType(null)
    setShowAddTransaction(true)
    setIsLongPressing(false)
  }

  const handlePlusMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
    setIsLongPressing(false)
  }

  const handlePlusTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsLongPressing(true)
    longPressTimerRef.current = setTimeout(() => {
      setShowAI(true)
      setIsLongPressing(false)
    }, 500)
  }

  const handlePlusTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }

    if (!isLongPressing) {
      return
    }

    setQuickActionType(null)
    setShowAddTransaction(true)
    setIsLongPressing(false)
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Daily Budget...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <OfflineIndicator />
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg min-h-screen relative">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Daily Budget v117</h1>
              <p className="text-purple-100 text-xs">Manila Time: {currentTime}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAI(true)}
                className="text-white hover:bg-white/20"
              >
                <Bot className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="text-white hover:bg-white/20"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <InstallPrompt />
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-purple-100">
                Today's Earnings ({getCurrentDayManila()})
                {!todayData?.isWorkDay && <span className="text-xs"> - Rest Day</span>}
              </span>
              <span className="text-xs text-purple-200">
                Goal: {currency}
                {safeToLocaleString(todayGoal)}
              </span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {currency}
              {safeToLocaleString(todayIncome)}
            </div>
            {todayGoal > 0 ? (
              <>
                <Progress value={(todayIncome / todayGoal) * 100} className="h-2 bg-white/20" />
                <div className="flex justify-between text-xs text-purple-200 mt-1">
                  <span>
                    {currency}
                    {safeToLocaleString(todayIncome)} earned
                  </span>
                  <span>{((todayIncome / todayGoal) * 100).toFixed(0)}%</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-purple-200 mt-1">Rest Day - No Goal Set</div>
            )}
          </div>
        </div>

        <div className="p-4 pb-28">
          {activeTab === "home" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <OptimizedCard
                  title="Cash on Hand"
                  value={`${currency}${safeToLocaleString(cashOnHand)}`}
                  icon={Wallet}
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                  iconColor="text-emerald-200"
                />
                <OptimizedCard
                  title="Future Balance"
                  value={`${currency}${safeToLocaleString(cashOnHand + potentialRemainingEarnings - totalPendingPayables)}`}
                  subtitle="(this week)"
                  icon={TrendingUp}
                  gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                  iconColor="text-blue-200"
                />
              </div>

              <Card className="bg-white/80 backdrop-blur-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-800">Weekly Progress (Work Days Only)</CardTitle>
                  <CardDescription>Your earnings vs goals this week ({workDays.length} work days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{goalProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={goalProgress} className="h-3" />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>
                        {currency}
                        {safeToLocaleString(weeklyEarned)} earned
                      </span>
                      <span>
                        {currency}
                        {safeToLocaleString(weeklyGoal)} goal
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <OptimizedCard
                  title="If Goals Met"
                  value={`${currency}${safeToLocaleString(cashOnHand + potentialRemainingEarnings)}`}
                  subtitle="Projected Balance"
                  icon={TrendingUp}
                  gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                  iconColor="text-green-200"
                />
                <OptimizedCard
                  title="This Week's"
                  value={`${currency}${safeToLocaleString(thisWeekProjectedSavings)}`}
                  subtitle="Projected Savings"
                  icon={TrendingDown}
                  gradient="bg-gradient-to-br from-orange-500 to-red-600"
                  iconColor="text-orange-200"
                />
              </div>

              <DailyIncomeChart dailyIncome={dailyIncome} currency={currency} />

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowAddTransaction(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-12"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Income
                </Button>
                <Button onClick={() => setActiveTab("payables")} variant="outline" className="h-12 bg-white/80">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Bills
                </Button>
              </div>
            </div>
          )}

          {activeTab === "income" && (
            <div className="space-y-4">
              <DailyIncomeChart dailyIncome={dailyIncome} currency={currency} />

              <Card className="bg-white/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-gray-800">Daily Breakdown - Current Week</CardTitle>
                  <CardDescription>Week starting {getWeekStartManila()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(dailyIncome) &&
                      dailyIncome.map((day, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            day?.isToday
                              ? "bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300"
                              : day?.isPast
                                ? "bg-gradient-to-r from-gray-50 to-blue-50"
                                : "bg-gradient-to-r from-yellow-50 to-orange-50"
                          } ${!day?.isWorkDay ? "opacity-60" : ""}`}
                        >
                          <div>
                            <p className="font-medium text-gray-800 flex items-center gap-2">
                              {day?.day} {day?.isToday && "(Today)"}
                              {!day?.isWorkDay && (
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Rest Day</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-600">
                              Goal: {currency}
                              {safeToLocaleString(day?.goal)}
                            </p>
                            <p className="text-xs text-gray-500">{day?.date}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-bold text-lg ${
                                !day?.isWorkDay
                                  ? "text-gray-400"
                                  : (day?.amount || 0) >= (day?.goal || 0)
                                    ? "text-green-600"
                                    : day?.isPast
                                      ? "text-red-600"
                                      : "text-orange-600"
                              }`}
                            >
                              {currency}
                              {safeToLocaleString(day?.amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {day?.isWorkDay && (day?.goal || 0) > 0
                                ? `${(((day?.amount || 0) / (day?.goal || 1)) * 100).toFixed(0)}%`
                                : "N/A"}
                            </p>
                            {day?.isPast && (day?.amount || 0) === 0 && day?.isWorkDay && (
                              <p className="text-xs text-red-500">No earnings</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    This Week's Expenses
                  </CardTitle>
                  <CardDescription>All expenses logged from {getWeekStartManila()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {thisWeekExpenseTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No expenses logged this week.</p>
                      <p className="text-sm">Add expenses to track your spending.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        {thisWeekExpenseTransactions.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{expense.description}</p>
                              <p className="text-xs text-gray-500">
                                {expense.date} • {expense.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">
                                {currency}
                                {safeToLocaleString(Math.abs(expense.amount))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t-2 border-gray-200 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-800">Weekly Total:</span>
                          <span className="text-2xl font-bold text-red-600">
                            {currency}
                            {safeToLocaleString(currentWeekExpenses)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "payables" && (
            <div className="space-y-4">
              <WeeklyPayablesCard
                weeklyPayables={allCurrentWeekPayables}
                setWeeklyPayables={setWeeklyPayables}
                currency={currency}
                onPayment={handlePayment}
              />
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="space-y-4">
              <TransactionList transactions={transactions} currency={currency} />
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-lg border-t border-white/20 shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-center py-2 px-4">
            <div className="flex flex-1 justify-around">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("home")}
                className={`flex flex-col items-center py-3 ${activeTab === "home" ? "text-purple-600" : "text-gray-600"}`}
              >
                <Home className="w-4 h-4 mb-1" />
                <span className="text-xs">Home</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("income")}
                className={`flex flex-col items-center py-3 ${activeTab === "income" ? "text-purple-600" : "text-gray-600"}`}
              >
                <DollarSign className="w-4 h-4 mb-1" />
                <span className="text-xs">Income</span>
              </Button>
            </div>

            <div className="mx-4">
              <Button
                onMouseDown={handlePlusMouseDown}
                onMouseUp={handlePlusMouseUp}
                onMouseLeave={handlePlusMouseLeave}
                onTouchStart={handlePlusTouchStart}
                onTouchEnd={handlePlusTouchEnd}
                className={`w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${isLongPressing ? "scale-110" : "hover:scale-110"}`}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex flex-1 justify-around">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("expenses")}
                className={`flex flex-col items-center py-3 ${activeTab === "expenses" ? "text-purple-600" : "text-gray-600"}`}
              >
                <TrendingDown className="w-4 h-4 mb-1" />
                <span className="text-xs">Expenses</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("payables")}
                className={`flex flex-col items-center py-3 ${activeTab === "payables" ? "text-purple-600" : "text-gray-600"}`}
              >
                <CreditCard className="w-4 h-4 mb-1" />
                <span className="text-xs">Bills</span>
              </Button>
            </div>
          </div>
        </div>

        <AddTransactionDialog
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
          onAddTransaction={(transaction) => {
            setTransactions([{ ...transaction, id: Date.now() }, ...transactions])
            if (transaction.type === "income") {
              const today = getCurrentDayManila()
              const todayIndex = dailyIncome.findIndex((d) => d.day === today)
              if (todayIndex !== -1) {
                const updated = [...dailyIncome]
                updated[todayIndex] = {
                  ...updated[todayIndex],
                  amount: updated[todayIndex].amount + transaction.amount,
                }
                setDailyIncome(updated)
              }
            }
            refreshData()
          }}
          budgetCategories={budgetCategories}
          expenseCategories={expenseCategories}
          currency={currency}
          defaultDescription="work"
        />

        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          dashboardData={dashboardData}
          setDashboardData={setDashboardData}
          budgetCategories={budgetCategories}
          setBudgetCategories={setBudgetCategories}
          weeklyPayables={weeklyPayables}
          setWeeklyPayables={setWeeklyPayables}
          transactions={transactions}
          setTransactions={setTransactions}
          dailyIncome={dailyIncome}
          setDailyIncome={setDailyIncome}
          expenseCategories={expenseCategories}
          setExpenseCategories={setExpenseCategories}
          currency={currency}
          clearAllData={clearAllData}
        />

        {showNotifications && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Enhanced Notifications</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                    className="text-white hover:bg-white/20"
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <NotificationManager
                  weeklyPayables={allCurrentWeekPayables}
                  dailyIncome={dailyIncome}
                  currency={currency}
                />
              </div>
            </div>
          </div>
        )}

        <AIAssistant
          open={showAI}
          onOpenChange={setShowAI}
          appData={aiActionHandlers.getAppData()}
          actionHandlers={aiActionHandlers}
        />
      </div>
    </div>
  )
}
