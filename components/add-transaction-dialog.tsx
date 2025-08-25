"use client"

import { useState } from "react"
import { Dialog, Button } from "@headlessui/react"
import { DollarSign } from "lucide-react"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: any) => void
  budgetCategories: any[]
  expenseCategories: string[]
  currency: string
  defaultDescription?: string
  dailyIncome?: any[]
  setDailyIncome?: (income: any[]) => void
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  onAddTransaction,
  budgetCategories,
  expenseCategories,
  currency,
  defaultDescription = "",
  dailyIncome = [],
  setDailyIncome,
}: AddTransactionDialogProps) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  })

  const [showIncomeConfirmation, setShowIncomeConfirmation] = useState(false)
  const [pendingIncomeTransaction, setPendingIncomeTransaction] = useState<any>(null)

  const getCurrentDayManila = () => {
    return new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Manila",
      weekday: "short",
    })
  }

  const handleSubmit = (type: "income" | "expense") => {
    if (!formData.amount) return

    const transaction = {
      id: Date.now(),
      description: formData.description || (type === "income" ? defaultDescription || "work" : ""),
      amount: type === "expense" ? -Math.abs(Number(formData.amount)) : Number(formData.amount),
      type,
      category: formData.category || (type === "income" ? "Work" : "Other"),
      date: formData.date,
    }

    // Check if this is income for today
    const today = getCurrentDayManila()
    const isToday =
      new Date(formData.date).toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        weekday: "short",
      }) === today

    if (type === "income" && isToday && dailyIncome && setDailyIncome) {
      // Check if today is already locked
      const todayData = dailyIncome.find((day) => day.day === today)
      if (todayData && todayData.locked) {
        // Show override confirmation
        if (
          window.confirm(
            `Today's income is locked at ${currency}${todayData.amount.toLocaleString()}. Do you want to update it?`,
          )
        ) {
          // Update locked amount
          const updated = dailyIncome.map((day) =>
            day.day === today ? { ...day, amount: day.amount + transaction.amount } : day,
          )
          setDailyIncome(updated)
          onAddTransaction(transaction)
          resetForm()
          onOpenChange(false)
        }
        return
      } else {
        // Show confirmation dialog for today's income
        setPendingIncomeTransaction(transaction)
        setShowIncomeConfirmation(true)
        return
      }
    }

    // Regular transaction processing
    onAddTransaction(transaction)
    resetForm()
    onOpenChange(false)
  }

  const handleIncomeConfirmation = (isComplete: boolean) => {
    if (!pendingIncomeTransaction || !dailyIncome || !setDailyIncome) return

    const today = getCurrentDayManila()

    // Update daily income
    const updated = dailyIncome.map((day) =>
      day.day === today
        ? {
            ...day,
            amount: day.amount + pendingIncomeTransaction.amount,
            locked: isComplete, // Lock if user confirms this is all for today
          }
        : day,
    )
    setDailyIncome(updated)

    // Add transaction
    onAddTransaction(pendingIncomeTransaction)

    // Reset and close
    setPendingIncomeTransaction(null)
    setShowIncomeConfirmation(false)
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
    })
  }

  return (
    <Dialog open={open} onClose={onOpenChange}>
      {/* Dialog content here */}
      {/* Income Confirmation Dialog */}
      {showIncomeConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Income Added for Today</h3>
                <p className="text-gray-600 mt-2">
                  You've added {currency}
                  {pendingIncomeTransaction?.amount.toLocaleString()} to today's income.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Is this all you earned today? If yes, we'll lock today's total and expect future income starting
                  tomorrow.
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => handleIncomeConfirmation(false)} variant="outline" className="flex-1">
                  More Income Today
                </Button>
                <Button
                  onClick={() => handleIncomeConfirmation(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  That's All for Today
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  )
}
