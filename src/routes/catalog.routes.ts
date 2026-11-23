import { Router } from "express";
import { prisma } from "../lib/prisma";
import { shippingService } from "../services/shipping.service";
import { settingsService } from "../services/settings.service";
import { customersService } from "../services/customers.service";
import { analyticsService } from "../services/analytics.service";
import { requireAdmin } from "../lib/auth";
import { toNumber } from "../lib/money";

const router = Router();

router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  res.json(categories);
});

router.get("/shipping/zones", async (_req, res) => {
  const zones = await shippingService.listZones();
  res.json(
    zones.map((z) => ({
      id: z.id,
      region: z.region,
      city: z.city,
      homeDeliveryFee: toNumber(z.homeDeliveryFee),
      pickupPointFee: z.pickupPointFee != null ? toNumber(z.pickupPointFee) : null,
      pickupAvailable: z.pickupAvailable,
      estimatedDaysMin: z.estimatedDaysMin,
      estimatedDaysMax: z.estimatedDaysMax,
    })),
  );
});

router.get("/shipping/quote", async (req, res) => {
  try {
    const region = String(req.query.region || "");
    const city = String(req.query.city || "");
    const shippingType = String(req.query.shippingType || "HOME") as "HOME" | "PICKUP_POINT";
    const quote = await shippingService.calculateFee(region, city, shippingType);
    res.json({
      fee: quote.fee,
      estimatedDaysMin: quote.estimatedDaysMin,
      estimatedDaysMax: quote.estimatedDaysMax,
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

router.get("/settings", async (_req, res) => {
  const settings = await settingsService.get();
  res.json(settings);
});

router.put("/settings", requireAdmin, async (req, res) => {
  const settings = await settingsService.update(req.body);
  res.json(settings);
});

router.get("/analytics/dashboard", requireAdmin, async (req, res) => {
  const range = (req.query.range as "today" | "7d" | "30d" | "month") || "30d";
  const data = await analyticsService.getDashboard(range);
  res.json(data);
});

router.get("/customers", requireAdmin, async (req, res) => {
  const result = await customersService.list(
    Number(req.query.page || 1),
    Number(req.query.pageSize || 20),
    req.query.q as string | undefined,
  );
  res.json(result);
});

router.get("/reviews", requireAdmin, async (_req, res) => {
  const reviews = await prisma.review.findMany({
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(reviews);
});

router.patch("/reviews/:id", requireAdmin, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const review = await prisma.review.update({
    where: { id },
    data: {
      status: req.body.status,
      moderatedAt: new Date(),
    },
  });
  res.json(review);
});

router.get("/shipping/zones/admin", requireAdmin, async (_req, res) => {
  const zones = await prisma.shippingZone.findMany({
    orderBy: [{ region: "asc" }, { city: "asc" }],
  });
  res.json(zones);
});

router.post("/shipping/zones", requireAdmin, async (req, res) => {
  const zone = await prisma.shippingZone.create({
    data: {
      region: String(req.body.region),
      city: String(req.body.city),
      homeDeliveryFee: Number(req.body.homeDeliveryFee),
      pickupPointFee:
        req.body.pickupPointFee != null && req.body.pickupPointFee !== ""
          ? Number(req.body.pickupPointFee)
          : null,
      pickupAvailable: Boolean(req.body.pickupAvailable),
      isActive: true,
    },
  });
  res.status(201).json(zone);
});

router.get("/users", requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  res.json(users);
});

export default router;
