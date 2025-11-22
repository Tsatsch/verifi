"use server"

import FastSpeedtest from "fast-speedtest-api"

// Token extracted from public sources / fast.com network tab
// This token is required for the API to work
const FAST_COM_TOKEN = "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm"

export async function measureConnectionSpeed(): Promise<{ speed: number; unit: string } | { error: string }> {
  try {
    const speedtest = new FastSpeedtest({
      token: FAST_COM_TOKEN,
      verbose: true,
      timeout: 10000,
      https: true,
      urlCount: 5,
      bufferSize: 8,
      unit: FastSpeedtest.UNITS.Mbps,
    })

    console.log("Speedtest results:", speedtest)

    const speed = await speedtest.getSpeed()
    return { speed: Math.round(speed), unit: "Mbps" }
  } catch (error: any) {
    console.error("Speed test failed:", error)
    return { error: error.message || "Failed to measure speed" }
  }
}

