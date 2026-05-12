import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { createApiClient } from "./client";

import type { ApiClient } from "./client";

const ApiClientContext = createContext<ApiClient>(null!);

export function ApiClientProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient({ getToken }), [getToken]);

  return (
    <ApiClientContext.Provider value={api}>
      {children}
    </ApiClientContext.Provider>
  );
}

export function useApi() {
  const api = useContext(ApiClientContext);
  if (!api) {
    throw new Error("useApi must be used within ApiClientProvider");
  }
  return api;
}
