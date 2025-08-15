"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Download, Smartphone, Share, Plus, MoreVertical } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsStandalone(standalone || isInWebAppiOS)
      setIsInstalled(standalone || isInWebAppiOS)
    }

    // Check if iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
      setIsIOS(isIOSDevice)
    }

    checkInstalled()
    checkIOS()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
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
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setDeferredPrompt(null)
      }
    } else if (isIOS) {
      setShowInstallDialog(true)
    }
  }

  // Don't show if already installed
  if (isInstalled) return null

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleInstallClick} className="text-white hover:bg-white/20 relative">
        <Download className="w-5 h-5" />
        {deferredPrompt && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-2 h-2 p-0 rounded-full" />
        )}
      </Button>

      {/* iOS Install Instructions Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              Install Budget Tracker
            </DialogTitle>
            <DialogDescription>Add this app to your home screen for the best experience</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isIOS ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">iOS Installation Steps:</h4>
                  <ol className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Tap the <Share className="w-4 h-4 inline mx-1" /> Share button at the bottom of your screen
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Scroll down and tap <Plus className="w-4 h-4 inline mx-1" /> "Add to Home Screen"
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Tap "Add" to install the app</span>
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Android Installation:</h4>
                  <ol className="text-sm text-green-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Tap the <MoreVertical className="w-4 h-4 inline mx-1" /> menu button in your browser
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Select "Add to Home Screen" or "Install App"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Confirm the installation</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <h4 className="font-medium text-purple-800 text-sm mb-1">Benefits of Installing:</h4>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Works offline</li>
                <li>• Faster loading</li>
                <li>• Push notifications</li>
                <li>• Full screen experience</li>
              </ul>
            </div>

            <Button onClick={() => setShowInstallDialog(false)} className="w-full">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
