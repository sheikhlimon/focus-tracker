import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);

  return app;
}

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== "test") {
  const app = createApp();
  app.listen(PORT, () => {
    console.warn(`Server running on port ${PORT}`);
  });
}
