"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, Mic, MicOff, X, Sparkles } from "lucide-react"

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

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
      recognitionRef.current.onerror = () => setIsListening(false)
      recognitionRef.current.onend = () => setIsListening(false)
    }
  }, [])

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported")
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          appData: actionHandlers.getAppData(),
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()

      if (data.action) {
        let actionSuccess = false
        let actionMessage = data.message || "Action executed"

        try {
          const action = data.action
          switch (action.type) {
            case "addIncome":
              actionHandlers.addIncome(action.amount, action.description)
              actionSuccess = true
              break
            case "addExpense":
              actionHandlers.addExpense(action.amount, action.category, action.description)
              actionSuccess = true
              break
            case "deleteTransaction":
              actionSuccess = actionHandlers.deleteTransaction(action.index - 1)
              if (!actionSuccess) actionMessage = `Transaction ${action.index} not found`
              break
            case "modifyBalance":
              actionHandlers.modifyBalance(action.newBalance)
              actionSuccess = true
              break
            case "updateGoal":
              actionHandlers.updateGoal(action.goalType, action.newGoal)
              actionSuccess = true
              break
            case "markBillPaid":
              actionSuccess = actionHandlers.markBillAsPaid(action.billName)
              if (!actionSuccess) actionMessage = `Bill "${action.billName}" not found`
              break
            case "deleteBill":
              actionSuccess = actionHandlers.deleteBill(action.billName)
              if (!actionSuccess) actionMessage = `Bill "${action.billName}" not found`
              break
            case "clearAllData":
              actionHandlers.clearAllData()
              actionSuccess = true
              break
          }

          if (actionSuccess) {
            actionHandlers.refreshData()
          }

          setMessages((prev) => [...prev, { role: "assistant", content: actionMessage }])
        } catch (error) {
          console.error("Action error:", error)
          setMessages((prev) => [...prev, { role: "assistant", content: "Failed to execute action" }])
        }
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message || "..." }])
      }
    } catch (error) {
      console.error("AI error:", error)
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Try again." }])
    } finally {
      setIsLoading(false)
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
              <p className="text-xs text-purple-100">Full Admin Access • Powered by Groq</p>
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
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening..." : "Ask me anything or command..."}
              disabled={isLoading || isListening}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || isListening}
              className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Try: "Add ₱1100 from work" • "Delete transaction 3" • "Set balance to ₱5000" • "Give me tips"
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
