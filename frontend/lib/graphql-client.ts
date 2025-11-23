/**
 * GraphQL client for querying The Graph subgraph
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPH_ENDPOINT || ''

export interface WifiSpot {
  id: string
  spotId: string
  submitter: string
  ipfsCid: string
  verificationScore: string
  lat: string
  long: string
  blockTimestamp: string
}

export interface GraphQLResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}

export interface WifiSpotsQueryResult {
  wifiSpots: WifiSpot[]
}

/**
 * Query all verified WiFi spots from The Graph
 */
export async function queryWifiSpots(
  first: number = 1000,
  where?: {
    verificationScore_gte?: number
    lat_gte?: string
    lat_lte?: string
    long_gte?: string
    long_lte?: string
  }
): Promise<WifiSpot[]> {
  if (!GRAPHQL_ENDPOINT) {
    console.warn('GraphQL endpoint not configured. Set NEXT_PUBLIC_GRAPH_ENDPOINT')
    return []
  }

  // Build where filter object
  const whereFilter: Record<string, string> = {}
  if (where?.verificationScore_gte !== undefined) {
    whereFilter.verificationScore_gte = where.verificationScore_gte.toString()
  }
  if (where?.lat_gte) whereFilter.lat_gte = where.lat_gte
  if (where?.lat_lte) whereFilter.lat_lte = where.lat_lte
  if (where?.long_gte) whereFilter.long_gte = where.long_gte
  if (where?.long_lte) whereFilter.long_lte = where.long_lte

  const query = `
    query GetWifiSpots($first: Int!, $where: WifiSpot_filter) {
      wifiSpots(
        first: $first
        where: $where
        orderBy: blockTimestamp
        orderDirection: desc
      ) {
        id
        spotId
        submitter
        ipfsCid
        verificationScore
        lat
        long
        blockTimestamp
      }
    }
  `

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { 
          first,
          where: Object.keys(whereFilter).length > 0 ? whereFilter : null,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.statusText}`)
    }

    const result: GraphQLResponse<WifiSpotsQueryResult> = await response.json()

    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      throw new Error(result.errors.map((e) => e.message).join(', '))
    }

    return result.data?.wifiSpots || []
  } catch (error) {
    console.error('Failed to query WiFi spots:', error)
    return []
  }
}

/**
 * Query WiFi spots by geographic bounds
 */
export async function queryWifiSpotsByBounds(
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
): Promise<WifiSpot[]> {
  // Convert lat/lng to the format used in the contract (multiplied by 1e6)
  const latGte = Math.floor(bounds.south * 1e6).toString()
  const latLte = Math.ceil(bounds.north * 1e6).toString()
  const longGte = Math.floor(bounds.west * 1e6).toString()
  const longLte = Math.ceil(bounds.east * 1e6).toString()

  return queryWifiSpots(1000, {
    lat_gte: latGte,
    lat_lte: latLte,
    long_gte: longGte,
    long_lte: longLte,
  })
}

