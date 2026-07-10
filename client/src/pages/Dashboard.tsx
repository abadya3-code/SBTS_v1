import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileWarning,
  FolderKanban,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { appMeta } from "@/lib/mockData";
import { trpc } from "@/lib/trpc";

const defaultHeroUrl =
  "https://d2xsxph8kpxj0f.cloudfront.net/95256836/T9nk6A5dkk7H7GaCBwTuhX/sbts-command-center-hero-UhGNvmibStQht4VPE3rmFJ.webp";

const phaseColors: Record<string, string> = {
  "Broken / Preparation": "#f59e0b",
  Assembly: "#2563eb",
  "Tight & Torque": "#7c3aed",
  "Final Tight": "#10b981",
  "Inspection Ready": "#0e7490",
};

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseCtaButtons(value: unknown) {
  if (!value || typeof value !== "string")
    return [] as Array<{ label: string; href: string; variant?: string }>;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        item =>
          item &&
          typeof item.label === "string" &&
          typeof item.href === "string"
      )
      .slice(0, 3);
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const { data: generalSettings } = trpc.settings.general.get.useQuery();
  const { data: stats, isLoading, isError, refetch } = trpc.reports.globalStats.useQuery(undefined, {
    staleTime: 30_000,
  });

  const appName = (generalSettings as any)?.appName || appMeta.title;
  const companyName = (generalSettings as any)?.companyName || appMeta.site;
  const companyLogoUrl = (generalSettings as any)?.companyLogoUrl || "";
  const heroTitle =
    (generalSettings as any)?.dashboardHeroTitle ||
    `${appName} command center for blind control, safety visibility, and maintenance execution.`;
  const heroDescription =
    (generalSettings as any)?.dashboardHeroDescription ||
    "Monitor blind status, project execution, workflow ownership, safety critical exposure, and field-ready QR visibility from one professional operations screen.";
  const heroBadge =
    (generalSettings as any)?.dashboardHeroBadge || "Live database dashboard";
  const heroImage =
    (generalSettings as any)?.dashboardHeroImageUrl || defaultHeroUrl;
  const ctaButtons = parseCtaButtons(
    (generalSettings as any)?.dashboardCtaButtons
  );
  const versionName = (generalSettings as any)?.versionName || appMeta.version;
  const versionDate = (generalSettings as any)?.versionDate || "";

  const totalBlinds = asNumber((stats as any)?.totalBlinds);
  const completedBlinds = asNumber((stats as any)?.completedBlinds);
  const inProgressBlinds = asNumber((stats as any)?.inProgressBlinds);
  const criticalBlinds = asNumber((stats as any)?.criticalBlinds);
  const activeProjects = asNumber((stats as any)?.totalProjects);
  const completion = asNumber((stats as any)?.completionRate);
  const totalAreas = asNumber((stats as any)?.totalAreas);
  const phaseCounts = ((stats as any)?.phaseCounts ?? {}) as Record<string, number>;
  const priorityCounts = ((stats as any)?.priorityCounts ?? {}) as Record<string, number>;
  const recentActivity = ((stats as any)?.recentActivity ?? []) as Array<{
    date: string | Date;
    action: string;
    actor: string;
    blindTag: string;
    projectId: string;
  }>;

  const phaseRows = Object.entries(phaseCounts).map(([phase, count]) => ({
    phase,
    count: asNumber(count),
    color: phaseColors[phase] ?? "#64748b",
  }));

  const metricCards = [
    {
      label: "Tracked blinds",
      value: totalBlinds,
      icon: FileWarning,
      tone: "text-cyan-200",
      hint: "Total records from database",
    },
    {
      label: "Completed",
      value: completedBlinds,
      icon: CheckCircle2,
      tone: "text-emerald-300",
      hint: "Inspection Ready phase",
    },
    {
      label: "In progress",
      value: inProgressBlinds,
      icon: ShieldCheck,
      tone: "text-blue-200",
      hint: "Active execution phases",
    },
    {
      label: "Critical",
      value: criticalBlinds,
      icon: ShieldAlert,
      tone: "text-red-300",
      hint: "Critical-priority blinds",
    },
  ];

  if (isError) {
    return (
      <div className="sbts-card p-6">
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
          Dashboard data could not be loaded
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          The dashboard now uses live database queries. Retry after checking DB connectivity and user access.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white"
        >
          Retry dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-900/10 bg-slate-950 text-white shadow-[0_26px_90px_rgba(15,39,56,0.28)]">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/82 to-slate-950/30" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
              <ShieldCheck className="h-4 w-4" /> {heroBadge}
            </div>
            <div className="flex items-start gap-4">
              {companyLogoUrl && (
                <img
                  src={companyLogoUrl}
                  alt="Company logo"
                  className="mt-1 h-14 w-14 rounded-2xl bg-white/95 p-2 object-contain"
                />
              )}
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  {heroTitle}
                </h2>
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
                  {companyName}
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
              {heroDescription}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {(ctaButtons.length
                ? ctaButtons
                : [
                    { label: "Open Projects", href: "/projects", variant: "primary" },
                    { label: "Review Blind Registry", href: "/blinds", variant: "secondary" },
                    { label: "Audit Center", href: "/audit", variant: "secondary" },
                  ]
              ).map((button, index) => (
                <Link
                  key={`${button.href}-${button.label}`}
                  href={button.href}
                  className={
                    index === 0 || button.variant === "primary"
                      ? "inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-200"
                      : "inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
                  }
                >
                  {button.label} <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {metricCards.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="sbts-dark-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-semibold text-slate-300">
                        {item.label}
                      </span>
                      <div className="mt-1 text-xs text-slate-400">
                        {isLoading ? "Loading live data..." : item.hint}
                      </div>
                    </div>
                    <Icon className={`h-5 w-5 ${item.tone}`} />
                  </div>
                  <div className="mt-3 text-3xl font-extrabold tracking-tight">
                    {isLoading ? "…" : item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="sbts-card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                Project execution health
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Live project and blind readiness indicators connected directly to the database.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {completion}% closeout
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <FolderKanban className="h-5 w-5 text-cyan-600" />
              <div className="mt-3 text-2xl font-extrabold">{activeProjects}</div>
              <div className="text-xs font-bold text-slate-500">Total projects</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <Gauge className="h-5 w-5 text-emerald-600" />
              <div className="mt-3 text-2xl font-extrabold">{completion}%</div>
              <div className="text-xs font-bold text-slate-500">Completion rate</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <Users className="h-5 w-5 text-amber-600" />
              <div className="mt-3 text-2xl font-extrabold">{totalAreas}</div>
              <div className="text-xs font-bold text-slate-500">Plant areas</div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {phaseRows.length > 0 ? phaseRows.map(phase => {
              const pct = totalBlinds > 0 ? Math.round((phase.count / totalBlinds) * 100) : 0;
              return (
                <div
                  key={phase.phase}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="status-dot" style={{ backgroundColor: phase.color }} />
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">
                          {phase.phase}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          {pct}% of registered blinds
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-950 dark:text-slate-100">
                      {phase.count}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: phase.color }} />
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-800">
                No blind records yet. Add blinds to see workflow phase distribution.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="sbts-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                Recent database activity
              </h3>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {recentActivity.length > 0 ? recentActivity.slice(0, 6).map(event => (
                <Link
                  key={`${event.projectId}-${event.blindTag}-${event.date}`}
                  href={`/projects/${event.projectId}/blinds/${encodeURIComponent(event.blindTag)}`}
                  className="flex gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-cyan-50 dark:bg-slate-950 dark:hover:bg-slate-800"
                >
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40">
                    <FileWarning className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {event.action}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {event.blindTag} · {event.projectId} · {event.actor}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    {event.date ? new Date(event.date).toLocaleDateString() : "—"}
                  </div>
                </Link>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-800">
                  No workflow logs yet. Activity will appear here after blinds are added or updated.
                </div>
              )}
            </div>
          </div>

          <div className="sbts-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                  Version & system
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Version information is shown as system metadata while identity and hero content are controlled from General Settings.
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Current release
              </div>
              <div className="mt-2 text-xl font-extrabold text-slate-950 dark:text-slate-100">
                {versionName}
              </div>
              {versionDate && (
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  Release date: {versionDate}
                </div>
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(priorityCounts).map(([priority, count]) => (
                  <div key={priority} className="rounded-xl bg-white p-3 text-xs font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
                    {priority}: <span className="text-slate-950 dark:text-white">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
