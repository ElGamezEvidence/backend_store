import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAuth, signToken } from "../lib/auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_CREDENTIALS" });
    return;
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    res.status(401).json({ error: "INVALID_CREDENTIALS" });
    return;
  }

  const token = signToken(user);
  res.json({ token, user });
});

router.get("/me", requireAuth, (req, res) => {
  const user = (req as typeof req & { user: unknown }).user;
  res.json({ user });
});

export default router;
