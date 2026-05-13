import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validation";
import prisma from "../db";

const router = Router();

router.use(authMiddleware);

const updateSchema = z.object({
  focusInterval: z.number().int().min(1).max(120).optional(),
  notificationsEnabled: z.boolean().optional(),
  taskOverflow: z.enum(["keep", "drop", "carry"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  weekStartsOn: z.enum(["monday", "sunday"]).optional(),
});

router.get("/", async (req: AuthRequest, res: Response) => {
  const settings = await prisma.settings.upsert({
    where: { userId: req.userId! },
    update: {},
    create: { userId: req.userId! },
  });

  res.json(settings);
});

router.patch(
  "/",
  validate(updateSchema),
  async (req: AuthRequest, res: Response) => {
    const settings = await prisma.settings.upsert({
      where: { userId: req.userId! },
      update: req.body,
      create: {
        userId: req.userId!,
        ...req.body,
      },
    });

    res.json(settings);
  },
);

export default router;
