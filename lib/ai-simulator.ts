interface AppData {
  currency: string
  cashOnHand: number
  startingBalance: number
  todayIncome: number
  todayGoal: number
  weeklyEarned: number
  weeklyGoal: number
  goalProgress: number
  currentWeekExpenses: number
  totalPendingPayables: number
  thisWeekProjectedSavings: number
  pendingPayables: Array<{ name: string; amount: number; dueDay: string }>
  thisWeekExpenses: Array<{ description: string; amount: number; category: string }>
}

interface AIResponse {
  message: string
  action?: {
    type: "addIncome" | "addExpense" | "markBillAsPaid"
    amount?: number
    description?: string
    category?: string
    billName?: string
  }
}

export function simulateAIResponse(userMessage: string, appData: AppData): AIResponse {
  const lowerMessage = userMessage.toLowerCase()

  // Balance inquiries
  if (lowerMessage.includes("balance") || lowerMessage.includes("how much money")) {
    return {
      message: `You currently have ${appData.currency}${appData.cashOnHand.toLocaleString()} in cash on hand. Your starting balance for this week was ${appData.currency}${appData.startingBalance.toLocaleString()}.`,
    }
  }

  // Income/earnings inquiries
  if (lowerMessage.includes("earn") || lowerMessage.includes("income") || lowerMessage.includes("made today")) {
    const percentage = appData.todayGoal > 0 ? ((appData.todayIncome / appData.todayGoal) * 100).toFixed(1) : "0"
    return {
      message: `Today you've earned ${appData.currency}${appData.todayIncome.toLocaleString()} out of your ${appData.currency}${appData.todayGoal.toLocaleString()} goal (${percentage}%). For the week, you've earned ${appData.currency}${appData.weeklyEarned.toLocaleString()} out of ${appData.currency}${appData.weeklyGoal.toLocaleString()}.`,
    }
  }

  // Weekly progress
  if (lowerMessage.includes("progress") || lowerMessage.includes("on track") || lowerMessage.includes("doing")) {
    const message =
      appData.goalProgress >= 100
        ? `Great job! You've achieved ${appData.goalProgress.toFixed(1)}% of your weekly goal. You're exceeding expectations! 🎉`
        : appData.goalProgress >= 70
          ? `You're doing well! At ${appData.goalProgress.toFixed(1)}% of your weekly goal. Keep it up! 💪`
          : `You're at ${appData.goalProgress.toFixed(1)}% of your weekly goal. You still have time to catch up!`
    return { message }
  }

  // Expenses inquiries
  if (lowerMessage.includes("spend") || lowerMessage.includes("spent") || lowerMessage.includes("expense")) {
    if (appData.thisWeekExpenses.length === 0) {
      return { message: "You haven't logged any expenses this week yet." }
    }

    const breakdown = appData.thisWeekExpenses
      .slice(0, 5)
      .map((e) => `• ${e.description}: ${appData.currency}${e.amount.toLocaleString()} (${e.category})`)
      .join("\n")

    return {
      message: `This week you've spent ${appData.currency}${appData.currentWeekExpenses.toLocaleString()}. Here are your recent expenses:\n\n${breakdown}${appData.thisWeekExpenses.length > 5 ? "\n\n...and more" : ""}`,
    }
  }

  // Bills/payables inquiries
  if (lowerMessage.includes("bill") || lowerMessage.includes("payable") || lowerMessage.includes("due")) {
    if (appData.pendingPayables.length === 0) {
      return { message: "You have no pending bills this week. You're all caught up! ✅" }
    }

    const bills = appData.pendingPayables
      .map((p) => `• ${p.name}: ${appData.currency}${p.amount.toLocaleString()} (due ${p.dueDay})`)
      .join("\n")

    return {
      message: `You have ${appData.currency}${appData.totalPendingPayables.toLocaleString()} in pending bills:\n\n${bills}`,
    }
  }

  // Savings inquiries
  if (lowerMessage.includes("saving") || lowerMessage.includes("save")) {
    return {
      message: `Your projected savings for this week is ${appData.currency}${appData.thisWeekProjectedSavings.toLocaleString()}. This is calculated based on your current balance and this week's earnings.`,
    }
  }

  // Add income actions
  if (lowerMessage.includes("add") && (lowerMessage.includes("income") || lowerMessage.includes("earning"))) {
    const amountMatch = userMessage.match(/\d+/)
    const amount = amountMatch ? Number.parseInt(amountMatch[0]) : 0

    if (amount > 0) {
      const description = lowerMessage.includes("work") ? "work" : "income"
      return {
        message: `I've added ${appData.currency}${amount.toLocaleString()} to your income from ${description}. Great work! 💰`,
        action: {
          type: "addIncome",
          amount,
          description,
        },
      }
    }
  }

  // Log expense actions
  if (
    (lowerMessage.includes("log") || lowerMessage.includes("add") || lowerMessage.includes("spent")) &&
    lowerMessage.includes("expense")
  ) {
    const amountMatch = userMessage.match(/\d+/)
    const amount = amountMatch ? Number.parseInt(amountMatch[0]) : 0

    if (amount > 0) {
      let category = "Others"
      let description = "expense"

      if (lowerMessage.includes("food") || lowerMessage.includes("meal")) {
        category = "Food"
        description = "food"
      } else if (lowerMessage.includes("transport") || lowerMessage.includes("fare")) {
        category = "Transportation"
        description = "transport"
      } else if (lowerMessage.includes("bill")) {
        category = "Bills"
        description = "bill payment"
      }

      return {
        message: `I've logged ${appData.currency}${amount.toLocaleString()} as a ${category.toLowerCase()} expense. Your total expenses this week are now ${appData.currency}${(appData.currentWeekExpenses + amount).toLocaleString()}.`,
        action: {
          type: "addExpense",
          amount,
          category,
          description,
        },
      }
    }
  }

  // Mark bill as paid
  if (lowerMessage.includes("mark") && lowerMessage.includes("paid")) {
    const bill = appData.pendingPayables.find((p) => lowerMessage.includes(p.name.toLowerCase()))

    if (bill) {
      return {
        message: `I've marked "${bill.name}" (${appData.currency}${bill.amount.toLocaleString()}) as paid. Great job staying on top of your bills! ✅`,
        action: {
          type: "markBillAsPaid",
          billName: bill.name,
        },
      }
    }
  }

  // Pay bill action (alternative phrasing)
  if ((lowerMessage.includes("pay") || lowerMessage.includes("paid")) && lowerMessage.includes("bill")) {
    const bill = appData.pendingPayables.find((p) => lowerMessage.includes(p.name.toLowerCase()))

    if (bill) {
      return {
        message: `I've marked "${bill.name}" (${appData.currency}${bill.amount.toLocaleString()}) as paid. Well done! ✅`,
        action: {
          type: "markBillAsPaid",
          billName: bill.name,
        },
      }
    } else if (appData.pendingPayables.length > 0) {
      const billList = appData.pendingPayables.map((p) => p.name).join(", ")
      return {
        message: `I didn't catch which bill you want to pay. Your pending bills are: ${billList}. Please specify which one.`,
      }
    }
  }

  // Financial advice
  if (
    lowerMessage.includes("advice") ||
    lowerMessage.includes("should i") ||
    lowerMessage.includes("recommend") ||
    lowerMessage.includes("worry")
  ) {
    if (appData.goalProgress >= 100) {
      return {
        message: `You're doing excellent! You've met your weekly goal. Consider setting aside the extra ${appData.currency}${appData.thisWeekProjectedSavings.toLocaleString()} as savings or investing in something that brings you joy. Keep up the great work! 🌟`,
      }
    } else if (appData.currentWeekExpenses > appData.weeklyEarned * 0.7) {
      return {
        message: `Your expenses (${appData.currency}${appData.currentWeekExpenses.toLocaleString()}) are quite high relative to your earnings (${appData.currency}${appData.weeklyEarned.toLocaleString()}). Consider reviewing your spending in non-essential categories to stay on track with your goals.`,
      }
    } else {
      return {
        message: `You're maintaining a healthy balance between earning and spending. Keep tracking your expenses and you'll reach your weekly goal. Remember to prioritize your pending bills totaling ${appData.currency}${appData.totalPendingPayables.toLocaleString()}.`,
      }
    }
  }

  // Default response
  return {
    message: `I can help you with:\n\n• Checking your balance and earnings\n• Tracking expenses and bills\n• Adding income or logging expenses\n• Marking bills as paid\n• Providing budget advice\n\nWhat would you like to know or do?`,
  }
}
