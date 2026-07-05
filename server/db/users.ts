/**
 * server/db/users.ts
 * ──────────────────
 * User management, role assignments, and registration/approval helpers.
 */

import { asc, desc, eq, inArray } from "drizzle-orm";
import {
  accessPermissions, accessRolePermissions, accessRoles,
  userRoleAssignments, users,
} from "../../drizzle/schema";
import { requireDb } from "./core";
import { AccessControlModel, PhaseKey, RoleKey, UserWithRoles } from "./types";
import { seedAccessControl } from "./seed";

// ─── Access Control ────────────────────────────────────────────────────────

export async function getAccessControlModel(): Promise<AccessControlModel> {
  await seedAccessControl();
  const db = await requireDb();
  const [permissionRows, roleRows, assignmentRows] = await Promise.all([
    db.select().from(accessPermissions).orderBy(asc(accessPermissions.group), asc(accessPermissions.label)),
    db.select().from(accessRoles).orderBy(asc(accessRoles.name)),
    db.select().from(accessRolePermissions),
  ]);
  const roles = roleRows.map((role) => {
    const permissionKeys = assignmentRows
      .filter((a) => a.roleKey === role.key)
      .map((a) => a.permissionKey);
    let menuKeys: string[] = [];
    let phaseKeys: PhaseKey[] = [];
    try { menuKeys = JSON.parse(role.menuKeysJson ?? "[]"); } catch { menuKeys = []; }
    try { phaseKeys = JSON.parse(role.phaseKeysJson ?? "[]") as PhaseKey[]; } catch { phaseKeys = []; }
    return {
      key: role.key as RoleKey,
      name: role.name,
      subtitle: role.subtitle ?? "",
      members: role.members ?? 0,
      color: role.color ?? "#6b7280",
      permissionKeys,
      menuKeys,
      phaseKeys,
    };
  });
  const permissionGroups = permissionRows.reduce<AccessControlModel["permissionGroups"]>((groups, row) => {
    const existing = groups.find((g) => g.group === row.group);
    const permission = { key: row.key, label: row.label, description: row.description ?? "", group: row.group };
    if (existing) {
      existing.permissions.push(permission);
    } else {
      groups.push({ group: row.group, permissions: [permission] });
    }
    return groups;
  }, []);
  return { roles, permissionGroups };
}

export async function updateAccessControlModel(
  roles: { key: string; name: string; subtitle: string; color: string; permissionKeys: string[]; menuKeys: string[]; phaseKeys: string[] }[],
): Promise<void> {
  const db = await requireDb();
  await db.transaction(async (tx) => {
    for (const role of roles) {
      await tx.update(accessRoles).set({
        name: role.name,
        subtitle: role.subtitle,
        color: role.color,
        menuKeysJson: JSON.stringify(role.menuKeys),
        phaseKeysJson: JSON.stringify(role.phaseKeys),
      }).where(eq(accessRoles.key, role.key));
      await tx.delete(accessRolePermissions).where(eq(accessRolePermissions.roleKey, role.key));
      if (role.permissionKeys.length > 0) {
        await tx.insert(accessRolePermissions).values(
          role.permissionKeys.map((permissionKey) => ({ roleKey: role.key, permissionKey, createdAt: new Date() }))
        );
      }
    }
  });
}

export async function createAccessRole(
  role: { key: string; name: string; subtitle: string; color: string; permissionKeys: string[]; menuKeys: string[]; phaseKeys: string[] },
): Promise<void> {
  const db = await requireDb();
  const now = new Date();
  await db.insert(accessRoles).values({
    key: role.key,
    name: role.name,
    subtitle: role.subtitle,
    members: 0,
    color: role.color,
    menuKeysJson: JSON.stringify(role.menuKeys),
    phaseKeysJson: JSON.stringify(role.phaseKeys),
    createdAt: now,
    updatedAt: now,
  });
  if (role.permissionKeys.length > 0) {
    await db.insert(accessRolePermissions).values(
      role.permissionKeys.map((permissionKey) => ({ roleKey: role.key, permissionKey, createdAt: now }))
    );
  }
}

export async function deleteAccessRole(roleKey: string): Promise<void> {
  const db = await requireDb();
  await db.transaction(async (tx) => {
    await tx.delete(accessRolePermissions).where(eq(accessRolePermissions.roleKey, roleKey));
    await tx.delete(userRoleAssignments).where(eq(userRoleAssignments.roleKey, roleKey));
    await tx.delete(accessRoles).where(eq(accessRoles.key, roleKey));
  });
}

// ─── User Queries ──────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<UserWithRoles[]> {
  const db = await requireDb();
  const [userRows, assignmentRows] = await Promise.all([
    db.select().from(users).orderBy(asc(users.name)),
    db.select().from(userRoleAssignments),
  ]);
  return userRows.map((user) => ({
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    userStatus: user.userStatus,
    department: user.department ?? null,
    specialty: user.specialty ?? null,
    employeeNumber: user.employeeNumber ?? null,
    registrationNote: user.registrationNote ?? null,
    approvedByOpenId: user.approvedByOpenId ?? null,
    approvedAt: user.approvedAt ?? null,
    createdAt: user.createdAt,
    lastSignedIn: user.lastSignedIn,
    assignedRoles: assignmentRows.filter((a) => a.userId === user.id).map((a) => a.roleKey),
  }));
}

export async function getPendingUsers(): Promise<UserWithRoles[]> {
  const db = await requireDb();
  const [userRows, assignmentRows] = await Promise.all([
    db.select().from(users).where(eq(users.userStatus, "pending")).orderBy(desc(users.createdAt)),
    db.select().from(userRoleAssignments),
  ]);
  return userRows.map((user) => ({
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    userStatus: user.userStatus,
    department: user.department ?? null,
    specialty: user.specialty ?? null,
    employeeNumber: user.employeeNumber ?? null,
    registrationNote: user.registrationNote ?? null,
    approvedByOpenId: user.approvedByOpenId ?? null,
    approvedAt: user.approvedAt ?? null,
    createdAt: user.createdAt,
    lastSignedIn: user.lastSignedIn,
    assignedRoles: assignmentRows.filter((a) => a.userId === user.id).map((a) => a.roleKey),
  }));
}

// ─── Role Assignments ──────────────────────────────────────────────────────

export async function assignRolesToUser(userId: number, roleKeys: string[], assignedByOpenId?: string): Promise<void> {
  const db = await requireDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(userRoleAssignments).where(eq(userRoleAssignments.userId, userId));
    if (roleKeys.length > 0) {
      await tx.insert(userRoleAssignments).values(
        roleKeys.map((roleKey) => ({ userId, roleKey, assignedByOpenId: assignedByOpenId ?? null, createdAt: now }))
      );
    }
  });
  await syncRoleMemberCounts();
}

export async function syncRoleMemberCounts(): Promise<void> {
  const db = await requireDb();
  const [roleRows, assignmentRows] = await Promise.all([
    db.select({ key: accessRoles.key }).from(accessRoles),
    db.select().from(userRoleAssignments),
  ]);
  for (const role of roleRows) {
    const count = assignmentRows.filter((a) => a.roleKey === role.key).length;
    await db.update(accessRoles).set({ members: count }).where(eq(accessRoles.key, role.key));
  }
}

export async function updateUserSystemRole(userId: number, newRole: "user" | "admin"): Promise<void> {
  const db = await requireDb();
  await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
}

export async function getUserPermissionKeys(openId: string): Promise<string[]> {
  await seedAccessControl();
  const db = await requireDb();
  const userRows = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.openId, openId)).limit(1);
  const user = userRows[0];
  if (!user) return [];
  if (user.role === "admin") {
    const rows = await db.select({ key: accessPermissions.key }).from(accessPermissions);
    return rows.map((row) => row.key);
  }

  const assignments = await db
    .select({ roleKey: userRoleAssignments.roleKey })
    .from(userRoleAssignments)
    .where(eq(userRoleAssignments.userId, user.id));

  const roleKeys = assignments.map((assignment) => assignment.roleKey);
  if (roleKeys.length === 0) return [];

  const permissionRows = await db
    .select({ permissionKey: accessRolePermissions.permissionKey })
    .from(accessRolePermissions)
    .where(inArray(accessRolePermissions.roleKey, roleKeys));

  return Array.from(new Set(permissionRows.map((row) => row.permissionKey)));
}

export async function userHasPermission(openId: string, permissionKey: string): Promise<boolean> {
  const permissionKeys = await getUserPermissionKeys(openId);
  return permissionKeys.includes(permissionKey);
}

export async function getUserAccessProfile(openId: string): Promise<{ roleKeys: string[]; permissionKeys: string[]; menuKeys: string[]; phaseKeys: string[] }> {
  await seedAccessControl();
  const db = await requireDb();
  const userRows = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.openId, openId)).limit(1);
  const user = userRows[0];
  if (!user) return { roleKeys: [], permissionKeys: [], menuKeys: [], phaseKeys: [] };

  const roleRows = await db.select().from(accessRoles);
  const assignedRoleKeys = user.role === "admin"
    ? roleRows.map((role) => role.key)
    : (await db
        .select({ roleKey: userRoleAssignments.roleKey })
        .from(userRoleAssignments)
        .where(eq(userRoleAssignments.userId, user.id)))
        .map((assignment) => assignment.roleKey);

  const selectedRoles = roleRows.filter((role) => assignedRoleKeys.includes(role.key));
  const permissionKeys = await getUserPermissionKeys(openId);
  const menuKeys = new Set<string>();
  const phaseKeys = new Set<string>();

  for (const role of selectedRoles) {
    try {
      JSON.parse(role.menuKeysJson ?? "[]").forEach((key: unknown) => {
        if (typeof key === "string") menuKeys.add(key);
      });
    } catch { /* ignore bad role JSON */ }
    try {
      JSON.parse(role.phaseKeysJson ?? "[]").forEach((key: unknown) => {
        if (typeof key === "string") phaseKeys.add(key);
      });
    } catch { /* ignore bad role JSON */ }
  }

  if (user.role === "admin") {
    ["dashboard", "areas", "projects", "blinds", "workflow-studio", "access-control", "users", "settings", "notifications", "reports", "audit"].forEach((key) => menuKeys.add(key));
  }

  return {
    roleKeys: Array.from(new Set(assignedRoleKeys)),
    permissionKeys,
    menuKeys: Array.from(menuKeys),
    phaseKeys: Array.from(phaseKeys),
  };
}

// ─── Registration & Approval ───────────────────────────────────────────────

/**
 * Complete registration for a user after OAuth.
 * Saves department, specialty, employeeNumber, note.
 * Sets userStatus to 'pending' so admin must approve before full access.
 */
export async function completeUserRegistration(
  openId: string,
  data: { department: string; specialty: string; employeeNumber: string; registrationNote?: string },
): Promise<void> {
  const db = await requireDb();
  await db.update(users).set({
    department: data.department,
    specialty: data.specialty,
    employeeNumber: data.employeeNumber,
    registrationNote: data.registrationNote ?? null,
    userStatus: "pending",
  }).where(eq(users.openId, openId));
}

/** Approve a pending user registration. Sets userStatus to 'active'. */
export async function approveUserRegistration(
  userId: number,
  approvedByOpenId: string,
): Promise<void> {
  const db = await requireDb();
  await db.update(users).set({
    userStatus: "active",
    approvedByOpenId,
    approvedAt: new Date(),
  }).where(eq(users.id, userId));
}

/** Reject a pending user registration. Sets userStatus to 'rejected'. */
export async function rejectUserRegistration(
  userId: number,
  rejectedByOpenId: string,
): Promise<void> {
  const db = await requireDb();
  await db.update(users).set({
    userStatus: "rejected",
    approvedByOpenId: rejectedByOpenId,
    approvedAt: new Date(),
  }).where(eq(users.id, userId));
}
