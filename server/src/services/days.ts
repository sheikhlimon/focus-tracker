import prisma from "../db";

function parseDate(date: string) {
  const parts = date.split("-").map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

export async function getDaysByMonth(userId: string, month: string) {
  const parts = month.split("-").map(Number);

  const startDate = new Date(Date.UTC(parts[0], parts[1] - 1, 1));
  const endDate = new Date(Date.UTC(parts[0], parts[1], 1));

  return prisma.day.findMany({
    where: {
      userId,
      date: { gte: startDate, lt: endDate },
    },
    include: { tasks: true },
    orderBy: { date: "asc" },
  });
}

export async function getDayByDate(userId: string, date: string) {
  const dayDate = parseDate(date);

  const existing = await prisma.day.findFirst({
    where: { date: dayDate, userId },
    include: { tasks: { orderBy: { position: "asc" } } },
  });

  if (existing) return existing;

  return prisma.day.create({
    data: { date: dayDate, userId },
    include: { tasks: true },
  });
}

export async function createDay(userId: string, date: string) {
  const dayDate = parseDate(date);

  const existing = await prisma.day.findFirst({
    where: { date: dayDate, userId },
  });

  if (existing) {
    return { error: "Day already exists" as const, status: 409 };
  }

  return prisma.day.create({
    data: { date: dayDate, userId },
    include: { tasks: true },
  });
}
