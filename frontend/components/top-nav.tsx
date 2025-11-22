"use client"

import { Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrivy } from "@privy-io/react-auth"

export function TopNav() {
  const { login, logout, authenticated, user } = usePrivy()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="absolute left-0 right-0 top-0 z-40 p-4 md:p-6">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-cyan/20">
            <Wifi className="h-5 w-5 text-cyber-cyan" />
          </div>
          <span className="font-space-grotesk text-xl font-bold text-cyber-cyan">Veri-Fi</span>
        </div>

        {/* Wallet Connect */}
        {authenticated && user?.wallet ? (
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-full bg-glass px-4 py-2 backdrop-blur-xl transition-all hover:bg-glass/80"
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyber-cyan to-signal-green" />
            <span className="font-jetbrains text-sm text-foreground">
              {formatAddress(user.wallet.address)}
            </span>
          </button>
        ) : (
          <Button
            onClick={login}
            className="rounded-full border border-cyber-cyan/50 bg-glass backdrop-blur-xl hover:bg-cyber-cyan/20"
          >
            Sync Wallet
          </Button>
        )}
      </div>
    </div>
  )
}
