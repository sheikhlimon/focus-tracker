import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../index";
import { generateAccessToken } from "../utils/tokens";
import { authMiddleware } from "../middleware/auth";

describe("authMiddleware", () => {
  const app = createApp();

  app.get("/api/me", authMiddleware, (req: any, res) => {
    res.json({ userId: req.userId });
  });

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/me");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "No token provided" });
  });

  it("should reject request with invalid token", async () => {
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid token" });
  });

  it("should allow request with valid token", async () => {
    const token = generateAccessToken("user_123");
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: "user_123" });
  });
});
