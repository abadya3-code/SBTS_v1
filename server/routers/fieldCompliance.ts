import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { permissionProcedure, router } from "../_core/trpc";
import {
  addBlindEvidence,
  addInspectionRecord,
  addTorqueRecord,
  getBlindCompliance,
  getComplianceSummary,
  getDefaultChecklistItems,
  logAuditEvent,
  saveSafetyChecklist,
} from "../db";

const blindPhaseSchema = z.enum([
  "Broken / Preparation",
  "Assembly",
  "Tight & Torque",
  "Final Tight",
  "Inspection Ready",
]);

const actorFromContext = (ctx: { user: { openId: string; name?: string | null; email?: string | null } }) => ({
  openId: ctx.user.openId,
  name: ctx.user.name ?? null,
  email: ctx.user.email ?? null,
});

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

async function writeAudit(ctx: any, action: string, entityId: string, after: unknown) {
  await logAuditEvent({
    actor: ctx.user,
    action,
    entityType: "field_compliance",
    entityId,
    after,
    ...requestAuditMeta(ctx),
  }).catch(() => { /* audit logging must not block field execution */ });
}

export const fieldComplianceRouter = router({
  defaultChecklist: permissionProcedure("compliance.view").query(async () => getDefaultChecklistItems()),

  summary: permissionProcedure("compliance.view")
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }).optional())
    .query(async ({ input }) => getComplianceSummary(input?.days ?? 30)),

  blind: permissionProcedure("compliance.view")
    .input(z.object({ projectId: z.string().min(2).max(40), blindTag: z.string().min(2).max(40) }))
    .query(async ({ input }) => getBlindCompliance(input.projectId, input.blindTag)),

  saveChecklist: permissionProcedure("compliance.manage")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      blindTag: z.string().min(2).max(40),
      phase: blindPhaseSchema,
      items: z.array(z.object({
        key: z.string().min(1).max(80),
        label: z.string().min(1).max(220),
        required: z.boolean().optional(),
        checked: z.boolean(),
        note: z.string().max(500).nullable().optional(),
      })).min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await saveSafetyChecklist({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "compliance.checklist.save", input.blindTag, { projectId: input.projectId, phase: input.phase });
      return result;
    }),

  addEvidence: permissionProcedure("compliance.manage")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      blindTag: z.string().min(2).max(40),
      phase: blindPhaseSchema,
      evidenceType: z.string().min(1).max(80).default("photo"),
      fileName: z.string().max(255).nullable().optional(),
      mimeType: z.string().max(120).nullable().optional(),
      dataUrl: z.string().max(3_000_000).nullable().optional(),
      caption: z.string().max(1000).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.dataUrl && input.dataUrl.length > 3_000_000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence file is too large for pilot inline storage." });
      }
      const result = await addBlindEvidence({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "compliance.evidence.add", input.blindTag, { projectId: input.projectId, phase: input.phase, evidenceType: input.evidenceType });
      return result;
    }),

  addTorque: permissionProcedure("compliance.manage")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      blindTag: z.string().min(2).max(40),
      phase: blindPhaseSchema.optional(),
      boltNo: z.string().max(40).nullable().optional(),
      boltSize: z.string().max(80).nullable().optional(),
      torqueValue: z.string().min(1).max(80),
      torqueUnit: z.string().min(1).max(40).default("Nm"),
      toolId: z.string().max(120).nullable().optional(),
      technicianName: z.string().max(200).nullable().optional(),
      verifiedByName: z.string().max(200).nullable().optional(),
      notes: z.string().max(1000).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await addTorqueRecord({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "compliance.torque.add", input.blindTag, { projectId: input.projectId, torqueValue: input.torqueValue, torqueUnit: input.torqueUnit });
      return result;
    }),

  addInspection: permissionProcedure("compliance.manage")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      blindTag: z.string().min(2).max(40),
      recordType: z.enum(["NDE", "MTR", "GASKET", "LEAK_TEST", "PUNCH_LIST", "GENERAL"]),
      referenceNo: z.string().max(160).nullable().optional(),
      result: z.string().max(80).nullable().optional(),
      description: z.string().max(1500).nullable().optional(),
      fileName: z.string().max(255).nullable().optional(),
      mimeType: z.string().max(120).nullable().optional(),
      dataUrl: z.string().max(3_000_000).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await addInspectionRecord({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "compliance.inspection.add", input.blindTag, { projectId: input.projectId, recordType: input.recordType, result: input.result });
      return result;
    }),
});
