import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { message, appData, history } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OpenAI API key not found")
      return NextResponse.json(
        { message: "AI assistant is not configured. Please add your OpenAI API key.", actions: [] },
        { status: 500 },
      )
    }

    const context = `You are a helpful AI budget assistant for a personal finance app. You help users track expenses, manage bills, and make financial decisions.

CURRENT USER DATA:
- Cash on Hand: ${appData.currency}${appData.cashOnHand?.toLocaleString() || 0}
- Starting Balance: ${appData.currency}${appData.startingBalance?.toLocaleString() || 0}
- Today's Income: ${appData.currency}${appData.todayIncome?.toLocaleString() || 0}
- Today's Goal: ${appData.currency}${appData.todayGoal?.toLocaleString() || 0}
- Weekly Earned: ${appData.currency}${appData.weeklyEarned?.toLocaleString() || 0}
- Weekly Goal: ${appData.currency}${appData.weeklyGoal?.toLocaleString() || 0}
- This Week's Expenses: ${appData.currency}${appData.currentWeekExpenses?.toLocaleString() || 0}
- Pending Bills: ${appData.currency}${appData.totalPendingPayables?.toLocaleString() || 0}

PENDING BILLS:
${appData.pendingPayables?.map((p: any) => `- ${p.name}: ${appData.currency}${p.amount} (due ${p.dueDay})`).join("\n") || "None"}

RECENT EXPENSES:
${
  appData.thisWeekExpenses
    ?.slice(0, 5)
    .map((e: any) => `- ${e.description}: ${appData.currency}${e.amount} (${e.category})`)
    .join("\n") || "None"
}

You can perform actions by responding with:
ACTIONS: [{"type": "addIncome", "amount": 500, "description": "work"}]
ACTIONS: [{"type": "addExpense", "amount": 100, "category": "Food", "description": "lunch"}]
ACTIONS: [{"type": "markBillAsPaid", "billName": "Groceries"}]

Be friendly, concise, and helpful. Use ${appData.currency} when talking about money.`

    const messages = [
      { role: "system", content: context },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI API error:", errorText)
      throw new Error(`OpenAI API failed: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that."

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
