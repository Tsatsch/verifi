import { AbstractSigner, Provider, TransactionRequest, TypedDataDomain, TypedDataField } from "ethers";
import { isPaymasterConfigured, sendSponsoredTransactionViaProvider } from "./paymaster";

/**
 * Recursively converts BigInt values to strings in an object
 * This is needed because CDP's API doesn't support BigInt serialization
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = serializeBigInt(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Custom ethers.js Signer that uses Coinbase CDP's native signing hooks.
 * 
 * This bypasses window.ethereum entirely, so it works even when browser
 * wallet extensions like Rabby or MetaMask are installed.
 * 
 * IMPORTANT: This signer must be created inside a React component that has
 * access to CDP hooks. See `useCDPSigner` hook for proper usage.
 */
export class CDPSigner extends AbstractSigner {
  private _signMessageFn: (options: any) => Promise<any>;
  private _signTypedDataFn: (options: any) => Promise<any>;
  private _sendTransactionFn: (options: any) => Promise<any>;
  private _signTransactionFn: (options: any) => Promise<any>;
  private _address: string;
  private _walletProvider?: any; // Optional wallet provider for paymaster support

  constructor(
    address: string,
    signMessageFn: (options: any) => Promise<any>,
    signTypedDataFn: (options: any) => Promise<any>,
    sendTransactionFn: (options: any) => Promise<any>,
    signTransactionFn: (options: any) => Promise<any>,
    provider?: Provider,
    walletProvider?: any // Optional wallet provider for paymaster support
  ) {
    super(provider);
    this._address = address;
    this._signMessageFn = signMessageFn;
    this._signTypedDataFn = signTypedDataFn;
    this._sendTransactionFn = sendTransactionFn;
    this._signTransactionFn = signTransactionFn;
    this._walletProvider = walletProvider;
  }

  async getAddress(): Promise<string> {
    return this._address;
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    const messageString = typeof message === "string" ? message : new TextDecoder().decode(message);
    
    console.log("🔏 CDP Signer - Signing message:", {
      address: this._address,
      messageLength: messageString.length,
      messagePreview: messageString.slice(0, 50) + "...",
    });
    
    const result = await this._signMessageFn({
      evmAccount: this._address,  // CDP uses 'evmAccount' not 'address'
      message: messageString,
    });
    
    console.log("✅ CDP Signer - Message signed:", {
      signatureLength: result.signature?.length,
      signaturePreview: result.signature?.slice(0, 20) + "...",
    });
    
    return result.signature;
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    const result = await this._signTransactionFn({
      evmAccount: this._address,  // CDP uses 'evmAccount'
      transaction,
    });
    
    return result.signedTransaction;
  }

  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    // CDP expects the typedData in a specific EIP-712 format
    // Convert any BigInt values to strings to avoid JSON serialization errors
    const serializedDomain = serializeBigInt(domain);
    const serializedTypes = serializeBigInt(types);
    const serializedValue = serializeBigInt(value);
    
    const primaryType = Object.keys(types).find(key => key !== 'EIP712Domain') || 'Message';
    
    console.log("🔏 CDP Signer - Signing typed data:", {
      address: this._address,
      primaryType,
      domainName: serializedDomain.name,
      domainChainId: serializedDomain.chainId,
    });
    
    // CDP expects typedData as an OBJECT, not a JSON string
    const typedDataObject = {
      domain: serializedDomain,
      types: serializedTypes,
      primaryType,
      message: serializedValue,
    };
    
    // CDP uses 'evmAccount' parameter name, not 'address'
    const options = {
      evmAccount: this._address,  // Changed from 'address' to 'evmAccount'
      typedData: typedDataObject,
    };
    
    console.log('🔏 CDP Signer - Signing with typedData:', {
      evmAccount: this._address,
      typedDataKeys: Object.keys(typedDataObject),
      domainChainId: serializedDomain.chainId,
    });
    
    // Add error handling to catch account not found errors
    try {
      const result = await this._signTypedDataFn(options);
      
      console.log("✅ CDP Signer - Typed data signed:", {
        signatureLength: result.signature?.length,
        signaturePreview: result.signature?.slice(0, 20) + "...",
      });
      
      return result.signature;
    } catch (error: any) {
      console.error("❌ CDP Signer - Typed data signing failed:", {
        error: error.message,
        evmAccount: this._address,
        errorStack: error.stack,
      });
      
      // If account not found, provide helpful error message
      if (error.message?.includes("account not found") || error.message?.includes("EVM account not found")) {
        throw new Error(
          `CDP wallet account not found. Please ensure:\n` +
          `1. Your wallet is fully connected\n` +
          `2. The account is initialized (smart wallets may need deployment)\n` +
          `3. You're on a supported network\n` +
          `Original error: ${error.message}`
        );
      }
      
      throw error;
    }
    
  }

  async sendTransaction(transaction: TransactionRequest): Promise<any> {
    console.log("📤 CDP Signer - Sending transaction:", {
      from: this._address,
      to: transaction.to,
      value: transaction.value?.toString(),
      chainId: transaction.chainId,
      paymasterConfigured: isPaymasterConfigured(),
      hasWalletProvider: !!this._walletProvider,
    });
    
    // Try paymaster first if configured and wallet provider is available
    if (isPaymasterConfigured() && this._walletProvider) {
      try {
        console.log("🚀 Attempting paymaster-sponsored transaction...");
        const txHash = await sendSponsoredTransactionViaProvider(
          this._walletProvider,
          this._address,
          {
            to: transaction.to,
            value: transaction.value,
            data: transaction.data,
            gasLimit: transaction.gasLimit,
            maxFeePerGas: transaction.maxFeePerGas,
            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
          }
        );
        
        console.log("✅ Paymaster transaction successful:", txHash);
        
        // Return a transaction response-like object
        return {
          hash: txHash,
          from: this._address,
          to: transaction.to,
          value: transaction.value,
          data: transaction.data,
          chainId: transaction.chainId,
          wait: async (confirmations?: number) => {
            // CDP handles confirmation internally
            return {
              transactionHash: txHash,
              from: this._address,
              to: transaction.to,
              status: 1,
            };
          },
        };
      } catch (paymasterError: any) {
        // Check if user cancelled
        if (paymasterError?.message === 'USER_CANCELLED') {
          throw paymasterError;
        }
        
        // Log error but fall through to regular transaction
        console.warn("⚠️ Paymaster transaction failed, falling back to regular transaction:", paymasterError);
      }
    }
    
    // Fall back to regular transaction (or use if paymaster not configured)
    console.log("📤 Using regular CDP transaction...");
    
    // Serialize the transaction to handle BigInt values
    const serializedTransaction = serializeBigInt({
      to: transaction.to,
      value: transaction.value,
      data: transaction.data,
      chainId: transaction.chainId,
      gasLimit: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
      nonce: transaction.nonce,
      type: transaction.type || "eip1559",
    });
    
    const result = await this._sendTransactionFn({
      evmAccount: this._address,  // CDP uses 'evmAccount'
      transaction: serializedTransaction,
    });
    
    console.log("✅ CDP Signer - Transaction sent:", {
      hash: result.transactionHash,
    });
    
    // Return a transaction response-like object
    return {
      hash: result.transactionHash,
      from: this._address,
      to: transaction.to,
      value: transaction.value,
      data: transaction.data,
      chainId: transaction.chainId,
      wait: async (confirmations?: number) => {
        // CDP handles confirmation internally
        return {
          transactionHash: result.transactionHash,
          from: this._address,
          to: transaction.to,
          status: 1,
        };
      },
    };
  }

  connect(provider: Provider): CDPSigner {
    return new CDPSigner(
      this._address,
      this._signMessageFn,
      this._signTypedDataFn,
      this._sendTransactionFn,
      this._signTransactionFn,
      provider,
      this._walletProvider
    );
  }
}

