import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { ensureSeedAdmin } from "./auth.js";
import { config } from "./config.js";
import { router } from "./routes.js";
import { ensureSampleForm } from "./seed.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api", router);

async function bootstrap() {
  await mongoose.connect(config.mongoUri);
  await ensureSeedAdmin();
  await ensureSampleForm();

  app.listen(config.port, () => {
    console.log(`Praxis Form API listening on port ${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

