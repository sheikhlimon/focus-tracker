import prisma from "../db";

export async function addTask(
  dayId: string,
  title: string,
  durationMin?: number,
) {
  const count = await prisma.task.count({ where: { dayId } });

  return prisma.task.create({
    data: {
      title,
      position: count,
      status: "queued",
      dayId,
      durationMin: durationMin ?? 25,
    },
    include: { sessions: true },
  });
}

export async function updateTask(
  taskId: string,
  dayId: string,
  data: { title?: string; status?: string },
) {
  if (data.status === "active") {
    const running = await prisma.session.findFirst({
      where: { taskId, status: "running" },
    });
    if (running) {
      await prisma.session.update({
        where: { id: running.id },
        data: { endTime: new Date(), status: "completed" },
      });
    }

    await prisma.session.create({
      data: { taskId, startTime: new Date(), status: "running" },
    });
  } else if (data.status === "queued" || data.status === "completed") {
    const running = await prisma.session.findFirst({
      where: { taskId, status: "running" },
    });
    if (running) {
      await prisma.session.update({
        where: { id: running.id },
        data: { endTime: new Date(), status: "completed" },
      });
    }
  }

  return prisma.task.update({
    where: { id: taskId },
    data,
    include: { sessions: true },
  });
}

export async function deleteTask(taskId: string) {
  await prisma.session.deleteMany({ where: { taskId } });
  await prisma.task.delete({ where: { id: taskId } });
}

export async function reorderTasks(taskIds: string[]) {
  return prisma.$transaction(
    taskIds.map((id, index) =>
      prisma.task.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );
}
