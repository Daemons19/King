"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, Wallet, CreditCard } from "lucide-react"

interface FloatingActionButtonProps {
  onAction: (action: "income" | "expense" | "bills") => void
}

export function FloatingActionButton({ onAction }: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleAction = (action: "income" | "expense" | "bills") => {
    onAction(action)
    setIsExpanded(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action Buttons */}
      <div
        className={`flex flex-col gap-3 mb-3 transition-all duration-300 ${
          isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Pay Bills */}
        <Button
          onClick={() => handleAction("bills")}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Pay Bills
        </Button>

        {/* Add Expense */}
        <Button
          onClick={() => handleAction("expense")}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Expense
        </Button>

        {/* Add Income */}
        <Button
          onClick={() => handleAction("income")}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Income
        </Button>
      </div>

      {/* Main FAB */}
      <Button
        onClick={toggleExpanded}
        size="icon"
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
          isExpanded ? "rotate-45" : "rotate-0"
        }`}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  )
}
