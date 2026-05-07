import { describe, it, expect, beforeEach } from "vitest";
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

describe("Days routes", () => {
  let userId: string;
  let headers: Record<string, string>;

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.task.deleteMany();
    await prisma.day.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.user.deleteMany();

    const user = await createUser("days-test@example.com");
    userId = user.id;
    headers = authHeader(userId);
  });

  describe("GET /api/days?month=YYYY-MM", () => {
    it("should return days for the given month", async () => {
      await prisma.day.create({
        data: {
          date: new Date(Date.UTC(2026, 4, 1)),
          userId,
          tasks: {
            create: [
              { title: "Task 1", position: 0, status: "queued" },
              { title: "Task 2", position: 1, status: "completed" },
            ],
          },
        },
      });

      const res = await request(app)
        .get("/api/days?month=2026-05")
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].tasks).toHaveLength(2);
    });

    it("should return empty array for month with no days", async () => {
      const res = await request(app)
        .get("/api/days?month=2026-01")
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should reject without auth", async () => {
      const res = await request(app).get("/api/days?month=2026-05");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/days/:date", () => {
    it("should return day with tasks", async () => {
      await prisma.day.create({
        data: {
          date: new Date(Date.UTC(2026, 4, 7)),
          userId,
          tasks: {
            create: [{ title: "Task 1", position: 0, status: "queued" }],
          },
        },
      });

      const res = await request(app).get("/api/days/2026-05-07").set(headers);

      expect(res.status).toBe(200);
      expect(res.body.date).toBeDefined();
      expect(res.body.tasks).toHaveLength(1);
      expect(res.body.tasks[0].title).toBe("Task 1");
    });

    it("should create day if it does not exist", async () => {
      const res = await request(app).get("/api/days/2026-05-07").set(headers);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toEqual([]);
    });
  });

  describe("POST /api/days/:date", () => {
    it("should create a new day", async () => {
      const res = await request(app).post("/api/days/2026-05-10").set(headers);

      expect(res.status).toBe(201);
      expect(res.body.date).toBeDefined();
      expect(res.body.tasks).toEqual([]);
    });

    it("should reject duplicate day", async () => {
      await prisma.day.create({
        data: { date: new Date(Date.UTC(2026, 4, 10)), userId },
      });

      const res = await request(app).post("/api/days/2026-05-10").set(headers);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: "Day already exists" });
    });
  });
});
