export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  console.log("[AI Chat] Request received")

  try {
    // Parse request with timeout
    let body
    try {
      const text = await Promise.race([
        req.text(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request body timeout")), 5000)),
      ])
      body = JSON.parse(text)
      console.log("[AI Chat] Request parsed successfully")
    } catch (parseError: any) {
      console.error("[AI Chat] Parse error:", parseError)
      return new Response(
        JSON.stringify({
          message: "Invalid request format. Please try again.",
          error: parseError.message,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    const { messages, appData } = body

    if (!messages || !Array.isArray(messages)) {
      console.error("[AI Chat] Invalid messages format")
      return new Response(
        JSON.stringify({
          message: "Invalid message format. Please refresh and try again.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      )
    }

    // Hardcode the API key directly
    const apiKey = "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"

    console.log("[AI Chat] API key length:", apiKey.length)

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

DAILY INCOME (This Week):
${
  appData?.dailyIncome
    ?.map(
      (d: any) =>
        `${d.day} (${d.date}): ${appData.currency}${d.amount.toLocaleString()} / ${appData.currency}${d.goal.toLocaleString()} ${d.isWorkDay ? "" : "[REST DAY]"}`,
    )
    .join("\n") || "No daily data"
}

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
1. Add income/expenses to ANY date (today, past, or future)
2. Delete ANY transaction by index number
3. Modify balance, goals, any amounts
4. Mark bills paid or delete them
5. Edit workday status for any day
6. Modify daily income amounts directly
7. Clear all data
8. Provide financial analysis and suggestions

CRITICAL RESPONSE FORMAT:
- When executing actions, respond with PURE JSON ONLY
- NO markdown formatting, NO code blocks, NO backticks
- Just raw JSON: {"message": "text", "action": {...}}
- For regular chat (no actions), respond naturally without JSON

ACTION TYPES:
- addIncome: {"type": "addIncome", "amount": 1000, "description": "work", "date": "2025-10-06"}
  * If date is omitted, adds to today
  * Date format: YYYY-MM-DD
- addExpense: {"type": "addExpense", "amount": 100, "category": "Food", "description": "lunch", "date": "2025-10-06"}
- deleteTransaction: {"type": "deleteTransaction", "index": 5}
- modifyBalance: {"type": "modifyBalance", "newBalance": 5000}
- updateGoal: {"type": "updateGoal", "goalType": "daily", "newGoal": 1200}
- setDailyIncome: {"type": "setDailyIncome", "date": "2025-10-06", "amount": 1100}
  * Directly sets the income for a specific date
- setWorkDay: {"type": "setWorkDay", "date": "2025-10-06", "isWorkDay": true, "goal": 1100}
  * Sets whether a day is a workday and its goal
- markBillPaid: {"type": "markBillPaid", "billName": "Groceries"}
- deleteBill: {"type": "deleteBill", "billName": "Phone"}
- clearAllData: {"type": "clearAllData"}

EXAMPLES:
User: "Add 1100 to monday and Tuesday is 1 earnings"
You: {"message":"Added ₱1,100 to Monday and ₱1,000 to Tuesday! 💰","action":{"type":"addIncomeMultiple","entries":[{"date":"2025-10-06","amount":1100,"description":"work"},{"date":"2025-10-07","amount":1000,"description":"work"}]}}

User: "Set Monday as rest day"
You: {"message":"Monday is now a rest day! 😴","action":{"type":"setWorkDay","date":"2025-10-06","isWorkDay":false,"goal":0}}

User: "Delete transaction 3"
You: {"message":"Deleted transaction #3! ✓","action":{"type":"deleteTransaction","index":3}}

User: "How am I doing?"
You: You're doing great! You've earned ₱${appData?.weeklyEarned || 0} this week. Keep it up! 💪

Be conversational, helpful, provide tips and insights. You are the ultimate admin with full control.`,
    }

    console.log("[AI Chat] Making request to Groq API...")

    // Set up abort controller with 40 second timeout for mobile networks
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error("[AI Chat] Request timeout after 40 seconds")
      controller.abort()
    }, 40000)

    let response
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
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
      console.log("[AI Chat] Groq API responded with status:", response.status)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error("[AI Chat] Fetch error:", fetchError.name, fetchError.message)

      if (fetchError.name === "AbortError") {
        return new Response(
          JSON.stringify({
            message:
              "⏱️ Request timed out. This can happen on slow networks. Please check your internet connection (WiFi or mobile data) and try again.",
            errorType: "timeout",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        )
      }

      if (
        fetchError.message?.toLowerCase().includes("fetch") ||
        fetchError.message?.toLowerCase().includes("network") ||
        fetchError.message?.toLowerCase().includes("failed")
      ) {
        return new Response(
          JSON.stringify({
            message:
              "🌐 Cannot connect to AI service. Please check your internet connection:\n\n1. Make sure WiFi or mobile data is ON\n2. Try switching between WiFi and mobile data\n3. Check if other apps can connect to internet\n4. Try again in a few seconds",
            errorType: "network",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        )
      }

      return new Response(
        JSON.stringify({
          message: `⚠️ Connection error: ${fetchError.message}. Please check your internet and try again.`,
          errorType: "unknown",
          errorDetails: fetchError.message,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      )
    }

    // Handle HTTP errors
    if (!response.ok) {
      let errorText = ""
      let errorData: any = null

      try {
        errorText = await response.text()
        console.error("[AI Chat] Error response:", errorText.substring(0, 500))

        try {
          errorData = JSON.parse(errorText)
        } catch {
          // Not JSON, just text error
        }
      } catch (e) {
        errorText = "Unable to read error details"
      }

      console.error("[AI Chat] HTTP error:", response.status, response.statusText)

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({
            message: "🔐 Authentication error. The AI service key may be invalid. Please contact support.",
            errorType: "auth",
            statusCode: response.status,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        )
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            message: "⏳ Too many requests. The AI service is busy. Please wait 30 seconds and try again.",
            errorType: "rateLimit",
            statusCode: response.status,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        )
      }

      if (response.status >= 500 && response.status < 600) {
        return new Response(
          JSON.stringify({
            message: "🔧 AI service is temporarily down. This is not your fault. Please try again in 1-2 minutes.",
            errorType: "serverError",
            statusCode: response.status,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        )
      }

      if (response.status === 400) {
        return new Response(
          JSON.stringify({
            message: "⚠️ Invalid request format. Please try rephrasing your message.",
            errorType: "badRequest",
            statusCode: response.status,
            details: errorData?.error?.message || errorText.substring(0, 100),
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        )
      }

      return new Response(
        JSON.stringify({
          message: `❌ Service error (${response.status}). Please try again. If this persists, wait a few minutes.`,
          errorType: "httpError",
          statusCode: response.status,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      )
    }

    // Parse response with error handling
    let data
    try {
      const responseText = await response.text()
      console.log("[AI Chat] Response text length:", responseText.length)

      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from AI service")
      }

      data = JSON.parse(responseText)
      console.log("[AI Chat] Response parsed successfully")
    } catch (parseError: any) {
      console.error("[AI Chat] Parse error:", parseError.message)
      return new Response(
        JSON.stringify({
          message: "⚠️ Received invalid response from AI service. Please try again.",
          errorType: "parseError",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      )
    }

    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("[AI Chat] Invalid response structure:", JSON.stringify(data).substring(0, 200))
      return new Response(
        JSON.stringify({
          message: "⚠️ Received unexpected response format. Please try again.",
          errorType: "invalidStructure",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      )
    }

    let aiMessage = data.choices[0]?.message?.content

    if (!aiMessage || typeof aiMessage !== "string") {
      console.error("[AI Chat] No message content in response")
      return new Response(
        JSON.stringify({
          message: "⚠️ AI service returned empty response. Please try again.",
          errorType: "emptyContent",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      )
    }

    console.log("[AI Chat] AI message received, length:", aiMessage.length)

    aiMessage = aiMessage
      .replace(/```json\s*/gi, "")
      .replace(/```javascript\s*/gi, "")
      .replace(/```js\s*/gi, "")
      .replace(/```\s*/g, "")
      .replace(/^\s*json\s*/gi, "")
      .replace(/^\s*javascript\s*/gi, "")
      .trim()

    // Try parsing as JSON for actions
    try {
      const parsed = JSON.parse(aiMessage)
      console.log("[AI Chat] Response is JSON action")
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      })
    } catch {
      // Not JSON, return as plain message
      console.log("[AI Chat] Response is plain text")
      return new Response(
        JSON.stringify({
          message: aiMessage,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      )
    }
  } catch (error: any) {
    console.error("[AI Chat] Unexpected error:", error.name, error.message, error.stack)
    return new Response(
      JSON.stringify({
        message: `💥 Unexpected error: ${error.message}. Please try again. If this keeps happening, try:\n\n1. Refresh the app\n2. Check your internet\n3. Wait a minute and retry`,
        errorType: "unexpected",
        errorDetails: error.message,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    )
  }
}
