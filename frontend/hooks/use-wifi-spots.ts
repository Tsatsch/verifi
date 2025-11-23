"use client"

import { useState, useEffect, useCallback } from 'react'
import { queryWifiSpots, queryWifiSpotsByBounds, type WifiSpot } from '@/lib/graphql-client'
import { fetchMultipleFromIPFS, type IPFSWifiData } from '@/lib/ipfs-fetcher'
import type { Measurement } from '@/types/measurement'

export interface EnrichedWifiSpot extends WifiSpot {
  ipfsData: IPFSWifiData | null
  measurement: Measurement | null
}

/**
 * Hook to fetch and enrich WiFi spots from The Graph and IPFS
 */
export function useWifiSpots() {
  const [spots, setSpots] = useState<EnrichedWifiSpot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSpots = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Query The Graph for all verified spots
      const graphSpots = await queryWifiSpots(1000, {
        verificationScore_gte: 100, // Only verified spots
      })

      if (graphSpots.length === 0) {
        setSpots([])
        setLoading(false)
        return
      }

      // 2. Fetch IPFS data for all CIDs
      const cids = graphSpots.map((spot) => spot.ipfsCid).filter(Boolean)
      const ipfsDataMap = await fetchMultipleFromIPFS(cids)

      // 3. Enrich spots with IPFS data and convert to Measurement format
      const enrichedSpots: EnrichedWifiSpot[] = graphSpots.map((spot) => {
        const ipfsData = ipfsDataMap.get(spot.ipfsCid) || null

        // Convert to Measurement format for map display
        let measurement: Measurement | null = null
        if (ipfsData) {
          // Use IPFS data if available, otherwise use event data
          const lat = ipfsData.location?.lat ?? parseFloat(spot.lat) / 1e6
          const lng = ipfsData.location?.lng ?? parseFloat(spot.long) / 1e6
          const speed = ipfsData.speed ?? 0

          // Determine strength based on speed
          const strength: 'strong' | 'weak' | 'dead' =
            speed >= 100 ? 'strong' : speed >= 30 ? 'weak' : 'dead'

          measurement = {
            id: spot.id,
            lat,
            lng,
            ssid: ipfsData.wifiName || 'Unknown WiFi',
            speed,
            strength,
            verified: parseInt(spot.verificationScore),
            timestamp: ipfsData.time || new Date(parseInt(spot.blockTimestamp) * 1000).toISOString(),
            walletAddress: ipfsData.walletAddress || spot.submitter,
          }
        } else {
          // Fallback: use event data even without IPFS
          const lat = parseFloat(spot.lat) / 1e6
          const lng = parseFloat(spot.long) / 1e6

          measurement = {
            id: spot.id,
            lat,
            lng,
            ssid: 'Verified WiFi Spot',
            speed: 0, // Unknown without IPFS data
            strength: 'weak',
            verified: parseInt(spot.verificationScore),
            timestamp: new Date(parseInt(spot.blockTimestamp) * 1000).toISOString(),
            walletAddress: spot.submitter,
          }
        }

        return {
          ...spot,
          ipfsData,
          measurement,
        }
      })

      setSpots(enrichedSpots)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load WiFi spots'
      setError(errorMessage)
      console.error('Error loading WiFi spots:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSpotsByBounds = useCallback(
    async (bounds: { north: number; south: number; east: number; west: number }) => {
      setLoading(true)
      setError(null)

      try {
        const graphSpots = await queryWifiSpotsByBounds(bounds)

        if (graphSpots.length === 0) {
          setSpots([])
          setLoading(false)
          return
        }

        // Fetch IPFS data
        const cids = graphSpots.map((spot) => spot.ipfsCid).filter(Boolean)
        const ipfsDataMap = await fetchMultipleFromIPFS(cids)

        // Enrich spots
        const enrichedSpots: EnrichedWifiSpot[] = graphSpots.map((spot) => {
          const ipfsData = ipfsDataMap.get(spot.ipfsCid) || null

          let measurement: Measurement | null = null
          if (ipfsData) {
            const lat = ipfsData.location?.lat ?? parseFloat(spot.lat) / 1e6
            const lng = ipfsData.location?.lng ?? parseFloat(spot.long) / 1e6
            const speed = ipfsData.speed ?? 0

            const strength: 'strong' | 'weak' | 'dead' =
              speed >= 100 ? 'strong' : speed >= 30 ? 'weak' : 'dead'

            measurement = {
              id: spot.id,
              lat,
              lng,
              ssid: ipfsData.wifiName || 'Unknown WiFi',
              speed,
              strength,
              verified: parseInt(spot.verificationScore),
              timestamp: ipfsData.time || new Date(parseInt(spot.blockTimestamp) * 1000).toISOString(),
              walletAddress: ipfsData.walletAddress || spot.submitter,
            }
          } else {
            const lat = parseFloat(spot.lat) / 1e6
            const lng = parseFloat(spot.long) / 1e6

            measurement = {
              id: spot.id,
              lat,
              lng,
              ssid: 'Verified WiFi Spot',
              speed: 0,
              strength: 'weak',
              verified: parseInt(spot.verificationScore),
              timestamp: new Date(parseInt(spot.blockTimestamp) * 1000).toISOString(),
              walletAddress: spot.submitter,
            }
          }

          return {
            ...spot,
            ipfsData,
            measurement,
          }
        })

        setSpots(enrichedSpots)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load WiFi spots'
        setError(errorMessage)
        console.error('Error loading WiFi spots by bounds:', err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Get measurements for map display
  const measurements = spots
    .map((spot) => spot.measurement)
    .filter((m): m is Measurement => m !== null)

  return {
    spots,
    measurements,
    loading,
    error,
    loadSpots,
    loadSpotsByBounds,
    refresh: loadSpots,
  }
}

