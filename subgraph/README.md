# Veri-Fi Subgraph

This subgraph indexes WiFi spot verification events from the WifiRegistry contract on Base Sepolia.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Generate ABI from contract:
```bash
# You'll need to compile the contract and copy the ABI
# Place it in ./abis/WifiRegistry.json
```

3. Generate code:
```bash
npm run codegen
```

4. Build:
```bash
npm run build
```

5. Deploy to The Graph Studio:
```bash
npm run deploy
```

## Contract Details

- **Network**: Base Sepolia
- **Contract Address**: `0x15405de75e94ce71ef3a19cde0b0ae784319217d`
- **Events Indexed**:
  - `SpotSubmitted`: When a spot is first submitted
  - `SpotVerified`: When a spot is verified by Chainlink

## Schema

The subgraph indexes:
- `WifiSpot`: Contains spotId, submitter, verification score, coordinates, and IPFS CID
- IPFS data is fetched in the frontend, not in the subgraph

## Querying

Once deployed, you can query the subgraph using GraphQL:

```graphql
{
  wifiSpots(first: 100, where: { verificationScore_gte: 100 }) {
    id
    spotId
    submitter
    ipfsCid
    lat
    long
    verificationScore
    blockTimestamp
  }
}
```

