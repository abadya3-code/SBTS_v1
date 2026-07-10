import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value || "-"}</div>
    </div>
  );
}

export default function BlindCertificate() {
  const [, params] = useRoute("/certificate/:projectId/:tag");
  const projectId = params?.projectId ?? "";
  const tag = decodeURIComponent(params?.tag ?? "");

  const certSettings = trpc.settings.certificate.get.useQuery(undefined, { enabled: !!projectId });
  const generalSettings = trpc.settings.general.get.useQuery(undefined, { enabled: !!projectId });
  const projectQuery = trpc.projects.detail.useQuery({ id: projectId }, { enabled: !!projectId, refetchOnWindowFocus: false });

  const blind = useMemo(
    () => projectQuery.data?.blinds?.find((b: any) => b.tag === tag),
    [projectQuery.data, tag]
  );
  const projectDetail = projectQuery.data;
  const project = projectDetail?.project;
  const cert = certSettings.data as any;
  const general = generalSettings.data as any;

  const [qrDataUrl, setQrDataUrl] = useState("");

  const qrData = project && blind ? JSON.stringify({
    app: general?.appName || "SBTS",
    version: general?.versionName || "1.0",
    certificateId: `CERT-${projectId}-${tag}`,
    project: { id: projectId, name: project.name },
    blind: { tag: blind.tag, type: blind.type, phase: blind.phase },
  }) : "";

  useEffect(() => {
    let cancelled = false;
    if (!qrData) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(qrData, { width: 144, margin: 1, errorCorrectionLevel: "M" })
      .then(url => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(""); });
    return () => { cancelled = true; };
  }, [qrData]);

  const isLoading = certSettings.isLoading || generalSettings.isLoading || projectQuery.isLoading;
  const loadFailed = projectQuery.isError || certSettings.isError || generalSettings.isError;

  const logoUrl = cert?.logoUrl || general?.companyLogoUrl || general?.appImageUrl || "";
  const showBlindInfo = cert?.showBlindInfo !== 0;
  const showProjectInfo = cert?.showProjectInfo !== 0;
  const showAreaInfo = cert?.showAreaInfo !== 0;
  const showWorkflowLog = cert?.showWorkflowLog !== 0;
  const showExecutionTorque = cert?.showExecutionTorque !== 0;
  const showFinalApprovals = cert?.showFinalApprovals !== 0;
  const showQrCode = cert?.showQrCode !== 0;
  const showLockStatus = cert?.showLockStatus !== 0;
  const statusBadgeText = cert?.statusBadgeText || "APPROVED";
  const lockBadgeText = cert?.lockBadgeText || "LOCKED / FINAL";

  const blindDetail = (projectDetail as any)?.blindDetails?.find?.((bd: any) => bd.blind?.tag === tag);
  const workflowLogs: any[] = blindDetail?.logs || (projectDetail as any)?.logs || [];
  const phaseApprovals: any[] = blindDetail?.phaseTimeline?.filter?.((pt: any) => pt.approved) || [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (loadFailed || !project || !blind || !cert) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 h-6 w-6 text-red-600" />
            <div>
              <h1 className="text-xl font-extrabold text-slate-950">Certificate could not be loaded</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The certificate page did not receive the required project or blind data. Confirm the project exists and that the selected blind tag is still linked to it.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Go back
                </Button>
                <Button type="button" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed right-4 top-4 z-50 flex gap-2 print:hidden">
        <Button type="button" variant="outline" className="bg-white" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => window.print()} className="gap-2 rounded-xl bg-slate-900 text-white shadow-lg hover:bg-slate-700">
          <Printer className="h-4 w-4" /> Print Certificate
        </Button>
      </div>

      <div className="mx-auto min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:px-0 print:py-0">
        <div className="certificate-page mx-auto overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl print:rounded-none print:border-0 print:shadow-none" style={{ maxWidth: "297mm", minHeight: "210mm" }}>
          <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-8 py-6 text-white">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company logo" className="h-12 w-12 object-contain" />
                  ) : (
                    <div className="text-lg font-black">SB</div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">{general?.companyName || cert?.headerCompanyName || "SBTS"}</div>
                  <div className="mt-1 text-2xl font-extrabold">{cert?.certificateTitle || "Blind Installation Certificate"}</div>
                  <div className="mt-1 text-sm text-slate-300">{cert?.headerSubtitle || general?.appName || "Smart Blind Tracking System"}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-1 text-xs font-extrabold text-emerald-200">{statusBadgeText}</div>
                {showLockStatus && <div className="mt-2 text-xs font-bold text-amber-200">{lockBadgeText}</div>}
                <div className="mt-4 text-xs text-slate-300">Certificate ID</div>
                <div className="font-bold">CERT-{projectId}-{blind.tag}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-8 py-6">
            {showBlindInfo && (
              <section>
                <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500">Blind information</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <InfoCell label="Blind tag" value={blind.tag} />
                  <InfoCell label="Type" value={blind.type || "-"} />
                  <InfoCell label="Size" value={blind.size || "-"} />
                  <InfoCell label="Priority" value={blind.priority || "-"} />
                  <InfoCell label="Phase" value={blind.phase || "-"} />
                  <InfoCell label="Owner" value={blind.owner || "-"} />
                  <InfoCell label="Equipment / Line" value={blind.equipment || "-"} />
                  <InfoCell label="Isolation point" value={blind.isolationPoint || "-"} />
                  {showProjectInfo && <InfoCell label="Project" value={project.name || project.id} />}
                  {showAreaInfo && <InfoCell label="Area" value={project.areaName || project.areaCode || "-"} />}
                  <InfoCell label="Location" value={blind.location || "-"} />
                  <InfoCell label="Rate" value={blind.rate || "-"} />
                </div>
              </section>
            )}

            <section className={`grid gap-6 ${showQrCode ? "xl:grid-cols-[1.35fr_0.65fr]" : "grid-cols-1"}`}>
              {showWorkflowLog && (
                <div className="rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <div className="text-sm font-extrabold text-slate-950">Workflow log</div>
                  </div>
                  <div className="overflow-hidden">
                    <table className="w-full border-collapse text-xs">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold">Date</th>
                          <th className="px-4 py-3 text-left font-bold">From</th>
                          <th className="px-4 py-3 text-left font-bold">To</th>
                          <th className="px-4 py-3 text-left font-bold">Worker</th>
                          <th className="px-4 py-3 text-left font-bold">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workflowLogs.length > 0 ? workflowLogs.slice(0, 8).map((log: any, i: number) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-4 py-3">{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "-"}</td>
                            <td className="px-4 py-3">{log.fromPhase || log.previousPhase || "-"}</td>
                            <td className="px-4 py-3">{log.toPhase || log.newPhase || "-"}</td>
                            <td className="px-4 py-3">{log.actorName || log.changedBy || "-"}</td>
                            <td className="px-4 py-3">{log.actorRole || log.role || "-"}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="px-4 py-6 text-center italic text-slate-400">No workflow history recorded.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {showQrCode && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm font-extrabold text-slate-950">Verification QR</div>
                  <div className="mt-4 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR code" className="h-40 w-40" /> : <div className="text-sm text-slate-400">QR unavailable</div>}
                  </div>
                  <p className="mt-4 break-all text-[11px] leading-5 text-slate-500">{qrData}</p>
                </div>
              )}
            </section>

            {showExecutionTorque && (
              <section className="rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="text-sm font-extrabold text-slate-950">Execution & torque</div>
                </div>
                <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
                  <InfoCell label="Torque (PSI)" value={(blind as any).torquePsi || "N/A"} />
                  <InfoCell label="Torque type" value={(blind as any).torqueType || "N/A"} />
                  <InfoCell label="Technician" value={blind.owner || "N/A"} />
                  <InfoCell label="Tool ID" value={(blind as any).toolId || "N/A"} />
                </div>
              </section>
            )}

            {showFinalApprovals && (
              <section className="rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="text-sm font-extrabold text-slate-950">Final approvals</div>
                </div>
                <div className="overflow-hidden">
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold">Approval</th>
                        <th className="px-4 py-3 text-left font-bold">Status</th>
                        <th className="px-4 py-3 text-left font-bold">By</th>
                        <th className="px-4 py-3 text-left font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phaseApprovals.length > 0 ? phaseApprovals.map((approval: any, i: number) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-4 py-3">{approval.phase || approval.approvalType || "-"}</td>
                          <td className="px-4 py-3 font-bold">{approval.approved ? "Approved" : "Pending"}</td>
                          <td className="px-4 py-3">{approval.approverName || approval.actorName || "-"}</td>
                          <td className="px-4 py-3">{approval.approvedAt ? new Date(approval.approvedAt).toLocaleDateString() : "Pending"}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-4 py-6 text-center italic text-slate-400">No approvals recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <footer className="flex items-end justify-between border-t border-slate-200 pt-4 text-[11px] text-slate-500">
              <div>{cert.footerText || "This is a digital certificate generated by SBTS."}</div>
              <div>{general?.versionName || general?.systemVersion || "SBTS"}</div>
              <div>{new Date().toLocaleString("en-SA", { timeZone: "Asia/Riyadh" })}</div>
            </footer>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; background: white !important; }
          @page { size: A4 landscape; margin: 8mm; }
          .certificate-page { max-width: none !important; width: 100% !important; min-height: auto !important; }
        }
      `}</style>
    </>
  );
}
