/*
Design Philosophy: Blind Detail Hub Full Integration.
A single operational cockpit for one blind: Overview → Workflow → Compliance → Field Actions → QR & Mobile → Certificate & History.
*/
import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  History,
  KeyRound,
  Loader2,
  LockKeyhole,
  MapPin,
  Printer,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type HubTab = "overview" | "workflow" | "compliance" | "field" | "qr" | "certificate";

const phaseOrder = ["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"];

const tabs: Array<{ key: HubTab; label: string; icon: ElementType; setting: string }> = [
  { key: "overview", label: "Overview", icon: FileText, setting: "showOverviewTab" },
  { key: "workflow", label: "Workflow", icon: Workflow, setting: "showWorkflowTab" },
  { key: "compliance", label: "Compliance", icon: ShieldCheck, setting: "showComplianceTab" },
  { key: "field", label: "Field Actions", icon: Wrench, setting: "showFieldActionsTab" },
  { key: "qr", label: "QR & Mobile", icon: Smartphone, setting: "showQrMobileTab" },
  { key: "certificate", label: "Certificate & History", icon: FileCheck2, setting: "showCertificateHistoryTab" },
];

function fmtDate(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

function initials(name: string | null | undefined) {
  const tokens = (name ?? "SBTS").split(/\s+/).filter(Boolean);
  return tokens.slice(0, 2).map((token) => token[0]).join("").toUpperCase();
}

function SpecRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid grid-cols-[150px_1fr] border-b border-cyan-500/10 text-sm last:border-b-0">
      <div className="bg-white/5 px-4 py-3 font-semibold text-slate-400">{label}</div>
      <div className="px-4 py-3 font-bold text-slate-100">{String(value || "—")}</div>
    </div>
  );
}

function HubCard({ title, icon: Icon, children, action }: { title: string; icon: ElementType; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-cyan-400/15 bg-slate-900/75 shadow-[0_24px_80px_rgba(8,47,73,0.24)] backdrop-blur">
      <div className="flex items-center justify-between gap-4 border-b border-cyan-400/10 px-5 py-4">
        <h3 className="flex items-center gap-3 text-lg font-extrabold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
            <Icon className="h-5 w-5" />
          </span>
          {title}
        </h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatusPill({ label, tone = "cyan" }: { label: string; tone?: "cyan" | "green" | "amber" | "red" | "purple" | "slate" }) {
  const tones = {
    cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
    green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    red: "border-red-400/30 bg-red-400/10 text-red-200",
    purple: "border-purple-400/30 bg-purple-400/10 text-purple-200",
    slate: "border-slate-500/30 bg-slate-500/10 text-slate-200",
  };
  return <span className={`inline-flex rounded-2xl border px-3 py-1.5 text-xs font-extrabold ${tones[tone]}`}>{label}</span>;
}

function OverviewTab({ hub, setActiveTab }: { hub: any; setActiveTab: (tab: HubTab) => void }) {
  const blind = hub.blind;
  const project = hub.project;
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <HubCard title="Specifications" icon={ClipboardCheck}>
        <div className="overflow-hidden rounded-2xl border border-cyan-400/10">
          <SpecRow label="Flange Type" value={blind.flangeType} />
          <SpecRow label="Gasket Type" value={blind.gasketType} />
          <SpecRow label="Bolt Size" value={blind.boltSize} />
          <SpecRow label="Torque Value" value={blind.torqueValue} />
          <SpecRow label="Thickness" value={blind.thickness} />
          <SpecRow label="Temp Rating" value={blind.temperatureRating} />
          <SpecRow label="P&ID Ref" value={blind.pidReference} />
          <SpecRow label="ISO Drawing" value={blind.isoDrawingNumber} />
          <SpecRow label="Installation Date" value={fmtDate(blind.installationDate)} />
          <SpecRow label="Expiry Date" value={fmtDate(blind.expiryDate)} />
        </div>
      </HubCard>

      <HubCard title="Location & Context" icon={MapPin}>
        <div className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <SpecRow label="Project" value={project.name} />
            <SpecRow label="Area" value={project.areaName || project.areaCode} />
            <SpecRow label="Equipment" value={blind.equipment} />
            <SpecRow label="Location" value={blind.location} />
            <SpecRow label="Isolation Point" value={blind.isolationPoint} />
            <SpecRow label="Line / Rate" value={blind.rate} />
          </div>
          <div className="mt-5 rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-slate-950 to-cyan-950/30 p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">From process line</span>
              <StatusPill label={blind.tag} tone="cyan" />
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">To equipment</span>
            </div>
            <div className="my-6 h-1 rounded-full bg-gradient-to-r from-slate-500 via-cyan-300 to-slate-500" />
            <div className="text-center text-sm font-bold text-slate-300">
              {blind.equipment || "Equipment"} · {blind.isolationPoint || "Isolation point"}
            </div>
          </div>
        </div>
      </HubCard>

      <section className="xl:col-span-2 rounded-3xl border border-cyan-400/15 bg-slate-900/75 p-5">
        <h3 className="mb-4 text-lg font-extrabold text-white">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Advance Phase", Workflow, "workflow"],
            ["Upload Evidence", UploadCloud, "compliance"],
            ["Start Checklist", ClipboardCheck, "compliance"],
            ["Open Field Actions", Wrench, "field"],
            ["Generate QR", QrCode, "qr"],
            ["Print Certificate", Printer, "certificate"],
          ].map(([label, Icon, target]) => (
            <button
              key={String(label)}
              type="button"
              onClick={() => setActiveTab(target as HubTab)}
              className="group rounded-3xl border border-cyan-400/15 bg-cyan-400/5 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-400/10"
            >
              <Icon className="h-7 w-7 text-cyan-300 transition group-hover:scale-110" />
              <div className="mt-4 text-base font-extrabold text-white">{String(label)}</div>
              <div className="mt-1 text-xs text-slate-400">Open {String(target)} tab</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function WorkflowTab({ hub }: { hub: any }) {
  return (
    <div className="space-y-5">
      <HubCard title="Workflow Pipeline" icon={Workflow}>
        <div className="grid gap-4 xl:grid-cols-5">
          {hub.workflow.phases.map((phase: any, index: number) => (
            <div key={phase.phase} className={`rounded-3xl border p-5 ${phase.status === "current" ? "border-cyan-300/70 bg-cyan-400/10" : phase.status === "completed" ? "border-emerald-400/40 bg-emerald-400/10" : "border-slate-600/40 bg-slate-800/50"}`}>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-lg font-extrabold text-cyan-200 ring-1 ring-cyan-400/20">{index + 1}</span>
                <StatusPill label={phase.status} tone={phase.status === "completed" ? "green" : phase.status === "current" ? "cyan" : "slate"} />
              </div>
              <div className="mt-4 text-base font-extrabold text-white">{phase.phase}</div>
              <div className="mt-2 text-sm text-slate-400">{phase.owners?.[0]?.name ?? "No owner assigned"}</div>
              <div className="mt-4 text-xs text-slate-500">Approval: {phase.approval?.approved ? "Approved" : phase.canApprove ? "Pending" : "Waiting"}</div>
            </div>
          ))}
        </div>
      </HubCard>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <HubCard title={`Current Phase: ${hub.workflow.currentPhase}`} icon={Zap}>
          <div className="space-y-4">
            <Progress value={hub.workflow.progress} className="h-3 bg-slate-800" />
            <div className="text-3xl font-extrabold text-cyan-300">{hub.workflow.progress}%</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Blind positioned correctly", "Gasket inspected", "Bolts hand-tight", "Foreman visual check"].map((item, index) => (
                <label key={item} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 text-sm font-semibold text-slate-300">
                  <Checkbox checked={index < 2} disabled />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </HubCard>
        <HubCard title="Phase Transition Log" icon={History}>
          <div className="overflow-hidden rounded-2xl border border-cyan-400/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">From</th><th className="p-3 text-left">To</th><th className="p-3 text-left">By</th><th className="p-3 text-left">Notes</th></tr>
              </thead>
              <tbody>
                {hub.workflow.logs.map((log: any, index: number) => (
                  <tr key={index} className="border-t border-cyan-400/10 text-slate-300">
                    <td className="p-3">{fmtDate(log.createdAt)}</td>
                    <td className="p-3">{log.fromPhase || "-"}</td>
                    <td className="p-3">{log.toPhase || log.newPhase || "-"}</td>
                    <td className="p-3">{log.actorName || log.changedBy || "System"}</td>
                    <td className="p-3">{log.note || log.notes || "Workflow update"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HubCard>
      </div>
    </div>
  );
}

function ComplianceTab({ hub }: { hub: any }) {
  const counts = hub.compliance.counts;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Checklist Progress", `${counts.completedChecklists} completed`, ClipboardCheck, "green"],
          ["Torque Records", counts.torqueRecords, Zap, "cyan"],
          ["Inspections", counts.inspectionRecords, ShieldCheck, "amber"],
          ["Evidence Files", counts.evidence, UploadCloud, "purple"],
        ].map(([label, value, Icon, tone]) => (
          <div key={String(label)} className="rounded-3xl border border-cyan-400/15 bg-slate-900/75 p-5">
            <Icon className="h-7 w-7 text-cyan-300" />
            <div className="mt-4 text-sm font-semibold text-slate-400">{String(label)}</div>
            <div className="mt-1 text-2xl font-extrabold text-white">{String(value)}</div>
            <StatusPill label={String(tone).toUpperCase()} tone={tone as any} />
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <HubCard title="Safety Checklist" icon={ClipboardCheck}>
          {hub.compliance.checklists.length ? hub.compliance.checklists.map((list: any) => (
            <div key={list.id} className="mb-4 rounded-2xl border border-cyan-400/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between"><b className="text-white">{list.phase}</b><StatusPill label={list.status} tone={list.status === "complete" ? "green" : "amber"} /></div>
              <div className="space-y-2">
                {list.items.map((item: any) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
                    <span>{item.label}</span>{item.checked ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-amber-300" />}
                  </div>
                ))}
              </div>
            </div>
          )) : <div className="rounded-2xl border border-dashed border-slate-600 p-8 text-center text-slate-400">No checklist has been completed yet.</div>}
        </HubCard>
        <HubCard title="Photo / Document Evidence" icon={UploadCloud}>
          <div className="grid gap-3 sm:grid-cols-2">
            {hub.compliance.evidence.slice(0, 6).map((file: any) => (
              <div key={file.id} className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-3">
                <div className="aspect-video rounded-xl bg-slate-950/70">
                  {file.dataUrl ? <img src={file.dataUrl} alt={file.caption || file.fileName || "Evidence"} className="h-full w-full rounded-xl object-cover" /> : <div className="flex h-full items-center justify-center text-purple-200">Evidence</div>}
                </div>
                <div className="mt-2 truncate text-sm font-bold text-white">{file.caption || file.fileName || "Evidence file"}</div>
                <div className="text-xs text-slate-400">{file.phase}</div>
              </div>
            ))}
          </div>
        </HubCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <HubCard title="Torque Records" icon={Zap}>
          <div className="space-y-2">
            {hub.compliance.torqueRecords.slice(0, 8).map((row: any) => (
              <div key={row.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                <span className="font-bold text-white">{row.boltNumber || row.boltTag || "Bolt"}</span>
                <span className="text-cyan-200">{row.actualTorque || row.torqueValue || "—"} / {row.targetTorque || "Target"}</span>
                <StatusPill label={row.status || "Recorded"} tone="green" />
              </div>
            ))}
          </div>
        </HubCard>
        <HubCard title="Inspection Records" icon={ShieldCheck}>
          <div className="space-y-2">
            {hub.compliance.inspectionRecords.slice(0, 8).map((row: any) => (
              <div key={row.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                <span className="font-bold text-white">{row.inspectionType}</span>
                <span className="text-slate-400">{row.inspectorName || row.createdByName || "Inspector"}</span>
                <StatusPill label={row.status || "Pending"} tone={(row.status || "").toLowerCase() === "pass" ? "green" : "amber"} />
              </div>
            ))}
          </div>
        </HubCard>
      </div>
    </div>
  );
}

function FieldActionsTab({ hub, onAddNote }: { hub: any; onAddNote: (note: string) => void }) {
  const [note, setNote] = useState("");
  const latestPtw = hub.compliance.ptwLotoRecords[0];
  const latestRisk = hub.compliance.riskAssessments[0];
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-amber-400/40 bg-amber-400/10 p-5 text-amber-100">
        <div className="flex items-center gap-3 text-lg font-extrabold"><AlertTriangle className="h-6 w-6" /> PTW / LOTO / Risk gates must be verified before field execution.</div>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <HubCard title="Permit to Work (PTW)" icon={FileText}>
          <SpecRow label="PTW Number" value={latestPtw?.ptwNumber} />
          <SpecRow label="Status" value={latestPtw?.permitStatus} />
          <SpecRow label="Issued" value={fmtDate(latestPtw?.issuedAt)} />
          <SpecRow label="Expires" value={fmtDate(latestPtw?.expiresAt)} />
          <SpecRow label="Energy" value={latestPtw?.energySources?.join?.(", ")} />
        </HubCard>
        <HubCard title="LOTO Status" icon={LockKeyhole}>
          <SpecRow label="Isolation ID" value={latestPtw?.isolationId} />
          <SpecRow label="Status" value={latestPtw?.isolationStatus} />
          <SpecRow label="Zero Energy" value={latestPtw?.zeroEnergyVerified ? "YES" : "NO"} />
          <SpecRow label="Verified By" value={latestPtw?.verifiedByName} />
        </HubCard>
        <HubCard title="Risk Assessment" icon={ShieldAlert}>
          <SpecRow label="Risk Level" value={latestRisk?.riskLevel} />
          <SpecRow label="Residual Risk" value={latestRisk?.residualRisk} />
          <SpecRow label="Hazards" value={latestRisk?.hazards?.length} />
          <SpecRow label="Controls" value={latestRisk?.controls?.filter?.((c: any) => c.applied)?.length} />
        </HubCard>
      </div>
      <HubCard title="Field Notes" icon={ClipboardCheck} action={<Button onClick={() => { onAddNote(note); setNote(""); }} disabled={!note.trim()} className="bg-amber-500 text-slate-950 hover:bg-amber-400">Submit Field Report</Button>}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Enter field notes, observations, or updates..." className="min-h-28 border-cyan-400/20 bg-slate-950 text-white" />
        <div className="mt-4 grid gap-3">
          {hub.fieldNotes.map((row: any) => (
            <div key={row.id} className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
              <div className="flex items-center justify-between"><b>{row.submittedByName || "Field user"}</b><span className="text-xs text-slate-500">{fmtDate(row.createdAt)}</span></div>
              <p className="mt-2">{row.note}</p>
            </div>
          ))}
        </div>
      </HubCard>
    </div>
  );
}

function QrMobileTab({ hub, onGenerateQr }: { hub: any; onGenerateQr: () => void }) {
  const activeToken = hub.qr.activeToken;
  const qrUrl = activeToken ? `${window.location.origin}/qr/blind/${activeToken.token}` : "";
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <HubCard title="QR Identity" icon={QrCode} action={<Button onClick={onGenerateQr} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">Generate QR</Button>}>
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-44 w-44 items-center justify-center rounded-3xl border border-cyan-400/20 bg-white p-4 text-slate-950">
            <QrCode className="h-32 w-32" />
          </div>
          <div className="w-full rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
            <div className="font-extrabold text-white">Public verification link</div>
            <div className="mt-2 break-all text-cyan-200">{qrUrl || "No active QR token yet."}</div>
          </div>
        </div>
      </HubCard>
      <HubCard title="Mobile Execution Status" icon={Smartphone}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white/5 p-5"><div className="text-sm text-slate-400">QR Tokens</div><div className="mt-2 text-3xl font-extrabold text-white">{hub.qr.tokens.length}</div></div>
          <div className="rounded-3xl bg-white/5 p-5"><div className="text-sm text-slate-400">Evidence</div><div className="mt-2 text-3xl font-extrabold text-white">{hub.compliance.counts.evidence}</div></div>
          <div className="rounded-3xl bg-white/5 p-5"><div className="text-sm text-slate-400">Field Notes</div><div className="mt-2 text-3xl font-extrabold text-white">{hub.fieldNotes.length}</div></div>
        </div>
        <div className="mt-5 rounded-3xl border border-cyan-400/10 bg-slate-950/60 p-5">
          <div className="text-lg font-extrabold text-white">Public verification preview</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">Public QR visibility follows Blind Hub Settings: basic, standard, or full data levels with scan logging.</p>
        </div>
      </HubCard>
    </div>
  );
}

function CertificateHistoryTab({ hub, onGenerateCertificate }: { hub: any; onGenerateCertificate: () => void }) {
  const readiness = hub.certificate.readiness;
  const latest = hub.certificate.latest;
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <HubCard title="Certificate Readiness" icon={BadgeCheck} action={<Button onClick={onGenerateCertificate} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">{readiness.ready ? "Generate Certificate" : "Generate Draft"}</Button>}>
        <div className="text-center">
          <div className={`mx-auto flex h-40 w-40 items-center justify-center rounded-full border-[12px] ${readiness.ready ? "border-emerald-400 text-emerald-200" : "border-amber-400 text-amber-200"}`}>
            <div><div className="text-4xl font-extrabold">{readiness.percentage}%</div><div className="text-xs font-bold uppercase tracking-[0.2em]">Ready</div></div>
          </div>
          <div className="mt-5">{readiness.ready ? <StatusPill label="Certificate Ready" tone="green" /> : <StatusPill label="Blocked / Draft only" tone="amber" />}</div>
        </div>
        <div className="mt-6 space-y-2">
          {readiness.blockers.map((b: any) => (
            <div key={b.key} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
              <b>{b.label}</b><div className="text-xs text-amber-200/80">{b.tab} · {b.action}</div>
            </div>
          ))}
        </div>
      </HubCard>
      <HubCard title="Certificate Preview & History" icon={FileCheck2}>
        <div className="rounded-3xl bg-white p-6 text-slate-950">
          <div className="flex items-start justify-between">
            <div><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">SBTS Professional</div><h3 className="mt-2 text-2xl font-extrabold">Blind Completion Certificate</h3></div>
            <QrCode className="h-16 w-16 text-slate-950" />
          </div>
          <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
            <SpecRow label="Certificate" value={latest?.certificateNumber || "Draft preview"} />
            <SpecRow label="Blind" value={hub.blind.tag} />
            <SpecRow label="Project" value={hub.project.name} />
            <SpecRow label="Phase" value={hub.blind.phase} />
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 p-4">
            <div className="font-extrabold">Compliance Summary</div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
              <div>Checklist<br/><b>{hub.compliance.counts.completedChecklists}</b></div>
              <div>Torque<br/><b>{hub.compliance.counts.torqueRecords}</b></div>
              <div>Inspection<br/><b>{hub.compliance.counts.inspectionRecords}</b></div>
              <div>Evidence<br/><b>{hub.compliance.counts.evidence}</b></div>
            </div>
          </div>
          <div className="mt-6 text-xs text-slate-500">Hash: {latest?.hash || "Generated after certificate issue"}</div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => window.print()} variant="outline" className="border-cyan-400/20 bg-slate-950 text-white"><Printer className="h-4 w-4" /> Print</Button>
          <Button variant="outline" className="border-cyan-400/20 bg-slate-950 text-white"><Download className="h-4 w-4" /> Download PDF</Button>
        </div>
        <div className="mt-5 space-y-2">
          {hub.history.audit.slice(0, 8).map((event: any) => (
            <div key={event.id} className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
              <b>{event.action}</b> · {event.actorName || "System"} <span className="text-slate-500">· {fmtDate(event.createdAt)}</span>
            </div>
          ))}
        </div>
      </HubCard>
    </div>
  );
}

export default function BlindDetailHub() {
  const [, paramsProject] = useRoute("/projects/:projectId/blinds/:tag/hub");
  const [, paramsArea] = useRoute("/areas/:areaId/projects/:projectId/blinds/:tag/hub");
  const params = paramsProject ?? paramsArea;
  const projectId = params?.projectId ?? "";
  const tag = decodeURIComponent(params?.tag ?? "");
  const [activeTab, setActiveTab] = useState<HubTab>("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hubQuery = trpc.blindHub.detail.useQuery({ projectId, tag }, { enabled: Boolean(projectId && tag), refetchOnWindowFocus: false });
  const generateCertificate = trpc.blindHub.generateCertificate.useMutation({
    onSuccess: () => { toast.success("Certificate package updated."); hubQuery.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const addFieldNote = trpc.blindHub.addFieldNote.useMutation({
    onSuccess: () => { toast.success("Field note saved."); hubQuery.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const createQr = trpc.fieldCompliance.createQrToken.useMutation({
    onSuccess: () => { toast.success("QR token generated."); hubQuery.refetch(); },
    onError: (error) => toast.error(error.message),
  });

  const hub = hubQuery.data as any;
  const visibleTabs = useMemo(() => tabs.filter((tab) => hub?.settings?.[tab.setting] !== false), [hub]);

  if (hubQuery.isLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Blind Detail Hub...</div>;
  }

  if (!hub) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800">
        <h2 className="text-xl font-extrabold">Blind hub record was not found</h2>
        <p className="mt-2 text-sm">Confirm the project ID and blind tag, then try again.</p>
        <Link href="/blinds" className="mt-5 inline-flex rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Back to blinds</Link>
      </div>
    );
  }

  return (
    <div className="-m-4 min-h-screen bg-[radial-gradient(circle_at_top_left,#083344,transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#082f49)] p-4 text-slate-100 sm:-m-6 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-white/5 text-cyan-200 hover:bg-cyan-400/10"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <div className="text-sm font-semibold text-slate-400">Projects / {hub.project.name}</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Blind Detail Hub</h1>
            <div className="mt-1 text-cyan-200">{hub.blind.tag} — {hub.blind.equipment || hub.blind.type}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setSettingsOpen(true)} variant="outline" className="border-cyan-400/20 bg-white/5 text-white hover:bg-cyan-400/10"><KeyRound className="h-4 w-4" /> Hub Settings</Button>
          <Button onClick={() => hubQuery.refetch()} variant="outline" className="border-cyan-400/20 bg-white/5 text-white hover:bg-cyan-400/10"><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button onClick={() => setActiveTab("certificate")} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"><Printer className="h-4 w-4" /> Certificate</Button>
        </div>
      </div>

      <section className="mb-5 rounded-[2rem] border border-cyan-400/20 bg-slate-900/75 p-5 shadow-[0_28px_100px_rgba(8,47,73,0.35)] backdrop-blur">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr_0.45fr]">
          <div>
            <div className="text-6xl font-black tracking-[0.08em] text-cyan-300">{hub.blind.tag}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <StatusPill label={hub.blind.priority || "Normal"} tone={hub.blind.priority === "Critical" ? "red" : hub.blind.priority === "High" ? "amber" : "cyan"} />
              <StatusPill label={hub.blind.phase} tone="green" />
              <StatusPill label={hub.certificate.readiness.ready ? "Certificate Ready" : "Certificate Blocked"} tone={hub.certificate.readiness.ready ? "green" : "amber"} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SpecRow label="Type" value={hub.blind.type} />
            <SpecRow label="Size" value={hub.blind.size} />
            <SpecRow label="Material" value={hub.blind.material} />
            <SpecRow label="Pressure" value={hub.blind.pressureClass || hub.blind.rate} />
            <SpecRow label="Flange" value={hub.blind.flangeType} />
            <SpecRow label="Owner" value={hub.blind.owner} />
          </div>
          <div className="flex items-center justify-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-cyan-400/70 bg-slate-950 text-center">
              <div><div className="text-3xl font-extrabold text-white">{hub.workflow.progress}%</div><div className="text-xs font-bold text-slate-400">Complete</div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center justify-center gap-3 rounded-3xl border px-4 py-4 text-sm font-extrabold transition ${active ? "border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.16)]" : "border-cyan-400/10 bg-slate-900/70 text-slate-400 hover:border-cyan-300/40 hover:text-cyan-100"}`}>
              <Icon className="h-5 w-5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && <OverviewTab hub={hub} setActiveTab={setActiveTab} />}
      {activeTab === "workflow" && <WorkflowTab hub={hub} />}
      {activeTab === "compliance" && <ComplianceTab hub={hub} />}
      {activeTab === "field" && (
        <FieldActionsTab
          hub={hub}
          onAddNote={(note) => addFieldNote.mutate({ projectId, tag, phase: hub.blind.phase, note, source: "web" })}
        />
      )}
      {activeTab === "qr" && <QrMobileTab hub={hub} onGenerateQr={() => createQr.mutate({ projectId, blindTag: tag })} />}
      {activeTab === "certificate" && <CertificateHistoryTab hub={hub} onGenerateCertificate={() => generateCertificate.mutate({ projectId, tag })} />}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto border-cyan-400/20 bg-slate-950 text-white">
          <DialogHeader><DialogTitle>Blind Hub Settings Preview</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(hub.settings).filter(([, value]) => typeof value === "boolean").map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl border border-cyan-400/10 bg-white/5 px-4 py-3">
                <span className="text-sm font-semibold text-slate-300">{key}</span>
                <Badge className={value ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}>{value ? "Enabled" : "Disabled"}</Badge>
              </div>
            ))}
          </div>
          <Link href="/settings/blind-hub" className="mt-4 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-extrabold text-slate-950">Open Settings Control Center</Link>
        </DialogContent>
      </Dialog>
    </div>
  );
}
