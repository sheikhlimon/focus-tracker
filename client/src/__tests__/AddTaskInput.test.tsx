import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddTaskInput from "../components/playlist/AddTaskInput";

describe("AddTaskInput", () => {
  it("should render input and button", () => {
    render(<AddTaskInput onAdd={vi.fn()} defaultDuration={25} />);
    expect(screen.getByPlaceholderText("Add a task...")).toBeInTheDocument();
    expect(screen.getByLabelText("Add task")).toBeInTheDocument();
  });

  it("should call onAdd with task title when submitted", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddTaskInput onAdd={onAdd} defaultDuration={25} />);

    await user.type(
      screen.getByPlaceholderText("Add a task..."),
      "Study React",
    );
    await user.click(screen.getByLabelText("Add task"));

    expect(onAdd).toHaveBeenCalledWith("Study React", 25);
  });

  it("should call onAdd when Enter is pressed", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddTaskInput onAdd={onAdd} defaultDuration={25} />);

    await user.type(
      screen.getByPlaceholderText("Add a task..."),
      "Study React{Enter}",
    );

    expect(onAdd).toHaveBeenCalledWith("Study React", 25);
  });

  it("should clear input after submitting", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddTaskInput onAdd={onAdd} defaultDuration={25} />);

    const input = screen.getByPlaceholderText("Add a task...");
    await user.type(input, "Study React");
    await user.click(screen.getByLabelText("Add task"));

    expect(input).toHaveValue("");
  });

  it("should not submit empty input", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddTaskInput onAdd={onAdd} defaultDuration={25} />);

    await user.click(screen.getByLabelText("Add task"));

    expect(onAdd).not.toHaveBeenCalled();
  });
});
