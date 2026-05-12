import prisma from "../db";

export async function createUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      name: "Test",
      passwordHash: "clerk-managed",
      settings: { create: {} },
    },
  });
}

export function authHeader(userId: string) {
  return { Authorization: `Bearer test-token-for-${userId}` };
}

export async function cleanDatabase() {
  await prisma.session.deleteMany();
  await prisma.task.deleteMany();
  await prisma.day.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();
}
