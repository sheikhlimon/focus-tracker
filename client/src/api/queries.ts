import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./ApiClientProvider";

interface MonthDay {
  date: string;
  taskCount: number;
  totalMinutes?: number;
}

interface DayData {
  date: string;
  tasks: {
    id: number;
    title: string;
    status: "queued" | "active" | "completed";
    position: number;
  }[];
}

interface SettingsData {
  focusInterval: number;
  notificationsEnabled: boolean;
  taskOverflow: string;
}

export function useMonth(month: string) {
  const api = useApi();
  return useQuery<{ days: MonthDay[] }>({
    queryKey: ["month", month],
    queryFn: () => api.get(`/days?month=${month}`),
  });
}

export function useDay(date: string) {
  const api = useApi();
  return useQuery<DayData>({
    queryKey: ["day", date],
    queryFn: () => api.get(`/days/${date}`),
  });
}

export function useSettings() {
  const api = useApi();
  return useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings"),
  });
}

export function useAddTask(date: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { title: string }) =>
      api.post(`/days/${date}/tasks`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day", date] });
    },
  });
}

export function useUpdateTask(date: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      body,
    }: {
      taskId: number;
      body: { title?: string; status?: string };
    }) => api.patch(`/days/${date}/tasks/${taskId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day", date] });
    },
  });
}

export function useDeleteTask(date: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => api.delete(`/days/${date}/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day", date] });
    },
  });
}

export function useReorderTasks(date: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskIds: number[]) =>
      api.patch(`/days/${date}/tasks/reorder`, { taskIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day", date] });
    },
  });
}
