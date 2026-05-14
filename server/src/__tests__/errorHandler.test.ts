import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { errorHandler } from "../middleware/errorHandler";

describe("errorHandler middleware", () => {
  const app = express();

  app.get("/api/crash", () => {
    throw new Error("Something broke");
  });

  app.use(errorHandler);

  it("should return 500 with generic message", async () => {
    const res = await request(app).get("/api/crash");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
