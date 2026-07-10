import { z } from "zod";
import { permissionProcedure, router } from "../_core/trpc";
import { logAuditEvent, createDailyProgressReport, createResourcePlanEntry, getDailyProgressReports, getManagementSummary, getResourcePlanEntries, getSlaRules, upsertSlaRule } from "../db";
import { blindPhaseSchema, blindPrioritySchema } from "./shared";

function actorFromContext(ctx: { user: NonNullable<unknown> }) {
  const user = ctx.user as { openId: string; name?: string | null; email?: string | null };
  return { openId: user.openId, name: user.name ?? null, email: user.email ?? null };
}

function requestAuditMeta(ctx: { req: { headers: Record<string, unknown>; ip?: string; socket?: { remoteAddress?: string } } }) {
  const forwardedFor = ctx.req.headers["x-forwarded-for"];
  const ipAddress = typeof forwardedFor === "string"
    ? forwardedFor.split(",")[0]?.trim()
    : Array.isArray(forwardedFor)
      ? String(forwardedFor[0])
      : ctx.req.ip || ctx.req.socket?.remoteAddress || null;
  const userAgent = typeof ctx.req.headers["user-agent"] === "string" ? ctx.req.headers["user-agent"] : null;
  return { ipAddress, userAgent };
}

async function writeAudit(ctx: any, action: string, entityId: string | null, after: unknown) {
  await logAuditEvent({
    actor: ctx.user,
    action,
    entityType: "management",
    entityId,
    after,
    ...requestAuditMeta(ctx),
  }).catch(() => { /* management actions must not fail because audit write failed */ });
}

export const managementRouter = router({
  summary: permissionProcedure("management.view")
    .input(z.object({ days: z.number().int().min(1).max(90).default(14) }).optional())
    .query(async ({ input }) => getManagementSummary(input?.days ?? 14)),

  dailyReports: permissionProcedure("management.view")
    .input(z.object({ limit: z.number().int().min(1).max(100).default(25), projectId: z.string().max(40).nullable().optional() }).optional())
    .query(async ({ input }) => getDailyProgressReports(input ?? undefined)),

  createDailyReport: permissionProcedure("management.manage")
    .input(z.object({
      reportDate: z.coerce.date(),
      shiftName: z.string().min(1).max(120),
      areaCode: z.string().max(80).nullable().optional(),
      projectId: z.string().max(40).nullable().optional(),
      progressSummary: z.string().min(5).max(4000),
      completedCount: z.number().int().min(0).max(100000).default(0),
      inProgressCount: z.number().int().min(0).max(100000).default(0),
      overdueCount: z.number().int().min(0).max(100000).default(0),
      safetyHighlights: z.string().max(3000).nullable().optional(),
      nextPlan: z.string().max(3000).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createDailyProgressReport({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "management.daily_report.create", input.projectId ?? input.areaCode ?? input.shiftName, { reportDate: input.reportDate, projectId: input.projectId });
      return result;
    }),

  resourcePlan: permissionProcedure("management.view")
    .input(z.object({ limit: z.number().int().min(1).max(150).default(50), projectId: z.string().max(40).nullable().optional(), status: z.string().max(80).nullable().optional() }).optional())
    .query(async ({ input }) => getResourcePlanEntries(input ?? undefined)),

  createResourcePlan: permissionProcedure("management.manage")
    .input(z.object({
      projectId: z.string().max(40).nullable().optional(),
      areaCode: z.string().max(80).nullable().optional(),
      resourceType: z.enum(["Manpower", "Equipment", "Material", "Inspection", "Safety", "Support"]),
      resourceName: z.string().min(1).max(200),
      requiredQty: z.number().int().min(0).max(100000),
      availableQty: z.number().int().min(0).max(100000),
      unit: z.string().min(1).max(40).default("each"),
      shiftName: z.string().max(120).nullable().optional(),
      needDate: z.coerce.date().nullable().optional(),
      status: z.enum(["Planned", "Available", "At Risk", "Shortage", "Delayed", "Closed"]).default("Planned"),
      notes: z.string().max(2000).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createResourcePlanEntry({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "management.resource_plan.create", input.projectId ?? input.resourceName, { resourceType: input.resourceType, requiredQty: input.requiredQty, availableQty: input.availableQty });
      return result;
    }),

  slaRules: permissionProcedure("management.view").query(async () => getSlaRules()),

  upsertSlaRule: permissionProcedure("management.manage")
    .input(z.object({
      phase: blindPhaseSchema,
      priority: z.union([blindPrioritySchema, z.literal("All")]).default("All"),
      targetHours: z.number().int().min(1).max(8760),
      escalationRole: z.string().max(120).nullable().optional(),
      escalationAfterHours: z.number().int().min(1).max(8760).default(4),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await upsertSlaRule({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "management.sla_rule.upsert", `${input.phase}:${input.priority}`, input);
      return result;
    }),
});
