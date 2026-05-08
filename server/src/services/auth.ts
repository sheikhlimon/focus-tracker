import bcrypt from "bcryptjs";
import prisma from "../db";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens";

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function signup(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already exists" as const, status: 409 as number };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, settings: { create: {} } },
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid credentials" as const, status: 401 as number };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid credentials" as const, status: 401 as number };
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return { user: sanitizeUser(user), accessToken, refreshToken };
}
