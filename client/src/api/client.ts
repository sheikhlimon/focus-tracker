const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ApiClientConfig {
  getToken: () => Promise<string | null>;
}

async function request<T>(
  path: string,
  getToken: () => Promise<string | null>,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  const body = await res.json();

  if (!res.ok) {
    const message = body.errors?.join(", ") || body.error || "Request failed";
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export function createApiClient(config: ApiClientConfig) {
  const { getToken } = config;

  return {
    get: <T>(path: string) => request<T>(path, getToken, { method: "GET" }),

    post: <T>(path: string, body: unknown) =>
      request<T>(path, getToken, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    patch: <T>(path: string, body: unknown) =>
      request<T>(path, getToken, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    delete: <T>(path: string) =>
      request<T>(path, getToken, { method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
export { ApiError };
