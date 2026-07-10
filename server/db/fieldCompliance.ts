import crypto from "crypto";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import {
  blindEvidence,
  blindInspectionRecords,
  blindSafetyChecklists,
  blindTorqueRecords,
  blindRiskAssessments,
  blindPtwLotoRecords,
  qrBlindTokens,
  qrScanLogs,
  fieldOfflineDrafts,
  shiftHandoverRecords,
  blinds,
  projects,
} from "../../drizzle/schema";
import { requireDb } from "./core";
import type { BlindPhase } from "./types";

export type ComplianceActor = {
  openId: string;
  name?: string | null;
  email?: string | null;
};

export type ChecklistItem = {
  key: string;
  label: string;
  required?: boolean;
  checked: boolean;
  note?: string | null;
};

const defaultChecklistItems: ChecklistItem[] = [
  { key: "ptw_verified", label: "Permit-to-Work reference verified", required: true, checked: false },
  { key: "loto_confirmed", label: "LOTO / isolation status confirmed", required: true, checked: false },
  { key: "line_equipment_verified", label: "Line / equipment number physically verified", required: true, checked: false },
  { key: "blind_tag_verified", label: "Blind tag and QR label verified", required: true, checked: false },
  { key: "gasket_bolting_verified", label: "Gasket and bolting condition checked", required: true, checked: false },
  { key: "photo_evidence_attached", label: "Photo evidence attached for this phase", required: false, checked: false },
  { key: "hazards_reviewed", label: "Hazards and field access constraints reviewed", required: true, checked: false },
];

function parseChecklist(json: string | null | undefined): ChecklistItem[] {
  if (!json) return defaultChecklistItems;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : defaultChecklistItems;
  } catch {
    return defaultChecklistItems;
  }
}



export type RiskHazardItem = {
  key: string;
  label: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  selected: boolean;
  note?: string | null;
};

export type RiskControlItem = {
  key: string;
  label: string;
  required?: boolean;
  applied: boolean;
  note?: string | null;
};

const defaultRiskHazards: RiskHazardItem[] = [
  { key: "stored_energy", label: "Stored energy / pressure release", severity: "Critical", selected: true },
  { key: "hot_surface", label: "Hot surface or high temperature exposure", severity: "High", selected: false },
  { key: "gas_release", label: "Potential gas / hydrocarbon release", severity: "Critical", selected: true },
  { key: "line_of_fire", label: "Line of fire during bolting and blind handling", severity: "High", selected: true },
  { key: "lifting_handling", label: "Manual handling / lifting exposure", severity: "Medium", selected: false },
  { key: "work_at_height", label: "Work at height or difficult access", severity: "High", selected: false },
];

const defaultRiskControls: RiskControlItem[] = [
  { key: "ptw_active", label: "Active PTW verified before work", required: true, applied: false },
  { key: "loto_verified", label: "LOTO and isolation tags verified", required: true, applied: false },
  { key: "gas_test", label: "Gas test completed where required", required: true, applied: false },
  { key: "barrier_signage", label: "Barricade and warning signage installed", required: false, applied: false },
  { key: "correct_ppe", label: "Correct PPE confirmed for phase hazards", required: true, applied: false },
  { key: "supervisor_authorized", label: "Supervisor authorization obtained", required: true, applied: false },
];

function parseJsonArray<T>(json: string | null | undefined, fallback: T[]): T[] {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function parseJson<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function getDefaultRiskModel() {
  return { hazards: defaultRiskHazards, controls: defaultRiskControls };
}

function checklistStatus(items: ChecklistItem[]) {
  const required = items.filter((item) => item.required !== false);
  if (required.length === 0) return "complete";
  return required.every((item) => item.checked) ? "complete" : "incomplete";
}

export function getDefaultChecklistItems() {
  return defaultChecklistItems;
}

export async function getBlindCompliance(projectId: string, blindTag: string) {
  const db = await requireDb();
  const [blindRows, evidenceRows, checklistRows, torqueRows, inspectionRows, riskRows, ptwLotoRows, qrTokenRows] = await Promise.all([
    db.select().from(blinds).where(and(eq(blinds.projectId, projectId), eq(blinds.tag, blindTag))).limit(1),
    db.select().from(blindEvidence).where(and(eq(blindEvidence.projectId, projectId), eq(blindEvidence.blindTag, blindTag))).orderBy(desc(blindEvidence.createdAt)),
    db.select().from(blindSafetyChecklists).where(and(eq(blindSafetyChecklists.projectId, projectId), eq(blindSafetyChecklists.blindTag, blindTag))).orderBy(asc(blindSafetyChecklists.phase)),
    db.select().from(blindTorqueRecords).where(and(eq(blindTorqueRecords.projectId, projectId), eq(blindTorqueRecords.blindTag, blindTag))).orderBy(desc(blindTorqueRecords.createdAt)),
    db.select().from(blindInspectionRecords).where(and(eq(blindInspectionRecords.projectId, projectId), eq(blindInspectionRecords.blindTag, blindTag))).orderBy(desc(blindInspectionRecords.createdAt)),
    db.select().from(blindRiskAssessments).where(and(eq(blindRiskAssessments.projectId, projectId), eq(blindRiskAssessments.blindTag, blindTag))).orderBy(desc(blindRiskAssessments.updatedAt)),
    db.select().from(blindPtwLotoRecords).where(and(eq(blindPtwLotoRecords.projectId, projectId), eq(blindPtwLotoRecords.blindTag, blindTag))).orderBy(desc(blindPtwLotoRecords.updatedAt)),
    db.select().from(qrBlindTokens).where(and(eq(qrBlindTokens.projectId, projectId), eq(qrBlindTokens.blindTag, blindTag))).orderBy(desc(qrBlindTokens.updatedAt)),
  ]);

  const checklistByPhase = checklistRows.map((row) => ({
    ...row,
    items: parseChecklist(row.checklistJson),
  }));

  return {
    blind: blindRows[0] ?? null,
    evidence: evidenceRows,
    checklists: checklistByPhase,
    torqueRecords: torqueRows,
    inspectionRecords: inspectionRows,
    riskAssessments: riskRows.map((row) => ({
      ...row,
      hazards: parseJsonArray<RiskHazardItem>(row.hazardsJson, defaultRiskHazards),
      controls: parseJsonArray<RiskControlItem>(row.controlsJson, defaultRiskControls),
    })),
    ptwLotoRecords: ptwLotoRows.map((row) => ({
      ...row,
      energySources: parseJsonArray<string>(row.energySourcesJson, []),
    })),
    qrTokens: qrTokenRows,
    counts: {
      evidence: evidenceRows.length,
      completedChecklists: checklistByPhase.filter((row) => row.status === "complete").length,
      torqueRecords: torqueRows.length,
      inspectionRecords: inspectionRows.length,
      riskAssessments: riskRows.length,
      activePtwLoto: ptwLotoRows.filter((row) => row.permitStatus === "Active" || row.isolationStatus === "Verified").length,
      qrTokens: qrTokenRows.length,
    },
  };
}

export async function saveSafetyChecklist(input: {
  projectId: string;
  blindTag: string;
  phase: BlindPhase;
  items: ChecklistItem[];
  actor: ComplianceActor;
}) {
  const db = await requireDb();
  const status = checklistStatus(input.items);
  const existing = await db.select({ id: blindSafetyChecklists.id }).from(blindSafetyChecklists)
    .where(and(eq(blindSafetyChecklists.projectId, input.projectId), eq(blindSafetyChecklists.blindTag, input.blindTag), eq(blindSafetyChecklists.phase, input.phase)))
    .limit(1);
  const values = {
    blindTag: input.blindTag,
    projectId: input.projectId,
    phase: input.phase,
    checklistJson: JSON.stringify(input.items),
    status,
    completedByOpenId: status === "complete" ? input.actor.openId : null,
    completedByName: status === "complete" ? input.actor.name ?? input.actor.email ?? null : null,
    completedAt: status === "complete" ? new Date() : null,
    updatedAt: new Date(),
  };
  if (existing[0]) {
    await db.update(blindSafetyChecklists).set(values).where(eq(blindSafetyChecklists.id, existing[0].id));
  } else {
    await db.insert(blindSafetyChecklists).values({ ...values, createdAt: new Date() });
  }
  return getBlindCompliance(input.projectId, input.blindTag);
}

export async function addBlindEvidence(input: {
  projectId: string;
  blindTag: string;
  phase: BlindPhase;
  evidenceType?: string;
  fileName?: string | null;
  mimeType?: string | null;
  dataUrl?: string | null;
  caption?: string | null;
  actor: ComplianceActor;
}) {
  const db = await requireDb();
  await db.insert(blindEvidence).values({
    projectId: input.projectId,
    blindTag: input.blindTag,
    phase: input.phase,
    evidenceType: input.evidenceType ?? "photo",
    fileName: input.fileName ?? null,
    mimeType: input.mimeType ?? null,
    dataUrl: input.dataUrl ?? null,
    caption: input.caption ?? null,
    uploadedByOpenId: input.actor.openId,
    uploadedByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
  });
  return getBlindCompliance(input.projectId, input.blindTag);
}

export async function addTorqueRecord(input: {
  projectId: string;
  blindTag: string;
  phase?: BlindPhase;
  boltNo?: string | null;
  boltSize?: string | null;
  torqueValue: string;
  torqueUnit?: string;
  toolId?: string | null;
  technicianName?: string | null;
  verifiedByName?: string | null;
  notes?: string | null;
  actor: ComplianceActor;
}) {
  const db = await requireDb();
  await db.insert(blindTorqueRecords).values({
    projectId: input.projectId,
    blindTag: input.blindTag,
    phase: input.phase ?? "Tight & Torque",
    boltNo: input.boltNo ?? null,
    boltSize: input.boltSize ?? null,
    torqueValue: input.torqueValue,
    torqueUnit: input.torqueUnit ?? "Nm",
    toolId: input.toolId ?? null,
    technicianName: input.technicianName ?? null,
    verifiedByName: input.verifiedByName ?? null,
    notes: input.notes ?? null,
    createdByOpenId: input.actor.openId,
    createdByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
  });
  return getBlindCompliance(input.projectId, input.blindTag);
}

export async function addInspectionRecord(input: {
  projectId: string;
  blindTag: string;
  recordType: string;
  referenceNo?: string | null;
  result?: string | null;
  description?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  dataUrl?: string | null;
  actor: ComplianceActor;
}) {
  const db = await requireDb();
  await db.insert(blindInspectionRecords).values({
    projectId: input.projectId,
    blindTag: input.blindTag,
    recordType: input.recordType,
    referenceNo: input.referenceNo ?? null,
    result: input.result ?? "Pending",
    description: input.description ?? null,
    fileName: input.fileName ?? null,
    mimeType: input.mimeType ?? null,
    dataUrl: input.dataUrl ?? null,
    createdByOpenId: input.actor.openId,
    createdByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
  });
  return getBlindCompliance(input.projectId, input.blindTag);
}



export async function saveRiskAssessment(input: {
  projectId: string;
  blindTag: string;
  phase: BlindPhase;
  riskLevel: string;
  residualRisk: string;
  hazards: RiskHazardItem[];
  controls: RiskControlItem[];
  status?: string;
  assessorName?: string | null;
  actor: ComplianceActor;
}) {
  const db = await requireDb();
  await db.insert(blindRiskAssessments).values({
    projectId: input.projectId,
    blindTag: input.blindTag,
    phase: input.phase,
    riskLevel: input.riskLevel,
    residualRisk: input.residualRisk,
    hazardsJson: JSON.stringify(input.hazards),
    controlsJson: JSON.stringify(input.controls),
    status: input.status ?? "draft",
    assessorName: input.assessorName ?? input.actor.name ?? input.actor.email ?? null,
    createdByOpenId: input.actor.openId,
    createdByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return getBlindCompliance(input.projectId, input.blindTag);
}

export async function addPtwLotoRecord(input: {
  projectId: string;
  blindTag: string;
  phase: BlindPhase;
  ptwNumber?: string | null;
  lotoNumber?: string | null;
  permitStatus?: string;
  isolationStatus?: string;
  energySources?: string[];
  gasTestRequired?: boolean;
  gasTestResult?: string | null;
  verifierName?: string | null;
  expiresAt?: string | Date | null;
  actor: ComplianceActor;
}) {
  const db = await requireDb();
  await db.insert(blindPtwLotoRecords).values({
    projectId: input.projectId,
    blindTag: input.blindTag,
    phase: input.phase,
    ptwNumber: input.ptwNumber ?? null,
    lotoNumber: input.lotoNumber ?? null,
    permitStatus: input.permitStatus ?? "Pending",
    isolationStatus: input.isolationStatus ?? "Not verified",
    energySourcesJson: JSON.stringify(input.energySources ?? []),
    gasTestRequired: input.gasTestRequired ? 1 : 0,
    gasTestResult: input.gasTestResult ?? null,
    verifierName: input.verifierName ?? input.actor.name ?? input.actor.email ?? null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    createdByOpenId: input.actor.openId,
    createdByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return getBlindCompliance(input.projectId, input.blindTag);
}

export async function createOrRotateQrToken(input: {
  projectId: string;
  blindTag: string;
  expiresAt?: string | Date | null;
  actor: ComplianceActor;
}) {
  const db = await requireDb();
  const blindRows = await db.select().from(blinds).where(and(eq(blinds.projectId, input.projectId), eq(blinds.tag, input.blindTag))).limit(1);
  if (!blindRows[0]) throw new Error("Blind record was not found for QR generation.");
  const token = `sbts_${crypto.randomBytes(24).toString("base64url")}`;
  const existing = await db.select({ token: qrBlindTokens.token }).from(qrBlindTokens)
    .where(and(eq(qrBlindTokens.projectId, input.projectId), eq(qrBlindTokens.blindTag, input.blindTag)))
    .limit(1);
  const values = {
    token,
    projectId: input.projectId,
    blindTag: input.blindTag,
    accessMode: "field_readonly",
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    isActive: 1,
    scanCount: 0,
    lastScannedAt: null,
    createdByOpenId: input.actor.openId,
    createdByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  if (existing[0]) {
    await db.update(qrBlindTokens).set(values).where(eq(qrBlindTokens.token, existing[0].token));
  } else {
    await db.insert(qrBlindTokens).values(values);
  }
  return getBlindCompliance(input.projectId, input.blindTag);
}

export async function verifyQrToken(input: {
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const db = await requireDb();
  const rows = await db.select().from(qrBlindTokens).where(eq(qrBlindTokens.token, input.token)).limit(1);
  const tokenRow = rows[0];
  if (!tokenRow) {
    await db.insert(qrScanLogs).values({ token: input.token, result: "invalid", ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null, scannedAt: new Date() });
    return { status: "invalid" as const, message: "QR token was not found.", token: null, compliance: null };
  }
  const expired = tokenRow.expiresAt ? new Date(tokenRow.expiresAt).getTime() < Date.now() : false;
  const active = tokenRow.isActive === 1 && !expired;
  await db.insert(qrScanLogs).values({
    token: input.token,
    projectId: tokenRow.projectId,
    blindTag: tokenRow.blindTag,
    result: active ? "success" : expired ? "expired" : "inactive",
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    scannedAt: new Date(),
  });
  await db.update(qrBlindTokens).set({ scanCount: (tokenRow.scanCount ?? 0) + 1, lastScannedAt: new Date(), updatedAt: new Date() }).where(eq(qrBlindTokens.token, tokenRow.token));
  if (!active) {
    return { status: expired ? "expired" as const : "inactive" as const, message: expired ? "QR token is expired." : "QR token is inactive.", token: tokenRow, compliance: null };
  }
  return { status: "success" as const, message: "QR token verified.", token: tokenRow, compliance: await getBlindCompliance(tokenRow.projectId, tokenRow.blindTag) };
}

export async function getComplianceSummary(days = 30) {
  const db = await requireDb();
  const today = new Date();
  const horizon = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  const horizonText = horizon.toISOString().slice(0, 10);
  const [blindRows, evidenceRows, checklistRows, torqueRows, inspectionRows, projectRows, riskRows, ptwLotoRows, qrTokenRows] = await Promise.all([
    db.select().from(blinds).orderBy(asc(blinds.expiryDate)),
    db.select().from(blindEvidence).orderBy(desc(blindEvidence.createdAt)).limit(25),
    db.select().from(blindSafetyChecklists),
    db.select().from(blindTorqueRecords).orderBy(desc(blindTorqueRecords.createdAt)).limit(25),
    db.select().from(blindInspectionRecords).orderBy(desc(blindInspectionRecords.createdAt)).limit(25),
    db.select().from(projects),
    db.select().from(blindRiskAssessments).orderBy(desc(blindRiskAssessments.updatedAt)).limit(25),
    db.select().from(blindPtwLotoRecords).orderBy(desc(blindPtwLotoRecords.updatedAt)).limit(25),
    db.select().from(qrBlindTokens).orderBy(desc(qrBlindTokens.updatedAt)).limit(25),
  ]);
  const projectById = new Map(projectRows.map((project) => [project.id, project]));
  const expiring = blindRows
    .filter((blind) => blind.expiryDate && String(blind.expiryDate).slice(0, 10) <= horizonText)
    .map((blind) => {
      const expiryText = String(blind.expiryDate).slice(0, 10);
      const daysRemaining = Math.ceil((new Date(expiryText).getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      const project = projectById.get(blind.projectId);
      return {
        tag: blind.tag,
        projectId: blind.projectId,
        projectName: project?.name ?? blind.projectId,
        type: blind.type,
        size: blind.size,
        phase: blind.phase,
        priority: blind.priority,
        expiryDate: expiryText,
        daysRemaining,
      };
    });
  return {
    days,
    expiring,
    counts: {
      expiring: expiring.length,
      expired: expiring.filter((row) => row.daysRemaining < 0).length,
      evidence: evidenceRows.length,
      completedChecklists: checklistRows.filter((row) => row.status === "complete").length,
      incompleteChecklists: checklistRows.filter((row) => row.status !== "complete").length,
      torqueRecords: torqueRows.length,
      inspectionRecords: inspectionRows.length,
      riskAssessments: riskRows.length,
      activePtwLoto: ptwLotoRows.filter((row) => row.permitStatus === "Active" || row.isolationStatus === "Verified").length,
      activeQrTokens: qrTokenRows.filter((row) => row.isActive === 1).length,
    },
    latestEvidence: evidenceRows,
    latestTorque: torqueRows,
    latestInspection: inspectionRows,
    latestRiskAssessments: riskRows,
    latestPtwLoto: ptwLotoRows,
    latestQrTokens: qrTokenRows,
  };
}


export async function saveFieldOfflineDraft(input: {
  draftId: string;
  projectId?: string | null;
  blindTag?: string | null;
  draftType: string;
  payload: unknown;
  status?: string;
  deviceId?: string | null;
  clientCreatedAt?: string | Date | null;
  actor: ComplianceActor;
}) {
  const db = await requireDb();
  const now = new Date();
  const values = {
    draftId: input.draftId,
    projectId: input.projectId ?? null,
    blindTag: input.blindTag ?? null,
    draftType: input.draftType,
    payloadJson: JSON.stringify(input.payload ?? {}),
    status: input.status ?? "synced",
    deviceId: input.deviceId ?? null,
    clientCreatedAt: input.clientCreatedAt ? new Date(input.clientCreatedAt) : null,
    syncedByOpenId: input.actor.openId,
    syncedByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(fieldOfflineDrafts).values(values).onDuplicateKeyUpdate({
    set: {
      projectId: values.projectId,
      blindTag: values.blindTag,
      draftType: values.draftType,
      payloadJson: values.payloadJson,
      status: values.status,
      deviceId: values.deviceId,
      syncedByOpenId: values.syncedByOpenId,
      syncedByName: values.syncedByName,
      updatedAt: now,
    },
  });
  return { success: true, draftId: input.draftId };
}

export async function getFieldOfflineDrafts(input?: { limit?: number; status?: string }) {
  const db = await requireDb();
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 200);
  const rows = input?.status && input.status !== "all"
    ? await db.select().from(fieldOfflineDrafts).where(eq(fieldOfflineDrafts.status, input.status)).orderBy(desc(fieldOfflineDrafts.updatedAt)).limit(limit)
    : await db.select().from(fieldOfflineDrafts).orderBy(desc(fieldOfflineDrafts.updatedAt)).limit(limit);
  return rows.map((row) => ({
    ...row,
    payload: parseJson(row.payloadJson, {}),
  }));
}

export async function submitShiftHandover(input: {
  shiftDate: string | Date;
  shiftName: string;
  areaCode?: string | null;
  projectId?: string | null;
  summary: string;
  openRisks?: string[];
  priorities?: string[];
  handoverToName?: string | null;
  actor: ComplianceActor;
}) {
  const db = await requireDb();
  const now = new Date();
  const shiftDate = input.shiftDate instanceof Date
    ? input.shiftDate.toISOString().slice(0, 10)
    : String(input.shiftDate).slice(0, 10);
  await db.insert(shiftHandoverRecords).values({
    shiftDate,
    shiftName: input.shiftName,
    areaCode: input.areaCode ?? null,
    projectId: input.projectId ?? null,
    summary: input.summary,
    openRisksJson: JSON.stringify(input.openRisks ?? []),
    prioritiesJson: JSON.stringify(input.priorities ?? []),
    handoverToName: input.handoverToName ?? null,
    createdByOpenId: input.actor.openId,
    createdByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return { success: true };
}

export async function getShiftHandovers(input?: { limit?: number }) {
  const db = await requireDb();
  const limit = Math.min(Math.max(input?.limit ?? 25, 1), 100);
  const rows = await db.select().from(shiftHandoverRecords).orderBy(desc(shiftHandoverRecords.createdAt)).limit(limit);
  return rows.map((row) => ({
    ...row,
    openRisks: parseJson(row.openRisksJson, []),
    priorities: parseJson(row.prioritiesJson, []),
  }));
}

export async function getFieldMobileSummary(days = 7) {
  const compliance = await getComplianceSummary(days);
  const [drafts, handovers] = await Promise.all([
    getFieldOfflineDrafts({ limit: 100 }),
    getShiftHandovers({ limit: 25 }),
  ]);
  return {
    days,
    complianceCounts: compliance.counts,
    offlineDrafts: {
      total: drafts.length,
      synced: drafts.filter((row) => row.status === "synced").length,
      queued: drafts.filter((row) => row.status !== "synced").length,
    },
    handovers: {
      total: handovers.length,
      latest: handovers.slice(0, 5),
    },
    expiring: compliance.expiring.slice(0, 10),
  };
}
