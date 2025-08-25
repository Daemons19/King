"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingDown, Plus, Settings, Wallet, Home, DollarSign, CreditCard, TrendingUp, Bell } from "lucide-react"
import { SpendingChart } from "../components/spending-chart"
import { TransactionList } from "../components/transaction-list"
import { SettingsDialog } from "../components/settings-dialog"
import { DailyIncomeChart } from "../components/daily-income-chart"
import { WeeklyPayablesCard } from "../components/weekly-payables-card"
import { InstallPrompt } from "../components/install-prompt"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import OfflineIndicator from "@/components/offline-indicator"
import OptimizedCard from "@/components/optimized-card"
import NotificationManager from "@/components/notification-manager"

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

// Default expense categories
const defaultExpenseCategories = ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Other"]

// Initialize daily income with current week dates and updated goals
const initializeDailyIncome = () => {
  const weekDays = getCurrentWeekDays()
  return weekDays.map((dayInfo) => ({
    day: dayInfo.day,
    amount: dayInfo.isPast ? Math.random() * 400 + 800 : 0,
    goal: dayInfo.day === "Sun" ? 0 : 1100, // Sunday = 0 (non-workday), others = 1100
    date: dayInfo.date,
    isToday: dayInfo.isToday,
    isPast: dayInfo.isPast,
    isWorkDay: dayInfo.day !== "Sun", // Sunday is non-workday by default
  }))
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
const safeToLocaleString = (value: any): string => {
  const num = Number(value)
  return isNaN(num) ? "0" : num.toLocaleString()
}

export default function BudgetingApp() {
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [currentTime, setCurrentTime] = useState("")
  const [quickActionType, setQuickActionType] = useState<"income" | "expense" | "bills" | null>(null)
  const [isClient, setIsClient] = useState(false)

  // State with localStorage persistence
  const [dashboardData, setDashboardData] = useState(defaultDashboardData)
  const [budgetCategories, setBudgetCategories] = useState(defaultBudgetCategories)
  const [weeklyPayables, setWeeklyPayables] = useState(defaultWeeklyPayables)
  const [transactions, setTransactions] = useState(defaultTransactions)
  const [dailyIncome, setDailyIncome] = useState(() => initializeDailyIncome())
  const [expenseCategories, setExpenseCategories] = useState(defaultExpenseCategories)

  // Set client-side flag and initialize time
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(getManilaTime())
  }, [])

  // Update time every minute
  useEffect(() => {
    if (!isClient) return

    const timer = setInterval(() => {
      setCurrentTime(getManilaTime())
    }, 60000)

    return () => clearInterval(timer)
  }, [isClient])

  // Load data from localStorage on component mount (client-side only)
  useEffect(() => {
    if (!isClient) return

    const savedData = safeLocalStorage.getItem("dailyBudgetAppData")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setDashboardData(parsed.dashboardData || defaultDashboardData)
        setBudgetCategories(parsed.budgetCategories || defaultBudgetCategories)
        setWeeklyPayables(parsed.weeklyPayables || defaultWeeklyPayables)
        setTransactions(parsed.transactions || defaultTransactions)

        // Update daily income with current week structure
        const savedDailyIncome = parsed.dailyIncome || []
        const currentWeekDays = getCurrentWeekDays()
        const updatedDailyIncome = currentWeekDays.map((dayInfo) => {
          const savedDay = savedDailyIncome.find((d: any) => d.date === dayInfo.date)
          return {
            day: dayInfo.day,
            amount: savedDay?.amount || 0,
            goal: savedDay?.isWorkDay === false ? 0 : savedDay?.goal || 1100, // Use workday status to set goal
            date: dayInfo.date,
            isToday: dayInfo.isToday,
            isPast: dayInfo.isPast,
            isWorkDay: savedDay?.isWorkDay !== undefined ? savedDay.isWorkDay : dayInfo.day !== "Sun",
          }
        })
        setDailyIncome(updatedDailyIncome)
      } catch (error) {
        console.error("Error loading saved data:", error)
      }
    }

    // Load expense categories
    const savedExpenseCategories = safeLocalStorage.getItem("expenseCategories")
    if (savedExpenseCategories) {
      try {
        setExpenseCategories(JSON.parse(savedExpenseCategories))
      } catch (error) {
        console.error("Error loading expense categories:", error)
      }
    }
  }, [isClient])

  // Save data to localStorage whenever state changes (client-side only)
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

  // Save expense categories separately
  useEffect(() => {
    if (!isClient) return
    safeLocalStorage.setItem("expenseCategories", JSON.stringify(expenseCategories))
  }, [expenseCategories, isClient])

  // Real-time calculations with safe defaults
  const currency = dashboardData?.currency || "₱"

  // Work days calculations with null checks - only count workdays with goal > 0
  const workDays = Array.isArray(dailyIncome) ? dailyIncome.filter((day) => day?.isWorkDay && (day?.goal || 0) > 0) : []
  const weeklyEarned = workDays.reduce((sum, day) => sum + (day?.amount || 0), 0)
  const weeklyGoal = workDays.reduce((sum, day) => sum + (day?.goal || 0), 0)
  const goalProgress = weeklyGoal > 0 ? (weeklyEarned / weeklyGoal) * 100 : 0

  // Today's data with null checks
  const todayData = Array.isArray(dailyIncome) ? dailyIncome.find((day) => day?.isToday) : null
  const todayIncome = todayData?.amount || 0
  const todayGoal = todayData?.isWorkDay ? todayData?.goal || 1100 : 0

  // Real-time expense calculations from transactions with null checks
  const currentWeekExpenses = Array.isArray(transactions)
    ? transactions
        .filter((t) => t?.type === "expense" && new Date(t?.date || "") >= new Date(getWeekStartManila()))
        .reduce((sum, t) => sum + Math.abs(t?.amount || 0), 0)
    : 0

  // Update budget categories spent amounts from transactions with null checks
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

  // Get monthly payables that fall within current week
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
        week: "This Week", // Mark as current week
        source: "monthly", // Mark source for identification
      }))
  }

  // Combine weekly payables with monthly payables that fall in current week
  const allCurrentWeekPayables = [...weeklyPayables, ...getMonthlyPayablesForCurrentWeek()]

  // Real-time payables calculations with null checks
  const totalWeeklyPayables = allCurrentWeekPayables.reduce((sum, payable) => sum + (payable?.amount || 0), 0)
  const pendingPayables = allCurrentWeekPayables.filter((p) => p?.status === "pending")
  const totalPendingPayables = pendingPayables.reduce((sum, payable) => sum + (payable?.amount || 0), 0)

  // Calculate remaining work days and their potential earnings
  const remainingWorkDays = workDays.filter((day) => !day?.isPast && !day?.isToday)
  const potentialRemainingEarnings = remainingWorkDays.reduce((sum, day) => sum + (day?.goal || 0), 0)

  // This Week's Projected Savings calculation
  const thisWeekProjectedSavings = weeklyEarned + potentialRemainingEarnings - totalWeeklyPayables - currentWeekExpenses

  // Current actual balance calculation
  const totalIncome = Array.isArray(transactions)
    ? transactions.filter((t) => t?.type === "income").reduce((sum, t) => sum + (t?.amount || 0), 0)
    : 0
  const totalExpenses = Array.isArray(transactions)
    ? transactions.filter((t) => t?.type === "expense").reduce((sum, t) => sum + Math.abs(t?.amount || 0), 0)
    : 0
  const paidPayablesAmount = Array.isArray(weeklyPayables)
    ? weeklyPayables.filter((p) => p?.status === "paid").reduce((sum, p) => sum + (p?.amount || 0), 0)
    : 0

  const calculatedBalance = (dashboardData?.totalBalance || 0) + totalIncome - totalExpenses - paidPayablesAmount

  // Handle payment - deduct from balance
  const handlePayment = (payableId: number, amount: number) => {
    // Update payable status
    const updatedPayables = weeklyPayables.map((payable) => {
      if (payable.id === payableId) {
        const newPaidCount = (payable.paidCount || 0) + 1
        let newStatus = "paid"

        // Smart completion logic
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

    // Deduct payment from balance
    setDashboardData((prev) => ({
      ...prev,
      totalBalance: prev.totalBalance - amount,
    }))

    // Add payment as expense transaction
    const paymentTransaction = {
      id: Date.now(),
      description: `Payment: ${weeklyPayables.find((p) => p.id === payableId)?.name || "Bill"}`,
      amount: -amount,
      type: "expense" as const,
      category: "Bills",
      date: new Date().toISOString().split("T")[0],
    }

    setTransactions((prev) => [paymentTransaction, ...prev])
  }

  // Clear all data function
  const clearAllData = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Are you sure you want to clear all data? This action cannot be undone.")
    ) {
      // Clear localStorage
      safeLocalStorage.removeItem("dailyBudgetAppData")
      safeLocalStorage.removeItem("monthlyPayables")
      safeLocalStorage.removeItem("biweeklyPayables")
      safeLocalStorage.removeItem("weeklyPayablesHistory")
      safeLocalStorage.removeItem("expenseCategories")

      // Reset all state to empty/default values
      setDashboardData({
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

      // Reset daily income to zero amounts but keep structure
      const resetDailyIncome = initializeDailyIncome().map((day) => ({
        ...day,
        amount: 0,
      }))
      setDailyIncome(resetDailyIncome)
    }
  }

  // Clear specific data functions
  const clearTransactions = () => {
    if (typeof window !== "undefined" && window.confirm("Clear all transactions?")) {
      setTransactions([])
    }
  }

  const clearBudgetCategories = () => {
    if (typeof window !== "undefined" && window.confirm("Clear all budget categories?")) {
      setBudgetCategories([])
    }
  }

  const clearWeeklyPayables = () => {
    if (typeof window !== "undefined" && window.confirm("Clear all weekly payables?")) {
      setWeeklyPayables([])
    }
  }

  const clearDailyIncome = () => {
    if (typeof window !== "undefined" && window.confirm("Reset all daily income data for this week?")) {
      const resetIncome = dailyIncome.map((day) => ({
        ...day,
        amount: 0,
      }))
      setDailyIncome(resetIncome)
    }
  }

  // Show loading state until client-side hydration is complete
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
        {/* App Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Daily Budget v81</h1>
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

          {/* Today's Summary - Real-time */}
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

        {/* Main Content with bottom padding for navigation */}
        <div className="p-4 pb-28">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 bg-white/90 p-1 rounded-lg shadow-lg">
              <TabsTrigger value="home" className="data-[state=active]:bg-purple-100 rounded-md text-xs">
                Home
              </TabsTrigger>
              <TabsTrigger value="income" className="data-[state=active]:bg-purple-100 rounded-md text-xs">
                Income
              </TabsTrigger>
              <TabsTrigger value="expenses" className="data-[state=active]:bg-purple-100 rounded-md text-xs">
                Expenses
              </TabsTrigger>
              <TabsTrigger value="payables" className="data-[state=active]:bg-purple-100 rounded-md text-xs">
                Bills
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-purple-100 rounded-md text-xs">
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="home" className="space-y-4 mt-0">
              {/* Quick Stats - Real-time */}
              <div className="grid grid-cols-2 gap-3">
                <OptimizedCard
                  title="Balance"
                  value={`${currency}${safeToLocaleString(calculatedBalance)}`}
                  icon={Wallet}
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                  iconColor="text-emerald-200"
                />
                <OptimizedCard
                  title="Future Balance"
                  value={`${currency}${safeToLocaleString(calculatedBalance + potentialRemainingEarnings - totalPendingPayables)}`}
                  subtitle="(this week)"
                  icon={TrendingUp}
                  gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                  iconColor="text-blue-200"
                />
              </div>

              {/* Weekly Progress - Real-time */}
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

              {/* Updated Savings Tracker */}
              <div className="grid grid-cols-2 gap-3">
                <OptimizedCard
                  title="If Goals Met"
                  value={`${currency}${safeToLocaleString(calculatedBalance + potentialRemainingEarnings)}`}
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

              {/* Daily Income Chart - Real-time */}
              <DailyIncomeChart dailyIncome={dailyIncome} currency={currency} />

              {/* Quick Actions */}
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
            </TabsContent>

            <TabsContent value="income" className="space-y-4 mt-0">
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
            </TabsContent>

            <TabsContent value="expenses" className="space-y-4 mt-0">
              <SpendingChart budgetCategories={updatedBudgetCategories} currency={currency} />

              <Card className="bg-white/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-gray-800">Budget Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {updatedBudgetCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No budget categories yet.</p>
                      <p className="text-sm">Add categories in Settings to track your spending.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {updatedBudgetCategories.map((category, index) => {
                        const percentage = ((category?.spent || 0) / (category?.budgeted || 1)) * 100
                        const isOverBudget = (category?.spent || 0) > (category?.budgeted || 0)

                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-800">{category?.name}</span>
                              <span className={`font-bold ${isOverBudget ? "text-red-600" : "text-gray-800"}`}>
                                {currency}
                                {safeToLocaleString(category?.spent)}/{currency}
                                {safeToLocaleString(category?.budgeted)}
                              </span>
                            </div>
                            <Progress value={Math.min(percentage, 100)} className="h-2" />
                            {isOverBudget && (
                              <p className="text-xs text-red-600">
                                Over by {currency}
                                {safeToLocaleString((category?.spent || 0) - (category?.budgeted || 0))}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payables" className="space-y-4 mt-0">
              <WeeklyPayablesCard
                weeklyPayables={allCurrentWeekPayables}
                setWeeklyPayables={setWeeklyPayables}
                currency={currency}
                onPayment={handlePayment}
              />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4 mt-0">
              <TransactionList transactions={transactions} currency={currency} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Navigation - Fixed with higher z-index */}
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-lg border-t border-white/20 shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-center py-2 px-4">
            {/* Left side buttons */}
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

            {/* Center Plus Button */}
            <div className="mx-4">
              <Button
                onClick={() => {
                  setQuickActionType(null)
                  setShowAddTransaction(true)
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>

            {/* Right side buttons */}
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

        {/* Dialogs */}
        <AddTransactionDialog
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
          onAddTransaction={(transaction) => {
            setTransactions([{ ...transaction, id: Date.now() }, ...transactions])
            // Update daily income if it's an income transaction for today
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
          }}
          budgetCategories={budgetCategories}
          expenseCategories={expenseCategories}
          currency={currency}
          defaultDescription="work" // Set default description to "work"
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

        {/* Notifications Dialog */}
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
      </div>
    </div>
  )
}
