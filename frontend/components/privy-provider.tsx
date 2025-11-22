"use client"

import type React from "react"
import { useMemo } from "react"
import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth"
import type { PrivyClientConfig } from "@privy-io/react-auth"
import { PrivyWarningSuppressor } from "./privy-warning-suppressor"

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  const config = useMemo<PrivyClientConfig>(() => ({
    // Wallet-only authentication
    loginMethods: ["wallet"],
        
        // Appearance configuration
        appearance: {
          theme: "dark",
          accentColor: "#10B981", // Emerald-500 to match Veri-Fi theme
          logo: "/icon.svg",
          showWalletLoginFirst: true,
      // Coinbase Smart Wallet as priority #1 (browser-based, no mobile app needed)
      walletList: ["coinbase_wallet", "metamask", "rainbow"],
        },
        
    // Embedded wallet configuration - Privy creates wallets automatically
        embeddedWallets: {
      ethereum: {
          createOnLogin: "users-without-wallets",
      },
      showWalletUIs: true,
        },
        
        // Supported chains - configure based on your needs
        supportedChains: [
          // Ethereum Mainnet
          {
            id: 1,
            name: "Ethereum",
            network: "mainnet",
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ["https://eth.llamarpc.com"],
              },
            },
            blockExplorers: {
              default: {
                name: "Etherscan",
                url: "https://etherscan.io",
              },
            },
          },
          // Base (recommended for low fees)
          {
            id: 8453,
            name: "Base",
            network: "base",
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ["https://mainnet.base.org"],
              },
            },
            blockExplorers: {
              default: {
                name: "BaseScan",
                url: "https://basescan.org",
              },
            },
          },
          // Polygon (for testing/lower fees)
          {
            id: 137,
            name: "Polygon",
            network: "polygon",
            nativeCurrency: {
              name: "MATIC",
              symbol: "MATIC",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ["https://polygon-rpc.com"],
              },
            },
            blockExplorers: {
              default: {
                name: "PolygonScan",
                url: "https://polygonscan.com",
              },
            },
          },
        ],
        
        // Default chain
        defaultChain: {
          id: 8453, // Base
          name: "Base",
          network: "base",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ["https://mainnet.base.org"],
            },
          },
          blockExplorers: {
            default: {
              name: "BaseScan",
              url: "https://basescan.org",
            },
          },
        },
  }), [])

  if (!appId) {
    console.warn(
      "[Privy] NEXT_PUBLIC_PRIVY_APP_ID is not set. Please add it to your .env.local file.",
      "\nGet your App ID from: https://dashboard.privy.io"
    )
    // Return children without Privy provider if no app ID
    return <>{children}</>
  }

  return (
    <>
      <PrivyWarningSuppressor />
      <PrivyProviderBase appId={appId} config={config}>
      {children}
    </PrivyProviderBase>
    </>
  )
}

