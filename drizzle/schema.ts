import { date, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match application fields; legacy storage names are retained when needed to preserve data.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Registration status: pending = awaiting admin approval, active = approved, rejected = denied */
  userStatus: mysqlEnum("userStatus", ["pending", "active", "rejected"]).default("active").notNull(),
  /** Additional registration fields collected after OAuth */
  department: varchar("department", { length: 160 }),
  specialty: varchar("specialty", { length: 160 }),
  employeeNumber: varchar("employeeNumber", { length: 64 }),
  registrationNote: text("registrationNote"),
  approvedByOpenId: varchar("approvedByOpenId", { length: 64 }),
  approvedAt: timestamp("approvedAt"),
  /** Hashed password for standalone auth (bcrypt). Null for OAuth-only users. */
  passwordHash: text("passwordHash"),
  /** Profile fields */
  bio: text("bio"),
  phone: varchar("phone", { length: 40 }),
  userLocation: varchar("userLocation", { length: 200 }),
  linkedIn: varchar("linkedIn", { length: 255 }),
  preferredTheme: varchar("preferredTheme", { length: 20 }).default("dark"),
  avatarKey: text("avatarKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workflowStatusEnum = mysqlEnum("status", ["Draft", "Active", "Locked"]);
export const workflowPhaseKeyEnum = mysqlEnum("phaseKey", ["broken", "assembly", "tightTorque", "finalTight", "inspectionReady"]);
export const projectStatusEnum = mysqlEnum("projectStatus", ["Active", "Completed", "On Hold", "Planning", "Final Review"]);
export const blindPhaseEnum = mysqlEnum("blindPhase", ["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"]);
export const blindPriorityEnum = mysqlEnum("blindPriority", ["Low", "Normal", "High", "Critical"]);

/**
 * Physical plant areas. Areas are first-class operational containers so projects can be browsed
 * contextually rather than as isolated cards with a repeated area string.
 */
export const areas = mysqlTable("areas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  description: text("description"),
  location: varchar("location", { length: 200 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Project records linked to one area. Progress and blind counts are kept on the project row for
 * fast command-center summaries until the blind registry becomes the authoritative aggregation source.
 */
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 40 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  areaId: int("areaId")
    .notNull()
    .references(() => areas.id),
  status: projectStatusEnum.default("Planning").notNull(),
  blindsCount: int("blindsCount").default(0).notNull(),
  progress: int("progress").default(0).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Detailed blind registry rows. Each blind belongs to exactly one project, allowing the project
 * detail view to act as an operational drill-down without duplicating registry information.
 */
export const blinds = mysqlTable("blinds", {
  tag: varchar("tag", { length: 40 }).primaryKey(),
  projectId: varchar("projectId", { length: 40 })
    .notNull()
    .references(() => projects.id),
  type: varchar("type", { length: 120 }).notNull(),
  size: varchar("size", { length: 60 }).notNull(),
  rate: varchar("rate", { length: 60 }),
  // Industrial engineering metadata required for field inspection and compliance
  pressureClass: varchar("pressureClass", { length: 80 }),
  material: varchar("material", { length: 120 }),
  flangeType: varchar("flangeType", { length: 80 }),
  gasketType: varchar("gasketType", { length: 120 }),
  boltSize: varchar("boltSize", { length: 80 }),
  torqueValue: varchar("torqueValue", { length: 80 }),
  thickness: varchar("thickness", { length: 80 }),
  temperatureRating: varchar("temperatureRating", { length: 80 }),
  pidReference: varchar("pidReference", { length: 160 }),
  isoDrawingNumber: varchar("isoDrawingNumber", { length: 160 }),
  installationDate: date("installationDate"),
  removalDate: date("removalDate"),
  expiryDate: date("expiryDate"),
  phase: blindPhaseEnum.default("Broken / Preparation").notNull(),
  owner: varchar("owner", { length: 160 }).notNull(),
  priority: blindPriorityEnum.default("Normal").notNull(),
  equipment: varchar("lineNumber", { length: 120 }),
  location: varchar("location", { length: 220 }),
  isolationPoint: varchar("isolationPoint", { length: 220 }),
  slipMetalForemanApproved: int("slipMetalForemanApproved").default(0).notNull(),
  slipBlindMerged: int("slipBlindMerged").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Project-specific phase owners. These settings make each project able to assign one named owner
 * per blind phase while preserving the central workflow vocabulary used by the registry.
 */
export const projectPhaseOwners = mysqlTable("project_phase_owners", {
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

/**
 * Central permission catalog used by Access Control and Workflow Studio.
 */
export const accessPermissions = mysqlTable("access_permissions", {
  key: varchar("key", { length: 120 }).primaryKey(),
  label: varchar("label", { length: 180 }).notNull(),
  description: text("description").notNull(),
  group: varchar("group", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Central role catalog. JSON fields keep UI menu and workflow phase ownership explicit.
 */
export const accessRoles = mysqlTable("access_roles", {
  key: varchar("key", { length: 80 }).primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  subtitle: text("subtitle").notNull(),
  members: int("members").default(0).notNull(),
  color: varchar("color", { length: 24 }).notNull(),
  menuKeysJson: text("menuKeysJson").notNull(),
  phaseKeysJson: text("phaseKeysJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Many-to-many role permission assignments.
 */
export const accessRolePermissions = mysqlTable("access_role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleKey: varchar("roleKey", { length: 80 })
    .notNull()
    .references(() => accessRoles.key),
  permissionKey: varchar("permissionKey", { length: 120 })
    .notNull()
    .references(() => accessPermissions.key),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Workflow template header. A template represents one reusable operational route.
 * Role and permission enforcement is held at phase level so every task owner remains traceable.
 */
export const workflowTemplates = mysqlTable("workflow_templates", {
  id: varchar("id", { length: 96 }).primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").notNull(),
  status: workflowStatusEnum.default("Draft").notNull(),
  projectType: varchar("projectType", { length: 120 }).notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Workflow phase detail. roleKey and requiredPermissionKey deliberately mirror the centralized
 * access-control model, allowing the frontend to verify RBAC alignment and the backend to persist it.
 */
export const workflowPhases = mysqlTable("workflow_phases", {
  id: varchar("id", { length: 120 }).primaryKey(),
  workflowId: varchar("workflowId", { length: 96 })
    .notNull()
    .references(() => workflowTemplates.id),
  sortOrder: int("sortOrder").notNull(),
  label: varchar("label", { length: 220 }).notNull(),
  phaseKey: workflowPhaseKeyEnum.notNull(),
  roleKey: varchar("roleKey", { length: 80 }).notNull(),
  requiredPermissionKey: varchar("requiredPermissionKey", { length: 120 }).notNull(),
  gate: text("gate").notNull(),
  slaHours: int("slaHours").notNull(),
  evidenceJson: text("evidenceJson").notNull(),
  automation: text("automation").notNull(),
  color: varchar("color", { length: 24 }).notNull(),
  isCritical: int("isCritical").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AreaRow = typeof areas.$inferSelect;
export type InsertArea = typeof areas.$inferInsert;
export type ProjectRow = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type BlindRow = typeof blinds.$inferSelect;
export type InsertBlind = typeof blinds.$inferInsert;
export type ProjectPhaseOwnerRow = typeof projectPhaseOwners.$inferSelect;
export type InsertProjectPhaseOwner = typeof projectPhaseOwners.$inferInsert;
export type ProjectSettingsRow = typeof projectSettings.$inferSelect;
export type InsertProjectSettings = typeof projectSettings.$inferInsert;
export type BlindWorkflowLogRow = typeof blindWorkflowLogs.$inferSelect;
export type InsertBlindWorkflowLog = typeof blindWorkflowLogs.$inferInsert;
export type BlindPhaseApprovalRow = typeof blindPhaseApprovals.$inferSelect;
export type InsertBlindPhaseApproval = typeof blindPhaseApprovals.$inferInsert;
export type AccessPermissionRow = typeof accessPermissions.$inferSelect;
export type InsertAccessPermission = typeof accessPermissions.$inferInsert;
export type AccessRoleRow = typeof accessRoles.$inferSelect;
export type InsertAccessRole = typeof accessRoles.$inferInsert;
export type AccessRolePermissionRow = typeof accessRolePermissions.$inferSelect;
export type InsertAccessRolePermission = typeof accessRolePermissions.$inferInsert;
export type WorkflowTemplateRow = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplates.$inferInsert;
export type WorkflowPhaseRow = typeof workflowPhases.$inferSelect;
export type InsertWorkflowPhase = typeof workflowPhases.$inferInsert;

/**
 * Periodic safety survey header. Each survey captures a snapshot of all slip blinds
 * in the plant (or a specific area/project) at a point in time.
 */
export const slipBlindSurveys = mysqlTable("slip_blind_surveys", {
  id: int("id").autoincrement().primaryKey(),
  surveyDate: date("surveyDate").notNull(),
  conductedByOpenId: varchar("conductedByOpenId", { length: 64 }),
  conductedByName: varchar("conductedByName", { length: 160 }),
  areaId: int("areaId"),
  projectId: varchar("projectId", { length: 40 }),
  totalCount: int("totalCount").default(0).notNull(),
  inServiceCount: int("inServiceCount").default(0).notNull(),
  removedCount: int("removedCount").default(0).notNull(),
  mergedCount: int("mergedCount").default(0).notNull(),
  foremanApprovedCount: int("foremanApprovedCount").default(0).notNull(),
  criticalCount: int("criticalCount").default(0).notNull(),
  notes: text("notes"),
  surveyDataJson: text("surveyDataJson"),
  status: mysqlEnum("status", ["draft", "submitted", "approved"]).default("submitted").notNull(),
  approvedByOpenId: varchar("approvedByOpenId", { length: 64 }),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Individual blind entries within a survey. One row per blind per survey.
 */
export const slipBlindSurveyItems = mysqlTable("slip_blind_survey_items", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  blindTag: varchar("blindTag", { length: 40 }).notNull(),
  projectId: varchar("projectId", { length: 40 }).notNull(),
  slipStatus: mysqlEnum("slipStatus", ["in_service", "removed", "merged", "unknown"]).default("in_service").notNull(),
  foremanApproved: int("foremanApproved").default(0).notNull(),
  physicalCondition: mysqlEnum("physicalCondition", ["good", "fair", "damaged", "missing"]).default("good").notNull(),
  location: varchar("location", { length: 220 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SlipBlindSurveyRow = typeof slipBlindSurveys.$inferSelect;
export type InsertSlipBlindSurvey = typeof slipBlindSurveys.$inferInsert;
export type SlipBlindSurveyItemRow = typeof slipBlindSurveyItems.$inferSelect;
export type InsertSlipBlindSurveyItem = typeof slipBlindSurveyItems.$inferInsert;

/**
 * System-wide general settings. One row per system (singleton pattern).
 * Covers language, timezone, company info, and notification preferences.
 */
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  // Company Info
  companyName: varchar("companyName", { length: 200 }).default("Shedgum Gas Plant").notNull(),
  companyCode: varchar("companyCode", { length: 40 }).default("SGP").notNull(),
  plantName: varchar("plantName", { length: 200 }).default("Shedgum Gas Plant").notNull(),
  contractNumber: varchar("contractNumber", { length: 100 }),
  // Localization
  language: varchar("language", { length: 10 }).default("en").notNull(),
  timezone: varchar("timezone", { length: 80 }).default("Asia/Riyadh").notNull(),
  dateFormat: varchar("dateFormat", { length: 40 }).default("DD/MM/YYYY").notNull(),
  // Notifications
  emailNotifications: int("emailNotifications").default(1).notNull(),
  phaseChangeAlerts: int("phaseChangeAlerts").default(1).notNull(),
  criticalPriorityAlerts: int("criticalPriorityAlerts").default(1).notNull(),
  // System
  systemVersion: varchar("systemVersion", { length: 40 }).default("1.0.0").notNull(),
  maintenanceMode: int("maintenanceMode").default(0).notNull(),
  // App Branding & Identity
  appName: varchar("appName", { length: 200 }).default("SBTS Professional").notNull(),
  appDescription: text("appDescription"),
  appImageUrl: text("appImageUrl"),
  companyLogoUrl: text("companyLogoUrl"),
  companyDescription: text("companyDescription"),
  regionName: varchar("regionName", { length: 200 }).default(""),
  // Dashboard Hero
  dashboardHeroTitle: varchar("dashboardHeroTitle", { length: 500 }).default("SBTS command center rebuilt for maintainable React architecture."),
  dashboardHeroDescription: text("dashboardHeroDescription"),
  dashboardHeroBadge: varchar("dashboardHeroBadge", { length: 200 }).default("Access-first migration"),
  dashboardHeroImageUrl: text("dashboardHeroImageUrl"),
  dashboardCtaButtons: text("dashboardCtaButtons"), // JSON array [{label, href, variant}]
  // Version
  versionName: varchar("versionName", { length: 100 }).default("Professional Edition v1.0"),
  versionDate: varchar("versionDate", { length: 40 }),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Default tag settings for blind registration.
 * Controls auto-generated tag format, default values, and numbering.
 */
export const defaultTagSettings = mysqlTable("default_tag_settings", {
  id: int("id").autoincrement().primaryKey(),
  // Tag Format
  tagPrefix: varchar("tagPrefix", { length: 20 }).default("BLD").notNull(),
  tagSeparator: varchar("tagSeparator", { length: 5 }).default("-").notNull(),
  tagPaddingDigits: int("tagPaddingDigits").default(3).notNull(),
  tagStartNumber: int("tagStartNumber").default(1).notNull(),
  // Default Blind Values
  defaultType: varchar("defaultType", { length: 120 }).default("Spectacle Blind").notNull(),
  defaultSize: varchar("defaultSize", { length: 60 }).default('2"').notNull(),
  defaultRate: varchar("defaultRate", { length: 60 }).default("150#").notNull(),
  defaultPriority: blindPriorityEnum.default("Normal").notNull(),
  defaultPhase: blindPhaseEnum.default("Broken / Preparation").notNull(),
  // Auto-fill Options
  autoGenerateTag: int("autoGenerateTag").default(1).notNull(),
  requireEquipment: int("requireEquipment").default(0).notNull(),
  requireLocation: int("requireLocation").default(0).notNull(),
  requireIsolationPoint: int("requireIsolationPoint").default(0).notNull(),
  // Visual Settings
  tagColor: varchar("tagColor", { length: 20 }).default("#0f172a"),
  tagWidth: int("tagWidth").default(85),
  tagHeight: int("tagHeight").default(55),
  tagFontSize: int("tagFontSize").default(14),
  tagFontColor: varchar("tagFontColor", { length: 20 }).default("#0f172a"),
  tagTheme: varchar("tagTheme", { length: 40 }).default("industrial"),
  tagShowLogo: int("tagShowLogo").default(1),
  tagShowQR: int("tagShowQR").default(1),
  tagHoleEnabled: int("tagHoleEnabled").default(1),
  tagHolePosition: varchar("tagHolePosition", { length: 20 }).default("top-center"),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Certificate settings for printing and document generation.
 * Controls header, footer, signatures, and branding on printed certificates.
 */
export const certificateSettings = mysqlTable("certificate_settings", {
  id: int("id").autoincrement().primaryKey(),
  // Header
  certificateTitle: varchar("certificateTitle", { length: 200 }).default("Blind Installation Certificate").notNull(),
  headerCompanyName: varchar("headerCompanyName", { length: 200 }).default("Shedgum Gas Plant").notNull(),
  headerSubtitle: varchar("headerSubtitle", { length: 300 }).default("Smart Blind Tracking System - SBTS").notNull(),
  logoUrl: text("logoUrl"),
  // Signature Fields
  signature1Label: varchar("signature1Label", { length: 100 }).default("Prepared By").notNull(),
  signature1Name: varchar("signature1Name", { length: 160 }),
  signature1Title: varchar("signature1Title", { length: 160 }),
  signature2Label: varchar("signature2Label", { length: 100 }).default("Reviewed By").notNull(),
  signature2Name: varchar("signature2Name", { length: 160 }),
  signature2Title: varchar("signature2Title", { length: 160 }),
  signature3Label: varchar("signature3Label", { length: 100 }).default("Approved By").notNull(),
  signature3Name: varchar("signature3Name", { length: 160 }),
  signature3Title: varchar("signature3Title", { length: 160 }),
  // Footer
  footerText: text("footerText"),
  showPageNumbers: int("showPageNumbers").default(1).notNull(),
  showGenerationDate: int("showGenerationDate").default(1).notNull(),
  showSystemVersion: int("showSystemVersion").default(1).notNull(),
  // Print Options
  paperSize: varchar("paperSize", { length: 20 }).default("A4").notNull(),
  orientation: varchar("orientation", { length: 20 }).default("portrait").notNull(),
  // Section Visibility
  showWorkflowLog: int("showWorkflowLog").default(1),
  showExecutionTorque: int("showExecutionTorque").default(1),
  showFinalApprovals: int("showFinalApprovals").default(1),
  showBlindInfo: int("showBlindInfo").default(1),
  showProjectInfo: int("showProjectInfo").default(1),
  showQrCode: int("showQrCode").default(1),
  showLockStatus: int("showLockStatus").default(1),
  showAreaInfo: int("showAreaInfo").default(1),
  statusBadgeText: varchar("statusBadgeText", { length: 40 }).default("APPROVED"),
  lockBadgeText: varchar("lockBadgeText", { length: 40 }).default("LOCKED / FINAL"),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSettingsRow = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = typeof systemSettings.$inferInsert;
export type DefaultTagSettingsRow = typeof defaultTagSettings.$inferSelect;
export type InsertDefaultTagSettings = typeof defaultTagSettings.$inferInsert;
export type CertificateSettingsRow = typeof certificateSettings.$inferSelect;
export type InsertCertificateSettings = typeof certificateSettings.$inferInsert;

/**
 * Security settings. Controls QR access, delete policies, audit trail, and session behavior.
 */
export const securitySettings = mysqlTable("security_settings", {
  id: int("id").autoincrement().primaryKey(),
  qrPublicAccess: int("qrPublicAccess").default(1).notNull(),
  qrRequireAuth: int("qrRequireAuth").default(0).notNull(),
  allowDeleteBlinds: int("allowDeleteBlinds").default(0).notNull(),
  allowDeleteProjects: int("allowDeleteProjects").default(0).notNull(),
  requireDeleteConfirmation: int("requireDeleteConfirmation").default(1).notNull(),
  auditTrailEnabled: int("auditTrailEnabled").default(1).notNull(),
  auditRetentionDays: int("auditRetentionDays").default(90).notNull(),
  sessionTimeoutMinutes: int("sessionTimeoutMinutes").default(480).notNull(),
  maxLoginAttempts: int("maxLoginAttempts").default(5).notNull(),
  lockoutDurationMinutes: int("lockoutDurationMinutes").default(15).notNull(),
  requireStrongPassword: int("requireStrongPassword").default(1).notNull(),
  minPasswordLength: int("minPasswordLength").default(8).notNull(),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SecuritySettingsRow = typeof securitySettings.$inferSelect;
export type InsertSecuritySettings = typeof securitySettings.$inferInsert;

/**
 * Notification preferences. Controls which operational events create inbox notifications.
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  registrationRequest: int("registrationRequest").default(1).notNull(),
  registrationApproved: int("registrationApproved").default(1).notNull(),
  registrationRejected: int("registrationRejected").default(1).notNull(),
  blindPhaseChanged: int("blindPhaseChanged").default(1).notNull(),
  blindPhaseApproval: int("blindPhaseApproval").default(1).notNull(),
  blindAssigned: int("blindAssigned").default(1).notNull(),
  projectCreated: int("projectCreated").default(1).notNull(),
  projectStatusChanged: int("projectStatusChanged").default(1).notNull(),
  phaseOwnerAssigned: int("phaseOwnerAssigned").default(1).notNull(),
  workflowUpdated: int("workflowUpdated").default(1).notNull(),
  systemAnnouncement: int("systemAnnouncement").default(1).notNull(),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreferencesRow = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;


/**
 * User-to-Role assignments. Links users to access_roles for centralized permission management.
 * A user can have multiple roles; permissions are the union of all assigned roles.
 */
export const userRoleAssignments = mysqlTable("user_role_assignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  roleKey: varchar("roleKey", { length: 80 }).notNull().references(() => accessRoles.key),
  assignedByOpenId: varchar("assignedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserRoleAssignmentRow = typeof userRoleAssignments.$inferSelect;
export type InsertUserRoleAssignment = typeof userRoleAssignments.$inferInsert;

/**
 * In-App Notifications.
 * Stores notifications for all users. Each notification targets a specific user (recipientOpenId).
 * Supports categorized event types for filtering and display.
 */
export const notificationTypeEnum = mysqlEnum("notificationType", [
  // Registration events
  "registration_request",      // new user submitted registration → admin
  "registration_approved",     // admin approved user → user
  "registration_rejected",     // admin rejected user → user
  // Blind phase events
  "blind_phase_changed",       // blind moved to new phase → phase owner
  "blind_phase_approval",      // electronic approval submitted → project coordinator
  "blind_assigned",            // blind assigned to user → assignee
  // Project events
  "project_created",           // new project created → all admins
  "project_status_changed",    // project status changed → phase owners
  "phase_owner_assigned",      // user assigned as phase owner → that user
  // Workflow events
  "workflow_updated",          // workflow template updated → admins
  // System events
  "system_announcement",       // general system announcement → all users
]);

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  /** Target user's openId */
  recipientOpenId: varchar("recipientOpenId", { length: 64 }).notNull(),
  /** Actor who triggered the event (null for system events) */
  actorOpenId: varchar("actorOpenId", { length: 64 }),
  actorName: varchar("actorName", { length: 200 }),
  /** Notification category */
  type: notificationTypeEnum.notNull(),
  /** Short title shown in the bell dropdown */
  title: varchar("title", { length: 200 }).notNull(),
  /** Full message body shown in the notifications page */
  body: text("body").notNull(),
  /** Optional deep-link URL (e.g. /projects/5/blinds/BL-001) */
  linkUrl: varchar("linkUrl", { length: 500 }),
  /** Reference IDs for context */
  projectId: varchar("projectId", { length: 40 }),
  blindTag: varchar("blindTag", { length: 80 }),
  /** Read state */
  isRead: int("isRead").default(0).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationRow = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Immutable-style audit events. Stores compliance-critical actions across the system.
 * Use beforeJson/afterJson as text to keep MySQL/TiDB compatibility simple.
 */
export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  actorOpenId: varchar("actorOpenId", { length: 64 }),
  actorName: varchar("actorName", { length: 200 }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 120 }).notNull(),
  entityId: varchar("entityId", { length: 220 }),
  beforeJson: text("beforeJson"),
  afterJson: text("afterJson"),
  ipAddress: varchar("ipAddress", { length: 80 }),
  userAgent: varchar("userAgent", { length: 500 }),
  hash: varchar("hash", { length: 128 }),
  previousHash: varchar("previousHash", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditEventRow = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = typeof auditEvents.$inferInsert;


/**
 * Field photo/evidence attachments for each blind phase.
 * dataUrl is used for pilot/Railway simplicity; production can migrate to object storage URL.
 */
export const blindEvidence = mysqlTable("blind_evidence", {
  id: int("id").autoincrement().primaryKey(),
  blindTag: varchar("blindTag", { length: 40 }).notNull().references(() => blinds.tag),
  projectId: varchar("projectId", { length: 40 }).notNull().references(() => projects.id),
  phase: blindPhaseEnum.notNull(),
  evidenceType: varchar("evidenceType", { length: 80 }).default("photo").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 120 }),
  dataUrl: text("dataUrl"),
  caption: text("caption"),
  uploadedByOpenId: varchar("uploadedByOpenId", { length: 64 }),
  uploadedByName: varchar("uploadedByName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Safety checklist per blind phase. */
export const blindSafetyChecklists = mysqlTable("blind_safety_checklists", {
  id: int("id").autoincrement().primaryKey(),
  blindTag: varchar("blindTag", { length: 40 }).notNull().references(() => blinds.tag),
  projectId: varchar("projectId", { length: 40 }).notNull().references(() => projects.id),
  phase: blindPhaseEnum.notNull(),
  checklistJson: text("checklistJson").notNull(),
  status: varchar("status", { length: 40 }).default("draft").notNull(),
  completedByOpenId: varchar("completedByOpenId", { length: 64 }),
  completedByName: varchar("completedByName", { length: 200 }),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  blindPhaseChecklistUnique: uniqueIndex("blind_phase_checklist_unique").on(table.blindTag, table.projectId, table.phase),
}));

/** Torque / bolting records for inspection traceability. */
export const blindTorqueRecords = mysqlTable("blind_torque_records", {
  id: int("id").autoincrement().primaryKey(),
  blindTag: varchar("blindTag", { length: 40 }).notNull().references(() => blinds.tag),
  projectId: varchar("projectId", { length: 40 }).notNull().references(() => projects.id),
  phase: blindPhaseEnum.default("Tight & Torque").notNull(),
  boltNo: varchar("boltNo", { length: 40 }),
  boltSize: varchar("boltSize", { length: 80 }),
  torqueValue: varchar("torqueValue", { length: 80 }).notNull(),
  torqueUnit: varchar("torqueUnit", { length: 40 }).default("Nm").notNull(),
  toolId: varchar("toolId", { length: 120 }),
  technicianName: varchar("technicianName", { length: 200 }),
  verifiedByName: varchar("verifiedByName", { length: 200 }),
  notes: text("notes"),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }),
  createdByName: varchar("createdByName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Inspection package records: NDE, MTR, gasket tracking, leak test, punch list. */
export const blindInspectionRecords = mysqlTable("blind_inspection_records", {
  id: int("id").autoincrement().primaryKey(),
  blindTag: varchar("blindTag", { length: 40 }).notNull().references(() => blinds.tag),
  projectId: varchar("projectId", { length: 40 }).notNull().references(() => projects.id),
  recordType: varchar("recordType", { length: 80 }).notNull(),
  referenceNo: varchar("referenceNo", { length: 160 }),
  result: varchar("result", { length: 80 }).default("Pending").notNull(),
  description: text("description"),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 120 }),
  dataUrl: text("dataUrl"),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }),
  createdByName: varchar("createdByName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlindEvidenceRow = typeof blindEvidence.$inferSelect;
export type InsertBlindEvidence = typeof blindEvidence.$inferInsert;
export type BlindSafetyChecklistRow = typeof blindSafetyChecklists.$inferSelect;
export type InsertBlindSafetyChecklist = typeof blindSafetyChecklists.$inferInsert;
export type BlindTorqueRecordRow = typeof blindTorqueRecords.$inferSelect;
export type InsertBlindTorqueRecord = typeof blindTorqueRecords.$inferInsert;
export type BlindInspectionRecordRow = typeof blindInspectionRecords.$inferSelect;
export type InsertBlindInspectionRecord = typeof blindInspectionRecords.$inferInsert;

