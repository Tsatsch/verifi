 "use client"

import { useState } from "react"
import { AuthButton } from "@coinbase/cdp-react"
import { useEvmAddress, useSignOut } from "@coinbase/cdp-hooks"
import { Button } from "@/components/ui/button"
import { Copy, Check, LogOut, Wallet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function WalletButton() {
  const { evmAddress } = useEvmAddress()
  const { signOut } = useSignOut()
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (evmAddress) {
      await navigator.clipboard.writeText(evmAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  // If wallet is connected, show custom button with address
  if (evmAddress) {
    const shortAddress = `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}`
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-1.5 md:gap-2 bg-glass backdrop-blur-xl border-signal-green/30 hover:bg-signal-green/10 hover:border-signal-green/50 h-8 md:h-10 px-2 md:px-3 touch-manipulation transition-all"
          >
            <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 text-signal-green" />
            <span className="font-mono text-[10px] md:text-xs text-foreground">{shortAddress}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-glass backdrop-blur-xl border border-signal-green/20">
          <DropdownMenuLabel className="text-foreground">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-foreground/60">Wallet Address</span>
              <span className="font-mono text-xs text-signal-green">{shortAddress}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-signal-green/20" />
          <DropdownMenuItem 
            onClick={copyAddress}
            className="hover:bg-signal-green/10 focus:bg-signal-green/10 text-foreground"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-signal-green" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Address</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="hover:bg-signal-green/10 focus:bg-signal-green/10 text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // If wallet is not connected, show CDP's default AuthButton
  return (
    <div className="relative z-50">
      <AuthButton />
    </div>
  )
}

