import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { app, connectDatabase } = await import("../server/src/app.js");

  if (req.url?.startsWith("/api/health")) {
    return app(req, res);
  }

  await connectDatabase();
  return app(req, res);
}
