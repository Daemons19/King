"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface TransactionListProps {
  transactions: Array<{
    id: number
    description: string
    amount: number
    type: string
    category: string
    date: string
  }>
  currency: string
}

export function TransactionList({ transactions, currency }: TransactionListProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
          Recent Transactions
        </CardTitle>
        <CardDescription>Your latest financial activity</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions yet.</p>
            <p className="text-sm">Add your first transaction using the + button.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-full ${transaction.type === "income" ? "bg-gradient-to-r from-green-100 to-emerald-100" : "bg-gradient-to-r from-red-100 to-orange-100"}`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="w-3 h-3 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{transaction.description}</p>
                    <p className="text-xs text-gray-600">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold text-sm ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                  >
                    {transaction.type === "income" ? "+" : ""}
                    {currency}
                    {Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  <Badge variant="outline" className="text-xs bg-white/80">
                    {transaction.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
