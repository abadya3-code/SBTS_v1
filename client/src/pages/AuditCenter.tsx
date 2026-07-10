/*
Design Philosophy: Compliance Command Center.
This page turns security/audit configuration into an operational view instead of hiding it inside settings.
*/
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

function AuditMetric({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">{value}</div>
            {sub && <div className="mt-1 text-xs font-semibold text-slate-500">{sub}</div>}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuditCenter() {
  const securityQuery = trpc.settings.security.get.useQuery();
  const notificationsQuery = trpc.notifications.list.useQuery({ limit: 20 }, { refetchOnWindowFocus: false });
  const reportsQuery = trpc.reports.globalStats.useQuery(undefined, { refetchOnWindowFocus: false });

  const security = securityQuery.data as any;
  const notifications = notificationsQuery.data ?? [];
  const stats = reportsQuery.data as any;

  const activeControls = useMemo(() => {
    if (!security) return 0;
    return [
      security.auditTrailEnabled !== 0,
      security.requireStrongPassword !== 0,
      security.requireDeleteConfirmation !== 0,
      security.qrRequireAuth !== 0,
      security.allowDeleteBlinds === 0,
      security.allowDeleteProjects === 0,
    ].filter(Boolean).length;
  }, [security]);

  const exportAuditSummary = () => {
    const rows = [
      ["SBTS Audit Center Export"],
      ["Generated", new Date().toISOString()],
      ["Audit trail", security?.auditTrailEnabled !== 0 ? "Enabled" : "Disabled"],
      ["Retention days", security?.auditRetentionDays ?? "-"],
      ["Session timeout", security?.sessionTimeoutMinutes ?? "-"],
      ["Max login attempts", security?.maxLoginAttempts ?? "-"],
      ["Notifications sampled", notifications.length],
      ["Projects", stats?.totalProjects ?? "-"],
      ["Blinds", stats?.totalBlinds ?? "-"],
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sbts-audit-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit center"
        title="Audit & Compliance Center"
        description="Professional compliance overview for traceability controls, security posture, notification events, and operational audit readiness."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="rounded-2xl bg-white" onClick={() => { securityQuery.refetch(); notificationsQuery.refetch(); reportsQuery.refetch(); }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button type="button" className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={exportAuditSummary}>
              <Download className="h-4 w-4" /> Export summary
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AuditMetric label="Audit trail" value={security?.auditTrailEnabled !== 0 ? "Enabled" : "Disabled"} sub="Controlled from Security Settings" icon={Activity} />
        <AuditMetric label="Retention" value={`${security?.auditRetentionDays ?? 0} days`} sub="Compliance log retention" icon={Clock3} />
        <AuditMetric label="Controls active" value={`${activeControls}/6`} sub="Security posture score" icon={ShieldCheck} />
        <AuditMetric label="Event sample" value={notifications.length} sub="Latest notification records" icon={FileText} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold text-slate-950 dark:text-white">
              <LockKeyhole className="h-5 w-5 text-slate-600" />
              Security and audit controls
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 md:grid-cols-2">
            {[
              ["Audit trail", security?.auditTrailEnabled !== 0, "Tracks compliance-critical actions."],
              ["Strong password", security?.requireStrongPassword !== 0, `Minimum ${security?.minPasswordLength ?? "-"} characters.`],
              ["Delete confirmation", security?.requireDeleteConfirmation !== 0, "Prevents accidental destructive actions."],
              ["QR requires auth", security?.qrRequireAuth !== 0, "Controls field access from QR."],
              ["Blind delete locked", security?.allowDeleteBlinds === 0, "Recommended for legal traceability."],
              ["Project delete locked", security?.allowDeleteProjects === 0, "Recommended for production records."],
            ].map(([label, ok, desc]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-extrabold text-slate-950 dark:text-white">{label}</div>
                  {ok ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> OK</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><AlertTriangle className="mr-1 h-3.5 w-3.5" /> Review</Badge>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{String(desc)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-extrabold text-slate-950 dark:text-white">Recent operational events</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {notifications.length > 0 ? notifications.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-slate-950 dark:text-white">{item.title}</div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
                    </div>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-800">
                  No notification events found yet. Audit events table is recommended for the next backend sprint.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base font-extrabold text-slate-950 dark:text-white">Production audit gap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0">
          <p className="text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            The current version has settings and notification traces, but a dedicated immutable audit event table is still required before formal industrial production use.
          </p>
          <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800 ring-1 ring-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:ring-amber-900/40">
            Recommended next backend item: create audit_events with actor, action, entity type, before/after JSON, IP, user agent, hash, and previous hash.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
