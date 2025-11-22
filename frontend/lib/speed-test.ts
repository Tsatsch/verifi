import FastSpeedtest from "fast-speedtest-api"

// Token for fast.com API - loaded from environment variable
const FAST_COM_TOKEN = process.env.NEXT_PUBLIC_FAST_COM_TOKEN

/**
 * Measure connection speed using fast-speedtest-api.
 * This runs CLIENT-SIDE in the user's browser, measuring their actual network.
 * 
 * @param durationSeconds optional desired measurement duration in seconds. Larger values increase the number of fetches and timeout.
 *                         The value is translated into `urlCount` (more requests) and `timeout` (ms).
 *                         Defaults to ~5 seconds of measurement.
 */
export async function measureConnectionSpeed(
  durationSeconds = 5,
): Promise<{ speed: number; unit: string; samples: number[] } | { error: string }> {
  try {
    if (!FAST_COM_TOKEN) {
      throw new Error("NEXT_PUBLIC_FAST_COM_TOKEN environment variable is not set")
    }

    // Strategy: perform several quick samples and average them so the returned
    // value is an average over the requested duration rather than a single last sample.
    // Determine number of samples (cap to avoid too many slow sequential calls).
    const samples = Math.min(10, Math.max(1, Math.round(durationSeconds / 3)))

    // Create a speedtest instance configured to do small quick checks per sample.
    const speedtest = new FastSpeedtest({
      token: FAST_COM_TOKEN,
      verbose: false,
      timeout: Math.max(5000, Math.round((durationSeconds * 1000) / samples) + 2000),
      https: true,
      // Do a single URL per sample; we'll repeat samples to form an average.
      urlCount: 1,
      bufferSize: 8,
      unit: FastSpeedtest.UNITS.Mbps,
    })

    console.log("Starting averaged speedtest (CLIENT-SIDE)", { durationSeconds, samples })

    const results: number[] = []
    for (let i = 0; i < samples; i++) {
      try {
        // Each getSpeed() is one quick measurement (configured with urlCount:1)
        const s = await speedtest.getSpeed()
        if (typeof s === "number" && !isNaN(s) && isFinite(s)) {
          results.push(s)
        }
      } catch (err) {
        // ignore single-sample failures, they will reduce sample count
        console.warn(`speedtest sample ${i + 1} failed:`, err)
      }

      // small delay between samples to avoid hammering the network or server
      if (i < samples - 1) {
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    if (results.length === 0) {
      throw new Error("No successful speed samples")
    }

    const avg = results.reduce((a, b) => a + b, 0) / results.length
    return { speed: Math.round(avg), unit: "Mbps", samples: results }
  } catch (error: any) {
    console.error("Speed test failed:", error)
    return { error: error?.message || "Failed to measure speed" }
  }
}

