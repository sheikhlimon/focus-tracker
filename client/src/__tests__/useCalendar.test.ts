import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalendar } from "../hooks/useCalendar";

describe("useCalendar", () => {
  it("should generate days for the current month", () => {
    const { result } = renderHook(() => useCalendar("2026-05"));

    const days = result.current.days;

    // May 2026 starts on Friday (index 5, 0-indexed from Sunday)
    expect(days[0]).toEqual({ date: "2026-04-26", isCurrentMonth: false });
    expect(days[5]).toEqual({ date: "2026-05-01", isCurrentMonth: true });
    expect(days[35]).toEqual({ date: "2026-05-31", isCurrentMonth: true });
  });

  it("should generate a 6-row grid (42 days)", () => {
    const { result } = renderHook(() => useCalendar("2026-05"));
    expect(result.current.days).toHaveLength(42);
  });

  it("should return the current month label", () => {
    const { result } = renderHook(() => useCalendar("2026-05"));
    expect(result.current.label).toBe("May 2026");
  });

  it("should navigate to next month", () => {
    const { result } = renderHook(() => useCalendar("2026-05"));

    act(() => {
      result.current.nextMonth();
    });

    expect(result.current.month).toBe("2026-06");
    expect(result.current.label).toBe("June 2026");
  });

  it("should navigate to previous month", () => {
    const { result } = renderHook(() => useCalendar("2026-05"));

    act(() => {
      result.current.prevMonth();
    });

    expect(result.current.month).toBe("2026-04");
    expect(result.current.label).toBe("April 2026");
  });

  it("should handle year boundary going backwards", () => {
    const { result } = renderHook(() => useCalendar("2026-01"));

    act(() => {
      result.current.prevMonth();
    });

    expect(result.current.month).toBe("2025-12");
    expect(result.current.label).toBe("December 2025");
  });

  it("should handle year boundary going forwards", () => {
    const { result } = renderHook(() => useCalendar("2025-12"));

    act(() => {
      result.current.nextMonth();
    });

    expect(result.current.month).toBe("2026-01");
    expect(result.current.label).toBe("January 2026");
  });
});
