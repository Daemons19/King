"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PiggyBank,
  Plus,
  Settings,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { WeeklyPayablesCard } from "@/components/weekly-payables-card"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { SettingsDialog } from "@/components/settings-dialog"
import { DailyIncomeChart } from "@/components/daily-income-chart"
import { TransactionList } from "@/components/transaction-list"
import { AIAssistant } from "@/components/ai-assistant"

interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  category: string
  description: string
  date: string
  isFinalEarnings?: boolean
}

interface Payable {
  id: string
  name: string
  amount: number
  frequency: "weekly" | "monthly"
  dueDay: string
  isPaid: boolean
  paidDate?: string
}

interface DayEarnings {
  [key: string]: {
    amount: number
    isFinal: boolean
  }
}

export default function Home() {
  const [currency] = useState("₱")
  const [startingBalance, setStartingBalance] = useState(0)
  const [cashOnHand, setCashOnHand] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payables, setPayables] = useState<Payable[]>([])
  const [workDays, setWorkDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ])
  const [dailyGoal] = useState(1100)
  const [dayEarnings, setDayEarnings] = useState<DayEarnings>({})
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogType, setAddDialogType] = useState<"income" | "expense">("income")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedBalance = localStorage.getItem("startingBalance")
    const savedCash = localStorage.getItem("cashOnHand")
    const savedTransactions = localStorage.getItem("transactions")
    const savedPayables = localStorage.getItem("payables")
    const savedWorkDays = localStorage.getItem("workDays")
    const savedDayEarnings = localStorage.getItem("dayEarnings")

    if (savedBalance) setStartingBalance(Number.parseFloat(savedBalance))
    if (savedCash) setCashOnHand(Number.parseFloat(savedCash))
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions))
    if (savedPayables) setPayables(JSON.parse(savedPayables))
    if (savedWorkDays) setWorkDays(JSON.parse(savedWorkDays))
    if (savedDayEarnings) setDayEarnings(JSON.parse(savedDayEarnings))
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("startingBalance", startingBalance.toString())
    localStorage.setItem("cashOnHand", cashOnHand.toString())
    localStorage.setItem("transactions", JSON.stringify(transactions))
    localStorage.setItem("payables", JSON.stringify(payables))
    localStorage.setItem("workDays", JSON.stringify(workDays))
    localStorage.setItem("dayEarnings", JSON.stringify(dayEarnings))
  }, [startingBalance, cashOnHand, transactions, payables, workDays, dayEarnings])

  const getWeekDates = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getCurrentWeekTransactions = () => {
    const monday = weekDates[0]
    const sunday = new Date(weekDates[6])
    sunday.setHours(23, 59, 59, 999)

    return transactions.filter((t) => {
      const tDate = new Date(t.date)
      return tDate >= monday && tDate <= sunday
    })
  }

  const currentWeekTransactions = getCurrentWeekTransactions()

  const weeklyEarned = currentWeekTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const todayIncome = currentWeekTransactions
    .filter((t) => {
      const tDate = new Date(t.date)
      tDate.setHours(0, 0, 0, 0)
      return t.type === "income" && tDate.getTime() === today.getTime()
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const currentWeekExpenses = currentWeekTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const thisWeekExpenses = currentWeekTransactions.filter((t) => t.type === "expense")

  const todayDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()]
  const isTodayWorkDay = workDays.includes(todayDayName)
  const todayGoal = isTodayWorkDay ? dailyGoal : 0

  // Check if today's earnings are marked as final
  const todayKey = today.toISOString().split("T")[0]
  const todayIsFinal = dayEarnings[todayKey]?.isFinal || false

  const remainingWorkDays = weekDates.filter((date, index) => {
    if (date < today) return false
    if (date.getTime() === today.getTime()) return false
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()]
    return workDays.includes(dayName)
  }).length

  // Calculate potential remaining earnings
  // If today is final, don't add remaining goal for today
  const remainingTodayPotential = todayIsFinal ? 0 : Math.max(0, todayGoal - todayIncome)
  const potentialRemainingEarnings = remainingTodayPotential + remainingWorkDays * dailyGoal

  const weeklyGoal = workDays.length * dailyGoal
  const goalProgress = weeklyGoal > 0 ? (weeklyEarned / weeklyGoal) * 100 : 0

  const thisWeekProjectedSavings = weeklyEarned >= weeklyGoal ? cashOnHand + weeklyEarned : 0

  const getPendingWeeklyPayables = () => {
    return payables.filter((p) => {
      if (p.frequency !== "weekly") return false
      if (p.isPaid) {
        const paidDate = p.paidDate ? new Date(p.paidDate) : null
        if (paidDate) {
          paidDate.setHours(0, 0, 0, 0)
          const monday = weekDates[0]
          const sunday = new Date(weekDates[6])
          sunday.setHours(23, 59, 59, 999)
          if (paidDate >= monday && paidDate <= sunday) {
            return false
          }
        }
      }
      return !p.isPaid || !p.paidDate
    })
  }

  const getPendingMonthlyPayables = () => {
    return payables.filter((p) => {
      if (p.frequency !== "monthly") return false

      const dueDay = Number.parseInt(p.dueDay)
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      const dueDate = new Date(currentYear, currentMonth, dueDay)
      dueDate.setHours(0, 0, 0, 0)

      const monday = weekDates[0]
      const sunday = new Date(weekDates[6])
      sunday.setHours(23, 59, 59, 999)

      const isDueThisWeek = dueDate >= monday && dueDate <= sunday

      if (!isDueThisWeek) return false

      if (p.isPaid && p.paidDate) {
        const paidDate = new Date(p.paidDate)
        paidDate.setHours(0, 0, 0, 0)
        if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
          return false
        }
      }

      return true
    })
  }

  const pendingWeeklyPayables = getPendingWeeklyPayables()
  const pendingMonthlyPayables = getPendingMonthlyPayables()
  const allPendingPayables = [...pendingWeeklyPayables, ...pendingMonthlyPayables]

  const totalPendingPayables = allPendingPayables.reduce((sum, p) => sum + p.amount, 0)

  const handleAddTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    }

    setTransactions([...transactions, newTransaction])

    if (transaction.type === "income") {
      setCashOnHand(cashOnHand + transaction.amount)

      // Track if earnings are final for the day
      if (transaction.isFinalEarnings) {
        const dateKey = new Date(transaction.date).toISOString().split("T")[0]
        setDayEarnings({
          ...dayEarnings,
          [dateKey]: {
            amount: todayIncome + transaction.amount,
            isFinal: true,
          },
        })
      }

      toast({
        title: "Income Added",
        description: `${currency}${transaction.amount.toLocaleString()} added to your balance${
          transaction.isFinalEarnings ? " (marked as final for today)" : ""
        }`,
      })
    } else {
      setCashOnHand(cashOnHand - transaction.amount)
      toast({
        title: "Expense Recorded",
        description: `${currency}${transaction.amount.toLocaleString()} ${transaction.category} expense logged`,
      })
    }
  }

  const handlePayBill = (payableId: string) => {
    const payable = payables.find((p) => p.id === payableId)
    if (!payable) return

    setPayables(
      payables.map((p) =>
        p.id === payableId
          ? {
              ...p,
              isPaid: true,
              paidDate: new Date().toISOString(),
            }
          : p,
      ),
    )

    setCashOnHand(cashOnHand - payable.amount)

    toast({
      title: "Bill Paid",
      description: `${payable.name} (${currency}${payable.amount.toLocaleString()}) marked as paid`,
    })
  }

  const handleUpdateSettings = (settings: {
    startingBalance: number
    cashOnHand: number
    workDays: string[]
    payables: Payable[]
  }) => {
    setStartingBalance(settings.startingBalance)
    setCashOnHand(settings.cashOnHand)
    setWorkDays(settings.workDays)
    setPayables(settings.payables)
  }

  const handleAIAction = (action: any) => {
    switch (action.type) {
      case "addIncome":
        handleAddTransaction({
          type: "income",
          amount: action.amount,
          description: action.description || "work",
          category: action.description || "work",
          date: new Date().toISOString(),
        })
        break
      case "addExpense":
        handleAddTransaction({
          type: "expense",
          amount: action.amount,
          description: action.description || "expense",
          category: action.category || "Other",
          date: new Date().toISOString(),
        })
        break
      case "markBillAsPaid":
        const bill = payables.find((p) => p.name.toLowerCase().includes(action.billName.toLowerCase()) && !p.isPaid)
        if (bill) {
          handlePayBill(bill.id)
        }
        break
    }
  }

  const appData = {
    currency,
    cashOnHand,
    startingBalance,
    todayIncome,
    todayGoal,
    weeklyEarned,
    weeklyGoal,
    goalProgress,
    currentWeekExpenses,
    totalPendingPayables,
    remainingWorkDays,
    potentialRemainingEarnings,
    thisWeekProjectedSavings,
    pendingPayables: allPendingPayables,
    thisWeekExpenses,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 pb-24 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Daily Budget
            </h1>
            <p className="text-sm text-muted-foreground">Track your finances smartly</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Balance Overview */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cash on Hand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {currency}
                {cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs mt-1 text-purple-100">Available balance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Starting Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {currency}
                {startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs mt-1 text-muted-foreground">Fixed baseline amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Progress
                {todayIsFinal && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-normal text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Final
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {currency}
                {todayIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  Goal: {currency}
                  {todayGoal.toLocaleString()}
                </span>
                <span className="text-xs font-medium">
                  {todayGoal > 0 ? Math.round((todayIncome / todayGoal) * 100) : 0}%
                </span>
              </div>
              <Progress value={todayGoal > 0 ? (todayIncome / todayGoal) * 100 : 0} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Weekly Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Overview</CardTitle>
                <CardDescription>Your progress this week</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {currency}
                  {weeklyEarned.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  of {currency}
                  {weeklyGoal.toLocaleString()} goal
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={goalProgress} className="mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Earned</p>
                <p className="font-semibold">
                  {currency}
                  {weeklyEarned.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Spent</p>
                <p className="font-semibold">
                  {currency}
                  {currentWeekExpenses.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pending Bills</p>
                <p className="font-semibold">
                  {currency}
                  {totalPendingPayables.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Projected Savings</p>
                <p className="font-semibold">
                  {currency}
                  {thisWeekProjectedSavings.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="payables">Bills</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <DailyIncomeChart
              weekDates={weekDates}
              transactions={currentWeekTransactions}
              workDays={workDays}
              dailyGoal={dailyGoal}
              currency={currency}
              dayEarnings={dayEarnings}
            />
            <WeeklyPayablesCard payables={allPendingPayables} onPayBill={handlePayBill} currency={currency} />
          </TabsContent>

          <TabsContent value="income">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Income History</CardTitle>
                    <CardDescription>Track your earnings</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setAddDialogType("income")
                      setAddDialogOpen(true)
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Income
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionList
                  transactions={currentWeekTransactions.filter((t) => t.type === "income")}
                  currency={currency}
                  emptyMessage="No income recorded this week"
                  showDayStatus={true}
                  dayEarnings={dayEarnings}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>This Week's Expenses</CardTitle>
                    <CardDescription>
                      Total: {currency}
                      {currentWeekExpenses.toLocaleString()}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setAddDialogType("expense")
                      setAddDialogOpen(true)
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionList
                  transactions={thisWeekExpenses}
                  currency={currency}
                  emptyMessage="No expenses this week"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payables">
            <Tabs defaultValue="weekly">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>

              <TabsContent value="weekly">
                <WeeklyPayablesCard payables={pendingWeeklyPayables} onPayBill={handlePayBill} currency={currency} />
              </TabsContent>

              <TabsContent value="monthly">
                <WeeklyPayablesCard payables={pendingMonthlyPayables} onPayBill={handlePayBill} currency={currency} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-around h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddDialogType("income")
                setAddDialogOpen(true)
              }}
              className="flex-col h-auto py-2"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs mt-1">Income</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiAssistantOpen(true)}
              className="flex-col h-auto py-2 relative -mt-8"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
              </div>
              <span className="text-xs mt-2 font-medium">AI Assistant</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddDialogType("expense")
                setAddDialogOpen(true)
              }}
              className="flex-col h-auto py-2"
            >
              <TrendingDown className="h-5 w-5" />
              <span className="text-xs mt-1">Expense</span>
            </Button>
          </div>
        </div>
      </div>

      <AddTransactionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        type={addDialogType}
        onAdd={handleAddTransaction}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        startingBalance={startingBalance}
        cashOnHand={cashOnHand}
        workDays={workDays}
        payables={payables}
        onUpdate={handleUpdateSettings}
        currency={currency}
      />

      <AIAssistant
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        appData={appData}
        onExecuteAction={handleAIAction}
      />
    </div>
  )
}
