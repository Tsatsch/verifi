/**
 * Service to download and parse CAR files from Filecoin/IPFS
 */

export interface FilecoinDataPoint {
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  time: string;
  wifiName: string;
  walletAddress: string;
}

interface FilecoinDataSource {
  pieceCid: string;
  downloadUrl: string;
  filename: string;
}

/**
 * List of Filecoin data sources
 */
const FILECOIN_DATA_SOURCES: FilecoinDataSource[] = [
  {
    pieceCid: "bafkzcibcgycoukck6ugvecchmpkqgjfr2k7mxiuvobezu2odfwfdlbywp3a6yhq",
    downloadUrl: "https://calibnet.pspsps.io/ipfs/bafybeie3k3hqe445fxunrbzzrtesx6vyfdqj6g6vjhpknvi5tge4ofji2y?filename=airport-free-wifi-2025-11-22T12-25-00Z.json.car",
    filename: "airport-free-wifi-2025-11-22T12-25-00Z.json.car"
  },
  {
    pieceCid: "bafkzcibcgycidokjd5rzveemqahiiarshrepynn3zcnjqiealwah57rc77ygoby",
    downloadUrl: "https://calibnet.pspsps.io/ipfs/bafybeiapjwpp5wyvogsu2redlzgzi6hl5tb2b3fg5glmsut7sgahcjsq6i?filename=airport-free-wifi-2025-11-22T14-30-00Z.json.car",
    filename: "airport-free-wifi-2025-11-22T14-30-00Z.json.car"
  },
  {
    pieceCid: "bafkzcibchqceaowy6nzym37aigliyw7wzfwywv3unwatjqiu766qpfr4nmxkapa",
    downloadUrl: "https://calibnet.pspsps.io/ipfs/bafybeibj4zv6upqppltr2haxus667lvmxiicaxuqibulfiwdig4oylnqtm?filename=coffeeshop-wifi-2025-11-22T12-23-00Z.json.car",
    filename: "coffeeshop-wifi-2025-11-22T12-23-00Z.json.car"
  },
  {
    pieceCid: "bafkzcibchqcj2zr2awpzmxkemxjg4dyditza5ez6gv3xnn6ihdhc5m5vywxmofy",
    downloadUrl: "https://calibnet.pspsps.io/ipfs/bafybeifwitmpyfdbacdncvwbuririyhwl4t7xyppa7z3y5l7eh7qhlvoiq?filename=coffeeshop-wifi-2025-11-22T13-15-00Z.json.car",
    filename: "coffeeshop-wifi-2025-11-22T13-15-00Z.json.car"
  },
  {
    pieceCid: "bafkzcibchycn54fsn6idticgcnyxogiajmsxwtcgq5ufa4kryufic3hv4c6ksjy",
    downloadUrl: "https://calibnet.pspsps.io/ipfs/bafybeiag647lgvfroip2kz5keckez4yuo22spj6lbriguveme43guqqtwu?filename=library-public-2025-11-22T12-27-00Z.json.car",
    filename: "library-public-2025-11-22T12-27-00Z.json.car"
  },
  {
    pieceCid: "bafkzcibchyciom4qyy53impjcgulszzk4yw7vh4nidakh3nekahke5ekf7enuoy",
    downloadUrl: "https://calibnet.pspsps.io/ipfs/bafybeibjzqvmhyxir3qbqi5zvk2r7qghdnkd45pbceniu3o5ojhkuv24vu?filename=library-public-2025-11-22T15-45-00Z.json.car",
    filename: "library-public-2025-11-22T15-45-00Z.json.car"
  },
  {
    pieceCid: "bafkzcibciicjc5zaucsjckmxzgl2xwfg6em4m4y5na5eu25rn5uawbimdwrvujq",
    downloadUrl: "https://calibnet.pspsps.io/ipfs/bafybeie6yujbcxggkjpgqxjcjtg563yppandouez3tokc4leje7yk7a5cq?filename=sydney-cafe-2025-11-22T12-32-00Z.json.car",
    filename: "sydney-cafe-2025-11-22T12-32-00Z.json.car"
  },
  {
    pieceCid: "bafkzcibcgmca5hjn45gbkhhvfeaqalmse42ylxvumvtemabck5ohr723ooorcka",
    downloadUrl: "https://calibnet.pspsps.io/ipfs/bafybeihlr5ieepjy3jkz2j232ndxu4bvekwcozurkyqknbpmuz4rrsoxka?filename=tokyo-station-free-2025-11-22T12-30-00Z.json.car",
    filename: "tokyo-station-free-2025-11-22T12-30-00Z.json.car"
  }
];

/**
 * Extract JSON from CAR file content
 * CAR files contain metadata at the beginning, followed by the actual content
 * This function finds the JSON object by looking for the opening brace and matching closing brace
 */
function extractJsonFromCar(carContent: Buffer): FilecoinDataPoint | null {
  try {
    // Try UTF-8 first (most common)
    let content: string;
    try {
      content = carContent.toString('utf-8');
    } catch {
      // If UTF-8 fails, try latin1 which can handle binary data better
      content = carContent.toString('latin1');
    }
    
    // Find the JSON object in the file
    // Look for the pattern that indicates JSON start (opening brace followed by quote or whitespace)
    let jsonStart = -1;
    for (let i = 0; i < content.length - 10; i++) {
      if (content[i] === '{' && (content[i + 1] === '"' || content[i + 1] === '\n' || content[i + 1] === ' ')) {
        // Check if this looks like the start of our JSON structure
        const nextChars = content.substring(i, Math.min(i + 50, content.length));
        if (nextChars.includes('"location"') || nextChars.includes('"wifiName"') || nextChars.includes('"speed"')) {
          jsonStart = i;
          break;
        }
      }
    }
    
    // Fallback: if we didn't find a pattern match, just find the first '{'
    if (jsonStart === -1) {
      jsonStart = content.indexOf('{');
    }
    
    if (jsonStart === -1) {
      // eslint-disable-next-line no-console
      console.warn("No JSON object found in CAR file");
      return null;
    }
    
    // Find the matching closing brace
    let braceCount = 0;
    let jsonEnd = -1;
    let inString = false;
    let escapeNext = false;
    
    for (let i = jsonStart; i < content.length; i++) {
      const char = content[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
    }
    
    if (jsonEnd === -1) {
      // eslint-disable-next-line no-console
      console.warn("Could not find complete JSON object in CAR file");
      return null;
    }
    
    // Extract and parse JSON
    const jsonString = content.substring(jsonStart, jsonEnd);
    const data = JSON.parse(jsonString) as FilecoinDataPoint;
    
    // Validate that we have the required fields
    if (!data.wifiName || !data.walletAddress || !data.location || typeof data.speed !== 'number') {
      // eslint-disable-next-line no-console
      console.warn("Extracted JSON does not match expected FilecoinDataPoint format");
      return null;
    }
    
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error extracting JSON from CAR file:", error);
    return null;
  }
}

/**
 * Download a CAR file from Filecoin/IPFS and extract JSON data
 */
async function downloadAndParseCarFile(source: FilecoinDataSource): Promise<FilecoinDataPoint | null> {
  try {
    // eslint-disable-next-line no-console
    console.log(`Downloading CAR file: ${source.filename}`);
    
    const response = await fetch(source.downloadUrl, {
      headers: {
        'Accept': 'application/octet-stream, application/json, */*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download ${source.filename}: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = extractJsonFromCar(buffer);
    
    if (data) {
      // eslint-disable-next-line no-console
      console.log(`Successfully parsed ${source.filename}`);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Failed to parse JSON from ${source.filename}`);
    }
    
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error downloading/parsing ${source.filename}:`, error);
    return null;
  }
}

/**
 * Download all CAR files from Filecoin and extract data points
 */
export async function fetchAllFilecoinDataPoints(): Promise<FilecoinDataPoint[]> {
  // eslint-disable-next-line no-console
  console.log(`Fetching ${FILECOIN_DATA_SOURCES.length} data files from Filecoin...`);
  
  // Download all files in parallel
  const results = await Promise.all(
    FILECOIN_DATA_SOURCES.map(source => downloadAndParseCarFile(source))
  );
  
  // Filter out null results and return valid data points
  const dataPoints = results.filter((point): point is FilecoinDataPoint => point !== null);
  
  // eslint-disable-next-line no-console
  console.log(`Successfully fetched ${dataPoints.length} out of ${FILECOIN_DATA_SOURCES.length} data points from Filecoin`);
  
  return dataPoints;
}

