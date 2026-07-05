/**
 * server/db/settings.ts
 * ─────────────────────
 * System Settings, Default Tag Settings, and Certificate Settings helpers.
 */

import { requireDb } from "./core";
import { certificateSettings, defaultTagSettings, systemSettings, securitySettings, notificationPreferences } from "../../drizzle/schema";

// ─── System Settings ───────────────────────────────────────────────────────

export async function getSystemSettings() {
  const db = await requireDb();
  const rows = await db.select().from(systemSettings).limit(1);
  if (rows.length === 0) {
    return {
      id: 0,
      companyName: "Shedgum Gas Plant",
      companyCode: "SGP",
      plantName: "Shedgum Gas Plant",
      contractNumber: null as string | null,
      language: "en",
      timezone: "Asia/Riyadh",
      dateFormat: "DD/MM/YYYY",
      emailNotifications: 1,
      phaseChangeAlerts: 1,
      criticalPriorityAlerts: 1,
      systemVersion: "1.0.0",
      maintenanceMode: 0,
      appName: "SBTS Professional",
      appDescription: null as string | null,
      appImageUrl: null as string | null,
      companyLogoUrl: null as string | null,
      companyDescription: null as string | null,
      regionName: "",
      dashboardHeroTitle: "SBTS command center rebuilt for maintainable React architecture.",
      dashboardHeroDescription: null as string | null,
      dashboardHeroBadge: "Access-first migration",
      dashboardHeroImageUrl: null as string | null,
      dashboardCtaButtons: null as string | null,
      versionName: "Professional Edition v1.0",
      versionDate: null as string | null,
      updatedByOpenId: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  return rows[0];
}

export async function upsertSystemSettings(
  data: Partial<Omit<typeof systemSettings.$inferInsert, "id" | "createdAt" | "updatedAt">>,
  actorOpenId: string,
) {
  const db = await requireDb();
  const existing = await db.select({ id: systemSettings.id }).from(systemSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(systemSettings).values({ ...data, updatedByOpenId: actorOpenId });
  } else {
    await db.update(systemSettings).set({ ...data, updatedByOpenId: actorOpenId });
  }
  return getSystemSettings();
}

// ─── Default Tag Settings ──────────────────────────────────────────────────

export async function getDefaultTagSettings() {
  const db = await requireDb();
  const rows = await db.select().from(defaultTagSettings).limit(1);
  if (rows.length === 0) {
    return {
      id: 0,
      tagPrefix: "BLD",
      tagSeparator: "-",
      tagPaddingDigits: 3,
      tagStartNumber: 1,
      defaultType: "Spectacle Blind",
      defaultSize: '2"',
      defaultRate: "150#",
      defaultPriority: "Normal" as const,
      defaultPhase: "Broken / Preparation" as const,
      autoGenerateTag: 1,
      requireEquipment: 0,
      requireLocation: 0,
      requireIsolationPoint: 0,
      tagColor: "#0f172a",
      tagWidth: 85,
      tagHeight: 55,
      tagFontSize: 14,
      tagFontColor: "#0f172a",
      tagTheme: "industrial",
      tagShowLogo: 1,
      tagShowQR: 1,
      tagHoleEnabled: 1,
      tagHolePosition: "top-center",
      updatedByOpenId: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  return rows[0];
}

export async function upsertDefaultTagSettings(
  data: Partial<Omit<typeof defaultTagSettings.$inferInsert, "id" | "createdAt" | "updatedAt">>,
  actorOpenId: string,
) {
  const db = await requireDb();
  const existing = await db.select({ id: defaultTagSettings.id }).from(defaultTagSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(defaultTagSettings).values({ ...data, updatedByOpenId: actorOpenId });
  } else {
    await db.update(defaultTagSettings).set({ ...data, updatedByOpenId: actorOpenId });
  }
  return getDefaultTagSettings();
}

// ─── Certificate Settings ──────────────────────────────────────────────────

export async function getCertificateSettings() {
  const db = await requireDb();
  const rows = await db.select().from(certificateSettings).limit(1);
  if (rows.length === 0) {
    return {
      id: 0,
      certificateTitle: "Blind Installation Certificate",
      headerCompanyName: "Shedgum Gas Plant",
      headerSubtitle: "Smart Blind Tracking System - SBTS",
      logoUrl: null as string | null,
      signature1Label: "Prepared By",
      signature1Name: null as string | null,
      signature1Title: null as string | null,
      signature2Label: "Reviewed By",
      signature2Name: null as string | null,
      signature2Title: null as string | null,
      signature3Label: "Approved By",
      signature3Name: null as string | null,
      signature3Title: null as string | null,
      footerText: null as string | null,
      showPageNumbers: 1,
      showGenerationDate: 1,
      showSystemVersion: 1,
      paperSize: "A4",
      orientation: "portrait",
      showWorkflowLog: 1,
      showExecutionTorque: 1,
      showFinalApprovals: 1,
      showBlindInfo: 1,
      showProjectInfo: 1,
      showQrCode: 1,
      showLockStatus: 1,
      showAreaInfo: 1,
      statusBadgeText: "APPROVED",
      lockBadgeText: "LOCKED / FINAL",
      updatedByOpenId: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  return rows[0];
}

export async function upsertCertificateSettings(
  data: Partial<Omit<typeof certificateSettings.$inferInsert, "id" | "createdAt" | "updatedAt">>,
  actorOpenId: string,
) {
  const db = await requireDb();
  const existing = await db.select({ id: certificateSettings.id }).from(certificateSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(certificateSettings).values({ ...data, updatedByOpenId: actorOpenId });
  } else {
    await db.update(certificateSettings).set({ ...data, updatedByOpenId: actorOpenId });
  }
  return getCertificateSettings();
}

// ─── Security Settings ────────────────────────────────────────────────────

export async function getSecuritySettings() {
  const db = await requireDb();
  const rows = await db.select().from(securitySettings).limit(1);
  if (rows.length === 0) {
    return {
      id: 0,
      qrPublicAccess: 1,
      qrRequireAuth: 0,
      allowDeleteBlinds: 0,
      allowDeleteProjects: 0,
      requireDeleteConfirmation: 1,
      auditTrailEnabled: 1,
      auditRetentionDays: 90,
      sessionTimeoutMinutes: 480,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      requireStrongPassword: 1,
      minPasswordLength: 8,
      updatedByOpenId: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  return rows[0];
}

export async function upsertSecuritySettings(
  data: Partial<Omit<typeof securitySettings.$inferInsert, "id" | "createdAt" | "updatedAt">>,
  actorOpenId: string,
) {
  const db = await requireDb();
  const existing = await db.select({ id: securitySettings.id }).from(securitySettings).limit(1);
  if (existing.length === 0) {
    await db.insert(securitySettings).values({ ...data, updatedByOpenId: actorOpenId });
  } else {
    await db.update(securitySettings).set({ ...data, updatedByOpenId: actorOpenId });
  }
  return getSecuritySettings();
}

// ─── Notification Preferences ─────────────────────────────────────────────

export async function getNotificationPreferences() {
  const db = await requireDb();
  const rows = await db.select().from(notificationPreferences).limit(1);
  if (rows.length === 0) {
    return {
      id: 0,
      registrationRequest: 1,
      registrationApproved: 1,
      registrationRejected: 1,
      blindPhaseChanged: 1,
      blindPhaseApproval: 1,
      blindAssigned: 1,
      projectCreated: 1,
      projectStatusChanged: 1,
      phaseOwnerAssigned: 1,
      workflowUpdated: 1,
      systemAnnouncement: 1,
      updatedByOpenId: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  return rows[0];
}

export async function upsertNotificationPreferences(
  data: Partial<Omit<typeof notificationPreferences.$inferInsert, "id" | "createdAt" | "updatedAt">>,
  actorOpenId: string,
) {
  const db = await requireDb();
  const existing = await db.select({ id: notificationPreferences.id }).from(notificationPreferences).limit(1);
  if (existing.length === 0) {
    await db.insert(notificationPreferences).values({ ...data, updatedByOpenId: actorOpenId });
  } else {
    await db.update(notificationPreferences).set({ ...data, updatedByOpenId: actorOpenId });
  }
  return getNotificationPreferences();
}
