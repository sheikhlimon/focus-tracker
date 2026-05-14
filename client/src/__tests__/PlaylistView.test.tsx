import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import PlaylistView from "../components/playlist/PlaylistView";

// Mock the API hooks
const mockAddTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();
const mockReorderTasks = vi.fn();

vi.mock("../api/queries", () => ({
  useDay: () => ({
    data: {
      date: "2026-05-12",
      tasks: [
        {
          id: "t1",
          title: "Study React",
          status: "queued",
          position: 0,
          url: null,
          durationMin: 25,
          session: "day",
          sessions: [],
        },
        {
          id: "t2",
          title: "Build API",
          status: "active",
          position: 1,
          url: null,
          durationMin: 25,
          session: "day",
          sessions: [],
        },
        {
          id: "t3",
          title: "Write tests",
          status: "completed",
          position: 2,
          url: null,
          durationMin: 25,
          session: "day",
          sessions: [],
        },
      ],
    },
    isLoading: false,
  }),
  useSettings: () => ({
    data: {
      focusInterval: 25,
      notificationsEnabled: true,
      taskOverflow: "keep",
      autoPopulate: true,
    },
  }),
  useAddTask: () => ({ mutate: mockAddTask }),
  useUpdateTask: () => ({ mutate: mockUpdateTask }),
  useDeleteTask: () => ({ mutate: mockDeleteTask }),
  useReorderTasks: () => ({ mutate: mockReorderTasks }),
}));

vi.mock("../hooks/useNotification", () => ({
  default: () => ({ requestPermission: vi.fn(), notify: vi.fn() }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ date: "2026-05-12" }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("PlaylistView", () => {
  it("should render the date header", () => {
    render(<PlaylistView />, { wrapper });
    expect(screen.getByText(/May 12, 2026/i)).toBeInTheDocument();
  });

  it("should render all task titles", () => {
    render(<PlaylistView />, { wrapper });
    expect(screen.getByText("Study React")).toBeInTheDocument();
    expect(screen.getByText("Build API")).toBeInTheDocument();
    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });

  it("should show task count in header", () => {
    render(<PlaylistView />, { wrapper });
    expect(screen.getByText("3 tasks")).toBeInTheDocument();
  });

  it("should render the add task input", () => {
    render(<PlaylistView />, { wrapper });
    expect(screen.getByPlaceholderText("Add a task...")).toBeInTheDocument();
  });

  it("should call addTask mutation when task is submitted", async () => {
    const user = userEvent.setup();
    render(<PlaylistView />, { wrapper });

    await user.type(
      screen.getByPlaceholderText("Add a task..."),
      "New task{Enter}",
    );
    expect(mockAddTask).toHaveBeenCalledWith({
      title: "New task",
      durationMin: 25,
    });
  });

  it("should navigate back to calendar on back click", async () => {
    const user = userEvent.setup();
    render(<PlaylistView />, { wrapper });

    await user.click(screen.getByLabelText("Back to calendar"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
