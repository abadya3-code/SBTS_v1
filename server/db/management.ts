import { and, desc, eq } from "drizzle-orm";
import {
  blindEvidence,
  blindInspectionRecords,
  blindPtwLotoRecords,
  blindRiskAssessments,
  blindSafetyChecklists,
  blindTorqueRecords,
  blinds,
  managementDailyReports,
  projects,
  resourcePlanEntries,
  shiftHandoverRecords,
  slaRuleSettings,
} from "../../drizzle/schema";
import { requireDb } from "./core";
import type { BlindPhase, BlindPriority } from "./types";

export type ManagementActor = {
  openId: string;
  name?: string | null;
  email?: string | null;
};

type AnyBlind = typeof blinds.$inferSelect;
type SlaRule = typeof slaRuleSettings.$inferSelect;

const phaseOrder: BlindPhase[] = [
  "Broken / Preparation",
  "Assembly",
  "Tight & Torque",
  "Final Tight",
  "Inspection Ready",
];

const defaultSlaHours: Record<BlindPhase, number> = {
  "Broken / Preparation": 24,
  Assembly: 24,
  "Tight & Torque": 18,
  "Final Tight": 18,
  "Inspection Ready": 12,
};

function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  const trimmed = String(value).trim();
  return trimmed ? trimmed.slice(0, 10) : null;
}

function ageHours(value: Date | string | null | undefined) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 36_000) / 100);
}

function activeRuleForBlind(blind: AnyBlind, rules: SlaRule[]) {
  const exact = rules.find((rule) => rule.isActive === 1 && rule.phase === blind.phase && rule.priority === blind.priority);
  const generic = rules.find((rule) => rule.isActive === 1 && rule.phase === blind.phase && rule.priority === "All");
  return exact ?? generic ?? { targetHours: defaultSlaHours[blind.phase as BlindPhase] ?? 24, escalationAfterHours: 4, escalationRole: null };
}

function isExpiredBlind(blind: AnyBlind) {
  const expiry = toDateOnly(blind.expiryDate as any);
  if (!expiry) return false;
  const today = new Date().toISOString().slice(0, 10);
  return expiry < today && blind.phase !== "Inspection Ready";
}

function mapDailyReport(row: typeof managementDailyReports.$inferSelect) {
  return {
    ...row,
    reportDate: toDateOnly(row.reportDate as any),
  };
}

function mapResource(row: typeof resourcePlanEntries.$inferSelect) {
  return {
    ...row,
    needDate: toDateOnly(row.needDate as any),
    gapQty: Math.max(0, (row.requiredQty ?? 0) - (row.availableQty ?? 0)),
  };
}

export async function getManagementSummary(days = 14) {
  const db = await requireDb();
  const [blindRows, projectRows, evidenceRows, checklistRows, torqueRows, inspectionRows, riskRows, ptwRows, handoverRows, reportRows, resourceRows, slaRows] = await Promise.all([
    db.select().from(blinds).orderBy(desc(blinds.updatedAt)),
    db.select().from(projects).orderBy(desc(projects.updatedAt)),
    db.select().from(blindEvidence).orderBy(desc(blindEvidence.createdAt)).limit(500),
    db.select().from(blindSafetyChecklists).orderBy(desc(blindSafetyChecklists.updatedAt)).limit(500),
    db.select().from(blindTorqueRecords).orderBy(desc(blindTorqueRecords.createdAt)).limit(500),
    db.select().from(blindInspectionRecords).orderBy(desc(blindInspectionRecords.createdAt)).limit(500),
    db.select().from(blindRiskAssessments).orderBy(desc(blindRiskAssessments.updatedAt)).limit(500),
    db.select().from(blindPtwLotoRecords).orderBy(desc(blindPtwLotoRecords.updatedAt)).limit(500),
    db.select().from(shiftHandoverRecords).orderBy(desc(shiftHandoverRecords.createdAt)).limit(20),
    db.select().from(managementDailyReports).orderBy(desc(managementDailyReports.reportDate), desc(managementDailyReports.createdAt)).limit(20),
    db.select().from(resourcePlanEntries).orderBy(desc(resourcePlanEntries.createdAt)).limit(100),
    db.select().from(slaRuleSettings).orderBy(slaRuleSettings.phase),
  ]);

  const overdueExpiry = blindRows.filter(isExpiredBlind);
  const slaBreaches = blindRows
    .filter((blind) => blind.phase !== "Inspection Ready")
    .map((blind) => {
      const rule = activeRuleForBlind(blind, slaRows);
      const hoursOpen = ageHours(blind.updatedAt ?? blind.createdAt);
      const targetHours = Number(rule.targetHours ?? 24);
      return {
        tag: blind.tag,
        projectId: blind.projectId,
        phase: blind.phase,
        priority: blind.priority,
        owner: blind.owner,
        hoursOpen,
        targetHours,
        breachHours: Math.max(0, Math.round((hoursOpen - targetHours) * 100) / 100),
        escalationRole: rule.escalationRole ?? null,
      };
    })
    .filter((row) => row.breachHours > 0)
    .sort((a, b) => b.breachHours - a.breachHours);

  const resourceGaps = resourceRows.map(mapResource).filter((row) => row.gapQty > 0 || ["At Risk", "Shortage", "Delayed"].includes(row.status));
  const checklistComplete = checklistRows.filter((row) => row.status === "complete").length;
  const checklistCompliance = checklistRows.length > 0 ? Math.round((checklistComplete / checklistRows.length) * 100) : 0;
  const activePtwLoto = ptwRows.filter((row) => row.permitStatus === "Active" || row.isolationStatus === "Verified").length;

  const projectHealth = projectRows.map((project) => {
    const projectBlinds = blindRows.filter((blind) => blind.projectId === project.id);
    const completed = projectBlinds.filter((blind) => blind.phase === "Inspection Ready").length;
    const critical = projectBlinds.filter((blind) => blind.priority === "Critical").length;
    const overdue = projectBlinds.filter(isExpiredBlind).length;
    const breaches = slaBreaches.filter((row) => row.projectId === project.id).length;
    const progress = projectBlinds.length > 0 ? Math.round((completed / projectBlinds.length) * 100) : project.progress;
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      progress,
      blinds: projectBlinds.length,
      completed,
      critical,
      overdue,
      slaBreaches: breaches,
      health: Math.max(0, 100 - overdue * 10 - breaches * 8 - critical * 3),
    };
  }).sort((a, b) => a.health - b.health);

  return {
    windowDays: days,
    totals: {
      projects: projectRows.length,
      blinds: blindRows.length,
      completedBlinds: blindRows.filter((blind) => blind.phase === "Inspection Ready").length,
      criticalBlinds: blindRows.filter((blind) => blind.priority === "Critical").length,
      expiryOverdue: overdueExpiry.length,
      slaBreaches: slaBreaches.length,
      resourceGaps: resourceGaps.length,
      dailyReports: reportRows.length,
      handovers: handoverRows.length,
      activePtwLoto,
      evidenceItems: evidenceRows.length,
      torqueRecords: torqueRows.length,
      inspectionRecords: inspectionRows.length,
      riskAssessments: riskRows.length,
      checklistCompliance,
    },
    phaseDistribution: phaseOrder.map((phase) => ({ phase, count: blindRows.filter((blind) => blind.phase === phase).length })),
    projectHealth,
    slaBreaches: slaBreaches.slice(0, 50),
    resourceGaps: resourceGaps.slice(0, 50),
    recentReports: reportRows.map(mapDailyReport),
    recentHandovers: handoverRows.map((row) => ({
      ...row,
      shiftDate: toDateOnly(row.shiftDate as any),
      openRisks: safeJsonArray(row.openRisksJson),
      priorities: safeJsonArray(row.prioritiesJson),
    })),
  };
}

function safeJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function getDailyProgressReports(input?: { limit?: number; projectId?: string | null }) {
  const db = await requireDb();
  const limit = Math.min(Math.max(input?.limit ?? 25, 1), 100);
  const rows = input?.projectId
    ? await db.select().from(managementDailyReports).where(eq(managementDailyReports.projectId, input.projectId)).orderBy(desc(managementDailyReports.reportDate), desc(managementDailyReports.createdAt)).limit(limit)
    : await db.select().from(managementDailyReports).orderBy(desc(managementDailyReports.reportDate), desc(managementDailyReports.createdAt)).limit(limit);
  return rows.map(mapDailyReport);
}

export async function createDailyProgressReport(input: {
  reportDate: Date | string;
  shiftName: string;
  areaCode?: string | null;
  projectId?: string | null;
  progressSummary: string;
  completedCount?: number;
  inProgressCount?: number;
  overdueCount?: number;
  safetyHighlights?: string | null;
  nextPlan?: string | null;
  actor: ManagementActor;
}) {
  const db = await requireDb();
  await db.insert(managementDailyReports).values({
    reportDate: toDateOnly(input.reportDate) ?? new Date().toISOString().slice(0, 10),
    shiftName: input.shiftName,
    areaCode: input.areaCode ?? null,
    projectId: input.projectId ?? null,
    progressSummary: input.progressSummary,
    completedCount: input.completedCount ?? 0,
    inProgressCount: input.inProgressCount ?? 0,
    overdueCount: input.overdueCount ?? 0,
    safetyHighlights: input.safetyHighlights ?? null,
    nextPlan: input.nextPlan ?? null,
    createdByOpenId: input.actor.openId,
    createdByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return getDailyProgressReports({ limit: 25 });
}

export async function getResourcePlanEntries(input?: { limit?: number; projectId?: string | null; status?: string | null }) {
  const db = await requireDb();
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 150);
  const conditions = [];
  if (input?.projectId) conditions.push(eq(resourcePlanEntries.projectId, input.projectId));
  if (input?.status && input.status !== "all") conditions.push(eq(resourcePlanEntries.status, input.status));
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const rows = whereClause
    ? await db.select().from(resourcePlanEntries).where(whereClause).orderBy(desc(resourcePlanEntries.createdAt)).limit(limit)
    : await db.select().from(resourcePlanEntries).orderBy(desc(resourcePlanEntries.createdAt)).limit(limit);
  return rows.map(mapResource);
}

export async function createResourcePlanEntry(input: {
  projectId?: string | null;
  areaCode?: string | null;
  resourceType: string;
  resourceName: string;
  requiredQty: number;
  availableQty: number;
  unit?: string;
  shiftName?: string | null;
  needDate?: Date | string | null;
  status?: string;
  notes?: string | null;
  actor: ManagementActor;
}) {
  const db = await requireDb();
  await db.insert(resourcePlanEntries).values({
    projectId: input.projectId ?? null,
    areaCode: input.areaCode ?? null,
    resourceType: input.resourceType,
    resourceName: input.resourceName,
    requiredQty: input.requiredQty,
    availableQty: input.availableQty,
    unit: input.unit ?? "each",
    shiftName: input.shiftName ?? null,
    needDate: input.needDate ? toDateOnly(input.needDate) : null,
    status: input.status ?? (input.availableQty >= input.requiredQty ? "Available" : "At Risk"),
    notes: input.notes ?? null,
    createdByOpenId: input.actor.openId,
    createdByName: input.actor.name ?? input.actor.email ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return getResourcePlanEntries({ limit: 50 });
}

export async function getSlaRules() {
  const db = await requireDb();
  const rows = await db.select().from(slaRuleSettings).orderBy(slaRuleSettings.phase);
  if (rows.length > 0) return rows;
  return phaseOrder.map((phase) => ({
    id: 0,
    phase,
    priority: "All",
    targetHours: defaultSlaHours[phase],
    escalationRole: phase === "Tight & Torque" ? "T&I Engineer" : phase === "Final Tight" ? "QC Inspector" : "Coordinator",
    escalationAfterHours: 4,
    isActive: 1,
    updatedByOpenId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

export async function upsertSlaRule(input: {
  phase: BlindPhase;
  priority?: BlindPriority | "All";
  targetHours: number;
  escalationRole?: string | null;
  escalationAfterHours?: number;
  isActive?: boolean;
  actor: ManagementActor;
}) {
  const db = await requireDb();
  const now = new Date();
  await db.insert(slaRuleSettings).values({
    phase: input.phase,
    priority: input.priority ?? "All",
    targetHours: input.targetHours,
    escalationRole: input.escalationRole ?? null,
    escalationAfterHours: input.escalationAfterHours ?? 4,
    isActive: input.isActive === false ? 0 : 1,
    updatedByOpenId: input.actor.openId,
    createdAt: now,
    updatedAt: now,
  }).onDuplicateKeyUpdate({
    set: {
      targetHours: input.targetHours,
      escalationRole: input.escalationRole ?? null,
      escalationAfterHours: input.escalationAfterHours ?? 4,
      isActive: input.isActive === false ? 0 : 1,
      updatedByOpenId: input.actor.openId,
      updatedAt: now,
    },
  });
  return getSlaRules();
}
