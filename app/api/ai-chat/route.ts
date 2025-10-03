import { OpenAI } from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { message, appData, history } = await req.json()

    // Build context from app data
    const context = `
You are a helpful AI budget assistant. You have access to the user's financial data and can help them manage their money.

CURRENT USER DATA:
- Cash on Hand: ${appData.currency}${appData.cashOnHand.toLocaleString()}
- Starting Balance: ${appData.currency}${appData.startingBalance.toLocaleString()}
- Today's Earnings: ${appData.currency}${appData.todayIncome.toLocaleString()}
- Today's Goal: ${appData.currency}${appData.todayGoal.toLocaleString()}
- Weekly Earned: ${appData.currency}${appData.weeklyEarned.toLocaleString()}
- Weekly Goal: ${appData.currency}${appData.weeklyGoal.toLocaleString()}
- Goal Progress: ${appData.goalProgress.toFixed(1)}%
- This Week's Expenses: ${appData.currency}${appData.currentWeekExpenses.toLocaleString()}
- Pending Bills Total: ${appData.currency}${appData.totalPendingPayables.toLocaleString()}
- Remaining Work Days: ${appData.remainingWorkDays}
- Potential Remaining Earnings: ${appData.currency}${appData.potentialRemainingEarnings.toLocaleString()}
- This Week's Projected Savings: ${appData.currency}${appData.thisWeekProjectedSavings.toLocaleString()}

PENDING BILLS:
${appData.pendingPayables.map((p: any) => `- ${p.name}: ${appData.currency}${p.amount.toLocaleString()} (due ${p.dueDay})`).join("\n") || "None"}

THIS WEEK'S EXPENSES:
${appData.thisWeekExpenses.map((e: any) => `- ${e.description}: ${appData.currency}${e.amount.toLocaleString()} (${e.category}, ${e.date})`).join("\n") || "None"}

AVAILABLE ACTIONS:
You can execute the following actions by including them in your response:
1. addIncome(amount, description) - Add income/earnings
2. addExpense(amount, category, description) - Log an expense
3. markBillAsPaid(billName) - Mark a bill as paid

To execute actions, include a JSON array in your response like this:
ACTIONS: [{"type": "addIncome", "amount": 500, "description": "work"}]

INSTRUCTIONS:
- Be friendly, helpful, and concise
- Use the currency symbol ${appData.currency} when talking about money
- When asked to take actions, confirm what you're doing
- Provide financial insights and advice when appropriate
- If user asks to add income, add expense, or pay bills, execute the action
- Always format numbers with commas for readability
- Be proactive in suggesting actions if you notice issues

Remember: You can modify the app data by returning actions. Always confirm actions you've taken.
`

    // Build messages for OpenAI
    const messages: any[] = [
      { role: "system", content: context },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    })

    const responseText = completion.choices[0].message.content || "I'm sorry, I couldn't process that."

    // Parse actions from response
    const actionMatch = responseText.match(/ACTIONS:\s*(\[.*?\])/s)
    let actions = []
    let cleanedResponse = responseText

    if (actionMatch) {
      try {
        actions = JSON.parse(actionMatch[1])
        cleanedResponse = responseText.replace(/ACTIONS:\s*\[.*?\]/s, "").trim()
      } catch (e) {
        console.error("Failed to parse actions:", e)
      }
    }

    return NextResponse.json({
      message: cleanedResponse,
      actions: actions,
    })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json(
      { message: "Sorry, I encountered an error. Please try again.", actions: [] },
      { status: 500 },
    )
  }
}
