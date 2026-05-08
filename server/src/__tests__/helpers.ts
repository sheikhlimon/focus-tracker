import prisma from "../db";
import { generateAccessToken } from "../utils/tokens";

export async function createUser(email: string) {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("password123", 10);
  return prisma.user.create({
    data: { email, name: "Test", passwordHash, settings: { create: {} } },
  });
}

export function authHeader(userId: string) {
  return { Authorization: `Bearer ${generateAccessToken(userId)}` };
}

export async function cleanDatabase() {
  await prisma.session.deleteMany();
  await prisma.task.deleteMany();
  await prisma.day.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();
}
