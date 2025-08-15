"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, DollarSign, TrendingDown } from "lucide-react"

interface Transaction {
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
}

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: Transaction) => void
  budgetCategories: Array<{ name: string; budgeted: number; spent: number; color: string; id: number }>
  currency: string
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  onAddTransaction,
  budgetCategories,
  currency,
}: AddTransactionDialogProps) {
  const [activeTab, setActiveTab] = useState("income")
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  })

  const handleSubmit = (type: "income" | "expense") => {
    if (!formData.description || !formData.amount) return

    const transaction: Transaction = {
      description: formData.description,
      amount: Number.parseFloat(formData.amount),
      type,
      category: formData.category || (type === "income" ? "Work" : "Other"),
      date: formData.date,
    }

    onAddTransaction(transaction)
    setFormData({
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
    })
    onOpenChange(false)
  }

  const incomeCategories = ["Work", "Freelance", "Business", "Investment", "Gift", "Other"]
  const expenseCategories =
    budgetCategories.length > 0
      ? budgetCategories.map((cat) => cat.name)
      : ["Food", "Transport", "Entertainment", "Shopping", "Bills", "Other"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 bg-gradient-to-br from-white to-purple-50">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Add Transaction
          </DialogTitle>
          <DialogDescription>Record your income or expenses</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-purple-100 p-1 rounded-lg">
            <TabsTrigger value="income" className="data-[state=active]:bg-white rounded-md">
              <DollarSign className="w-4 h-4 mr-2" />
              Income
            </TabsTrigger>
            <TabsTrigger value="expense" className="data-[state=active]:bg-white rounded-md">
              <TrendingDown className="w-4 h-4 mr-2" />
              Expense
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income-description">Description</Label>
                <Input
                  id="income-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Daily work earnings"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-amount">Amount ({currency})</Label>
                <Input
                  id="income-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="1100"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select category" />
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

              <div className="space-y-2">
                <Label htmlFor="income-date">Date</Label>
                <Input
                  id="income-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-white"
                />
              </div>

              <Button
                onClick={() => handleSubmit("income")}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                disabled={!formData.description || !formData.amount}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Income
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="expense" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense-description">Description</Label>
                <Input
                  id="expense-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Lunch, transport, etc."
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount ({currency})</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="50"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select category" />
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

              <div className="space-y-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-white"
                />
              </div>

              <Button
                onClick={() => handleSubmit("expense")}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600"
                disabled={!formData.description || !formData.amount}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
