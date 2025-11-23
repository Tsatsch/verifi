import type { SynapseSetupConfig } from 'filecoin-pin/core/synapse'

const normalizeEnvValue = (value: string | boolean | number | undefined) => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

// Hardcoded defaults (can be overridden by env vars)
const DEFAULT_WALLET_ADDRESS = '0x44f08D1beFe61255b3C3A349C392C560FA333759'
const DEFAULT_SESSION_KEY = '0xca3c92749c4c31beb64ea4334a719b813af1b54b8449a12c81d583018a252af8'

const privateKey = normalizeEnvValue(process.env.NEXT_PUBLIC_FILECOIN_PRIVATE_KEY)
const walletAddress = normalizeEnvValue(process.env.NEXT_PUBLIC_WALLET_ADDRESS) ?? DEFAULT_WALLET_ADDRESS
const sessionKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SESSION_KEY) ?? DEFAULT_SESSION_KEY

const hasStandardAuth = privateKey != null
const hasSessionKeyAuth = walletAddress != null && sessionKey != null

if (!hasStandardAuth && !hasSessionKeyAuth) {
  throw new Error(
    'Authentication required: provide either NEXT_PUBLIC_FILECOIN_PRIVATE_KEY or (NEXT_PUBLIC_WALLET_ADDRESS + NEXT_PUBLIC_SESSION_KEY)'
  )
}

if (hasStandardAuth && hasSessionKeyAuth) {
  throw new Error(
    'Conflicting authentication: provide either NEXT_PUBLIC_FILECOIN_PRIVATE_KEY or (NEXT_PUBLIC_WALLET_ADDRESS + NEXT_PUBLIC_SESSION_KEY), not both'
  )
}

export const filecoinPinConfig: SynapseSetupConfig = {
  privateKey: privateKey,
  walletAddress: walletAddress,
  sessionKey: sessionKey,
  rpcUrl: normalizeEnvValue(process.env.NEXT_PUBLIC_FILECOIN_RPC_URL),
  warmStorageAddress: normalizeEnvValue(process.env.NEXT_PUBLIC_WARM_STORAGE_ADDRESS),
}

