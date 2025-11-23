/**
 * Service to interact with Chainlink CRE workflow via CLI
 */

import { exec } from "child_process";
import { promisify } from "util";
import { getAllWifiDataPoints, type WifiDataPoint } from "./dataStore";
import path from "path";
import { existsSync } from "fs";

const execAsync = promisify(exec);

interface CreWorkflowResult {
  success: boolean;
  statistics?: any[];
  error?: string;
  output?: string;
}

/**
 * Check if CRE CLI is available
 */
async function isCreCliAvailable(): Promise<boolean> {
  try {
    await execAsync("cre --version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Trigger the CRE workflow to calculate Wi-Fi statistics
 * This uses the CRE CLI to trigger the deployed workflow or simulate it locally
 */
export async function triggerCreWorkflow(dataPoints: WifiDataPoint[]): Promise<CreWorkflowResult> {
  try {
    // Check if CRE CLI is available
    const creAvailable = await isCreCliAvailable();
    if (!creAvailable) {
      throw new Error("CRE CLI is not available. Please install it or deploy the workflow.");
    }

    // Get the path to the chainlink workflow directory
    const chainlinkDir = path.join(process.cwd(), "..", "chainlink");
    const workflowPath = path.join(chainlinkDir, "verifi-workflow");
    
    // Check if workflow directory exists
    if (!existsSync(workflowPath)) {
      throw new Error(`Workflow directory not found: ${workflowPath}`);
    }
    
    // Create a temporary input file with the data points
    const inputData = {
      dataPoints: dataPoints
    };
    
    const inputFile = path.join(workflowPath, "input.json");
    const fs = await import("fs/promises");
    await fs.writeFile(inputFile, JSON.stringify(inputData, null, 2));

    const target = process.env.CRE_TARGET || "staging-settings";
    const workflowName = target === "production-settings" 
      ? "verifi-workflow-production" 
      : "verifi-workflow-staging";
    
    try {
      // First, try to trigger the deployed workflow
      // eslint-disable-next-line no-console
      console.log(`[CRE] Attempting to trigger deployed workflow: ${workflowName}`);
      
      const { stdout, stderr } = await execAsync(
        `cre workflow trigger ${workflowName} --input ${inputFile}`,
        {
          cwd: chainlinkDir,
          env: {
            ...process.env,
            CRE_TARGET: target
          },
          timeout: 60000 // 60 second timeout
        }
      );

      // Parse the output (CRE CLI returns JSON or structured output)
      let result: any = { success: true };
      
      // Try to parse as JSON
      try {
        const lines = stdout.trim().split("\n");
        const jsonLine = lines.find(line => line.startsWith("{") || line.startsWith("["));
        if (jsonLine) {
          result = JSON.parse(jsonLine);
        } else {
          // Look for statistics in the output
          result = { output: stdout, statistics: extractStatisticsFromOutput(stdout) };
        }
      } catch {
        // If not JSON, try to extract statistics from text output
        result = { output: stdout, statistics: extractStatisticsFromOutput(stdout) };
      }

      // Clean up input file
      await fs.unlink(inputFile).catch(() => {});

      if (result.statistics && result.statistics.length > 0) {
        return {
          success: true,
          statistics: result.statistics,
          output: stdout
        };
      }

      // If no statistics found, try simulation
      throw new Error("No statistics found in workflow output");
    } catch (triggerError: any) {
      // If trigger fails (workflow not deployed), fall back to simulation
      // eslint-disable-next-line no-console
      console.warn("[CRE] Workflow trigger failed, trying simulation:", triggerError.message);
      
      const { stdout, stderr } = await execAsync(
        `cre workflow simulate verifi-workflow --input ${inputFile}`,
        {
          cwd: chainlinkDir,
          env: {
            ...process.env,
            CRE_TARGET: target
          },
          timeout: 60000
        }
      );

      // Clean up input file
      await fs.unlink(inputFile).catch(() => {});

      // Parse simulation output
      let result: any = { success: true };
      try {
        const lines = stdout.trim().split("\n");
        const jsonLine = lines.find(line => line.startsWith("{") || line.startsWith("["));
        if (jsonLine) {
          result = JSON.parse(jsonLine);
        } else {
          result = { output: stdout, statistics: extractStatisticsFromOutput(stdout) };
        }
      } catch {
        result = { output: stdout, statistics: extractStatisticsFromOutput(stdout) };
      }

      if (result.statistics && result.statistics.length > 0) {
        return {
          success: true,
          statistics: result.statistics,
          output: stdout
        };
      }

      throw new Error("No statistics found in simulation output");
    }
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("[CRE] Error triggering CRE workflow:", error);
    return {
      success: false,
      error: error.message || "Failed to trigger CRE workflow"
    };
  }
}

/**
 * Extract statistics from CRE workflow output
 * This is a fallback parser for when JSON parsing fails
 */
function extractStatisticsFromOutput(output: string): any[] {
  // Try to find JSON-like structures in the output
  const jsonMatches = output.match(/\{[\s\S]*"statistics"[\s\S]*\}/);
  if (jsonMatches) {
    try {
      const parsed = JSON.parse(jsonMatches[0]);
      return parsed.statistics || [];
    } catch {
      // Ignore parse errors
    }
  }
  return [];
}

/**
 * Get statistics by triggering the CRE workflow with all available data points
 */
export async function getStatisticsViaCre(): Promise<any[]> {
  const dataPoints = await getAllWifiDataPoints();
  const result = await triggerCreWorkflow(dataPoints);
  
  if (result.success && result.statistics) {
    return result.statistics;
  }
  
  throw new Error(result.error || "Failed to get statistics from CRE workflow");
}

