import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./ApiClientProvider";

interface MonthDay {
  date: string;
  taskCount: number;
  totalMinutes?: number;
}

interface DayTask {
  id: string;
  title: string;
  status: "queued" | "active" | "completed";
  position: number;
}

interface DayData {
  date: string;
  tasks: DayTask[];
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

export function useUpdateSettings() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Partial<SettingsData>) => api.patch("/settings", body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["settings"] });
      const previous = queryClient.getQueryData<SettingsData>(["settings"]);
      if (previous) {
        queryClient.setQueryData(["settings"], { ...previous, ...body });
      }
      return { previous };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["settings"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useAddTask(date: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const month = date.slice(0, 7);

  return useMutation({
    mutationFn: (body: { title: string }) =>
      api.post(`/days/${date}/tasks`, body),
    onSuccess: (newTask) => {
      queryClient.setQueryData<DayData>(["day", date], (old) => {
        if (!old) return old;
        return { ...old, tasks: [...old.tasks, newTask as DayTask] };
      });
      queryClient.invalidateQueries({ queryKey: ["month", month] });
    },
  });
}

export function useUpdateTask(date: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const month = date.slice(0, 7);

  return useMutation({
    mutationFn: ({
      taskId,
      body,
    }: {
      taskId: string;
      body: { title?: string; status?: string };
    }) => api.patch(`/days/${date}/tasks/${taskId}`, body),
    onMutate: async ({ taskId, body }) => {
      await queryClient.cancelQueries({ queryKey: ["day", date] });
      const previous = queryClient.getQueryData<DayData>(["day", date]);
      if (previous) {
        queryClient.setQueryData<DayData>(["day", date], {
          ...previous,
          tasks: previous.tasks.map((t) =>
            t.id === taskId ? ({ ...t, ...body } as DayTask) : t,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["day", date], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["day", date] });
      queryClient.invalidateQueries({ queryKey: ["month", month] });
    },
  });
}

export function useDeleteTask(date: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const month = date.slice(0, 7);

  return useMutation({
    mutationFn: (taskId: string) => api.delete(`/days/${date}/tasks/${taskId}`),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["day", date] });
      const previous = queryClient.getQueryData<DayData>(["day", date]);
      if (previous) {
        queryClient.setQueryData<DayData>(["day", date], {
          ...previous,
          tasks: previous.tasks.filter((t) => t.id !== taskId),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["day", date], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["day", date] });
      queryClient.invalidateQueries({ queryKey: ["month", month] });
    },
  });
}

export function useReorderTasks(date: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskIds: string[]) =>
      api.patch(`/days/${date}/tasks/reorder`, { taskIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day", date] });
    },
  });
}
