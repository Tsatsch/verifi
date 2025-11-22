"use client"

import { Check, Zap, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { SignInModal } from "@coinbase/cdp-react"
import { useToast } from "@/components/ui/use-toast"

interface VerificationModalProps {
  result: any
  onClose: () => void
}

export function VerificationModal({ result, onClose }: VerificationModalProps) {
  const { toast } = useToast()
  const [phase, setPhase] = useState<"speedometer" | "mint">("speedometer")
  const [speed, setSpeed] = useState(0)
  const [showSignIn, setShowSignIn] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Animate speed counter
  useEffect(() => {
    if (phase === "speedometer") {
      let current = 0
      const interval = setInterval(() => {
        current += 5
        if (current >= result.speed) {
          setSpeed(result.speed)
          clearInterval(interval)
          setTimeout(() => setPhase("mint"), 500)
        } else {
          setSpeed(current)
        }
      }, 30)
      return () => clearInterval(interval)
    }
  }, [phase, result.speed])

  const handleConnect = () => {
    setShowSignIn(true)
  }

  const handleSignInSuccess = () => {
    setShowSignIn(false)
    setIsConnected(true)
  }

  const handleSignAndPublish = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please create a wallet first",
        variant: "destructive",
      })
      return
    }

    // TODO: Add your actual transaction logic here
    // For now, just show success message
    toast({
      title: "Signal published!",
      description: `You earned ${result.reward} VERI tokens`,
    })

    onClose()
  }

  return (
    <>
      {/* Backdrop with dim effect */}
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 animate-scale-in">
        {phase === "speedometer" ? (
          <div className="relative rounded-2xl bg-glass p-8 text-center backdrop-blur-xl">
            {/* Close button while measuring */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1 text-foreground/60 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 text-sm text-foreground/60">Analyzing Spectrum...</div>

            {/* Speedometer Gauge */}
            <div className="relative mx-auto mb-6 h-48 w-48">
              <svg className="h-full w-full -rotate-90 transform">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-void/40"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#speedGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(speed / 200) * 553} 553`}
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-jetbrains text-5xl font-bold text-cyber-cyan">{speed}</div>
                <div className="text-sm text-foreground/60">Mbps</div>
              </div>
            </div>

            <div className="font-space-grotesk text-xl font-semibold text-foreground">{result.ssid}</div>
          </div>
        ) : (
          <div className="relative rounded-2xl bg-glass p-8 text-center backdrop-blur-xl">
            {/* Close button on mint phase */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1 text-foreground/60 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal-green/20 animate-scale-in">
                <Check className="h-8 w-8 text-signal-green" />
              </div>
            </div>

            <h3 className="mb-2 font-space-grotesk text-2xl font-bold text-foreground">New Signal Detected</h3>

            <div className="mb-6 flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-warning-amber" />
              <span className="font-jetbrains text-3xl font-bold text-cyber-cyan">+{result.reward} VERI</span>
            </div>

            {/* Show measured average value and sample count */}
            <div className="mb-4 text-sm text-foreground/70">
              Measured: <span className="font-jetbrains font-bold text-cyber-cyan">{result.speed}</span> Mbps
              {result.samples ? (
                <span className="ml-2 text-xs text-foreground/60">(avg over {result.samples.length} samples)</span>
              ) : null}
            </div>

            {isConnected ? (
              <Button
                onClick={handleSignAndPublish}
                className="w-full rounded-full bg-cyber-cyan text-void hover:bg-cyber-cyan/90"
              >
                Sign & Publish
              </Button>
            ) : (
              <div>
                <p className="mb-4 text-sm text-foreground/60">Create a wallet to earn rewards</p>
                <Button
                  onClick={handleConnect}
                  className="w-full rounded-full bg-cyber-cyan text-void hover:bg-cyber-cyan/90"
                >
                  Create Wallet
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sign In Modal */}
      {showSignIn && (
        <SignInModal 
          isOpen={showSignIn}
          onClose={() => setShowSignIn(false)}
          onSuccess={handleSignInSuccess}
        />
      )}
    </>
  )
}
