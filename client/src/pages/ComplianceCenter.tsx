/*
Design Philosophy: Industrial Field Compliance.
The compliance center converts SBTS from a status tracker into an inspection-ready field execution workspace.
*/
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type BlindPhase = "Broken / Preparation" | "Assembly" | "Tight & Torque" | "Final Tight" | "Inspection Ready";
type ChecklistItem = { key: string; label: string; required?: boolean; checked: boolean; note?: string | null };

const phaseOptions: BlindPhase[] = ["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"];
const inspectionTypes = ["NDE", "MTR", "GASKET", "LEAK_TEST", "PUNCH_LIST", "GENERAL"] as const;

function MetricCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub: string; icon: any }) {
  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">{value}</div>
            <div className="mt-1 text-xs font-semibold text-slate-500">{sub}</div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComplianceCenter() {
  const utils = trpc.useUtils();
  const [days, setDays] = useState(30);
  const [projectId, setProjectId] = useState("");
  const [blindTag, setBlindTag] = useState("");
  const [phase, setPhase] = useState<BlindPhase>("Broken / Preparation");
  const [caption, setCaption] = useState("");
  const [filePayload, setFilePayload] = useState<{ fileName: string; mimeType: string; dataUrl: string } | null>(null);
  const [torqueValue, setTorqueValue] = useState("");
  const [torqueUnit, setTorqueUnit] = useState("Nm");
  const [toolId, setToolId] = useState("");
  const [inspectionType, setInspectionType] = useState<(typeof inspectionTypes)[number]>("NDE");
  const [inspectionReference, setInspectionReference] = useState("");
  const [inspectionResult, setInspectionResult] = useState("Pending");
  const [inspectionDescription, setInspectionDescription] = useState("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const summaryQuery = trpc.fieldCompliance.summary.useQuery({ days }, { refetchOnWindowFocus: false });
  const defaultChecklistQuery = trpc.fieldCompliance.defaultChecklist.useQuery(undefined, { refetchOnWindowFocus: false });
  const blindComplianceQuery = trpc.fieldCompliance.blind.useQuery(
    { projectId, blindTag },
    { enabled: projectId.trim().length > 1 && blindTag.trim().length > 1, refetchOnWindowFocus: false }
  );

  const saveChecklistMutation = trpc.fieldCompliance.saveChecklist.useMutation({
    onSuccess: async () => {
      toast.success("Safety checklist saved.");
      await blindComplianceQuery.refetch();
      await utils.fieldCompliance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const addEvidenceMutation = trpc.fieldCompliance.addEvidence.useMutation({
    onSuccess: async () => {
      toast.success("Evidence attached.");
      setCaption("");
      setFilePayload(null);
      await blindComplianceQuery.refetch();
      await utils.fieldCompliance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const addTorqueMutation = trpc.fieldCompliance.addTorque.useMutation({
    onSuccess: async () => {
      toast.success("Torque record added.");
      setTorqueValue("");
      setToolId("");
      await blindComplianceQuery.refetch();
      await utils.fieldCompliance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const addInspectionMutation = trpc.fieldCompliance.addInspection.useMutation({
    onSuccess: async () => {
      toast.success("Inspection record added.");
      setInspectionReference("");
      setInspectionDescription("");
      await blindComplianceQuery.refetch();
      await utils.fieldCompliance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    const existing = blindComplianceQuery.data?.checklists?.find((item: any) => item.phase === phase);
    if (existing?.items?.length) {
      setChecklistItems(existing.items);
      return;
    }
    if (defaultChecklistQuery.data?.length) setChecklistItems(defaultChecklistQuery.data as ChecklistItem[]);
  }, [phase, blindComplianceQuery.data?.checklists, defaultChecklistQuery.data]);

  const summary = summaryQuery.data;
  const compliance = blindComplianceQuery.data;
  const selectedReady = projectId.trim().length > 1 && blindTag.trim().length > 1;
  const checklistCompletion = useMemo(() => {
    const required = checklistItems.filter(item => item.required !== false);
    if (!required.length) return 0;
    return Math.round((required.filter(item => item.checked).length / required.length) * 100);
  }, [checklistItems]);

  const refreshAll = () => {
    summaryQuery.refetch();
    blindComplianceQuery.refetch();
  };

  const onEvidenceFile = (file: File | undefined) => {
    if (!file) {
      setFilePayload(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Pilot evidence upload limit is 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFilePayload({ fileName: file.name, mimeType: file.type || "application/octet-stream", dataUrl: String(reader.result ?? "") });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Industrial compliance"
        title="Field Compliance Center"
        description="Manage blind expiry, phase safety checklists, photo evidence, torque records, NDE/MTR/gasket/leak-test records, and inspection readiness from one professional workspace."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
              <Link href="/field"><Wrench className="h-4 w-4" /> Open Field Mobile</Link>
            </Button>
            <Button type="button" variant="outline" className="rounded-2xl bg-white" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Expiring blinds" value={summary?.counts.expiring ?? 0} sub={`Within ${days} days`} icon={TimerReset} />
        <MetricCard label="Expired" value={summary?.counts.expired ?? 0} sub="Requires immediate review" icon={AlertTriangle} />
        <MetricCard label="Completed checklists" value={summary?.counts.completedChecklists ?? 0} sub="Safety checklist records" icon={ClipboardCheck} />
        <MetricCard label="Torque records" value={summary?.counts.torqueRecords ?? 0} sub="Bolting traceability" icon={Gauge} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-extrabold text-slate-950 dark:text-white">Blind expiry watch</CardTitle>
              <Select value={String(days)} onValueChange={value => setDays(Number(value))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[7, 14, 30, 60, 90].map(value => <SelectItem key={value} value={String(value)}>{value} days</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {(summary?.expiring ?? []).length > 0 ? summary?.expiring.map((row: any) => (
                <Link key={`${row.projectId}-${row.tag}`} href={`/projects/${row.projectId}/blinds/${encodeURIComponent(row.tag)}`} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-slate-950 dark:text-white">{row.tag}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">{row.projectName} · {row.type} · {row.size}</div>
                    </div>
                    <Badge className={row.daysRemaining < 0 ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                      {row.daysRemaining < 0 ? `${Math.abs(row.daysRemaining)} days overdue` : `${row.daysRemaining} days left`}
                    </Badge>
                  </div>
                </Link>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-800">
                  No expiry records found within the selected window. Add expiry dates to blind records to activate this watch list.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-extrabold text-slate-950 dark:text-white">Field compliance workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Project ID</Label>
                <Input value={projectId} onChange={event => setProjectId(event.target.value)} placeholder="PRJ-1041" />
              </div>
              <div className="space-y-2">
                <Label>Blind tag</Label>
                <Input value={blindTag} onChange={event => setBlindTag(event.target.value)} placeholder="BLD-1339" />
              </div>
              <div className="space-y-2">
                <Label>Phase</Label>
                <Select value={phase} onValueChange={value => setPhase(value as BlindPhase)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{phaseOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {!selectedReady && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500 dark:border-slate-800">
                Enter a project ID and blind tag to load compliance records and submit field data.
              </div>
            )}

            {selectedReady && (
              <div className="grid gap-5">
                <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-slate-950 dark:text-white">Safety checklist</div>
                      <div className="text-xs font-semibold text-slate-500">{checklistCompletion}% required items complete</div>
                    </div>
                    <Badge variant="outline">{phase}</Badge>
                  </div>
                  <div className="space-y-2">
                    {checklistItems.map((item, index) => (
                      <label key={item.key} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                        <Checkbox checked={item.checked} onCheckedChange={checked => setChecklistItems(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, checked: Boolean(checked) } : row))} />
                        <span className="text-sm font-semibold leading-5 text-slate-700 dark:text-slate-300">{item.label}{item.required !== false && <span className="ml-1 text-red-500">*</span>}</span>
                      </label>
                    ))}
                  </div>
                  <Button type="button" className="mt-4 rounded-2xl" disabled={saveChecklistMutation.isPending} onClick={() => saveChecklistMutation.mutate({ projectId, blindTag, phase, items: checklistItems })}>
                    <ShieldCheck className="h-4 w-4" /> Save checklist
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="mb-3 font-extrabold text-slate-950 dark:text-white">Photo / document evidence</div>
                    <div className="space-y-3">
                      <Input type="file" accept="image/*,.pdf" onChange={event => onEvidenceFile(event.target.files?.[0])} />
                      <Textarea value={caption} onChange={event => setCaption(event.target.value)} placeholder="Evidence caption / field note" />
                      <Button type="button" variant="outline" disabled={addEvidenceMutation.isPending} onClick={() => addEvidenceMutation.mutate({ projectId, blindTag, phase, evidenceType: "photo", caption: caption || null, fileName: filePayload?.fileName ?? null, mimeType: filePayload?.mimeType ?? null, dataUrl: filePayload?.dataUrl ?? null })}>
                        <Camera className="h-4 w-4" /> Attach evidence
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="mb-3 font-extrabold text-slate-950 dark:text-white">Torque record</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input value={torqueValue} onChange={event => setTorqueValue(event.target.value)} placeholder="Torque" />
                      <Input value={torqueUnit} onChange={event => setTorqueUnit(event.target.value)} placeholder="Unit" />
                      <Input value={toolId} onChange={event => setToolId(event.target.value)} placeholder="Tool ID" />
                    </div>
                    <Button type="button" className="mt-3 rounded-2xl" disabled={!torqueValue || addTorqueMutation.isPending} onClick={() => addTorqueMutation.mutate({ projectId, blindTag, phase: "Tight & Torque", torqueValue, torqueUnit, toolId: toolId || null })}>
                      <Wrench className="h-4 w-4" /> Add torque
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 font-extrabold text-slate-950 dark:text-white">Inspection package record</div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Select value={inspectionType} onValueChange={value => setInspectionType(value as typeof inspectionTypes[number])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{inspectionTypes.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input value={inspectionReference} onChange={event => setInspectionReference(event.target.value)} placeholder="Reference no." />
                    <Input value={inspectionResult} onChange={event => setInspectionResult(event.target.value)} placeholder="Result" />
                    <Button type="button" disabled={addInspectionMutation.isPending} onClick={() => addInspectionMutation.mutate({ projectId, blindTag, recordType: inspectionType, referenceNo: inspectionReference || null, result: inspectionResult || null, description: inspectionDescription || null })}>
                      <CheckCircle2 className="h-4 w-4" /> Add record
                    </Button>
                  </div>
                  <Textarea className="mt-3" value={inspectionDescription} onChange={event => setInspectionDescription(event.target.value)} placeholder="Inspection description, MTR details, gasket batch, leak test notes, punch list item..." />
                </div>

                {compliance && (
                  <div className="grid gap-3 md:grid-cols-4">
                    <MetricCard label="Evidence" value={compliance.counts.evidence} sub="Attached records" icon={Camera} />
                    <MetricCard label="Checklists" value={compliance.counts.completedChecklists} sub="Completed phases" icon={ClipboardCheck} />
                    <MetricCard label="Torque" value={compliance.counts.torqueRecords} sub="Bolting records" icon={Gauge} />
                    <MetricCard label="Inspection" value={compliance.counts.inspectionRecords} sub="Package records" icon={CheckCircle2} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
