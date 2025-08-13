"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  if (transactions.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No transactions yet.</p>
            <p className="text-sm">Add your first income or expense to get started.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {currency}
                {totalIncome.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Income</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {currency}
                {totalExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Expenses</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                {currency}
                {netAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Net Amount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions by Date */}
      {sortedDates.map((date) => {
        const dayTransactions = groupedTransactions[date]
        const dayIncome = dayTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
        const dayExpenses = dayTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        const dayNet = dayIncome - dayExpenses

        return (
          <Card key={date} className="bg-white/80 backdrop-blur-sm border-0">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <CardTitle className="text-lg text-gray-800">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                </div>
                <Badge variant={dayNet >= 0 ? "default" : "destructive"}>
                  {currency}
                  {dayNet.toLocaleString()}
                </Badge>
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span className="text-green-600">
                  Income: {currency}
                  {dayIncome.toLocaleString()}
                </span>
                <span className="text-red-600">
                  Expenses: {currency}
                  {dayExpenses.toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                      >
                        {transaction.type === "income" ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{transaction.description}</p>
                        <p className="text-sm text-gray-600">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "income" ? "+" : "-"}
                        {currency}
                        {Math.abs(transaction.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
