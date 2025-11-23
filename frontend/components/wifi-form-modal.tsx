"use client"

import { X, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/ui/star-rating"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { SpeedTestResult } from "@/lib/speed-test"

interface WiFiFormModalProps {
  speed: number
  location: { lat: number; lng: number } | null
  customLocation?: { lat: number; lng: number } | null
  isLoading?: boolean
  walletAddress: string | null
  measurementDetails?: Pick<SpeedTestResult, "method" | "methods">
  onClose: () => void
  onSubmit: (data: WiFiFormData) => void
}

export interface WiFiFormData {
  wifiName: string
  speed: number
  location: { lat: number; lng: number } | null
  satisfaction: number
  walletAddress: string | null
  timestamp: string
}

export function WiFiFormModal({
  speed,
  location,
  customLocation,
  isLoading = false,
  walletAddress,
  measurementDetails,
  onClose,
  onSubmit,
}: WiFiFormModalProps) {
  const [satisfaction, setSatisfaction] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationAddress, setLocationAddress] = useState<string>("")
  const [wifiName, setWifiName] = useState<string>("WiFi Measurement")
  const [loadingAddress, setLoadingAddress] = useState(true)
  const { toast } = useToast()

  // Use custom location (clicked on map) if provided, otherwise use user's GPS location
  const actualLocation = customLocation || location

  console.log("📍 WiFi Form Modal - Locations:", {
    customLocation,
    location,
    actualLocation,
  })

  // Fetch address from coordinates and auto-generate WiFi name
  useEffect(() => {
    const fetchAddress = async () => {
      if (!actualLocation) {
        setLoadingAddress(false)
        return
      }

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${actualLocation.lat},${actualLocation.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        )
        const data = await response.json()

        if (data.results && data.results.length > 0) {
          const address = data.results[0].formatted_address
          setLocationAddress(address)
          
          // Auto-generate wifiName from address components
          const addressComponents = data.results[0].address_components
          const locality = addressComponents.find((c: any) => 
            c.types.includes("locality") || c.types.includes("sublocality")
          )?.long_name || ""
          const route = addressComponents.find((c: any) => 
            c.types.includes("route")
          )?.short_name || ""
          
          setWifiName(`WiFi at ${route || locality || "location"}`)
        }
      } catch (error) {
        console.error("Error fetching address:", error)
      } finally {
        setLoadingAddress(false)
      }
    }

    fetchAddress()
  }, [actualLocation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (satisfaction === 0) {
      toast({
        title: "Rating required",
        description: "Please rate your satisfaction with this network",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = {
        wifiName,
        speed,
        location: actualLocation,
        satisfaction,
        walletAddress,
        // ISO 8601 string in UTC (Date.toISOString() is always UTC)
        timestamp: new Date().toISOString(),
      }
      console.log("Submitting WiFi form data:", JSON.stringify(formData, null, 2))
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div className="w-full max-w-md md:w-[90%] md:max-h-[90vh] overflow-y-auto">
          <div className="relative rounded-t-3xl md:rounded-2xl bg-glass p-6 md:p-8 backdrop-blur-xl border border-cyber-cyan/20 md:border-t md:border-l md:border-r md:border-b">
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-2 text-foreground/60 hover:text-foreground active:text-foreground transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>

          <h3 className="mb-4 md:mb-6 font-space-grotesk text-xl md:text-2xl font-bold text-foreground pr-8">
            Submit WiFi Measurement
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Location Address Display */}
            <div className="space-y-2">
              <Label className="text-sm md:text-base text-foreground/80 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Measurement Location
              </Label>
              <div className="rounded-lg bg-void/40 border border-cyber-cyan/20 px-4 py-3 min-h-[52px]">
                {loadingAddress ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyber-cyan border-t-transparent" />
                    <span className="text-sm text-foreground/60">Loading address...</span>
                  </div>
                ) : locationAddress ? (
                  <p className="text-sm md:text-base text-foreground">{locationAddress}</p>
                ) : actualLocation ? (
                  <p className="text-xs text-foreground/60">
                    {actualLocation.lat.toFixed(6)}, {actualLocation.lng.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-sm text-foreground/60">Location not available</p>
                )}
              </div>
            </div>

            {/* Speed (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="speed" className="text-sm md:text-base text-foreground/80">
                Measured Speed
              </Label>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2 rounded-lg bg-void/40 border border-foreground/20 px-4 py-3 min-h-[52px]">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyber-cyan border-t-transparent" />
                      <span className="text-sm text-foreground/60">Measuring speed...</span>
                    </div>
                  ) : (
                    <>
                      <span className="font-jetbrains text-2xl md:text-3xl font-bold text-cyber-cyan">
                        {speed}
                      </span>
                      <span className="text-sm text-foreground/60">Mbps</span>
                    </>
                  )}
                </div>

                {measurementDetails && (
                  <p className="text-xs text-foreground/50">
                    {measurementDetails.method && <span>{measurementDetails.method}</span>}
                    {measurementDetails.methods?.cdn && (
                      <span>
                        {" • CDN files: "}
                        {measurementDetails.methods.cdn.speed} Mbps
                      </span>
                    )}
                    {measurementDetails.methods?.cloudflare && (
                      <span>
                        {" • Cloudflare: "}
                        {measurementDetails.methods.cloudflare.speed} Mbps
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Location (Read-only) */}
            <div className="space-y-2">
              <Label className="text-sm md:text-base text-foreground/80">Location</Label>
              <div className="rounded-lg bg-void/40 border border-foreground/20 px-4 py-3 min-h-[52px] flex items-center">
                {location ? (
                  <div className="font-jetbrains text-xs md:text-sm text-foreground/80 w-full">
                    <div>Lat: {location.lat.toFixed(6)}</div>
                    <div>Lng: {location.lng.toFixed(6)}</div>
                  </div>
                ) : (
                  <div className="text-sm text-foreground/60 w-full">
                    <div>Location unavailable</div>
                    <div className="text-xs text-foreground/40 mt-1">Please enable location permissions</div>
                  </div>
                )}
              </div>
            </div>

            {/* Satisfaction Rating */}
            <div className="space-y-3">
              <Label className="text-sm md:text-base text-foreground/80">How fast is Wifi?</Label>
              <div className="flex justify-center py-2">
                <StarRating 
                  value={satisfaction} 
                  onChange={isLoading ? () => {} : setSatisfaction} 
                />
              </div>
              {satisfaction > 0 && (
                <p className="text-center text-xs md:text-sm text-foreground/60">
                  {satisfaction === 1 && "Very Poor"}
                  {satisfaction === 2 && "Poor"}
                  {satisfaction === 3 && "Average"}
                  {satisfaction === 4 && "Good"}
                  {satisfaction === 5 && "Excellent"}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full h-12 md:h-11 rounded-full bg-cyber-cyan text-void hover:bg-cyber-cyan/90 active:bg-cyber-cyan/80 font-semibold disabled:opacity-50 touch-manipulation text-base"
            >
              {isSubmitting ? "Submitting..." : isLoading ? "Measuring Speed..." : "Submit Measurement"}
            </Button>
          </form>
          </div>
        </div>
      </div>
    </>
  )
}

