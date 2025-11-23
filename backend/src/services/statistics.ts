/**
 * Statistics service using Chainlink CRE workflow logic
 * Aggregates statistics by Wi-Fi name
 * 
 * This service attempts to use the deployed Chainlink CRE workflow via CLI.
 * If the workflow is not available, it falls back to local calculation.
 */

import { getAllWifiDataPoints, type WifiDataPoint } from "./dataStore";
import { getStatisticsViaCre } from "./creWorkflow";

interface StatsResult {
  totalInputs: number;
  averageSpeed: number;
  medianSpeed: number;
  minSpeed: number;
  maxSpeed: number;
  speedRange: number;
  speeds: number[];
}

interface WifiStatistics {
  wifiName: string;
  totalMeasurements: number;
  averageSpeed: number;
  medianSpeed: number;
  minSpeed: number;
  maxSpeed: number;
  speedRange: number;
  locations: Array<{ lat: number; lon: number }>;
  latestTimestamp: string;
}

/**
 * Calculate statistics using the same logic as Chainlink CRE workflow
 * These functions mirror the node calculations from calculate_stats.ts
 */
const calculateStats = (speeds: number[]): StatsResult => {
  if (speeds.length === 0) {
    throw new Error("No speed data available for calculation");
  }

  // Calculate average (same as calculateAverageOnNode)
  const average = speeds.reduce((acc, val) => acc + val, 0) / speeds.length;

  // Calculate median (same as calculateMedianOnNode)
  const sortedSpeeds = [...speeds].sort((a, b) => a - b);
  const mid = Math.floor(sortedSpeeds.length / 2);
  const median = sortedSpeeds.length % 2 === 0
    ? (sortedSpeeds[mid - 1] + sortedSpeeds[mid]) / 2
    : sortedSpeeds[mid];

  // Calculate min (same as calculateMinOnNode)
  const min = Math.min(...speeds);

  // Calculate max (same as calculateMaxOnNode)
  const max = Math.max(...speeds);

  const speedRange = max - min;

  return {
    totalInputs: speeds.length,
    averageSpeed: parseFloat(average.toFixed(2)),
    medianSpeed: parseFloat(median.toFixed(2)),
    minSpeed: parseFloat(min.toFixed(2)),
    maxSpeed: parseFloat(max.toFixed(2)),
    speedRange: parseFloat(speedRange.toFixed(2)),
    speeds: speeds.map(s => parseFloat(s.toFixed(2)))
  };
};

/**
 * Get statistics aggregated by Wi-Fi name using Chainlink CRE workflow
 * Attempts to use the deployed CRE workflow, falls back to local calculation if unavailable
 */
export async function getStatisticsByWifiName(): Promise<WifiStatistics[]> {
  // Fetch all data points
  const dataPoints = await getAllWifiDataPoints();

  if (dataPoints.length === 0) {
    return [];
  }

  // Try to use CRE workflow first
  try {
    // eslint-disable-next-line no-console
    console.log("[CRE] Attempting to get statistics from CRE workflow...");
    const creStatistics = await getStatisticsViaCre();
    
    if (creStatistics && creStatistics.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[CRE] Successfully retrieved statistics for ${creStatistics.length} Wi-Fi networks from CRE workflow`);
      return creStatistics;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[CRE] CRE workflow unavailable, falling back to local calculation:", error instanceof Error ? error.message : error);
  }

  // Fallback to local calculation using the same logic
  // eslint-disable-next-line no-console
  console.log("[Local] Calculating statistics locally...");

  // Group data points by Wi-Fi name
  const wifiGroups = new Map<string, WifiDataPoint[]>();
  for (const point of dataPoints) {
    const existing = wifiGroups.get(point.wifiName) || [];
    existing.push(point);
    wifiGroups.set(point.wifiName, existing);
  }

  // Calculate statistics for each Wi-Fi name
  const statistics: WifiStatistics[] = [];

  for (const [wifiName, points] of wifiGroups.entries()) {
    const speeds = points.map(p => p.speed);
    
    try {
      // eslint-disable-next-line no-console
      console.log(`[Local] Calculating statistics for ${wifiName} with ${speeds.length} measurements`);
      
      const stats = calculateStats(speeds);
      
      // Get unique locations
      const uniqueLocations = Array.from(
        new Map(
          points.map(p => [`${p.lat},${p.lon}`, { lat: p.lat, lon: p.lon }])
        ).values()
      );

      // Get latest timestamp
      const timestamps = points.map(p => new Date(p.timestamp).getTime());
      const latestTimestamp = new Date(Math.max(...timestamps)).toISOString();

      statistics.push({
        wifiName,
        totalMeasurements: stats.totalInputs,
        averageSpeed: stats.averageSpeed,
        medianSpeed: stats.medianSpeed,
        minSpeed: stats.minSpeed,
        maxSpeed: stats.maxSpeed,
        speedRange: stats.speedRange,
        locations: uniqueLocations,
        latestTimestamp
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error calculating statistics for ${wifiName}:`, error);
      // Skip this Wi-Fi if calculation fails
    }
  }

  return statistics;
}

