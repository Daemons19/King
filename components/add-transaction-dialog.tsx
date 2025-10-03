"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "income" | "expense"
  onAdd: (transaction: {
    type: "income" | "expense"
    amount: number
    description: string
    category: string
    date: string
    isFinalEarnings?: boolean
  }) => void
}

export function AddTransactionDialog({ open, onOpenChange, type, onAdd }: AddTransactionDialogProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState(type === "income" ? "work" : "")
  const [category, setCategory] = useState(type === "income" ? "work" : "Food")
  const [isFinalEarnings, setIsFinalEarnings] = useState(false)

  const expenseCategories = ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Other"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = Number.parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    onAdd({
      type,
      amount: numAmount,
      description: description.trim() || (type === "income" ? "work" : category),
      category: type === "income" ? "work" : category,
      date: new Date().toISOString(),
      isFinalEarnings: type === "income" ? isFinalEarnings : undefined,
    })

    setAmount("")
    setDescription(type === "income" ? "work" : "")
    setCategory(type === "income" ? "work" : "Food")
    setIsFinalEarnings(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "income" ? "Add Income" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (₱)</Label>
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

          {type === "expense" && (
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
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

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "income" ? "work" : "Enter description"}
            />
          </div>

          {type === "income" && (
            <div className="flex items-start space-x-2 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <Checkbox
                id="finalEarnings"
                checked={isFinalEarnings}
                onCheckedChange={(checked) => setIsFinalEarnings(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="finalEarnings"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  This is all my earnings for today
                </label>
                <p className="text-xs text-muted-foreground">
                  Check this if you're done earning for the day. This helps calculate accurate projections.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{type === "income" ? "Add Income" : "Add Expense"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
