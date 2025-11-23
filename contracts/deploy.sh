#!/bin/bash

# WifiRegistry Deployment Script
# Make sure you have Base Sepolia ETH and a Chainlink Functions subscription

echo "🚀 Deploying WifiRegistry to Base Sepolia..."

# Load environment variables
source .env

# Contract constructor parameters
ROUTER="0xf9B8fc078197181C841c296C876945aaa425B278"
DON_ID="0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000"
SUBSCRIPTION_ID="1"  # UPDATE THIS WITH YOUR CHAINLINK SUBSCRIPTION ID

echo "Using parameters:"
echo "Router: $ROUTER"
echo "DON ID: $DON_ID" 
echo "Subscription ID: $SUBSCRIPTION_ID"

# Deploy the contract
echo "Deploying..."
forge create src/WifiRegistry.sol:WifiRegistry \
  --broadcast \
  --force \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --constructor-args "$ROUTER" "$DON_ID" "$SUBSCRIPTION_ID"

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Note the deployed contract address"
echo "2. Add the contract as a consumer to your Chainlink Functions subscription"
echo "3. Fund your subscription with LINK tokens"
echo "4. Set the source code using setSourceCode() function"
