import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import * as daysService from "../services/days";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  const month = req.query.month as string;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({ error: "Month must be YYYY-MM format" });
    return;
  }

  const days = await daysService.getDaysByMonth(req.userId!, month);
  res.json({
    days: days.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      taskCount: d.tasks.length,
    })),
  });
});

router.get(
  "/:date",
  async (req: AuthRequest<{ date: string }>, res: Response) => {
    const day = await daysService.getDayByDate(req.userId!, req.params.date);
    res.json({
      ...day,
      date: day.date.toISOString().slice(0, 10),
      tasks: day.tasks.map((t) => ({ ...t })),
    });
  },
);

router.post(
  "/:date",
  async (req: AuthRequest<{ date: string }>, res: Response) => {
    const result = await daysService.createDay(req.userId!, req.params.date);

    if ("error" in result) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(201).json(result);
  },
);

export default router;
