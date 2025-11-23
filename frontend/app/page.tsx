"use client"

import { useState, useEffect, useRef } from "react"
import { useEvmAddress } from "@coinbase/cdp-hooks"
import { measureConnectionSpeed } from "@/lib/speed-test"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "@/hooks/use-location"
import { GoogleMapsProvider } from "@/components/google-maps-provider"
import { MapView } from "@/components/map-view"
import { TopNav } from "@/components/top-nav"
import { BottomControls } from "@/components/bottom-controls"
import { SignalCard } from "@/components/signal-card"
import { WiFiFormModal, type WiFiFormData } from "@/components/wifi-form-modal"
import { SidebarLeaderboard } from "@/components/sidebar-leaderboard"
import { FilecoinPinProvider } from "@/context/filecoin-pin-provider"
import { useFilecoinUpload } from "@/hooks/use-filecoin-upload"
import { useWifiSpots } from "@/hooks/use-wifi-spots"
import type { Measurement } from "@/types/measurement"

function PageContent() {
  const [selectedSignal, setSelectedSignal] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [showWiFiForm, setShowWiFiForm] = useState(false)
  const [measurementData, setMeasurementData] = useState<{ speed: number } | null>(null)
  const [localMeasurements, setLocalMeasurements] = useState<Measurement[]>([])
  const { evmAddress } = useEvmAddress()
  const isWalletConnected = !!evmAddress

  const { toast } = useToast()
  const { coordinates } = useLocation()
  const { uploadState, uploadFile } = useFilecoinUpload()
  const hasShownUploadToast = useRef(false)

  // Load WiFi spots from The Graph and IPFS
  const { measurements: graphMeasurements, loading: loadingSpots, loadSpots } = useWifiSpots()

  // Load spots on mount
  useEffect(() => {
    loadSpots()
  }, [loadSpots])

  // Show toast when upload starts
  useEffect(() => {
    if (uploadState.isUploading && !hasShownUploadToast.current) {
      hasShownUploadToast.current = true
      toast({
        title: "Upload to IPFS PIN on Filecoin started",
        description: "This can take a while",
      })
    }
    // Reset when upload completes or fails
    if (!uploadState.isUploading) {
      hasShownUploadToast.current = false
    }
  }, [uploadState.isUploading, toast])

  const handleAddNew = async () => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to add WiFi measurements",
        variant: "destructive",
      })
      return
    }

    setIsScanning(true)
    try {
      const result = await measureConnectionSpeed(10)
      
      if ('error' in result) {
        toast({
          title: "Speed test failed",
          description: result.error as string,
          variant: "destructive",
        })
        return
      }

      // Store measurement data and show form
      setMeasurementData({ speed: result.speed })
      setShowWiFiForm(true)
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

  const handleWiFiFormSubmit = async (data: WiFiFormData) => {
    if (!coordinates) {
      toast({
        title: "Location required",
        description: "Location is required to submit measurement",
        variant: "destructive",
      })
      return
    }

    if (!evmAddress) {
      toast({
        title: "Wallet required",
        description: "Wallet address is required to submit measurement",
        variant: "destructive",
      })
      return
    }

    // Determine strength based on speed
    const strength: 'strong' | 'weak' | 'dead' = 
      data.speed >= 100 ? 'strong' : 
      data.speed >= 30 ? 'weak' : 
      'dead'

    // Create measurement object
    const measurement: Measurement = {
      id: `measurement-${Date.now()}`,
      lat: coordinates.lat,
      lng: coordinates.lng,
      ssid: data.wifiName,
      speed: data.speed,
      strength,
      verified: 1,
      timestamp: new Date().toISOString(),
      walletAddress: evmAddress,
    }

    // Immediately add to map (local state for user's own measurements)
    setLocalMeasurements((prev) => [...prev, measurement])
    
    toast({
      title: "Measurement added!",
      description: `${data.wifiName} - ${data.speed} Mbps`,
    })

    // Close the form
    setShowWiFiForm(false)
    setMeasurementData(null)

    // Create JSON file with measurement data
    const measurementJson = {
      location: {
        lat: coordinates.lat,
        lng: coordinates.lng,
      },
      speed: data.speed,
      time: new Date().toISOString(),
      wifiName: data.wifiName,
      walletAddress: evmAddress,
    }

    const jsonBlob = new Blob([JSON.stringify(measurementJson, null, 2)], { type: 'application/json' })
    const jsonFile = new File([jsonBlob], `measurement-${Date.now()}.json`, { type: 'application/json' })

    // Upload to Filecoin in the background
    uploadFile(jsonFile, {
      wifiName: data.wifiName,
      speed: data.speed.toString(),
      location: `${coordinates.lat},${coordinates.lng}`,
      timestamp: new Date().toISOString(),
    }).catch((error) => {
      // Silently log errors without showing to user
      console.error('Filecoin upload failed:', error)
    })
  }

  return (
    <GoogleMapsProvider>
      <div className="relative h-screen w-full overflow-hidden touch-pan-y">
        {/* Map Canvas - Full Screen (Lower layer) */}
        <MapView 
          onMarkerClick={setSelectedSignal} 
          measurements={[...graphMeasurements, ...localMeasurements]} 
        />

        {/* UI Layer - Guaranteed to be above map */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
          {/* HUD Layers */}
          <div className="pointer-events-auto">
            <TopNav />
          </div>

          <div className="pointer-events-auto">
            <BottomControls 
              onAddNew={handleAddNew}
              isScanning={isScanning}
              isWalletConnected={isWalletConnected}
            />
          </div>

          {/* Desktop Sidebar */}
          <div className="pointer-events-auto hidden lg:block">
            <SidebarLeaderboard />
          </div>
        </div>


        {/* Modals - Separate high z-index layer */}
        {/* Signal Card Modal */}
        {selectedSignal && <SignalCard signal={selectedSignal} onClose={() => setSelectedSignal(null)} />}

        {/* WiFi Form Modal */}
        {showWiFiForm && measurementData && (
          <WiFiFormModal
            speed={measurementData.speed}
            location={coordinates}
            walletAddress={evmAddress || null}
            onClose={() => {
              if (!uploadState.isUploading) {
                setShowWiFiForm(false)
                setMeasurementData(null)
              }
            }}
            onSubmit={handleWiFiFormSubmit}
          />
        )}
      </div>

    </GoogleMapsProvider>
  )
}

export default function Page() {
  return (
    <FilecoinPinProvider>
      <PageContent />
    </FilecoinPinProvider>
  )
}
