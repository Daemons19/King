"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, Mic, MicOff, X, Sparkles, WifiOff, Wifi, AlertCircle, RefreshCw } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AIAssistantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appData: any
  actionHandlers: {
    addIncome: (amount: number, description?: string) => void
    addExpense: (amount: number, category: string, description?: string) => void
    markBillAsPaid: (billName: string) => boolean
    deleteTransaction: (index: number) => boolean
    modifyBalance: (newBalance: number) => void
    updateGoal: (goalType: "daily" | "weekly", newGoal: number) => void
    deleteBill: (billName: string) => boolean
    clearAllData: () => void
    getAppData: () => any
    refreshData: () => void
  }
}

export function AIAssistant({ open, onOpenChange, appData, actionHandlers }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! 👋 I'm your AI budget assistant with FULL ADMIN ACCESS. I can help you manage your finances, add/delete transactions, modify balances, update goals, and provide financial advice. What would you like me to do?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const lastMessageRef = useRef<string>("")

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 100)
    }
  }, [open])

  useEffect(() => {
    const handleOnline = () => {
      console.log("[AI Assistant] Internet connection restored")
      setIsOnline(true)
      setLastError(null)
    }

    const handleOffline = () => {
      console.log("[AI Assistant] Internet connection lost")
      setIsOnline(false)
      setLastError("offline")
    }

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }
      recognitionRef.current.onerror = (event: any) => {
        console.error("[AI Assistant] Speech recognition error:", event.error)
        setIsListening(false)
      }
      recognitionRef.current.onend = () => setIsListening(false)
    }
  }, [])

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported in your browser")
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const sendMessage = async (messageContent?: string, retryAttempt = 0) => {
    const messageToSend = messageContent || input

    if (!messageToSend.trim() || isLoading) return

    // Check online status before sending
    if (!navigator.onLine) {
      console.error("[AI Assistant] Offline - cannot send message")
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ No internet connection. Please check your connection:\n\n1. Turn on WiFi or mobile data\n2. Check airplane mode is OFF\n3. Try switching between WiFi and mobile data\n\nOnce connected, try again.",
        },
      ])
      setLastError("offline")
      return
    }

    const userMessage: Message = { role: "user", content: messageToSend }

    // Only add user message if this is the first attempt
    if (retryAttempt === 0) {
      setMessages((prev) => [...prev, userMessage])
      setInput("")
      lastMessageRef.current = messageToSend
    }

    setIsLoading(true)
    setLastError(null)

    const maxRetries = 2
    console.log(`[AI Assistant] Sending message (attempt ${retryAttempt + 1}/${maxRetries + 1})`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.error("[AI Assistant] Client timeout")
        controller.abort()
      }, 45000) // 45 second client timeout

      const startTime = Date.now()

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          appData: actionHandlers.getAppData(),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const elapsed = Date.now() - startTime
      console.log(`[AI Assistant] Request completed in ${elapsed}ms`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const text = await response.text()

      if (!text || text.trim() === "") {
        throw new Error("Empty response from server")
      }

      let data
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        console.error("[AI Assistant] JSON parse error:", parseError)
        console.error("[AI Assistant] Response preview:", text.substring(0, 200))
        throw new Error("Invalid JSON response from server")
      }

      // Reset retry count on success
      setRetryCount(0)
      setLastError(null)
      console.log("[AI Assistant] Message sent successfully")

      // Check if response contains error information
      if (data.errorType) {
        console.error("[AI Assistant] Server returned error:", data.errorType, data.message)

        // For certain errors, don't retry
        if (data.errorType === "auth" || data.errorType === "badRequest") {
          setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
          return
        }

        // For network/timeout errors, retry
        if ((data.errorType === "network" || data.errorType === "timeout") && retryAttempt < maxRetries) {
          const delay = Math.min(2000 * Math.pow(2, retryAttempt), 8000) // Exponential backoff, max 8s
          console.log(`[AI Assistant] Retrying after ${delay}ms...`)

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `${data.message}\n\n🔄 Retrying automatically... (${retryAttempt + 1}/${maxRetries})`,
            },
          ])

          await new Promise((resolve) => setTimeout(resolve, delay))

          // Remove the retry message before retrying
          setMessages((prev) => prev.slice(0, -1))
          return sendMessage(messageToSend, retryAttempt + 1)
        }

        // Show error to user
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
        setLastError(data.errorType)
        return
      }

      if (data.action) {
        let actionSuccess = false
        let actionMessage = data.message || "Action executed"

        try {
          const action = data.action
          console.log("[AI Assistant] Executing action:", action.type)

          switch (action.type) {
            case "addIncome":
              if (action.amount) {
                actionHandlers.addIncome(action.amount, action.description)
                actionSuccess = true
              }
              break
            case "addExpense":
              if (action.amount && action.category) {
                actionHandlers.addExpense(action.amount, action.category, action.description)
                actionSuccess = true
              }
              break
            case "deleteTransaction":
              if (action.index) {
                actionSuccess = actionHandlers.deleteTransaction(action.index - 1)
                if (!actionSuccess) actionMessage = `Transaction ${action.index} not found or already deleted`
              }
              break
            case "modifyBalance":
              if (typeof action.newBalance === "number") {
                actionHandlers.modifyBalance(action.newBalance)
                actionSuccess = true
              }
              break
            case "updateGoal":
              if (action.goalType && action.newGoal) {
                actionHandlers.updateGoal(action.goalType, action.newGoal)
                actionSuccess = true
              }
              break
            case "markBillPaid":
              if (action.billName) {
                actionSuccess = actionHandlers.markBillAsPaid(action.billName)
                if (!actionSuccess) actionMessage = `Bill "${action.billName}" not found`
              }
              break
            case "deleteBill":
              if (action.billName) {
                actionSuccess = actionHandlers.deleteBill(action.billName)
                if (!actionSuccess) actionMessage = `Bill "${action.billName}" not found`
              }
              break
            case "clearAllData":
              actionHandlers.clearAllData()
              actionSuccess = true
              break
          }

          if (actionSuccess) {
            console.log("[AI Assistant] Action executed successfully, refreshing data")
            actionHandlers.refreshData()
          }

          setMessages((prev) => [...prev, { role: "assistant", content: actionMessage }])
        } catch (actionError: any) {
          console.error("[AI Assistant] Action execution error:", actionError)
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Failed to execute action: ${actionError.message}` },
          ])
        }
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message || "No response" }])
      }
    } catch (error: any) {
      console.error("[AI Assistant] Request error:", error)

      let errorMessage = "Sorry, something went wrong. "
      let shouldRetry = false

      if (error.name === "AbortError") {
        errorMessage = "⏱️ Request timed out. This usually means slow internet. Check your connection and try again."
        shouldRetry = true
      } else if (
        error.message?.toLowerCase().includes("fetch") ||
        error.message?.toLowerCase().includes("network") ||
        error.message?.toLowerCase().includes("failed to fetch")
      ) {
        errorMessage =
          "🌐 Network error. Please check:\n\n1. WiFi/mobile data is ON\n2. You have internet access\n3. Try toggling airplane mode\n4. Switch between WiFi and mobile data"
        shouldRetry = true
        setLastError("network")
      } else if (error.message?.includes("JSON") || error.message?.includes("parse")) {
        errorMessage = "⚠️ Received invalid data. Please try again."
        shouldRetry = true
      } else {
        errorMessage = `⚠️ ${error.message}. Please try again.`
        shouldRetry = true
      }

      // Auto-retry for network/timeout errors
      if (shouldRetry && retryAttempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, retryAttempt), 8000)
        setRetryCount(retryAttempt + 1)
        console.log(`[AI Assistant] Auto-retrying after ${delay}ms... (${retryAttempt + 1}/${maxRetries})`)

        errorMessage += `\n\n🔄 Retrying automatically... (${retryAttempt + 1}/${maxRetries})`
        setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }])

        await new Promise((resolve) => setTimeout(resolve, delay))

        // Remove retry message
        setMessages((prev) => prev.slice(0, -1))
        return sendMessage(messageToSend, retryAttempt + 1)
      }

      if (retryAttempt >= maxRetries) {
        errorMessage +=
          "\n\n❌ Maximum retries reached. Please:\n1. Check your internet\n2. Wait a minute\n3. Try manually"
      }

      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }])
      setRetryCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const retryLastMessage = () => {
    if (lastMessageRef.current && !isLoading) {
      console.log("[AI Assistant] Manual retry of last message")
      setRetryCount(0)
      setLastError(null)
      sendMessage(lastMessageRef.current, 0)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="w-6 h-6" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Budget Assistant</h2>
              <div className="flex items-center gap-2 text-xs text-purple-100">
                <span>Full Admin Access • Powered by Groq</span>
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-green-300" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-300 animate-pulse" />
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {!isOnline && (
          <div className="bg-red-100 border-b border-red-300 p-2 flex items-center justify-between gap-2 text-red-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No internet. Check WiFi/data and try again.</span>
            </div>
            <Button size="sm" variant="outline" onClick={retryLastMessage} className="shrink-0 h-7 bg-transparent">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        )}

        {lastError && lastError !== "offline" && isOnline && (
          <div className="bg-orange-100 border-b border-orange-300 p-2 flex items-center justify-between gap-2 text-orange-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Last message failed. Click retry to try again.</span>
            </div>
            <Button size="sm" variant="outline" onClick={retryLastMessage} className="shrink-0 h-7 bg-transparent">
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <CardContent className="p-4 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={toggleVoiceInput}
              className="shrink-0"
              disabled={!isOnline || isLoading}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                !isOnline ? "No internet..." : isListening ? "Listening..." : "Ask me anything or give a command..."
              }
              disabled={isLoading || isListening || !isOnline}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim() || isListening || !isOnline}
              className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Try: "Add ₱1100 from work" • "Delete transaction 3" • "Set balance to ₱5000" • "Give me tips"
          </p>
          {retryCount > 0 && (
            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Auto-retrying... ({retryCount}/2)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
