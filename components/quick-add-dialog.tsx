"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, DollarSign, TrendingDown, CreditCard, Check } from "lucide-react"

interface Transaction {
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
}

interface QuickAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
  weeklyPayables: Array<{
    id: number
    name: string
    amount: number
    dueDay: string
    status: string
    week: string
  }>
  setWeeklyPayables: (payables: any[]) => void
  initialTab?: "income" | "expense" | "bills" | null
  onPayBill: (billName: string, amount: number) => void
  onAddTransaction: (transaction: Transaction) => void
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

  const markPayableAsPaid = (id: number) => {
    const updated = weeklyPayables.map((payable) => (payable.id === id ? { ...payable, status: "paid" } : payable))
    setWeeklyPayables(updated)

    const paidBill = weeklyPayables.find((p) => p.id === id)
    if (paidBill) {
      onPayBill(paidBill.name, paidBill.amount)
    }
  }

  const pendingPayables = weeklyPayables.filter((p) => p.status === "pending")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 bg-gradient-to-br from-white to-purple-50">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Quick Actions
          </DialogTitle>
          <DialogDescription>Add income, expenses, or pay bills</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-purple-100 p-1 rounded-lg">
            <TabsTrigger value="income" className="data-[state=active]:bg-white rounded-md text-xs">
              <DollarSign className="w-3 h-3 mr-1" />
              Income
            </TabsTrigger>
            <TabsTrigger value="expense" className="data-[state=active]:bg-white rounded-md text-xs">
              <TrendingDown className="w-3 h-3 mr-1" />
              Expense
            </TabsTrigger>
            <TabsTrigger value="bills" className="data-[state=active]:bg-white rounded-md text-xs">
              <CreditCard className="w-3 h-3 mr-1" />
              Bills
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

          <TabsContent value="bills" className="space-y-4">
            <div className="space-y-3">
              {pendingPayables.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending bills</p>
                  <p className="text-sm">All bills are paid!</p>
                </div>
              ) : (
                pendingPayables.map((payable) => (
                  <div key={payable.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{payable.name}</div>
                      <div className="text-sm text-gray-600">
                        {currency}
                        {payable.amount.toLocaleString()} • {payable.dueDay}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {payable.week}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => markPayableAsPaid(payable.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Pay
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
