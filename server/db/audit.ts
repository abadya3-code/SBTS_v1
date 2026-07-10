import crypto from "crypto";
import { and, desc, eq, like, or } from "drizzle-orm";
import { auditEvents } from "../../drizzle/schema";
import { requireDb } from "./core";

type AuditActor = {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
} | null | undefined;

export type AuditEventInput = {
  actor?: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function safeJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ serializationError: true });
  }
}

function buildHash(input: {
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  previousHash?: string | null;
  createdAt: Date;
}) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

export async function logAuditEvent(input: AuditEventInput) {
  const db = await requireDb();
  const latest = await db
    .select({ hash: auditEvents.hash })
    .from(auditEvents)
    .orderBy(desc(auditEvents.createdAt))
    .limit(1);

  const createdAt = new Date();
  const beforeJson = safeJson(input.before);
  const afterJson = safeJson(input.after);
  const previousHash = latest[0]?.hash ?? null;
  const hash = buildHash({
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    beforeJson,
    afterJson,
    previousHash,
    createdAt,
  });

  await db.insert(auditEvents).values({
    actorOpenId: input.actor?.openId ?? null,
    actorName: input.actor?.name ?? input.actor?.email ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    beforeJson,
    afterJson,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    previousHash,
    hash,
    createdAt,
  });

  return { hash, previousHash, createdAt };
}

export async function getAuditEvents(input?: {
  limit?: number;
  offset?: number;
  entityType?: string;
  action?: string;
  search?: string;
}) {
  const db = await requireDb();
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 200);
  const offset = Math.max(input?.offset ?? 0, 0);

  const whereParts = [];
  if (input?.entityType && input.entityType !== "all") {
    whereParts.push(eq(auditEvents.entityType, input.entityType));
  }
  if (input?.action && input.action !== "all") {
    whereParts.push(eq(auditEvents.action, input.action));
  }
  if (input?.search?.trim()) {
    const pattern = `%${input.search.trim()}%`;
    whereParts.push(or(
      like(auditEvents.action, pattern),
      like(auditEvents.entityType, pattern),
      like(auditEvents.entityId, pattern),
      like(auditEvents.actorName, pattern),
    ));
  }

  const whereClause = whereParts.length === 0 ? undefined : and(...whereParts);

  const baseQuery = db.select().from(auditEvents);
  const rows = whereClause
    ? await baseQuery.where(whereClause as any).orderBy(desc(auditEvents.createdAt)).limit(limit).offset(offset)
    : await baseQuery.orderBy(desc(auditEvents.createdAt)).limit(limit).offset(offset);

  return {
    rows,
    limit,
    offset,
    hasMore: rows.length === limit,
  };
}

export async function getAuditSummary() {
  const db = await requireDb();
  const rows = await db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(500);
  const byAction: Record<string, number> = {};
  const byEntityType: Record<string, number> = {};
  for (const row of rows) {
    byAction[row.action] = (byAction[row.action] ?? 0) + 1;
    byEntityType[row.entityType] = (byEntityType[row.entityType] ?? 0) + 1;
  }
  return {
    sampledEvents: rows.length,
    latestEventAt: rows[0]?.createdAt ?? null,
    byAction,
    byEntityType,
  };
}
