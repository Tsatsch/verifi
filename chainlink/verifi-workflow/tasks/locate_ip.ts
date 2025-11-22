import { cre, consensusMedianAggregation, type NodeRuntime, type Runtime } from "@chainlink/cre-sdk";

//tiemsatp wifiname location  speed  wallet adress

// Function to fetch IP info using CRE HTTPClient
// This runs on each node independently
const fetchIpInfo = (nodeRuntime: NodeRuntime<any>, ip: string) => {
  const httpClient = new cre.capabilities.HTTPClient();
  const TOKEN = "efba7f7e94d32a";
  
  const req = {
    url: `https://ipinfo.io/${ip}/json?token=${TOKEN}`,
    method: "GET" as const,
  };
  
  // Send the request using CRE HTTPClient
  const resp = httpClient.sendRequest(nodeRuntime, req).result();
  
  // Parse the JSON response
  const bodyText = new TextDecoder().decode(resp.body);
  const ipInfo = JSON.parse(bodyText);
  
  return ipInfo;
};

// Main task function that extracts location coordinates
export const locate_ip = (runtime: Runtime<any>, input: any) => {
  const { ip } = input;

  if (!ip) {
    throw new Error("Missing required IP address");
  }

  runtime.log("Starting IP lookup");
  
  // Use runInNodeMode to fetch IP info with consensus
  // Since IP info for a specific IP should be deterministic, we use consensus to ensure reliability
  const ipInfo = runtime.runInNodeMode(
    (nodeRuntime: NodeRuntime<any>) => fetchIpInfo(nodeRuntime, ip),
    consensusMedianAggregation()
  )().result();

  runtime.log(`IP lookup completed for ${ip}`);
  
  // Extract location coordinates from the loc field (format: "lat,lon")
  if (ipInfo.loc) {
    const [lat, lon] = ipInfo.loc.split(',').map(Number);
    return { lat, lon };
  } else {
    throw new Error("Location information not available for this IP");
  }
};