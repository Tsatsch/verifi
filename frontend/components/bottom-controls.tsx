"use client"

import { Filter, Crosshair, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type SignalFilter = 'all' | 'strong' | 'weak' | 'dead'

interface BottomControlsProps {
  onAddNew: () => void
  isScanning: boolean
  isWalletConnected?: boolean
  signalFilter?: SignalFilter
  onSignalFilterChange?: (filter: SignalFilter) => void
  onRecenter?: () => void
}

const filterOptions: { value: SignalFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All Signals', color: '#34d399' },
  { value: 'strong', label: 'Strong (Green)', color: '#34d399' },
  { value: 'weak', label: 'Medium (Yellow)', color: '#fbbf24' },
  { value: 'dead', label: 'Weak (Red)', color: '#f87171' },
]

export function BottomControls({ 
  onAddNew, 
  isScanning, 
  isWalletConnected = false,
  signalFilter = 'all',
  onSignalFilterChange,
  onRecenter,
}: BottomControlsProps) {
  return (
    <div className="absolute bottom-20 left-0 right-0 z-40 flex justify-between items-center px-4 pb-safe md:bottom-8 md:pb-0 md:px-6">
      {/* Left side - Filter button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="h-16 w-16 md:h-[72px] md:w-[72px] rounded-full bg-glass backdrop-blur-xl border border-signal-green/20 hover:bg-signal-green/10 hover:border-signal-green/40 touch-manipulation transition-all"
            aria-label="Filter by signal strength"
          >
            <Filter className="h-6 w-6 md:h-8 md:w-8 text-signal-green" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          side="top" 
          align="start"
          className="w-56 bg-glass/95 backdrop-blur-xl border-signal-green/20"
        >
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-sm font-semibold text-foreground/90">
              Filter by Signal
            </div>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSignalFilterChange?.(option.value)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/10 transition-colors text-left"
              >
                <div 
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                <span className="text-sm text-foreground/80 flex-1">
                  {option.label}
                </span>
                {signalFilter === option.value && (
                  <Check className="h-4 w-4 text-signal-green" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Center - Main Add WiFi Button */}
      <div className="flex items-center gap-3 md:gap-4">

        {/* Main Add WiFi Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <button
                  onClick={onAddNew}
                  disabled={isScanning || !isWalletConnected}
                  className="group relative h-24 w-24 md:h-[120px] md:w-[120px] rounded-full bg-gradient-to-br from-signal-green to-cyber-cyan shadow-[0_0_25px_rgba(52,211,153,0.6),0_0_50px_rgba(52,211,153,0.4)] transition-all duration-300 active:scale-95 md:hover:scale-110 md:hover:shadow-[0_0_35px_rgba(52,211,153,0.8),0_0_70px_rgba(52,211,153,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:md:hover:scale-100 disabled:md:hover:shadow-[0_0_25px_rgba(52,211,153,0.6),0_0_50px_rgba(52,211,153,0.4)] touch-manipulation"
                  aria-label="Add WiFi measurement"
                >
                  {/* Animated background pulse */}
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-br from-signal-green to-cyber-cyan ${isScanning ? "animate-ping opacity-75" : "animate-pulse-slow opacity-40"}`}
                  />
                  
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/40" />
                  
                  {/* Inner content container */}
                  <div className="relative z-10 flex h-full w-full items-center justify-center">
                    <Plus
                      className={`h-12 w-12 md:h-[60px] md:w-[60px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform ${isScanning ? "animate-spin" : "md:group-hover:scale-110"}`}
                      strokeWidth={3}
                    />
                  </div>
                  
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/0 to-white/20 opacity-0 transition-opacity duration-300 md:group-hover:opacity-100" />
                </button>
              </span>
            </TooltipTrigger>
            {!isWalletConnected && (
              <TooltipContent>
                <p>Connect your wallet to add WiFi measurements</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right side - Recenter button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              onClick={onRecenter}
              className="h-16 w-16 md:h-[72px] md:w-[72px] rounded-full bg-glass backdrop-blur-xl border border-signal-green/20 hover:bg-signal-green/10 hover:border-signal-green/40 touch-manipulation transition-all"
              aria-label="Recenter map to your location"
            >
              <Crosshair className="h-6 w-6 md:h-8 md:w-8 text-signal-green" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Center map on your location</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
