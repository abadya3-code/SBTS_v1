/*
Design Philosophy: Feature Control Center.
A practical settings surface that controls Blind Detail Hub tabs, modules, certificate readiness rules, and QR privacy.
*/
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, FileCheck2, KeyRound, QrCode, Save, ShieldCheck, SlidersHorizontal, Wrench } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SettingsDraft = Record<string, boolean | string | number | null>;

const sections = [
  {
    title: "Tab Visibility",
    icon: Eye,
    keys: [
      ["showOverviewTab", "Overview"],
      ["showWorkflowTab", "Workflow"],
      ["showComplianceTab", "Compliance"],
      ["showFieldActionsTab", "Field Actions"],
      ["showQrMobileTab", "QR & Mobile"],
      ["showCertificateHistoryTab", "Certificate & History"],
    ],
  },
  {
    title: "Module Toggles",
    icon: Wrench,
    keys: [
      ["enablePtw", "PTW"],
      ["enableLoto", "LOTO"],
      ["enableRiskAssessment", "Risk Assessment"],
      ["enableGasTest", "Gas Test"],
      ["enableTorqueRecords", "Torque Records"],
      ["enableNdeRecords", "NDE Records"],
      ["enableMtrRecords", "MTR Records"],
      ["enableLeakTest", "Leak Test"],
      ["enablePhotoEvidence", "Photo Evidence"],
      ["enableQrPublicView", "QR Public View"],
      ["enableOfflineMobile", "Offline Mobile"],
      ["enableShiftHandover", "Shift Handover"],
      ["enableCertificateHash", "Certificate Hash"],
      ["enableEmailShare", "Email Share"],
    ],
  },
  {
    title: "Readiness Rules",
    icon: ShieldCheck,
    keys: [
      ["requireChecklistBeforeAdvance", "Checklist before phase advance"],
      ["requireTorqueBeforeFinalTight", "Torque before final tight"],
      ["requireInspectionBeforeCertificate", "Inspection before certificate"],
      ["requireEvidenceBeforeCertificate", "Evidence before certificate"],
      ["requirePtwBeforeFieldExecution", "PTW before field execution"],
      ["requireLotoBeforeFieldExecution", "LOTO before field execution"],
      ["requireRiskBeforeFieldExecution", "Risk before field execution"],
      ["requireAllApprovalsBeforeCertificate", "All approvals before certificate"],
    ],
  },
];

function ToggleCard({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-200 hover:bg-cyan-50/30">
      <span className="text-sm font-extrabold text-slate-900">{label}</span>
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
    </label>
  );
}

export default function BlindHubSettings() {
  const settingsQuery = trpc.blindHub.settings.useQuery(undefined, { refetchOnWindowFocus: false });
  const updateSettings = trpc.blindHub.updateSettings.useMutation({
    onSuccess: async () => {
      toast.success("Blind Hub settings saved.");
      await settingsQuery.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const [draft, setDraft] = useState<SettingsDraft>({});

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft(settingsQuery.data as SettingsDraft);
    }
  }, [settingsQuery.data]);

  const setKey = (key: string, value: boolean | string | number | null) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature control center"
        title="Blind Hub Settings"
        description="Control the Blind Detail Hub tabs, field modules, certificate readiness rules, and public QR privacy from one professional settings surface."
        actions={
          <Button
            onClick={() => updateSettings.mutate(draft as any)}
            disabled={updateSettings.isPending || settingsQuery.isLoading}
            className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
          >
            <Save className="h-4 w-4" /> {updateSettings.isPending ? "Saving..." : "Save settings"}
          </Button>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_0.65fr]">
        <div className="space-y-5">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="sbts-card overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
                  <Icon className="h-5 w-5 text-cyan-700" />
                  <h3 className="text-lg font-extrabold text-slate-950">{section.title}</h3>
                </div>
                <div className="grid gap-3 p-5 md:grid-cols-2">
                  {section.keys.map(([key, label]) => (
                    <ToggleCard
                      key={key}
                      label={label}
                      checked={Boolean(draft[key])}
                      onChange={(value) => setKey(key, value)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-5">
          <div className="sbts-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <FileCheck2 className="h-5 w-5 text-cyan-700" />
              <h3 className="text-lg font-extrabold text-slate-950">Certificate Rules</h3>
            </div>
            <div className="space-y-4">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Minimum evidence count</span>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={Number(draft.minEvidenceCount ?? 1)}
                  onChange={event => setKey("minEvidenceCount", Number(event.target.value))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Certificate mode</span>
                <Select value={String(draft.certificateMode ?? "manual")} onValueChange={value => setKey("certificateMode", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual generation</SelectItem>
                    <SelectItem value="auto">Auto-ready mode</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>
          </div>

          <div className="sbts-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <QrCode className="h-5 w-5 text-cyan-700" />
              <h3 className="text-lg font-extrabold text-slate-950">Public QR Rules</h3>
            </div>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Public QR data level</span>
              <Select value={String(draft.publicQrDataLevel ?? "standard")} onValueChange={value => setKey("publicQrDataLevel", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic — tag/status only</SelectItem>
                  <SelectItem value="standard">Standard — phase/compliance</SelectItem>
                  <SelectItem value="full">Full — broad field data</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5 text-sm leading-6 text-cyan-950">
            <div className="mb-2 flex items-center gap-2 font-extrabold">
              <KeyRound className="h-5 w-5" /> Operational note
            </div>
            These settings are system-level defaults in v2.4. Project-level overrides are supported in the API and database and can be exposed as a project settings panel in the next hardening sprint.
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <div className="mb-2 flex items-center gap-2 font-extrabold">
              <SlidersHorizontal className="h-5 w-5" /> Recommended production setup
            </div>
            Keep checklist, torque, inspection, evidence, PTW, LOTO, risk assessment, and all approvals enabled before certificate generation for industrial traceability.
          </div>
        </div>
      </section>
    </div>
  );
}
