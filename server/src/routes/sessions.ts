import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validation";
import * as sessionsService from "../services/sessions";

const router = Router();

router.use(authMiddleware);

const startSchema = z.object({
  taskId: z.string().min(1),
});

const actionSchema = z.object({
  action: z.enum(["pause", "resume"]),
});

router.post(
  "/",
  validate(startSchema),
  async (req: AuthRequest, res: Response) => {
    const session = await sessionsService.startSession(req.body.taskId);
    res.status(201).json(session);
  },
);

router.patch(
  "/:sessionId",
  validate(actionSchema),
  async (req: AuthRequest, res: Response) => {
    const action = req.body.action;
    let session;

    if (action === "pause") {
      session = await sessionsService.pauseSession(req.params.sessionId);
    } else {
      session = await sessionsService.resumeSession(req.params.sessionId);
    }

    res.json(session);
  },
);

router.patch(
  "/:sessionId/complete",
  async (req: AuthRequest, res: Response) => {
    const session = await sessionsService.completeSession(req.params.sessionId);
    res.json(session);
  },
);

export default router;
