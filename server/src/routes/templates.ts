import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validation";
import * as templatesService from "../services/templates";

const router = Router();

router.use(authMiddleware);

const createSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  durationMin: z.number().int().min(1).max(480),
  session: z.enum(["day", "night"]),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional().or(z.literal("")).optional(),
  durationMin: z.number().int().min(1).max(480).optional(),
  session: z.enum(["day", "night"]).optional(),
});

const reorderSchema = z.object({
  session: z.enum(["day", "night"]),
  templateIds: z.array(z.string()).min(1),
});

router.get("/", async (req: AuthRequest, res: Response) => {
  const templates = await templatesService.getTemplates(req.userId!);
  res.json({ templates });
});

router.post(
  "/",
  validate(createSchema),
  async (req: AuthRequest, res: Response) => {
    const template = await templatesService.addTemplate(req.userId!, {
      ...req.body,
      url: req.body.url || undefined,
    });
    res.status(201).json(template);
  },
);

router.patch(
  "/:templateId",
  validate(updateSchema),
  async (req: AuthRequest, res: Response) => {
    const template = await templatesService.updateTemplate(
      req.params.templateId,
      { ...req.body, url: req.body.url || undefined },
    );
    res.json(template);
  },
);

router.delete("/:templateId", async (req: AuthRequest, res: Response) => {
  await templatesService.deleteTemplate(req.params.templateId);
  res.json({ ok: true });
});

router.patch(
  "/reorder",
  validate(reorderSchema),
  async (req: AuthRequest, res: Response) => {
    const templates = await templatesService.reorderTemplates(
      req.userId!,
      req.body.session,
      req.body.templateIds,
    );
    res.json(templates);
  },
);

export default router;
