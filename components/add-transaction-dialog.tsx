"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Minus, Plus } from "lucide-react"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: any) => void
  budgetCategories: any[]
  currency: string
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  onAddTransaction,
  budgetCategories,
  currency,
}: AddTransactionDialogProps) {
  const [transaction, setTransaction] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction.amount || !transaction.category) return

    const newTransaction = {
      id: Date.now(),
      type: transaction.type,
      amount: Number.parseFloat(transaction.amount),
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      timestamp: new Date().toISOString(),
    }

    onAddTransaction(newTransaction)
    setTransaction({
      type: "expense",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={transaction.type === "expense" ? "default" : "outline"}
              onClick={() => setTransaction({ ...transaction, type: "expense" })}
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-2" />
              Expense
            </Button>
            <Button
              type="button"
              variant={transaction.type === "income" ? "default" : "outline"}
              onClick={() => setTransaction({ ...transaction, type: "income" })}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Income
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={transaction.amount}
              onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={transaction.category}
              onValueChange={(value) => setTransaction({ ...transaction, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {budgetCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={transaction.description}
              onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
              placeholder="Add a note..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={transaction.date}
              onChange={(e) => setTransaction({ ...transaction, date: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Add Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
