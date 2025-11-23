"use client"

import { X, Lock, LockOpen, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SignalCardProps {
  signal: any
  onClose: () => void
  onNewMeasurement?: () => void
  isWalletConnected?: boolean
  isScanning?: boolean
}

export function SignalCard({ 
  signal, 
  onClose, 
  onNewMeasurement,
  isWalletConnected = false,
  isScanning = false,
}: SignalCardProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card - Mobile: Bottom Sheet, Desktop: Floating */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up rounded-t-3xl bg-glass p-5 md:p-6 backdrop-blur-xl pb-safe md:bottom-auto md:right-6 md:top-24 md:left-auto md:w-[400px] md:animate-fade-in md:rounded-2xl md:pb-6">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-foreground/60 hover:text-foreground active:text-foreground rounded-full p-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-4 flex items-start gap-2 md:gap-3 pr-10">
          <div className="font-space-grotesk text-lg md:text-xl font-bold text-foreground break-words flex-1">{signal.ssid}</div>
          {signal.ssid.includes("Guest") || signal.ssid.includes("Free") ? (
            <LockOpen className="h-5 w-5 text-signal-green shrink-0" />
          ) : (
            <Lock className="h-5 w-5 text-warning-amber shrink-0" />
          )}
        </div>

        {/* Hero Metric */}
        <div className="mb-5 md:mb-6">
          <div className="font-jetbrains text-4xl md:text-5xl font-bold text-cyber-cyan">
            {signal.speed} <span className="text-xl md:text-2xl text-foreground/60">Mbps</span>
          </div>
        </div>

        {/* Trust Score */}
        <div className="mb-5 md:mb-6">
          <div className="mb-2 flex items-center justify-between text-xs md:text-sm">
            <span className="text-foreground/60">Trust Score</span>
            <span className="font-jetbrains text-signal-green">Verified by {signal.verified} peers</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-void/40">
            <div
              className="h-full bg-gradient-to-r from-signal-green to-cyber-cyan"
              style={{ width: `${Math.min((signal.verified / 30) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={onNewMeasurement}
            disabled={!isWalletConnected || isScanning}
            className="w-full h-12 md:h-11 rounded-full bg-cyber-cyan text-void hover:bg-cyber-cyan/90 active:bg-cyber-cyan/80 touch-manipulation text-base font-bold"
          >
            {isScanning ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-void border-t-transparent" />
                Running Speed Test...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                New Measurement
              </>
            )}
          </Button>
          {!isWalletConnected && (
            <p className="text-xs text-center text-foreground/60">
              Connect your wallet to add measurements
            </p>
          )}
        </div>
      </div>
    </>
  )
}
