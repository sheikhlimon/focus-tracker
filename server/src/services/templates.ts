import prisma from "../db";

export async function getTemplates(userId: string) {
  return prisma.taskTemplate.findMany({
    where: { userId },
    orderBy: [{ session: "asc" }, { position: "asc" }],
  });
}

export async function addTemplate(
  userId: string,
  data: { title: string; url?: string; durationMin: number; session: string },
) {
  const count = await prisma.taskTemplate.count({
    where: { userId, session: data.session },
  });

  return prisma.taskTemplate.create({
    data: { ...data, position: count, userId },
  });
}

export async function updateTemplate(
  templateId: string,
  data: {
    title?: string;
    url?: string;
    durationMin?: number;
    session?: string;
  },
) {
  return prisma.taskTemplate.update({
    where: { id: templateId },
    data,
  });
}

export async function deleteTemplate(templateId: string) {
  await prisma.taskTemplate.delete({ where: { id: templateId } });
}

export async function reorderTemplates(
  userId: string,
  session: string,
  templateIds: string[],
) {
  return prisma.$transaction(
    templateIds.map((id, index) =>
      prisma.taskTemplate.update({
        where: { id, userId },
        data: { position: index },
      }),
    ),
  );
}
