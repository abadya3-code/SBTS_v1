/**
 * server/db/seed.ts
 * ─────────────────
 * Seed data constants and seed functions.
 * Called lazily on first DB query to populate empty databases.
 */

import { asc } from "drizzle-orm";
import {
  InsertArea, InsertBlind, InsertProject, InsertProjectPhaseOwner, InsertProjectSettings,
  accessPermissions, accessRolePermissions, accessRoles, areas, blinds,
  projectPhaseOwners, projectSettings, projects, workflowPhases, workflowTemplates,
} from "../../drizzle/schema";
import { requireDb } from "./core";
import {
  BlindPhase, BlindPriority, PermissionGroupModel, PhaseKey, ProjectPhaseOwnerInput,
  RoleModel, WorkflowTemplateInput,
} from "./types";
// upsertWorkflow imported lazily in seedWorkflows() to avoid circular dependency

// ─── Phase & Priority Constants ────────────────────────────────────────────

export const blindPhaseOrder: BlindPhase[] = [
  "Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready",
];
export const blindPriorityOrder: BlindPriority[] = ["Low", "Normal", "High", "Critical"];
export const defaultPhaseColors: Record<BlindPhase, string> = {
  "Broken / Preparation": "#f59e0b",
  Assembly: "#2563eb",
  "Tight & Torque": "#7c3aed",
  "Final Tight": "#0891b2",
  "Inspection Ready": "#059669",
};

export function sanitizePhaseColor(value: string | null | undefined, phase: BlindPhase): string {
  const color = (value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : defaultPhaseColors[phase];
}

export const defaultPhaseOwners: ProjectPhaseOwnerInput[] = blindPhaseOrder.map((phase) => ({
  phase,
  owners: [],
  ownerName: "Unassigned",
  ownerRole: "unassigned",
  phaseColor: defaultPhaseColors[phase],
}));

// ─── Seed Data ─────────────────────────────────────────────────────────────

const seedAreas: (InsertArea & { id: number })[] = [
  { id: 1, name: "Shedgum Process Train 4", code: "SGP-04", description: "Shutdown work pack for Train-4 with the highest current blind activity.", location: "Shedgum Gas Plant · Process Trains", isActive: 1 },
  { id: 2, name: "North Manifold Group", code: "NMG-02", description: "Manifold isolation zone for northern field interfaces and shared headers.", location: "North Manifold Corridor", isActive: 1 },
  { id: 3, name: "Utility Header Maintenance", code: "UHM-01", description: "Utility header scope covering maintenance preparations, isolation, and final review.", location: "Utilities and Offsites", isActive: 1 },
];

const seedProjects: InsertProject[] = [
  { id: "PRJ-1027", name: "Shedgum Train-4 Shutdown", areaId: 1, status: "Active", blindsCount: 42, progress: 74, description: "Coordinated blind installation and verification package for the Train-4 shutdown scope." },
  { id: "PRJ-1033", name: "North Manifold Isolation", areaId: 2, status: "Active", blindsCount: 31, progress: 58, description: "Isolation sequence for manifold tie-ins with technician and QC checkpoints." },
  { id: "PRJ-1041", name: "Utility Header Maintenance", areaId: 3, status: "Final Review", blindsCount: 26, progress: 91, description: "Utility header maintenance scope in inspection-ready review before closeout." },
];

const seedBlinds: InsertBlind[] = [
  { tag: "BLD-1042", projectId: "PRJ-1027", type: "Spectacle Blind", size: "24 in", phase: "Tight & Torque", owner: "T&I Engineer", priority: "High", equipment: "SGP-04-FG-2401", location: "Train-4 inlet gas header", isolationPoint: "Upstream ESDV-401", notes: "Torque verification required before QC walkdown." },
  { tag: "BLD-1088", projectId: "PRJ-1027", type: "Spade", size: "18 in", phase: "Assembly", owner: "Metal Foreman", priority: "Normal", equipment: "SGP-04-CN-1812", location: "Condensate exchanger bay", isolationPoint: "Downstream flange set CN-1812-B", notes: "Mechanical crew assigned for assembly follow-up." },
  { tag: "BLD-1115", projectId: "PRJ-1027", type: "Spacer", size: "10 in", phase: "Inspection Ready", owner: "QC Inspector", priority: "Low", equipment: "SGP-04-UT-1007", location: "Utility tie-in skid", isolationPoint: "Skid boundary valve UT-17", notes: "Ready for final package review." },
  { tag: "BLD-1174", projectId: "PRJ-1033", type: "Blind Flange", size: "30 in", phase: "Broken / Preparation", owner: "Safety Officer", priority: "Critical", equipment: "NMG-02-MF-3004", location: "North manifold main header", isolationPoint: "Header inlet block valve NMG-22", notes: "Safety hold point must be cleared before assembly." },
  { tag: "BLD-1190", projectId: "PRJ-1033", type: "Spectacle Blind", size: "16 in", phase: "Tight & Torque", owner: "T&I Engineer", priority: "High", equipment: "NMG-02-GS-1609", location: "Shared gas service branch", isolationPoint: "Tie-in spool GS-1609-A", notes: "Torque sheet pending upload by field team." },
  { tag: "BLD-1226", projectId: "PRJ-1033", type: "Spacer", size: "8 in", phase: "Final Tight", owner: "QC Inspector", priority: "Normal", equipment: "NMG-02-VT-0802", location: "Vent header branch", isolationPoint: "Vent spool VT-0802-C", notes: "Final tight accepted; waiting inspection package." },
  { tag: "BLD-1302", projectId: "PRJ-1041", type: "Spade", size: "12 in", phase: "Inspection Ready", owner: "Inspection Team", priority: "Normal", equipment: "UHM-01-ST-1206", location: "Steam utility header", isolationPoint: "Steam header outlet ST-12", notes: "Inspection package staged for sign-off." },
  { tag: "BLD-1339", projectId: "PRJ-1041", type: "Spectacle Blind", size: "6 in", phase: "Final Tight", owner: "QC Inspector", priority: "High", equipment: "UHM-01-IA-0603", location: "Instrument air branch", isolationPoint: "IA branch flange 0603-D", notes: "High-priority closeout before utility restoration." },
];

export const seedPermissionGroups: PermissionGroupModel[] = [
  {
    group: "Projects & Areas",
    permissions: [
      { key: "projects.view", label: "View projects", description: "Read project and area lists", group: "Projects & Areas" },
      { key: "projects.create", label: "Create project", description: "Open new project records", group: "Projects & Areas" },
      { key: "projects.edit", label: "Edit project", description: "Update project details and areas", group: "Projects & Areas" },
      { key: "projects.delete", label: "Delete project", description: "Archive or remove project data", group: "Projects & Areas" },
    ],
  },
  {
    group: "Blind Registry",
    permissions: [
      { key: "blinds.view", label: "View blinds", description: "Read blind registry and QR pages", group: "Blind Registry" },
      { key: "blinds.create", label: "Create blind", description: "Add field blind records", group: "Blind Registry" },
      { key: "blinds.edit", label: "Edit blind", description: "Modify blind details and metadata", group: "Blind Registry" },
      { key: "blinds.phase.change", label: "Change phase", description: "Move a blind through workflow", group: "Blind Registry" },
      { key: "blinds.delete", label: "Delete blind", description: "Archive or delete blind records", group: "Blind Registry" },
    ],
  },
  {
    group: "Workflow & Sign-off",
    permissions: [
      { key: "workflow.view", label: "View workflow", description: "Read workflow ownership rules", group: "Workflow & Sign-off" },
      { key: "workflow.configure", label: "Configure workflow", description: "Change owners, gates, and sign-off rules", group: "Workflow & Sign-off" },
      { key: "workflow.approve", label: "Approve task", description: "Apply approval on assigned phases", group: "Workflow & Sign-off" },
      { key: "workflow.override", label: "Emergency override", description: "Use controlled admin override", group: "Workflow & Sign-off" },
    ],
  },
  {
    group: "Users, Roles & Audit",
    permissions: [
      { key: "users.view", label: "View users", description: "Read users and specialties", group: "Users, Roles & Audit" },
      { key: "users.manage", label: "Manage users", description: "Create, approve, suspend users", group: "Users, Roles & Audit" },
      { key: "roles.manage", label: "Manage roles", description: "Edit role templates and permissions", group: "Users, Roles & Audit" },
      { key: "audit.view", label: "View audit logs", description: "Read system activity trail", group: "Users, Roles & Audit" },
    ],
  },
  {
    group: "Reports & Certificates",
    permissions: [
      { key: "reports.view", label: "View reports", description: "Open dashboard and report cards", group: "Reports & Certificates" },
      { key: "reports.export", label: "Export reports", description: "Download CSV/PDF summaries", group: "Reports & Certificates" },
      { key: "certificates.manage", label: "Manage certificates", description: "Configure certificate templates", group: "Reports & Certificates" },
      { key: "qr.manage", label: "Manage QR tags", description: "Generate or reissue QR links", group: "Reports & Certificates" },
    ],
  },
];

const allSeedPermissionKeys = seedPermissionGroups.flatMap((g) => g.permissions.map((p) => p.key));
const allSeedPhaseKeys: PhaseKey[] = ["broken", "assembly", "tightTorque", "finalTight", "inspectionReady"];

export const seedRoles: RoleModel[] = [
  { key: "admin", name: "Administrator", subtitle: "Full platform owner and emergency override", members: 2, color: "#38bdf8", permissionKeys: allSeedPermissionKeys, menuKeys: ["dashboard", "projects", "blinds", "access-control", "reports", "audit", "settings"], phaseKeys: allSeedPhaseKeys },
  { key: "coordinator", name: "Coordinator", subtitle: "Project setup, area control, assignment follow-up", members: 4, color: "#60a5fa", permissionKeys: ["projects.view", "projects.create", "projects.edit", "blinds.view", "blinds.create", "blinds.edit", "workflow.view", "reports.view", "users.view"], menuKeys: ["dashboard", "projects", "blinds", "reports"], phaseKeys: ["broken"] },
  { key: "technician", name: "Technician", subtitle: "Field execution and blind status updates", members: 18, color: "#f59e0b", permissionKeys: ["projects.view", "blinds.view", "blinds.phase.change", "workflow.view", "workflow.approve", "qr.manage"], menuKeys: ["dashboard", "blinds"], phaseKeys: ["assembly"] },
  { key: "qc", name: "QC Inspector", subtitle: "Quality verification and final tightening approval", members: 7, color: "#22c55e", permissionKeys: ["projects.view", "blinds.view", "blinds.phase.change", "workflow.view", "workflow.approve", "reports.view", "audit.view"], menuKeys: ["dashboard", "blinds", "reports", "audit"], phaseKeys: ["finalTight", "inspectionReady"] },
  { key: "safety", name: "Safety Officer", subtitle: "Safety oversight, restrictions, and compliance review", members: 5, color: "#ef4444", permissionKeys: ["projects.view", "blinds.view", "workflow.view", "workflow.approve", "reports.view", "audit.view"], menuKeys: ["dashboard", "blinds", "reports", "audit"], phaseKeys: ["broken", "inspectionReady"] },
  { key: "tiEngineer", name: "T&I Engineer", subtitle: "Torque gate owner and technical validation", members: 6, color: "#eab308", permissionKeys: ["projects.view", "blinds.view", "blinds.phase.change", "workflow.view", "workflow.approve", "reports.view"], menuKeys: ["dashboard", "blinds", "reports"], phaseKeys: ["tightTorque"] },
  { key: "inspection", name: "Inspection Team", subtitle: "Final inspection readiness and certificate package review", members: 9, color: "#3b82f6", permissionKeys: ["projects.view", "blinds.view", "workflow.view", "reports.view", "audit.view"], menuKeys: ["dashboard", "blinds", "reports", "audit"], phaseKeys: ["inspectionReady"] },
  { key: "metalForeman", name: "Metal Foreman", subtitle: "Mechanical supervision and craft-level coordination", members: 3, color: "#94a3b8", permissionKeys: ["projects.view", "blinds.view", "blinds.phase.change", "workflow.view", "workflow.approve"], menuKeys: ["dashboard", "blinds"], phaseKeys: ["assembly", "tightTorque"] },
];

const seedWorkflowTemplates: WorkflowTemplateInput[] = [
  {
    id: "wf-shutdown-standard",
    name: "Shutdown Blind Control",
    description: "Standard route for blind installation, torque gate, and final inspection sign-off.",
    status: "Active",
    projectType: "Shutdown / Turnaround",
    version: "1.4",
    phases: [
      { id: "wf-prepare", label: "Preparation & broken blind request", phaseKey: "broken", roleKey: "coordinator", requiredPermissionKey: "blinds.create", gate: "Area and equipment must be verified before field execution starts.", slaHours: 6, evidence: ["Line list", "Isolation reference"], automation: "Notify Technician team when approved", color: "#ef4444", isCritical: true },
      { id: "wf-assembly", label: "Assembly / installation execution", phaseKey: "assembly", roleKey: "technician", requiredPermissionKey: "workflow.approve", gate: "Technician confirms tag, size, blind type, and QR scan from site.", slaHours: 12, evidence: ["QR scan", "Field photo"], automation: "Escalate to Coordinator after SLA breach", color: "#f59e0b", isCritical: false },
      { id: "wf-torque", label: "Tight & Torque validation", phaseKey: "tightTorque", roleKey: "tiEngineer", requiredPermissionKey: "workflow.approve", gate: "Torque values and flange condition must be signed by T&I Engineering.", slaHours: 8, evidence: ["Torque sheet", "Tool calibration"], automation: "Unlock Final Tight only after approval", color: "#eab308", isCritical: true },
      { id: "wf-final", label: "Final Tight quality sign-off", phaseKey: "finalTight", roleKey: "qc", requiredPermissionKey: "workflow.approve", gate: "QC inspector verifies final tight and records acceptance.", slaHours: 8, evidence: ["QC checklist", "Inspector signature"], automation: "Create audit event and update dashboard", color: "#22c55e", isCritical: true },
      { id: "wf-inspection", label: "Inspection ready handover", phaseKey: "inspectionReady", roleKey: "inspection", requiredPermissionKey: "reports.view", gate: "Inspection team can view final status and release certificate package.", slaHours: 10, evidence: ["Final report", "Certificate reference"], automation: "Notify project stakeholders", color: "#3b82f6", isCritical: false },
    ],
  },
  {
    id: "wf-maintenance-lite",
    name: "Maintenance Quick Route",
    description: "Lean workflow for short maintenance scopes that still requires centralized permission ownership.",
    status: "Draft",
    projectType: "Maintenance",
    version: "0.8",
    phases: [
      { id: "wf-lite-request", label: "Request validation", phaseKey: "broken", roleKey: "coordinator", requiredPermissionKey: "projects.view", gate: "Coordinator validates scope and allowed area.", slaHours: 4, evidence: ["Scope note"], automation: "Open task list for Technician", color: "#ef4444", isCritical: false },
      { id: "wf-lite-execute", label: "Field execution", phaseKey: "assembly", roleKey: "technician", requiredPermissionKey: "blinds.phase.change", gate: "Technician updates blind state from mobile QR scan.", slaHours: 8, evidence: ["QR scan"], automation: "Notify QC when complete", color: "#f59e0b", isCritical: false },
      { id: "wf-lite-close", label: "QC closeout", phaseKey: "finalTight", roleKey: "qc", requiredPermissionKey: "workflow.approve", gate: "QC reviews closeout evidence and locks the record.", slaHours: 6, evidence: ["Closeout note"], automation: "Write audit log entry", color: "#22c55e", isCritical: true },
    ],
  },
];

// ─── Seed Functions ────────────────────────────────────────────────────────

export function serializePhaseAssignees(owners: { openId: string; name: string; email?: string | null; avatarUrl?: string | null }[]): string {
  return JSON.stringify(owners.map((owner) => ({
    openId: owner.openId.trim(),
    name: owner.name.trim(),
    email: owner.email?.trim() || null,
    avatarUrl: owner.avatarUrl?.trim() || null,
  })).filter((owner) => owner.openId && owner.name));
}

export async function seedAreasAndProjects(): Promise<void> {
  const db = await requireDb();
  const existingAreas = await db.select({ id: areas.id }).from(areas).limit(1);
  if (existingAreas.length === 0) {
    await db.transaction(async (tx) => {
      const now = new Date();
      await tx.insert(areas).values(seedAreas.map((area) => ({ ...area, createdAt: now, updatedAt: now })));
      await tx.insert(projects).values(seedProjects.map((project) => ({ ...project, createdAt: now, updatedAt: now })));
    });
  }
  const existingBlinds = await db.select({ tag: blinds.tag }).from(blinds).limit(1);
  const now = new Date();
  if (existingBlinds.length === 0) {
    await db.insert(blinds).values(seedBlinds.map((blind) => ({ ...blind, createdAt: now, updatedAt: now })));
  }
  const ownerRows: InsertProjectPhaseOwner[] = seedProjects.flatMap((project) =>
    defaultPhaseOwners.map((owner) => ({
      projectId: project.id,
      phase: owner.phase,
      ownerName: owner.ownerName ?? "Unassigned",
      ownerRole: owner.ownerRole ?? "unassigned",
      phaseColor: owner.phaseColor ?? defaultPhaseColors[owner.phase],
      ownersJson: serializePhaseAssignees(owner.owners ?? []),
      createdByOpenId: "system-seed",
      updatedByOpenId: "system-seed",
      createdAt: now,
      updatedAt: now,
    }))
  );
  await db.insert(projectPhaseOwners).values(ownerRows).onDuplicateKeyUpdate({
    set: { updatedByOpenId: "system-seed", updatedAt: now },
  });
  await db.insert(projectSettings).values(
    seedProjects.map((project) => ({
      projectId: project.id,
      slipBlindGateRequired: 1,
      updatedByOpenId: "system-seed",
      createdAt: now,
      updatedAt: now,
    }))
  ).onDuplicateKeyUpdate({ set: { updatedAt: now } });
}

export async function seedAccessControl(): Promise<void> {
  const db = await requireDb();
  const existingPermissions = await db.select({ key: accessPermissions.key }).from(accessPermissions).limit(1);
  if (existingPermissions.length > 0) return;
  await db.transaction(async (tx) => {
    const now = new Date();
    const permissions = seedPermissionGroups.flatMap((group) => group.permissions);
    await tx.insert(accessPermissions).values(
      permissions.map((permission) => ({ ...permission, createdAt: now, updatedAt: now }))
    );
    await tx.insert(accessRoles).values(
      seedRoles.map((role) => ({
        key: role.key,
        name: role.name,
        subtitle: role.subtitle,
        members: role.members,
        color: role.color,
        menuKeysJson: JSON.stringify(role.menuKeys),
        phaseKeysJson: JSON.stringify(role.phaseKeys),
        createdAt: now,
        updatedAt: now,
      }))
    );
    await tx.insert(accessRolePermissions).values(
      seedRoles.flatMap((role) =>
        role.permissionKeys.map((permissionKey) => ({ roleKey: role.key, permissionKey, createdAt: now }))
      )
    );
  });
}

export async function seedWorkflows(): Promise<void> {
  await seedAccessControl();
  const db = await requireDb();
  const existing = await db.select({ id: workflowTemplates.id }).from(workflowTemplates).limit(1);
  if (existing.length > 0) return;
  // Lazy import to avoid circular dependency with workflows.ts
  const { upsertWorkflow } = await import("./workflows");
  for (const workflow of seedWorkflowTemplates) {
    await upsertWorkflow(workflow, "system-seed");
  }
}
