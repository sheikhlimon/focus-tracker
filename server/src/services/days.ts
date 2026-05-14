import prisma from "../db";

function parseDate(date: string) {
  const parts = date.split("-").map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

async function applyRollover(userId: string, todayDate: Date) {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings || settings.taskOverflow !== "carry") return;

  const yesterday = new Date(todayDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const yesterdayDay = await prisma.day.findFirst({
    where: { date: yesterday, userId },
    include: { tasks: true },
  });

  if (!yesterdayDay) return;

  const incompleteTasks = yesterdayDay.tasks.filter(
    (t) => t.status === "queued" || t.status === "active",
  );

  if (incompleteTasks.length === 0) return;

  const today = await prisma.day.upsert({
    where: { date_userId: { date: todayDate, userId } },
    update: {},
    create: { date: todayDate, userId },
  });

  for (const task of incompleteTasks) {
    await prisma.task.create({
      data: {
        title: task.title,
        position: task.position,
        status: "queued",
        dayId: today.id,
        url: task.url,
        durationMin: task.durationMin,
        session: task.session,
      },
    });

    await prisma.session.updateMany({
      where: { taskId: task.id, status: "running" },
      data: { endTime: new Date(), status: "completed" },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "completed" },
    });
  }
}

async function applyAutoPopulate(userId: string, dayId: string) {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings || !settings.autoPopulate) return;

  const existingTasks = await prisma.task.count({ where: { dayId } });
  if (existingTasks > 0) return;

  const templates = await prisma.taskTemplate.findMany({
    where: { userId },
    orderBy: [{ session: "asc" }, { position: "asc" }],
  });

  if (templates.length === 0) return;

  const rolloverTitles = (
    await prisma.task.findMany({
      where: { dayId },
      select: { title: true },
    })
  ).map((t) => t.title);

  let position = rolloverTitles.length;

  for (const template of templates) {
    if (rolloverTitles.includes(template.title)) continue;

    await prisma.task.create({
      data: {
        title: template.title,
        url: template.url,
        durationMin: template.durationMin,
        session: template.session,
        position,
        status: "queued",
        dayId,
      },
    });
    position++;
  }
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
    include: { tasks: { include: { sessions: true } } },
    orderBy: { date: "asc" },
  });
}

export async function getDayByDate(userId: string, date: string) {
  const dayDate = parseDate(date);

  await applyRollover(userId, dayDate);

  let day = await prisma.day.findFirst({
    where: { date: dayDate, userId },
    include: {
      tasks: { include: { sessions: true }, orderBy: { position: "asc" } },
    },
  });

  if (!day) {
    day = await prisma.day.create({
      data: { date: dayDate, userId },
      include: { tasks: { include: { sessions: true } } },
    });
  }

  if (day.tasks.length === 0) {
    await applyAutoPopulate(userId, day.id);

    const populated = await prisma.day.findFirst({
      where: { date: dayDate, userId },
      include: {
        tasks: { include: { sessions: true }, orderBy: { position: "asc" } },
      },
    });
    if (populated) return populated;
  }

  return day;
}

export async function createDay(userId: string, date: string) {
  const dayDate = parseDate(date);

  const existing = await prisma.day.findFirst({
    where: { date: dayDate, userId },
  });

  if (existing) {
    return { error: "Day already exists" as const, status: 409 as number };
  }

  return prisma.day.create({
    data: { date: dayDate, userId },
    include: { tasks: { include: { sessions: true } } },
  });
}
