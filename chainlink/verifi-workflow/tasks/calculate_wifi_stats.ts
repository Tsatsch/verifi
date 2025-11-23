import { cre, consensusMedianAggregation, type NodeRuntime, type Runtime } from "@chainlink/cre-sdk";

interface WifiDataPoint {
  wifiName: string;
  speed: number;
  lat: number;
  lon: number;
  timestamp: string;
  walletAddress: string;
  ip?: string;
}

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

// Function to calculate average speed on each node
const calculateAverageOnNode = (nodeRuntime: NodeRuntime<any>, speeds: number[]) => {
  if (speeds.length === 0) return 0;
  const sum = speeds.reduce((acc, val) => acc + val, 0);
  return sum / speeds.length;
};

// Function to calculate median speed on each node
const calculateMedianOnNode = (nodeRuntime: NodeRuntime<any>, speeds: number[]) => {
  if (speeds.length === 0) return 0;
  const sortedSpeeds = [...speeds].sort((a, b) => a - b);
  const mid = Math.floor(sortedSpeeds.length / 2);
  return sortedSpeeds.length % 2 === 0
    ? (sortedSpeeds[mid - 1] + sortedSpeeds[mid]) / 2
    : sortedSpeeds[mid];
};

// Function to calculate min speed on each node
const calculateMinOnNode = (nodeRuntime: NodeRuntime<any>, speeds: number[]) => {
  if (speeds.length === 0) return 0;
  return Math.min(...speeds);
};

// Function to calculate max speed on each node
const calculateMaxOnNode = (nodeRuntime: NodeRuntime<any>, speeds: number[]) => {
  if (speeds.length === 0) return 0;
  return Math.max(...speeds);
};

// Calculate statistics for a single Wi-Fi using CRE consensus
const calculateStatsForWifi = (runtime: Runtime<any>, speeds: number[]): StatsResult => {
  if (speeds.length === 0) {
    throw new Error("No speed data available for calculation");
  }

  runtime.log(`Calculating statistics for ${speeds.length} speed measurements using CRE`);

  // Calculate average using consensus across nodes
  const consensusAverage = runtime.runInNodeMode(
    (nodeRuntime: NodeRuntime<any>) => calculateAverageOnNode(nodeRuntime, speeds),
    consensusMedianAggregation()
  )().result();

  // Calculate median using consensus across nodes
  const consensusMedian = runtime.runInNodeMode(
    (nodeRuntime: NodeRuntime<any>) => calculateMedianOnNode(nodeRuntime, speeds),
    consensusMedianAggregation()
  )().result();

  // Calculate min using consensus across nodes
  const consensusMin = runtime.runInNodeMode(
    (nodeRuntime: NodeRuntime<any>) => calculateMinOnNode(nodeRuntime, speeds),
    consensusMedianAggregation()
  )().result();

  // Calculate max using consensus across nodes
  const consensusMax = runtime.runInNodeMode(
    (nodeRuntime: NodeRuntime<any>) => calculateMaxOnNode(nodeRuntime, speeds),
    consensusMedianAggregation()
  )().result();

  const speedRange = consensusMax - consensusMin;

  return {
    totalInputs: speeds.length,
    averageSpeed: parseFloat(consensusAverage.toFixed(2)),
    medianSpeed: parseFloat(consensusMedian.toFixed(2)),
    minSpeed: parseFloat(consensusMin.toFixed(2)),
    maxSpeed: parseFloat(consensusMax.toFixed(2)),
    speedRange: parseFloat(speedRange.toFixed(2)),
    speeds: speeds.map(s => parseFloat(s.toFixed(2)))
  };
};

/**
 * Calculate statistics aggregated by Wi-Fi name using CRE
 */
export const calculate_wifi_stats = (runtime: Runtime<any>, input: { dataPoints: WifiDataPoint[] }): WifiStatistics[] => {
  const { dataPoints } = input;
  
  if (!dataPoints || dataPoints.length === 0) {
    throw new Error("No data points provided for statistics calculation");
  }
  
  runtime.log(`Calculating Wi-Fi statistics for ${dataPoints.length} data points using CRE`);

  // Group data points by Wi-Fi name
  const wifiGroups = new Map<string, WifiDataPoint[]>();
  for (const point of dataPoints) {
    const existing = wifiGroups.get(point.wifiName) || [];
    existing.push(point);
    wifiGroups.set(point.wifiName, existing);
  }

  runtime.log(`Found ${wifiGroups.size} unique Wi-Fi networks`);

  // Calculate statistics for each Wi-Fi name
  const statistics: WifiStatistics[] = [];

  for (const [wifiName, points] of wifiGroups.entries()) {
    const speeds = points.map(p => p.speed);
    
    try {
      runtime.log(`Processing ${wifiName} with ${speeds.length} measurements`);
      
      const stats = calculateStatsForWifi(runtime, speeds);
      
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

      runtime.log(`Completed ${wifiName}: avg=${stats.averageSpeed} Mbps, median=${stats.medianSpeed} Mbps`);
    } catch (error) {
      runtime.log(`Error calculating statistics for ${wifiName}: ${error}`);
      // Continue with other Wi-Fi networks
    }
  }

  runtime.log(`Successfully calculated statistics for ${statistics.length} Wi-Fi networks`);
  
  return statistics;
};

