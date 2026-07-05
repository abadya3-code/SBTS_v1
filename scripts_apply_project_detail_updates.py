from pathlib import Path

path = Path('/home/ubuntu/sbts-professional/client/src/pages/ProjectDetail.tsx')
s = path.read_text()

s = s.replace('import { AlertTriangle, ArrowLeft, ClipboardList, FileDown, Gauge, Layers3, Pencil, Plus, Printer, RefreshCw, Settings2, ShieldAlert, ShieldCheck, Tags, Upload, Workflow, X } from "lucide-react";', 'import { AlertTriangle, ArrowLeft, ClipboardList, Eye, FileDown, Gauge, Layers3, Plus, Printer, RefreshCw, Settings2, ShieldAlert, ShieldCheck, Tags, Upload, Workflow, X } from "lucide-react";')
if 'jspdf' not in s:
    s = s.replace('import { Link, useRoute } from "wouter";\n', 'import { Link, useRoute } from "wouter";\nimport jsPDF from "jspdf";\nimport autoTable from "jspdf-autotable";\n')

s = s.replace('type PhaseOwnerDraft = {\n  phase: BlindPhase;\n  owners: PhaseAssigneeDraft[];\n};', 'type PhaseOwnerDraft = {\n  phase: BlindPhase;\n  phaseColor: string;\n  owners: PhaseAssigneeDraft[];\n};')
s = s.replace('const defaultPhaseOwners: PhaseOwnerDraft[] = phaseOrder.map((phase) => ({ phase, owners: [] }));', 'const defaultPhaseOwners: PhaseOwnerDraft[] = phaseOrder.map((phase) => ({ phase, phaseColor: "#0e7490", owners: [] }));')

# Add PDF helpers after downloadHtml function
if 'function downloadCertificatePdf' not in s:
    marker = '''function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
'''
    helper = marker + '''
function downloadCertificatePdf(project: ExportProject, blinds: ExportBlind[], metrics: ExportMetrics) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const generatedAt = new Date().toLocaleString();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SBTS Unified Certificate Package", 12, 10);
  doc.setFontSize(10);
  doc.text(`${project.id} · ${project.name} · Generated ${generatedAt}`, 12, 17);

  autoTable(doc, {
    startY: 30,
    head: [["Metric", "Planned", "Registered", "High", "Critical", "Inspection Ready", "Progress"]],
    body: [["Project summary", metrics.plannedBlinds, metrics.registeredBlinds, metrics.highPriorityBlinds, metrics.criticalBlinds, metrics.inspectionReadyBlinds, `${project.progress}%`]],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [14, 116, 144] },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [["#", "Blind Tag", "Type / Size", "Phase", "Priority", "Owner", "Isolation", "Slip Gate", "Notes"]],
    body: blinds.map((blind, index) => [
      index + 1,
      `${blind.tag}\n${blind.equipment || "No equipment"}`,
      `${blind.type}\n${blind.size}${blind.rate ? ` · Rate ${blind.rate}` : ""}`,
      blind.phase,
      blind.priority,
      blind.owner,
      blind.isolationPoint || "Not specified",
      blind.type === "Slip Blind" ? `${blind.slipMetalForemanApproved ? "Foreman OK" : "Foreman pending"} / ${blind.slipBlindMerged ? "Merged" : "Not merged"}` : "N/A",
      blind.notes || "",
    ]),
    theme: "striped",
    styles: { fontSize: 7.2, cellPadding: 1.8, overflow: "linebreak" },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 32 }, 2: { cellWidth: 32 }, 8: { cellWidth: 50 } },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Area: ${project.areaCode} · ${project.areaName}`, 12, 202);
    },
  });
  doc.save(`${safeFileName(project.id)}-certificates.pdf`);
}

function downloadTagsPdf(project: ExportProject, blinds: ExportBlind[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const generatedAt = new Date().toLocaleString();
  blinds.forEach((blind, index) => {
    if (index > 0) doc.addPage();
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(1.2);
    doc.roundedRect(12, 12, 186, 260, 4, 4);
    doc.setFillColor(14, 116, 144);
    doc.rect(12, 12, 186, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SBTS BLIND TAG", 18, 23);
    doc.text(blind.priority, 174, 23, { align: "right" });
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(30);
    doc.text(blind.tag, 18, 50);
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    const rows = [
      ["Project", project.id],
      ["Equipment", blind.equipment || "N/A"],
      ["Type / Size", `${blind.type} · ${blind.size}${blind.rate ? ` · Rate ${blind.rate}` : ""}`],
      ["Phase", blind.phase],
      ["Phase Owner", blind.owner],
      ["Isolation", blind.isolationPoint || "N/A"],
      ["Location", blind.location || "N/A"],
    ];
    autoTable(doc, {
      startY: 70,
      body: rows,
      theme: "plain",
      styles: { fontSize: 12, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", textColor: [71, 85, 105], cellWidth: 45 }, 1: { fontStyle: "bold", textColor: [15, 23, 42] } },
    });
    doc.setDrawColor(148, 163, 184);
    doc.roundedRect(50, 154, 110, 62, 4, 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(51, 65, 85);
    doc.text(blind.tag, 105, 187, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${project.areaCode} · Generated ${generatedAt}`, 18, 262);
  });
  if (blinds.length === 0) {
    doc.setFontSize(14);
    doc.text("No blind tags available.", 20, 30);
  }
  doc.save(`${safeFileName(project.id)}-blind-tags.pdf`);
}
'''
    s = s.replace(marker, helper)

# FieldGrid signature and message
s = s.replace('function FieldGrid({ draft, setDraft, lockTag = false }: { draft: BlindDraft; setDraft: (draft: BlindDraft) => void; lockTag?: boolean }) {', 'function FieldGrid({ draft, setDraft, lockTag = false, slipBlindGateRequired = true }: { draft: BlindDraft; setDraft: (draft: BlindDraft) => void; lockTag?: boolean; slipBlindGateRequired?: boolean }) {')
s = s.replace('Slip Blind يحتاج موافقة Foreman Metal وتأكيد دمج الـ slip blind قبل اعتبار السجل جاهزاً لخطوة إصدار الشهادة.', '{slipBlindGateRequired ? "Slip Blind requires Foreman Metal approval and merged confirmation before saving in this project." : "Slip Blind gate is currently tracked but not mandatory because the setting is disabled."}')

# state for slip setting
s = s.replace('  const [settingsDraft, setSettingsDraft] = useState<PhaseOwnerDraft[]>(defaultPhaseOwners);', '  const [settingsDraft, setSettingsDraft] = useState<PhaseOwnerDraft[]>(defaultPhaseOwners);\n  const [slipBlindGateRequiredDraft, setSlipBlindGateRequiredDraft] = useState(true);')

# phase owners default include color + settings flag
s = s.replace('const phaseOwners = useMemo(() => detail?.settings.phaseOwners ?? defaultPhaseOwners.map((owner) => ({ ...owner, projectId: projectId ?? "", updatedAt: null })), [detail?.settings.phaseOwners, projectId]);', 'const phaseOwners = useMemo(() => detail?.settings.phaseOwners ?? defaultPhaseOwners.map((owner) => ({ ...owner, projectId: projectId ?? "", ownerName: "Unassigned", ownerRole: "unassigned", updatedAt: null })), [detail?.settings.phaseOwners, projectId]);\n  const slipBlindGateRequired = detail?.settings.slipBlindGateRequired ?? true;')

# settings success toast
s = s.replace('toast.success("Project phase ownership settings saved.");', 'toast.success("Project settings saved.");')

# openSettings include color and slip setting
s = s.replace('    setSettingsDraft(phaseOwners.map((owner) => ({ phase: owner.phase as BlindPhase, owners: owner.owners ?? [] })));\n    setSettingsOpen(true);', '    setSettingsDraft(phaseOwners.map((owner) => ({ phase: owner.phase as BlindPhase, phaseColor: owner.phaseColor ?? phaseStyles[owner.phase as BlindPhase]?.match(/bg-[^ ]+/)?.[0] ?? "#0e7490", owners: owner.owners ?? [] })));\n    setSlipBlindGateRequiredDraft(slipBlindGateRequired);\n    setSettingsOpen(true);')
# Fix fallback color because phaseStyles not hex
s = s.replace('phaseColor: owner.phaseColor ?? phaseStyles[owner.phase as BlindPhase]?.match(/bg-[^ ]+/)?.[0] ?? "#0e7490"', 'phaseColor: owner.phaseColor ?? "#0e7490"')

# submit settings include slip and color
s = s.replace('settingsMutation.mutate({ projectId, phaseOwners: settingsDraft.map((item) => ({ phase: item.phase, owners: item.owners })) });', 'settingsMutation.mutate({ projectId, slipBlindGateRequired: slipBlindGateRequiredDraft, phaseOwners: settingsDraft.map((item) => ({ phase: item.phase, phaseColor: item.phaseColor, owners: item.owners })) });')

# add validation before add/bulk/update
s = s.replace('    addBlindMutation.mutate({ ...blindDraft, projectId });', '    if (slipBlindGateRequired && blindDraft.type === "Slip Blind" && (!blindDraft.slipMetalForemanApproved || !blindDraft.slipBlindMerged)) {\n      toast.error("Slip Blind requires Foreman Metal approval and merged confirmation while the project setting is active.");\n      return;\n    }\n    addBlindMutation.mutate({ ...blindDraft, projectId });')
s = s.replace('    if (!canImportBulk) {\n      toast.error("Bulk import is limited to users assigned to the preparation phase.");\n      return;\n    }\n    bulkAddMutation.mutate({ projectId, blinds: bulkPreview.parsed });', '    if (!canImportBulk) {\n      toast.error("Bulk import is limited to users assigned to the preparation phase.");\n      return;\n    }\n    if (slipBlindGateRequired && bulkPreview.parsed.some((blind) => blind.type === "Slip Blind" && (!blind.slipMetalForemanApproved || !blind.slipBlindMerged))) {\n      toast.error("Every Slip Blind row must include Foreman Metal approval and merged confirmation while the project setting is active.");\n      return;\n    }\n    bulkAddMutation.mutate({ projectId, blinds: bulkPreview.parsed });')
s = s.replace('    updateBlindMutation.mutate({ ...editingDraft, projectId });', '    if (slipBlindGateRequired && editingDraft.type === "Slip Blind" && (!editingDraft.slipMetalForemanApproved || !editingDraft.slipBlindMerged)) {\n      toast.error("Slip Blind requires Foreman Metal approval and merged confirmation while the project setting is active.");\n      return;\n    }\n    updateBlindMutation.mutate({ ...editingDraft, projectId });')

# export functions PDF
s = s.replace('    const html = buildCertificateHtml(project, blinds as ExportBlind[], metrics);\n    downloadHtml(`${safeFileName(project.id)}-certificates.html`, html);\n    toast.success("Unified certificate package exported as an HTML print file.");', '    downloadCertificatePdf(project, blinds as ExportBlind[], metrics);\n    toast.success("Unified certificate package exported as PDF.");')
s = s.replace('    const html = buildTagsHtml(project, blinds as ExportBlind[]);\n    downloadHtml(`${safeFileName(project.id)}-blind-tags.html`, html);\n    toast.success("Unified blind tags package exported as one HTML file.");', '    downloadTagsPdf(project, blinds as ExportBlind[]);\n    toast.success("Unified blind tags package exported as PDF.");')

# execution brief layout replace block
old = '''              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
                {phaseOrder.map((phase) => {
                  const owner = phaseOwnerByPhase.get(phase);
                  return (
                    <div key={phase} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{phase}</div>
                          <div className="mt-1 flex flex-wrap gap-1 text-xs font-semibold text-slate-500">{owner?.owners?.length ? owner.owners.slice(0, 3).map((assignee) => <span key={assignee.openId} className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">{assignee.name}</span>) : <span>Unassigned</span>}{owner?.owners && owner.owners.length > 3 ? <span>+{owner.owners.length - 3}</span> : null}</div>
                        </div>
                        <div className="text-lg font-extrabold text-slate-950">{metrics.phaseCounts[phase]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>'''
new = '''              <div className="grid gap-2 sm:grid-cols-5 lg:min-w-[640px]">
                {phaseOrder.map((phase) => {
                  const owner = phaseOwnerByPhase.get(phase);
                  const color = owner?.phaseColor ?? "#0e7490";
                  return (
                    <div key={phase} className="rounded-2xl p-3 text-white shadow-sm" style={{ backgroundColor: color }}>
                      <div className="min-h-10 text-[11px] font-extrabold uppercase leading-4 tracking-wide">{phase}</div>
                      <div className="mt-3 text-2xl font-extrabold">{metrics.phaseCounts[phase]}</div>
                    </div>
                  );
                })}
              </div>'''
s = s.replace(old, new)

# project settings copy
s = s.replace('Phase owners</h2>\n                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Each workflow phase can be assigned to one or more signed-in people. Non-authorized users remain in view-only mode.</p>', 'Workflow settings</h2>\n                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Control project workers, phase colors, and the mandatory Slip Blind gate from one settings area.</p>')

# table action details link
s = s.replace('const editable = canEditPhase(blind.phase as BlindPhase);\n                    return (', 'const detailHref = areaId ? `/areas/${areaId}/projects/${project.id}/blinds/${encodeURIComponent(blind.tag)}` : `/projects/${project.id}/blinds/${encodeURIComponent(blind.tag)}`;\n                    return (')
s = s.replace('<TableCell className="text-right"><Button type="button" variant="outline" size="sm" disabled={!editable} onClick={() => openEditBlind({ ...blind, type: normalizeBlindType(blind.type), rate: blind.rate ?? "", equipment: blind.equipment ?? "", location: blind.location ?? "", isolationPoint: blind.isolationPoint ?? "", slipMetalForemanApproved: Boolean(blind.slipMetalForemanApproved), slipBlindMerged: Boolean(blind.slipBlindMerged), notes: blind.notes ?? "" })} className="rounded-xl bg-white"><Pencil className="h-3.5 w-3.5" /> Edit</Button></TableCell>', '<TableCell className="text-right"><Link href={detailHref} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Details</Link></TableCell>')
# remove orphan editable const if still present
s = s.replace('                    const editable = canEditPhase(blind.phase as BlindPhase);\n', '')

# FieldGrid call props
s = s.replace('<FieldGrid draft={blindDraft} setDraft={setBlindDraft} />', '<FieldGrid draft={blindDraft} setDraft={setBlindDraft} slipBlindGateRequired={slipBlindGateRequired} />')
s = s.replace('<FieldGrid draft={editingDraft} setDraft={setEditingDraft} lockTag />', '<FieldGrid draft={editingDraft} setDraft={setEditingDraft} lockTag slipBlindGateRequired={slipBlindGateRequired} />')

# Settings dialog title/desc and add slip block + color input
s = s.replace('<DialogHeader><DialogTitle>Project phase owners</DialogTitle><DialogDescription>Assign one or more signed-in users to each workflow phase. Photos are shown from the account profile when SSO provides them; otherwise initials are used. Owner role is intentionally hidden to avoid accidental permission-key changes.</DialogDescription></DialogHeader>\n          <div className="space-y-3">', '<DialogHeader><DialogTitle>Project workflow settings</DialogTitle><DialogDescription>Assign project workers to phases, set the phase colors used in Execution Brief, and control whether Slip Blind approvals are mandatory.</DialogDescription></DialogHeader>\n          <div className="mb-4 rounded-2xl bg-cyan-50/70 p-4 ring-1 ring-cyan-100">\n            <label className="flex items-start gap-3">\n              <Checkbox checked={slipBlindGateRequiredDraft} disabled={!canManageSettings} onCheckedChange={(checked) => setSlipBlindGateRequiredDraft(checked === true)} />\n              <span><span className="block text-sm font-extrabold text-slate-950">Require Slip Blind Foreman gate</span><span className="mt-1 block text-xs font-bold leading-5 text-slate-600">When active, any Slip Blind must have Foreman Metal approval and merge confirmation before saving.</span></span>\n            </label>\n          </div>\n          <div className="space-y-3">')
s = s.replace('<p className="mt-1 text-xs leading-5 text-slate-600">Only selected people can update this phase. If no one is selected, administrators can still manage the project.</p>\n                    </div>\n                    <Select disabled={!canManageSettings || availableForPhase.length === 0}', '<p className="mt-1 text-xs leading-5 text-slate-600">Only selected workers can update this phase. Specialty configuration belongs here, not inside the work screen.</p>\n                      <label className="mt-3 flex items-center gap-2 text-xs font-extrabold text-slate-600">Phase color\n                        <input type="color" value={owner.phaseColor} disabled={!canManageSettings} onChange={(event) => setSettingsDraft((current) => current.map((item) => item.phase === owner.phase ? { ...item, phaseColor: event.target.value } : item))} className="h-9 w-14 rounded-xl border border-slate-200 bg-white p-1" />\n                      </label>\n                    </div>\n                    <Select disabled={!canManageSettings || availableForPhase.length === 0}')

path.write_text(s)
print('project detail updates applied')
