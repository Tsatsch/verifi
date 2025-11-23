/**
 * Data store service for fetching Wi-Fi measurement data points
 * Fetches data from Filecoin/IPFS CAR files
 */

import { fetchAllFilecoinDataPoints, type FilecoinDataPoint } from "./filecoinData";

export interface WifiDataPoint {
  wifiName: string;
  speed: number;
  lat: number;
  lon: number;
  timestamp: string;
  walletAddress: string;
  ip?: string;
}

/**
 * Convert Filecoin data point format to WifiDataPoint format
 */
function convertFilecoinToWifiDataPoint(filecoinPoint: FilecoinDataPoint): WifiDataPoint {
  return {
    wifiName: filecoinPoint.wifiName,
    speed: filecoinPoint.speed,
    lat: filecoinPoint.location.lat,
    lon: filecoinPoint.location.lng,
    timestamp: filecoinPoint.time,
    walletAddress: filecoinPoint.walletAddress,
    // IP is not in the Filecoin data format, so it's optional
  };
}

/**
 * Fetches all available Wi-Fi data points from Filecoin/IPFS
 * Downloads CAR files and extracts JSON data
 */
export async function getAllWifiDataPoints(): Promise<WifiDataPoint[]> {
  try {
    // Fetch all data points from Filecoin
    const filecoinDataPoints = await fetchAllFilecoinDataPoints();
    
    // Convert to WifiDataPoint format
    const wifiDataPoints = filecoinDataPoints.map(convertFilecoinToWifiDataPoint);
    
    // eslint-disable-next-line no-console
    console.log(`Fetched ${wifiDataPoints.length} Wi-Fi data points from Filecoin`);
    
    return wifiDataPoints;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching data from Filecoin:", error);
    
    // Return empty array on error - the caller can handle this
    // In production, you might want to cache previous results or use a fallback
    return [];
  }
}

