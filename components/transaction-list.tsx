"use client"

import { CheckCircle2 } from "lucide-react"

interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  category: string
  date: string
  isFinalEarnings?: boolean
}

interface TransactionListProps {
  transactions: Transaction[]
  currency: string
  emptyMessage?: string
  showDayStatus?: boolean
  dayEarnings?: { [key: string]: { amount: number; isFinal: boolean } }
}

export function TransactionList({
  transactions,
  currency,
  emptyMessage = "No transactions",
  showDayStatus = false,
  dayEarnings = {},
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  const groupedByDate = transactions.reduce(
    (groups, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(transaction)
      return groups
    },
    {} as Record<string, Transaction[]>,
  )

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).map(([date, dayTransactions]) => {
        const dateKey = new Date(dayTransactions[0].date).toISOString().split("T")[0]
        const isDayFinal = dayEarnings[dateKey]?.isFinal

        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{date}</h3>
              {showDayStatus && isDayFinal && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Final</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {dayTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    transaction.type === "income" ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"
                  }`}
                >
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.category}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {currency}
                      {transaction.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
