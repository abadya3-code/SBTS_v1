import { and, asc, desc, eq, lte } from "drizzle-orm";
import {
  blindEvidence,
  blindInspectionRecords,
  blindSafetyChecklists,
  blindTorqueRecords,
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
  const [blindRows, evidenceRows, checklistRows, torqueRows, inspectionRows] = await Promise.all([
    db.select().from(blinds).where(and(eq(blinds.projectId, projectId), eq(blinds.tag, blindTag))).limit(1),
    db.select().from(blindEvidence).where(and(eq(blindEvidence.projectId, projectId), eq(blindEvidence.blindTag, blindTag))).orderBy(desc(blindEvidence.createdAt)),
    db.select().from(blindSafetyChecklists).where(and(eq(blindSafetyChecklists.projectId, projectId), eq(blindSafetyChecklists.blindTag, blindTag))).orderBy(asc(blindSafetyChecklists.phase)),
    db.select().from(blindTorqueRecords).where(and(eq(blindTorqueRecords.projectId, projectId), eq(blindTorqueRecords.blindTag, blindTag))).orderBy(desc(blindTorqueRecords.createdAt)),
    db.select().from(blindInspectionRecords).where(and(eq(blindInspectionRecords.projectId, projectId), eq(blindInspectionRecords.blindTag, blindTag))).orderBy(desc(blindInspectionRecords.createdAt)),
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
    counts: {
      evidence: evidenceRows.length,
      completedChecklists: checklistByPhase.filter((row) => row.status === "complete").length,
      torqueRecords: torqueRows.length,
      inspectionRecords: inspectionRows.length,
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

export async function getComplianceSummary(days = 30) {
  const db = await requireDb();
  const today = new Date();
  const horizon = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  const horizonText = horizon.toISOString().slice(0, 10);
  const [blindRows, evidenceRows, checklistRows, torqueRows, inspectionRows, projectRows] = await Promise.all([
    db.select().from(blinds).orderBy(asc(blinds.expiryDate)),
    db.select().from(blindEvidence).orderBy(desc(blindEvidence.createdAt)).limit(25),
    db.select().from(blindSafetyChecklists),
    db.select().from(blindTorqueRecords).orderBy(desc(blindTorqueRecords.createdAt)).limit(25),
    db.select().from(blindInspectionRecords).orderBy(desc(blindInspectionRecords.createdAt)).limit(25),
    db.select().from(projects),
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
    },
    latestEvidence: evidenceRows,
    latestTorque: torqueRows,
    latestInspection: inspectionRows,
  };
}
