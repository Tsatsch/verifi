"use client"

import { Wifi } from "lucide-react"
import { WalletButton } from "@/components/wallet-button"

export function TopNav() {
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

        {/* Wallet Connect with Privy */}
        <WalletButton />
      </div>
    </div>
  )
}
