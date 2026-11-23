import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { OrderStatus } from "@prisma/client";
import { ordersService } from "../services/orders.service";
import { ordersExportService } from "../services/orders-export.service";
import { requireAdmin } from "../lib/auth";
import type { AuthUser } from "../lib/auth";
import { param, queryString } from "../lib/params";
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
    res.status(400).json({ error: message });
  }
});

router.get("/confirmation/:orderNumber", async (req, res) => {
  const order = await ordersService.getByNumber(param(req, "orderNumber"));
  if (!order) {
    res.status(404).json({ error: "NOT_FOUND" });
    return;
  }
  res.json(order);
});

router.get("/export/excel", requireAdmin, async (req, res) => {
  try {
    const buffer = await ordersExportService.exportExcel({
      status: queryString(req, "status") as OrderStatus | undefined,
      query: queryString(req, "q"),
      pendingTajir: queryString(req, "pendingTajir") === "1",
    });

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="orders_export_${stamp}.xlsx"`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "EXPORT_FAILED" });
  }
});

router.get("/", requireAdmin, async (req, res) => {
  const result = await ordersService.list({
    status: queryString(req, "status") as OrderStatus | undefined,
    query: queryString(req, "q"),
    city: queryString(req, "city"),
    phone: queryString(req, "phone"),
    sku: queryString(req, "sku"),
    pendingTajir: queryString(req, "pendingTajir") === "1",
    page: Number(queryString(req, "page") || 1),
    pageSize: Number(queryString(req, "pageSize") || 20),
  });
  res.json(result);
});

router.get("/:id", requireAdmin, async (req, res) => {
  const order = await ordersService.getById(param(req, "id"));
  if (!order) {
    res.status(404).json({ error: "NOT_FOUND" });
    return;
  }
  res.json(order);
});

router.get("/:id/tajir-copy", requireAdmin, async (req, res) => {
  try {
    const text = await ordersService.getTajirCopyText(param(req, "id"));
    res.json({ text });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const user = (req as typeof req & { user: AuthUser }).user;
    const order = await ordersService.updateStatus({
      orderId: param(req, "id"),
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
      param(req, "id"),
      String(req.body.reference ?? ""),
      user.id,
    );
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

export default router;
