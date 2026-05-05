import { describe, it, expect } from "vitest";
import request from "supertest";
import { z } from "zod";
import { createApp } from "../index";
import { validate } from "../middleware/validation";

const testSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

describe("validate middleware", () => {
  const app = createApp();

  app.post("/api/test", validate(testSchema), (_req, res) => {
    res.json({ ok: true });
  });

  it("should reject invalid body with 400", async () => {
    const res = await request(app)
      .post("/api/test")
      .send({ email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("should allow valid body through", async () => {
    const res = await request(app)
      .post("/api/test")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
