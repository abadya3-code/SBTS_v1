import { z } from "zod";
import { permissionProcedure, router } from "../_core/trpc";
import { getAuditEvents, getAuditSummary } from "../db";

export const auditRouter = router({
  list: permissionProcedure("audit.view")
    .input(z.object({
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0),
      entityType: z.string().optional(),
      action: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => getAuditEvents(input ?? undefined)),

  summary: permissionProcedure("audit.view")
    .query(async () => getAuditSummary()),
});
