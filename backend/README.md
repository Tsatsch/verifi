## Veri-Fi Backend

### Overview

This directory contains the **Node.js / TypeScript** backend for Veri-Fi, implemented with **Express**.
It exposes a simple health check and example API endpoint that the Next.js frontend can call.
The backend integrates with **Chainlink CRE workflows** to calculate Wi-Fi statistics using decentralized consensus.

### Tech stack

- **Runtime**: Node.js 22
- **Language**: TypeScript
- **Framework**: Express
- **Chainlink CRE**: For decentralized statistics calculation

### Endpoints

- `GET /health` – basic health check, returns service status and timestamp.
- `GET /api/example` – example JSON payload (`{ message: "Hello from Veri-Fi backend" }`).
- `GET /api/statistics` – returns Wi-Fi statistics aggregated by Wi-Fi name, computed using Chainlink CRE workflow.

### Getting started (local, without Docker)

From the repo root:

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:4000`.

### Production build

```bash
cd backend
npm install
npm run build
npm run start
```

### Environment Variables

The backend supports the following environment variables:

- **PORT**: `4000` (default) – Port on which the backend server listens
- **CRE_TARGET**: `staging-settings` (default) – Chainlink CRE workflow target (staging-settings or production-settings)

Example `.env` file:
```bash
PORT=4000
CRE_TARGET=staging-settings
```

### Data Source

The backend fetches Wi-Fi measurement data from **Filecoin/IPFS** by downloading CAR (Content Addressed Archive) files from the provided IPFS gateways. The data is stored on Filecoin and accessed via IPFS gateways.

#### Data Format

Each CAR file contains a JSON object with the following structure:

```json
{
  "location": {
    "lat": 50.0755,
    "lng": 14.4378
  },
  "speed": 76.2,
  "time": "2025-11-22T12:23:00Z",
  "wifiName": "CoffeeShop_WiFi",
  "walletAddress": "0x742d35Cc6634C0532925a3b8D8b45CCd3d3D37D2"
}
```

#### CAR File Parsing

The backend automatically:
- Downloads CAR files from IPFS gateways (8 data sources currently configured)
- Extracts JSON data from CAR files, ignoring metadata headers
- Handles UTF-8 and binary content encoding
- Validates extracted data matches the expected format
- Converts Filecoin data format to internal `WifiDataPoint` format

#### Error Handling

If a CAR file download or parsing fails:
- The error is logged to the console
- The failed data point is skipped
- Processing continues with remaining data points
- An empty array is returned if all downloads fail (statistics endpoint will return empty results)

### Chainlink CRE Workflow Integration

The backend uses Chainlink CRE workflows to calculate statistics with decentralized consensus. 

#### Prerequisites

1. **Install CRE CLI** (if not already installed):
   ```bash
   curl -L -o cre_linux_amd64.tar.gz \
   https://github.com/smartcontractkit/cre-cli/releases/download/v1.0.2/cre_linux_amd64.tar.gz
   
   tar -xzf cre_linux_amd64.tar.gz
   mv cre_v1.0.2_linux_amd64 cre
   chmod +x cre
   sudo mv cre /usr/local/bin/
   ```

2. **Authenticate with CRE**:
   ```bash
   cre login
   ```

3. **Configure environment** (in `chainlink/.env`):
   ```bash
   CRE_ETH_PRIVATE_KEY=your_private_key_here
   CRE_TARGET=staging-settings  # or production-settings
   ```

#### Deploying the Workflow

1. **Navigate to chainlink directory**:
   ```bash
   cd ../chainlink
   ```

2. **Test locally with simulation** (optional, for testing):
   ```bash
   cre workflow simulate verifi-workflow
   ```

3. **Deploy to staging**:
   ```bash
   cre workflow deploy verifi-workflow --target staging-settings
   ```

4. **Activate the workflow**:
   ```bash
   cre workflow activate verifi-workflow-staging
   ```

5. **Deploy to production** (when ready):
   ```bash
   cre workflow deploy verifi-workflow --target production-settings
   cre workflow activate verifi-workflow-production
   ```

#### Workflow Endpoints

The deployed workflow exposes an HTTP trigger endpoint:
- **Path**: `/api/wifi-statistics`
- **Method**: `POST`
- **Purpose**: Calculate Wi-Fi statistics aggregated by Wi-Fi name

The backend automatically uses this endpoint when triggering the workflow via CRE CLI.

#### How It Works

When the backend receives a `GET /api/statistics` request:

1. **Fetches data from Filecoin**: Downloads all CAR files from IPFS gateways and extracts JSON data
2. **Attempts CRE workflow**: Tries to trigger the deployed CRE workflow via CLI with the data points
3. **CRE processing**: The CRE workflow calculates statistics using decentralized consensus across Chainlink nodes
4. **Fallback mechanism**: If CRE workflow is unavailable (not deployed, CLI not installed, or trigger fails), falls back to local calculation using the same mathematical functions
5. **Returns results**: Statistics aggregated by Wi-Fi name with average, median, min, max, and speed range

#### API Endpoints

##### `GET /api/statistics`

Returns Wi-Fi statistics aggregated by Wi-Fi name.

**Response Format (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "wifiName": "CoffeeShop_WiFi",
      "totalMeasurements": 2,
      "averageSpeed": 79.35,
      "medianSpeed": 79.35,
      "minSpeed": 76.2,
      "maxSpeed": 82.5,
      "speedRange": 6.3,
      "locations": [{ "lat": 50.0755, "lon": 14.4378 }],
      "latestTimestamp": "2025-11-22T13:15:00Z"
    }
  ],
  "count": 5,
  "timestamp": "2025-11-22T12:00:00Z"
}
```

**Response Format (Error)**:
```json
{
  "success": false,
  "error": "Failed to fetch statistics",
  "message": "Error details here"
}
```

**Status Codes**:
- `200 OK` – Success
- `500 Internal Server Error` – Error occurred during processing

**Statistics Fields**:
- `wifiName`: Name of the Wi-Fi network
- `totalMeasurements`: Number of speed measurements for this network
- `averageSpeed`: Average speed in Mbps (calculated with CRE consensus)
- `medianSpeed`: Median speed in Mbps (calculated with CRE consensus)
- `minSpeed`: Minimum speed in Mbps
- `maxSpeed`: Maximum speed in Mbps
- `speedRange`: Difference between max and min speed
- `locations`: Array of unique locations where this network was measured
- `latestTimestamp`: Most recent measurement timestamp

### Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Main Express server entry point
│   └── services/
│       ├── dataStore.ts         # Data fetching from Filecoin/IPFS
│       ├── filecoinData.ts      # CAR file download and parsing
│       ├── statistics.ts        # Statistics calculation (CRE + fallback)
│       └── creWorkflow.ts       # Chainlink CRE workflow integration
├── dist/                        # Compiled JavaScript output
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

### Dependencies

**Production Dependencies**:
- `express` – Web framework
- `cors` – Cross-origin resource sharing
- `morgan` – HTTP request logger
- `@chainlink/cre-sdk` – Chainlink CRE SDK (for workflow integration)

**Development Dependencies**:
- `typescript` – TypeScript compiler
- `tsx` – TypeScript execution for development
- `@types/*` – TypeScript type definitions

### Testing

To test the backend locally:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the health endpoint**:
   ```bash
   curl http://localhost:4000/health
   ```

3. **Test the statistics endpoint**:
   ```bash
   curl http://localhost:4000/api/statistics
   ```

4. **Test with CRE workflow** (requires CRE CLI installed and workflow deployed):
   ```bash
   # Set environment variable
   export CRE_TARGET=staging-settings
   
   # Start server
   npm run dev
   
   # Test endpoint
   curl http://localhost:4000/api/statistics
   ```

### Troubleshooting

#### CRE Workflow Not Available

If you see warnings about CRE workflow being unavailable:
- **Check CRE CLI installation**: Run `cre --version` to verify
- **Check workflow deployment**: Ensure workflow is deployed and activated
- **Check environment**: Verify `CRE_TARGET` environment variable is set correctly
- **Fallback behavior**: The backend will automatically use local calculation if CRE is unavailable

#### Filecoin Data Download Failures

If data downloads fail:
- **Check network connectivity**: Ensure IPFS gateways are accessible
- **Check logs**: Look for specific error messages in console output
- **Verify URLs**: Ensure IPFS gateway URLs in `filecoinData.ts` are correct
- **Partial failures**: The backend continues processing even if some downloads fail

#### Port Already in Use

If port 4000 is already in use:
```bash
# Use a different port
PORT=4001 npm run dev
```

### Development

**Watch mode** (auto-reload on file changes):
```bash
npm run dev
```

**Build for production**:
```bash
npm run build
```

**Run production build**:
```bash
npm run start
```

### Additional Resources

- [Chainlink CRE Documentation](https://docs.chain.link/cre/getting-started/part-1-project-setup-ts)
- [Filecoin Documentation](https://docs.filecoin.io/)
- [IPFS Documentation](https://docs.ipfs.tech/)
