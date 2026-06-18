import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app, connectDatabase } from "../server/src/app.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.url?.startsWith("/api/health")) {
    return app(req, res);
  }

  await connectDatabase();
  return app(req, res);
}

