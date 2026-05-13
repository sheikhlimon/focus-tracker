import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validation";
import * as tasksService from "../services/tasks";
import prisma from "../db";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

const createTaskSchema = z.object({
  title: z.string().min(1),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
});

const reorderSchema = z.object({
  taskIds: z.array(z.string()).min(1),
});

async function getDayId(userId: string, date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dayDate = new Date(Date.UTC(y, m - 1, d));
  const day = await prisma.day.upsert({
    where: { date_userId: { date: dayDate, userId } },
    update: {},
    create: { date: dayDate, userId },
  });
  return day.id;
}

router.post(
  "/",
  validate(createTaskSchema),
  async (req: AuthRequest, res: Response) => {
    const { date } = req.params;
    const dayId = await getDayId(req.userId!, date);
    if (!dayId) {
      res.status(404).json({ error: "Day not found" });
      return;
    }

    const task = await tasksService.addTask(dayId, req.body.title);
    res.status(201).json(task);
  },
);

router.patch(
  "/reorder",
  validate(reorderSchema),
  async (req: AuthRequest, res: Response) => {
    const tasks = await tasksService.reorderTasks(req.body.taskIds);
    res.json(tasks);
  },
);

router.patch(
  "/:taskId",
  validate(updateTaskSchema),
  async (req: AuthRequest, res: Response) => {
    const { taskId, date } = req.params;
    const task = await tasksService.updateTask(taskId, date, req.body);
    res.json(task);
  },
);

router.delete("/:taskId", async (req: AuthRequest, res: Response) => {
  const { taskId } = req.params;
  await tasksService.deleteTask(taskId);
  res.json({ ok: true });
});

export default router;
