"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowInstall(false)
    }
  }

  if (!showInstall) return null

  return (
    <Button variant="ghost" size="sm" onClick={handleInstall} className="text-white hover:bg-white/20">
      <Download className="w-4 h-4" />
    </Button>
  )
}
