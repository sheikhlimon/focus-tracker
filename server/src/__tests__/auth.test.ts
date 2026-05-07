import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../index";
import prisma from "../db";
import { generateRefreshToken } from "../utils/tokens";

const app = createApp();

async function createUser(email: string, password: string, name: string) {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { email, name, passwordHash, settings: { create: {} } },
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.task.deleteMany();
    await prisma.day.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should create user and return tokens", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user).toMatchObject({
      email: "test@example.com",
      name: "Test User",
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");

    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe("password123");
  });

  it("should reject duplicate email", async () => {
    await createUser("taken@example.com", "password123", "Existing");

    const res = await request(app).post("/api/auth/signup").send({
      email: "taken@example.com",
      name: "New User",
      password: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Email already exists" });
  });

  it("should reject invalid input", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      email: "not-an-email",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.task.deleteMany();
    await prisma.day.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should return tokens for correct credentials", async () => {
    await createUser("test@example.com", "password123", "Test User");

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("should reject wrong password", async () => {
    await createUser("test@example.com", "password123", "Test User");

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid credentials" });
  });

  it("should reject non-existent user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid credentials" });
  });
});

describe("POST /api/auth/refresh", () => {
  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.task.deleteMany();
    await prisma.day.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should return new access token with valid refresh token", async () => {
    const user = await createUser("test@example.com", "password123", "Test");
    const refreshToken = generateRefreshToken(user.id);

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.accessToken.split(".")).toHaveLength(3);
  });

  it("should reject invalid refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "garbage-token" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid refresh token" });
  });
});
