"use client"

import { useState, useEffect } from "react"
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
  Sparkles,
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
import { Badge } from "@/components/ui/badge"

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

// Helper function to get current day of week in Manila
const getCurrentDayManila = () => {
  return new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
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

// Helper function to get week end date in Manila
const getWeekEndManila = () => {
  const weekStart = new Date(getWeekStartManila())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // Sunday
  return weekEnd.toISOString().split("T")[0]
}

// Helper function to check if date is in current week
const isDateInCurrentWeek = (dateString: string) => {
  const date = new Date(dateString)
  const weekStart = new Date(getWeekStartManila())
  const weekEnd = new Date(getWeekEndManila())
  return date >= weekStart && date <= weekEnd
}

// Helper function to get days of current week with Manila dates
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

// Default data - focused on daily earnings in PHP with updated daily goal
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
    goal: dayInfo.day === "Sun" ? 0 : 1100,
    date: dayInfo.date,
    isToday: dayInfo.isToday,
    isPast: dayInfo.isPast,
    isWorkDay: dayInfo.day !== "Sun",
    isFinalForDay: false, // Track if earnings are final for the day
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

  const [dashboardData, setDashboardData] = useState(defaultDashboardData)
  const [budgetCategories, setBudgetCategories] = useState(defaultBudgetCategories)
  const [weeklyPayables, setWeeklyPayables] = useState(defaultWeeklyPayables)
  const [transactions, setTransactions] = useState(defaultTransactions)
  const [dailyIncome, setDailyIncome] = useState(() => initializeDailyIncome())
  const [expenseCategories, setExpenseCategories] = useState(defaultExpenseCategories)

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

    const savedData = safeLocalStorage.getItem("dailyBudgetAppData")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        const loadedData = parsed.dashboardData || defaultDashboardData
        if (!loadedData.startingBalance) {
          loadedData.startingBalance = loadedData.totalBalance || defaultDashboardData.startingBalance
        }
        setDashboardData(loadedData)
        setBudgetCategories(parsed.budgetCategories || defaultBudgetCategories)
        setWeeklyPayables(parsed.weeklyPayables || defaultWeeklyPayables)
        setTransactions(parsed.transactions || defaultTransactions)

        const savedDailyIncome = parsed.dailyIncome || []
        const currentWeekDays = getCurrentWeekDays()
        const updatedDailyIncome = currentWeekDays.map((dayInfo) => {
          const savedDay = savedDailyIncome.find((d: any) => d.date === dayInfo.date)
          return {
            day: dayInfo.day,
            amount: savedDay?.amount || 0,
            goal: savedDay?.isWorkDay === false ? 0 : savedDay?.goal || 1100,
            date: dayInfo.date,
            isToday: dayInfo.isToday,
            isPast: dayInfo.isPast,
            isWorkDay: savedDay?.isWorkDay !== undefined ? savedDay.isWorkDay : dayInfo.day !== "Sun",
            isFinalForDay: savedDay?.isFinalForDay || false,
          }
        })
        setDailyIncome(updatedDailyIncome)
      } catch (error) {
        console.error("Error loading saved data:", error)
      }
    }

    const savedExpenseCategories = safeLocalStorage.getItem("expenseCategories")
    if (savedExpenseCategories) {
      try {
        setExpenseCategories(JSON.parse(savedExpenseCategories))
      } catch (error) {
        console.error("Error loading expense categories:", error)
      }
    }
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
  }, [dashboardData, budgetCategories, weeklyPayables, transactions, dailyIncome, isClient])

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
  const todayIsFinal = todayData?.isFinalForDay || false

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
    const monthlyPayables = JSON.parse(safeLocalStorage.getItem("monthlyPayables") || "[]")
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()

    return monthlyPayables
      .filter((payable: any) => {
        const dueDate = new Date(currentYear, currentMonth, payable.dayOfMonth)
        const dueDateString = dueDate.toISOString().split("T")[0]
        return isDateInCurrentWeek(dueDateString)
      })
      .map((payable: any) => ({
        ...payable,
        week: "This Week",
        source: "monthly",
        dueDay: new Date(currentYear, currentMonth, payable.dayOfMonth).toLocaleDateString("en-US", {
          weekday: "long",
        }),
        date: new Date(currentYear, currentMonth, payable.dayOfMonth).toISOString().split("T")[0],
      }))
  }

  const allCurrentWeekPayables = [...weeklyPayables, ...getMonthlyPayablesForCurrentWeek()]

  const totalWeeklyPayables = allCurrentWeekPayables.reduce((sum, payable) => sum + (payable?.amount || 0), 0)
  const pendingPayables = allCurrentWeekPayables.filter((p) => p?.status === "pending")
  const totalPendingPayables = pendingPayables.reduce((sum, payable) => sum + (payable?.amount || 0), 0)

  // IMPROVED: Calculate remaining earnings with "final" day logic
  const remainingWorkDays = workDays.filter((day) => {
    // Don't count past days
    if (day?.isPast) return false
    // Don't count today if it's marked as final
    if (day?.isToday && day?.isFinalForDay) return false
    // Don't count today in remaining (it's current)
    if (day?.isToday) return false
    return true
  })

  const potentialRemainingEarnings = remainingWorkDays.reduce((sum, day) => sum + (day?.goal || 0), 0)

  // Add today's remaining potential if not final
  const todayRemainingPotential =
    todayData && !todayIsFinal && todayData.isWorkDay ? Math.max(0, todayGoal - todayIncome) : 0

  const totalPotentialRemainingEarnings = potentialRemainingEarnings + todayRemainingPotential

  const thisWeekProjectedSavings =
    weeklyEarned + totalPotentialRemainingEarnings - totalWeeklyPayables - currentWeekExpenses

  const startingBalance = dashboardData?.startingBalance || 0

  const totalIncome = Array.isArray(transactions)
    ? transactions.filter((t) => t?.type === "income").reduce((sum, t) => sum + (t?.amount || 0), 0)
    : 0
  const totalExpenses = Array.isArray(transactions)
    ? transactions.filter((t) => t?.type === "expense").reduce((sum, t) => sum + Math.abs(t?.amount || 0), 0)
    : 0

  const cashOnHand = startingBalance + totalIncome - totalExpenses

  const handlePayment = (payableId: number, amount: number, source?: string) => {
    if (source === "monthly") {
      const monthlyPayables = JSON.parse(safeLocalStorage.getItem("monthlyPayables") || "[]")
      const updatedMonthlyPayables = monthlyPayables.map((payable: any) =>
        payable.id === payableId ? { ...payable, status: "paid" } : payable,
      )
      safeLocalStorage.setItem("monthlyPayables", JSON.stringify(updatedMonthlyPayables))
    } else {
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
    }

    const payableName =
      source === "monthly"
        ? getMonthlyPayablesForCurrentWeek().find((p) => p.id === payableId)?.name
        : weeklyPayables.find((p) => p.id === payableId)?.name

    const paymentTransaction = {
      id: Date.now(),
      description: `Payment: ${payableName || "Bill"}`,
      amount: -amount,
      type: "expense" as const,
      category: "Bills",
      date: new Date().toISOString().split("T")[0],
    }

    setTransactions((prev) => [paymentTransaction, ...prev])
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
    }
  }

  // AI Action Handlers - These functions can be called by the AI
  const aiActionHandlers = {
    addIncome: (amount: number, description?: string, isFinal?: boolean) => {
      const transaction = {
        id: Date.now(),
        description: description || "work",
        amount: amount,
        type: "income" as const,
        category: "Work",
        date: new Date().toISOString().split("T")[0],
        isFinalForDay: isFinal,
      }
      setTransactions((prev) => [transaction, ...prev])

      const today = getCurrentDayManila()
      const todayIndex = dailyIncome.findIndex((d) => d.day === today)
      if (todayIndex !== -1) {
        const updated = [...dailyIncome]
        updated[todayIndex] = {
          ...updated[todayIndex],
          amount: updated[todayIndex].amount + amount,
          isFinalForDay: isFinal || updated[todayIndex].isFinalForDay,
        }
        setDailyIncome(updated)
      }
    },

    addExpense: (amount: number, category: string, description?: string) => {
      const transaction = {
        id: Date.now(),
        description: description || category,
        amount: -Math.abs(amount),
        type: "expense" as const,
        category: category,
        date: new Date().toISOString().split("T")[0],
      }
      setTransactions((prev) => [transaction, ...prev])
    },

    markBillAsPaid: (billName: string) => {
      const weeklyBill = weeklyPayables.find((p) => p.name.toLowerCase().includes(billName.toLowerCase()))
      if (weeklyBill) {
        handlePayment(weeklyBill.id, weeklyBill.amount, weeklyBill.source)
        return true
      }

      const monthlyBills = getMonthlyPayablesForCurrentWeek()
      const monthlyBill = monthlyBills.find((p) => p.name.toLowerCase().includes(billName.toLowerCase()))
      if (monthlyBill) {
        handlePayment(monthlyBill.id, monthlyBill.amount, "monthly")
        return true
      }

      return false
    },

    getAppData: () => ({
      cashOnHand,
      startingBalance,
      weeklyEarned,
      weeklyGoal,
      goalProgress,
      todayIncome,
      todayGoal,
      todayIsFinal,
      todayRemainingPotential,
      currentWeekExpenses,
      totalPendingPayables,
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
      remainingWorkDays: remainingWorkDays.length,
      potentialRemainingEarnings: totalPotentialRemainingEarnings,
      thisWeekProjectedSavings,
      currency,
    }),
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
              <h1 className="text-2xl font-bold">Daily Budget v100</h1>
              <p className="text-purple-100 text-xs">Manila Time: {currentTime}</p>
            </div>
            <div className="flex gap-2">
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
                {todayIsFinal && <span className="text-xs"> - ✓ Final</span>}
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
                {todayIsFinal && (
                  <div className="mt-2 text-xs text-purple-100 bg-white/10 px-2 py-1 rounded">
                    ✓ Earnings marked as final for today
                  </div>
                )}
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
                  value={`${currency}${safeToLocaleString(cashOnHand + totalPotentialRemainingEarnings - totalPendingPayables)}`}
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
                  value={`${currency}${safeToLocaleString(cashOnHand + totalPotentialRemainingEarnings)}`}
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
                              {day?.isFinalForDay && (
                                <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">✓ Final</span>
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

            <div className="mx-4 relative">
              <Button
                onClick={() => setShowAI(true)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              >
                <Bot className="w-6 h-6" />
              </Button>
              <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1.5 py-0.5 text-[10px] animate-pulse">
                <Sparkles className="w-2.5 h-2.5" />
              </Badge>
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
                  isFinalForDay: transaction.isFinalForDay || updated[todayIndex].isFinalForDay,
                }
                setDailyIncome(updated)
              }
            }
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
