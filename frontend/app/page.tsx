"use client"

import { useState } from "react"
import { measureConnectionSpeed } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
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

  const { toast } = useToast()

  const handleScan = async () => {
    setIsScanning(true)
    try {
      const result = await measureConnectionSpeed()
      
      if ('error' in result) {
        toast({
          title: "Speed test failed",
          description: result.error as string,
          variant: "destructive",
        })
        return
      }

      setScanResult({
        ssid: "Detected Network",
        speed: result.speed,
        reward: 50,
      })

      toast({
        title: "Scan Complete",
        description: `Measured speed: ${result.speed} ${result.unit}`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to run speed test",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
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
