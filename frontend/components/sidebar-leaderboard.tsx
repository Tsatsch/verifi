"use client"

import { Trophy, TrendingUp, Users } from "lucide-react"
import { useMemo } from "react"
import { useLocation } from "@/hooks/use-location"
import type { Measurement } from "@/types/measurement"

interface SidebarLeaderboardProps {
  measurements?: Measurement[]
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ETHGlobal hardcoded signal (always in leaderboard)
const ETHGLOBAL_SIGNAL = {
  ssid: "ETHGlobal",
  speed: 55,
  distance: 0, // Will be calculated if coordinates available
  verifications: 89,
  isETHGlobal: true,
}

// Mock users for leaderboard
const MOCK_USERS = [
  {
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    name: "WiFi Explorer",
    measurementCount: 47,
  },
  {
    walletAddress: "0x8ba1f109551bD432803012645Hac136c22C9c",
    name: "Signal Hunter",
    measurementCount: 32,
  },
  {
    walletAddress: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
    name: "Network Scout",
    measurementCount: 28,
  },
]

// Helper to format wallet address
function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function SidebarLeaderboard({ measurements = [] }: SidebarLeaderboardProps) {
  const { coordinates } = useLocation()

  // Get top signals sorted by distance and speed
  const topSignals = useMemo(() => {
    // Always include ETHGlobal first
    const ethGlobalWithDistance = {
      ...ETHGLOBAL_SIGNAL,
      distance: coordinates 
        ? calculateDistance(coordinates.lat, coordinates.lng, -34.584203, -58.390394)
        : 0,
    }

    if (!coordinates || measurements.length === 0) {
      // If no coordinates or measurements, still show ETHGlobal
      return [ethGlobalWithDistance]
    }

    // Calculate distance for each measurement and sort by distance, then by speed
    const signalsWithDistance = measurements
      .filter((m) => m.ssid !== "ETHGlobal") // Exclude ETHGlobal from regular list (it's hardcoded)
      .map((m) => ({
        ...m,
        distance: calculateDistance(coordinates.lat, coordinates.lng, m.lat, m.lng),
      }))
      .sort((a, b) => {
        // First sort by distance (closer first), then by speed (faster first)
        if (Math.abs(a.distance - b.distance) < 0.5) {
          // If within 500m, prioritize speed
          return b.speed - a.speed
        }
        return a.distance - b.distance
      })
      .slice(0, 3) // Top 3 closest signals (ETHGlobal takes 1st spot)

    const formattedSignals = signalsWithDistance.map((signal) => ({
      ssid: signal.ssid,
      speed: signal.speed,
      distance: signal.distance,
      verifications: signal.verified,
      isETHGlobal: false,
    }))

    // ETHGlobal always first, then other signals
    return [ethGlobalWithDistance, ...formattedSignals]
  }, [coordinates, measurements])

  // Get top users by number of submitted measurements
  const topUsers = useMemo(() => {
    // Count measurements by wallet address
    const userCounts = new Map<string, number>()
    
    measurements.forEach((m) => {
      const walletAddr = m.walletAddress
      if (walletAddr) {
        const current = userCounts.get(walletAddr) || 0
        userCounts.set(walletAddr, current + 1)
      }
    })

    // Convert to array and sort by count
    const realUsers = Array.from(userCounts.entries())
      .map(([walletAddress, count]) => ({
        walletAddress,
        name: formatAddress(walletAddress),
        measurementCount: count,
        isMock: false,
      }))
      .sort((a, b) => b.measurementCount - a.measurementCount)
      .slice(0, 3)

    // Combine with mock users and sort
    const allUsers = [
      ...realUsers,
      ...MOCK_USERS.map((user) => ({ ...user, isMock: true })),
    ]
      .sort((a, b) => b.measurementCount - a.measurementCount)
      .slice(0, 3)

    return allUsers
  }, [measurements])

  if (topSignals.length === 0) {
    return (
      <div className="fixed left-6 top-24 z-30 w-[288px] animate-fade-in rounded-2xl bg-glass p-5 backdrop-blur-xl border border-signal-green/20">
        <div className="mb-3.5 flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-signal-green" />
          <h3 className="font-space-grotesk text-base font-bold text-foreground">Top Signals Nearby</h3>
        </div>
        <div className="text-sm text-foreground/60 text-center py-3.5">
          No signals found nearby
        </div>
      </div>
    )
  }

  return (
    <div className="fixed left-6 top-24 z-30 w-[288px] animate-fade-in rounded-2xl bg-glass p-5 backdrop-blur-xl border border-signal-green/20">
      <div className="mb-3.5 flex items-center gap-1.5">
        <Trophy className="h-4 w-4 text-signal-green" />
        <h3 className="font-space-grotesk text-base font-bold text-foreground">Top Signals Nearby</h3>
      </div>

      <div className="space-y-2.5 mb-5">
        {topSignals.map((signal, idx) => (
          <div 
            key={idx} 
            className={`group cursor-pointer rounded-lg p-2.5 transition-all hover:bg-void/40 border ${
              signal.isETHGlobal 
                ? 'bg-signal-green/10 border-signal-green/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
                : 'bg-void/20 border-signal-green/10'
            }`}
          >
            <div className="mb-1 flex items-start justify-between">
              <div className={`font-jetbrains text-sm font-semibold ${
                signal.isETHGlobal ? 'text-signal-green' : 'text-foreground'
              }`}>
                {signal.ssid}
                {signal.isETHGlobal && (
                  <span className="ml-1.5 text-[11px] text-signal-green/80">⭐ Featured</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-signal-green">
                <TrendingUp className="h-2.5 w-2.5" />
                {signal.speed}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-foreground/60">
              <span>{signal.distance < 1 ? `${Math.round(signal.distance * 1000)}m away` : `${signal.distance.toFixed(1)}km away`}</span>
              <span>{signal.verifications} {signal.verifications === 1 ? 'verification' : 'verifications'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* User Leaderboard */}
      <div className="border-t border-signal-green/20 pt-3.5">
        <div className="mb-3.5 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-signal-green" />
          <h3 className="font-space-grotesk text-base font-bold text-foreground">Top Contributors</h3>
        </div>

        <div className="space-y-2.5">
          {topUsers.map((user, idx) => (
            <div 
              key={user.walletAddress}
              className={`group cursor-pointer rounded-lg p-2.5 transition-all hover:bg-void/40 border ${
                idx === 0
                  ? 'bg-signal-green/10 border-signal-green/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
                  : 'bg-void/20 border-signal-green/10'
              }`}
            >
              <div className="mb-1 flex items-start justify-between">
                <div className={`font-jetbrains text-sm font-semibold ${
                  idx === 0 ? 'text-signal-green' : 'text-foreground'
                }`}>
                  {user.name}
                  {idx === 0 && (
                    <span className="ml-1.5 text-[11px] text-signal-green/80">🏆 #1</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-signal-green">
                  <Trophy className="h-2.5 w-2.5" />
                  {user.measurementCount}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-foreground/60">
                <span className="font-mono">{formatAddress(user.walletAddress)}</span>
                <span>{user.measurementCount} {user.measurementCount === 1 ? 'measurement' : 'measurements'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
