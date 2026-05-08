import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../index";
import prisma from "../db";
import { generateAccessToken } from "../utils/tokens";

const app = createApp();

async function createUser(email: string) {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("password123", 10);
  return prisma.user.create({
    data: { email, name: "Test", passwordHash, settings: { create: {} } },
  });
}

function authHeader(userId: string) {
  return { Authorization: `Bearer ${generateAccessToken(userId)}` };
}

describe("Session routes", () => {
  let userId: string;
  let taskId: string;
  let headers: Record<string, string>;

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.task.deleteMany();
    await prisma.day.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.user.deleteMany();

    const user = await createUser("sessions-test@example.com");
    userId = user.id;
    headers = authHeader(userId);

    const day = await prisma.day.create({
      data: { date: new Date(Date.UTC(2026, 4, 7)), userId },
    });
    const task = await prisma.task.create({
      data: {
        title: "Focus task",
        position: 0,
        status: "queued",
        dayId: day.id,
      },
    });
    taskId = task.id;
  });

  describe("POST /api/sessions", () => {
    it("should start a session and set task to active", async () => {
      const res = await request(app)
        .post("/api/sessions")
        .set(headers)
        .send({ taskId });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("running");
      expect(res.body.taskId).toBe(taskId);

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      expect(task!.status).toBe("active");
    });

    it("should reject without taskId", async () => {
      const res = await request(app)
        .post("/api/sessions")
        .set(headers)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/sessions/:sessionId", () => {
    it("should pause a running session", async () => {
      const session = await prisma.session.create({
        data: {
          startTime: new Date(),
          status: "running",
          taskId,
        },
      });

      const res = await request(app)
        .patch(`/api/sessions/${session.id}`)
        .set(headers)
        .send({ action: "pause" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("paused");
      expect(res.body.pauses).toHaveLength(1);
    });

    it("should resume a paused session", async () => {
      const now = new Date();
      const session = await prisma.session.create({
        data: {
          startTime: now,
          status: "paused",
          taskId,
          pauses: [{ start: now.toISOString(), end: now.toISOString() }],
        },
      });

      const res = await request(app)
        .patch(`/api/sessions/${session.id}`)
        .set(headers)
        .send({ action: "resume" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("running");
    });
  });

  describe("PATCH /api/sessions/:sessionId/complete", () => {
    it("should complete a session and set task to completed", async () => {
      const session = await prisma.session.create({
        data: {
          startTime: new Date(Date.now() - 1500 * 1000),
          status: "running",
          taskId,
        },
      });

      const res = await request(app)
        .patch(`/api/sessions/${session.id}/complete`)
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("completed");
      expect(res.body.endTime).toBeDefined();
      expect(res.body.durationSeconds).toBeGreaterThan(0);

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      expect(task!.status).toBe("completed");
    });
  });
});
