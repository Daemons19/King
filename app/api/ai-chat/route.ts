export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { messages, appData } = await req.json()

    // Get API key from environment
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      console.error("GROQ_API_KEY not found in environment")
      return new Response(
        JSON.stringify({
          message: "⚠️ AI service not configured. Please add GROQ_API_KEY to environment variables.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        },
      )
    }

    // Build system message with current app data
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant for a personal budgeting app. You have access to the user's financial data and can help them manage their money.

Current App Data:
- Currency: ${appData?.currency || "₱"}
- Cash on Hand: ${appData?.currency || "₱"}${(appData?.cashOnHand || 0).toLocaleString()}
- Starting Balance: ${appData?.currency || "₱"}${(appData?.startingBalance || 0).toLocaleString()}
- Today's Income: ${appData?.currency || "₱"}${(appData?.todayIncome || 0).toLocaleString()}
- Today's Goal: ${appData?.currency || "₱"}${(appData?.todayGoal || 0).toLocaleString()}
- Weekly Earned: ${appData?.currency || "₱"}${(appData?.weeklyEarned || 0).toLocaleString()}
- Weekly Goal: ${appData?.currency || "₱"}${(appData?.weeklyGoal || 0).toLocaleString()}
- Weekly Progress: ${(appData?.goalProgress || 0).toFixed(1)}%
- This Week's Expenses: ${appData?.currency || "₱"}${(appData?.currentWeekExpenses || 0).toLocaleString()}
- Pending Bills: ${appData?.currency || "₱"}${(appData?.totalPendingPayables || 0).toLocaleString()}
- Projected Savings: ${appData?.currency || "₱"}${(appData?.thisWeekProjectedSavings || 0).toLocaleString()}

Pending Bills:
${appData?.pendingPayables && appData.pendingPayables.length > 0 ? appData.pendingPayables.map((p: any) => `- ${p.name}: ${appData.currency}${p.amount.toLocaleString()} (due ${p.dueDay})`).join("\n") : "None"}

This Week's Expenses:
${appData?.thisWeekExpenses && appData.thisWeekExpenses.length > 0 ? appData.thisWeekExpenses.map((e: any) => `- ${e.description}: ${appData.currency}${e.amount.toLocaleString()} (${e.category})`).join("\n") : "None yet"}

You can help users:
1. Understand their financial situation
2. Track spending and earnings
3. Manage bills and payables
4. Provide budgeting advice
5. Execute actions like adding income, logging expenses, or marking bills as paid

When users ask you to perform actions, respond with a JSON object in this format:
{
  "message": "Your friendly response to the user",
  "action": {
    "type": "addIncome" | "addExpense" | "markBillAsPaid",
    "amount": number (for income/expense),
    "description": string,
    "category": string (for expense),
    "billName": string (for bill payment)
  }
}

For regular conversation without actions, respond normally without JSON.
Be conversational, helpful, and provide clear financial insights. Use emojis occasionally to be friendly.`,
    }

    // Set up timeout for API call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout

    try {
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
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Groq API error:", response.status, errorText)

        let errorMessage = "Sorry, I encountered an error communicating with the AI service."

        if (response.status === 401) {
          errorMessage = "⚠️ AI service authentication failed. Please check your API key."
        } else if (response.status === 429) {
          errorMessage = "⚠️ Too many requests. Please wait a moment and try again."
        } else if (response.status >= 500) {
          errorMessage = "⚠️ AI service is temporarily unavailable. Please try again later."
        }

        return new Response(JSON.stringify({ message: errorMessage }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Invalid response structure:", data)
        return new Response(
          JSON.stringify({
            message: "Sorry, I received an unexpected response. Please try again.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
          },
        )
      }

      const aiMessage = data.choices[0].message.content

      // Try to parse as JSON for actions
      let parsedResponse
      try {
        // Remove markdown code blocks if present
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
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === "AbortError") {
        console.error("Request timeout")
        return new Response(
          JSON.stringify({
            message: "⏱️ Request timed out. Please check your internet connection and try again.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
          },
        )
      }

      console.error("Fetch error:", fetchError)
      throw fetchError
    }
  } catch (error: any) {
    console.error("AI chat error:", error)

    let errorMessage = "Sorry, I encountered an error. Please check your internet connection and try again."

    if (error.message && error.message.includes("JSON")) {
      errorMessage = "Sorry, there was an error processing your request. Please try again."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    })
  }
}
