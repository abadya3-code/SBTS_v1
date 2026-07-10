import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarDays, ClipboardCheck, Download, RefreshCw, Save, TimerReset, TrendingUp, UsersRound, Wrench } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function MetricCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: React.ElementType }) {
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

function splitLines(value: string) {
  return value.split("\n").map(item => item.trim()).filter(Boolean);
}

export default function ManagementCenter() {
  const utils = trpc.useUtils();
  const [report, setReport] = useState({
    reportDate: new Date().toISOString().slice(0, 10),
    shiftName: "Day Shift",
    areaCode: "",
    projectId: "",
    progressSummary: "",
    completedCount: 0,
    inProgressCount: 0,
    overdueCount: 0,
    safetyHighlights: "",
    nextPlan: "",
  });
  const [resource, setResource] = useState({
    projectId: "",
    areaCode: "",
    resourceType: "Manpower",
    resourceName: "",
    requiredQty: 1,
    availableQty: 0,
    unit: "each",
    shiftName: "Day Shift",
    needDate: new Date().toISOString().slice(0, 10),
    status: "Planned",
    notes: "",
  });
  const [sla, setSla] = useState({
    phase: "Assembly",
    priority: "All",
    targetHours: 24,
    escalationRole: "Coordinator",
    escalationAfterHours: 4,
    isActive: true,
  });

  const summaryQuery = trpc.management.summary.useQuery({ days: 14 }, { refetchOnWindowFocus: false });
  const reportsQuery = trpc.management.dailyReports.useQuery({ limit: 10 }, { refetchOnWindowFocus: false });
  const resourcesQuery = trpc.management.resourcePlan.useQuery({ limit: 20 }, { refetchOnWindowFocus: false });
  const slaRulesQuery = trpc.management.slaRules.useQuery(undefined, { refetchOnWindowFocus: false });

  const createReport = trpc.management.createDailyReport.useMutation({
    onSuccess: async () => {
      toast.success("Daily progress report saved.");
      setReport(current => ({ ...current, progressSummary: "", safetyHighlights: "", nextPlan: "" }));
      await Promise.all([utils.management.summary.invalidate(), utils.management.dailyReports.invalidate()]);
    },
    onError: error => toast.error(error.message),
  });
  const createResource = trpc.management.createResourcePlan.useMutation({
    onSuccess: async () => {
      toast.success("Resource plan entry saved.");
      setResource(current => ({ ...current, resourceName: "", notes: "" }));
      await Promise.all([utils.management.summary.invalidate(), utils.management.resourcePlan.invalidate()]);
    },
    onError: error => toast.error(error.message),
  });
  const upsertSla = trpc.management.upsertSlaRule.useMutation({
    onSuccess: async () => {
      toast.success("SLA rule saved.");
      await Promise.all([utils.management.summary.invalidate(), utils.management.slaRules.invalidate()]);
    },
    onError: error => toast.error(error.message),
  });

  const summary = summaryQuery.data as any;
  const totals = summary?.totals ?? {};
  const reports = reportsQuery.data ?? [];
  const resourceRows = resourcesQuery.data ?? [];
  const slaRules = slaRulesQuery.data ?? [];

  const refreshAll = () => {
    summaryQuery.refetch();
    reportsQuery.refetch();
    resourcesQuery.refetch();
    slaRulesQuery.refetch();
  };

  const exportCsv = () => {
    const rows = [
      ["SBTS Management Export"],
      ["Generated", new Date().toISOString()],
      ["Projects", totals.projects ?? 0],
      ["Blinds", totals.blinds ?? 0],
      ["SLA breaches", totals.slaBreaches ?? 0],
      ["Resource gaps", totals.resourceGaps ?? 0],
      [],
      ["SLA breach", "Project", "Phase", "Priority", "Hours open", "Target"],
      ...((summary?.slaBreaches ?? []) as any[]).map(row => [row.tag, row.projectId, row.phase, row.priority, row.hoursOpen, row.targetHours]),
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sbts-management-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitDailyReport = () => {
    if (!report.progressSummary.trim()) {
      toast.error("Write a progress summary before saving.");
      return;
    }
    createReport.mutate({
      ...report,
      reportDate: new Date(report.reportDate),
      areaCode: report.areaCode || null,
      projectId: report.projectId || null,
      safetyHighlights: report.safetyHighlights || null,
      nextPlan: report.nextPlan || null,
    });
  };

  const submitResource = () => {
    if (!resource.resourceName.trim()) {
      toast.error("Write the resource name before saving.");
      return;
    }
    createResource.mutate({
      ...resource,
      projectId: resource.projectId || null,
      areaCode: resource.areaCode || null,
      needDate: resource.needDate ? new Date(resource.needDate) : null,
      notes: resource.notes || null,
    });
  };

  const submitSla = () => {
    upsertSla.mutate({
      ...sla,
      phase: sla.phase as any,
      priority: sla.priority as any,
      escalationRole: sla.escalationRole || null,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Management execution"
        title="Management & Planning Center"
        description="Leadership-ready SLA compliance, overdue blinds, resource gaps, daily progress reports, and shift planning for industrial maintenance execution."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="rounded-2xl bg-white" onClick={refreshAll}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button type="button" className="rounded-2xl bg-slate-950 text-white" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="SLA breaches" value={totals.slaBreaches ?? 0} sub="Phase age above target" icon={TimerReset} />
        <MetricCard label="Expiry overdue" value={totals.expiryOverdue ?? 0} sub="Blind expiry before today" icon={AlertTriangle} />
        <MetricCard label="Resource gaps" value={totals.resourceGaps ?? 0} sub="Required above available" icon={Wrench} />
        <MetricCard label="Checklist compliance" value={`${totals.checklistCompliance ?? 0}%`} sub="Completed required checklists" icon={ClipboardCheck} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-base font-extrabold"><TrendingUp className="h-5 w-5 text-cyan-700" /> Project health and SLA watch</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-5">
            {(summary?.projectHealth ?? []).slice(0, 8).map((project: any) => (
              <div key={project.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><div className="font-extrabold text-slate-950">{project.name}</div><div className="mt-1 text-xs font-semibold text-slate-500">{project.id} · {project.status} · {project.blinds} blinds</div></div>
                  <Badge className={project.health < 70 ? "bg-red-100 text-red-700" : project.health < 90 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>Health {project.health}%</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-4">
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">Progress: {project.progress}%</div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">Critical: {project.critical}</div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">Overdue: {project.overdue}</div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">SLA: {project.slaBreaches}</div>
                </div>
              </div>
            ))}
            {(summary?.projectHealth ?? []).length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">No project records available yet.</div>}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-base font-extrabold"><AlertTriangle className="h-5 w-5 text-amber-600" /> Top SLA breaches</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-5">
            {(summary?.slaBreaches ?? []).slice(0, 8).map((row: any) => (
              <div key={`${row.projectId}-${row.tag}`} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-3"><div><div className="font-extrabold text-amber-950">{row.tag}</div><div className="mt-1 text-xs font-semibold text-amber-800">{row.projectId} · {row.phase} · {row.priority}</div></div><Badge className="bg-white text-amber-700">+{row.breachHours}h</Badge></div>
                <div className="mt-2 text-xs leading-5 text-amber-800">Open {row.hoursOpen}h / target {row.targetHours}h · Owner {row.owner ?? "Unassigned"}</div>
              </div>
            ))}
            {(summary?.slaBreaches ?? []).length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">No SLA breaches based on current rules.</div>}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm xl:col-span-1">
          <CardHeader className="border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-base font-extrabold"><CalendarDays className="h-5 w-5 text-blue-600" /> Daily progress report</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Date</Label><Input type="date" value={report.reportDate} onChange={e => setReport({ ...report, reportDate: e.target.value })} /></div><div className="space-y-2"><Label>Shift</Label><Input value={report.shiftName} onChange={e => setReport({ ...report, shiftName: e.target.value })} /></div></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Area</Label><Input value={report.areaCode} onChange={e => setReport({ ...report, areaCode: e.target.value })} placeholder="SHGP" /></div><div className="space-y-2"><Label>Project ID</Label><Input value={report.projectId} onChange={e => setReport({ ...report, projectId: e.target.value })} placeholder="PRJ-1041" /></div></div>
            <div className="grid gap-3 sm:grid-cols-3"><div className="space-y-2"><Label>Completed</Label><Input type="number" value={report.completedCount} onChange={e => setReport({ ...report, completedCount: Number(e.target.value) })} /></div><div className="space-y-2"><Label>In progress</Label><Input type="number" value={report.inProgressCount} onChange={e => setReport({ ...report, inProgressCount: Number(e.target.value) })} /></div><div className="space-y-2"><Label>Overdue</Label><Input type="number" value={report.overdueCount} onChange={e => setReport({ ...report, overdueCount: Number(e.target.value) })} /></div></div>
            <div className="space-y-2"><Label>Progress summary</Label><Textarea rows={4} value={report.progressSummary} onChange={e => setReport({ ...report, progressSummary: e.target.value })} placeholder="Summarize completed work, blockers, and current execution condition." /></div>
            <div className="space-y-2"><Label>Safety highlights</Label><Textarea rows={3} value={report.safetyHighlights} onChange={e => setReport({ ...report, safetyHighlights: e.target.value })} /></div>
            <div className="space-y-2"><Label>Next plan</Label><Textarea rows={3} value={report.nextPlan} onChange={e => setReport({ ...report, nextPlan: e.target.value })} /></div>
            <Button type="button" className="w-full rounded-2xl" onClick={submitDailyReport} disabled={createReport.isPending}><Save className="h-4 w-4" /> Save report</Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm xl:col-span-1">
          <CardHeader className="border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-base font-extrabold"><UsersRound className="h-5 w-5 text-emerald-600" /> Resource planning</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Type</Label><Select value={resource.resourceType} onValueChange={resourceType => setResource({ ...resource, resourceType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Manpower", "Equipment", "Material", "Inspection", "Safety", "Support"].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Status</Label><Select value={resource.status} onValueChange={status => setResource({ ...resource, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Planned", "Available", "At Risk", "Shortage", "Delayed", "Closed"].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="space-y-2"><Label>Resource name</Label><Input value={resource.resourceName} onChange={e => setResource({ ...resource, resourceName: e.target.value })} placeholder="QC Inspector / Torque wrench / gasket kit" /></div>
            <div className="grid gap-3 sm:grid-cols-3"><div className="space-y-2"><Label>Required</Label><Input type="number" value={resource.requiredQty} onChange={e => setResource({ ...resource, requiredQty: Number(e.target.value) })} /></div><div className="space-y-2"><Label>Available</Label><Input type="number" value={resource.availableQty} onChange={e => setResource({ ...resource, availableQty: Number(e.target.value) })} /></div><div className="space-y-2"><Label>Unit</Label><Input value={resource.unit} onChange={e => setResource({ ...resource, unit: e.target.value })} /></div></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Project ID</Label><Input value={resource.projectId} onChange={e => setResource({ ...resource, projectId: e.target.value })} /></div><div className="space-y-2"><Label>Need date</Label><Input type="date" value={resource.needDate} onChange={e => setResource({ ...resource, needDate: e.target.value })} /></div></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea rows={4} value={resource.notes} onChange={e => setResource({ ...resource, notes: e.target.value })} /></div>
            <Button type="button" className="w-full rounded-2xl" onClick={submitResource} disabled={createResource.isPending}><Save className="h-4 w-4" /> Save resource plan</Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm xl:col-span-1">
          <CardHeader className="border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-base font-extrabold"><TimerReset className="h-5 w-5 text-purple-600" /> SLA rule</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Phase</Label><Select value={sla.phase} onValueChange={phase => setSla({ ...sla, phase })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Priority</Label><Select value={sla.priority} onValueChange={priority => setSla({ ...sla, priority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All", "Low", "Normal", "High", "Critical"].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Target hours</Label><Input type="number" value={sla.targetHours} onChange={e => setSla({ ...sla, targetHours: Number(e.target.value) })} /></div><div className="space-y-2"><Label>Escalate after</Label><Input type="number" value={sla.escalationAfterHours} onChange={e => setSla({ ...sla, escalationAfterHours: Number(e.target.value) })} /></div></div>
            <div className="space-y-2"><Label>Escalation role</Label><Input value={sla.escalationRole} onChange={e => setSla({ ...sla, escalationRole: e.target.value })} /></div>
            <Button type="button" className="w-full rounded-2xl" onClick={submitSla} disabled={upsertSla.isPending}><Save className="h-4 w-4" /> Save SLA rule</Button>
            <div className="space-y-2 pt-2">
              {slaRules.slice(0, 6).map((rule: any) => <div key={`${rule.phase}-${rule.priority}-${rule.id}`} className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{rule.phase} · {rule.priority}: {rule.targetHours}h</div>)}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm"><CardHeader className="border-b border-slate-100"><CardTitle className="text-base font-extrabold">Recent daily reports</CardTitle></CardHeader><CardContent className="space-y-3 p-5">{reports.map((item: any) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-extrabold text-slate-950">{item.shiftName} · {item.reportDate}</div><div className="mt-1 text-xs font-semibold text-slate-500">{item.projectId ?? item.areaCode ?? "Plant-wide"}</div></div><Badge variant="outline">Overdue {item.overdueCount}</Badge></div><p className="mt-3 text-sm leading-6 text-slate-600">{item.progressSummary}</p></div>)}</CardContent></Card>
        <Card className="border-slate-200 bg-white shadow-sm"><CardHeader className="border-b border-slate-100"><CardTitle className="text-base font-extrabold">Resource gaps</CardTitle></CardHeader><CardContent className="space-y-3 p-5">{resourceRows.slice(0, 12).map((item: any) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-extrabold text-slate-950">{item.resourceName}</div><div className="mt-1 text-xs font-semibold text-slate-500">{item.resourceType} · {item.projectId ?? item.areaCode ?? "Plant-wide"}</div></div><Badge className={item.gapQty > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>Gap {item.gapQty}</Badge></div><div className="mt-3 text-xs font-bold text-slate-600">Required {item.requiredQty} / Available {item.availableQty} {item.unit}</div></div>)}</CardContent></Card>
      </section>
    </div>
  );
}
