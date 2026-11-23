import type { Request } from "express";

/** Normalize Express route params to a single string (Express 5 typings). */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function queryString(req: Request, name: string): string | undefined {
  const value = req.query[name];
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
  return typeof value === "string" ? value : undefined;
}
