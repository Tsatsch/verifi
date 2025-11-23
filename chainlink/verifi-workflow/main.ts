import { cre, Runner, type Runtime, type Task } from "@chainlink/cre-sdk";
import { locate_ip } from "./tasks/locate_ip"; // import the task
import { check_two_loc } from "./tasks/check_two_loc"; // import the location checker
import { calculate_stats } from "./tasks/calculate_stats"; // import the statistics calculator
import { calculate_wifi_stats } from "./tasks/calculate_wifi_stats"; // import the Wi-Fi statistics calculator

type Config = {
  schedule: string;
};

// Single test input for validation
const testInput = {
  lat: 50.0755,
  lon: 14.4378,
  timestamp: "2025-11-22T12:23:00Z",
  ip: "8.8.8.8",
  walletAddress: "0x742d35Cc6634C0532925a3b8D8b45CCd3d3D37D2"
};

// Multiple validated inputs for statistics calculation (same structure as testInput)
const validatedInputs = [
  {
    lat: 50.0755,
    lon: 14.4378,
    timestamp: "2025-11-22T12:23:00Z",
    ip: "8.8.8.8",
    walletAddress: "0x742d35Cc6634C0532925a3b8D8b45CCd3d3D37D2",
    speed: 76.2
  },
  {
    lat: 40.7128,
    lon: -74.0060,
    timestamp: "2025-11-22T12:25:00Z",
    ip: "68.180.194.242",
    walletAddress: "0x8ba1f109551bD432803012645Hac136c22C81841",
    speed: 45.8
  },
  {
    lat: 51.5074,
    lon: -0.1278,
    timestamp: "2025-11-22T12:27:00Z",
    ip: "81.2.69.142",
    walletAddress: "0x4e83362442B8d1ceC794b18e71E44C4A4b1e6F2F",
    speed: 89.3
  },
  {
    lat: 35.6762,
    lon: 139.6503,
    timestamp: "2025-11-22T12:30:00Z",
    ip: "126.208.122.10",
    walletAddress: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    speed: 123.7
  },
  {
    lat: -33.8688,
    lon: 151.2093,
    timestamp: "2025-11-22T12:32:00Z",
    ip: "1.128.0.0",
    walletAddress: "0x2f560290FEF1B3Ada194b6aA9c40aa71f8e95598",
    speed: 92.1
  }
];

// Handler for individual location validation
const onValidationTrigger = async (runtime: Runtime<Config>): Promise<any> => {
  try {
    runtime.log(`Processing verification for wallet: ${testInput.walletAddress} at ${testInput.timestamp}`);
    runtime.log(`Claimed location: (${testInput.lat}, ${testInput.lon})`);
    
    // Get location from IP
    const ipLocation = locate_ip(runtime, { ip: testInput.ip });
    runtime.log(`IP location result: ${JSON.stringify(ipLocation, null, 2)}`);

    // Check if the two locations are within 10km of each other
    const locationCheckInput = {
      lat1: testInput.lat,
      lon1: testInput.lon,
      lat2: ipLocation.lat,
      lon2: ipLocation.lon
    };
    
    const isLocationValid = check_two_loc(runtime, locationCheckInput);
    runtime.log(`Location validation result: ${isLocationValid ? "VERIFIED" : "REJECTED"}`);

    return {
      walletAddress: testInput.walletAddress,
      timestamp: testInput.timestamp,
      claimedLocation: { lat: testInput.lat, lon: testInput.lon },
      ipLocation,
      isLocationValid,
      verificationResult: isLocationValid ? "VERIFIED" : "REJECTED"
    };
  } catch (err) {
    runtime.log(`Error in validation workflow: ${err}`);
    throw err;
  }
};

// Handler for speed statistics calculation using CRE
const onStatsTrigger = async (runtime: Runtime<Config>): Promise<any> => {
  try {
    runtime.log(`Calculating speed statistics for ${validatedInputs.length} measurements using CRE`);
    
    // Use the CRE-based calculate_stats function
    const statistics = calculate_stats(runtime, { speedData: validatedInputs });
    
    runtime.log(`Speed statistics completed: avg=${statistics.averageSpeed} Mbps, median=${statistics.medianSpeed} Mbps`);
    
    return {
      speedStatistics: true,
      inputCount: validatedInputs.length,
      statistics,
      summary: {
        averageSpeed: `${statistics.averageSpeed} Mbps`,
        medianSpeed: `${statistics.medianSpeed} Mbps`,
        speedRange: `${statistics.minSpeed} - ${statistics.maxSpeed} Mbps`
      }
    };
  } catch (err) {
    runtime.log(`Error in statistics workflow: ${err}`);
    throw err;
  }
};

// Handler for Wi-Fi statistics calculation aggregated by Wi-Fi name
// This can be triggered via HTTP or manual invocation
const onWifiStatsTrigger = async (runtime: Runtime<Config>): Promise<any> => {
  try {
    // Get data points from the trigger input
    // For HTTP triggers, this comes from the request body
    // For manual invocation, use default test data
    let dataPoints: any[] = [];
    
    try {
      // Try to get data from HTTP trigger
      const triggerData = (runtime as any).getTriggerData?.() || {};
      if (triggerData && triggerData.dataPoints && Array.isArray(triggerData.dataPoints)) {
        dataPoints = triggerData.dataPoints;
        runtime.log(`Received ${dataPoints.length} data points from HTTP trigger`);
      } else {
        // Fallback to test data for manual testing
        dataPoints = validatedInputs.map(input => ({
          wifiName: `WiFi_${input.walletAddress.slice(0, 8)}`,
          speed: input.speed,
          lat: input.lat,
          lon: input.lon,
          timestamp: input.timestamp,
          walletAddress: input.walletAddress,
          ip: input.ip
        }));
        runtime.log(`Using test data: ${dataPoints.length} data points`);
      }
    } catch (e) {
      // If trigger data access fails, use test data
      runtime.log(`Could not access trigger data, using test data: ${e}`);
      dataPoints = validatedInputs.map(input => ({
        wifiName: `WiFi_${input.walletAddress.slice(0, 8)}`,
        speed: input.speed,
        lat: input.lat,
        lon: input.lon,
        timestamp: input.timestamp,
        walletAddress: input.walletAddress,
        ip: input.ip
      }));
    }

    runtime.log(`Calculating Wi-Fi statistics for ${dataPoints.length} data points using CRE`);
    
    // Use the CRE-based calculate_wifi_stats function
    const wifiStatistics = calculate_wifi_stats(runtime, { dataPoints });
    
    runtime.log(`Wi-Fi statistics completed for ${wifiStatistics.length} networks`);
    
    return {
      success: true,
      count: wifiStatistics.length,
      statistics: wifiStatistics,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    runtime.log(`Error in Wi-Fi statistics workflow: ${err}`);
    throw err;
  }
};


const initWorkflow = (config: Config) => {
  const cron = new cre.capabilities.CronCapability();
  const http = new cre.capabilities.HTTPCapability();

  return [
    // Trigger for individual location validation
    cre.handler(
      cron.trigger(
        { schedule: config.schedule } // e.g., "0 */5 * * * *" (every 5 minutes)
      ),
      onValidationTrigger
    ),
    // Trigger for statistics calculation (separate schedule)
    cre.handler(
      cron.trigger(
        { schedule: "0 0 */6 * * *" } // Every 6 hours for statistics
      ),
      onStatsTrigger
    ),
    // HTTP trigger for Wi-Fi statistics (can be called from backend)
    cre.handler(
      http.trigger({
        path: "/api/wifi-statistics",
        method: "POST"
      }),
      onWifiStatsTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

main();