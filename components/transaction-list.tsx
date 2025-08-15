"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Filter, Calendar } from "lucide-react"

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
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") return true
    return transaction.type === filter
  })

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    } else if (sortBy === "amount") {
      return Math.abs(b.amount) - Math.abs(a.amount)
    }
    return 0
  })

  // Calculate totals
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netAmount = totalIncome - totalExpenses

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-800">Transaction Summary</CardTitle>
          <CardDescription>Your financial activity overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-gray-600">Income</span>
              </div>
              <div className="font-bold text-green-600">
                {currency}
                {totalIncome.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                <span className="text-sm text-gray-600">Expenses</span>
              </div>
              <div className="font-bold text-red-600">
                {currency}
                {totalExpenses.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Calendar className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-sm text-gray-600">Net</span>
              </div>
              <div className={`font-bold ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                {currency}
                {netAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="bg-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="income">Income Only</SelectItem>
                  <SelectItem value="expense">Expenses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="amount">Sort by Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800">Recent Transactions ({sortedTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found</p>
              <p className="text-sm">Start by adding your first transaction</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{transaction.description}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                        </Badge>
                        <span className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold text-lg ${
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {currency}
                      {Math.abs(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
