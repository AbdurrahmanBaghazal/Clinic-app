import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { User } from "./models.js";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function ensureSeedAdmin() {
  const existing = await User.findOne({ username: config.adminUsername });

  if (!existing) {
    const passwordHash = await bcrypt.hash(config.adminPassword, 10);
    await User.create({
      username: config.adminUsername,
      passwordHash,
      role: "admin"
    });
  }
}

export async function login(username: string, password: string) {
  const user = await User.findOne({ username });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: "8h"
  });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);

    if (typeof payload === "object" && typeof payload.sub === "string") {
      req.userId = payload.sub;
      return next();
    }

    return res.status(401).json({ message: "Invalid authorization token" });
  } catch {
    return res.status(401).json({ message: "Invalid authorization token" });
  }
}

