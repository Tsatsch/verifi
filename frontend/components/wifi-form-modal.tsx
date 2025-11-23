"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/ui/star-rating"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { SpeedTestResult } from "@/lib/speed-test"

interface WiFiFormModalProps {
  speed: number
  location: { lat: number; lng: number } | null
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
  isLoading = false,
  walletAddress,
  measurementDetails,
  onClose,
  onSubmit,
}: WiFiFormModalProps) {
  const [wifiName, setWifiName] = useState("")
  const [satisfaction, setSatisfaction] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!wifiName.trim()) {
      toast({
        title: "WiFi name required",
        description: "Please enter a name for your WiFi network",
        variant: "destructive",
      })
      return
    }

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
        location,
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
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-[90%] max-w-md">
          <div className="relative rounded-2xl bg-glass p-8 backdrop-blur-xl border border-cyber-cyan/20">
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-1 text-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <h3 className="mb-6 font-space-grotesk text-2xl font-bold text-foreground">
            Submit WiFi Measurement
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* WiFi Name */}
            <div className="space-y-2">
              <Label htmlFor="wifi-name" className="text-foreground/80">
                WiFi Network Name
              </Label>
              <Input
                id="wifi-name"
                type="text"
                placeholder="Enter network name"
                value={wifiName}
                onChange={(e) => setWifiName(e.target.value)}
                disabled={isLoading}
                className="bg-void/40 border-foreground/20 text-foreground placeholder:text-foreground/40 disabled:opacity-50"
              />
            </div>

            {/* Speed (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="speed" className="text-foreground/80">
                Measured Speed
              </Label>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2 rounded-lg bg-void/40 border border-foreground/20 px-4 py-3">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyber-cyan border-t-transparent" />
                      <span className="text-sm text-foreground/60">Measuring speed...</span>
                    </div>
                  ) : (
                    <>
                      <span className="font-jetbrains text-3xl font-bold text-cyber-cyan">
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
              <Label className="text-foreground/80">Location</Label>
              <div className="rounded-lg bg-void/40 border border-foreground/20 px-4 py-3">
                {location ? (
                  <div className="font-jetbrains text-sm text-foreground/80">
                    <div>Lat: {location.lat.toFixed(6)}</div>
                    <div>Lng: {location.lng.toFixed(6)}</div>
                  </div>
                ) : (
                  <div className="text-sm text-foreground/40">Location unavailable</div>
                )}
              </div>
            </div>

            {/* Satisfaction Rating */}
            <div className="space-y-3">
              <Label className="text-foreground/80">How fast is Wifi?</Label>
              <div className="flex justify-center py-2">
                <StarRating 
                  value={satisfaction} 
                  onChange={isLoading ? () => {} : setSatisfaction} 
                />
              </div>
              {satisfaction > 0 && (
                <p className="text-center text-sm text-foreground/60">
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
              className="w-full rounded-full bg-cyber-cyan text-void hover:bg-cyber-cyan/90 font-semibold disabled:opacity-50"
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

