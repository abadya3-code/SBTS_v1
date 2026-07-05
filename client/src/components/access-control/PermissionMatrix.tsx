import type { Dispatch, SetStateAction } from "react";
import { Check, Grid3X3, LockKeyhole, MonitorCog, ShieldCheck, Workflow, X } from "lucide-react";
import { menuCatalog, permissionGroups, phases, type PhaseKey, type RoleModel } from "@/lib/mockData";

type PermissionMatrixProps = {
  roles: RoleModel[];
  onRolesChange: Dispatch<SetStateAction<RoleModel[]>>;
};

type MatrixMode = "permissions" | "menus" | "phases";

function toggleString(list: string[], key: string) {
  return list.includes(key) ? list.filter((item) => item !== key) : [...list, key];
}

function togglePhase(list: PhaseKey[], key: PhaseKey) {
  return list.includes(key) ? list.filter((item) => item !== key) : [...list, key];
}

function MatrixToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-xs font-extrabold transition ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100"
          : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
      }`}
      title={label}
      aria-label={label}
    >
      {active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
    </button>
  );
}

export default function PermissionMatrix({ roles, onRolesChange }: PermissionMatrixProps) {
  const permissionRows = permissionGroups.flatMap((group) => group.permissions.map((permission) => ({ ...permission, groupName: group.group })));

  function updateRole(roleKey: RoleModel["key"], updater: (role: RoleModel) => RoleModel) {
    onRolesChange((current) => current.map((role) => (role.key === roleKey ? updater(role) : role)));
  }

  function togglePermission(roleKey: RoleModel["key"], permissionKey: string) {
    updateRole(roleKey, (role) => ({ ...role, permissionKeys: toggleString(role.permissionKeys, permissionKey) }));
  }

  function toggleMenu(roleKey: RoleModel["key"], menuKey: string) {
    updateRole(roleKey, (role) => ({ ...role, menuKeys: toggleString(role.menuKeys, menuKey) }));
  }

  function togglePhaseForRole(roleKey: RoleModel["key"], phaseKey: PhaseKey) {
    updateRole(roleKey, (role) => ({ ...role, phaseKeys: togglePhase(role.phaseKeys, phaseKey) }));
  }

  const roleCount = roles.length || 1;
  const totalPermissions = permissionRows.length * roleCount;
  const enabledPermissions = roles.reduce((sum, role) => sum + role.permissionKeys.length, 0);
  const permissionCoverage = Math.round((enabledPermissions / Math.max(totalPermissions, 1)) * 100);

  const sections: { mode: MatrixMode; title: string; subtitle: string; icon: typeof ShieldCheck }[] = [
    { mode: "permissions", title: "Permission Matrix", subtitle: "API and feature permissions per role.", icon: ShieldCheck },
    { mode: "menus", title: "Menu Visibility", subtitle: "Control which sidebar pages appear for each role.", icon: MonitorCog },
    { mode: "phases", title: "Workflow Task Ownership", subtitle: "Define which phase tasks each role can own or approve.", icon: Workflow },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
              <Grid3X3 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950">{roles.length}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Role templates</div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950">{permissionRows.length}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Permission keys</div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950">{permissionCoverage}%</div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Coverage enabled</div>
            </div>
          </div>
        </div>
      </div>

      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <section key={section.mode} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950">{section.title}</h3>
                    <p className="text-xs font-medium text-slate-500">{section.subtitle}</p>
                  </div>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-500 ring-1 ring-slate-200">
                  Click any cell to toggle
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-white text-left text-xs font-black uppercase tracking-wide text-slate-400">
                    <th className="sticky left-0 z-10 min-w-[280px] border-b border-slate-200 bg-white px-4 py-3">
                      {section.mode === "permissions" ? "Access item" : section.mode === "menus" ? "Menu item" : "Workflow phase"}
                    </th>
                    {roles.map((role) => (
                      <th key={role.key} className="min-w-[150px] border-b border-slate-200 px-3 py-3 text-center">
                        <div className="mx-auto flex max-w-[140px] items-center justify-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 normal-case ring-1 ring-slate-200">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: role.color }} />
                          <span className="truncate text-xs font-extrabold text-slate-700">{role.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.mode === "permissions" &&
                    permissionRows.map((permission) => (
                      <tr key={permission.key} className="border-b border-slate-100 transition hover:bg-slate-50/70">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 align-top">
                          <div className="font-extrabold text-slate-950">{permission.label}</div>
                          <div className="mt-1 text-xs font-medium text-slate-500">{permission.description}</div>
                          <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">{permission.groupName}</div>
                        </td>
                        {roles.map((role) => (
                          <td key={`${role.key}-${permission.key}`} className="px-3 py-3 text-center align-middle">
                            <MatrixToggle
                              active={role.permissionKeys.includes(permission.key)}
                              label={`${role.name} - ${permission.label}`}
                              onClick={() => togglePermission(role.key, permission.key)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {section.mode === "menus" &&
                    menuCatalog.map((menu) => {
                      const MenuIcon = menu.icon;
                      return (
                        <tr key={menu.key} className="border-b border-slate-100 transition hover:bg-slate-50/70">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 align-top">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                <MenuIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-950">{menu.label}</div>
                                <div className="mt-1 text-xs font-medium text-slate-500">Sidebar visibility key: {menu.key}</div>
                              </div>
                            </div>
                          </td>
                          {roles.map((role) => (
                            <td key={`${role.key}-${menu.key}`} className="px-3 py-3 text-center align-middle">
                              <MatrixToggle
                                active={role.menuKeys.includes(menu.key)}
                                label={`${role.name} - ${menu.label}`}
                                onClick={() => toggleMenu(role.key, menu.key)}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}

                  {section.mode === "phases" &&
                    phases.map((phase) => (
                      <tr key={phase.key} className="border-b border-slate-100 transition hover:bg-slate-50/70">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 align-top">
                          <div className="flex items-center gap-3">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: phase.color }} />
                            <div>
                              <div className="font-extrabold text-slate-950">{phase.label}</div>
                              <div className="mt-1 text-xs font-medium text-slate-500">Default owner: {phase.owner}</div>
                            </div>
                          </div>
                        </td>
                        {roles.map((role) => (
                          <td key={`${role.key}-${phase.key}`} className="px-3 py-3 text-center align-middle">
                            <MatrixToggle
                              active={role.phaseKeys.includes(phase.key)}
                              label={`${role.name} - ${phase.label}`}
                              onClick={() => togglePhaseForRole(role.key, phase.key)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
