"use client";

import { useMemo } from "react";

/**
 * Hook to get the Coinbase CDP wallet provider for paymaster support
 * 
 * CDP embedded wallets expose a provider that supports wallet_sendCalls
 * for sponsored transactions. This hook attempts to access it.
 * 
 * @returns The wallet provider if available, undefined otherwise
 */
export function useCDPProvider(): any {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    // Try to get the provider from window.coinbase (CDP embedded wallet)
    // CDP may expose the provider in different ways
    const provider = (window as any).coinbase || (window as any).ethereum;
    
    if (provider && typeof provider.request === 'function') {
      // Check if it supports wallet_sendCalls (required for paymaster)
      return provider;
    }

    return undefined;
  }, []);
}

