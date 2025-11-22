# Veri-Fi Chainlink Workflow


###  Install

```bash
curl -L -o cre_linux_amd64.tar.gz \
https://github.com/smartcontractkit/cre-cli/releases/download/v1.0.2/cre_linux_amd64.tar.gz

tar -xzf cre_linux_amd64.tar.gz
mv cre_v1.0.2_linux_amd64 cre
chmod +x cre
sudo mv cre /usr/local/bin/
```

This gives you access to commands like:

* `cre login`
* `cre workflow init`
* `cre workflow simulate`
* `cre workflow deploy`

---

## Authentication Setup


```bash
cre login
```

This opens a browser and links your CLI to your Chainlink account.

### Environment Configuration

Create a `.env` file in the `chainlink/` directory with the following required variables:

```bash
# Ethereum private key (required for workflow deployment)
CRE_ETH_PRIVATE_KEY=your_private_key_here

# Default target (staging-settings or production-settings)
CRE_TARGET=staging-settings
```

---

## Project Structure

```
chainlink/
├── .env                     # Environment variables (create this)
├── project.yaml             # CRE project configuration
├── secrets.yaml             # Workflow secrets
└── verifi-workflow/         # Main workflow directory
    ├── main.ts              # Workflow entry point
    ├── workflow.yaml        # Workflow configuration
    ├── config.staging.json  # Staging environment config
    ├── config.production.json # Production environment config
    ├── package.json         # Node.js dependencies
    └── tasks/
        └── wifi-speed-sim.ts # WiFi speed simulation task
```

---

## Running the Workflow

### Install Dependencies

```bash
cd verifi-workflow
bun install
# or
npm install
```

### Simulate Locally

```bash
cre workflow simulate verifi-workflow
```

This will:
- Run the workflow in a local simulation environment
- Execute the WiFi speed simulation task
- Display results and logs in your terminal

### Deploy to Staging

```bash
cre workflow deploy --target staging-settings
```

### Deploy to Production

```bash
cre workflow deploy --target production-settings
```

---

## Workflow Details

### Main Workflow (`main.ts`)

The main workflow is triggered on a cron schedule and performs the following:

1. **Initialization**: Loads configuration and sets up runtime environment
2. **WiFi Speed Simulation**: Executes the `wifiSpeedSim` task with test data
3. **Result Processing**: Logs and returns simulation results
4. **Error Handling**: Catches and reports any errors during execution
