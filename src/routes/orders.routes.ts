import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { OrderStatus } from "@prisma/client";
import { ordersService } from "../services/orders.service";
import { requireAdmin } from "../lib/auth";
import type { AuthUser } from "../lib/auth";
import type { CheckoutPayload } from "../types";

const router = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/checkout", checkoutLimiter, async (req, res) => {
  try {
    const order = await ordersService.createFromCheckout(req.body as CheckoutPayload);
    res.status(201).json({
      orderNumber: order.orderNumber,
      orderId: order.id,
      order,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    const status = message.startsWith("VALIDATION") ? 400 : 400;
    res.status(status).json({ error: message });
  }
});

router.get("/confirmation/:orderNumber", async (req, res) => {
  const order = await ordersService.getByNumber(req.params.orderNumber);
  if (!order) {
    res.status(404).json({ error: "NOT_FOUND" });
    return;
  }
  res.json(order);
});

router.get("/", requireAdmin, async (req, res) => {
  const result = await ordersService.list({
    status: req.query.status as OrderStatus | undefined,
    query: req.query.q as string | undefined,
    city: req.query.city as string | undefined,
    phone: req.query.phone as string | undefined,
    sku: req.query.sku as string | undefined,
    pendingTajir: req.query.pendingTajir === "1",
    page: Number(req.query.page || 1),
    pageSize: Number(req.query.pageSize || 20),
  });
  res.json(result);
});

router.get("/:id", requireAdmin, async (req, res) => {
  const order = await ordersService.getById(req.params.id);
  if (!order) {
    res.status(404).json({ error: "NOT_FOUND" });
    return;
  }
  res.json(order);
});

router.get("/:id/tajir-copy", requireAdmin, async (req, res) => {
  try {
    const text = await ordersService.getTajirCopyText(req.params.id);
    res.json({ text });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const user = (req as typeof req & { user: AuthUser }).user;
    const order = await ordersService.updateStatus({
      orderId: req.params.id,
      toStatus: req.body.toStatus as OrderStatus,
      userId: user.id,
      comment: req.body.comment,
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

router.patch("/:id/tajir-reference", requireAdmin, async (req, res) => {
  try {
    const user = (req as typeof req & { user: AuthUser }).user;
    const order = await ordersService.setTajirReference(
      req.params.id,
      String(req.body.reference ?? ""),
      user.id,
    );
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

export default router;
