"use client"

import { useState, useEffect, useMemo } from "react"
import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps"
import { useLocation } from "@/hooks/use-location"
import type { Measurement } from "@/types/measurement"

const mockSignals = [
  // Strong signals - Excellent WiFi spots
  { id: 1, lat: 37.7749, lng: -122.4194, strength: "strong", ssid: "CoffeeHub_Guest", speed: 145, verified: 12 },
  { id: 2, lat: 37.7769, lng: -122.4174, strength: "strong", ssid: "FastCafe_5G", speed: 180, verified: 24 },
  { id: 3, lat: 37.7779, lng: -122.4164, strength: "strong", ssid: "TechHub_Premium", speed: 220, verified: 38 },
  { id: 4, lat: 37.7719, lng: -122.4184, strength: "strong", ssid: "CoWork_Space", speed: 165, verified: 19 },
  
  // Weak signals - Decent but slow
  { id: 5, lat: 37.7759, lng: -122.4184, strength: "weak", ssid: "Library_Free", speed: 45, verified: 5 },
  { id: 6, lat: 37.7729, lng: -122.4214, strength: "weak", ssid: "SlowSpot_Public", speed: 32, verified: 8 },
  { id: 7, lat: 37.7749, lng: -122.4224, strength: "weak", ssid: "ParkBench_WiFi", speed: 28, verified: 3 },
  { id: 8, lat: 37.7789, lng: -122.4194, strength: "weak", ssid: "OldShop_Guest", speed: 38, verified: 6 },
  
  // Dead zones - Poor connectivity
  { id: 9, lat: 37.7739, lng: -122.4204, strength: "dead", ssid: "OldRouter_2G", speed: 8, verified: 2 },
  { id: 10, lat: 37.7709, lng: -122.4194, strength: "dead", ssid: "BarelySurviving", speed: 12, verified: 1 },
  { id: 11, lat: 37.7769, lng: -122.4224, strength: "dead", ssid: "DeadZone_Mall", speed: 5, verified: 1 },
  
  // Medium signals - Good performance
  { id: 12, lat: 37.7759, lng: -122.4164, strength: "strong", ssid: "UrbanCafe_Guest", speed: 125, verified: 15 },
  { id: 13, lat: 37.7739, lng: -122.4174, strength: "weak", ssid: "BookStore_Free", speed: 52, verified: 7 },
  { id: 14, lat: 37.7719, lng: -122.4214, strength: "strong", ssid: "FoodHall_5G", speed: 195, verified: 28 },
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
    >
      {/* Custom marker content */}
      <div className="relative cursor-pointer">
        {/* Outer pulse ring on hover */}
        {isHovered && (
          <div
            className="absolute inset-0 animate-ping rounded-full opacity-75"
            style={{
              width: "40px",
              height: "40px",
              left: "-16px",
              top: "-16px",
              backgroundColor: color,
            }}
          />
        )}

        {/* White background ring for contrast on light maps */}
        <div
          className="absolute rounded-full bg-white shadow-lg"
          style={{
            width: "20px",
            height: "20px",
            left: "-6px",
            top: "-6px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        />

        {/* Dark border ring for extra definition */}
        <div
          className="absolute rounded-full"
          style={{
            width: "14px",
            height: "14px",
            left: "-3px",
            top: "-3px",
            backgroundColor: "#1a1a1a",
            border: "1px solid rgba(255, 255, 255, 0.4)",
          }}
        />

        {/* Core colored dot */}
        <div
          className="relative z-10 h-4 w-4 rounded-full transition-all duration-300"
          style={{
            backgroundColor: color,
            boxShadow: isHovered 
              ? `0 0 20px ${color}, 0 0 40px ${color}, inset 0 1px 2px rgba(255,255,255,0.5)` 
              : `0 0 12px ${color}, 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.5)`,
            transform: isHovered ? "scale(1.3)" : "scale(1)",
            border: "2px solid rgba(255, 255, 255, 0.8)",
          }}
        />

        {/* Tooltip on hover */}
        {isHovered && (
          <div 
            className="absolute left-8 top-0 z-50 min-w-[200px] animate-fade-in rounded-lg p-3 text-sm shadow-2xl"
            style={{
              backgroundColor: "rgba(17, 24, 39, 0.95)",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="font-space-grotesk font-semibold text-cyber-cyan">{signal.ssid}</div>
            <div className="mt-1 font-jetbrains text-xs text-gray-300">
              {signal.speed} Mbps • {signal.verified} verifications
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <div 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium" style={{ color: color }}>
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
}

export function MapView({ 
  onMarkerClick,
  measurements = [],
}: MapViewProps) {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const { coordinates, isLoading } = useLocation()

  // San Francisco center coordinates as fallback
  const defaultCenter = { lat: 37.7749, lng: -122.4194 }
  const center = coordinates || defaultCenter

  // Combine mock signals with dynamic measurements
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
    return [...mockSignals, ...measurementSignals]
  }, [measurements])

  return (
    <div className="absolute inset-0 bg-void" style={{ zIndex: 0, isolation: 'isolate' }}>
      {/* Google Map Container */}
      <div className="absolute inset-0 h-full w-full">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={14}
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
      </Map>
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
