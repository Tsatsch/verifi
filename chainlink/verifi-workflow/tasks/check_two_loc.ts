import { cre, consensusMedianAggregation, type NodeRuntime, type Runtime } from "@chainlink/cre-sdk";

// Function to calculate distance between two coordinates using Haversine formula
// This runs on each node independently - returns just the distance for consensus
const calculateDistanceOnNode = (nodeRuntime: NodeRuntime<any>, lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  // Return just the distance for median consensus
  return distance;
};

// Main function to check if two locations are within 10km of each other using consensus
export const check_two_loc = (runtime: Runtime<any>, input: any) => {
  const { lat1, lon1, lat2, lon2 } = input;

  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    throw new Error("Missing required coordinates: lat1, lon1, lat2, lon2");
  }

  runtime.log(`Checking distance between (${lat1}, ${lon1}) and (${lat2}, ${lon2}) on nodes`);
  
  // Use runInNodeMode to calculate distance with consensus across nodes
  const consensusDistance = runtime.runInNodeMode(
    (nodeRuntime: NodeRuntime<any>) => calculateDistanceOnNode(nodeRuntime, lat1, lon1, lat2, lon2),
    consensusMedianAggregation()
  )().result();

  runtime.log(`Consensus distance calculated: ${consensusDistance.toFixed(2)} km`);
  
  const isWithin10km = consensusDistance <= 10;
  runtime.log(`Within 10km: ${isWithin10km}`);
  
  return isWithin10km;
};
