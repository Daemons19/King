"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Smartphone, Monitor, Share, Plus } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches
      const isInWebAppMode = (window.navigator as any).standalone === true
      setIsInstalled(isInStandaloneMode || isInWebAppMode)
    }

    // Check if iOS
    const checkIfIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
      setIsIOS(isIOSDevice)
    }

    checkIfInstalled()
    checkIfIOS()

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

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

  // Don't show install button if already installed
  if (isInstalled) return null

  // Show install button if we have a deferred prompt (Android/Desktop) or if it's iOS
  if (!deferredPrompt && !isIOS) return null

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInstallClick}
        className="text-white hover:bg-white/20"
        title="Install App"
      >
        <Download className="w-5 h-5" />
      </Button>

      {/* iOS Installation Instructions Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-md mx-4 bg-gradient-to-br from-white to-blue-50">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              Install Budget Tracker
            </DialogTitle>
            <DialogDescription>Add this app to your home screen for the best experience</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Share className="w-4 h-4" />
                For iPhone/iPad:
              </h3>
              <ol className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button at the bottom of Safari
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tap <strong>"Add"</strong> to confirm
                  </span>
                </li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                For Android/Desktop:
              </h3>
              <p className="text-sm text-green-700">
                Look for the <strong>"Install"</strong> button in your browser's address bar, or use the browser menu to
                find <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-800 mb-2">
                <Plus className="w-4 h-4" />
                <span className="font-medium text-sm">Benefits of Installing:</span>
              </div>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Works offline</li>
                <li>• Faster loading</li>
                <li>• Push notifications</li>
                <li>• Full-screen experience</li>
                <li>• Easy access from home screen</li>
              </ul>
            </div>

            <Button
              onClick={() => setShowInstallDialog(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
