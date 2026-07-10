import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AlertTriangle, ClipboardCheck, Link2, LockKeyhole, QrCode, RefreshCw, ShieldAlert, Smartphone, TimerReset } from "lucide-react";
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
type RiskLevel = "Low" | "Medium" | "High" | "Critical";

type HazardItem = {
  key: string;
  label: string;
  severity: RiskLevel;
  selected: boolean;
  note?: string | null;
};

type ControlItem = {
  key: string;
  label: string;
  required?: boolean;
  applied: boolean;
  note?: string | null;
};

const phases: BlindPhase[] = ["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"];
const riskLevels: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
const energySourceOptions = ["Pressure", "Electrical", "Pneumatic", "Hydraulic", "Thermal", "Chemical", "Mechanical"];

function Metric({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub: string; icon: React.ElementType }) {
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

export default function FieldExecutionCenter() {
  const utils = trpc.useUtils();
  const [projectId, setProjectId] = useState("");
  const [blindTag, setBlindTag] = useState("");
  const [phase, setPhase] = useState<BlindPhase>("Broken / Preparation");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Medium");
  const [residualRisk, setResidualRisk] = useState<RiskLevel>("Medium");
  const [assessorName, setAssessorName] = useState("");
  const [ptwNumber, setPtwNumber] = useState("");
  const [lotoNumber, setLotoNumber] = useState("");
  const [permitStatus, setPermitStatus] = useState("Pending");
  const [isolationStatus, setIsolationStatus] = useState("Not verified");
  const [gasTestRequired, setGasTestRequired] = useState(false);
  const [gasTestResult, setGasTestResult] = useState("");
  const [verifierName, setVerifierName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [energySources, setEnergySources] = useState<string[]>(["Pressure"]);

  const defaultRiskModel = trpc.fieldCompliance.defaultRiskModel.useQuery(undefined, { refetchOnWindowFocus: false });
  const summaryQuery = trpc.fieldCompliance.summary.useQuery({ days: 30 }, { refetchOnWindowFocus: false });
  const blindComplianceQuery = trpc.fieldCompliance.blind.useQuery(
    { projectId, blindTag },
    { enabled: projectId.trim().length > 1 && blindTag.trim().length > 1, refetchOnWindowFocus: false }
  );

  const [hazards, setHazards] = useState<HazardItem[]>([]);
  const [controls, setControls] = useState<ControlItem[]>([]);

  useEffect(() => {
    if (!hazards.length && defaultRiskModel.data?.hazards?.length) setHazards(defaultRiskModel.data.hazards as HazardItem[]);
    if (!controls.length && defaultRiskModel.data?.controls?.length) setControls(defaultRiskModel.data.controls as ControlItem[]);
  }, [defaultRiskModel.data, hazards.length, controls.length]);

  const createQrMutation = trpc.fieldCompliance.createQrToken.useMutation({
    onSuccess: async () => {
      toast.success("QR field verification token generated.");
      await blindComplianceQuery.refetch();
      await utils.fieldCompliance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const saveRiskMutation = trpc.fieldCompliance.saveRiskAssessment.useMutation({
    onSuccess: async () => {
      toast.success("Risk assessment saved.");
      await blindComplianceQuery.refetch();
      await utils.fieldCompliance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const addPtwMutation = trpc.fieldCompliance.addPtwLoto.useMutation({
    onSuccess: async () => {
      toast.success("PTW / LOTO record added.");
      await blindComplianceQuery.refetch();
      await utils.fieldCompliance.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const compliance = blindComplianceQuery.data;
  const selectedReady = projectId.trim().length > 1 && blindTag.trim().length > 1;
  const latestToken = compliance?.qrTokens?.[0];
  const fieldQrUrl = latestToken ? `${window.location.origin}/qr/blind/${latestToken.token}` : "";
  const selectedHazards = hazards.filter(item => item.selected).length;
  const appliedControls = controls.filter(item => item.applied).length;

  function toggleEnergySource(source: string) {
    setEnergySources(current => current.includes(source) ? current.filter(item => item !== source) : [...current, source]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mobile field execution"
        title="QR, PTW / LOTO & Risk Assessment"
        description="v2.1 field layer for QR verification, mobile-ready execution, permit-to-work, LOTO, energy sources, and phase risk controls."
        actions={<Button type="button" variant="outline" className="rounded-2xl bg-white" onClick={() => { summaryQuery.refetch(); blindComplianceQuery.refetch(); }}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active QR tokens" value={summaryQuery.data?.counts.activeQrTokens ?? 0} sub="Field verification access" icon={QrCode} />
        <Metric label="Risk assessments" value={summaryQuery.data?.counts.riskAssessments ?? 0} sub="Latest sampled records" icon={ShieldAlert} />
        <Metric label="PTW / LOTO active" value={summaryQuery.data?.counts.activePtwLoto ?? 0} sub="Permit and isolation records" icon={LockKeyhole} />
        <Metric label="Expiring blinds" value={summaryQuery.data?.counts.expiring ?? 0} sub="30-day expiry window" icon={TimerReset} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-extrabold text-slate-950 dark:text-white">Field target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Project ID</Label><Input value={projectId} onChange={event => setProjectId(event.target.value)} placeholder="PRJ-1041" /></div>
              <div className="space-y-2"><Label>Blind Tag</Label><Input value={blindTag} onChange={event => setBlindTag(event.target.value)} placeholder="BLD-1401" /></div>
            </div>
            <div className="space-y-2">
              <Label>Phase</Label>
              <Select value={phase} onValueChange={value => setPhase(value as BlindPhase)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{phases.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-1 h-5 w-5 text-cyan-700" />
                <div>
                  <div className="font-extrabold text-slate-950 dark:text-white">Mobile field rule</div>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">Use this page from tablet/mobile to create the field token and register PTW, LOTO, and risk status before phase execution.</p>
                </div>
              </div>
            </div>
            {!selectedReady && <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800 ring-1 ring-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" /> Enter Project ID and Blind Tag to enable field actions.</div>}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800"><CardTitle className="text-base font-extrabold text-slate-950 dark:text-white">QR field verification</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-extrabold text-slate-950 dark:text-white">Generate or rotate token</div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Token opens a read-only mobile verification page for field crews.</p>
                </div>
                <Button disabled={!selectedReady || createQrMutation.isPending} onClick={() => createQrMutation.mutate({ projectId, blindTag, expiresAt: expiresAt || undefined })} className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"><QrCode className="h-4 w-4" /> Generate QR token</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2"><Label>Optional token expiry</Label><Input type="datetime-local" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} /></div>
                {fieldQrUrl && <Link href={fieldQrUrl.replace(window.location.origin, "")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-extrabold text-cyan-800"><Link2 className="h-4 w-4" /> Open QR page</Link>}
              </div>
              {latestToken && <div className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-6 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">Token: {latestToken.token}<br />Scans: {latestToken.scanCount ?? 0}<br />URL: {fieldQrUrl}</div>}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800"><CardTitle className="text-base font-extrabold text-slate-950 dark:text-white">PTW / LOTO control</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>PTW number</Label><Input value={ptwNumber} onChange={event => setPtwNumber(event.target.value)} placeholder="PTW-2026-001" /></div>
                <div className="space-y-2"><Label>LOTO number</Label><Input value={lotoNumber} onChange={event => setLotoNumber(event.target.value)} placeholder="LOTO-2026-001" /></div>
                <div className="space-y-2"><Label>Permit status</Label><Select value={permitStatus} onValueChange={setPermitStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Pending", "Active", "Closed", "Suspended"].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Isolation status</Label><Select value={isolationStatus} onValueChange={setIsolationStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Not verified", "Verified", "Rejected", "Expired"].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Gas test result</Label><Input value={gasTestResult} onChange={event => setGasTestResult(event.target.value)} placeholder="LEL 0% / O2 20.9" /></div>
                <div className="space-y-2"><Label>Verifier</Label><Input value={verifierName} onChange={event => setVerifierName(event.target.value)} placeholder="Supervisor / Safety" /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {energySourceOptions.map(source => <button type="button" key={source} onClick={() => toggleEnergySource(source)} className={`rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 ${energySources.includes(source) ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-600 ring-slate-200"}`}>{source}</button>)}
              </div>
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800"><Checkbox checked={gasTestRequired} onCheckedChange={value => setGasTestRequired(Boolean(value))} /> Gas test required before work</label>
              <Button disabled={!selectedReady || addPtwMutation.isPending} onClick={() => addPtwMutation.mutate({ projectId, blindTag, phase, ptwNumber, lotoNumber, permitStatus: permitStatus as any, isolationStatus: isolationStatus as any, energySources, gasTestRequired, gasTestResult, verifierName, expiresAt: expiresAt || undefined })} className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"><LockKeyhole className="h-4 w-4" /> Save PTW / LOTO</Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800"><CardTitle className="text-base font-extrabold text-slate-950 dark:text-white">Risk assessment</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label>Initial risk</Label><Select value={riskLevel} onValueChange={value => setRiskLevel(value as RiskLevel)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{riskLevels.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Residual risk</Label><Select value={residualRisk} onValueChange={value => setResidualRisk(value as RiskLevel)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{riskLevels.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Assessor</Label><Input value={assessorName} onChange={event => setAssessorName(event.target.value)} placeholder="Assessor name" /></div>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="mb-3 text-sm font-extrabold text-slate-950 dark:text-white">Hazards selected: {selectedHazards}</div>{hazards.map((item, index) => <label key={item.key} className="mb-2 flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-300"><Checkbox checked={item.selected} onCheckedChange={value => setHazards(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, selected: Boolean(value) } : row))} /><span>{item.label}<Badge variant="outline" className="ml-2">{item.severity}</Badge></span></label>)}</div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="mb-3 text-sm font-extrabold text-slate-950 dark:text-white">Controls applied: {appliedControls}</div>{controls.map((item, index) => <label key={item.key} className="mb-2 flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-300"><Checkbox checked={item.applied} onCheckedChange={value => setControls(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, applied: Boolean(value) } : row))} /><span>{item.label}{item.required !== false && <Badge className="ml-2 bg-amber-100 text-amber-700 hover:bg-amber-100">Required</Badge>}</span></label>)}</div>
              </div>
              <Textarea value={`Risk: ${riskLevel} → Residual: ${residualRisk}. Hazards: ${selectedHazards}. Controls: ${appliedControls}.`} readOnly className="min-h-20 bg-slate-50 text-sm font-semibold" />
              <Button disabled={!selectedReady || saveRiskMutation.isPending} onClick={() => saveRiskMutation.mutate({ projectId, blindTag, phase, riskLevel, residualRisk, assessorName, hazards, controls, status: residualRisk === "Low" || residualRisk === "Medium" ? "reviewed" : "draft" })} className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"><ClipboardCheck className="h-4 w-4" /> Save risk assessment</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
