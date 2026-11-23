import { Router } from "express";
import { productsService } from "../services/products.service";
import { requireAdmin } from "../lib/auth";
import { productSchema } from "../validations/product";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const wantsAll = req.query.status === "all";
    if (wantsAll) {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "UNAUTHORIZED" });
        return;
      }
    }

    const result = await productsService.list({
      status: wantsAll ? undefined : "ACTIVE",
      query: req.query.q as string | undefined,
      categorySlug: req.query.category as string | undefined,
      featured: req.query.featured === "1",
      popular: req.query.popular === "1",
      onSale: req.query.onSale === "1",
      page: Number(req.query.page || 1),
      pageSize: Number(req.query.pageSize || 12),
      sort: (req.query.sort as never) || "newest",
    });

    if (wantsAll) {
      return requireAdmin(req, res, () => {
        res.json(result);
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

router.get("/slug/:slug", async (req, res) => {
  const product = await productsService.getBySlug(req.params.slug);
  if (!product || product.status !== "ACTIVE") {
    res.status(404).json({ error: "NOT_FOUND" });
    return;
  }
  res.json(product);
});

router.get("/:id", requireAdmin, async (req, res) => {
  const product = await productsService.getById(req.params.id);
  if (!product) {
    res.status(404).json({ error: "NOT_FOUND" });
    return;
  }
  res.json(product);
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await productsService.create(data);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await productsService.update(req.params.id, data);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await productsService.archive(req.params.id);
  res.json({ ok: true });
});

export default router;
