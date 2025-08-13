"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingDown,
  Plus,
  Settings,
  Wallet,
  Target,
  Home,
  DollarSign,
  CreditCard,
  TrendingUp,
  Trash2,
  Bell,
} from "lucide-react"
import { SpendingChart } from "../components/spending-chart"
import { TransactionList } from "../components/transaction-list"
import { SettingsDialog } from "../components/settings-dialog"
import { DailyIncomeChart } from "../components/daily-income-chart"
import { WeeklyPayablesCard } from "../components/weekly-payables-card"
import { InstallPrompt } from "../components/install-prompt"
import { QuickAddDialog } from "../components/quick-add-dialog"
import { OptimizedCard } from "../components/optimized-card"
import { NotificationManager } from "../components/notification-manager"
import { OfflineIndicator } from "../components/offline-indicator"

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

// Default data - focused on daily earnings in PHP
const defaultDashboardData = {
  totalBalance: 12450.75,
  dailyIncomeGoal: 800.0,
  weeklyExpenses: 3850.25,
  weeklyPayables: 1450.0,
  currency: "₱",
}

const defaultBudgetCategories = [
  { name: "Food", budgeted: 600, spent: 520, color: "from-emerald-500 to-teal-500" },
  { name: "Transport", budgeted: 320, spent: 265, color: "from-blue-500 to-indigo-500" },
  { name: "Entertainment", budgeted: 240, spent: 180, color: "from-purple-500 to-pink-500" },
  { name: "Shopping", budgeted: 400, spent: 350, color: "from-orange-500 to-red-500" },
  { name: "Bills", budgeted: 800, spent: 720, color: "from-yellow-500 to-orange-500" },
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
    amount: 720,
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

// Initialize daily income with current week dates
const initializeDailyIncome = () => {
  const weekDays = getCurrentWeekDays()
  return weekDays.map((dayInfo) => ({
    day: dayInfo.day,
    amount: dayInfo.isPast ? Math.random() * 400 + 600 : 0, // Random past earnings for demo
    goal: dayInfo.day === "Sun" ? 600 : 800, // Only Sunday gets reduced goal
    date: dayInfo.date,
    isToday: dayInfo.isToday,
    isPast: dayInfo.isPast,
    isWorkDay: dayInfo.day !== "Sun", // Sunday is not a work day by default
  }))
}

export default function BudgetingApp() {
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [currentTime, setCurrentTime] = useState(getManilaTime())
  const [quickActionType, setQuickActionType] = useState<"income" | "expense" | "bills" | null>(null)

  // State with localStorage persistence
  const [dashboardData, setDashboardData] = useState(defaultDashboardData)
  const [budgetCategories, setBudgetCategories] = useState(defaultBudgetCategories)
  const [weeklyPayables, setWeeklyPayables] = useState(defaultWeeklyPayables)
  const [transactions, setTransactions] = useState(defaultTransactions)
  const [dailyIncome, setDailyIncome] = useState(() => initializeDailyIncome())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getManilaTime())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("dailyBudgetAppData")
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
            goal: savedDay?.goal || (dayInfo.day === "Sat" || dayInfo.day === "Sun" ? 600 : 800),
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
  }, [])

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      dashboardData,
      budgetCategories,
      weeklyPayables,
      transactions,
      dailyIncome,
    }
    localStorage.setItem("dailyBudgetAppData", JSON.stringify(dataToSave))
  }, [dashboardData, budgetCategories, weeklyPayables, transactions, dailyIncome])

  // Clear all data function
  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      // Clear localStorage
      localStorage.removeItem("dailyBudgetAppData")
      localStorage.removeItem("monthlyPayables")

      // Reset all state to empty/default values
      setDashboardData({
        totalBalance: 0,
        dailyIncomeGoal: 800.0,
        weeklyExpenses: 0,
        weeklyPayables: 0,
        currency: "₱",
      })
      setBudgetCategories([])
      setWeeklyPayables([])
      setTransactions([])

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
    if (window.confirm("Clear all transactions?")) {
      setTransactions([])
    }
  }

  const clearBudgetCategories = () => {
    if (window.confirm("Clear all budget categories?")) {
      setBudgetCategories([])
      // Also reset dashboard weekly expenses to 0
      setDashboardData((prev) => ({ ...prev, weeklyExpenses: 0 }))
    }
  }

  const clearWeeklyPayables = () => {
    if (window.confirm("Clear all weekly payables?")) {
      setWeeklyPayables([])
      // Also reset dashboard weekly payables to 0
      setDashboardData((prev) => ({ ...prev, weeklyPayables: 0 }))
    }
  }

  const clearDailyIncome = () => {
    if (window.confirm("Reset all daily income data for this week?")) {
      const resetIncome = dailyIncome.map((day) => ({
        ...day,
        amount: 0,
      }))
      setDailyIncome(resetIncome)
      // Also reset total balance to 0
      setDashboardData((prev) => ({ ...prev, totalBalance: 0 }))
    }
  }

  // Real-time calculations based on current week (only work days)
  const workDays = dailyIncome.filter((day) => day.isWorkDay)
  const weeklyEarned = workDays.reduce((sum, day) => sum + day.amount, 0)
  const weeklyGoal = workDays.reduce((sum, day) => sum + day.goal, 0)
  const goalProgress = weeklyGoal > 0 ? (weeklyEarned / weeklyGoal) * 100 : 0

  // Today's data
  const todayData = dailyIncome.find((day) => day.isToday) || dailyIncome[0]
  const todayIncome = todayData?.amount || 0
  const todayGoal = todayData?.goal || dashboardData.dailyIncomeGoal

  // Real-time projected savings calculation (only work days)
  const totalWeeklyPayables = weeklyPayables.reduce((sum, payable) => sum + payable.amount, 0)
  const weeklyExpenses = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0)

  // Calculate remaining work days and their potential earnings
  const remainingWorkDays = workDays.filter((day) => !day.isPast && !day.isToday)
  const potentialRemainingEarnings = remainingWorkDays.reduce((sum, day) => sum + day.goal, 0)

  // Projected total if goals are met for remaining work days
  const projectedWeeklyTotal = weeklyEarned + potentialRemainingEarnings
  const projectedWeeklySavings = projectedWeeklyTotal - totalWeeklyPayables - weeklyExpenses

  // Current actual savings (what you have now)
  const actualWeeklySavings = weeklyEarned - totalWeeklyPayables - weeklyExpenses

  const currency = dashboardData.currency || "₱"

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <OfflineIndicator />
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg min-h-screen">
        {/* App Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Daily Budget</h1>
              <p className="text-purple-100 text-xs">Manila Time: {currentTime}</p>
            </div>
            <div className="flex gap-2">
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

          {/* Today's Summary */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-purple-100">
                Today's Earnings ({getCurrentDayManila()})
                {!todayData?.isWorkDay && <span className="text-xs"> - Rest Day</span>}
              </span>
              <span className="text-xs text-purple-200">
                Goal: {currency}
                {todayGoal.toLocaleString()}
              </span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {currency}
              {todayIncome.toLocaleString()}
            </div>
            <Progress value={(todayIncome / todayGoal) * 100} className="h-2 bg-white/20" />
            <div className="flex justify-between text-xs text-purple-200 mt-1">
              <span>
                {currency}
                {todayIncome.toLocaleString()} earned
              </span>
              <span>{((todayIncome / todayGoal) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsContent value="home" className="space-y-4 mt-0">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <OptimizedCard
                  title="Balance"
                  value={`${currency}${dashboardData.totalBalance.toLocaleString()}`}
                  icon={Wallet}
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                  iconColor="text-emerald-200"
                />
                <OptimizedCard
                  title="Work Days"
                  value={`${currency}${weeklyEarned.toLocaleString()}`}
                  icon={Target}
                  gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                  iconColor="text-blue-200"
                />
              </div>

              {/* Weekly Progress */}
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
                        {weeklyEarned.toLocaleString()} earned
                      </span>
                      <span>
                        {currency}
                        {weeklyGoal.toLocaleString()} goal
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Projected Savings */}
              <div className="grid grid-cols-2 gap-3">
                <OptimizedCard
                  title="If Goals Met"
                  value={`${currency}${projectedWeeklySavings.toLocaleString()}`}
                  subtitle="Projected Savings"
                  icon={TrendingUp}
                  gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                  iconColor="text-green-200"
                />
                <OptimizedCard
                  title="Current"
                  value={`${currency}${actualWeeklySavings.toLocaleString()}`}
                  subtitle="Actual Savings"
                  icon={TrendingDown}
                  gradient="bg-gradient-to-br from-orange-500 to-red-600"
                  iconColor="text-orange-200"
                />
              </div>

              {/* Real-time Savings Breakdown */}
              <Card className="bg-white/80 backdrop-blur-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-800">Real-time Savings Projection</CardTitle>
                  <CardDescription>Based on work days only + remaining goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Already Earned (Work Days)</span>
                      <span className="font-medium text-green-600">
                        {currency}
                        {weeklyEarned.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Potential Remaining ({remainingWorkDays.length} work days)
                      </span>
                      <span className="font-medium text-blue-600">
                        {currency}
                        {potentialRemainingEarnings.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Projected Total</span>
                        <span className="font-medium text-gray-800">
                          {currency}
                          {projectedWeeklyTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Weekly Payables</span>
                      <span className="font-medium text-red-600">
                        -{currency}
                        {totalWeeklyPayables.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Weekly Expenses</span>
                      <span className="font-medium text-red-600">
                        -{currency}
                        {weeklyExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">Projected Savings</span>
                        <span
                          className={`font-bold text-lg ${projectedWeeklySavings >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {currency}
                          {projectedWeeklySavings.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Income Chart */}
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
              {/* Clear Data Button */}
              <div className="flex justify-end">
                <Button
                  onClick={clearDailyIncome}
                  variant="outline"
                  size="sm"
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Income Data
                </Button>
              </div>

              <DailyIncomeChart dailyIncome={dailyIncome} currency={currency} />

              <Card className="bg-white/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-gray-800">Daily Breakdown - Current Week</CardTitle>
                  <CardDescription>Week starting {getWeekStartManila()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dailyIncome.map((day, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          day.isToday
                            ? "bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300"
                            : day.isPast
                              ? "bg-gradient-to-r from-gray-50 to-blue-50"
                              : "bg-gradient-to-r from-yellow-50 to-orange-50"
                        } ${!day.isWorkDay ? "opacity-60" : ""}`}
                      >
                        <div>
                          <p className="font-medium text-gray-800 flex items-center gap-2">
                            {day.day} {day.isToday && "(Today)"}
                            {!day.isWorkDay && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Rest Day</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600">
                            Goal: {currency}
                            {day.goal.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{day.date}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-lg ${
                              !day.isWorkDay
                                ? "text-gray-400"
                                : day.amount >= day.goal
                                  ? "text-green-600"
                                  : day.isPast
                                    ? "text-red-600"
                                    : "text-orange-600"
                            }`}
                          >
                            {currency}
                            {day.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {day.isWorkDay ? `${((day.amount / day.goal) * 100).toFixed(0)}%` : "N/A"}
                          </p>
                          {day.isPast && day.amount === 0 && day.isWorkDay && (
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
              {/* Clear Data Button */}
              <div className="flex justify-end">
                <Button
                  onClick={clearBudgetCategories}
                  variant="outline"
                  size="sm"
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Categories
                </Button>
              </div>

              <SpendingChart budgetCategories={budgetCategories} currency={currency} />

              <Card className="bg-white/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-gray-800">Budget Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {budgetCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No budget categories yet.</p>
                      <p className="text-sm">Add categories in Settings to track your spending.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {budgetCategories.map((category, index) => {
                        const percentage = (category.spent / category.budgeted) * 100
                        const isOverBudget = category.spent > category.budgeted

                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-800">{category.name}</span>
                              <span className={`font-bold ${isOverBudget ? "text-red-600" : "text-gray-800"}`}>
                                {currency}
                                {category.spent.toLocaleString()}/{currency}
                                {category.budgeted.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={Math.min(percentage, 100)} className="h-2" />
                            {isOverBudget && (
                              <p className="text-xs text-red-600">
                                Over by {currency}
                                {(category.spent - category.budgeted).toLocaleString()}
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
              {/* Clear Data Button */}
              <div className="flex justify-end">
                <Button
                  onClick={clearWeeklyPayables}
                  variant="outline"
                  size="sm"
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Payables
                </Button>
              </div>

              <WeeklyPayablesCard
                weeklyPayables={weeklyPayables}
                setWeeklyPayables={setWeeklyPayables}
                currency={currency}
              />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4 mt-0">
              {/* Clear Data Button */}
              <div className="flex justify-end">
                <Button
                  onClick={clearTransactions}
                  variant="outline"
                  size="sm"
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Transactions
                </Button>
              </div>

              <TransactionList transactions={transactions} currency={currency} />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 mt-0">
              <NotificationManager weeklyPayables={weeklyPayables} dailyIncome={dailyIncome} currency={currency} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Navigation - Updated with Notifications tab */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-lg border-t border-white/20">
          <div className="grid grid-cols-6 py-2">
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
            <Button
              variant="ghost"
              onClick={() => {
                setQuickActionType(null)
                setShowAddTransaction(true)
              }}
              className="flex flex-col items-center py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-1 my-1"
            >
              <Plus className="w-5 h-5" />
            </Button>
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
            <Button
              variant="ghost"
              onClick={() => setActiveTab("notifications")}
              className={`flex flex-col items-center py-3 ${activeTab === "notifications" ? "text-purple-600" : "text-gray-600"}`}
            >
              <Bell className="w-4 h-4 mb-1" />
              <span className="text-xs">Alerts</span>
            </Button>
          </div>
        </div>

        {/* Dialogs */}
        <QuickAddDialog
          open={showAddTransaction}
          onOpenChange={(open) => {
            setShowAddTransaction(open)
            if (!open) setQuickActionType(null)
          }}
          currency={currency}
          weeklyPayables={weeklyPayables}
          setWeeklyPayables={setWeeklyPayables}
          initialTab={quickActionType}
          onPayBill={(billName, amount) => {
            // Handle bill payment logic if needed
          }}
          onAddTransaction={(transaction) => {
            setTransactions([transaction, ...transactions])
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
          currency={currency}
          clearAllData={clearAllData}
        />

        {/* Bottom padding for navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}
