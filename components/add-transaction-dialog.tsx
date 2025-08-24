"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus } from "lucide-react"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: any) => void
  budgetCategories: any[]
  expenseCategories: string[]
  currency: string
  defaultDescription?: string
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  onAddTransaction,
  budgetCategories,
  expenseCategories,
  currency,
  defaultDescription = "work",
}: AddTransactionDialogProps) {
  const [activeTab, setActiveTab] = useState("income")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")

  const handleSubmit = (type: "income" | "expense") => {
    if (!amount || !category) return

    const transaction = {
      amount: type === "expense" ? -Math.abs(Number.parseFloat(amount)) : Number.parseFloat(amount),
      type,
      category,
      description: type === "income" ? defaultDescription : category, // Use default for income, category for expense
      date: new Date().toISOString().split("T")[0],
    }

    onAddTransaction(transaction)

    // Reset form
    setAmount("")
    setCategory("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Income
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <Minus className="w-4 h-4" />
              Expense
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income-amount">Amount ({currency})</Label>
              <Input
                id="income-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="income-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Investment">Investment</SelectItem>
                  <SelectItem value="Gift">Gift</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => handleSubmit("income")}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!amount || !category}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Income
            </Button>
          </TabsContent>

          <TabsContent value="expense" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount ({currency})</Label>
              <Input
                id="expense-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => handleSubmit("expense")}
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={!amount || !category}
            >
              <Minus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
