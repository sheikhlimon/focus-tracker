import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("api client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it("should make GET requests to the correct URL", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    } as Response);

    const { createApiClient } = await import("../api/client");
    const api = createApiClient({ getToken: async () => null });
    await api.get("/days");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/days"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should attach auth token from getToken", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const { createApiClient } = await import("../api/client");
    const api = createApiClient({ getToken: async () => "clerk-token-123" });
    await api.get("/days");

    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(callArgs?.[1]?.headers).toHaveProperty(
      "Authorization",
      "Bearer clerk-token-123",
    );
  });

  it("should not attach Authorization header when getToken returns null", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const { createApiClient } = await import("../api/client");
    const api = createApiClient({ getToken: async () => null });
    await api.get("/days");

    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(callArgs?.[1]?.headers).not.toHaveProperty("Authorization");
  });

  it("should return parsed JSON on success", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ days: [] }),
    } as Response);

    const { createApiClient } = await import("../api/client");
    const api = createApiClient({ getToken: async () => null });
    const result = await api.get("/days");

    expect(result).toEqual({ days: [] });
  });

  it("should throw with error message on non-OK response", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ errors: ["Title is required"] }),
    } as Response);

    const { createApiClient } = await import("../api/client");
    const api = createApiClient({ getToken: async () => null });

    await expect(api.post("/tasks", {})).rejects.toThrow("Title is required");
  });
});
