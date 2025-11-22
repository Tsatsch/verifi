"use client"

import { useState } from "react"
import { GoogleMapsProvider } from "@/components/google-maps-provider"
import { MapView } from "@/components/map-view"
import { TopNav } from "@/components/top-nav"
import { BottomControls } from "@/components/bottom-controls"
import { SignalCard } from "@/components/signal-card"
import { VerificationModal } from "@/components/verification-modal"
import { SidebarLeaderboard } from "@/components/sidebar-leaderboard"

export default function Page() {
  const [selectedSignal, setSelectedSignal] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)

  const handleScan = () => {
    setIsScanning(true)
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false)
      setScanResult({
        ssid: "CoffeeShop_5G",
        speed: Math.floor(Math.random() * 200) + 50,
        reward: 50,
      })
    }, 3000)
  }

  return (
    <GoogleMapsProvider>
      <div className="relative h-screen w-full overflow-hidden">
        {/* Map Canvas - Full Screen */}
        <MapView onMarkerClick={setSelectedSignal} />

        {/* HUD Layers */}
        <TopNav />

        <BottomControls onScan={handleScan} isScanning={isScanning} />

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <SidebarLeaderboard />
        </div>

        {/* Signal Card Modal */}
        {selectedSignal && <SignalCard signal={selectedSignal} onClose={() => setSelectedSignal(null)} />}

        {/* Verification Modal */}
        {scanResult && (
          <VerificationModal
            result={scanResult}
            onClose={() => setScanResult(null)}
          />
        )}
      </div>
    </GoogleMapsProvider>
  )
}
