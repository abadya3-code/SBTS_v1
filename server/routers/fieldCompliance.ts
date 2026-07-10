import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { permissionProcedure, publicProcedure, router } from "../_core/trpc";
import {
  addBlindEvidence,
  addInspectionRecord,
  addPtwLotoRecord,
  addTorqueRecord,
  createOrRotateQrToken,
  getBlindCompliance,
  getComplianceSummary,
  getDefaultChecklistItems,
  getDefaultRiskModel,
  getFieldMobileSummary,
  getFieldOfflineDrafts,
  getShiftHandovers,
  logAuditEvent,
  saveFieldOfflineDraft,
  saveRiskAssessment,
  saveSafetyChecklist,
  submitShiftHandover,
  verifyQrToken,
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


  mobileSummary: permissionProcedure("compliance.view")
    .input(z.object({ days: z.number().int().min(1).max(90).default(7) }).optional())
    .query(async ({ input }) => getFieldMobileSummary(input?.days ?? 7)),

  offlineDrafts: permissionProcedure("compliance.view")
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50), status: z.string().optional() }).optional())
    .query(async ({ input }) => getFieldOfflineDrafts(input ?? undefined)),

  saveOfflineDraft: permissionProcedure("compliance.manage")
    .input(z.object({
      draftId: z.string().min(4).max(96),
      projectId: z.string().max(40).nullable().optional(),
      blindTag: z.string().max(40).nullable().optional(),
      draftType: z.string().min(1).max(80),
      payload: z.unknown(),
      status: z.string().max(40).default("synced"),
      deviceId: z.string().max(160).nullable().optional(),
      clientCreatedAt: z.coerce.date().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await saveFieldOfflineDraft({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "field.offline_draft.sync", input.draftId, { projectId: input.projectId, blindTag: input.blindTag, draftType: input.draftType });
      return result;
    }),

  shiftHandovers: permissionProcedure("compliance.view")
    .input(z.object({ limit: z.number().int().min(1).max(100).default(25) }).optional())
    .query(async ({ input }) => getShiftHandovers(input ?? undefined)),

  submitShiftHandover: permissionProcedure("compliance.manage")
    .input(z.object({
      shiftDate: z.coerce.date(),
      shiftName: z.string().min(1).max(120),
      areaCode: z.string().max(80).nullable().optional(),
      projectId: z.string().max(40).nullable().optional(),
      summary: z.string().min(5).max(4000),
      openRisks: z.array(z.string().max(500)).max(50).default([]),
      priorities: z.array(z.string().max(500)).max(50).default([]),
      handoverToName: z.string().max(200).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await submitShiftHandover({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "field.shift_handover.submit", input.shiftName, { shiftDate: input.shiftDate, projectId: input.projectId, areaCode: input.areaCode });
      return result;
    }),
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


  defaultRiskModel: permissionProcedure("compliance.view").query(async () => getDefaultRiskModel()),

  createQrToken: permissionProcedure("compliance.manage")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      blindTag: z.string().min(2).max(40),
      expiresAt: z.coerce.date().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createOrRotateQrToken({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "compliance.qr.rotate", input.blindTag, { projectId: input.projectId, expiresAt: input.expiresAt ?? null });
      return result;
    }),

  verifyQrToken: publicProcedure
    .input(z.object({ token: z.string().min(10).max(120) }))
    .query(async ({ ctx, input }) => {
      return verifyQrToken({ token: input.token, ...requestAuditMeta(ctx) });
    }),

  saveRiskAssessment: permissionProcedure("compliance.manage")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      blindTag: z.string().min(2).max(40),
      phase: blindPhaseSchema,
      riskLevel: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
      residualRisk: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
      status: z.enum(["draft", "reviewed", "approved"]).default("draft"),
      assessorName: z.string().max(200).nullable().optional(),
      hazards: z.array(z.object({
        key: z.string().min(1).max(80),
        label: z.string().min(1).max(220),
        severity: z.enum(["Low", "Medium", "High", "Critical"]),
        selected: z.boolean(),
        note: z.string().max(500).nullable().optional(),
      })).min(1).max(50),
      controls: z.array(z.object({
        key: z.string().min(1).max(80),
        label: z.string().min(1).max(220),
        required: z.boolean().optional(),
        applied: z.boolean(),
        note: z.string().max(500).nullable().optional(),
      })).min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await saveRiskAssessment({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "compliance.risk_assessment.save", input.blindTag, { projectId: input.projectId, phase: input.phase, riskLevel: input.riskLevel, residualRisk: input.residualRisk });
      return result;
    }),

  addPtwLoto: permissionProcedure("compliance.manage")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      blindTag: z.string().min(2).max(40),
      phase: blindPhaseSchema,
      ptwNumber: z.string().max(120).nullable().optional(),
      lotoNumber: z.string().max(120).nullable().optional(),
      permitStatus: z.enum(["Pending", "Active", "Closed", "Suspended"]).default("Pending"),
      isolationStatus: z.enum(["Not verified", "Verified", "Rejected", "Expired"]).default("Not verified"),
      energySources: z.array(z.string().max(120)).max(20).default([]),
      gasTestRequired: z.boolean().default(false),
      gasTestResult: z.string().max(120).nullable().optional(),
      verifierName: z.string().max(200).nullable().optional(),
      expiresAt: z.coerce.date().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await addPtwLotoRecord({ ...input, actor: actorFromContext(ctx) });
      await writeAudit(ctx, "compliance.ptw_loto.add", input.blindTag, { projectId: input.projectId, phase: input.phase, permitStatus: input.permitStatus, isolationStatus: input.isolationStatus });
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
