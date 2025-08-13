"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, TrendingUp, TrendingDown } from "lucide-react"

interface TransactionListProps {
  transactions: any[]
  currency: string
}

export function TransactionList({ transactions, currency }: TransactionListProps) {
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Group transactions by date
  const groupedTransactions = sortedTransactions.reduce(
    (groups, transaction) => {
      const date = transaction.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(transaction)
      return groups
    },
    {} as Record<string, any[]>,
  )

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

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Transaction History
        </CardTitle>
        <CardDescription>Your recent income and expenses</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No transactions yet</p>
            <p className="text-sm">Add your first transaction to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 sticky top-0 bg-white/80 backdrop-blur-sm py-1">
                    {formatDate(date)}
                  </h3>
                  <div className="space-y-2">
                    {dayTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          transaction.type === "income" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {transaction.type === "income" ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{transaction.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  transaction.type === "income"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {transaction.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-lg ${
                              transaction.type === "income" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : ""}
                            {currency}
                            {Math.abs(transaction.amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
