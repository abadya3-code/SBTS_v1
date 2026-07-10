import { z } from "zod";
import { permissionProcedure, router } from "../_core/trpc";
import {
  addBlindHubFieldNote,
  generateBlindCertificate,
  getBlindHubDetail,
  getEffectiveBlindHubSettings,
  updateBlindHubSettings,
} from "../db";
import { blindPhaseSchema } from "./shared";

const hubSettingsSchema = z.object({
  scopeType: z.enum(["system", "project"]).optional(),
  projectId: z.string().min(2).max(40).nullable().optional(),
  showOverviewTab: z.boolean().optional(),
  showWorkflowTab: z.boolean().optional(),
  showComplianceTab: z.boolean().optional(),
  showFieldActionsTab: z.boolean().optional(),
  showQrMobileTab: z.boolean().optional(),
  showCertificateHistoryTab: z.boolean().optional(),
  enablePtw: z.boolean().optional(),
  enableLoto: z.boolean().optional(),
  enableRiskAssessment: z.boolean().optional(),
  enableGasTest: z.boolean().optional(),
  enableTorqueRecords: z.boolean().optional(),
  enableNdeRecords: z.boolean().optional(),
  enableMtrRecords: z.boolean().optional(),
  enableLeakTest: z.boolean().optional(),
  enablePhotoEvidence: z.boolean().optional(),
  enableQrPublicView: z.boolean().optional(),
  enableOfflineMobile: z.boolean().optional(),
  enableShiftHandover: z.boolean().optional(),
  enableCertificateHash: z.boolean().optional(),
  enableEmailShare: z.boolean().optional(),
  requireChecklistBeforeAdvance: z.boolean().optional(),
  requireTorqueBeforeFinalTight: z.boolean().optional(),
  requireInspectionBeforeCertificate: z.boolean().optional(),
  requireEvidenceBeforeCertificate: z.boolean().optional(),
  requirePtwBeforeFieldExecution: z.boolean().optional(),
  requireLotoBeforeFieldExecution: z.boolean().optional(),
  requireRiskBeforeFieldExecution: z.boolean().optional(),
  requireAllApprovalsBeforeCertificate: z.boolean().optional(),
  minEvidenceCount: z.number().int().min(0).max(20).optional(),
  certificateMode: z.enum(["auto", "manual"]).optional(),
  publicQrDataLevel: z.enum(["basic", "standard", "full"]).optional(),
});

function actorFromContext(ctx: { user: { openId: string; name?: string | null; email?: string | null } }) {
  return {
    openId: ctx.user.openId,
    name: ctx.user.name ?? null,
    email: ctx.user.email ?? null,
  };
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

export const blindHubRouter = router({
  detail: permissionProcedure("blindHub.view")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      tag: z.string().trim().min(2).max(40),
    }))
    .query(async ({ input }) => getBlindHubDetail(input)),

  settings: permissionProcedure("settings.blindHub.manage")
    .input(z.object({ projectId: z.string().min(2).max(40).nullable().optional() }).optional())
    .query(async ({ input }) => getEffectiveBlindHubSettings(input?.projectId ?? null)),

  updateSettings: permissionProcedure("settings.blindHub.manage")
    .input(hubSettingsSchema)
    .mutation(async ({ input, ctx }) => updateBlindHubSettings(input, actorFromContext(ctx))),

  addFieldNote: permissionProcedure("field.manage")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      tag: z.string().trim().min(2).max(40),
      phase: blindPhaseSchema,
      note: z.string().trim().min(2).max(4000),
      source: z.string().trim().max(40).optional(),
      voiceText: z.string().trim().max(4000).nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => addBlindHubFieldNote({
      ...input,
      actor: actorFromContext(ctx),
      ...requestAuditMeta(ctx),
    })),

  generateCertificate: permissionProcedure("certificate.generate")
    .input(z.object({
      projectId: z.string().min(2).max(40),
      tag: z.string().trim().min(2).max(40),
      forceDraft: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => generateBlindCertificate({
      ...input,
      actor: actorFromContext(ctx),
      ...requestAuditMeta(ctx),
    })),
});
