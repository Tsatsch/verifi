"use client"

import { useState, useEffect, useMemo } from "react"
import { Map as GoogleMap, AdvancedMarker, useMap } from "@vis.gl/react-google-maps"
import { useLocation } from "@/hooks/use-location"
import type { Measurement } from "@/types/measurement"

// Export mockSignals so they can be used in leaderboard
// ETHGlobal center coordinates: -34.584203, -58.390394
// All points are clustered around ETHGlobal within ~500m radius
export const mockSignals = [
  // ETHGlobal - Premium signal (should be in leaderboard)
  { id: 1, lat: -34.584203, lng: -58.390394, strength: "strong", ssid: "ETHGlobal", speed: 55, verified: 89 },
  
  // Strong signals around ETHGlobal (randomized positions within ~500m)
  { id: 2, lat: -34.58467, lng: -58.39012, strength: "strong", ssid: "Recoleta_Cafe_5G", speed: 185, verified: 32 },
  { id: 3, lat: -34.58389, lng: -58.39078, strength: "strong", ssid: "Cementerio_WiFi", speed: 165, verified: 28 },
  { id: 4, lat: -34.58445, lng: -58.38967, strength: "strong", ssid: "Museo_Bellas_Artes", speed: 220, verified: 45 },
  { id: 5, lat: -34.58356, lng: -58.39123, strength: "strong", ssid: "Plaza_Francia_Guest", speed: 195, verified: 38 },
  { id: 6, lat: -34.58489, lng: -58.39045, strength: "strong", ssid: "Recoleta_Mall_Premium", speed: 250, verified: 52 },
  { id: 7, lat: -34.58412, lng: -58.38989, strength: "strong", ssid: "TechHub_Recoleta", speed: 210, verified: 41 },
  { id: 8, lat: -34.58378, lng: -58.39056, strength: "strong", ssid: "CoWork_Space_BA", speed: 175, verified: 35 },
  { id: 9, lat: -34.58434, lng: -58.39112, strength: "strong", ssid: "FastCafe_Recoleta", speed: 190, verified: 39 },
  { id: 10, lat: -34.58456, lng: -58.38934, strength: "strong", ssid: "Premium_WiFi_Zone", speed: 205, verified: 43 },
  { id: 11, lat: -34.58345, lng: -58.39089, strength: "strong", ssid: "Business_Center", speed: 195, verified: 37 },
  
  // Medium signals around ETHGlobal (randomized positions within ~500m)
  { id: 12, lat: -34.58423, lng: -58.38956, strength: "weak", ssid: "Biblioteca_Nacional", speed: 55, verified: 12 },
  { id: 13, lat: -34.58367, lng: -58.39145, strength: "weak", ssid: "Parque_Thays_Free", speed: 42, verified: 8 },
  { id: 14, lat: -34.58478, lng: -58.39023, strength: "weak", ssid: "Avenida_Santa_Fe", speed: 48, verified: 15 },
  { id: 15, lat: -34.58334, lng: -58.39067, strength: "weak", ssid: "Barrio_Norte_WiFi", speed: 38, verified: 6 },
  { id: 16, lat: -34.58445, lng: -58.39134, strength: "weak", ssid: "Cafe_Martinez", speed: 52, verified: 11 },
  { id: 17, lat: -34.58412, lng: -58.38978, strength: "weak", ssid: "Restaurant_WiFi", speed: 45, verified: 9 },
  { id: 18, lat: -34.58389, lng: -58.39112, strength: "weak", ssid: "Hotel_Recoleta", speed: 50, verified: 13 },
  { id: 19, lat: -34.58467, lng: -58.39045, strength: "weak", ssid: "Street_Cafe", speed: 47, verified: 10 },
  { id: 20, lat: -34.58356, lng: -58.38989, strength: "weak", ssid: "Public_WiFi", speed: 44, verified: 7 },
  
  // Weak signals around ETHGlobal (randomized positions within ~500m)
  { id: 21, lat: -34.58434, lng: -58.39156, strength: "dead", ssid: "Old_Building_2G", speed: 12, verified: 3 },
  { id: 22, lat: -34.58312, lng: -58.39034, strength: "dead", ssid: "Basement_Network", speed: 8, verified: 2 },
  { id: 23, lat: -34.58489, lng: -58.39123, strength: "dead", ssid: "Slow_Connection", speed: 10, verified: 1 },
  { id: 24, lat: -34.58378, lng: -58.38945, strength: "dead", ssid: "Weak_Signal_Zone", speed: 9, verified: 2 },
  { id: 25, lat: -34.58445, lng: -58.39167, strength: "dead", ssid: "Poor_Coverage", speed: 11, verified: 1 },
]

// Custom WiFi Signal Marker Component
function WiFiMarker({
  signal,
  onMarkerClick,
  isHovered,
  onHover,
}: {
  signal: any
  onMarkerClick: (signal: any) => void
  isHovered: boolean
  onHover: (id: string | number | null) => void
}) {
  const getSignalColor = (strength: string) => {
    switch (strength) {
      case "strong":
        return "#34d399" // signal-green
      case "weak":
        return "#fbbf24" // warning-amber
      case "dead":
        return "#f87171" // critical-red
      default:
        return "#22d3ee" // cyber-cyan
    }
  }

  const color = getSignalColor(signal.strength)

  return (
    <AdvancedMarker
      position={{ lat: signal.lat, lng: signal.lng }}
      onClick={() => onMarkerClick(signal)}
      onMouseEnter={() => onHover(signal.id)}
      onMouseLeave={() => onHover(null)}
      zIndex={isHovered ? 1000 : 100}
    >
      {/* Custom marker content - single unified marker */}
      <div className="relative cursor-pointer touch-manipulation" style={{ pointerEvents: 'auto' }}>
        {/* Outer pulse ring on hover - Only on desktop, smaller */}
        {isHovered && (
          <div
            className="hidden md:block absolute inset-0 animate-ping rounded-full opacity-40"
            style={{
              width: "24px",
              height: "24px",
              left: "-8px",
              top: "-8px",
              backgroundColor: color,
            }}
          />
        )}

        {/* Single unified marker dot with border - smaller size */}
        <div
          className="relative z-10 h-3 w-3 rounded-full transition-all duration-300"
          style={{
            backgroundColor: color,
            boxShadow: isHovered 
              ? `0 0 8px ${color}, 0 0 16px ${color}, inset 0 1px 1px rgba(255,255,255,0.6)` 
              : `0 0 4px ${color}, 0 1px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.6)`,
            transform: isHovered ? "scale(1.3)" : "scale(1)",
            border: "1.5px solid rgba(255, 255, 255, 0.9)",
          }}
        />

        {/* Tooltip on hover - positioned to avoid covering map info */}
        {isHovered && (
          <div 
            className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 z-[100] min-w-[180px] animate-fade-in rounded-lg p-2.5 text-xs shadow-2xl pointer-events-none"
            style={{
              backgroundColor: "rgba(17, 24, 39, 0.98)",
              border: "1px solid rgba(52, 211, 153, 0.4)",
              backdropFilter: "blur(12px)",
              transform: "translateY(-50%)",
            }}
          >
            <div className="font-space-grotesk font-semibold text-signal-green text-xs">{signal.ssid}</div>
            <div className="mt-0.5 font-jetbrains text-[10px] text-gray-300">
              {signal.speed} Mbps • {signal.verified} verifications
            </div>
            <div className="mt-1 flex items-center gap-1">
              <div 
                className="h-1.5 w-1.5 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] font-medium" style={{ color: color }}>
                {signal.strength.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </AdvancedMarker>
  )
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  
  useEffect(() => {
    if (map) {
      map.panTo({ lat, lng })
    }
  }, [map, lat, lng])
  
  return null
}

export interface MapViewProps {
  onMarkerClick: (signal: any) => void
  measurements?: Measurement[]
  onSignalsChange?: (signals: any[]) => void
}

export function MapView({ 
  onMarkerClick,
  measurements = [],
  onSignalsChange,
}: MapViewProps) {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const { coordinates, isLoading } = useLocation()

  // ETHGlobal center coordinates as default
  const defaultCenter = { lat: -34.584203, lng: -58.390394 }
  const center = coordinates || defaultCenter

  // Combine mock signals with dynamic measurements, with deduplication
  const allSignals = useMemo(() => {
    const measurementSignals = measurements.map((m) => ({
      id: m.id,
      lat: m.lat,
      lng: m.lng,
      strength: m.strength,
      ssid: m.ssid,
      speed: m.speed,
      verified: m.verified,
    }))
    
    // Combine and deduplicate by location and SSID (within small tolerance)
    const combined = [...mockSignals, ...measurementSignals]
    const seen = new Map<string, typeof combined[0]>()
    
    return combined.filter((signal) => {
      // Create a key based on rounded coordinates and SSID
      const key = `${Math.round(signal.lat * 10000)}_${Math.round(signal.lng * 10000)}_${signal.ssid}`
      if (seen.has(key)) {
        // Keep the one with higher verification count
        const existing = seen.get(key)!
        if (signal.verified > existing.verified) {
          seen.set(key, signal)
          return true
        }
        return false
      }
      seen.set(key, signal)
      return true
    })
  }, [measurements])

  // Notify parent of all signals for leaderboard
  useEffect(() => {
    if (onSignalsChange) {
      onSignalsChange(allSignals)
    }
  }, [allSignals, onSignalsChange])

  return (
    <div className="absolute inset-0 bg-void" style={{ zIndex: 0, isolation: 'isolate' }}>
      {/* Google Map Container */}
      <div className="absolute inset-0 h-full w-full">
        <GoogleMap
          defaultCenter={defaultCenter}
          defaultZoom={15}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
          disableDefaultUI={true}
          gestureHandling="greedy"
          style={{ width: "100%", height: "100%" }}
          onTilesLoad={() => {
            console.log("✅ Google Map tiles loaded successfully!")
            setMapLoaded(true)
          }}
        >
        {/* Recenter map when user location is found */}
        {coordinates && <MapRecenter lat={coordinates.lat} lng={coordinates.lng} />}

        {/* WiFi Signal Markers */}
        {allSignals.map((signal) => (
          <WiFiMarker
            key={signal.id}
            signal={signal}
            onMarkerClick={onMarkerClick}
            isHovered={hoveredId === signal.id}
            onHover={setHoveredId}
          />
        ))}

        {/* User location marker */}
        <AdvancedMarker position={center}>
          <div className="relative">
            {/* White background for contrast */}
            <div 
              className="absolute rounded-full bg-white shadow-lg"
              style={{
                width: "24px",
                height: "24px",
                left: "-8px",
                top: "-8px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
              }}
            />
            {/* Dark border ring */}
            <div 
              className="absolute rounded-full bg-gray-900"
              style={{
                width: "18px",
                height: "18px",
                left: "-5px",
                top: "-5px",
              }}
            />
            {/* Pulsing cyan dot */}
            <div 
              className="relative z-10 h-5 w-5 animate-pulse rounded-full bg-cyber-cyan"
              style={{
                boxShadow: "0 0 20px #22d3ee, 0 0 40px #22d3ee, inset 0 1px 2px rgba(255,255,255,0.5)",
                border: "2px solid rgba(255, 255, 255, 0.9)",
              }}
            />
            {/* Outer ping animation */}
            <div 
              className="absolute inset-0 animate-ping rounded-full bg-cyber-cyan opacity-60"
              style={{
                width: "32px",
                height: "32px",
                left: "-11px",
                top: "-11px",
              }}
            />
          </div>
        </AdvancedMarker>
      </GoogleMap>
      </div>

      {/* Cyber grid overlay for aesthetic */}
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-5">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-cyber-cyan"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}
