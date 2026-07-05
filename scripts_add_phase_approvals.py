from pathlib import Path

root = Path('/home/ubuntu/sbts-professional')

schema = root / 'drizzle/schema.ts'
text = schema.read_text()
if 'blindPhaseApprovals' not in text:
    text = text.replace(
'''export const blindWorkflowLogs = mysqlTable("blind_workflow_logs", {
  id: int("id").autoincrement().primaryKey(),
  blindTag: varchar("blindTag", { length: 40 })
    .notNull()
    .references(() => blinds.tag),
  projectId: varchar("projectId", { length: 40 })
    .notNull()
    .references(() => projects.id),
  phase: blindPhaseEnum.notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  message: text("message").notNull(),
  actorOpenId: varchar("actorOpenId", { length: 64 }),
  actorName: varchar("actorName", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
''',
'''export const blindWorkflowLogs = mysqlTable("blind_workflow_logs", {
  id: int("id").autoincrement().primaryKey(),
  blindTag: varchar("blindTag", { length: 40 })
    .notNull()
    .references(() => blinds.tag),
  projectId: varchar("projectId", { length: 40 })
    .notNull()
    .references(() => projects.id),
  phase: blindPhaseEnum.notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  message: text("message").notNull(),
  actorOpenId: varchar("actorOpenId", { length: 64 }),
  actorName: varchar("actorName", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Electronic phase approvals for each blind. One row per blind and phase keeps sign-off
 * state traceable while the workflow log records every approval or revocation event.
 */
export const blindPhaseApprovals = mysqlTable("blind_phase_approvals", {
  id: int("id").autoincrement().primaryKey(),
  blindTag: varchar("blindTag", { length: 40 })
    .notNull()
    .references(() => blinds.tag),
  projectId: varchar("projectId", { length: 40 })
    .notNull()
    .references(() => projects.id),
  phase: blindPhaseEnum.notNull(),
  approved: int("approved").default(1).notNull(),
  approvedByOpenId: varchar("approvedByOpenId", { length: 64 }),
  approvedByName: varchar("approvedByName", { length: 160 }),
  note: text("note"),
  approvedAt: timestamp("approvedAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  blindPhaseApprovalUnique: uniqueIndex("blind_phase_approval_unique").on(table.blindTag, table.phase),
}));
''')
    text = text.replace(
'''export type BlindWorkflowLogRow = typeof blindWorkflowLogs.$inferSelect;
export type InsertBlindWorkflowLog = typeof blindWorkflowLogs.$inferInsert;
''',
'''export type BlindWorkflowLogRow = typeof blindWorkflowLogs.$inferSelect;
export type InsertBlindWorkflowLog = typeof blindWorkflowLogs.$inferInsert;
export type BlindPhaseApprovalRow = typeof blindPhaseApprovals.$inferSelect;
export type InsertBlindPhaseApproval = typeof blindPhaseApprovals.$inferInsert;
''')
schema.write_text(text)

# db.ts updates
db_path = root / 'server/db.ts'
text = db_path.read_text()
text = text.replace('import { asc, eq, inArray } from "drizzle-orm";', 'import { and, asc, eq, inArray } from "drizzle-orm";')
text = text.replace(
'InsertArea, InsertBlind, InsertBlindWorkflowLog, InsertProject, InsertProjectPhaseOwner, InsertProjectSettings, InsertUser, accessPermissions, accessRolePermissions, accessRoles, areas, blindWorkflowLogs, blinds, projectPhaseOwners, projectSettings, projects, users, workflowPhases, workflowTemplates',
'InsertArea, InsertBlind, InsertBlindPhaseApproval, InsertBlindWorkflowLog, InsertProject, InsertProjectPhaseOwner, InsertProjectSettings, InsertUser, accessPermissions, accessRolePermissions, accessRoles, areas, blindPhaseApprovals, blindWorkflowLogs, blinds, projectPhaseOwners, projectSettings, projects, users, workflowPhases, workflowTemplates'
)
if 'export type BlindPhaseApprovalModel' not in text:
    text = text.replace(
'''export type BlindWorkflowLogModel = {
  id: number | string;
  blindTag: string;
  projectId: string;
  phase: BlindPhase;
  action: string;
  message: string;
  actorName: string | null;
  createdAt: Date;
};

export type BlindPhaseDetailModel = {
  phase: BlindPhase;
  color: string;
  count: number;
  status: "completed" | "current" | "waiting";
  owners: ProjectPhaseAssigneeInput[];
};
''',
'''export type BlindWorkflowLogModel = {
  id: number | string;
  blindTag: string;
  projectId: string;
  phase: BlindPhase;
  action: string;
  message: string;
  actorName: string | null;
  createdAt: Date;
};

export type BlindPhaseApprovalModel = {
  id: number | string;
  blindTag: string;
  projectId: string;
  phase: BlindPhase;
  approved: boolean;
  approvedByName: string | null;
  approvedAt: Date | null;
  revokedAt: Date | null;
  note: string | null;
};

export type BlindPhaseDetailModel = {
  phase: BlindPhase;
  color: string;
  count: number;
  status: "completed" | "current" | "waiting";
  owners: ProjectPhaseAssigneeInput[];
  approval: BlindPhaseApprovalModel;
  canApprove: boolean;
};
''')
if 'export type BlindPhaseApprovalInput' not in text:
    text = text.replace(
'''export type ActingProjectUser = {
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};
''',
'''export type ActingProjectUser = {
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};

export type BlindPhaseApprovalInput = {
  projectId: string;
  tag: string;
  phase: BlindPhase;
  approved: boolean;
  note?: string | null;
};
''')
if 'function createDefaultPhaseApproval' not in text:
    text = text.replace(
'''function normalizeBlindLogRows(rows: InsertBlindWorkflowLog[]): BlindWorkflowLogModel[] {
  return rows.map((row) => ({
    id: row.id ?? `${row.blindTag}-${row.createdAt?.getTime?.() ?? Date.now()}`,
    blindTag: row.blindTag,
    projectId: row.projectId,
    phase: row.phase as BlindPhase,
    action: row.action,
    message: row.message,
    actorName: row.actorName ?? null,
    createdAt: row.createdAt ?? new Date(),
  }));
}
''',
'''function normalizeBlindLogRows(rows: InsertBlindWorkflowLog[]): BlindWorkflowLogModel[] {
  return rows.map((row) => ({
    id: row.id ?? `${row.blindTag}-${row.createdAt?.getTime?.() ?? Date.now()}`,
    blindTag: row.blindTag,
    projectId: row.projectId,
    phase: row.phase as BlindPhase,
    action: row.action,
    message: row.message,
    actorName: row.actorName ?? null,
    createdAt: row.createdAt ?? new Date(),
  }));
}

function createDefaultPhaseApproval(blind: BlindModel, phase: BlindPhase): BlindPhaseApprovalModel {
  return {
    id: `pending-${blind.tag}-${phase}`,
    blindTag: blind.tag,
    projectId: blind.projectId,
    phase,
    approved: false,
    approvedByName: null,
    approvedAt: null,
    revokedAt: null,
    note: null,
  };
}

function normalizeBlindApprovalRows(rows: InsertBlindPhaseApproval[], blind: BlindModel): Record<BlindPhase, BlindPhaseApprovalModel> {
  const defaults = Object.fromEntries(blindPhaseOrder.map((phase) => [phase, createDefaultPhaseApproval(blind, phase)])) as Record<BlindPhase, BlindPhaseApprovalModel>;
  for (const row of rows) {
    const phase = row.phase as BlindPhase;
    defaults[phase] = {
      id: row.id ?? `${row.blindTag}-${phase}`,
      blindTag: row.blindTag,
      projectId: row.projectId,
      phase,
      approved: row.approved !== 0,
      approvedByName: row.approvedByName ?? null,
      approvedAt: row.approvedAt ?? null,
      revokedAt: row.revokedAt ?? null,
      note: row.note ?? null,
    };
  }
  return defaults;
}

function canApprovePhaseStatus(blind: BlindModel, phase: BlindPhase): boolean {
  const currentIndex = blindPhaseOrder.indexOf(blind.phase);
  const targetIndex = blindPhaseOrder.indexOf(phase);
  return targetIndex >= 0 && currentIndex >= 0 && targetIndex <= currentIndex;
}
''')
text = text.replace(
'''  const logRows = await db.select().from(blindWorkflowLogs).where(eq(blindWorkflowLogs.blindTag, tag)).orderBy(asc(blindWorkflowLogs.createdAt));
  const currentIndex = blindPhaseOrder.indexOf(blind.phase);
  const phaseTimeline: BlindPhaseDetailModel[] = blindPhaseOrder.map((phase, index) => {
    const owner = detail.settings.phaseOwners.find((item) => item.phase === phase);
    return {
      phase,
      color: owner?.phaseColor ?? defaultPhaseColors[phase],
      count: detail.metrics.phaseCounts[phase],
      status: index < currentIndex ? "completed" : index === currentIndex ? "current" : "waiting",
      owners: owner?.owners ?? [],
    };
  });

  const logs = normalizeBlindLogRows(logRows);
''',
'''  const [logRows, approvalRows] = await Promise.all([
    db.select().from(blindWorkflowLogs).where(eq(blindWorkflowLogs.blindTag, tag)).orderBy(asc(blindWorkflowLogs.createdAt)),
    db.select().from(blindPhaseApprovals).where(eq(blindPhaseApprovals.blindTag, tag)),
  ]);
  const approvalByPhase = normalizeBlindApprovalRows(approvalRows, blind);
  const currentIndex = blindPhaseOrder.indexOf(blind.phase);
  const phaseTimeline: BlindPhaseDetailModel[] = blindPhaseOrder.map((phase, index) => {
    const owner = detail.settings.phaseOwners.find((item) => item.phase === phase);
    return {
      phase,
      color: owner?.phaseColor ?? defaultPhaseColors[phase],
      count: detail.metrics.phaseCounts[phase],
      status: index < currentIndex ? "completed" : index === currentIndex ? "current" : "waiting",
      owners: owner?.owners ?? [],
      approval: approvalByPhase[phase],
      canApprove: canApprovePhaseStatus(blind, phase),
    };
  });

  const logs = normalizeBlindLogRows(logRows);
''')
if 'export async function setBlindPhaseApproval' not in text:
    text = text.replace(
'''export async function getBlindDetail(projectId: string, tag: string): Promise<BlindDetailModel | undefined> {
  const detail = await getProjectDetail(projectId);
  if (!detail) return undefined;
  const blind = detail.blinds.find((item) => item.tag === tag);
  if (!blind) return undefined;
  const db = await requireDb();
''',
'''export async function getBlindDetail(projectId: string, tag: string): Promise<BlindDetailModel | undefined> {
  const detail = await getProjectDetail(projectId);
  if (!detail) return undefined;
  const blind = detail.blinds.find((item) => item.tag === tag);
  if (!blind) return undefined;
  const db = await requireDb();
''')
    text = text.replace(
'''  return {
    project: detail.project,
    blind,
    settings: detail.settings,
    phaseTimeline,
    logs: logs.length ? logs : buildSyntheticBlindLogs(blind, detail.project),
  };
}

export async function getAccessControlModel(): Promise<AccessControlModel> {
''',
'''  return {
    project: detail.project,
    blind,
    settings: detail.settings,
    phaseTimeline,
    logs: logs.length ? logs : buildSyntheticBlindLogs(blind, detail.project),
  };
}

export async function setBlindPhaseApproval(input: BlindPhaseApprovalInput, actor: ActingProjectUser): Promise<BlindDetailModel> {
  await seedAreasAndProjects();
  const detail = await getProjectDetail(input.projectId);
  const blind = detail?.blinds.find((item) => item.tag === input.tag);
  if (!detail || !blind) throw new Error(`Blind ${input.tag} was not found in project ${input.projectId}.`);
  if (!canApprovePhaseStatus(blind, input.phase)) {
    throw new Error(`Phase ${input.phase} cannot be approved before the blind reaches that workflow phase.`);
  }

  const owner = detail.settings.phaseOwners.find((item) => item.phase === input.phase);
  if (!canActingUserEditAssignedPhase(owner, actor)) {
    throw new Error("Only the configured phase owner can approve or revoke this phase sign-off.");
  }

  const db = await requireDb();
  const now = new Date();
  const actorName = actor.name ?? actor.email ?? actor.openId;
  const note = toNullableText(input.note);
  const approvalRow: InsertBlindPhaseApproval = {
    blindTag: blind.tag,
    projectId: blind.projectId,
    phase: input.phase,
    approved: input.approved ? 1 : 0,
    approvedByOpenId: input.approved ? actor.openId : null,
    approvedByName: input.approved ? actorName : null,
    note,
    approvedAt: input.approved ? now : null,
    revokedAt: input.approved ? null : now,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction(async (tx) => {
    await tx.insert(blindPhaseApprovals).values(approvalRow).onDuplicateKeyUpdate({
      set: {
        approved: approvalRow.approved,
        approvedByOpenId: approvalRow.approvedByOpenId,
        approvedByName: approvalRow.approvedByName,
        note: approvalRow.note,
        approvedAt: approvalRow.approvedAt,
        revokedAt: approvalRow.revokedAt,
        updatedAt: now,
      },
    });
    await tx.insert(blindWorkflowLogs).values(createBlindLog({
      blindTag: blind.tag,
      projectId: blind.projectId,
      phase: input.phase,
      action: input.approved ? "Electronic phase approved" : "Electronic phase approval revoked",
      message: input.approved
        ? `${input.phase} was electronically approved by ${actorName}${note ? ` — ${note}` : ""}.`
        : `${input.phase} electronic approval was revoked by ${actorName}${note ? ` — ${note}` : ""}.`,
      actor,
      createdAt: now,
    }));
  });

  const updatedDetail = await getBlindDetail(input.projectId, input.tag);
  if (!updatedDetail) throw new Error("Blind detail could not be read after approval update.");
  return updatedDetail;
}

export async function getAccessControlModel(): Promise<AccessControlModel> {
''')

db_path.write_text(text)

# routers.ts updates
router_path = root / 'server/routers.ts'
text = router_path.read_text()
text = text.replace('getBlindDetail, getProjectDetail, getProjectSettings, getProjectsByArea, getWorkflowById, updateBlindInProject', 'getBlindDetail, getProjectDetail, getProjectSettings, getProjectsByArea, getWorkflowById, setBlindPhaseApproval, updateBlindInProject')
if 'blindPhaseApprovalSchema' not in text:
    text = text.replace(
'''const blindUpdateSchema = blindInputSchema.partial().extend({
  projectId: z.string().min(2).max(40),
  tag: z.string().trim().min(2).max(40),
});
''',
'''const blindUpdateSchema = blindInputSchema.partial().extend({
  projectId: z.string().min(2).max(40),
  tag: z.string().trim().min(2).max(40),
});

const blindPhaseApprovalSchema = z.object({
  projectId: z.string().min(2).max(40),
  tag: z.string().trim().min(2).max(40),
  phase: blindPhaseSchema,
  approved: z.boolean(),
  note: z.string().trim().max(800).nullable().optional(),
});
''')
    text = text.replace(
'''  updateBlind: protectedProcedure.input(blindUpdateSchema).mutation(async ({ input, ctx }) => {
    const detail = await getProjectDetail(input.projectId);
    const existing = detail?.blinds.find((blind) => blind.tag === input.tag);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Blind was not found in this project." });
    const actingUser = toActingUser(ctx.user);
    const targetPhase = input.phase ?? existing.phase;
    const allowedExistingPhase = await canUserEditProjectPhase(input.projectId, existing.phase, actingUser);
    const allowedTargetPhase = await canUserEditProjectPhase(input.projectId, targetPhase, actingUser);
    if (!allowedExistingPhase || !allowedTargetPhase) throw new TRPCError({ code: "FORBIDDEN", message: "Only the configured phase owner can update this blind or move it to another phase." });
    const settings = await getProjectSettings(input.projectId);
    enforceSlipBlindInput({ ...existing, ...input }, settings?.slipBlindGateRequired);
    return updateBlindInProject(input, actingUser);
  }),
''',
'''  updateBlind: protectedProcedure.input(blindUpdateSchema).mutation(async ({ input, ctx }) => {
    const detail = await getProjectDetail(input.projectId);
    const existing = detail?.blinds.find((blind) => blind.tag === input.tag);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Blind was not found in this project." });
    const actingUser = toActingUser(ctx.user);
    const targetPhase = input.phase ?? existing.phase;
    const allowedExistingPhase = await canUserEditProjectPhase(input.projectId, existing.phase, actingUser);
    const allowedTargetPhase = await canUserEditProjectPhase(input.projectId, targetPhase, actingUser);
    if (!allowedExistingPhase || !allowedTargetPhase) throw new TRPCError({ code: "FORBIDDEN", message: "Only the configured phase owner can update this blind or move it to another phase." });
    const settings = await getProjectSettings(input.projectId);
    enforceSlipBlindInput({ ...existing, ...input }, settings?.slipBlindGateRequired);
    return updateBlindInProject(input, actingUser);
  }),
  approveBlindPhase: protectedProcedure.input(blindPhaseApprovalSchema).mutation(async ({ input, ctx }) => {
    const actingUser = toActingUser(ctx.user);
    try {
      return await setBlindPhaseApproval(input, actingUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Electronic phase approval failed.";
      if (message.includes("not found")) throw new TRPCError({ code: "NOT_FOUND", message });
      if (message.includes("Only the configured phase owner")) throw new TRPCError({ code: "FORBIDDEN", message });
      throw new TRPCError({ code: "BAD_REQUEST", message });
    }
  }),
''')
router_path.write_text(text)
