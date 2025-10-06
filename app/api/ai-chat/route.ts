export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { messages, appData } = await req.json()

    const apiKey = "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"

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          message: "AI service not configured properly.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const systemMessage = {
      role: "system",
      content: `You are a powerful AI budget assistant with FULL ADMIN access to the user's financial app. You can read, create, modify, and delete ANY data.

CURRENT APP DATA:
- Currency: ${appData?.currency || "₱"}
- Cash on Hand: ${appData?.currency || "₱"}${(appData?.cashOnHand || 0).toLocaleString()}
- Starting Balance: ${appData?.currency || "₱"}${(appData?.startingBalance || 0).toLocaleString()}
- Today's Income: ${appData?.currency || "₱"}${(appData?.todayIncome || 0).toLocaleString()}
- Today's Goal: ${appData?.currency || "₱"}${(appData?.todayGoal || 0).toLocaleString()}
- Weekly Earned: ${appData?.currency || "₱"}${(appData?.weeklyEarned || 0).toLocaleString()}
- Weekly Goal: ${appData?.currency || "₱"}${(appData?.weeklyGoal || 0).toLocaleString()}
- Weekly Progress: ${(appData?.goalProgress || 0).toFixed(1)}%
- This Week Expenses: ${appData?.currency || "₱"}${(appData?.currentWeekExpenses || 0).toLocaleString()}
- Pending Bills: ${appData?.currency || "₱"}${(appData?.totalPendingPayables || 0).toLocaleString()}

ALL TRANSACTIONS (Last 50):
${
  appData?.allTransactions
    ?.slice(0, 50)
    .map(
      (t: any, i: number) =>
        `${i + 1}. [${t.type}] ${t.description || t.category}: ${appData.currency}${Math.abs(t.amount).toLocaleString()} (${t.date})`,
    )
    .join("\n") || "No transactions"
}

PENDING BILLS:
${appData?.pendingPayables?.map((p: any) => `- ${p.name}: ${appData.currency}${p.amount.toLocaleString()} (${p.dueDay})`).join("\n") || "None"}

THIS WEEK EXPENSES:
${appData?.thisWeekExpenses?.map((e: any) => `- ${e.description}: ${appData.currency}${e.amount.toLocaleString()} (${e.category})`).join("\n") || "None"}

YOU HAVE FULL ADMIN POWERS TO:
1. Add income/expenses
2. Delete ANY transaction by index number
3. Modify balance, goals, any amounts
4. Mark bills paid or delete them
5. Clear all data
6. Provide financial analysis and suggestions

CRITICAL: When executing actions, respond with ONLY pure JSON (no markdown, no code blocks, no backticks):
{"message": "Friendly response", "action": {"type": "actionType", "params": {...}}}

ACTION TYPES:
- addIncome: {"type": "addIncome", "amount": 1000, "description": "work"}
- addExpense: {"type": "addExpense", "amount": 100, "category": "Food", "description": "lunch"}
- deleteTransaction: {"type": "deleteTransaction", "index": 5}
- modifyBalance: {"type": "modifyBalance", "newBalance": 5000}
- updateGoal: {"type": "updateGoal", "goalType": "daily", "newGoal": 1200}
- markBillPaid: {"type": "markBillPaid", "billName": "Groceries"}
- deleteBill: {"type": "deleteBill", "billName": "Phone"}
- clearAllData: {"type": "clearAllData"}

For regular chat (no actions), just respond naturally without JSON.

Examples:
User: "Add 1100 from work"
You: {"message":"Added ₱1,100 from work! 💰","action":{"type":"addIncome","amount":1100,"description":"work"}}

User: "Delete transaction 3"
You: {"message":"Deleted transaction #3! ✓","action":{"type":"deleteTransaction","index":3}}

User: "How am I doing?"
You: You're doing great! You've earned ₱1,300 this week which is 15.28% of your goal. Keep it up! 💪

Be conversational, helpful, provide tips and insights. You are the ultimate admin.`,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Groq error:", response.status, errorText)
      return new Response(JSON.stringify({ message: "Sorry, I encountered an error. Please try again." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const data = await response.json()
    let aiMessage = data.choices?.[0]?.message?.content || "I couldn't process that."

    // Strip markdown code blocks
    aiMessage = aiMessage
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()

    // Try parsing as JSON
    try {
      const parsed = JSON.parse(aiMessage)
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch {
      return new Response(JSON.stringify({ message: aiMessage }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("AI error:", error)
    return new Response(JSON.stringify({ message: "Network error. Check your connection." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }
}
