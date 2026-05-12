import express from "express";
import cors from "cors";
import daysRoutes from "./routes/days";
import tasksRoutes from "./routes/tasks";
import sessionsRoutes from "./routes/sessions";
import settingsRoutes from "./routes/settings";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/days", daysRoutes);
  app.use("/api/days/:date/tasks", tasksRoutes);
  app.use("/api/sessions", sessionsRoutes);
  app.use("/api/settings", settingsRoutes);

  app.use(errorHandler);

  return app;
}

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== "test") {
  const app = createApp();
  app.listen(PORT, () => {
    console.warn(`Server running on port ${PORT}`);
  });
}
