import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, RefreshCw, Save, Send, ShieldCheck, Smartphone, UploadCloud, WifiOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DRAFT_KEY = "sbts_v22_offline_field_drafts";
const DEVICE_KEY = "sbts_v22_field_device_id";

type OfflineDraft = {
  draftId: string;
  projectId: string;
  blindTag: string;
  draftType: string;
  notes: string;
  phase: string;
  createdAt: string;
  synced?: boolean;
};

function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = `sbts-device-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

function loadDrafts(): OfflineDraft[] {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveDrafts(drafts: OfflineDraft[]) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}

export default function MobileOfflineCenter() {
  const utils = trpc.useUtils();
  const [deviceId, setDeviceId] = useState("");
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [draftForm, setDraftForm] = useState({
    projectId: "",
    blindTag: "",
    phase: "Broken / Preparation",
    draftType: "field_note",
    notes: "",
  });
  const [handover, setHandover] = useState({
    shiftDate: new Date().toISOString().slice(0, 10),
    shiftName: "Day Shift",
    areaCode: "",
    projectId: "",
    summary: "",
    openRisks: "",
    priorities: "",
    handoverToName: "",
  });

  const summaryQuery = trpc.fieldCompliance.mobileSummary.useQuery({ days: 7 }, { refetchOnWindowFocus: false });
  const handoversQuery = trpc.fieldCompliance.shiftHandovers.useQuery({ limit: 10 }, { refetchOnWindowFocus: false });
  const saveOfflineMutation = trpc.fieldCompliance.saveOfflineDraft.useMutation();
  const submitHandoverMutation = trpc.fieldCompliance.submitShiftHandover.useMutation({
    onSuccess: async () => {
      toast.success("Shift handover submitted.");
      setHandover(current => ({ ...current, summary: "", openRisks: "", priorities: "" }));
      await utils.fieldCompliance.shiftHandovers.invalidate();
      await utils.fieldCompliance.mobileSummary.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    setDeviceId(getDeviceId());
    setDrafts(loadDrafts());
  }, []);

  const queuedDrafts = useMemo(() => drafts.filter(item => !item.synced), [drafts]);

  const addDraft = () => {
    if (!draftForm.notes.trim()) {
      toast.error("Write a note before saving an offline draft.");
      return;
    }
    const draft: OfflineDraft = {
      draftId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId: draftForm.projectId.trim(),
      blindTag: draftForm.blindTag.trim(),
      draftType: draftForm.draftType,
      phase: draftForm.phase,
      notes: draftForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [draft, ...drafts].slice(0, 100);
    setDrafts(next);
    saveDrafts(next);
    setDraftForm(current => ({ ...current, notes: "" }));
    toast.success("Offline draft saved on this device.");
  };

  const syncDraft = async (draft: OfflineDraft) => {
    await saveOfflineMutation.mutateAsync({
      draftId: draft.draftId,
      projectId: draft.projectId || null,
      blindTag: draft.blindTag || null,
      draftType: draft.draftType,
      status: "synced",
      deviceId,
      clientCreatedAt: new Date(draft.createdAt),
      payload: {
        phase: draft.phase,
        notes: draft.notes,
        source: "field_mobile_offline",
      },
    });
    const next = drafts.map(item => item.draftId === draft.draftId ? { ...item, synced: true } : item);
    setDrafts(next);
    saveDrafts(next);
  };

  const syncAll = async () => {
    if (queuedDrafts.length === 0) {
      toast.info("No queued drafts to sync.");
      return;
    }
    try {
      for (const draft of queuedDrafts) {
        await syncDraft(draft);
      }
      await utils.fieldCompliance.mobileSummary.invalidate();
      toast.success(`${queuedDrafts.length} offline draft(s) synced.`);
    } catch (error: any) {
      toast.error(error?.message ?? "Sync failed. Keep drafts on device and retry when connected.");
    }
  };

  const submitHandover = () => {
    if (!handover.summary.trim()) {
      toast.error("Write a handover summary before submitting.");
      return;
    }
    submitHandoverMutation.mutate({
      shiftDate: new Date(handover.shiftDate),
      shiftName: handover.shiftName,
      areaCode: handover.areaCode || null,
      projectId: handover.projectId || null,
      summary: handover.summary,
      openRisks: splitLines(handover.openRisks),
      priorities: splitLines(handover.priorities),
      handoverToName: handover.handoverToName || null,
    });
  };

  const installApp = () => {
    toast.info("Use your browser menu and choose Install app / Add to home screen. The PWA manifest and service worker are enabled in v2.2.");
  };

  const mobileSummary = summaryQuery.data as any;
  const handovers = handoversQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field mobility"
        title="Offline Mobile & Shift Handover"
        description="PWA-ready field workspace for offline draft capture, later synchronization, shift handover, and mobile continuity during plant execution."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="rounded-2xl bg-white" onClick={() => { summaryQuery.refetch(); handoversQuery.refetch(); }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button type="button" className="rounded-2xl bg-slate-950 text-white" onClick={installApp}>
              <Download className="h-4 w-4" /> Install PWA
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-5"><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Device ID</div><div className="mt-2 truncate text-sm font-extrabold text-slate-950">{deviceId || "Loading"}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Local queue</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{queuedDrafts.length}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Server drafts</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{mobileSummary?.offlineDrafts?.total ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Handovers</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{mobileSummary?.handovers?.total ?? 0}</div></CardContent></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold"><WifiOff className="h-5 w-5 text-amber-600" /> Offline draft capture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Project ID</Label><Input value={draftForm.projectId} onChange={e => setDraftForm({ ...draftForm, projectId: e.target.value })} placeholder="PRJ-1041" /></div>
              <div className="space-y-2"><Label>Blind Tag</Label><Input value={draftForm.blindTag} onChange={e => setDraftForm({ ...draftForm, blindTag: e.target.value })} placeholder="BLD-1401" /></div>
              <div className="space-y-2"><Label>Phase</Label><Select value={draftForm.phase} onValueChange={phase => setDraftForm({ ...draftForm, phase })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Broken / Preparation", "Assembly", "Tight & Torque", "Final Tight", "Inspection Ready"].map(phase => <SelectItem key={phase} value={phase}>{phase}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Draft type</Label><Select value={draftForm.draftType} onValueChange={draftType => setDraftForm({ ...draftForm, draftType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["field_note", "safety_observation", "photo_note", "handover_note", "issue_followup"].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Field note</Label><Textarea value={draftForm.notes} onChange={e => setDraftForm({ ...draftForm, notes: e.target.value })} placeholder="Capture what the technician saw in the field. This stays on device until synced." rows={5} /></div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={addDraft} className="rounded-2xl"><Save className="h-4 w-4" /> Save offline</Button>
              <Button type="button" variant="outline" onClick={syncAll} disabled={saveOfflineMutation.isPending} className="rounded-2xl"><UploadCloud className="h-4 w-4" /> Sync queued drafts</Button>
            </div>
            <div className="space-y-3">
              {drafts.slice(0, 6).map(draft => (
                <div key={draft.draftId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3"><div><div className="font-extrabold text-slate-950">{draft.draftType}</div><div className="mt-1 text-xs font-semibold text-slate-500">{draft.projectId || "No project"} · {draft.blindTag || "No blind"} · {draft.phase}</div></div><Badge className={draft.synced ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{draft.synced ? "Synced" : "Queued"}</Badge></div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{draft.notes}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Shift handover</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Shift date</Label><Input type="date" value={handover.shiftDate} onChange={e => setHandover({ ...handover, shiftDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Shift name</Label><Input value={handover.shiftName} onChange={e => setHandover({ ...handover, shiftName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Area code</Label><Input value={handover.areaCode} onChange={e => setHandover({ ...handover, areaCode: e.target.value })} placeholder="SHGP" /></div>
              <div className="space-y-2"><Label>Project ID</Label><Input value={handover.projectId} onChange={e => setHandover({ ...handover, projectId: e.target.value })} placeholder="Optional" /></div>
            </div>
            <div className="space-y-2"><Label>Summary</Label><Textarea rows={5} value={handover.summary} onChange={e => setHandover({ ...handover, summary: e.target.value })} placeholder="What changed this shift? What is blocked? What must the next shift know?" /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Open risks / issues</Label><Textarea rows={4} value={handover.openRisks} onChange={e => setHandover({ ...handover, openRisks: e.target.value })} placeholder="One item per line" /></div>
              <div className="space-y-2"><Label>Next shift priorities</Label><Textarea rows={4} value={handover.priorities} onChange={e => setHandover({ ...handover, priorities: e.target.value })} placeholder="One item per line" /></div>
            </div>
            <div className="space-y-2"><Label>Handover to</Label><Input value={handover.handoverToName} onChange={e => setHandover({ ...handover, handoverToName: e.target.value })} placeholder="Next shift supervisor / team" /></div>
            <Button type="button" onClick={submitHandover} disabled={submitHandoverMutation.isPending} className="rounded-2xl bg-slate-950 text-white"><Send className="h-4 w-4" /> Submit handover</Button>
            <div className="space-y-3">
              {handovers.slice(0, 5).map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3"><div><div className="font-extrabold text-slate-950">{item.shiftName} · {String(item.shiftDate).slice(0, 10)}</div><div className="mt-1 text-xs font-semibold text-slate-500">{item.areaCode || "All areas"} · {item.createdByName || "System"}</div></div><Badge variant="outline">Handover</Badge></div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3"><Smartphone className="mt-1 h-5 w-5 text-cyan-600" /><div><div className="font-extrabold text-slate-950">PWA service worker enabled</div><p className="mt-1 text-sm leading-6 text-slate-500">Core app shell and static assets are cached for faster field access. Data edits still sync through the secure API when connected.</p></div></div>
          <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">v2.2 field mobility</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
