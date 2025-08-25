"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, AlertTriangle, RefreshCw, Zap, Shield, Smartphone, Clock, Volume2 } from "lucide-react"

interface NotificationManagerProps {
  weeklyPayables: any[]
  dailyIncome: any[]
  currency: string
}

export default function NotificationManager({ weeklyPayables, dailyIncome, currency }: NotificationManagerProps) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>("checking")
  const [registrationStatus, setRegistrationStatus] = useState<string[]>([])
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [isEnabled, setIsEnabled] = useState(false)
  const [testCount, setTestCount] = useState(0)
  const [activeMethod, setActiveMethod] = useState<string>("none")
  const [retryCount, setRetryCount] = useState(0)

  // Settings
  const [reminderTime, setReminderTime] = useState("09:00")
  const [reminderDays, setReminderDays] = useState("1")
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }

  const addStatus = (status: string) => {
    setRegistrationStatus((prev) => [status, ...prev.slice(0, 4)])
  }

  // Check notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission)
      addLog(`Initial permission: ${Notification.permission}`)
    }
  }, [])

  // REDUNDANT SYSTEM 1: Check existing service worker
  const checkExistingServiceWorker = async (): Promise<boolean> => {
    try {
      if (!("serviceWorker" in navigator)) {
        addLog("❌ Service Worker not supported")
        return false
      }

      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        addLog("✅ Found existing Service Worker")
        setServiceWorkerStatus("existing")
        setActiveMethod("existing-sw")
        addStatus("Existing SW Found")
        return true
      }
      return false
    } catch (error) {
      addLog(`❌ Error checking existing SW: ${error}`)
      return false
    }
  }

  // REDUNDANT SYSTEM 2: Register main service worker
  const registerMainServiceWorker = async (): Promise<boolean> => {
    try {
      addLog("🔄 Attempting main SW registration...")
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })

      await registration.update()
      addLog("✅ Main Service Worker registered")
      setServiceWorkerStatus("registered")
      setActiveMethod("main-sw")
      addStatus("Main SW Registered")

      // Wait for activation
      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing!.addEventListener("statechange", () => {
            if (registration.installing!.state === "activated") {
              resolve(true)
            }
          })
        })
      }

      return true
    } catch (error) {
      addLog(`❌ Main SW registration failed: ${error}`)
      return false
    }
  }

  // REDUNDANT SYSTEM 3: Create inline service worker
  const createInlineServiceWorker = async (): Promise<boolean> => {
    try {
      addLog("🔄 Creating inline Service Worker...")

      const swCode = `
        self.addEventListener('install', (event) => {
          console.log('Inline SW: Install event');
          self.skipWaiting();
        });

        self.addEventListener('activate', (event) => {
          console.log('Inline SW: Activate event');
          event.waitUntil(self.clients.claim());
        });

        self.addEventListener('notificationclick', (event) => {
          console.log('Inline SW: Notification clicked');
          event.notification.close();
          event.waitUntil(
            self.clients.matchAll().then((clients) => {
              if (clients.length > 0) {
                return clients[0].focus();
              }
              return self.clients.openWindow('/');
            })
          );
        });
      `

      const blob = new Blob([swCode], { type: "application/javascript" })
      const swUrl = URL.createObjectURL(blob)

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: "/",
      })

      addLog("✅ Inline Service Worker created")
      setServiceWorkerStatus("inline")
      setActiveMethod("inline-sw")
      addStatus("Inline SW Created")

      URL.revokeObjectURL(swUrl)
      return true
    } catch (error) {
      addLog(`❌ Inline SW creation failed: ${error}`)
      return false
    }
  }

  // REDUNDANT SYSTEM 4: Wait for ready service worker
  const waitForReadyServiceWorker = async (): Promise<boolean> => {
    try {
      addLog("🔄 Waiting for ready Service Worker...")

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
      ])

      addLog("✅ Service Worker ready")
      setServiceWorkerStatus("ready")
      setActiveMethod("ready-sw")
      addStatus("SW Ready")
      return true
    } catch (error) {
      addLog(`❌ SW ready timeout: ${error}`)
      return false
    }
  }

  // Enable all notification systems with redundancy
  const enableAllSystems = async () => {
    addLog("🚀 Starting ALL notification systems...")
    setRetryCount((prev) => prev + 1)

    // Step 1: Request permission
    if (notificationPermission !== "granted") {
      try {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
        addLog(`📋 Permission result: ${permission}`)

        if (permission !== "granted") {
          addLog("❌ Notification permission denied")
          return
        }
      } catch (error) {
        addLog(`❌ Permission request failed: ${error}`)
        return
      }
    }

    // Step 2: Try all service worker methods
    const methods = [
      { name: "Existing SW", fn: checkExistingServiceWorker },
      { name: "Main SW", fn: registerMainServiceWorker },
      { name: "Inline SW", fn: createInlineServiceWorker },
      { name: "Ready SW", fn: waitForReadyServiceWorker },
    ]

    let success = false
    for (const method of methods) {
      if (success) break
      addLog(`🔄 Trying ${method.name}...`)
      try {
        success = await method.fn()
        if (success) {
          addLog(`✅ ${method.name} successful!`)
          break
        }
      } catch (error) {
        addLog(`❌ ${method.name} failed: ${error}`)
      }
    }

    if (success) {
      setIsEnabled(true)
      addLog("🎉 Notification system ENABLED!")
      addStatus("✅ ENABLED")
    } else {
      addLog("⚠️ All SW methods failed, using direct notifications")
      setActiveMethod("direct")
      setIsEnabled(true)
      addStatus("Direct Mode")
    }
  }

  // Send notification using service worker
  const sendServiceWorkerNotification = async (title: string, options: any): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification(title, options)
        addLog(`✅ SW notification sent: ${title}`)
        return true
      }
      return false
    } catch (error) {
      addLog(`❌ SW notification failed: ${error}`)
      return false
    }
  }

  // Send direct browser notification
  const sendDirectNotification = (title: string, options: any): boolean => {
    try {
      const notification = new Notification(title, options)
      addLog(`✅ Direct notification sent: ${title}`)

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return true
    } catch (error) {
      addLog(`❌ Direct notification failed: ${error}`)
      return false
    }
  }

  // Universal send notification with all fallbacks
  const sendNotification = async (title: string, body: string, options: any = {}) => {
    if (notificationPermission !== "granted") {
      addLog("❌ No notification permission")
      return
    }

    const notificationOptions = {
      body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: vibrationEnabled ? [200, 100, 200] : undefined,
      silent: !soundEnabled,
      requireInteraction: true,
      ...options,
    }

    // Try service worker first
    const swSuccess = await sendServiceWorkerNotification(title, notificationOptions)
    if (swSuccess) return

    // Fallback to direct notification
    const directSuccess = sendDirectNotification(title, notificationOptions)
    if (directSuccess) return

    addLog("❌ All notification methods failed")
  }

  // Test notification
  const sendTestNotification = async () => {
    const count = testCount + 1
    setTestCount(count)

    await sendNotification(`🧪 Test Notification #${count}`, `Testing all systems - Method: ${activeMethod}`, {
      tag: "test",
      vibrate: [100, 50, 100, 50, 100],
    })
  }

  // Send urgent alert
  const sendUrgentAlert = async () => {
    await sendNotification("🚨 URGENT ALERT", "Maximum vibration test for Poco F6", {
      tag: "urgent",
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      requireInteraction: true,
    })
  }

  // Send bill reminder
  const sendBillReminder = async () => {
    try {
      if (!Array.isArray(weeklyPayables)) {
        addLog("❌ No payables data available")
        return
      }

      const pendingBills = weeklyPayables.filter((bill) => bill && bill.status === "pending")

      if (pendingBills.length === 0) {
        await sendNotification("✅ All Bills Paid", "No pending bills this week!", {
          tag: "bills-complete",
        })
        return
      }

      const totalAmount = pendingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
      const billNames = pendingBills.map((bill) => bill.name || "Unknown").join(", ")

      await sendNotification(
        `💳 ${pendingBills.length} Bills Due`,
        `${currency}${totalAmount.toLocaleString()} total: ${billNames}`,
        {
          tag: "bill-reminder",
          vibrate: [300, 100, 300],
        },
      )

      addLog(`✅ Bill reminder sent for ${pendingBills.length} bills`)
    } catch (error) {
      addLog(`❌ Bill reminder error: ${error}`)
    }
  }

  // Force enable direct notifications
  const forceEnableDirect = async () => {
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === "granted") {
        setActiveMethod("direct-forced")
        setIsEnabled(true)
        addLog("🔧 FORCED direct notifications enabled")
        addStatus("Direct Forced")

        // Test immediately
        await sendNotification("🔧 Force Enabled", "Direct notifications are now active", {
          tag: "force-test",
        })
      }
    } catch (error) {
      addLog(`❌ Force enable failed: ${error}`)
    }
  }

  // Clear debug log
  const clearLog = () => {
    setDebugLog([])
    addLog("🧹 Debug log cleared")
  }

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Enhanced Notification System
          </CardTitle>
          <CardDescription>Redundant systems for Poco F6 PWA compatibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`${isEnabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {isEnabled ? "✅ ENABLED" : "❌ DISABLED"}
            </Badge>
            <Badge variant="outline">{notificationPermission.toUpperCase()}</Badge>
            <Badge variant="outline">{activeMethod.toUpperCase()}</Badge>
            <Badge variant="outline">Retry #{retryCount}</Badge>
          </div>

          {/* Main Controls */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={enableAllSystems} className="bg-blue-600 hover:bg-blue-700">
              <Shield className="w-4 h-4 mr-2" />
              Enable All Systems
            </Button>
            <Button onClick={forceEnableDirect} variant="outline">
              <Zap className="w-4 h-4 mr-2" />
              Force Enable
            </Button>
          </div>

          {/* Recent Status */}
          {registrationStatus.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Recent Status:</Label>
              {registrationStatus.slice(0, 3).map((status, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  {status}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            Test Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={sendTestNotification} variant="outline" className="w-full bg-transparent">
              🧪 Send Test Notification (All Systems)
            </Button>
            <Button onClick={sendUrgentAlert} variant="outline" className="w-full bg-transparent">
              🚨 Send URGENT Alert (Max Vibration)
            </Button>
            <Button onClick={sendBillReminder} variant="outline" className="w-full bg-transparent">
              💳 Bill Alert ({weeklyPayables?.filter((b) => b?.status === "pending")?.length || 0} pending)
            </Button>
          </div>

          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
            <strong>For Poco F6:</strong> If notifications don't appear, check Settings → Apps → Budget Tracker →
            Notifications and enable all options.
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reminder-time">Reminder Time</Label>
              <Input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reminder-days">Days Before</Label>
              <Select value={reminderDays} onValueChange={setReminderDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Same Day</SelectItem>
                  <SelectItem value="1">1 Day Before</SelectItem>
                  <SelectItem value="2">2 Days Before</SelectItem>
                  <SelectItem value="3">3 Days Before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <Label>Vibration</Label>
            </div>
            <Switch checked={vibrationEnabled} onCheckedChange={setVibrationEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <Label>Sound</Label>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Debug Log
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={enableAllSystems}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry All Systems
            </Button>
            <Button size="sm" variant="outline" onClick={clearLog}>
              🧹 Clear Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {debugLog.length === 0 ? (
              <div className="text-gray-500 text-sm">No debug information yet...</div>
            ) : (
              debugLog.map((log, index) => (
                <div key={index} className="text-xs font-mono bg-gray-50 p-1 rounded">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">🔧 Poco F6 Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="bg-red-50 p-3 rounded">
            <strong>If notifications still don't work:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Go to Android Settings → Apps → Budget Tracker</li>
              <li>Tap "Notifications" → Enable all notification types</li>
              <li>Check "Battery optimization" → Set to "Don't optimize"</li>
              <li>Try "Force Enable" button above</li>
              <li>Restart the PWA completely</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
