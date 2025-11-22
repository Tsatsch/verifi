"use client"

import { usePrivy, useWallets } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, LogOut, Copy, ExternalLink, Check } from "lucide-react"
import { useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"

export function WalletButton() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const loginInProgress = useRef(false)
  const { toast } = useToast()

  // Get the embedded wallet
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy")
  const address = embeddedWallet?.address

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(true)
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const handleViewOnExplorer = () => {
    if (address) {
      // Base Mainnet explorer
      window.open(`https://basescan.org/address/${address}`, "_blank")
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleLogin = async () => {
    // Prevent multiple simultaneous login attempts
    if (loginInProgress.current || isConnecting) {
      return
    }

    try {
      loginInProgress.current = true
      setIsConnecting(true)
      await login()
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Connection failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      // Reset after a delay to allow Privy to process
      setTimeout(() => {
        loginInProgress.current = false
        setIsConnecting(false)
      }, 1000)
    }
  }

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Wallet className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    )
  }

  // Show login button if not authenticated
  if (!authenticated) {
    return (
      <Button 
        variant="default" 
        size="sm" 
        onClick={handleLogin}
        disabled={isConnecting}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  // Show wallet dropdown if authenticated
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          {address ? formatAddress(address) : "Wallet"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">My Wallet</p>
            {user?.email?.address && (
              <p className="text-xs text-muted-foreground">{user.email.address}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {address && (
          <>
            <DropdownMenuItem onClick={handleCopyAddress}>
              {copiedAddress ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              <span className="flex-1">
                {copiedAddress ? "Copied!" : "Copy Address"}
              </span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleViewOnExplorer}>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span className="flex-1">View on Explorer</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={logout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span className="flex-1">Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

