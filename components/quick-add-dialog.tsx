"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, DollarSign, CreditCard, TrendingDown, Check } from "lucide-react"

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
    description: "",
    amount: "",
    category: "Work",
  })
  const [expenseData, setExpenseData] = useState({
    description: "",
    amount: "",
    category: "Food",
  })

  const incomeCategories = ["Work", "Freelance", "Business", "Investment", "Gift", "Other"]
  const expenseCategories = ["Food", "Transport", "Entertainment", "Shopping", "Bills", "Healthcare", "Other"]

  const handleAddIncome = () => {
    if (incomeData.description && incomeData.amount) {
      const transaction = {
        id: Date.now(),
        description: incomeData.description,
        amount: Number.parseFloat(incomeData.amount),
        type: "income",
        category: incomeData.category,
        date: new Date().toISOString().split("T")[0],
      }
      onAddTransaction(transaction)
      setIncomeData({ description: "", amount: "", category: "Work" })
      onOpenChange(false)
    }
  }

  const handleAddExpense = () => {
    if (expenseData.description && expenseData.amount) {
      const transaction = {
        id: Date.now(),
        description: expenseData.description,
        amount: -Math.abs(Number.parseFloat(expenseData.amount)),
        type: "expense",
        category: expenseData.category,
        date: new Date().toISOString().split("T")[0],
      }
      onAddTransaction(transaction)
      setExpenseData({ description: "", amount: "", category: "Food" })
      onOpenChange(false)
    }
  }

  const handlePayBill = (billId: number) => {
    const updatedPayables = weeklyPayables.map((payable) =>
      payable.id === billId ? { ...payable, status: "paid" } : payable,
    )
    setWeeklyPayables(updatedPayables)

    // Also add as expense transaction
    const bill = weeklyPayables.find((p) => p.id === billId)
    if (bill) {
      const transaction = {
        id: Date.now(),
        description: `Paid: ${bill.name}`,
        amount: -Math.abs(bill.amount),
        type: "expense",
        category: "Bills",
        date: new Date().toISOString().split("T")[0],
      }
      onAddTransaction(transaction)
      onPayBill(bill.name, bill.amount)
    }
  }

  const pendingBills = weeklyPayables.filter((bill) => bill.status === "pending")
  const thisWeekBills = pendingBills.filter((bill) => bill.week === "This Week")
  const nextWeekBills = pendingBills.filter((bill) => bill.week === "Next Week")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income" className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Income
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              Expense
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Bills
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Description</Label>
                <Input
                  value={incomeData.description}
                  onChange={(e) => setIncomeData({ ...incomeData, description: e.target.value })}
                  placeholder="e.g., Daily work earnings"
                />
              </div>
              <div>
                <Label>Amount ({currency})</Label>
                <Input
                  type="number"
                  value={incomeData.amount}
                  onChange={(e) => setIncomeData({ ...incomeData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={incomeData.category}
                  onValueChange={(value) => setIncomeData({ ...incomeData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddIncome} className="w-full bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Income
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="expense" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Description</Label>
                <Input
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  placeholder="e.g., Lunch, Gas, Shopping"
                />
              </div>
              <div>
                <Label>Amount ({currency})</Label>
                <Input
                  type="number"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={expenseData.category}
                  onValueChange={(value) => setExpenseData({ ...expenseData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddExpense} className="w-full bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            {pendingBills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending bills</p>
                <p className="text-sm">All bills are paid or add new ones in Settings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {thisWeekBills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">This Week</h4>
                    <div className="space-y-2">
                      {thisWeekBills.map((bill) => (
                        <Card key={bill.id} className="p-3">
                          <CardContent className="p-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{bill.name}</p>
                                <p className="text-sm text-gray-600">
                                  {currency}
                                  {bill.amount.toLocaleString()} • Due {bill.dueDay}
                                </p>
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {nextWeekBills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Next Week</h4>
                    <div className="space-y-2">
                      {nextWeekBills.map((bill) => (
                        <Card key={bill.id} className="p-3 opacity-60">
                          <CardContent className="p-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{bill.name}</p>
                                <p className="text-sm text-gray-600">
                                  {currency}
                                  {bill.amount.toLocaleString()} • Due {bill.dueDay}
                                </p>
                              </div>
                              <Badge variant="outline">Upcoming</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
