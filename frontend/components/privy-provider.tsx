"use client"

import type React from "react"
import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth"

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    console.error(
      "NEXT_PUBLIC_PRIVY_APP_ID is not set. Please add it to your .env.local file."
    )
    return <>{children}</>
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        // Customize the login methods you want to support
        loginMethods: ["email", "wallet", "google", "twitter"],
        
        // Appearance configuration
        appearance: {
          theme: "dark",
          accentColor: "#10B981", // Emerald-500 to match Veri-Fi theme
          logo: "/icon.svg",
          showWalletLoginFirst: true,
        },
        
        // Embedded wallet configuration
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          requireUserPasswordOnCreate: false,
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
      }}
    >
      {children}
    </PrivyProviderBase>
  )
}

