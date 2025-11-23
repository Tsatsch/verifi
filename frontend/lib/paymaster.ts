/**
 * Paymaster utilities for Coinbase CDP sponsored transactions
 */

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "testnet";
const BASE_SEPOLIA_CHAIN_ID = 84532; // Base Sepolia testnet
const BASE_MAINNET_CHAIN_ID = 8453; // Base mainnet

const CHAIN_ID = NETWORK === "mainnet" ? BASE_MAINNET_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID;

/**
 * Get paymaster service URL from environment variables
 */
export function getPaymasterUrl(): string | undefined {
  if (NETWORK === "mainnet") {
    return process.env.NEXT_PUBLIC_PAYMASTER_ENDPOINT_MAINNET;
  }
  return process.env.NEXT_PUBLIC_PAYMASTER_ENDPOINT_TESTNET;
}

/**
 * Check if paymaster is configured
 */
export function isPaymasterConfigured(): boolean {
  return !!getPaymasterUrl();
}

/**
 * Convert number to hex string (for chainId)
 */
function numberToHex(value: number): string {
  return `0x${value.toString(16)}`;
}

/**
 * Send a sponsored transaction using paymaster service via wallet_sendCalls
 * This is used when we have direct access to the wallet provider
 * 
 * @param provider - The EIP-1193 provider from wallet
 * @param fromAddress - The sender's address
 * @param transaction - The transaction object (to, value, data, etc.)
 * @returns The transaction hash
 */
export async function sendSponsoredTransactionViaProvider(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any,
  fromAddress: string,
  transaction: {
    to?: string;
    value?: bigint | string;
    data?: string;
    gasLimit?: bigint | string;
    maxFeePerGas?: bigint | string;
    maxPriorityFeePerGas?: bigint | string;
  }
): Promise<string> {
  const paymasterServiceUrl = getPaymasterUrl();
  
  console.log("🔧 Paymaster Debug Info:");
  console.log("- Paymaster URL:", paymasterServiceUrl ? "✅ Configured" : "❌ Not configured");
  console.log("- From Address:", fromAddress);
  console.log("- Transaction:", transaction);
  console.log("- Is Sponsored:", "✅ true");
  
  if (!paymasterServiceUrl) {
    throw new Error("Paymaster service URL not configured. Please set NEXT_PUBLIC_PAYMASTER_ENDPOINT_TESTNET or NEXT_PUBLIC_PAYMASTER_ENDPOINT_MAINNET");
  }

  // Prepare the transaction call
  const calls = [
    {
      to: transaction.to || "0x",
      value: transaction.value ? (typeof transaction.value === 'bigint' ? `0x${transaction.value.toString(16)}` : transaction.value) : '0x0',
      data: transaction.data || "0x",
    }
  ];

  const walletSendCallsParams = {
    version: '1.0',
    chainId: numberToHex(CHAIN_ID),
    from: fromAddress,
    calls,
    isSponsored: true,
    capabilities: {
      paymasterService: {
        url: paymasterServiceUrl
      }
    }
  };

  console.log("- Wallet SendCalls Params:", JSON.stringify(walletSendCallsParams, null, 2));

  try {
    // Send the transaction with paymaster capabilities
    console.log("🚀 Sending sponsored transaction...");
    const result = await provider.request({
      method: 'wallet_sendCalls',
      params: [walletSendCallsParams]
    });

    console.log("✅ Sponsored transaction successful:", result);
    
    // wallet_sendCalls returns an object with batchId and txHashes
    // We need to extract the first transaction hash
    if (result && result.txHashes && result.txHashes.length > 0) {
      return result.txHashes[0];
    } else if (typeof result === 'string') {
      // Some implementations might return the hash directly
      return result;
    } else {
      throw new Error("Unexpected response format from wallet_sendCalls");
    }
  } catch (error) {
    console.error("Paymaster transaction failed:", error);
    
    // Check if this is a user cancellation
    const errorMessage = (error as Error)?.message?.toLowerCase() || '';
    const errorCode = (error as { code?: number | string })?.code;
    const isUserCancellation = errorMessage.includes('user rejected') || 
                               errorMessage.includes('user denied') || 
                               errorMessage.includes('cancelled') ||
                               errorMessage.includes('rejected') ||
                               errorCode === 4001 ||
                               errorCode === 'ACTION_REJECTED';
    
    if (isUserCancellation) {
      console.log("👤 User cancelled sponsored transaction");
      throw new Error('USER_CANCELLED');
    }
    
    throw error;
  }
}

/**
 * Check if the wallet supports paymaster service
 * @param provider - The EIP-1193 provider from wallet
 * @param address - The user's address
 * @returns Whether paymaster is supported
 */
export async function checkPaymasterSupport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any,
  address: string
): Promise<boolean> {
  try {
    const capabilities = await provider.request({
      method: 'wallet_getCapabilities',
      params: [address]
    });

    const chainCapabilities = capabilities[CHAIN_ID];
    return chainCapabilities?.paymasterService?.supported || false;
  } catch (error) {
    console.error('Failed to check paymaster capabilities:', error);
    return false;
  }
}

