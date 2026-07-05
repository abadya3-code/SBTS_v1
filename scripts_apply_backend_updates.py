from pathlib import Path

root = Path('/home/ubuntu/sbts-professional')

# 1) schema.ts updates
schema_path = root / 'drizzle/schema.ts'
schema = schema_path.read_text()
if 'export const projectSettings' not in schema:
    schema = schema.replace(
        '  ownerRole: varchar("ownerRole", { length: 120 }).notNull(),\n  ownersJson: text("ownersJson"),\n',
        '  ownerRole: varchar("ownerRole", { length: 120 }).notNull(),\n  phaseColor: varchar("phaseColor", { length: 24 }).default("#f59e0b").notNull(),\n  ownersJson: text("ownersJson"),\n'
    )
    insert_after = '''export const projectPhaseOwners = mysqlTable("project_phase_owners", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 40 })
    .notNull()
    .references(() => projects.id),
  phase: blindPhaseEnum.notNull(),
  ownerName: varchar("ownerName", { length: 160 }).notNull(),
  ownerRole: varchar("ownerRole", { length: 120 }).notNull(),
  phaseColor: varchar("phaseColor", { length: 24 }).default("#f59e0b").notNull(),
  ownersJson: text("ownersJson"),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectPhaseUnique: uniqueIndex("project_phase_owner_unique").on(table.projectId, table.phase),
}));
'''
    add_block = '''
/**
 * Project-level operational settings. Phase assignees stay in project_phase_owners;
 * policy switches that apply to the project as a whole live here.
 */
export const projectSettings = mysqlTable("project_settings", {
  projectId: varchar("projectId", { length: 40 })
    .primaryKey()
    .references(() => projects.id),
  slipBlindGateRequired: int("slipBlindGateRequired").default(1).notNull(),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Blind-level workflow log for the detail page. It records future operational actions;
 * existing rows can still render a synthesized baseline log if no audit rows exist.
 */
export const blindWorkflowLogs = mysqlTable("blind_workflow_logs", {
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
'''
    schema = schema.replace(insert_after, insert_after + add_block)
    schema = schema.replace(
        'export type ProjectPhaseOwnerRow = typeof projectPhaseOwners.$inferSelect;\nexport type InsertProjectPhaseOwner = typeof projectPhaseOwners.$inferInsert;\n',
        'export type ProjectPhaseOwnerRow = typeof projectPhaseOwners.$inferSelect;\nexport type InsertProjectPhaseOwner = typeof projectPhaseOwners.$inferInsert;\nexport type ProjectSettingsRow = typeof projectSettings.$inferSelect;\nexport type InsertProjectSettings = typeof projectSettings.$inferInsert;\nexport type BlindWorkflowLogRow = typeof blindWorkflowLogs.$inferSelect;\nexport type InsertBlindWorkflowLog = typeof blindWorkflowLogs.$inferInsert;\n'
    )
schema_path.write_text(schema)

# 2) db.ts updates
db_path = root / 'server/db.ts'
db = db_path.read_text()
# imports
if 'projectSettings' not in db.split('\n', 5)[3]:
    db = db.replace(
        'InsertArea, InsertBlind, InsertProject, InsertProjectPhaseOwner, InsertUser, accessPermissions, accessRolePermissions, accessRoles, areas, blinds, projectPhaseOwners, projects, users, workflowPhases, workflowTemplates',
        'InsertArea, InsertBlind, InsertBlindWorkflowLog, InsertProject, InsertProjectPhaseOwner, InsertProjectSettings, InsertUser, accessPermissions, accessRolePermissions, accessRoles, areas, blindWorkflowLogs, blinds, projectPhaseOwners, projectSettings, projects, users, workflowPhases, workflowTemplates'
    )
# types/defaults
if 'export type PhaseColorConfig' not in db:
    db = db.replace(
        'export type ProjectPhaseOwnerInput = {\n  phase: BlindPhase;\n  owners: ProjectPhaseAssigneeInput[];\n  ownerName?: string;\n  ownerRole?: string;\n};\n',
        'export type ProjectPhaseOwnerInput = {\n  phase: BlindPhase;\n  owners: ProjectPhaseAssigneeInput[];\n  ownerName?: string;\n  ownerRole?: string;\n  phaseColor?: string;\n};\n\nexport type PhaseColorConfig = {\n  phase: BlindPhase;\n  color: string;\n};\n'
    )
    db = db.replace(
        'export type ProjectPhaseOwnerModel = {\n  projectId: string;\n  phase: BlindPhase;\n  owners: ProjectPhaseAssigneeInput[];\n  ownerName: string;\n  ownerRole: string;\n  updatedAt: Date | null;\n};\n',
        'export type ProjectPhaseOwnerModel = {\n  projectId: string;\n  phase: BlindPhase;\n  owners: ProjectPhaseAssigneeInput[];\n  ownerName: string;\n  ownerRole: string;\n  phaseColor: string;\n  updatedAt: Date | null;\n};\n'
    )
    db = db.replace(
        'export type ProjectSettingsModel = {\n  projectId: string;\n  phaseOwners: ProjectPhaseOwnerModel[];\n};\n',
        'export type ProjectSettingsModel = {\n  projectId: string;\n  slipBlindGateRequired: boolean;\n  phaseOwners: ProjectPhaseOwnerModel[];\n};\n\nexport type BlindWorkflowLogModel = {\n  id: number | string;\n  blindTag: string;\n  projectId: string;\n  phase: BlindPhase;\n  action: string;\n  message: string;\n  actorName: string | null;\n  createdAt: Date;\n};\n\nexport type BlindPhaseDetailModel = {\n  phase: BlindPhase;\n  color: string;\n  count: number;\n  status: "completed" | "current" | "waiting";\n  owners: ProjectPhaseAssigneeInput[];\n};\n\nexport type BlindDetailModel = {\n  project: ProjectModel;\n  blind: BlindModel;\n  settings: ProjectSettingsModel;\n  phaseTimeline: BlindPhaseDetailModel[];\n  logs: BlindWorkflowLogModel[];\n};\n'
    )
# defaults
if 'defaultPhaseColors' not in db:
    db = db.replace(
        'export const blindPhaseOrder: BlindPhase[] = ["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"];\nexport const blindPriorityOrder: BlindPriority[] = ["Low", "Normal", "High", "Critical"];\n',
        'export const blindPhaseOrder: BlindPhase[] = ["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"];\nexport const blindPriorityOrder: BlindPriority[] = ["Low", "Normal", "High", "Critical"];\n\nexport const defaultPhaseColors: Record<BlindPhase, string> = {\n  "Broken / Preparation": "#f59e0b",\n  Assembly: "#2563eb",\n  "Tight & Torque": "#7c3aed",\n  "Final Tight": "#0891b2",\n  "Inspection Ready": "#059669",\n};\n\nfunction sanitizePhaseColor(value: string | null | undefined, phase: BlindPhase): string {\n  const color = (value ?? "").trim();\n  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : defaultPhaseColors[phase];\n}\n'
    )
    db = db.replace(
        'const defaultPhaseOwners: ProjectPhaseOwnerInput[] = [\n  { phase: "Broken / Preparation", owners: [], ownerName: "Unassigned", ownerRole: "unassigned" },\n  { phase: "Assembly", owners: [], ownerName: "Unassigned", ownerRole: "unassigned" },\n  { phase: "Tight & Torque", owners: [], ownerName: "Unassigned", ownerRole: "unassigned" },\n  { phase: "Final Tight", owners: [], ownerName: "Unassigned", ownerRole: "unassigned" },\n  { phase: "Inspection Ready", owners: [], ownerName: "Unassigned", ownerRole: "unassigned" },\n];\n',
        'const defaultPhaseOwners: ProjectPhaseOwnerInput[] = blindPhaseOrder.map((phase) => ({\n  phase,\n  owners: [],\n  ownerName: "Unassigned",\n  ownerRole: "unassigned",\n  phaseColor: defaultPhaseColors[phase],\n}));\n'
    )
# normalizeProjectPhaseOwnerRows function locate and replace block? Need inspect actual function name
old = '''function normalizeProjectPhaseOwnerRows(projectId: string, rows: InsertProjectPhaseOwner[]): ProjectSettingsModel {
  const byPhase = new Map(rows.map((row) => [row.phase as BlindPhase, row]));
  return {
    projectId,
    phaseOwners: blindPhaseOrder.map((phase) => {
      const row = byPhase.get(phase);
      const owners = deserializePhaseAssignees(row?.ownersJson ?? null);
      return {
        projectId,
        phase,
        owners,
        ownerName: row?.ownerName ?? (owners.length ? owners.map((owner) => owner.name).join(", ") : "Unassigned"),
        ownerRole: row?.ownerRole ?? "phase-assignee",
        updatedAt: row?.updatedAt ?? null,
      };
    }),
  };
}
'''
new = '''function normalizeProjectSettingsRows(projectId: string, ownerRows: InsertProjectPhaseOwner[], settingsRow?: InsertProjectSettings | null): ProjectSettingsModel {
  const byPhase = new Map(ownerRows.map((row) => [row.phase as BlindPhase, row]));
  return {
    projectId,
    slipBlindGateRequired: settingsRow?.slipBlindGateRequired !== 0,
    phaseOwners: blindPhaseOrder.map((phase) => {
      const row = byPhase.get(phase);
      const owners = deserializePhaseAssignees(row?.ownersJson ?? null);
      return {
        projectId,
        phase,
        owners,
        ownerName: row?.ownerName ?? (owners.length ? owners.map((owner) => owner.name).join(", ") : "Unassigned"),
        ownerRole: row?.ownerRole ?? "phase-assignee",
        phaseColor: sanitizePhaseColor(row?.phaseColor, phase),
        updatedAt: row?.updatedAt ?? null,
      };
    }),
  };
}
'''
if old in db:
    db = db.replace(old, new)
else:
    # fallback more targeted
    db = db.replace('function normalizeProjectPhaseOwnerRows', 'function normalizeProjectSettingsRows')
# replace calls
if 'normalizeProjectPhaseOwnerRows' in db:
    db = db.replace('normalizeProjectPhaseOwnerRows(projectId, ownerRows)', 'normalizeProjectSettingsRows(projectId, ownerRows, settingsRows[0])')
# fix getProjectDetail parallel settings row if not already
if 'settingsRows' not in db[db.find('export async function getProjectDetail'):db.find('export async function getProjectSettings')]:
    db = db.replace(
        '  const [areaRows, blindRows, ownerRows] = await Promise.all([\n    db.select().from(areas),\n    db.select().from(blinds).where(eq(blinds.projectId, projectId)).orderBy(asc(blinds.tag)),\n    db.select().from(projectPhaseOwners).where(eq(projectPhaseOwners.projectId, projectId)).orderBy(asc(projectPhaseOwners.phase)),\n  ]);',
        '  const [areaRows, blindRows, ownerRows, settingsRows] = await Promise.all([\n    db.select().from(areas),\n    db.select().from(blinds).where(eq(blinds.projectId, projectId)).orderBy(asc(blinds.tag)),\n    db.select().from(projectPhaseOwners).where(eq(projectPhaseOwners.projectId, projectId)).orderBy(asc(projectPhaseOwners.phase)),\n    db.select().from(projectSettings).where(eq(projectSettings.projectId, projectId)).limit(1),\n  ]);'
    )
# getProjectSettings replace implementation
start = db.find('export async function getProjectSettings')
end = db.find('\nexport async function getAssignableProjectUsers', start)
if start != -1 and end != -1:
    db = db[:start] + '''export async function getProjectSettings(projectId: string): Promise<ProjectSettingsModel | undefined> {
  await seedAreasAndProjects();
  const db = await requireDb();
  const projectRows = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!projectRows[0]) return undefined;
  const [ownerRows, settingsRows] = await Promise.all([
    db.select().from(projectPhaseOwners).where(eq(projectPhaseOwners.projectId, projectId)).orderBy(asc(projectPhaseOwners.phase)),
    db.select().from(projectSettings).where(eq(projectSettings.projectId, projectId)).limit(1),
  ]);
  return normalizeProjectSettingsRows(projectId, ownerRows, settingsRows[0]);
}
''' + db[end:]
# updateProjectSettings signature and rows
start = db.find('export async function updateProjectSettings')
end = db.find('\nexport async function canUserEditProjectPhase', start)
if start != -1 and end != -1:
    db = db[:start] + '''export async function updateProjectSettings(projectId: string, phaseOwners: ProjectPhaseOwnerInput[], userOpenId?: string, slipBlindGateRequired = true): Promise<ProjectSettingsModel> {
  await seedAreasAndProjects();
  const db = await requireDb();
  const projectRows = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!projectRows[0]) throw new Error(`Cannot update settings for unknown projectId: ${projectId}`);

  const now = new Date();
  const rows: InsertProjectPhaseOwner[] = blindPhaseOrder.map((phase) => {
    const inputOwner = phaseOwners.find((owner) => owner.phase === phase) ?? defaultPhaseOwners.find((owner) => owner.phase === phase);
    return {
      projectId,
      phase,
      ownerName: inputOwner?.owners?.length ? inputOwner.owners.map((owner) => owner.name.trim()).filter(Boolean).join(", ") : "Unassigned",
      ownerRole: "phase-assignee",
      phaseColor: sanitizePhaseColor(inputOwner?.phaseColor, phase),
      ownersJson: serializePhaseAssignees(inputOwner?.owners ?? []),
      createdByOpenId: userOpenId,
      updatedByOpenId: userOpenId,
      createdAt: now,
      updatedAt: now,
    };
  });
  const settingsRow: InsertProjectSettings = {
    projectId,
    slipBlindGateRequired: slipBlindGateRequired ? 1 : 0,
    updatedByOpenId: userOpenId,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction(async (tx) => {
    await tx.delete(projectPhaseOwners).where(eq(projectPhaseOwners.projectId, projectId));
    await tx.insert(projectPhaseOwners).values(rows);
    await tx.insert(projectSettings).values(settingsRow).onDuplicateKeyUpdate({
      set: {
        slipBlindGateRequired: settingsRow.slipBlindGateRequired,
        updatedByOpenId: userOpenId,
        updatedAt: now,
      },
    });
  });

  const saved = await getProjectSettings(projectId);
  if (!saved) throw new Error("Project settings could not be read after update.");
  return saved;
}
''' + db[end:]
# log helper and validation before addBlindToProject
if 'function validateSlipBlindPolicy' not in db:
    db = db.replace(
        'async function updateProjectBlindCount(projectId: string): Promise<void> {',
        '''function isSlipBlindType(type: string): boolean {
  return type.trim().toLowerCase().replace(/[^a-z0-9]/g, "") === "slipblind";
}

async function validateSlipBlindPolicy(input: Pick<BlindInput, "projectId" | "type" | "slipMetalForemanApproved" | "slipBlindMerged">): Promise<void> {
  const settings = await getProjectSettings(input.projectId);
  if (!settings?.slipBlindGateRequired || !isSlipBlindType(input.type)) return;
  if (!input.slipMetalForemanApproved || !input.slipBlindMerged) {
    throw new Error("Slip Blind requires Foreman Metal approval and merged confirmation before it can be saved for this project.");
  }
}

function createBlindLog(input: { blindTag: string; projectId: string; phase: BlindPhase; action: string; message: string; actor?: ActingProjectUser | null; createdAt?: Date }): InsertBlindWorkflowLog {
  return {
    blindTag: input.blindTag,
    projectId: input.projectId,
    phase: input.phase,
    action: input.action,
    message: input.message,
    actorOpenId: input.actor?.openId ?? null,
    actorName: input.actor?.name ?? input.actor?.email ?? null,
    createdAt: input.createdAt ?? new Date(),
  };
}

async function appendBlindLog(log: InsertBlindWorkflowLog): Promise<void> {
  const db = await requireDb();
  await db.insert(blindWorkflowLogs).values(log);
}

async function updateProjectBlindCount(projectId: string): Promise<void> {'''
    )
# add validation and log in addBlind
if 'actor?: ActingProjectUser' not in db[db.find('export async function addBlindToProject'):db.find('export async function bulkAddBlindsToProject')]:
    db = db.replace('export async function addBlindToProject(input: BlindInput): Promise<BlindModel> {', 'export async function addBlindToProject(input: BlindInput, actor?: ActingProjectUser): Promise<BlindModel> {')
    db = db.replace('  const normalized = normalizeBlindInput(input);\n  await db.insert(blinds).values(normalized);', '  await validateSlipBlindPolicy(input);\n  const normalized = normalizeBlindInput(input);\n  await db.insert(blinds).values(normalized);')
    db = db.replace('  if (!saved[0]) throw new Error("Blind could not be read after creation.");\n  return normalizeBlindRows(saved)[0];\n}', '  if (!saved[0]) throw new Error("Blind could not be read after creation.");\n  const created = normalizeBlindRows(saved)[0];\n  await appendBlindLog(createBlindLog({ blindTag: created.tag, projectId: created.projectId, phase: created.phase, action: "Blind registered", message: `Blind ${created.tag} was registered in ${created.phase}.`, actor }));\n  return created;\n}', 1)
# bulk validate and logs
if 'actors are not stored per row' not in db:
    db = db.replace('  const normalized = inputs.map((input) => normalizeBlindInput({ ...input, projectId }));', '  for (const input of inputs) {\n    await validateSlipBlindPolicy({ ...input, projectId });\n  }\n  const normalized = inputs.map((input) => normalizeBlindInput({ ...input, projectId }));')
    db = db.replace('  const saved = normalized.length > 0 ? await db.select().from(blinds).where(inArray(blinds.tag, tags)).orderBy(asc(blinds.tag)) : [];\n  return { created: normalizeBlindRows(saved), count: saved.length };', '  const saved = normalized.length > 0 ? await db.select().from(blinds).where(inArray(blinds.tag, tags)).orderBy(asc(blinds.tag)) : [];\n  const created = normalizeBlindRows(saved);\n  if (created.length > 0) {\n    await db.insert(blindWorkflowLogs).values(created.map((blind) => createBlindLog({ blindTag: blind.tag, projectId, phase: blind.phase, action: "Bulk blind registered", message: `Blind ${blind.tag} was created through bulk import.` })));\n  }\n  return { created, count: saved.length };')
# updateBlind signature validation log
if 'updateBlindInProject(input: BlindUpdateInput, actor?' not in db:
    db = db.replace('export async function updateBlindInProject(input: BlindUpdateInput): Promise<BlindModel> {', 'export async function updateBlindInProject(input: BlindUpdateInput, actor?: ActingProjectUser): Promise<BlindModel> {')
    db = db.replace('  const updateSet: Partial<InsertBlind> = {};', '  const policyCandidate = {\n    projectId: input.projectId,\n    type: input.type ?? existing.type,\n    slipMetalForemanApproved: input.slipMetalForemanApproved ?? Boolean(existing.slipMetalForemanApproved),\n    slipBlindMerged: input.slipBlindMerged ?? Boolean(existing.slipBlindMerged),\n  };\n  await validateSlipBlindPolicy(policyCandidate);\n\n  const updateSet: Partial<InsertBlind> = {};')
    db = db.replace('  if (!saved[0]) throw new Error("Blind could not be read after update.");\n  return normalizeBlindRows(saved)[0];\n}', '  if (!saved[0]) throw new Error("Blind could not be read after update.");\n  const updated = normalizeBlindRows(saved)[0];\n  const phaseChanged = existing.phase !== updated.phase;\n  await appendBlindLog(createBlindLog({ blindTag: updated.tag, projectId: updated.projectId, phase: updated.phase, action: phaseChanged ? "Workflow phase changed" : "Blind updated", message: phaseChanged ? `Phase moved from ${existing.phase} to ${updated.phase}.` : `Blind ${updated.tag} details were updated.`, actor }));\n  return updated;\n}', 1)
# add getBlindDetail before getAccessControlModel
if 'export async function getBlindDetail' not in db:
    insert = '''
function buildSyntheticBlindLogs(blind: BlindModel, project: ProjectModel): BlindWorkflowLogModel[] {
  return [
    {
      id: `synthetic-${blind.tag}-created`,
      blindTag: blind.tag,
      projectId: blind.projectId,
      phase: "Broken / Preparation",
      action: "Blind registered",
      message: `Blind ${blind.tag} belongs to ${project.name} and is currently tracked in ${blind.phase}.`,
      actorName: "System baseline",
      createdAt: blind.updatedAt,
    },
  ];
}

function normalizeBlindLogRows(rows: InsertBlindWorkflowLog[]): BlindWorkflowLogModel[] {
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

export async function getBlindDetail(projectId: string, tag: string): Promise<BlindDetailModel | undefined> {
  const detail = await getProjectDetail(projectId);
  if (!detail) return undefined;
  const blind = detail.blinds.find((item) => item.tag === tag);
  if (!blind) return undefined;
  const db = await requireDb();
  const logRows = await db.select().from(blindWorkflowLogs).where(eq(blindWorkflowLogs.blindTag, tag)).orderBy(asc(blindWorkflowLogs.createdAt));
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
  return {
    project: detail.project,
    blind,
    settings: detail.settings,
    phaseTimeline,
    logs: logs.length ? logs : buildSyntheticBlindLogs(blind, detail.project),
  };
}

'''
    db = db.replace('\nexport async function getAccessControlModel', insert + 'export async function getAccessControlModel')
# seed settings + phaseColor
if 'phaseColor: owner.phaseColor' not in db:
    db = db.replace('    ownerRole: owner.ownerRole ?? "unassigned",\n    ownersJson:', '    ownerRole: owner.ownerRole ?? "unassigned",\n    phaseColor: owner.phaseColor ?? defaultPhaseColors[owner.phase],\n    ownersJson:')
if 'await db.insert(projectSettings)' not in db[db.find('export async function seedAreasAndProjects'):db.find('export async function seedAccessControl')]:
    db = db.replace('  await db.insert(projectPhaseOwners).values(ownerRows).onDuplicateKeyUpdate({\n    set: {\n      updatedByOpenId: "system-seed",\n      updatedAt: now,\n    },\n  });\n}', '  await db.insert(projectPhaseOwners).values(ownerRows).onDuplicateKeyUpdate({\n    set: {\n      updatedByOpenId: "system-seed",\n      updatedAt: now,\n    },\n  });\n\n  await db.insert(projectSettings).values(seedProjects.map((project) => ({\n    projectId: project.id,\n    slipBlindGateRequired: 1,\n    updatedByOpenId: "system-seed",\n    createdAt: now,\n    updatedAt: now,\n  }))).onDuplicateKeyUpdate({\n    set: {\n      updatedAt: now,\n    },\n  });\n}')
db_path.write_text(db)

# 3) routers.ts updates
router_path = root / 'server/routers.ts'
routers = router_path.read_text()
routers = routers.replace('getAccessControlModel, getAllProjects', 'getAccessControlModel, getAllProjects')
if 'getBlindDetail' not in routers.split('\n', 12)[6]:
    routers = routers.replace('getAssignableProjectUsers, getProjectDetail', 'getAssignableProjectUsers, getBlindDetail, getProjectDetail')
if 'phaseColor' not in routers[routers.find('const projectSettingsSchema'):routers.find('const areaCreateSchema')]:
    routers = routers.replace(
        '  phaseOwners: z.array(z.object({\n    phase: blindPhaseSchema,\n    owners: z.array(phaseAssigneeSchema).max(20),\n  })).min(1).max(blindPhaseOrder.length),\n',
        '  slipBlindGateRequired: z.boolean().default(true),\n  phaseOwners: z.array(z.object({\n    phase: blindPhaseSchema,\n    phaseColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),\n    owners: z.array(phaseAssigneeSchema).max(20),\n  })).min(1).max(blindPhaseOrder.length),\n'
    )
if 'function enforceSlipBlindInput' not in routers:
    routers = routers.replace(
        'const toActingUser = (ctxUser: RouterContextUser) => ({\n  openId: ctxUser.openId,\n  name: ctxUser.name ?? null,\n  email: ctxUser.email ?? null,\n  role: ctxUser.role,\n});\n',
        'const toActingUser = (ctxUser: RouterContextUser) => ({\n  openId: ctxUser.openId,\n  name: ctxUser.name ?? null,\n  email: ctxUser.email ?? null,\n  role: ctxUser.role,\n});\n\nfunction enforceSlipBlindInput(input: { type?: string; slipMetalForemanApproved?: boolean; slipBlindMerged?: boolean }, gateRequired?: boolean) {\n  const isSlipBlind = input.type?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") === "slipblind";\n  if (!gateRequired || !isSlipBlind) return;\n  if (!input.slipMetalForemanApproved || !input.slipBlindMerged) {\n    throw new TRPCError({ code: "BAD_REQUEST", message: "Slip Blind requires Foreman Metal approval and merged confirmation while this project setting is active." });\n  }\n}\n'
    )
# add blindDetail route
if 'blindDetail:' not in routers:
    routers = routers.replace('  detail: protectedProcedure.input(z.object({ id: z.string().min(2).max(40) })).query(async ({ input }) => getProjectDetail(input.id)),', '  detail: protectedProcedure.input(z.object({ id: z.string().min(2).max(40) })).query(async ({ input }) => getProjectDetail(input.id)),\n  blindDetail: protectedProcedure.input(z.object({ projectId: z.string().min(2).max(40), tag: z.string().trim().min(2).max(40) })).query(async ({ input }) => getBlindDetail(input.projectId, input.tag)),')
# add settings validation and actor passing
routers = routers.replace('    const allowed = await canUserEditProjectPhase(input.projectId, input.phase ?? "Broken / Preparation", toActingUser(ctx.user));\n    if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Only the configured phase owner can add or update blinds in this phase." });\n    return addBlindToProject(input);', '    const settings = await getProjectSettings(input.projectId);\n    enforceSlipBlindInput(input, settings?.slipBlindGateRequired);\n    const actingUser = toActingUser(ctx.user);\n    const allowed = await canUserEditProjectPhase(input.projectId, input.phase ?? "Broken / Preparation", actingUser);\n    if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Only the configured phase owner can add or update blinds in this phase." });\n    return addBlindToProject(input, actingUser);')
routers = routers.replace('    const actingUser = toActingUser(ctx.user);\n    const phases = Array.from(new Set(input.blinds.map((blind) => blind.phase ?? "Broken / Preparation")));', '    const actingUser = toActingUser(ctx.user);\n    const settings = await getProjectSettings(input.projectId);\n    input.blinds.forEach((blind) => enforceSlipBlindInput(blind, settings?.slipBlindGateRequired));\n    const phases = Array.from(new Set(input.blinds.map((blind) => blind.phase ?? "Broken / Preparation")));')
routers = routers.replace('    return updateBlindInProject(input);', '    const settings = await getProjectSettings(input.projectId);\n    enforceSlipBlindInput({ ...existing, ...input }, settings?.slipBlindGateRequired);\n    return updateBlindInProject(input, actingUser);')
routers = routers.replace('updateProjectSettings(input.projectId, input.phaseOwners, ctx.user.openId)', 'updateProjectSettings(input.projectId, input.phaseOwners, ctx.user.openId, input.slipBlindGateRequired)')
router_path.write_text(routers)

print('backend updates applied')
