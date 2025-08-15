"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, DollarSign, CreditCard, Check } from "lucide-react"

interface QuickAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
  weeklyPayables: any[]
  setWeeklyPayables: (payables: any[]) => void
  initialTab?: "income" | "expense" | "bills" | null
  onPayBill: (billName: string, amount: number) => void
  onAddTransaction: (transaction: any) => void
}

export function QuickAddDialog({
  open,
  onOpenChange,
  currency,
  weeklyPayables,
  setWeeklyPayables,
  initialTab,
  onPayBill,
  onAddTransaction,
}: QuickAddDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "income")
  const [incomeData, setIncomeData] = useState({
    amount: "",
    description: "Daily work income",
    category: "Work",
  })
  const [expenseData, setExpenseData] = useState({
    amount: "",
    description: "",
    category: "Food",
  })

  // Set initial tab when dialog opens
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab, open])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setIncomeData({ amount: "", description: "Daily work income", category: "Work" })
      setExpenseData({ amount: "", description: "", category: "Food" })
    }
  }, [open])

  // Get monthly payables and show them in weekly view - FIXED VERSION
  const getMonthlyPayables = () => {
    try {
      const monthlyData = localStorage.getItem("monthlyPayables")
      if (monthlyData) {
        const parsed = JSON.parse(monthlyData)

        // Handle both object format (with month keys) and array format
        let monthlyPayables = []

        if (Array.isArray(parsed)) {
          monthlyPayables = parsed
        } else if (typeof parsed === "object" && parsed !== null) {
          // Get current month key
          const now = new Date()
          const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`
          monthlyPayables = parsed[currentMonthKey] || []
        }

        return monthlyPayables.map((payable: any) => ({
          ...payable,
          week: "This Week", // Show monthly bills as available this week
          status: payable.status || "pending",
        }))
      }
    } catch (error) {
      console.error("Error loading monthly payables:", error)
    }
    return []
  }

  // Combine weekly and monthly payables
  const allPayables = [...weeklyPayables, ...getMonthlyPayables()]
  const pendingBills = allPayables.filter((bill) => bill.status === "pending")

  const handleAddIncome = () => {
    if (!incomeData.amount) return

    const transaction = {
      id: Date.now(),
      description: incomeData.description,
      amount: Number.parseFloat(incomeData.amount),
      type: "income",
      category: incomeData.category,
      date: new Date().toISOString().split("T")[0],
    }

    onAddTransaction(transaction)
    setIncomeData({ amount: "", description: "Daily work income", category: "Work" })
    onOpenChange(false)
  }

  const handleAddExpense = () => {
    if (!expenseData.amount || !expenseData.description) return

    const transaction = {
      id: Date.now(),
      description: expenseData.description,
      amount: -Number.parseFloat(expenseData.amount), // Negative for expenses
      type: "expense",
      category: expenseData.category,
      date: new Date().toISOString().split("T")[0],
    }

    onAddTransaction(transaction)
    setExpenseData({ amount: "", description: "", category: "Food" })
    onOpenChange(false)
  }

  const handlePayBill = (billId: number) => {
    const bill = weeklyPayables.find((p) => p.id === billId)
    if (!bill) return

    // Mark bill as paid
    const updated = weeklyPayables.map((payable) => (payable.id === billId ? { ...payable, status: "paid" } : payable))
    setWeeklyPayables(updated)

    // Add expense transaction
    const transaction = {
      id: Date.now(),
      description: `Paid: ${bill.name}`,
      amount: -bill.amount, // Negative for expenses
      type: "expense",
      category: "Bills",
      date: new Date().toISOString().split("T")[0],
    }

    onAddTransaction(transaction)
    onPayBill(bill.name, bill.amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 bg-gradient-to-br from-white to-purple-50">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Quick Add
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-purple-100 p-1 rounded-lg">
            <TabsTrigger value="income" className="data-[state=active]:bg-white rounded-md text-sm px-3 py-2">
              Income
            </TabsTrigger>
            <TabsTrigger value="expense" className="data-[state=active]:bg-white rounded-md text-sm px-3 py-2">
              Expense
            </TabsTrigger>
            <TabsTrigger value="bills" className="data-[state=active]:bg-white rounded-md text-sm px-3 py-2">
              Bills
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4">
            <Card className="bg-white/90 border-0">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Add Income
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="income-amount">Amount ({currency})</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    value={incomeData.amount}
                    onChange={(e) => setIncomeData({ ...incomeData, amount: e.target.value })}
                    placeholder="0.00"
                    className="bg-white h-10 placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-description">Description</Label>
                  <Input
                    id="income-description"
                    value={incomeData.description}
                    onChange={(e) => setIncomeData({ ...incomeData, description: e.target.value })}
                    placeholder="Daily work income"
                    className="bg-white h-10 placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-category">Category</Label>
                  <Select
                    value={incomeData.category}
                    onValueChange={(value) => setIncomeData({ ...incomeData, category: value })}
                  >
                    <SelectTrigger className="bg-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddIncome}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                  disabled={!incomeData.amount}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Income
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expense" className="space-y-4">
            <Card className="bg-white/90 border-0">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  Add Expense
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount ({currency})</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                    placeholder="0.00"
                    className="bg-white h-10 placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Description</Label>
                  <Input
                    id="expense-description"
                    value={expenseData.description}
                    onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                    placeholder="What did you buy?"
                    className="bg-white h-10 placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Category</Label>
                  <Select
                    value={expenseData.category}
                    onValueChange={(value) => setExpenseData({ ...expenseData, category: value })}
                  >
                    <SelectTrigger className="bg-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                      <SelectItem value="Bills">Bills</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddExpense}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600"
                  disabled={!expenseData.amount || !expenseData.description}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            <Card className="bg-white/90 border-0">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Pay Bills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingBills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Check className="w-12 h-12 mx-auto mb-4 text-green-400" />
                    <p className="font-medium">All bills are paid!</p>
                    <p className="text-sm">Great job staying on top of your finances! 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <div>
                          <h4 className="font-medium text-gray-800">{bill.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600">
                              {currency}
                              {bill.amount.toLocaleString()}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {bill.dueDay}
                            </Badge>
                            {bill.frequency && (
                              <Badge variant="outline" className="text-xs">
                                {bill.frequency === "twice-monthly" ? "Bi-Weekly" : bill.frequency}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handlePayBill(bill.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Pay
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
