import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlaylistHeader from "../components/playlist/PlaylistHeader";

describe("PlaylistHeader", () => {
  it("should display formatted date", () => {
    render(<PlaylistHeader date="2026-05-12" taskCount={3} onBack={vi.fn()} />);
    expect(screen.getByText(/May 12, 2026/i)).toBeInTheDocument();
  });

  it("should display task count", () => {
    render(<PlaylistHeader date="2026-05-12" taskCount={3} onBack={vi.fn()} />);
    expect(screen.getByText("3 tasks")).toBeInTheDocument();
  });

  it("should show singular task for count of 1", () => {
    render(<PlaylistHeader date="2026-05-12" taskCount={1} onBack={vi.fn()} />);
    expect(screen.getByText("1 task")).toBeInTheDocument();
  });

  it("should call onBack when back button clicked", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<PlaylistHeader date="2026-05-12" taskCount={0} onBack={onBack} />);
    await user.click(screen.getByLabelText("Back to calendar"));
    expect(onBack).toHaveBeenCalled();
  });
});
