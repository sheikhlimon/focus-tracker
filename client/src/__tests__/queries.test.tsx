import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { useMonth, useDay, useSettings, useAddTask } from "../api/queries";
import { api } from "../api/client";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("query hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMonth", () => {
    it("should fetch days for a given month", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        days: [{ date: "2026-05-09", taskCount: 3 }],
      });

      const { result } = renderHook(() => useMonth("2026-05"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.get).toHaveBeenCalledWith("/days?month=2026-05");
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
      vi.mocked(api.get).mockResolvedValueOnce(dayData);

      const { result } = renderHook(() => useDay("2026-05-09"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.get).toHaveBeenCalledWith("/days/2026-05-09");
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
      vi.mocked(api.get).mockResolvedValueOnce(settings);

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.get).toHaveBeenCalledWith("/settings");
      expect(result.current.data).toEqual(settings);
    });
  });

  describe("useAddTask", () => {
    it("should POST a new task to the correct endpoint", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        id: 1,
        title: "New task",
        status: "queued",
        position: 0,
      });

      const { result } = renderHook(() => useAddTask("2026-05-09"), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ title: "New task" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.post).toHaveBeenCalledWith("/days/2026-05-09/tasks", {
        title: "New task",
      });
    });
  });
});
