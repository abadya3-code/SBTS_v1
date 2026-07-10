import type { NextFunction, Request, Response } from "express";

const jsonLimit = 1_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientKey(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "unknown";
  return `${ip}:${req.path}`;
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
}

export function apiRateLimit(options: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = clientKey(req);
    const current = buckets.get(key);
    const bucket = current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + options.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }

    if (buckets.size > jsonLimit) {
      for (const [bucketKey, value] of buckets.entries()) {
        if (value.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    next();
  };
}


export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    if (req.path.startsWith("/api/trpc")) {
      console.info(JSON.stringify({
        type: "http_request",
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
      }));
    }
  });
  next();
}
