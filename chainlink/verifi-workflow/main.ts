import { cre, Runner, type Runtime, type Task } from "@chainlink/cre-sdk";
import { locate_ip } from "./tasks/locate_ip"; // import the task
import { check_two_loc } from "./tasks/check_two_loc"; // import the location checker

type Config = {
  schedule: string;
};

// Example test input (you can also load from a file or runtime input)
const testInput = {
  location: "Prague, CZ",
  lat: 50.0755,
  lon: 14.4378,
  download: 76.2,
  upload: 13.4,
  timestamp: "2025-11-22T12:23:00Z",
  ip: "8.8.8.8"
};

const onCronTrigger = async (runtime: Runtime<Config>): Promise<any> => {
  try {
    // Get location from IP
    const ipLocation = locate_ip(runtime, testInput as any);
    runtime.log(`IP location result: ${JSON.stringify(ipLocation, null, 2)}`);

    // Check if the two locations are within 10km of each other
    const locationCheckInput = {
      lat1: testInput.lat,
      lon1: testInput.lon,
      lat2: ipLocation.lat,
      lon2: ipLocation.lon
    };
    
    const isLocationValid = check_two_loc(runtime, locationCheckInput);
    runtime.log(`Location validation result: ${isLocationValid}`);

    return {
      ipLocation,
      originalLocation: { lat: testInput.lat, lon: testInput.lon },
      isLocationValid
    };
  } catch (err) {
    runtime.log(`Error in workflow: ${err}`);
    throw err;
  }
};

const initWorkflow = (config: Config) => {
  const cron = new cre.capabilities.CronCapability();

  return [
    cre.handler(
      cron.trigger(
        { schedule: config.schedule } 
      ),
      onCronTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

main();