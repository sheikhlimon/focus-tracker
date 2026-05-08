import prisma from "../db";

export async function startSession(taskId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "active" },
  });

  return prisma.session.create({
    data: {
      startTime: new Date(),
      status: "running",
      taskId,
    },
  });
}

export async function pauseSession(sessionId: string) {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const pauses: { start: string; end?: string }[] = Array.isArray(
    session.pauses,
  )
    ? (session.pauses as { start: string; end?: string }[])
    : [];

  pauses.push({ start: new Date().toISOString() });

  return prisma.session.update({
    where: { id: sessionId },
    data: { status: "paused", pauses },
  });
}

export async function resumeSession(sessionId: string) {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const pauses: { start: string; end?: string }[] = Array.isArray(
    session.pauses,
  )
    ? (session.pauses as { start: string; end?: string }[])
    : [];

  const lastPause = pauses[pauses.length - 1];
  if (lastPause && !lastPause.end) {
    lastPause.end = new Date().toISOString();
  }

  return prisma.session.update({
    where: { id: sessionId },
    data: { status: "running", pauses },
  });
}

export async function completeSession(sessionId: string) {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const now = new Date();
  const totalMs = now.getTime() - session.startTime.getTime();

  const pauses: { start: string; end?: string }[] = Array.isArray(
    session.pauses,
  )
    ? (session.pauses as { start: string; end?: string }[])
    : [];

  const pausedMs = pauses.reduce((sum, p) => {
    if (p.end) {
      return sum + (new Date(p.end).getTime() - new Date(p.start).getTime());
    }
    return sum;
  }, 0);

  const durationSeconds = Math.round((totalMs - pausedMs) / 1000);

  await prisma.task.update({
    where: { id: session.taskId },
    data: { status: "completed" },
  });

  return prisma.session.update({
    where: { id: sessionId },
    data: {
      status: "completed",
      endTime: now,
      durationSeconds,
      pauses,
    },
  });
}
