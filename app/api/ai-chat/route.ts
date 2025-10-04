export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { messages, appData } = await req.json()

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Groq API key not configured. Get your FREE key at https://console.groq.com/keys",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // System message with app context
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant for a personal budgeting app. You have access to the user's financial data and can help them manage their money.

Current App Data:
- Currency: ${appData.currency}
- Cash on Hand: ${appData.currency}${appData.cashOnHand.toLocaleString()}
- Starting Balance: ${appData.currency}${appData.startingBalance.toLocaleString()}
- Today's Income: ${appData.currency}${appData.todayIncome.toLocaleString()}
- Today's Goal: ${appData.currency}${appData.todayGoal.toLocaleString()}
- Weekly Earned: ${appData.currency}${appData.weeklyEarned.toLocaleString()}
- Weekly Goal: ${appData.currency}${appData.weeklyGoal.toLocaleString()}
- Weekly Progress: ${appData.goalProgress.toFixed(1)}%
- This Week's Expenses: ${appData.currency}${appData.currentWeekExpenses.toLocaleString()}
- Pending Bills: ${appData.currency}${appData.totalPendingPayables.toLocaleString()}
- Projected Savings: ${appData.currency}${appData.thisWeekProjectedSavings.toLocaleString()}

Pending Bills:
${appData.pendingPayables.length > 0 ? appData.pendingPayables.map((p: any) => `- ${p.name}: ${appData.currency}${p.amount.toLocaleString()} (due ${p.dueDay})`).join("\n") : "None"}

This Week's Expenses:
${appData.thisWeekExpenses.length > 0 ? appData.thisWeekExpenses.map((e: any) => `- ${e.description}: ${appData.currency}${e.amount.toLocaleString()} (${e.category})`).join("\n") : "None yet"}

You can help users:
1. Understand their financial situation
2. Track spending and earnings
3. Manage bills and payables
4. Provide budgeting advice
5. Execute actions like adding income, logging expenses, or marking bills as paid

When users ask you to perform actions, respond with a JSON object in this format:
{
  "message": "Your response to the user",
  "action": {
    "type": "addIncome" | "addExpense" | "markBillAsPaid",
    "amount": number (for income/expense),
    "description": string,
    "category": string (for expense),
    "billName": string (for bill payment)
  }
}

IMPORTANT: When you want to execute an action, YOU MUST respond with valid JSON only, nothing else.
For regular conversation without actions, respond normally without JSON.

Be conversational, helpful, and provide clear financial insights. Use emojis occasionally to be friendly.`,
    }

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
        max_tokens: 800,
        top_p: 1,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Groq API error:", error)

      // Check if it's an authentication error
      if (response.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Invalid API key. Get your FREE Groq API key at https://console.groq.com/keys",
            details: error,
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      return new Response(
        JSON.stringify({
          error: "Failed to get AI response",
          details: error,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const data = await response.json()
    const aiMessage = data.choices[0].message.content

    // Try to parse as JSON for actions
    let parsedResponse
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      let jsonContent = aiMessage
      const jsonMatch = aiMessage.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonContent = jsonMatch[1]
      }

      parsedResponse = JSON.parse(jsonContent)
    } catch {
      // If not JSON, treat as plain message
      parsedResponse = { message: aiMessage }
    }

    return new Response(JSON.stringify(parsedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("AI chat error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
