import { describe, it, expect } from "vitest";
import request from "supertest";

describe("GET /api/health", () => {
  it("should return status ok", async () => {
    const { createApp } = await import("../index");
    const app = createApp();

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
