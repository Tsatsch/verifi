// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title WifiRegistry
 * @notice A Public Good registry for WiFi spots. 
 * @dev Optimized for Gas: Data lives on IPFS/Filecoin. Contract only stores the pointer and verification status.
 */
contract WifiRegistry is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // --- Structs ---

    // Optimized Struct: Only essential on-chain data
    struct WifiSpot {
        string ipfsCid;           // Pointer to Filecoin (contains Name, Lat, Long, Speed, etc.)
        uint256 verificationScore; // 0 = Unverified/Fake, 100 = Verified by Chainlink
        address submitter;        // The scout who found it
    }

    // Temporary storage for verification logic
    struct PendingRequest {
        address submitter;
        string ipfsCid;
        int256 claimedLat;  // Kept here ONLY until verification is done
        int256 claimedLong; // Kept here ONLY until verification is done
        bool exists;
    }

    // --- State Variables ---

    mapping(bytes32 => WifiSpot) public spots;
    bytes32[] public allSpotIds;

    mapping(bytes32 => PendingRequest) public pendingRequests; 
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    // Chainlink Config (Base Sepolia)
    address public router; 
    bytes32 public donId; 
    uint64 public subscriptionId; 
    uint32 public gasLimit = 300000;
    string public sourceCode;

    // --- Events (Crucial for The Graph) ---
    // We emit Lat/Long here so The Graph can build the map, even though we don't store it on-chain!
    event SpotSubmitted(bytes32 indexed requestId, address indexed submitter, string ipfsCid);
    event SpotVerified(bytes32 indexed spotId, address indexed submitter, uint256 score, int256 lat, int256 long);
    event RequestFailed(bytes32 indexed requestId, bytes error);

    // --- Constructor ---

    constructor(address _router, bytes32 _donId, uint64 _subscriptionId) 
        FunctionsClient(_router) 
        ConfirmedOwner(msg.sender) 
    {
        router = _router;
        donId = _donId;
        subscriptionId = _subscriptionId;
    }

    // --- Core Logic ---

    /**
     * @notice Step 1: User submits. We hold Lat/Long temporarily to verify against IP.
     */
    function submitSpot(
        string calldata _ipfsCid, 
        int256 _lat, 
        int256 _long, 
        string calldata _userIP
    ) external returns (bytes32 requestId) {
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(sourceCode);
        
        string[] memory args = new string[](1);
        args[0] = _userIP;
        req.setArgs(args);

        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );

        pendingRequests[requestId] = PendingRequest({
            submitter: msg.sender,
            ipfsCid: _ipfsCid,
            claimedLat: _lat,
            claimedLong: _long,
            exists: true
        });

        emit SpotSubmitted(requestId, msg.sender, _ipfsCid);
        s_lastRequestId = requestId;
        return requestId;
    }

    /**
     * @notice Step 2: Chainlink calls back. We verify logic, save minimal struct, and delete temp data.
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        PendingRequest memory request = pendingRequests[requestId];
        require(request.exists, "Request not found");

        if (err.length > 0) {
            emit RequestFailed(requestId, err);
            s_lastError = err;
            return;
        }

        s_lastResponse = response;

        // 1. Decode Chainlink Response
        (int256 ipLat, int256 ipLong) = abi.decode(response, (int256, int256));

        // 2. Verification Logic
        // Tolerance: 500,000 = approx 50km (generous for hackathon demo)
        int256 latDiff = ipLat > request.claimedLat ? ipLat - request.claimedLat : request.claimedLat - ipLat;
        int256 longDiff = ipLong > request.claimedLong ? ipLong - request.claimedLong : request.claimedLong - ipLong;
        
        bool isClose = (latDiff < 500000) && (longDiff < 500000);
        uint256 score = isClose ? 100 : 0;

        bytes32 spotId = keccak256(abi.encodePacked(request.ipfsCid));

        // 3. STRICT CONDITIONAL: Only save to Registry if verified
        if (isClose) {
            spots[spotId] = WifiSpot({
                ipfsCid: request.ipfsCid,
                verificationScore: score,
                submitter: request.submitter
            });
            
            allSpotIds.push(spotId);
        }
        
        // 4. Clean up (Refunds Gas)
        delete pendingRequests[requestId];

        // 5. Emit Event so UI knows the outcome (The Graph can verify score before indexing)
        emit SpotVerified(spotId, request.submitter, score, request.claimedLat, request.claimedLong);
    }

    // --- Admin Functions ---

    function setSourceCode(string memory _source) external onlyOwner {
        sourceCode = _source;
    }

    function getAllSpotIds() external view returns (bytes32[] memory) {
        return allSpotIds;
    }
}
