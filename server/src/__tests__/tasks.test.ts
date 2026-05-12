import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../index";
import prisma from "../db";
import { createUser, authHeader } from "./helpers";

vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn(),
}));

const app = createApp();

async function createDayWithTasks(
  userId: string,
  date: string,
  tasks: { title: string; position: number }[],
) {
  const [y, m, d] = date.split("-").map(Number);
  return prisma.day.create({
    data: {
      date: new Date(Date.UTC(y, m - 1, d)),
      userId,
      tasks: { create: tasks },
    },
    include: { tasks: true },
  });
}

describe("Tasks routes", () => {
  let userId: string;
  let dayId: string;
  let headers: Record<string, string>;

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.task.deleteMany();
    await prisma.day.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.user.deleteMany();

    const user = await createUser("tasks-test@example.com");
    userId = user.id;
    headers = authHeader(userId);

    const { verifyToken } = await import("@clerk/backend");
    vi.mocked(verifyToken).mockResolvedValue({ sub: userId } as never);

    const day = await prisma.day.create({
      data: {
        date: new Date(Date.UTC(2026, 4, 7)),
        userId,
      },
    });
    dayId = day.id;
  });

  describe("POST /api/days/:date/tasks", () => {
    it("should add task with auto-incrementing position", async () => {
      await prisma.task.create({
        data: { title: "First", position: 0, status: "queued", dayId },
      });

      const res = await request(app)
        .post("/api/days/2026-05-07/tasks")
        .set(headers)
        .send({ title: "Second task" });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Second task");
      expect(res.body.position).toBe(1);
    });

    it("should reject without title", async () => {
      const res = await request(app)
        .post("/api/days/2026-05-07/tasks")
        .set(headers)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });
  });

  describe("PATCH /api/days/:date/tasks/:taskId", () => {
    it("should update task title", async () => {
      const task = await prisma.task.create({
        data: { title: "Old title", position: 0, status: "queued", dayId },
      });

      const res = await request(app)
        .patch(`/api/days/2026-05-07/tasks/${task.id}`)
        .set(headers)
        .send({ title: "New title" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("New title");
    });

    it("should update task status", async () => {
      const task = await prisma.task.create({
        data: { title: "Task", position: 0, status: "queued", dayId },
      });

      const res = await request(app)
        .patch(`/api/days/2026-05-07/tasks/${task.id}`)
        .set(headers)
        .send({ status: "active" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("active");
    });
  });

  describe("DELETE /api/days/:date/tasks/:taskId", () => {
    it("should delete a task", async () => {
      const task = await prisma.task.create({
        data: { title: "Delete me", position: 0, status: "queued", dayId },
      });

      const res = await request(app)
        .delete(`/api/days/2026-05-07/tasks/${task.id}`)
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });

      const found = await prisma.task.findUnique({ where: { id: task.id } });
      expect(found).toBeNull();
    });
  });

  describe("PATCH /api/days/:date/tasks/reorder", () => {
    it("should reorder tasks", async () => {
      const t1 = await prisma.task.create({
        data: { title: "A", position: 0, status: "queued", dayId },
      });
      const t2 = await prisma.task.create({
        data: { title: "B", position: 1, status: "queued", dayId },
      });
      const t3 = await prisma.task.create({
        data: { title: "C", position: 2, status: "queued", dayId },
      });

      const newOrder = [t3.id, t1.id, t2.id];

      const res = await request(app)
        .patch("/api/days/2026-05-07/tasks/reorder")
        .set(headers)
        .send({ taskIds: newOrder });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body[0].title).toBe("C");
      expect(res.body[0].position).toBe(0);
      expect(res.body[1].title).toBe("A");
      expect(res.body[1].position).toBe(1);
      expect(res.body[2].title).toBe("B");
      expect(res.body[2].position).toBe(2);
    });
  });
});
