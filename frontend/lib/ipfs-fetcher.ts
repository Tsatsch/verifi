/**
 * IPFS data fetcher utilities
 * Fetches JSON data from IPFS using multiple gateways for redundancy
 */

export interface IPFSWifiData {
  location?: {
    lat: number
    lng: number
  }
  speed?: number
  time?: string
  wifiName?: string
  walletAddress?: string
  [key: string]: any // Allow additional fields
}

// Public IPFS gateways for decentralized access
const PUBLIC_IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://trustless-gateway.link/ipfs/',
  'https://ipfs.filebase.io/ipfs/',
]

/**
 * Fetch JSON data from IPFS using multiple gateways
 * Tries each gateway until one succeeds
 */
export async function fetchFromIPFS(cid: string): Promise<IPFSWifiData | null> {
  if (!cid || !cid.trim()) {
    console.warn('Invalid CID provided:', cid)
    return null
  }

  // Remove any protocol prefix if present
  const cleanCid = cid.replace(/^ipfs:\/\//, '').trim()

  const errors: string[] = []

  for (const gateway of PUBLIC_IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${cleanCid}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        return data as IPFSWifiData
      } else {
        errors.push(`${gateway}: HTTP ${response.status}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`${gateway}: ${errorMsg}`)
      // Continue to next gateway
    }
  }

  console.error(`Failed to fetch IPFS data for CID ${cleanCid}. Errors:`, errors)
  return null
}

/**
 * Fetch multiple IPFS CIDs in parallel with batching
 */
export async function fetchMultipleFromIPFS(
  cids: string[],
  batchSize: number = 5
): Promise<Map<string, IPFSWifiData>> {
  const results = new Map<string, IPFSWifiData>()

  // Process in batches to avoid overwhelming gateways
  for (let i = 0; i < cids.length; i += batchSize) {
    const batch = cids.slice(i, i + batchSize)
    const batchPromises = batch.map(async (cid) => {
      const data = await fetchFromIPFS(cid)
      if (data) {
        results.set(cid, data)
      }
    })

    await Promise.all(batchPromises)
  }

  return results
}

