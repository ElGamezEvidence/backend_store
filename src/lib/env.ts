import "dotenv/config";

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL", "postgresql://USER:PASSWORD@HOST/DB?sslmode=require"),
  jwtSecret: required("JWT_SECRET", "dev-only-change-me-backend-store-secret"),
  corsOrigin: [
    ...(process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),
    "https://myfrontstor.netlify.app",
    "https://yoursouk.netlify.app",
    "http://localhost:3000",
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(","),
  nodeEnv: process.env.NODE_ENV ?? "development",
};
