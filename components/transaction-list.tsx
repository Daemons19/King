"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"

interface Transaction {
  id: number
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
}

interface TransactionListProps {
  transactions: Transaction[]
  currency: string
}

export function TransactionList({ transactions, currency }: TransactionListProps) {
  // Group transactions by date
  const groupedTransactions = transactions.reduce(
    (groups, transaction) => {
      const date = transaction.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(transaction)
      return groups
    },
    {} as Record<string, Transaction[]>,
  )

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  // Calculate totals
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netAmount = totalIncome - totalExpenses

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    }
  }

  const getDayTotal = (dayTransactions: Transaction[]) => {
    return dayTransactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -Math.abs(t.amount)), 0)
  }

  if (transactions.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800">Recent Transactions</CardTitle>
          <CardDescription>Your income and expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No transactions yet.</p>
            <p className="text-sm">Add your first transaction using the + button.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800">Recent Transactions</CardTitle>
        <CardDescription>
          {transactions.length} transactions • Net: {currency}
          {netAmount.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium text-sm">Income</span>
            </div>
            <p className="text-lg font-bold text-green-700">
              {currency}
              {totalIncome.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium text-sm">Expenses</span>
            </div>
            <p className="text-lg font-bold text-red-700">
              {currency}
              {totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Transactions by Date */}
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const dayTransactions = groupedTransactions[date]
            const dayTotal = getDayTotal(dayTransactions)

            return (
              <div key={date} className="space-y-2">
                {/* Date Header */}
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">{formatDate(date)}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${dayTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {dayTotal >= 0 ? "+" : ""}
                      {currency}
                      {dayTotal.toLocaleString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {dayTransactions.length} {dayTransactions.length === 1 ? "transaction" : "transactions"}
                    </Badge>
                  </div>
                </div>

                {/* Transactions for this date */}
                <div className="space-y-2">
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{transaction.description}</p>
                          <p className="text-xs text-gray-600">{transaction.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.type === "income" ? "+" : "-"}
                          {currency}
                          {Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            transaction.type === "income"
                              ? "border-green-200 text-green-700"
                              : "border-red-200 text-red-700"
                          }`}
                        >
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Show more indicator if there are many transactions */}
        {transactions.length > 10 && (
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">Showing recent transactions • Total: {transactions.length}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
