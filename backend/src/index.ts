import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";

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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Veri-Fi backend listening on port ${PORT}`);
});


