import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./ApiClientProvider";

interface MonthDay {
  date: string;
  taskCount: number;
  totalMinutes?: number;
}

interface Session {
  id: string;
  startTime: string;
  endTime: string | null;
  status: "running" | "completed";
}

interface DayTask {
  id: string;
  title: string;
  status: "queued" | "active" | "completed";
  position: number;
  url: string | null;
  durationMin: number;
  session: "day" | "night";
  sessions: Session[];
}

interface DayData {
  date: string;
  tasks: DayTask[];
}

interface SettingsData {
  focusInterval: number;
  notificationsEnabled: boolean;
  taskOverflow: string;
  autoPopulate: boolean;
}

interface TemplateItem {
  id: string;
  title: string;
  url: string | null;
  durationMin: number;
  session: "day" | "night";
  position: number;
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
    mutationFn: (body: { title: string; durationMin?: number }) =>
      api.post(`/days/${date}/tasks`, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["day", date] });
      const previous = queryClient.getQueryData<DayData>(["day", date]);
      if (previous) {
        const tempTask: DayTask = {
          id: `temp-${Date.now()}`,
          title: body.title,
          status: "queued",
          position: previous.tasks.length,
          url: null,
          durationMin: body.durationMin ?? 25,
          session: "day",
          sessions: [],
        };
        queryClient.setQueryData<DayData>(["day", date], {
          ...previous,
          tasks: [...previous.tasks, tempTask],
        });
      }
      return { previous };
    },
    onError: (_err, _body, context) => {
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
    onMutate: async (taskIds) => {
      await queryClient.cancelQueries({ queryKey: ["day", date] });
      const previous = queryClient.getQueryData<DayData>(["day", date]);
      if (previous) {
        const reordered = taskIds
          .map((id, index) => {
            const task = previous.tasks.find((t) => t.id === id);
            return task ? { ...task, position: index } : null;
          })
          .filter((t): t is DayTask => t !== null);
        queryClient.setQueryData<DayData>(["day", date], {
          ...previous,
          tasks: reordered,
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
    },
  });
}

export function useTemplates() {
  const api = useApi();
  return useQuery<{ templates: TemplateItem[] }>({
    queryKey: ["templates"],
    queryFn: () => api.get("/templates"),
  });
}

export function useAddTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      title: string;
      url?: string;
      durationMin: number;
      session: "day" | "night";
    }) => api.post("/templates", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      body,
    }: {
      templateId: string;
      body: {
        title?: string;
        url?: string;
        durationMin?: number;
        session?: "day" | "night";
      };
    }) => api.patch(`/templates/${templateId}`, body),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDeleteTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => api.delete(`/templates/${templateId}`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useReorderTemplates() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { session: "day" | "night"; templateIds: string[] }) =>
      api.patch("/templates/reorder", body),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
