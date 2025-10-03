"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: {
    description: string
    amount: number
    type: "income" | "expense"
    category: string
    date: string
    isFinalForDay?: boolean
  }) => void
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
  const [type, setType] = useState<"income" | "expense">("income")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState(defaultDescription)
  const [category, setCategory] = useState("")
  const [isFinalForDay, setIsFinalForDay] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (type === "expense" && !category) {
      alert("Please select a category")
      return
    }

    onAddTransaction({
      description: description || (type === "income" ? "work" : category),
      amount: type === "income" ? Number(amount) : -Number(amount),
      type,
      category: type === "income" ? "Work" : category,
      date: new Date().toISOString().split("T")[0],
      isFinalForDay: type === "income" ? isFinalForDay : undefined,
    })

    // Reset form
    setAmount("")
    setDescription(defaultDescription)
    setCategory("")
    setIsFinalForDay(false)
    onOpenChange(false)
  }

  const handleTypeChange = (newType: "income" | "expense") => {
    setType(newType)
    setCategory("")
    if (newType === "income") {
      setDescription(defaultDescription)
    } else {
      setDescription("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Add a new income or expense to your budget.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value: "income" | "expense") => handleTypeChange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "income" ? "work" : "Enter description"}
            />
          </div>

          {type === "expense" && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
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
          )}

          {type === "income" && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="finalForDay"
                checked={isFinalForDay}
                onCheckedChange={(checked) => setIsFinalForDay(checked as boolean)}
              />
              <div className="flex-1">
                <Label
                  htmlFor="finalForDay"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  This is all my earnings for today
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Check this if you won't add any more income today. This will update your projections.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
