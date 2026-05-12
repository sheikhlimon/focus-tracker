import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export function useMonth(month: string) {
  return useQuery({
    queryKey: ["month", month],
    queryFn: () => api.get(`/days?month=${month}`),
  });
}

export function useDay(date: string) {
  return useQuery({
    queryKey: ["day", date],
    queryFn: () => api.get(`/days/${date}`),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings"),
  });
}

export function useAddTask(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { title: string }) =>
      api.post(`/days/${date}/tasks`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day", date] });
    },
  });
}
