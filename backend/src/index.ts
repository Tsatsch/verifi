import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { getStatisticsByWifiName } from "./services/statistics";

const PORT = process.env.PORT || 4000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "verifi-backend",
    timestamp: new Date().toISOString(),
  });
});

// Example API route that frontend can call
app.get("/api/example", (req: Request, res: Response) => {
  res.json({
    message: "Hello from Veri-Fi backend",
  });
});

// Statistics endpoint - returns statistics aggregated by Wi-Fi name
app.get("/api/statistics", async (req: Request, res: Response) => {
  try {
    const statistics = await getStatisticsByWifiName();
    res.json({
      success: true,
      data: statistics,
      count: statistics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Veri-Fi backend listening on port ${PORT}`);
});


