"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error("Error during installation:", error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Hide for this session
    sessionStorage.setItem("installPromptDismissed", "true")
  }

  // Don't show if already installed or dismissed this session
  if (isInstalled || !showInstallPrompt || sessionStorage.getItem("installPromptDismissed")) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg border p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Install Budget Tracker</h3>
            <p className="text-sm text-gray-600 mt-1">
              Install this app on your device for quick access and offline use.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="ml-2">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={handleInstallClick} className="flex-1 bg-purple-600 hover:bg-purple-700">
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Not Now
          </Button>
        </div>
      </div>
    </div>
  )
}
