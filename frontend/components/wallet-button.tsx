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
import { Wallet, LogOut, Copy, Check } from "lucide-react"
import { useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"

export function WalletButton() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const loginInProgress = useRef(false)
  const { toast } = useToast()

  // Get the first available wallet address (embedded or external)
  // Priority: embedded wallet first, then any connected wallet
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy")
  const connectedWallet = wallets.find((wallet) => wallet.address)
  const activeWallet = embeddedWallet || connectedWallet
  const address = activeWallet?.address

  // Get the current chain ID from the active wallet
  // Privy wallets may store chainId in different formats
  const chainId = activeWallet?.chainId ||
                  (activeWallet as any)?.chain?.id ||
                  (activeWallet as any)?.chainId ||
                  undefined

  // Helper to convert chainId to number
  const getChainIdNumber = (chainId: string | number | undefined): number | null => {
    if (!chainId) return null

    if (typeof chainId === "string") {
      // Handle hex strings (0x1, 0x2105, etc.) and decimal strings
      return chainId.startsWith("0x")
        ? parseInt(chainId, 16)
        : parseInt(chainId, 10)
    }

    return chainId
  }

  // Get chain name from chain ID
  const getChainName = (chainId: string | number | undefined): string => {
    const chainIdNum = getChainIdNumber(chainId)
    
    if (!chainIdNum) {
      // Default to Base if chain ID is not available
      return "Base"
    }
    
    switch (chainIdNum) {
      case 1:
        return "Ethereum"
      case 8453:
        return "Base"
      case 137:
        return "Polygon"
      default:
        // If chain is not recognized, show the chain ID number instead of "Unknown"
        return `Chain ${chainIdNum}`
    }
  }

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === "development" && authenticated) {
    console.log("[WalletButton] Wallets:", wallets)
    console.log("[WalletButton] Active wallet:", activeWallet)
    console.log("[WalletButton] Active wallet full object:", JSON.stringify(activeWallet, null, 2))
    console.log("[WalletButton] Chain ID:", chainId, typeof chainId)
    console.log("[WalletButton] Address:", address)
  }

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
        <Button variant="outline" size="sm" className="gap-2 font-mono relative z-50">
          <Wallet className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">
            {address ? formatAddress(address) : "Wallet"}
          </span>
          <span className="sm:hidden">
            {address ? `${address.slice(0, 4)}...${address.slice(-2)}` : "Wallet"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">My Wallet</p>
            {address && (
              <p className="text-xs text-muted-foreground font-mono break-all">
                {address}
              </p>
            )}
            {chainId && (
              <p className="text-xs text-muted-foreground">
                Network: {getChainName(chainId)}
              </p>
            )}
            {user?.email?.address && (
              <p className="text-xs text-muted-foreground mt-1">{user.email.address}</p>
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

