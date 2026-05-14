import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import prisma from "../db";

export interface AuthRequest<P = Record<string, string>> extends Request<P> {
  userId?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const claims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    req.userId = claims.sub;

    await prisma.user.upsert({
      where: { id: claims.sub },
      update: {},
      create: { id: claims.sub },
    });

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
