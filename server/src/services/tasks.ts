import prisma from "../db";

export async function addTask(dayId: string, title: string) {
  const count = await prisma.task.count({ where: { dayId } });

  return prisma.task.create({
    data: { title, position: count, status: "queued", dayId },
  });
}

export async function updateTask(
  taskId: string,
  dayId: string,
  data: { title?: string; status?: string },
) {
  return prisma.task.update({
    where: { id: taskId },
    data,
  });
}

export async function deleteTask(taskId: string) {
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
