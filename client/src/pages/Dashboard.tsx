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
import { appMeta, phases, recentEvents } from "@/lib/mockData";
import { trpc } from "@/lib/trpc";

const defaultHeroUrl =
  "https://d2xsxph8kpxj0f.cloudfront.net/95256836/T9nk6A5dkk7H7GaCBwTuhX/sbts-command-center-hero-UhGNvmibStQht4VPE3rmFJ.webp";

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
  const { data: slipStats } = trpc.slipBlinds.stats.useQuery(undefined, {
    staleTime: 30_000,
  });
  const { data: projects = [] } = trpc.projects.list.useQuery(undefined, {
    staleTime: 30_000,
  });
  const { data: recentBlinds } = trpc.slipBlinds.list.useQuery(
    { limit: 6, offset: 0 },
    { staleTime: 30_000 }
  );

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
    (generalSettings as any)?.dashboardHeroBadge || "Live operations dashboard";
  const heroImage =
    (generalSettings as any)?.dashboardHeroImageUrl || defaultHeroUrl;
  const ctaButtons = parseCtaButtons(
    (generalSettings as any)?.dashboardCtaButtons
  );
  const versionName = (generalSettings as any)?.versionName || appMeta.version;
  const versionDate = (generalSettings as any)?.versionDate || "";

  const totalBlinds = asNumber(
    (slipStats as any)?.total,
    phases.reduce((sum, phase) => sum + phase.count, 0)
  );
  const inService = asNumber((slipStats as any)?.inService);
  const removed = asNumber((slipStats as any)?.removed);
  const merged = asNumber((slipStats as any)?.merged);
  const critical = asNumber((slipStats as any)?.critical);
  const completion =
    totalBlinds > 0 ? Math.round(((removed + merged) / totalBlinds) * 100) : 0;
  const activeProjects = projects.length;
  const blindRows = (recentBlinds as any)?.rows ?? [];

  const metricCards = [
    {
      label: "Tracked blinds",
      value: totalBlinds,
      icon: FileWarning,
      tone: "text-cyan-200",
      hint: "Total registered blinds",
    },
    {
      label: "In service",
      value: inService,
      icon: ShieldCheck,
      tone: "text-emerald-300",
      hint: "Active field blinds",
    },
    {
      label: "Removed / merged",
      value: removed + merged,
      icon: CheckCircle2,
      tone: "text-blue-200",
      hint: "Completed removal or merged state",
    },
    {
      label: "Critical",
      value: critical,
      icon: ShieldAlert,
      tone: "text-red-300",
      hint: "High attention records",
    },
  ];

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
                    {
                      label: "Open Projects",
                      href: "/projects",
                      variant: "primary",
                    },
                    {
                      label: "Review Blind Registry",
                      href: "/blinds",
                      variant: "secondary",
                    },
                    {
                      label: "System Settings",
                      href: "/settings",
                      variant: "secondary",
                    },
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
                        {item.hint}
                      </div>
                    </div>
                    <Icon className={`h-5 w-5 ${item.tone}`} />
                  </div>
                  <div className="mt-3 text-3xl font-extrabold tracking-tight">
                    {item.value}
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
                Live project and blind readiness indicators connected to the
                database.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {completion}% closeout
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <FolderKanban className="h-5 w-5 text-cyan-600" />
              <div className="mt-3 text-2xl font-extrabold">
                {activeProjects}
              </div>
              <div className="text-xs font-bold text-slate-500">
                Active projects
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <Gauge className="h-5 w-5 text-emerald-600" />
              <div className="mt-3 text-2xl font-extrabold">{completion}%</div>
              <div className="text-xs font-bold text-slate-500">
                Removal / merge readiness
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <Users className="h-5 w-5 text-amber-600" />
              <div className="mt-3 text-2xl font-extrabold">8</div>
              <div className="text-xs font-bold text-slate-500">
                Operational roles
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {phases.map(phase => (
              <div
                key={phase.key}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="status-dot"
                      style={{ backgroundColor: phase.color }}
                    />
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">
                        {phase.label}
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        Default owner: {phase.owner}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-950 dark:text-slate-100">
                    {phase.count}
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, phase.count * 2.4)}%`,
                      backgroundColor: phase.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="sbts-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                Recent blind focus
              </h3>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {blindRows.length > 0
                ? blindRows.map((blind: any) => (
                    <Link
                      key={`${blind.projectId}-${blind.tag}`}
                      href={`/projects/${blind.projectId}/blinds/${encodeURIComponent(blind.tag)}`}
                      className="flex gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-cyan-50 dark:bg-slate-950 dark:hover:bg-slate-800"
                    >
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40">
                        <FileWarning className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {blind.tag}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          {blind.projectName ?? blind.projectId} · {blind.type}{" "}
                          · {blind.phase ?? blind.slipStatus}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-400">
                        {blind.priority}
                      </div>
                    </Link>
                  ))
                : recentEvents.map(event => (
                    <div
                      key={`${event.title}-${event.time}`}
                      className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950"
                    >
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {event.title}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          {event.detail}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-400">
                        {event.time}
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          <div className="sbts-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                  Version & system
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Version information is now shown as system metadata, while
                  identity and hero content are controlled from General
                  Settings.
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
