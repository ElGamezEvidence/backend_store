import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./lib/env";
import authRoutes from "./routes/auth.routes";
import productsRoutes from "./routes/products.routes";
import ordersRoutes from "./routes/orders.routes";
import catalogRoutes from "./routes/catalog.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  const allowedOrigins = env.corsOrigin
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const ok =
          allowedOrigins.includes(origin) ||
          /\.pages\.dev$/i.test(origin) ||
          /\.workers\.dev$/i.test(origin);
        return callback(null, ok);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "8mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "backend_store" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api", catalogRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "NOT_FOUND" });
  });

  return app;
}
