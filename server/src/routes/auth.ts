import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validation";
import * as authService from "../services/auth";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/signup", validate(signupSchema), async (req, res) => {
  const result = await authService.signup(
    req.body.email,
    req.body.name,
    req.body.password,
  );

  if ("error" in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(201).json(result);
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);

  if ("error" in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(200).json(result);
});

export default router;
