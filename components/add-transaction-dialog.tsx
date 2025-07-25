"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: any) => void
  currency: string
}

export function AddTransactionDialog({ open, onOpenChange, onAddTransaction, currency }: AddTransactionDialogProps) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "income",
    category: "",
    date: new Date().toISOString().split("T")[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const transaction = {
      id: Date.now(),
      description: formData.description,
      amount: formData.type === "expense" ? -Math.abs(Number(formData.amount)) : Number(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
    }

    onAddTransaction(transaction)
    onOpenChange(false)

    // Reset form
    setFormData({
      description: "",
      amount: "",
      type: "income",
      category: "",
      date: new Date().toISOString().split("T")[0],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-gradient-to-br from-white to-purple-50 mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Add Transaction
          </DialogTitle>
          <DialogDescription>Record your daily income or expenses</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="bg-white/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">💰 Income</SelectItem>
                <SelectItem value="expense">💸 Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{currency}</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="bg-white/80 text-lg pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="bg-white/80"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="bg-white/80">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {formData.type === "income" ? (
                  <>
                    <SelectItem value="work">💼 Work</SelectItem>
                    <SelectItem value="freelance">🚀 Freelance</SelectItem>
                    <SelectItem value="tips">💵 Tips</SelectItem>
                    <SelectItem value="bonus">🎁 Bonus</SelectItem>
                    <SelectItem value="other">💰 Other</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="food">🍔 Food</SelectItem>
                    <SelectItem value="transport">🚗 Transport</SelectItem>
                    <SelectItem value="entertainment">🎬 Entertainment</SelectItem>
                    <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                    <SelectItem value="bills">📋 Bills</SelectItem>
                    <SelectItem value="other">💸 Other</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Add {formData.type === "income" ? "Income" : "Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
