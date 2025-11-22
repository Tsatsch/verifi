"use client"

import { useState } from "react"
import { measureConnectionSpeed } from "@/lib/speed-test"
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
  const [durationSeconds, setDurationSeconds] = useState<number>(5)

  const { toast } = useToast()

  const handleScan = async () => {
    setIsScanning(true)
    try {
      const result = await measureConnectionSpeed(durationSeconds)
      
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

        {/* Duration selector for speed test */}
        <div className="absolute bottom-32 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-lg bg-popover/90 p-2 px-3 backdrop-blur-sm border border-border shadow-sm">
          <label className="text-xs text-foreground/70 font-medium">Duration</label>

          <div className="relative">
            <select
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="appearance-none pr-8 pl-3 py-1 text-sm rounded-md bg-popover text-foreground outline-none border border-transparent hover:border-border transition"
            >
              <option className="bg-popover text-foreground" value={3}>3s</option>
              <option className="bg-popover text-foreground" value={5}>5s</option>
              <option className="bg-popover text-foreground" value={10}>10s</option>
              <option className="bg-popover text-foreground" value={15}>15s</option>
              <option className="bg-popover text-foreground" value={30}>30s</option>
              <option className="bg-popover text-foreground" value={60}>60s</option>
            </select>

            {/* caret */}
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/60" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

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
