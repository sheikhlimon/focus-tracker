import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("api client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should make GET requests to the correct URL", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    } as Response);

    const { api } = await import("../api/client");
    await api.get("/days");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/days"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should attach auth token from localStorage", async () => {
    localStorage.setItem("accessToken", "test-token-123");

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const { api } = await import("../api/client");
    await api.get("/days");

    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(callArgs?.[1]?.headers).toHaveProperty(
      "Authorization",
      "Bearer test-token-123",
    );
  });

  it("should return parsed JSON on success", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ days: [] }),
    } as Response);

    const { api } = await import("../api/client");
    const result = await api.get("/days");

    expect(result).toEqual({ days: [] });
  });

  it("should throw with error message on non-OK response", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ errors: ["Title is required"] }),
    } as Response);

    const { api } = await import("../api/client");

    await expect(api.post("/tasks", {})).rejects.toThrow("Title is required");
  });

  it("should clear tokens on 401 response", async () => {
    localStorage.setItem("accessToken", "expired");
    localStorage.setItem("refreshToken", "expired");

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    } as Response);

    const { api } = await import("../api/client");

    await expect(api.get("/days")).rejects.toThrow();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});
