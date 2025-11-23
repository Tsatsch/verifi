import { useMemo } from "react";
import { JsonRpcProvider } from "ethers";
import {
  useEvmAddress,
  useSignEvmMessage,
  useSignEvmTypedData,
  useSendEvmTransaction,
  useSignEvmTransaction,
} from "@coinbase/cdp-hooks";
import { CDPSigner } from "@/lib/cdp-signer";
import { useCDPProvider } from "./use-cdp-provider";

/**
 * Hook to get an ethers.js signer from the current Coinbase CDP wallet.
 * 
 * ✨ NEW APPROACH: Uses CDP's native signing hooks directly, completely bypassing
 * window.ethereum. This works even when Rabby, MetaMask, or other wallet extensions
 * are installed and active!
 * 
 * @returns A custom CDPSigner that implements the ethers.js Signer interface
 */
export const useCDPSigner = () => {
  const { evmAddress } = useEvmAddress();
  const { signEvmMessage } = useSignEvmMessage();
  const { signEvmTypedData } = useSignEvmTypedData();
  const { sendEvmTransaction } = useSendEvmTransaction();
  const { signEvmTransaction } = useSignEvmTransaction();
  const walletProvider = useCDPProvider();

  return useMemo(() => {
    if (!evmAddress) {
      console.warn("⚠️ CDP wallet not connected. Please connect first.");
      return null;
    }

    console.log("✅ CDP Signer initialized:", {
      address: evmAddress,
      addressType: evmAddress.startsWith("0x") ? "EVM" : "unknown",
      hasSignMessage: !!signEvmMessage,
      hasSignTypedData: !!signEvmTypedData,
      hasSendTransaction: !!sendEvmTransaction,
      hasSignTransaction: !!signEvmTransaction,
      hasWalletProvider: !!walletProvider,
    });
    
    // Create a provider for reading blockchain state
    // Using Base Sepolia testnet by default (you can make this dynamic based on network)
    const provider = new JsonRpcProvider("https://sepolia.base.org");
    
    const signer = new CDPSigner(
      evmAddress,
      signEvmMessage,
      signEvmTypedData,
      sendEvmTransaction,
      signEvmTransaction,
      provider,
      walletProvider // Pass wallet provider for paymaster support
    );
    
    console.log("🎉 CDP native signer ready (bypasses window.ethereum - works with any browser wallet!)");
    
    return signer;
  }, [evmAddress, signEvmMessage, signEvmTypedData, sendEvmTransaction, signEvmTransaction, walletProvider]);
};

