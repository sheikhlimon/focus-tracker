import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./ApiClientProvider";

export function useMonth(month: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["month", month],
    queryFn: () => api.get(`/days?month=${month}`),
  });
}

export function useDay(date: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["day", date],
    queryFn: () => api.get(`/days/${date}`),
  });
}

export function useSettings() {
  const api = useApi();
  return useQuery({
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
