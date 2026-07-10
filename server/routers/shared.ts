/**
 * server/routers/shared.ts
 * ────────────────────────
 * Zod schemas shared across multiple routers.
 * Import these instead of redefining them in each router file.
 */

import { z } from "zod";
import { blindPhaseOrder, blindPriorityOrder } from "../db";

// ─── Enum Schemas ──────────────────────────────────────────────────────────

export const projectStatusSchema = z.enum(["Active", "Completed", "On Hold", "Planning", "Final Review"]);
export const blindPhaseSchema = z.enum(blindPhaseOrder);
export const blindPrioritySchema = z.enum(blindPriorityOrder);
export const blindTypeSchema = z.enum(["Slip Blind", "Drop Spool", "Isolation"]);

// ─── Blind Schemas ─────────────────────────────────────────────────────────

export const blindInputSchema = z.object({
  tag: z.string().trim().min(2).max(40),
  type: blindTypeSchema,
  size: z.string().trim().min(1).max(60),
  rate: z.string().trim().max(60).nullable().optional(),
  pressureClass: z.string().trim().max(80).nullable().optional(),
  material: z.string().trim().max(120).nullable().optional(),
  flangeType: z.string().trim().max(80).nullable().optional(),
  gasketType: z.string().trim().max(120).nullable().optional(),
  boltSize: z.string().trim().max(80).nullable().optional(),
  torqueValue: z.string().trim().max(80).nullable().optional(),
  thickness: z.string().trim().max(80).nullable().optional(),
  temperatureRating: z.string().trim().max(80).nullable().optional(),
  pidReference: z.string().trim().max(160).nullable().optional(),
  isoDrawingNumber: z.string().trim().max(160).nullable().optional(),
  installationDate: z.coerce.date().nullable().optional(),
  removalDate: z.coerce.date().nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  phase: blindPhaseSchema.default("Broken / Preparation"),
  owner: z.string().trim().max(160).nullable().optional(),
  priority: blindPrioritySchema.default("Normal"),
  equipment: z.string().trim().max(120).nullable().optional(),
  location: z.string().trim().max(220).nullable().optional(),
  isolationPoint: z.string().trim().max(220).nullable().optional(),
  slipMetalForemanApproved: z.boolean().default(false),
  slipBlindMerged: z.boolean().default(false),
  notes: z.string().trim().max(2_000).nullable().optional(),
});

export const blindCreateSchema = blindInputSchema.extend({
  projectId: z.string().min(2).max(40),
});

export const blindUpdateSchema = blindInputSchema.partial().extend({
  projectId: z.string().min(2).max(40),
  tag: z.string().trim().min(2).max(40),
});

export const blindPhaseApprovalSchema = z.object({
  projectId: z.string().min(2).max(40),
  tag: z.string().trim().min(2).max(40),
  phase: blindPhaseSchema,
  approved: z.boolean(),
  note: z.string().trim().max(800).nullable().optional(),
});

// ─── Project Schemas ───────────────────────────────────────────────────────

export const phaseAssigneeSchema = z.object({
  openId: z.string().trim().min(2).max(220),
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().nullable().optional(),
  avatarUrl: z.string().trim().url().nullable().optional(),
});

export const projectSettingsSchema = z.object({
  projectId: z.string().min(2).max(40),
  slipBlindGateRequired: z.boolean().default(true),
  phaseOwners: z.array(z.object({
    phase: blindPhaseSchema,
    phaseColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    owners: z.array(phaseAssigneeSchema).max(20),
  })).min(1).max(blindPhaseOrder.length),
});

export const areaCreateSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(40),
  description: z.string().max(1_500).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const projectCreateSchema = z.object({
  id: z.string().min(2).max(40),
  name: z.string().min(2).max(200),
  areaId: z.number().int().positive(),
  status: projectStatusSchema.default("Planning"),
  blindsCount: z.number().int().min(0).max(100_000).default(0),
  progress: z.number().int().min(0).max(100).default(0),
  description: z.string().max(1_500).nullable().optional(),
});

// ─── Workflow Schemas ──────────────────────────────────────────────────────

export const workflowPhaseSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(220),
  phaseKey: z.enum(["broken", "assembly", "tightTorque", "finalTight", "inspectionReady"]),
  roleKey: z.enum(["admin", "coordinator", "technician", "qc", "safety", "inspection", "tiEngineer", "metalForeman"]),
  requiredPermissionKey: z.string().min(1).max(120),
  gate: z.string().min(1),
  slaHours: z.number().int().min(0).max(8760),
  evidence: z.array(z.string().min(1).max(120)).default([]),
  automation: z.string().min(1),
  color: z.string().min(3).max(24),
  isCritical: z.boolean(),
});

export const workflowTemplateSchema = z.object({
  id: z.string().min(1).max(96),
  name: z.string().min(1).max(180),
  description: z.string().min(1),
  status: z.enum(["Draft", "Active", "Locked"]),
  projectType: z.string().min(1).max(120),
  version: z.string().min(1).max(32),
  phases: z.array(workflowPhaseSchema).min(1),
});
