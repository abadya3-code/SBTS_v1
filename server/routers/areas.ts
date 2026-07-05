/**
 * server/routers/areas.ts
 * ───────────────────────
 * Procedures for plant areas management.
 */

import { z } from "zod";
import { permissionProcedure, protectedProcedure, router } from "../_core/trpc";
import { createArea, getAreaById, getAreas } from "../db";
import { areaCreateSchema } from "./shared";

export const areasRouter = router({
  list: protectedProcedure.query(async () => getAreas()),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => getAreaById(input.id)),

  create: permissionProcedure("projects.create")
    .input(areaCreateSchema)
    .mutation(async ({ input }) => createArea(input)),
});
