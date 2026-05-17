import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskItem, { type TaskItemProps } from "../components/playlist/TaskItem";

function createTask(overrides: Partial<TaskItemProps["task"]> = {}) {
  return {
    id: "t1",
    title: "Study React patterns",
    status: "queued" as TaskItemProps["task"]["status"],
    position: 0,
    url: null,
    durationMin: 25,
    session: "day" as const,
    ...overrides,
  };
}

describe("TaskItem", () => {
  const defaultProps = {
    task: createTask(),
    onStart: vi.fn(),
    onPause: vi.fn(),
    onComplete: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should render task title", () => {
    render(<TaskItem {...defaultProps} />);
    expect(screen.getByText("Study React patterns")).toBeInTheDocument();
  });

  it("should show drag handle", () => {
    render(<TaskItem {...defaultProps} />);
    expect(screen.getByLabelText("Drag to reorder")).toBeInTheDocument();
  });

  it("should show start button for queued task", () => {
    render(<TaskItem {...defaultProps} />);
    expect(screen.getByLabelText("Start task")).toBeInTheDocument();
  });

  it("should call onStart when start button clicked", async () => {
    const user = userEvent.setup();
    render(<TaskItem {...defaultProps} />);
    await user.click(screen.getByLabelText("Start task"));
    expect(defaultProps.onStart).toHaveBeenCalled();
  });

  it("should show pause button for active task", () => {
    render(
      <TaskItem {...defaultProps} task={createTask({ status: "active" })} />,
    );
    expect(screen.getByLabelText("Pause task")).toBeInTheDocument();
  });

  it("should show pause and delete buttons for active task", () => {
    render(
      <TaskItem {...defaultProps} task={createTask({ status: "active" })} />,
    );
    expect(screen.getByLabelText("Pause task")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete task")).toBeInTheDocument();
  });

  it("should call onPause when pause button clicked", async () => {
    const user = userEvent.setup();
    render(
      <TaskItem {...defaultProps} task={createTask({ status: "active" })} />,
    );
    await user.click(screen.getByLabelText("Pause task"));
    expect(defaultProps.onPause).toHaveBeenCalled();
  });

  it("should show completed state styling", () => {
    render(
      <TaskItem {...defaultProps} task={createTask({ status: "completed" })} />,
    );
    expect(screen.getByText("Study React patterns")).toHaveClass(
      "line-through",
    );
  });

  it("should call onDelete when delete button clicked", async () => {
    const user = userEvent.setup();
    render(
      <TaskItem {...defaultProps} task={createTask({ status: "active" })} />,
    );
    await user.click(screen.getByLabelText("Delete task"));
    expect(defaultProps.onDelete).toHaveBeenCalled();
  });
});
