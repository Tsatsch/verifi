import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import { SpotVerified, SpotSubmitted, WifiRegistry } from "../generated/WifiRegistry/WifiRegistry"
import { WifiSpot } from "../generated/schema"

// Store temporary data from SpotSubmitted to match with SpotVerified
// We'll use SpotSubmitted to get the CID, then match it when SpotVerified fires
export function handleSpotSubmitted(event: SpotSubmitted): void {
  // SpotSubmitted contains the CID, but we'll create the entity in SpotVerified
  // This handler is here for completeness, but the main indexing happens in SpotVerified
}

// Main handler: SpotVerified contains all the data we need
// We read the IPFS CID from the contract's spots mapping
export function handleSpotVerified(event: SpotVerified): void {
  let spotId = event.params.spotId
  let entityId = spotId.toHexString()
  
  // Check if entity already exists (shouldn't, but safety check)
  let entity = WifiSpot.load(entityId)
  if (entity == null) {
    entity = new WifiSpot(entityId)
  }
  
  entity.spotId = spotId
  entity.submitter = event.params.submitter
  entity.verificationScore = event.params.score
  entity.lat = event.params.lat
  entity.long = event.params.long
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  // Read IPFS CID from the contract's spots mapping
  // The Graph generates struct returns as value0, value1, value2, etc.
  let contract = WifiRegistry.bind(event.address)
  let spotData = contract.spots(spotId)
  // Struct fields: value0 = ipfsCid (string), value1 = verificationScore (uint256), value2 = submitter (address)
  entity.ipfsCid = spotData.value0
  
  entity.save()
  
  // Note: IPFS data fetching happens in the frontend
  // The subgraph stores the CID, and the frontend fetches the actual JSON data from IPFS
}

