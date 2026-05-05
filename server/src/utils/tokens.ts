import jwt from "jsonwebtoken";

const ACCESS_SECRET =
  process.env.JWT_SECRET || "dev-secret-change-in-production";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

interface TokenPayload {
  userId: string;
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): TokenPayload & {
  iat: number;
  exp: number;
} {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload & {
    iat: number;
    exp: number;
  };
}

export function verifyRefreshToken(token: string): TokenPayload & {
  iat: number;
  exp: number;
} {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload & {
    iat: number;
    exp: number;
  };
}
