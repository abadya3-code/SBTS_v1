import crypto from "crypto";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import {
  auditEvents,
  blindCertificates,
  blindCertificateEvents,
  blindFieldNotes,
  blindHubSettings,
  blinds,
} from "../../drizzle/schema";
import { requireDb } from "./core";
import { getBlindDetail } from "./blinds";
import { getBlindCompliance } from "./fieldCompliance";
import { logAuditEvent } from "./audit";
import type { BlindPhase } from "./types";

export type BlindHubActor = {
  openId: string;
  name?: string | null;
  email?: string | null;
};

export type BlindHubSettingsInput = {
  scopeType?: "system" | "project";
  projectId?: string | null;
  showOverviewTab?: boolean;
  showWorkflowTab?: boolean;
  showComplianceTab?: boolean;
  showFieldActionsTab?: boolean;
  showQrMobileTab?: boolean;
  showCertificateHistoryTab?: boolean;
  enablePtw?: boolean;
  enableLoto?: boolean;
  enableRiskAssessment?: boolean;
  enableGasTest?: boolean;
  enableTorqueRecords?: boolean;
  enableNdeRecords?: boolean;
  enableMtrRecords?: boolean;
  enableLeakTest?: boolean;
  enablePhotoEvidence?: boolean;
  enableQrPublicView?: boolean;
  enableOfflineMobile?: boolean;
  enableShiftHandover?: boolean;
  enableCertificateHash?: boolean;
  enableEmailShare?: boolean;
  requireChecklistBeforeAdvance?: boolean;
  requireTorqueBeforeFinalTight?: boolean;
  requireInspectionBeforeCertificate?: boolean;
  requireEvidenceBeforeCertificate?: boolean;
  requirePtwBeforeFieldExecution?: boolean;
  requireLotoBeforeFieldExecution?: boolean;
  requireRiskBeforeFieldExecution?: boolean;
  requireAllApprovalsBeforeCertificate?: boolean;
  minEvidenceCount?: number;
  certificateMode?: "auto" | "manual";
  publicQrDataLevel?: "basic" | "standard" | "full";
};

const booleanFields = [
  "showOverviewTab",
  "showWorkflowTab",
  "showComplianceTab",
  "showFieldActionsTab",
  "showQrMobileTab",
  "showCertificateHistoryTab",
  "enablePtw",
  "enableLoto",
  "enableRiskAssessment",
  "enableGasTest",
  "enableTorqueRecords",
  "enableNdeRecords",
  "enableMtrRecords",
  "enableLeakTest",
  "enablePhotoEvidence",
  "enableQrPublicView",
  "enableOfflineMobile",
  "enableShiftHandover",
  "enableCertificateHash",
  "enableEmailShare",
  "requireChecklistBeforeAdvance",
  "requireTorqueBeforeFinalTight",
  "requireInspectionBeforeCertificate",
  "requireEvidenceBeforeCertificate",
  "requirePtwBeforeFieldExecution",
  "requireLotoBeforeFieldExecution",
  "requireRiskBeforeFieldExecution",
  "requireAllApprovalsBeforeCertificate",
] as const;

export const defaultBlindHubSettings = {
  id: 0,
  scopeType: "system" as const,
  projectId: null as string | null,
  showOverviewTab: 1,
  showWorkflowTab: 1,
  showComplianceTab: 1,
  showFieldActionsTab: 1,
  showQrMobileTab: 1,
  showCertificateHistoryTab: 1,
  enablePtw: 1,
  enableLoto: 1,
  enableRiskAssessment: 1,
  enableGasTest: 1,
  enableTorqueRecords: 1,
  enableNdeRecords: 1,
  enableMtrRecords: 1,
  enableLeakTest: 1,
  enablePhotoEvidence: 1,
  enableQrPublicView: 1,
  enableOfflineMobile: 1,
  enableShiftHandover: 1,
  enableCertificateHash: 1,
  enableEmailShare: 0,
  requireChecklistBeforeAdvance: 1,
  requireTorqueBeforeFinalTight: 1,
  requireInspectionBeforeCertificate: 1,
  requireEvidenceBeforeCertificate: 1,
  requirePtwBeforeFieldExecution: 1,
  requireLotoBeforeFieldExecution: 1,
  requireRiskBeforeFieldExecution: 1,
  requireAllApprovalsBeforeCertificate: 1,
  minEvidenceCount: 1,
  certificateMode: "manual",
  publicQrDataLevel: "standard",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  updatedByOpenId: null as string | null,
};

type RawHubSettings = typeof defaultBlindHubSettings;

function normalizeHubSettings(row: Partial<RawHubSettings> | undefined | null): RawHubSettings {
  return { ...defaultBlindHubSettings, ...(row ?? {}) } as RawHubSettings;
}

function boolValue(value: boolean | undefined): number | undefined {
  return value === undefined ? undefined : value ? 1 : 0;
}

function toClientSettings(row: RawHubSettings) {
  const result: Record<string, unknown> = { ...row };
  for (const key of booleanFields) {
    result[key] = row[key] === 1;
  }
  return result;
}

function toInsertSettings(input: BlindHubSettingsInput, updatedByOpenId?: string) {
  const values: Record<string, unknown> = {
    scopeType: input.scopeType ?? (input.projectId ? "project" : "system"),
    projectId: input.projectId ?? null,
    updatedByOpenId: updatedByOpenId ?? null,
    updatedAt: new Date(),
  };
  for (const key of booleanFields) {
    const converted = boolValue(input[key]);
    if (converted !== undefined) values[key] = converted;
  }
  if (input.minEvidenceCount !== undefined) values.minEvidenceCount = Math.max(0, Math.min(20, input.minEvidenceCount));
  if (input.certificateMode) values.certificateMode = input.certificateMode;
  if (input.publicQrDataLevel) values.publicQrDataLevel = input.publicQrDataLevel;
  return values;
}

export async function getEffectiveBlindHubSettings(projectId?: string | null) {
  const db = await requireDb();
  const [systemRows, projectRows] = await Promise.all([
    db.select().from(blindHubSettings).where(eq(blindHubSettings.scopeType, "system")).limit(1),
    projectId
      ? db.select().from(blindHubSettings).where(and(eq(blindHubSettings.scopeType, "project"), eq(blindHubSettings.projectId, projectId))).limit(1)
      : Promise.resolve([]),
  ]);
  const settings = normalizeHubSettings({ ...systemRows[0], ...projectRows[0] });
  return toClientSettings(settings);
}

export async function updateBlindHubSettings(input: BlindHubSettingsInput, actor?: BlindHubActor) {
  const db = await requireDb();
  const scopeType = input.scopeType ?? (input.projectId ? "project" : "system");
  const projectId = input.projectId ?? null;
  const existing = await db.select({ id: blindHubSettings.id }).from(blindHubSettings)
    .where(and(eq(blindHubSettings.scopeType, scopeType), projectId ? eq(blindHubSettings.projectId, projectId) : isNull(blindHubSettings.projectId)))
    .limit(1);
  const values = toInsertSettings({ ...input, scopeType, projectId }, actor?.openId);
  if (existing[0]) {
    await db.update(blindHubSettings).set(values).where(eq(blindHubSettings.id, existing[0].id));
  } else {
    await db.insert(blindHubSettings).values({ ...values, createdAt: new Date() } as any);
  }
  return getEffectiveBlindHubSettings(projectId);
}

function phaseIndex(phase: string) {
  return ["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"].indexOf(phase);
}

function isCompletePhase(phase: string) {
  return phase === "Inspection Ready";
}

function inspectionPassed(records: Array<{ status: string | null }>) {
  return records.some((row) => (row.status ?? "").toLowerCase() === "pass");
}

function hasInspectionType(records: Array<{ inspectionType: string | null; status: string | null }>, typeName: string) {
  return records.some((row) =>
    (row.inspectionType ?? "").toLowerCase().includes(typeName.toLowerCase()) &&
    (row.status ?? "").toLowerCase() === "pass"
  );
}

export function evaluateBlindCertificateReadiness(detail: Awaited<ReturnType<typeof getBlindDetail>>, compliance: Awaited<ReturnType<typeof getBlindCompliance>>, rawSettings: Record<string, unknown>) {
  if (!detail) {
    return { ready: false, percentage: 0, blockers: [{ key: "blind_missing", label: "Blind record was not found", severity: "critical", tab: "Overview", action: "Open project registry" }] };
  }
  const settings = rawSettings as Record<string, boolean | number | string>;
  const blind = detail.blind;
  const blockers: Array<{ key: string; label: string; severity: "critical" | "warning"; tab: string; action: string }> = [];

  if (!isCompletePhase(blind.phase)) {
    blockers.push({ key: "phase_not_complete", label: "Workflow is not in Inspection Ready phase", severity: "critical", tab: "Workflow", action: "Complete all workflow phases" });
  }

  const approvalsComplete = detail.phaseTimeline.every((phase) => phase.approval?.approved || phase.status === "waiting");
  if (settings.requireAllApprovalsBeforeCertificate && !approvalsComplete) {
    blockers.push({ key: "approvals_missing", label: "Required phase approvals are not complete", severity: "critical", tab: "Workflow", action: "Complete electronic approvals" });
  }

  if (settings.requireChecklistBeforeAdvance) {
    const completedChecklists = compliance.counts.completedChecklists;
    if (completedChecklists < 1) {
      blockers.push({ key: "checklist_missing", label: "Safety checklist is not complete", severity: "critical", tab: "Compliance", action: "Complete checklist" });
    }
  }

  if (settings.requireTorqueBeforeFinalTight && (compliance.counts.torqueRecords ?? 0) < 1) {
    blockers.push({ key: "torque_missing", label: "Torque verification record is missing", severity: "critical", tab: "Compliance", action: "Add torque record" });
  }

  if (settings.requireInspectionBeforeCertificate && !inspectionPassed(compliance.inspectionRecords)) {
    blockers.push({ key: "inspection_missing", label: "Passing inspection record is missing", severity: "critical", tab: "Compliance", action: "Add NDE / MTR / Leak Test result" });
  }

  if (settings.enableLeakTest && settings.requireInspectionBeforeCertificate && !hasInspectionType(compliance.inspectionRecords, "Leak")) {
    blockers.push({ key: "leak_test_missing", label: "Leak test pass record is missing", severity: "warning", tab: "Compliance", action: "Add leak test record" });
  }

  const minEvidenceCount = Number(settings.minEvidenceCount ?? 1);
  if (settings.requireEvidenceBeforeCertificate && (compliance.counts.evidence ?? 0) < minEvidenceCount) {
    blockers.push({ key: "evidence_missing", label: `At least ${minEvidenceCount} evidence file(s) required`, severity: "critical", tab: "Compliance", action: "Upload evidence" });
  }

  if (settings.requirePtwBeforeFieldExecution && (compliance.counts.activePtwLoto ?? 0) < 1) {
    blockers.push({ key: "ptw_loto_missing", label: "Active PTW/LOTO verification is missing", severity: "warning", tab: "Field Actions", action: "Add PTW / LOTO record" });
  }

  if (settings.requireRiskBeforeFieldExecution && (compliance.counts.riskAssessments ?? 0) < 1) {
    blockers.push({ key: "risk_missing", label: "Risk assessment is missing", severity: "warning", tab: "Field Actions", action: "Complete risk assessment" });
  }

  const totalChecks = 8;
  const score = Math.max(0, totalChecks - blockers.filter((b) => b.severity === "critical").length - blockers.filter((b) => b.severity === "warning").length * 0.5);
  return {
    ready: blockers.filter((item) => item.severity === "critical").length === 0,
    percentage: Math.round((score / totalChecks) * 100),
    blockers,
  };
}

export async function getBlindHubDetail(input: { projectId: string; tag: string }) {
  const [detail, compliance, settings] = await Promise.all([
    getBlindDetail(input.projectId, input.tag),
    getBlindCompliance(input.projectId, input.tag),
    getEffectiveBlindHubSettings(input.projectId),
  ]);
  if (!detail) return null;
  const db = await requireDb();
  const [certificateRows, noteRows, auditRows] = await Promise.all([
    db.select().from(blindCertificates).where(and(eq(blindCertificates.projectId, input.projectId), eq(blindCertificates.blindTag, input.tag))).orderBy(desc(blindCertificates.createdAt)).limit(10),
    db.select().from(blindFieldNotes).where(and(eq(blindFieldNotes.projectId, input.projectId), eq(blindFieldNotes.blindTag, input.tag))).orderBy(desc(blindFieldNotes.createdAt)).limit(25),
    db.select().from(auditEvents).where(or(eq(auditEvents.entityId, input.tag), eq(auditEvents.entityId, input.projectId))).orderBy(desc(auditEvents.createdAt)).limit(40),
  ]);

  const readiness = evaluateBlindCertificateReadiness(detail, compliance, settings);
  const currentPhaseIndex = Math.max(0, phaseIndex(detail.blind.phase));
  const workflowProgress = Math.round(((currentPhaseIndex + (isCompletePhase(detail.blind.phase) ? 1 : 0.35)) / 5) * 100);

  return {
    project: detail.project,
    blind: detail.blind,
    settings,
    workflow: {
      phases: detail.phaseTimeline,
      logs: detail.logs,
      progress: Math.min(100, workflowProgress),
      currentPhase: detail.blind.phase,
    },
    compliance,
    fieldNotes: noteRows,
    qr: {
      activeToken: compliance.qrTokens.find((token) => token.isActive === 1) ?? null,
      tokens: compliance.qrTokens,
    },
    certificate: {
      latest: certificateRows[0] ?? null,
      history: certificateRows,
      readiness,
    },
    history: {
      audit: auditRows,
      workflow: detail.logs,
    },
  };
}

function certificateHash(payload: unknown, previousHash?: string | null) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ payload, previousHash: previousHash ?? null }))
    .digest("hex");
}

export async function generateBlindCertificate(input: { projectId: string; tag: string; forceDraft?: boolean; actor: BlindHubActor; ipAddress?: string | null; userAgent?: string | null }) {
  const hub = await getBlindHubDetail({ projectId: input.projectId, tag: input.tag });
  if (!hub) throw new Error("Blind hub record was not found.");

  const db = await requireDb();
  const latest = await db.select().from(blindCertificates)
    .where(and(eq(blindCertificates.projectId, input.projectId), eq(blindCertificates.blindTag, input.tag)))
    .orderBy(desc(blindCertificates.createdAt))
    .limit(1);

  const certificateNumber = `CERT-${new Date().getFullYear()}-${input.tag}-${String((latest[0]?.id ?? 0) + 1).padStart(3, "0")}`;
  const previousHash = latest[0]?.hash ?? null;
  const payload = {
    certificateNumber,
    project: hub.project,
    blind: hub.blind,
    workflow: hub.workflow,
    complianceCounts: hub.compliance.counts,
    readiness: hub.certificate.readiness,
    generatedAt: new Date().toISOString(),
  };
  const hash = certificateHash(payload, previousHash);
  const status = hub.certificate.readiness.ready && !input.forceDraft ? "issued" : "draft";

  await db.insert(blindCertificates).values({
    projectId: input.projectId,
    blindTag: input.tag,
    certificateNumber,
    status,
    readinessJson: JSON.stringify(hub.certificate.readiness),
    certificateJson: JSON.stringify(payload),
    hash,
    previousHash,
    issuedByOpenId: status === "issued" ? input.actor.openId : null,
    issuedByName: status === "issued" ? input.actor.name ?? input.actor.email ?? null : null,
    issuedAt: status === "issued" ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const inserted = await db.select().from(blindCertificates)
    .where(and(eq(blindCertificates.projectId, input.projectId), eq(blindCertificates.blindTag, input.tag), eq(blindCertificates.certificateNumber, certificateNumber)))
    .limit(1);

  await db.insert(blindCertificateEvents).values({
    certificateId: inserted[0]?.id ?? null,
    projectId: input.projectId,
    blindTag: input.tag,
    eventType: status === "issued" ? "issued" : "draft_generated",
    eventJson: JSON.stringify({ readiness: hub.certificate.readiness, hash }),
    actorOpenId: input.actor.openId,
    actorName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
  });

  await logAuditEvent({
    actor: input.actor,
    action: status === "issued" ? "certificate.generate" : "certificate.draft",
    entityType: "blind",
    entityId: input.tag,
    after: { certificateNumber, status, hash, readiness: hub.certificate.readiness },
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  }).catch(() => { /* audit logging must not block certificate creation */ });

  return getBlindHubDetail({ projectId: input.projectId, tag: input.tag });
}

export async function addBlindHubFieldNote(input: {
  projectId: string;
  tag: string;
  phase: BlindPhase;
  note: string;
  source?: string;
  voiceText?: string | null;
  actor: BlindHubActor;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const db = await requireDb();
  const blindRows = await db.select({ tag: blinds.tag }).from(blinds).where(and(eq(blinds.projectId, input.projectId), eq(blinds.tag, input.tag))).limit(1);
  if (!blindRows[0]) throw new Error("Blind record was not found for field note.");
  await db.insert(blindFieldNotes).values({
    projectId: input.projectId,
    blindTag: input.tag,
    phase: input.phase,
    note: input.note,
    source: input.source ?? "web",
    voiceText: input.voiceText ?? null,
    submittedByOpenId: input.actor.openId,
    submittedByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
  });
  await logAuditEvent({
    actor: input.actor,
    action: "blind.field_note.add",
    entityType: "blind",
    entityId: input.tag,
    after: { phase: input.phase, note: input.note },
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  }).catch(() => { /* audit logging must not block field notes */ });
  return getBlindHubDetail({ projectId: input.projectId, tag: input.tag });
}
