"use client"

import { Wifi } from "lucide-react"
import { WalletButton } from "@/components/wallet-button"

export function TopNav() {
  return (
    <div className="absolute left-0 right-0 top-0 z-50 p-4 md:p-6 pointer-events-none">
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Logo */}
        <div className="inline-flex items-center justify-center gap-2 h-8 rounded-md px-3 bg-primary text-primary-foreground hover:bg-primary/90">
          <Wifi className="h-5 w-5 shrink-0" />
          <span className="font-space-grotesk text-xl font-bold">Veri-Fi</span>
        </div>

        {/* Wallet Connect with Privy */}
        <WalletButton />
      </div>
    </div>
  )
}
