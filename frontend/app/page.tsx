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
import { LocationInfoModal } from "@/components/location-info-modal"
import { SidebarLeaderboard } from "@/components/sidebar-leaderboard"
import { FilecoinPinProvider } from "@/context/filecoin-pin-provider"
import { useFilecoinUpload } from "@/hooks/use-filecoin-upload"
import type { Measurement } from "@/types/measurement"

function PageContent() {
  const [selectedSignal, setSelectedSignal] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [showWiFiForm, setShowWiFiForm] = useState(false)
  const [showLocationInfo, setShowLocationInfo] = useState(false)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [measurementData, setMeasurementData] = useState<{ speed: number } | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const { evmAddress } = useEvmAddress()
  const isWalletConnected = !!evmAddress

  const { toast } = useToast()
  const { coordinates } = useLocation()
  const { uploadState, uploadFile } = useFilecoinUpload()
  const hasShownUploadToast = useRef(false)

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

  const handleMapClick = (location: { lat: number; lng: number }) => {
    setClickedLocation(location)
    setShowLocationInfo(true)
  }

  const handleNewMeasurementFromSignal = async () => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to add measurements",
        variant: "destructive",
      })
      return
    }

    if (!selectedSignal) {
      return
    }

    // Set clicked location to the signal's location
    setClickedLocation({ lat: selectedSignal.lat, lng: selectedSignal.lng })
    
    // Run speed test for the signal location
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
      setSelectedSignal(null) // Close signal card
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

  const handleAddMeasurementFromLocation = async () => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to add measurements",
        variant: "destructive",
      })
      return
    }

    if (!clickedLocation) {
      return
    }

    // Run speed test for the clicked location
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
      setShowLocationInfo(false) // Close location info modal
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
    console.log("📍 WiFi Form Submit - Location data:", {
      formLocation: data.location,
      clickedLocation,
      coordinates,
    })

    if (!data.location) {
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

    // Check if there's an existing measurement at this location (within 50 meters)
    const existingMeasurement = measurements.find(m => {
      const distance = Math.sqrt(
        Math.pow((m.lat - data.location!.lat) * 111000, 2) + 
        Math.pow((m.lng - data.location!.lng) * 111000, 2)
      )
      return distance < 50 // 50 meters threshold
    })

    if (existingMeasurement) {
      // Update existing measurement with averaged speed
      const currentVerified = existingMeasurement.verified || 1
      const currentSpeed = existingMeasurement.speed
      const newAverageSpeed = Math.round((currentSpeed * currentVerified + data.speed) / (currentVerified + 1))
      
      // Determine new strength based on averaged speed
      const strength: 'strong' | 'weak' | 'dead' = 
        newAverageSpeed >= 100 ? 'strong' : 
        newAverageSpeed >= 30 ? 'weak' : 
        'dead'

      const updatedMeasurement: Measurement = {
        ...existingMeasurement,
        speed: newAverageSpeed,
        strength,
        verified: currentVerified + 1,
        timestamp: new Date().toISOString(),
      }

      console.log("📍 Updating existing measurement:", {
        oldSpeed: currentSpeed,
        newSpeed: data.speed,
        averagedSpeed: newAverageSpeed,
        verified: currentVerified + 1,
      })

      // Update in the measurements array
      setMeasurements((prev) => 
        prev.map(m => m.id === existingMeasurement.id ? updatedMeasurement : m)
      )

      toast({
        title: "Measurement updated!",
        description: `${data.wifiName} - ${newAverageSpeed} Mbps (${currentVerified + 1} verifications)`,
      })
    } else {
      // Create new measurement
      const strength: 'strong' | 'weak' | 'dead' = 
        data.speed >= 100 ? 'strong' : 
        data.speed >= 30 ? 'weak' : 
        'dead'

      const measurement: Measurement = {
        id: `measurement-${Date.now()}`,
        lat: data.location.lat,
        lng: data.location.lng,
        ssid: data.wifiName,
        speed: data.speed,
        strength,
        verified: 1,
        timestamp: new Date().toISOString(),
        walletAddress: evmAddress,
      }

      console.log("📍 Creating new measurement at:", {
        lat: measurement.lat,
        lng: measurement.lng,
        ssid: measurement.ssid,
      })

      // Add to map
      setMeasurements((prev) => [...prev, measurement])

      toast({
        title: "Measurement added!",
        description: `${data.wifiName} - ${data.speed} Mbps`,
      })
    }

    // Close the form and reset states
    setShowWiFiForm(false)
    setMeasurementData(null)
    setClickedLocation(null) // Reset clicked location

    // Create JSON file with measurement data
    const measurementJson = {
      location: {
        lat: data.location.lat,
        lng: data.location.lng,
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
      location: `${data.location.lat},${data.location.lng}`,
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
          onMapClick={handleMapClick}
          measurements={measurements} 
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
        {selectedSignal && (
          <SignalCard 
            signal={selectedSignal} 
            onClose={() => setSelectedSignal(null)}
            onNewMeasurement={handleNewMeasurementFromSignal}
            isWalletConnected={!!evmAddress}
            isScanning={isScanning}
          />
        )}

        {/* WiFi Form Modal */}
        {showWiFiForm && measurementData && (
          <WiFiFormModal
            speed={measurementData.speed}
            location={coordinates}
            customLocation={clickedLocation}
            walletAddress={evmAddress || null}
            onClose={() => {
              if (!uploadState.isUploading) {
                setShowWiFiForm(false)
                setMeasurementData(null)
                setClickedLocation(null)
              }
            }}
            onSubmit={handleWiFiFormSubmit}
          />
        )}

        {/* Location Info Modal */}
        {showLocationInfo && clickedLocation && (
          <LocationInfoModal
            location={clickedLocation}
            onClose={() => {
              setShowLocationInfo(false)
              setClickedLocation(null)
            }}
            onAddMeasurement={handleAddMeasurementFromLocation}
            isWalletConnected={isWalletConnected}
            isScanning={isScanning}
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
