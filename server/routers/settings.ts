/**
 * server/routers/settings.ts
 * ──────────────────────────
 * Procedures for system settings, default tag settings, certificate settings,
 * security settings, and notification preferences.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  getCertificateSettings,
  getDefaultTagSettings,
  getSystemSettings,
  upsertCertificateSettings,
  upsertDefaultTagSettings,
  upsertSystemSettings,
  getSecuritySettings,
  upsertSecuritySettings,
  getNotificationPreferences,
  upsertNotificationPreferences,
} from "../db";

export const settingsRouter = router({
  general: router({
    get: protectedProcedure.query(async () => getSystemSettings()),

    update: adminProcedure.input(z.object({
      companyName: z.string().trim().min(1).max(200).optional(),
      companyCode: z.string().trim().min(1).max(40).optional(),
      plantName: z.string().trim().min(1).max(200).optional(),
      contractNumber: z.string().trim().max(100).nullable().optional(),
      language: z.enum(["en", "ar"]).optional(),
      timezone: z.string().trim().min(1).max(80).optional(),
      dateFormat: z.string().trim().min(1).max(40).optional(),
      emailNotifications: z.boolean().optional(),
      phaseChangeAlerts: z.boolean().optional(),
      criticalPriorityAlerts: z.boolean().optional(),
      maintenanceMode: z.boolean().optional(),
      // New fields
      appName: z.string().trim().min(1).max(200).optional(),
      appDescription: z.string().trim().max(1000).nullable().optional(),
      appImageUrl: z.string().trim().nullable().optional(),
      companyLogoUrl: z.string().trim().nullable().optional(),
      companyDescription: z.string().trim().max(2000).nullable().optional(),
      regionName: z.string().trim().max(200).optional(),
      dashboardHeroTitle: z.string().trim().max(500).optional(),
      dashboardHeroDescription: z.string().trim().max(2000).nullable().optional(),
      dashboardHeroBadge: z.string().trim().max(200).optional(),
      dashboardHeroImageUrl: z.string().trim().nullable().optional(),
      dashboardCtaButtons: z.string().trim().nullable().optional(), // JSON string
      versionName: z.string().trim().max(100).optional(),
      versionDate: z.string().trim().max(40).nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      const data: Record<string, unknown> = {};
      // Original fields
      if (input.companyName !== undefined) data.companyName = input.companyName;
      if (input.companyCode !== undefined) data.companyCode = input.companyCode;
      if (input.plantName !== undefined) data.plantName = input.plantName;
      if (input.contractNumber !== undefined) data.contractNumber = input.contractNumber;
      if (input.language !== undefined) data.language = input.language;
      if (input.timezone !== undefined) data.timezone = input.timezone;
      if (input.dateFormat !== undefined) data.dateFormat = input.dateFormat;
      if (input.emailNotifications !== undefined) data.emailNotifications = input.emailNotifications ? 1 : 0;
      if (input.phaseChangeAlerts !== undefined) data.phaseChangeAlerts = input.phaseChangeAlerts ? 1 : 0;
      if (input.criticalPriorityAlerts !== undefined) data.criticalPriorityAlerts = input.criticalPriorityAlerts ? 1 : 0;
      if (input.maintenanceMode !== undefined) data.maintenanceMode = input.maintenanceMode ? 1 : 0;
      // New fields
      if (input.appName !== undefined) data.appName = input.appName;
      if (input.appDescription !== undefined) data.appDescription = input.appDescription;
      if (input.appImageUrl !== undefined) data.appImageUrl = input.appImageUrl;
      if (input.companyLogoUrl !== undefined) data.companyLogoUrl = input.companyLogoUrl;
      if (input.companyDescription !== undefined) data.companyDescription = input.companyDescription;
      if (input.regionName !== undefined) data.regionName = input.regionName;
      if (input.dashboardHeroTitle !== undefined) data.dashboardHeroTitle = input.dashboardHeroTitle;
      if (input.dashboardHeroDescription !== undefined) data.dashboardHeroDescription = input.dashboardHeroDescription;
      if (input.dashboardHeroBadge !== undefined) data.dashboardHeroBadge = input.dashboardHeroBadge;
      if (input.dashboardHeroImageUrl !== undefined) data.dashboardHeroImageUrl = input.dashboardHeroImageUrl;
      if (input.dashboardCtaButtons !== undefined) data.dashboardCtaButtons = input.dashboardCtaButtons;
      if (input.versionName !== undefined) data.versionName = input.versionName;
      if (input.versionDate !== undefined) data.versionDate = input.versionDate;
      return upsertSystemSettings(data, ctx.user.openId);
    }),

    uploadImage: adminProcedure.input(z.object({
      base64: z.string().min(1),
      mimeType: z.enum(["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"]),
      target: z.enum(["appImage", "companyLogo", "heroImage"]),
    })).mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64, "base64");
      if (buffer.byteLength > 2 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "File must be under 2MB" });
      }
      const url = `data:${input.mimeType};base64,${input.base64}`;
      const fieldMap = { appImage: "appImageUrl", companyLogo: "companyLogoUrl", heroImage: "dashboardHeroImageUrl" };
      await upsertSystemSettings({ [fieldMap[input.target]]: url }, ctx.user.openId);
      return { url, storage: "inline" };
    }),
  }),

  defaultTag: router({
    get: protectedProcedure.query(async () => getDefaultTagSettings()),

    update: adminProcedure.input(z.object({
      tagPrefix: z.string().trim().min(1).max(20).optional(),
      tagSeparator: z.string().trim().max(5).optional(),
      tagPaddingDigits: z.number().int().min(1).max(6).optional(),
      tagStartNumber: z.number().int().min(1).optional(),
      defaultType: z.string().trim().min(1).max(120).optional(),
      defaultSize: z.string().trim().min(1).max(60).optional(),
      defaultRate: z.string().trim().max(60).optional(),
      defaultPriority: z.enum(["Low", "Normal", "High", "Critical"]).optional(),
      defaultPhase: z.enum(["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"]).optional(),
      autoGenerateTag: z.boolean().optional(),
      requireEquipment: z.boolean().optional(),
      requireLocation: z.boolean().optional(),
      requireIsolationPoint: z.boolean().optional(),
      // Visual settings
      tagColor: z.string().trim().max(20).optional(),
      tagWidth: z.number().int().min(40).max(200).optional(),
      tagHeight: z.number().int().min(30).max(150).optional(),
      tagFontSize: z.number().int().min(8).max(32).optional(),
      tagFontColor: z.string().trim().max(20).optional(),
      tagTheme: z.string().trim().max(40).optional(),
      tagShowLogo: z.boolean().optional(),
      tagShowQR: z.boolean().optional(),
      tagHoleEnabled: z.boolean().optional(),
      tagHolePosition: z.string().trim().max(20).optional(),
    })).mutation(async ({ input, ctx }) => {
      const data: Record<string, unknown> = {};
      if (input.tagPrefix !== undefined) data.tagPrefix = input.tagPrefix;
      if (input.tagSeparator !== undefined) data.tagSeparator = input.tagSeparator;
      if (input.tagPaddingDigits !== undefined) data.tagPaddingDigits = input.tagPaddingDigits;
      if (input.tagStartNumber !== undefined) data.tagStartNumber = input.tagStartNumber;
      if (input.defaultType !== undefined) data.defaultType = input.defaultType;
      if (input.defaultSize !== undefined) data.defaultSize = input.defaultSize;
      if (input.defaultRate !== undefined) data.defaultRate = input.defaultRate;
      if (input.defaultPriority !== undefined) data.defaultPriority = input.defaultPriority;
      if (input.defaultPhase !== undefined) data.defaultPhase = input.defaultPhase;
      if (input.autoGenerateTag !== undefined) data.autoGenerateTag = input.autoGenerateTag ? 1 : 0;
      if (input.requireEquipment !== undefined) data.requireEquipment = input.requireEquipment ? 1 : 0;
      if (input.requireLocation !== undefined) data.requireLocation = input.requireLocation ? 1 : 0;
      if (input.requireIsolationPoint !== undefined) data.requireIsolationPoint = input.requireIsolationPoint ? 1 : 0;
      // Visual settings
      if (input.tagColor !== undefined) data.tagColor = input.tagColor;
      if (input.tagWidth !== undefined) data.tagWidth = input.tagWidth;
      if (input.tagHeight !== undefined) data.tagHeight = input.tagHeight;
      if (input.tagFontSize !== undefined) data.tagFontSize = input.tagFontSize;
      if (input.tagFontColor !== undefined) data.tagFontColor = input.tagFontColor;
      if (input.tagTheme !== undefined) data.tagTheme = input.tagTheme;
      if (input.tagShowLogo !== undefined) data.tagShowLogo = input.tagShowLogo ? 1 : 0;
      if (input.tagShowQR !== undefined) data.tagShowQR = input.tagShowQR ? 1 : 0;
      if (input.tagHoleEnabled !== undefined) data.tagHoleEnabled = input.tagHoleEnabled ? 1 : 0;
      if (input.tagHolePosition !== undefined) data.tagHolePosition = input.tagHolePosition;
      return upsertDefaultTagSettings(data, ctx.user.openId);
    }),
  }),

  certificate: router({
    get: protectedProcedure.query(async () => getCertificateSettings()),

    uploadLogo: adminProcedure.input(z.object({
      base64: z.string().min(1),
      mimeType: z.enum(["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"]),
      fileName: z.string().max(200),
    })).mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64, "base64");
      if (buffer.byteLength > 2 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Logo file must be under 2MB" });
      }
      const url = `data:${input.mimeType};base64,${input.base64}`;
      await upsertCertificateSettings({ logoUrl: url }, ctx.user.openId);
      return { url, storage: "inline" };
    }),

    removeLogo: adminProcedure.mutation(async ({ ctx }) => {
      await upsertCertificateSettings({ logoUrl: null }, ctx.user.openId);
      return { success: true };
    }),

    update: adminProcedure.input(z.object({
      certificateTitle: z.string().trim().min(1).max(200).optional(),
      headerCompanyName: z.string().trim().min(1).max(200).optional(),
      headerSubtitle: z.string().trim().max(300).optional(),
      logoUrl: z.string().trim().nullable().optional(),
      signature1Label: z.string().trim().min(1).max(100).optional(),
      signature1Name: z.string().trim().max(160).nullable().optional(),
      signature1Title: z.string().trim().max(160).nullable().optional(),
      signature2Label: z.string().trim().min(1).max(100).optional(),
      signature2Name: z.string().trim().max(160).nullable().optional(),
      signature2Title: z.string().trim().max(160).nullable().optional(),
      signature3Label: z.string().trim().min(1).max(100).optional(),
      signature3Name: z.string().trim().max(160).nullable().optional(),
      signature3Title: z.string().trim().max(160).nullable().optional(),
      footerText: z.string().trim().max(500).nullable().optional(),
      showPageNumbers: z.boolean().optional(),
      showGenerationDate: z.boolean().optional(),
      showSystemVersion: z.boolean().optional(),
      paperSize: z.enum(["A4", "A3", "Letter", "Legal"]).optional(),
      orientation: z.enum(["portrait", "landscape"]).optional(),
      // Section visibility
      showWorkflowLog: z.boolean().optional(),
      showExecutionTorque: z.boolean().optional(),
      showFinalApprovals: z.boolean().optional(),
      showBlindInfo: z.boolean().optional(),
      showProjectInfo: z.boolean().optional(),
      showQrCode: z.boolean().optional(),
      showLockStatus: z.boolean().optional(),
      showAreaInfo: z.boolean().optional(),
      statusBadgeText: z.string().trim().max(40).optional(),
      lockBadgeText: z.string().trim().max(40).optional(),
    })).mutation(async ({ input, ctx }) => {
      const data: Record<string, unknown> = { ...input };
      // Convert booleans to int
      const boolFields = ["showPageNumbers", "showGenerationDate", "showSystemVersion", "showWorkflowLog", "showExecutionTorque", "showFinalApprovals", "showBlindInfo", "showProjectInfo", "showQrCode", "showLockStatus", "showAreaInfo"] as const;
      for (const field of boolFields) {
        if (input[field] !== undefined) data[field] = input[field] ? 1 : 0;
      }
      return upsertCertificateSettings(data, ctx.user.openId);
    }),
  }),

  security: router({
    get: protectedProcedure.query(async () => getSecuritySettings()),

    update: adminProcedure.input(z.object({
      qrPublicAccess: z.boolean().optional(),
      qrRequireAuth: z.boolean().optional(),
      allowDeleteBlinds: z.boolean().optional(),
      allowDeleteProjects: z.boolean().optional(),
      requireDeleteConfirmation: z.boolean().optional(),
      auditTrailEnabled: z.boolean().optional(),
      auditRetentionDays: z.number().int().min(7).max(365).optional(),
      sessionTimeoutMinutes: z.number().int().min(15).max(1440).optional(),
      maxLoginAttempts: z.number().int().min(3).max(20).optional(),
      lockoutDurationMinutes: z.number().int().min(5).max(60).optional(),
      requireStrongPassword: z.boolean().optional(),
      minPasswordLength: z.number().int().min(6).max(32).optional(),
    })).mutation(async ({ input, ctx }) => {
      const data: Record<string, unknown> = {};
      const boolFields = ["qrPublicAccess", "qrRequireAuth", "allowDeleteBlinds", "allowDeleteProjects", "requireDeleteConfirmation", "auditTrailEnabled", "requireStrongPassword"] as const;
      for (const field of boolFields) {
        if (input[field] !== undefined) data[field] = input[field] ? 1 : 0;
      }
      const numFields = ["auditRetentionDays", "sessionTimeoutMinutes", "maxLoginAttempts", "lockoutDurationMinutes", "minPasswordLength"] as const;
      for (const field of numFields) {
        if (input[field] !== undefined) data[field] = input[field];
      }
      return upsertSecuritySettings(data, ctx.user.openId);
    }),
  }),

  notifications: router({
    get: protectedProcedure.query(async () => getNotificationPreferences()),

    update: adminProcedure.input(z.object({
      registrationRequest: z.boolean().optional(),
      registrationApproved: z.boolean().optional(),
      registrationRejected: z.boolean().optional(),
      blindPhaseChanged: z.boolean().optional(),
      blindPhaseApproval: z.boolean().optional(),
      blindAssigned: z.boolean().optional(),
      projectCreated: z.boolean().optional(),
      projectStatusChanged: z.boolean().optional(),
      phaseOwnerAssigned: z.boolean().optional(),
      workflowUpdated: z.boolean().optional(),
      systemAnnouncement: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const data: Record<string, unknown> = {};
      const fields = Object.keys(input) as (keyof typeof input)[];
      for (const field of fields) {
        if (input[field] !== undefined) data[field] = input[field] ? 1 : 0;
      }
      return upsertNotificationPreferences(data, ctx.user.openId);
    }),
  }),
});
