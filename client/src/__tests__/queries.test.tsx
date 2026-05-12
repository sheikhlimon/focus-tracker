import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mock Clerk's useAuth
const mockGetToken = vi.fn();
vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import { useMonth, useDay, useSettings, useAddTask } from "../api/queries";
import { ApiClientProvider } from "../api/ApiClientProvider";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider>{children}</ApiClientProvider>
    </QueryClientProvider>
  );
}

describe("query hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue("test-token");
  });

  describe("useMonth", () => {
    it("should fetch days for a given month", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ days: [{ date: "2026-05-09", taskCount: 3 }] }),
      });

      const { result } = renderHook(() => useMonth("2026-05"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/days?month=2026-05"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
      expect(result.current.data).toEqual({
        days: [{ date: "2026-05-09", taskCount: 3 }],
      });
    });
  });

  describe("useDay", () => {
    it("should fetch day with tasks for a given date", async () => {
      const dayData = {
        date: "2026-05-09",
        tasks: [{ id: 1, title: "Study React", status: "queued", position: 0 }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dayData),
      });

      const { result } = renderHook(() => useDay("2026-05-09"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/days/2026-05-09"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
      expect(result.current.data).toEqual(dayData);
    });
  });

  describe("useSettings", () => {
    it("should fetch user settings", async () => {
      const settings = {
        focusInterval: 25,
        notificationsEnabled: true,
        taskOverflow: "keep",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(settings),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/settings"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
      expect(result.current.data).toEqual(settings);
    });
  });

  describe("useAddTask", () => {
    it("should POST a new task to the correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 1,
            title: "New task",
            status: "queued",
            position: 0,
          }),
      });

      const { result } = renderHook(() => useAddTask("2026-05-09"), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ title: "New task" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/days/2026-05-09/tasks"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });
  });
});
