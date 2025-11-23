// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {WifiRegistry} from "../src/WifiRegistry.sol";

contract DeployWifiRegistry is Script {
    function run() external {
        // Base Sepolia Chainlink configuration
        address router = 0xf9B8fc078197181C841c296C876945aaa425B278; // Base Sepolia Functions Router
        bytes32 donId = 0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000; // fun-base-sepolia-1
        uint64 subscriptionId = 1; // You'll need to create a subscription and update this
        
        vm.startBroadcast();
        
        WifiRegistry wifiRegistry = new WifiRegistry(router, donId, subscriptionId);
        
        console.log("WifiRegistry deployed to:", address(wifiRegistry));
        
        vm.stopBroadcast();
    }
}
