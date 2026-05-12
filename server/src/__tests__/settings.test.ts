import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../index";
import { createUser, authHeader, cleanDatabase } from "./helpers";

vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn(),
}));

const app = createApp();

describe("Settings routes", () => {
  let userId: string;
  let headers: Record<string, string>;

  beforeEach(async () => {
    await cleanDatabase();
    const user = await createUser("settings-test@example.com");
    userId = user.id;
    headers = authHeader(userId);

    const { verifyToken } = await import("@clerk/backend");
    vi.mocked(verifyToken).mockResolvedValue({ sub: userId } as never);
  });

  describe("GET /api/settings", () => {
    it("should return default settings", async () => {
      const res = await request(app).get("/api/settings").set(headers);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        focusInterval: 25,
        notificationsEnabled: true,
        taskOverflow: "keep",
        theme: "system",
        weekStartsOn: "monday",
      });
    });
  });

  describe("PATCH /api/settings", () => {
    it("should update settings", async () => {
      const res = await request(app)
        .patch("/api/settings")
        .set(headers)
        .send({ focusInterval: 30, theme: "dark" });

      expect(res.status).toBe(200);
      expect(res.body.focusInterval).toBe(30);
      expect(res.body.theme).toBe("dark");
      expect(res.body.notificationsEnabled).toBe(true);
    });

    it("should reject invalid values", async () => {
      const res = await request(app)
        .patch("/api/settings")
        .set(headers)
        .send({ focusInterval: 0, theme: "" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });
  });
});
