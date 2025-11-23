"use client"

import Image from "next/image"
import { WalletButton } from "@/components/wallet-button"

export function TopNav() {
  return (
    <div className="absolute left-0 right-0 top-0 z-50 p-3 md:p-6 pt-safe pointer-events-none">
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Logo */}
        <div className="inline-flex items-center justify-center gap-1.5 md:gap-2 h-7 md:h-8 rounded-md px-2 md:px-3 bg-signal-green text-void hover:bg-signal-green/90 active:bg-signal-green/80 touch-manipulation shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all">
          <Image 
            src="/logo_verifi-removebg.png" 
            alt="Wifi-Radar" 
            width={20} 
            height={20} 
            className="h-4 w-4 md:h-5 md:w-5 shrink-0 object-contain"
          />
          <span className="font-space-grotesk text-base md:text-xl font-bold">Wifi-Radar</span>
        </div>

        {/* Wallet Connect with Privy */}
        <WalletButton />
      </div>
    </div>
  )
}
