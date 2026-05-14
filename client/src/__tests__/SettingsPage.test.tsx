import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import SettingsPage from "../pages/SettingsPage";

const mockMutate = vi.fn();

vi.mock("../api/queries", () => ({
  useSettings: () => ({
    data: {
      focusInterval: 25,
      notificationsEnabled: true,
      taskOverflow: "keep",
      autoPopulate: true,
    },
  }),
  useUpdateSettings: () => ({ mutate: mockMutate }),
  useTemplates: () => ({ data: { templates: [] } }),
  useAddTemplate: () => ({ mutate: vi.fn() }),
  useUpdateTemplate: () => ({ mutate: vi.fn() }),
  useDeleteTemplate: () => ({ mutate: vi.fn() }),
  useReorderTemplates: () => ({ mutate: vi.fn() }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("SettingsPage", () => {
  it("should render focus interval with current value", () => {
    render(<SettingsPage />, { wrapper });
    expect(screen.getByLabelText("Default task duration")).toHaveValue(25);
  });

  it("should render notification toggle", () => {
    render(<SettingsPage />, { wrapper });
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("should render quick-pick chips", () => {
    render(<SettingsPage />, { wrapper });
    expect(screen.getByText("10 min")).toBeInTheDocument();
    expect(screen.getByText("25 min")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();
  });

  it("should call mutate when focus interval input changes", () => {
    render(<SettingsPage />, { wrapper });

    const input = screen.getByLabelText("Default task duration");
    fireEvent.change(input, { target: { value: "30" } });

    expect(mockMutate).toHaveBeenCalledWith({ focusInterval: 30 });
  });

  it("should call mutate when clicking a quick-pick chip", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />, { wrapper });

    await user.click(screen.getByText("45 min"));
    expect(mockMutate).toHaveBeenCalledWith({ focusInterval: 45 });
  });
});
