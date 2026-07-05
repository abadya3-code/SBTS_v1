/*
Design Philosophy: Industrial Command Center Minimalism.
The shell behaves like an operations room frame: stable navigation, strong context header, and responsive access to critical areas without visual noise.
*/
import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Loader2, LogOut, Menu, Search, ShieldCheck, X } from "lucide-react";
import { appMeta, navItems, secondaryNavItems } from "@/lib/mockData";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useTheme } from "@/contexts/ThemeContext";

const heroUrl = "https://d2xsxph8kpxj0f.cloudfront.net/95256836/T9nk6A5dkk7H7GaCBwTuhX/sbts-command-center-hero-UhGNvmibStQht4VPE3rmFJ.webp";

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const { setTheme, setIsDarkMode } = useTheme();

  // Load user profile to apply saved preferred theme
  const { data: profileData } = trpc.profile.get.useQuery(undefined, {
    enabled: !loading && !!user,
    refetchOnWindowFocus: false,
  });

  // Apply the user's saved theme preference once loaded
  useEffect(() => {
    if (!profileData?.preferredTheme) return;
    const pref = profileData.preferredTheme as string;
    // Map profile preference ('light' | 'dark' | 'system') to theme model
    if (pref === "dark") {
      setIsDarkMode(true);
    } else if (pref === "light") {
      setIsDarkMode(false);
    } else if (pref === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(prefersDark);
    }
    // Named themes stored directly
    if (["sap-clean", "sbts-custom", "modern"].includes(pref)) {
      setTheme(pref as "sap-clean" | "sbts-custom" | "modern");
    }
  }, [profileData?.preferredTheme, setTheme, setIsDarkMode]);

  // Load dynamic settings
  const { data: generalSettings } = trpc.settings.general.get.useQuery();
  const dynamicAppName = (generalSettings as any)?.appName || appMeta.title;
  const dynamicVersion = (generalSettings as any)?.versionName || appMeta.version;
  const dynamicCompanyName = (generalSettings as any)?.companyName || appMeta.site;

  // Auth guard: redirect unauthenticated or non-active users
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLocation("/login");
      return;
    }
    // Admins always have full access regardless of registration status
    if ((user as any).role === "admin") return;
    // Non-admin users: check registration flow
    const userStatus = (user as any).userStatus;
    // If status is pending or rejected → waiting room
    if (userStatus === "pending" || userStatus === "rejected") {
      setLocation("/approve");
      return;
    }
    // If status is active → full access
    if (userStatus === "active") return;
    // If status is null/undefined (new OAuth user, no registration yet) → registration form
    if (!userStatus) {
      setLocation("/register");
      return;
    }
  }, [user, loading, setLocation]);

  // Pending users count for admin badge
  const pendingQuery = trpc.accessControl.pendingUsers.useQuery(undefined, {
    enabled: !loading && user?.role === "admin",
    refetchInterval: 60_000,
  });
  const pendingCount = pendingQuery.data?.length ?? 0;

  const showComingSoon = (label: string) => {
    toast.info(`${label} — قريباً`);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="text-slate-400 text-sm tracking-widest uppercase">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userInitials = (user as any).name
    ? (user as any).name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const accessMenuKeys = new Set<string>((user as any).access?.menuKeys ?? []);
  const isAdmin = (user as any).role === "admin";
  const canSeeMenu = (key: string) => isAdmin || key === "dashboard" || accessMenuKeys.has(key);
  const visibleNavItems = navItems.filter((item) => canSeeMenu(item.key));
  const visibleSecondaryNavItems = secondaryNavItems.filter((item) => canSeeMenu(item.key));

  return (
    <div className="min-h-screen overflow-hidden bg-slate-100 text-slate-950 industrial-grid">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(23,76,126,0.18),transparent_38%)]" />

      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[290px] transform border-r border-white/10 bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="relative overflow-hidden border-b border-white/10 p-5">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url(${heroUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="relative flex items-center justify-between gap-3">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 ring-1 ring-cyan-200/25">
                  <ShieldCheck className="h-6 w-6 text-cyan-200" />
                </div>
                <div>
<div className="text-base font-extrabold tracking-tight">{dynamicAppName}</div>
                   <div className="text-xs font-medium text-slate-300">{dynamicCompanyName}</div>
                </div>
              </Link>
              <button className="rounded-xl p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Command</div>
            <nav className="space-y-1.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active =
                  location === item.path ||
                  (location === "/" && item.path === "/dashboard") ||
                  (item.path !== "/dashboard" && location.startsWith(`${item.path}/`)) ||
                  (item.path === "/projects" && /^\/areas\/[^/]+\/projects(\/.*)?$/.test(location));
                return (
                  <Link
                    key={item.key}
                    href={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-cyan-300/15 text-white shadow-[inset_3px_0_0_rgba(103,232,249,0.9)]" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-cyan-200" : "text-slate-400 group-hover:text-cyan-200"}`} />
                    <span>{item.label}</span>
                    {/* Pending users badge on Users nav item */}
                    {item.key === "users" && pendingCount > 0 && (
                      <span className="absolute left-3 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-slate-950">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-7 mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Next Modules</div>
            <div className="space-y-1.5">
              {visibleSecondaryNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-400 transition hover:bg-white/8 hover:text-white" onClick={() => showComingSoon(item.label)}>
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                {/* Clickable avatar/name → Profile page */}
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl hover:bg-white/10 transition p-1 -m-1"
                >
                  {(user as any).avatarUrl ? (
                    <img src={(user as any).avatarUrl} alt="Avatar" className="h-10 w-10 rounded-xl object-cover ring-2 ring-cyan-400/30" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-200 text-sm font-extrabold text-slate-950">
                      {userInitials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{(user as any).name ?? "مستخدم"}</div>
                    <div className="truncate text-xs text-slate-400">
                      {user.role === "admin" ? "مسؤول النظام" : (user as any).specialty ?? "مستخدم"}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-red-400 transition"
                  title="تسجيل الخروج"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative z-10 min-h-screen lg:pl-[290px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/78 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">{dynamicAppName}</h1>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">{dynamicVersion}</span>
              </div>
              <p className="mt-0.5 truncate text-xs font-medium text-slate-500 sm:text-sm">{dynamicCompanyName} · {appMeta.subtitle}</p>
            </div>
            <div className="hidden min-w-[280px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 shadow-inner md:flex">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search blind tag, project, area...</span>
            </div>
            <ThemeToggle className="rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700" />
            <NotificationBell />
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
