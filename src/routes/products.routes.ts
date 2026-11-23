import { Router } from "express";
import { productsService } from "../services/products.service";
import { requireAdmin } from "../lib/auth";
import { param, queryString } from "../lib/params";
import { productSchema } from "../validations/product";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const wantsAll = queryString(req, "status") === "all";
    if (wantsAll) {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "UNAUTHORIZED" });
        return;
      }
    }

    const result = await productsService.list({
      status: wantsAll ? undefined : "ACTIVE",
      query: queryString(req, "q"),
      categorySlug: queryString(req, "category"),
      featured: queryString(req, "featured") === "1",
      popular: queryString(req, "popular") === "1",
      onSale: queryString(req, "onSale") === "1",
      page: Number(queryString(req, "page") || 1),
      pageSize: Number(queryString(req, "pageSize") || 12),
      sort: (queryString(req, "sort") as never) || "newest",
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
  const product = await productsService.getBySlug(param(req, "slug"));
  if (!product || product.status !== "ACTIVE") {
    res.status(404).json({ error: "NOT_FOUND" });
    return;
  }
  res.json(product);
});

router.get("/:id", requireAdmin, async (req, res) => {
  const product = await productsService.getById(param(req, "id"));
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
    const product = await productsService.update(param(req, "id"), data);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "ERROR" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await productsService.archive(param(req, "id"));
  res.json({ ok: true });
});

export default router;
