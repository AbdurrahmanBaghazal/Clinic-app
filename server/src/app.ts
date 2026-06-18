import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { ensureSeedAdmin } from "./auth.js";
import { config } from "./config.js";
import { router } from "./routes.js";
import { ensureSampleForm } from "./seed.js";

let connectionPromise: Promise<void> | null = null;

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use(async (req, res, next) => {
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  try {
    await connectDatabase();
    return next();
  } catch {
    return res.status(503).json({ message: "Database connection unavailable" });
  }
});

app.use("/api", router);

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  connectionPromise ??= mongoose.connect(config.mongoUri).then(async () => {
    await ensureSeedAdmin();
    await ensureSampleForm();
  });

  await connectionPromise;
}
